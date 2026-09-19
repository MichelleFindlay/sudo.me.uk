let emuStarted=false, emuT=0, emus=[], soldiers=[], emuBullets=[];


// ---- EMU WAR: the army opens fire, the emus don't care, the city loses ----
const emuSprite=[
  "      o>",
  "     /",
  "    /",
  " __/",
  "(   )___",
  " \\_____/",
  "   |  |",
  "   |  |",
  "   |  |",
];
const soldierSprite=[
  " @",
  "/|\\",
  "/ \\",
];
function emuInit(){
  emus=[]; emuBullets=[]; soldiers=[];
  const n=Math.max(3,Math.floor(COLS/22));
  for(let i=0;i<n;i++){ soldiers.push({x:(i+0.5)/n*COLS, fleeing:false}); }
}
function emuStep(t){
  if(t%10===0 && emus.length<12){ const fromLeft=Math.random()<0.5;
    emus.push({x: fromLeft?-8:COLS+8, dir: fromLeft?1:-1, spd:0.8+Math.random()*1.4, ph:Math.random()*6}); }
  for(const e of emus){
    e.x+=e.spd*e.dir; e.ph+=0.5;
    // it tramples whatever it runs through — mutates cityGridArr so the wreckage sticks
    if(cityGridArr.length===ROWS){ const col=Math.round(e.x);
      for(let r=0;r<streetRow;r++){ if(!cityGridArr[r])continue; let ln=cityGridArr[r].split("");
        for(let c=col-2;c<=col+2;c++){ if(c>=0&&c<COLS&&ln[c]!==" "&&Math.random()<0.12) ln[c]=" "; }
        cityGridArr[r]=ln.join(""); }
    }
  }
  emus=emus.filter(e=>e.x>-14 && e.x<COLS+14);
  // the army opens fire for a while, then — as history records — gives up and retreats
  if(t>50){ for(const s of soldiers) s.fleeing=true; }
  for(const s of soldiers){
    if(s.fleeing){ s.x += (s.x<COLS/2 ? -1.6 : 1.6); }
    else if(t%6===0 && emus.length){
      let nearest=emus[0]; for(const e of emus){ if(Math.abs(e.x-s.x)<Math.abs(nearest.x-s.x)) nearest=e; }
      emuBullets.push({x:s.x, dir: nearest.x>s.x?1:-1});
    }
  }
  soldiers=soldiers.filter(s=>s.x>-4 && s.x<COLS+4);
  for(const b of emuBullets) b.x+=b.dir*3;
  emuBullets=emuBullets.filter(b=>b.x>-2 && b.x<COLS+2);
}
function emuRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // tracer fire that never actually connects with anything
  const fireRow=streetRow-2;
  for(const b of emuBullets){ const c=Math.round(b.x); if(c>=0&&c<COLS){ setCh(grid,fireRow,c,"-"); setMode(mg,fireRow,c,'warfire'); } }
  // the doomed defenders
  for(const s of soldiers){ const xi=Math.round(s.x), top=streetRow-soldierSprite.length+1;
    for(let i=0;i<soldierSprite.length;i++){ const art=soldierSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'war'); } } }
  // the unstoppable emus
  for(const e of emus){ const xi=Math.round(e.x); const bob=(Math.sin(e.ph)>0)?0:1; const top=streetRow-emuSprite.length+1-bob;
    for(let i=0;i<emuSprite.length;i++){ let art=emuSprite[i]; if(e.dir<0) art=art.split("").reverse().join("");
      for(let j=0;j<art.length;j++){ const c=xi+j, r=top+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'emu'); } } }
  return {grid,mg};
}


function __m38_loop(){
if(phase==='emu'){
    scene.style.textShadow="0 0 8px #c89050";
    if(!emuStarted){ emuStarted=true; emuT=0; emuInit(); document.body.style.background="#100c04"; }
    emuStep(emuT);
    const {grid,mg}=emuRender();
    scene.innerHTML=paint(grid,mg,'city');
    if(emus.length>2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= emuT<50 ? "THE ARMY OPENS FIRE — THE EMUS DO NOT CARE" : "THE TROOPS RETREAT — THE EMUS HAVE WON";
    sub.style.color="#c89050"; sub.style.textShadow="0 0 8px #6a4020";
    emuT++;
    if(emuT<85){ timer=setTimeout(loop,70); }
    else { phase='emu_hold'; loop(); }
  }else if(phase==='emu_hold'){
    stage.classList.remove('shake');
    emuStep(emuT);
    const {grid,mg}=emuRender();
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Emus: 1, City: 0. — press RESET"; sub.style.color="#c89050"; sub.className="";
    emuT++;
    timer=setTimeout(loop,140);
  }
}


function __m38_start(){
      // OUTBACK BROWN -> Emu War
    attackMode='emu';
    cmd.style.color="#c89050"; cmd.style.textShadow="0 0 20px #6a4020";
    emuStarted=false; phase='emu';
  
}


function __m38_reset(){
  emuStarted=false; emuT=0; emus=[]; soldiers=[]; emuBullets=[];
}


registerMethod(38, { start: __m38_start, resetFn: __m38_reset, loopFn: __m38_loop, phaseNames: ['emu', 'emu_hold'] });
