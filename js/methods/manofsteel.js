let steelStarted=false, steelT=0, weBeamY=0, weDmg=0, fighters=[], shockRings=[];


// ---- MAN OF STEEL: the Kryptonian World Engine terraforms + super-beings brawl ----
function steelInit(){
  weDmg=0; shockRings=[]; fighters=[];
  // two super-beings that streak around and collide
  for(let i=0;i<2;i++){ fighters.push({ x:cx+(i?20:-20), y:Math.floor(streetRow*0.4), tx:cx, ty:Math.floor(streetRow*0.4), team:i, trail:[] }); }
}
function steelStep(t){
  weDmg=Math.min(cx+2, weDmg+Math.max(1,Math.floor(COLS/44)));   // gravity pulse spreads
  // periodically emit a shock ring from ground zero
  if(t%6===0) shockRings.push({r:1});
  for(const s of shockRings){ s.r+=2; }
  while(shockRings.length && shockRings[0].r>COLS) shockRings.shift();
  // fighters dart to new positions (the brawl), occasionally slamming together at centre
  for(const f of fighters){
    if(Math.random()<0.2){ f.tx=cx+(((Math.random()*COLS*0.7)|0)-Math.floor(COLS*0.35)); f.ty=1+((Math.random()*Math.floor(streetRow*0.7))|0); }
    f.x+=(f.tx-f.x)*0.35; f.y+=(f.ty-f.y)*0.35;
    f.trail.push({x:Math.round(f.x),y:Math.round(f.y)}); if(f.trail.length>6) f.trail.shift();
  }
}
function steelRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // flatten the centre where the gravity beam pounds the ground
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cx-weDmg;c<=cx+weDmg;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.5) ln[c]=" "; } grid[r]=ln.join(""); }
  // rubble + dust at ground zero
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.abs(c-cx)<weDmg){ if(Math.random()<0.4) g[c]=[".",",","_","#"][(Math.random()*4)|0]; } } grid[streetRow]=g.join(""); }

  // expanding shock rings along the ground (gravity pulses)
  for(const s of shockRings){ for(const dir of [-1,1]){ const c=cx+dir*s.r; if(c>=0&&c<COLS){ setCh(grid,streetRow-0,c,dir>0?">":"<"); setMode(mg,streetRow,c,'gravbeam'); setCh(grid,streetRow-1,c,dir>0?")":"("); setMode(mg,streetRow-1,c,'gravbeam'); } } }

  // the World Engine: a huge black Kryptonian rig hovering at top, tripod legs
  const weCx=cx, weTop=1;
  const engine=[
    "    __/####\\__    ",
    "  /##  ()()  ##\\  ",
    " |###  WORLD  ###| ",
    " |### ENGINE  ###| ",
    "  \\##_@@@@@@_##/  ",
    "    \\/ |||| \\/    ",
  ];
  for(let i=0;i<engine.length;i++){ const art=engine[i], r=weTop+i;
    for(let j=0;j<art.length;j++){ const c=weCx+j-Math.floor(art.length/2); if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'worldengine'); } }
  // the wide gravity beam punching down from the engine to the ground
  const beamTop=weTop+engine.length, half=Math.max(3,Math.floor(COLS*0.06));
  for(let r=beamTop;r<=streetRow;r++){ for(let dc=-half;dc<=half;dc++){ const c=cx+dc; if(c<0||c>=COLS)continue;
    const edge=Math.abs(dc)>=half-1; if(edge && Math.random()<0.5)continue; if(Math.random()<0.2)continue;
    setCh(grid,r,c, (Math.random()<0.5?"|":":")); setMode(mg,r,c,'gravbeam'); } }
  // gravity debris floating upward in the beam
  for(let k=0;k<COLS*0.15;k++){ const c=cx+(((Math.random()*half*2)|0)-half), r=beamTop+((Math.random()*(streetRow-beamTop))|0);
    if(c>=0&&c<COLS){ setCh(grid,r,c,["*",".",":","o"][(Math.random()*4)|0]); setMode(mg,r,c,'worldengine'); } }

  // the two brawling super-beings streaking around with motion trails
  for(const f of fighters){
    for(const tr of f.trail){ if(tr.x>=0&&tr.x<COLS&&tr.y>=0&&tr.y<ROWS){ setCh(grid,tr.y,tr.x,(Math.random()<0.5?"*":"'")); setMode(mg,tr.y,tr.x,f.team?'heatvision':'gravbeam'); } }
    const xi=Math.round(f.x), yi=Math.round(f.y);
    if(xi>=0&&xi<COLS&&yi>=0&&yi<ROWS){
      setCh(grid,yi,xi,"O"); setMode(mg,yi,xi,'krypton');
      if(yi+1<ROWS){ setCh(grid,yi+1,xi, f.team?"X":"S"); setMode(mg,yi+1,xi,'krypton'); }  // one wears the S
    }
  }
  // heat-vision clash where they're close
  if(fighters.length===2){ const a=fighters[0],b=fighters[1]; const dist=Math.hypot(a.x-b.x,a.y-b.y);
    if(dist<14){ const steps=Math.max(2,Math.round(dist)); for(let s=0;s<=steps;s++){ const c=Math.round(a.x+(b.x-a.x)*s/steps), r=Math.round(a.y+(b.y-a.y)*s/steps);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.7){ setCh(grid,r,c,(Math.random()<0.5?"=":"~")); setMode(mg,r,c,'heatvision'); } } } }
  return {grid,mg};
}


function __m24_loop(){
if(phase==='steel'){
    scene.style.textShadow="0 0 10px #4a6aff";
    if(!steelStarted){ steelStarted=true; steelT=0; steelInit(); document.body.style.background="#04060e"; }
    stepRain();
    steelStep(steelT);
    const {grid,mg}=steelRender(steelT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent= weDmg<cx*0.5 ? "THE WORLD ENGINE POUNDS METROPOLIS" : "SUPERMAN vs ZOD — THE CITY IS LEVELLED";
    sub.style.color="#7a9aff"; sub.style.textShadow="0 0 8px #c02020";
    steelT++;
    if(!(weDmg>=cx && steelT>55)){ timer=setTimeout(loop,70); }
    else { phase='steel_hold'; loop(); }
  }else if(phase==='steel_hold'){
    stage.classList.remove('shake');
    steelStep(steelT);
    const {grid,mg}=steelRender(steelT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="downtown is gone. — press RESET"; sub.style.color="#7a9aff"; sub.className="";
    steelT++;
    timer=setTimeout(loop,140);
  }
}


function __m24_start(){
      // KRYPTON BLUE -> Man of Steel
    attackMode='steel';
    cmd.style.color="#4a6aff"; cmd.style.textShadow="0 0 22px #c02020";
    steelStarted=false; phase='steel';
  
}


function __m24_reset(){
  steelStarted=false; steelT=0; weBeamY=0; weDmg=0; fighters=[]; shockRings=[];
}


registerMethod(24, { start: __m24_start, resetFn: __m24_reset, loopFn: __m24_loop, phaseNames: ['steel', 'steel_hold'] });
