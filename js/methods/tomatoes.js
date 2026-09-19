let tomatoStarted=false, tomatoT=0, tomatoes=[], tomatoPeople=[], tomatoSoldiers=[], tomatoBullets=[], tomatoDmg=0;


// ---- TOMATOES: Attack of the Killer Tomatoes — they roll in, and nothing stops them ----
const tomatoSprite=[
  "  ,^.  ",
  " @@@@@ ",
  "@@@@@@@",
  "@@@@@@@",
  " @@@@@ ",
];
const tomatoPersonSprite=[" o ","/|\\","/ \\"];
const tomatoSoldierSprite=[" @","/|\\","/ \\"];
function tomatoPeopleInit(){
  tomatoPeople=[];
  const n=Math.max(8, Math.floor(COLS/14));
  for(let i=0;i<n;i++){ tomatoPeople.push({x:(i+0.5)/n*COLS + (Math.random()*4-2), state:'idle'}); }
}
function tomatoSoldiersInit(){
  tomatoSoldiers=[];
  const n=Math.max(3, Math.floor(COLS/24));
  for(let i=0;i<n;i++){ tomatoSoldiers.push({x:(i+0.5)/n*COLS}); }
}
function tomatoSpawn(){
  const fromLeft=Math.random()<0.5;
  tomatoes.push({ x: fromLeft?-8:COLS+8, dir: fromLeft?1:-1, spd:0.6+Math.random()*0.9, ph:Math.random()*6 });
}
function tomatoStep(t){
  if(t%14===0 && tomatoes.length<6) tomatoSpawn();
  for(const tm of tomatoes){
    tm.x+=tm.spd*tm.dir; tm.ph+=0.4;
    const xi=Math.round(tm.x);
    // squashes any idle bystander it rolls over
    for(const p of tomatoPeople){ if(p.state==='idle' && Math.abs(p.x-xi)<4){ p.state='squashed'; } }
    // crushes buildings as it rolls through — mutates cityGridArr, a contained swath around it
    if(cityGridArr.length===ROWS){
      for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
        for(let c=xi-3;c<=xi+3;c++){ if(c>=0&&c<COLS&&ln[c]!==" "&&Math.random()<0.1) ln[c]=" "; }
        cityGridArr[r]=ln.join(""); }
    }
  }
  tomatoes=tomatoes.filter(tm=>tm.x>-12 && tm.x<COLS+12);
  // the soldiers open fire — it does absolutely nothing
  for(const s of tomatoSoldiers){ if(t%7===0 && tomatoes.length){
    let nearest=tomatoes[0]; for(const tm of tomatoes){ if(Math.abs(tm.x-s.x)<Math.abs(nearest.x-s.x)) nearest=tm; }
    tomatoBullets.push({x:s.x, dir: nearest.x>s.x?1:-1});
  } }
  for(const b of tomatoBullets) b.x+=b.dir*3;
  tomatoBullets=tomatoBullets.filter(b=>b.x>-2 && b.x<COLS+2);
  tomatoDmg = tomatoPeople.filter(p=>p.state==='squashed').length;
}
function tomatoRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const fireRow=streetRow-2;
  for(const b of tomatoBullets){ const c=Math.round(b.x); if(c>=0&&c<COLS){ setCh(grid,fireRow,c,"-"); setMode(mg,fireRow,c,'warfire'); } }
  for(const s of tomatoSoldiers){ const xi=Math.round(s.x), top=streetRow-tomatoSoldierSprite.length+1;
    for(let i=0;i<tomatoSoldierSprite.length;i++){ const art=tomatoSoldierSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j-1;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'war'); } } }
  for(const p of tomatoPeople){
    if(p.state==='squashed'){ const c=Math.round(p.x); if(c>=0&&c<COLS){ setCh(grid,streetRow,c, Math.random()<0.5?"@":"#"); setMode(mg,streetRow,c,'tomatosplat'); } continue; }
    const spr=tomatoPersonSprite, top=streetRow-spr.length+1, xi=Math.round(p.x);
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j-1;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'rubberperson'); } } }
  for(const tm of tomatoes){
    const spr=tomatoSprite, bob=(Math.sin(tm.ph)>0)?0:1, top=streetRow-spr.length+1-bob, xi=Math.round(tm.x);
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j-3;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'tomato'); } }
  }
  return {grid,mg};
}


function __m62_loop(){
if(phase==='tomato'){
    scene.style.textShadow="0 0 10px #e0201a";
    if(!tomatoStarted){ tomatoStarted=true; tomatoT=0; tomatoes=[]; tomatoBullets=[]; tomatoPeopleInit(); tomatoSoldiersInit(); tomatoDmg=0;
      if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
      document.body.style.background="#0e0805"; }
    tomatoStep(tomatoT);
    const {grid,mg}=tomatoRender();
    scene.innerHTML=paint(grid,mg,'city');
    if(tomatoes.length>1) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = tomatoT<20 ? "ATTACK OF THE KILLER TOMATOES" : (tomatoDmg<tomatoPeople.length*0.5 ? "THEY JUST KEEP ROLLING IN" : "GUNFIRE DOES NOTHING — THEY'RE TOMATOES");
    sub.style.color="#e0201a"; sub.style.textShadow="0 0 8px #2a6a1a";
    tomatoT++;
    if(!(tomatoDmg>=tomatoPeople.length*0.8 && tomatoT>70)){ timer=setTimeout(loop,80); }
    else { phase='tomato_hold'; loop(); }
  }else if(phase==='tomato_hold'){
    stage.classList.remove('shake');
    tomatoStep(tomatoT);
    const {grid,mg}=tomatoRender();
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the streets run red. send... more tomatoes. — press RESET"; sub.style.color="#e0201a"; sub.className="";
    tomatoT++;
    timer=setTimeout(loop,150);
  }
}


function __m62_start(){
      // TOMATO RED -> Tomatoes
    attackMode='tomato';
    cmd.style.color="#e0201a"; cmd.style.textShadow="0 0 20px #2a6a1a";
    tomatoStarted=false; phase='tomato';
  
}


function __m62_reset(){
  tomatoStarted=false; tomatoT=0; tomatoes=[]; tomatoPeople=[]; tomatoSoldiers=[]; tomatoBullets=[]; tomatoDmg=0;
}


registerMethod(62, { start: __m62_start, resetFn: __m62_reset, loopFn: __m62_loop, phaseNames: ['tomato', 'tomato_hold'] });
