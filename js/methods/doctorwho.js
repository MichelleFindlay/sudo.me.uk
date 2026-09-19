let dwStarted=false, dwT=0, dwEnemies=[], dwTardisAt=-1;

const tardisSprite=[
  " [*] ",
  "|POL|",
  "|_ _|",
  "|o|o|",
  "|_|_|"
];

// ---- DOCTOR WHO: an array of classic baddies swarms the city, until the TARDIS
// arrives and the Doctor steps out to deal with them ----
function doctorwhoInit(){
  dwEnemies=[];
  const kinds=['dalek','cyberman','angel'];
  const n=Math.max(10,Math.floor(COLS*0.15));
  for(let i=0;i<n;i++){
    dwEnemies.push({
      x: 2+Math.random()*Math.max(1,COLS-4),
      dir: Math.random()<0.5?1:-1,
      kind: kinds[(Math.random()*kinds.length)|0],
      alive: true
    });
  }
  dwTardisAt=0;   // starts materializing the moment the scene opens
}
function doctorwhoZap(col){
  if(cityGridArr.length!==ROWS) return;
  for(let r=Math.max(0,streetRow-3);r<streetRow;r++){
    let ln=cityGridArr[r].split("");
    for(let c=col-1;c<=col+1;c++){ if(c>=0&&c<COLS&&Math.random()<0.4) ln[c]=" "; }
    cityGridArr[r]=ln.join("");
  }
}
const DW_TARDIS_MATERIALIZE_FRAMES=20;
// steps the fight one frame; returns true once every baddie has been dealt with.
// the baddies swarm freely at first — no one is fighting back yet — until the
// TARDIS finishes materializing; only then does the sonic screwdriver's sweep
// start clearing them, in timed bursts, with a hard cap so a long tail of
// unlucky rolls can never stall the animation indefinitely.
function doctorwhoStep(t){
  for(const e of dwEnemies){
    if(!e.alive) continue;
    e.x=Math.max(0,Math.min(COLS-1,e.x+e.dir*0.15));
    if(Math.random()<0.03) doctorwhoZap(Math.round(e.x));
  }
  const arrived = dwTardisAt>=0 && (t-dwTardisAt)>=DW_TARDIS_MATERIALIZE_FRAMES;
  if(arrived){
    if(t>100){ for(const e of dwEnemies) e.alive=false; }
    else if(t%12===0){ for(const e of dwEnemies){ if(e.alive && Math.random()<0.4) e.alive=false; } }
  }
  return dwEnemies.every(e=>!e.alive);
}
// the TARDIS flickers into existence cell-by-cell over ~20 frames, then holds solid —
// a cheap but recognisable stand-in for a dematerialization effect in a character grid
function doctorwhoRenderTardis(grid, mg, t){
  if(dwTardisAt<0) return;
  const progress=Math.min(1,(t-dwTardisAt)/20);
  const left=Math.min(COLS-tardisSprite[0].length-1, cx+6);
  const top=streetRow-tardisSprite.length;
  for(let i=0;i<tardisSprite.length;i++){
    const row=tardisSprite[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      if(progress>=1 || Math.random()<progress){ setCh(grid,r,c,ch); setMode(mg,r,c,'tardis'); }
    }
  }
  if(progress<1){                                  // dust motes swirling around it while it forms
    for(let k=0;k<4;k++){
      const c=left-1+((Math.random()*(tardisSprite[0].length+2))|0);
      const r=top+((Math.random()*tardisSprite.length)|0);
      if(c<0||c>=COLS||r<0||r>=ROWS||Math.random()<0.5) continue;
      setCh(grid,r,c,'*'); setMode(mg,r,c,'tardismaterialize');
    }
  }
}
function doctorwhoRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const r=streetRow-1;
  for(const e of dwEnemies){
    if(!e.alive) continue;
    const c=Math.round(e.x);
    if(c<0||c>=COLS) continue;
    const ch = e.kind==='dalek' ? 'D' : (e.kind==='cyberman' ? 'C' : 'A');
    setCh(grid,r,c,ch); setMode(mg,r,c,'who');
  }
  const arrived = dwTardisAt>=0 && (t-dwTardisAt)>=DW_TARDIS_MATERIALIZE_FRAMES;
  if(arrived){
    setCh(grid,r,cx,'W'); setMode(mg,r,cx,'whodoctor');          // the Doctor, out and holding the line
    if(t%12<3){                                                   // the sonic screwdriver's sweep, flashing
      const radius=Math.max(8,Math.floor(COLS*0.2));
      for(let c=cx-radius;c<=cx+radius;c++){
        if(c<0||c>=COLS||Math.random()<0.5) continue;
        setCh(grid,r-1,c,'*'); setMode(mg,r-1,c,'whobeam');
      }
    }
  }
  doctorwhoRenderTardis(grid, mg, t);
  return {grid,mg};
}


function __m66_loop(){
if(phase==='who'){
    scene.style.textShadow="0 0 10px #3a6ea8";
    if(!dwStarted){ dwStarted=true; dwT=0; doctorwhoInit(); document.body.style.background="#0a1420"; }
    const allDefeated=doctorwhoStep(dwT);
    const {grid,mg}=doctorwhoRender(dwT);
    scene.innerHTML=paint(grid,mg,'city');
    const arrived = dwTardisAt>=0 && (dwT-dwTardisAt)>=DW_TARDIS_MATERIALIZE_FRAMES;
    stage.classList.toggle('shake', arrived && !allDefeated);
    sub.textContent = arrived
      ? "EXTERMINATE! DELETE! DO NOT BLINK!"
      : "THE BADDIES SWARM THE CITY… BUT SOMETHING IS MATERIALIZING";
    sub.style.color="#3a9ad0"; sub.style.textShadow="0 0 8px #1a5a8a";
    dwT++;
    if(!(allDefeated && dwT>30)){ timer=setTimeout(loop,80); }
    else { phase='who_hold'; loop(); }
  }else if(phase==='who_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=doctorwhoRender(dwT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the baddies are gone. the Doctor tips their hat and steps into the TARDIS. — press RESET"; sub.style.color="#3a9ad0"; sub.className="";
    dwT++;
    timer=setTimeout(loop,150);
  }
}


function __m66_start(){
      // TARDIS BLUE -> Doctor Who
    attackMode='who';
    cmd.style.color="#3a9ad0"; cmd.style.textShadow="0 0 20px #1a5a8a";
    dwStarted=false; phase='who';

}


function __m66_reset(){
  dwStarted=false; dwT=0; dwEnemies=[]; dwTardisAt=-1;
}


registerMethod(66, { start: __m66_start, resetFn: __m66_reset, loopFn: __m66_loop, phaseNames: ['who', 'who_hold'] });
