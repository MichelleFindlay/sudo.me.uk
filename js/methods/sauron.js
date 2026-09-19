let saurStarted=false, saurT=0, saurRise=0, orcs=[], saurDmg=0;


// ---- SAURON: a great dark tower rises with the flaming Eye atop, orcs overrun the city ----
const orcBodies=["oYo","\\o/","oTo","|o|","oV o".slice(0,3)];
function sauronInit(){
  orcs=[]; saurDmg=0;
  const n=Math.floor(COLS*0.5);
  for(let i=0;i<n;i++){
    orcs.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5,
      body:orcBodies[(Math.random()*orcBodies.length)|0], ph:Math.random()*6 });
  }
}
function sauronStep(t){
  for(const o of orcs){ o.x+=o.spd*o.dir; o.ph+=0.5; if(o.x<0)o.x=COLS; if(o.x>COLS)o.x=0; if(Math.random()<0.02)o.dir*=-1; }
  if(t%3===0 && orcs.length<COLS*0.9){ orcs.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5, body:orcBodies[(Math.random()*orcBodies.length)|0], ph:Math.random()*6 }); }
  saurDmg=Math.min(COLS, saurDmg+(t%2===0?1:0));
}
function sauronRender(t, rise){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const towerCx=Math.floor(COLS*0.5);

  // the dark tower RISES from the ground, centred, growing to near full height
  const fullH=Math.floor(streetRow*0.95);
  const towerH=Math.max(1, Math.floor(fullH*rise));
  const eyeReserve=3;                                    // top rows for the Eye
  for(let i=0;i<towerH;i++){
    const r=streetRow-i;
    // tapering spire: wide base, narrow top
    const frac=i/fullH;
    const halfW=Math.max(1, Math.floor((1-frac)*Math.floor(COLS*0.06))+1);
    for(let j=-halfW;j<=halfW;j++){
      const c=towerCx+j; if(c<0||c>=COLS)continue;
      const ch = (Math.abs(j)===halfW) ? (j<0?"/":"\\") : (i%3===0?"H":"#");
      setCh(grid,r,c,ch); setMode(mg,r,c,'tower');
    }
    // jagged crown battlements near the top
    if(i>=towerH-2){ setCh(grid,r,towerCx-halfW-1,"V"); setCh(grid,r,towerCx+halfW+1,"V"); setMode(mg,r,towerCx-halfW-1,'tower'); setMode(mg,r,towerCx+halfW+1,'tower'); }
  }

  // the flaming Eye atop the fully-risen tower
  if(rise>=1){
    const er=streetRow-towerH-1;
    const eye=["( @ )","(@0@)","( I )"];
    // flicker: iris chars vary
    for(let i=0;i<eye.length;i++){
      const r=er+i; if(r<0)continue;
      const art=eye[i], sc=towerCx-2;
      for(let j=0;j<art.length;j++){ const c=sc+j; if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'eye'); }
    }
    // searchlight glow flickering off the eye
    for(let k=0;k<COLS*0.08;k++){ const c=towerCx+(((Math.random()*20)|0)-10), r=Math.max(0,er-((Math.random()*3)|0)); if(c>=0&&c<COLS){ setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]); setMode(mg,r,c,'eye'); } }
  }

  // orcs swarm the streets, tearing down buildings as they spread (once tower is up)
  if(rise>=1){
    // overrun buildings across the swarm's spread
    for(let r=0;r<streetRow;r++){
      let line=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){
        if(Math.abs(c-towerCx) > COLS/2 - saurDmg && line[c]!==" " && mg[r][c]!=='tower' && Math.random()<0.3) line[c]=" ";
      }
      grid[r]=line.join("");
    }
    const br=streetRow-1;
    for(const o of orcs){
      const xi=Math.round(o.x); if(xi<1||xi>=COLS-1)continue;
      const bob=(Math.sin(o.ph)>0)?0:1;
      for(let j=-1;j<=1;j++){ const c=xi+j; setCh(grid,br-bob,c,o.body[j+1]); setMode(mg,br-bob,c,'orc'); }
      // raised spear
      setCh(grid,br-1-bob,xi,(Math.random()<0.5?"|":"Y")); setMode(mg,br-1-bob,xi,'orc');
      setCh(grid,br+1-bob,xi,(Math.random()<0.5?"/":"\\")); setMode(mg,br+1-bob,xi,'orc');
    }
  } else {
    // ground rumbles as the tower emerges
    for(let k=0;k<COLS*0.12;k++){ const c=towerCx+(((Math.random()*30)|0)-15), r=streetRow-((Math.random()*3)|0); if(c>=0&&c<COLS){ setCh(grid,r,c,["'",".","^"][(Math.random()*3)|0]); setMode(mg,r,c,'tower'); } }
  }
  return {grid,mg};
}


function __m17_loop(){
if(phase==='sauron'){
    scene.style.textShadow="0 0 10px #ff3a1a";
    if(!saurStarted){ saurStarted=true; saurT=0; saurRise=0; sauronInit(); document.body.style.background="#0e0402"; }
    stepRain();
    // PHASE 1: the dark tower rises; PHASE 2: the Eye opens & orcs swarm
    if(saurRise<1){ saurRise=Math.min(1, saurRise+0.05); }
    const risen=saurRise>=1;
    if(risen) sauronStep(saurT);
    const {grid,mg}=sauronRender(saurT, saurRise);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent = !risen ? "A DARK TOWER RISES…" : (saurDmg<cx ? "THE EYE OPENS — ORCS POUR IN" : "THE CITY FALLS TO MORDOR");
    sub.style.color="#ff6a3a"; sub.style.textShadow="0 0 8px #b01000";
    saurT++;
    if(!(risen && saurDmg>=COLS*0.6 && saurT>55)){ timer=setTimeout(loop,80); }
    else { phase='sauron_hold'; loop(); }
  }else if(phase==='sauron_hold'){
    stage.classList.remove('shake');
    sauronStep(saurT);
    const {grid,mg}=sauronRender(saurT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="one does not simply survive. — press RESET"; sub.style.color="#ff6a3a"; sub.className="";
    saurT++;
    timer=setTimeout(loop,150);
  }
}


function __m17_start(){
      // FIERY RED -> Sauron
    attackMode='sauron';
    cmd.style.color="#ff3a1a"; cmd.style.textShadow="0 0 22px #b01000";
    saurStarted=false; phase='sauron';
  
}


function __m17_reset(){
  saurStarted=false; saurT=0; saurRise=0; orcs=[]; saurDmg=0;
}


registerMethod(17, { start: __m17_start, resetFn: __m17_reset, loopFn: __m17_loop, phaseNames: ['sauron', 'sauron_hold'] });
