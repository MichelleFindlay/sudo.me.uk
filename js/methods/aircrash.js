let crashStarted=false, crashT=0, planeX=0, planeY=0, crashHit=false, crashFire=0;


// ---- AIR CRASH: an airliner streaks in and slams into the city in a fireball ----
const planeSprite="___/\\___[===]==<>";
function crashRender(px,py,hit,fire){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(!hit){
    // trailing smoke behind the diving plane
    for(let k=1;k<=12;k++){ const tx=Math.round(px-k*1.4), ty=Math.round(py-k*0.7);
      if(ty>=0&&ty<ROWS&&tx>=0&&tx<COLS && Math.random()<0.6){ setCh(grid,ty,tx,(k<5?["#","@","*"]:[".","'"," "])[(Math.random()*(k<5?3:2))|0]||"'"); setMode(mg,ty,tx,'crashfire'); } }
    // the airliner
    for(let j=0;j<planeSprite.length;j++){ const c=Math.round(px)+j, r=Math.round(py);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS&&planeSprite[j]!==" "){ setCh(grid,r,c,planeSprite[j]); setMode(mg,r,c,'crashfire'); } }
  } else {
    // impact fireball at crash site (centre), growing with `fire`
    const ix=cx, R=fire;
    // MIDDLE: fully obliterated within R
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=ix-R;c<=ix+R;c++){ if(c<0||c>=COLS)continue; if(Math.random()<0.7) ln[c]=" "; } grid[r]=ln.join(""); }
    // OUTSKIRTS: blast/shrapnel damage thinning out with distance beyond R
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){
        const d=Math.abs(c-ix);
        if(d>R){ const dmg=Math.max(0, 0.55*(1-(d-R)/(COLS*0.6)));   // fades toward edges
          if(ln[c]!==" " && Math.random()<dmg) ln[c]=(Math.random()<0.4?"#":" "); }
      }
      grid[r]=ln.join(""); }
    const dome=Math.min(streetRow, Math.floor(R*0.9));
    for(let rr=streetRow;rr>=streetRow-dome;rr--){ const frac=(streetRow-rr)/Math.max(1,dome);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
      for(let j=-w;j<=w;j++){ if(Math.abs(j)>w-2&&Math.random()<0.4)continue; if(Math.random()<0.12)continue;
        const c=ix+j; if(c<0||c>=COLS)continue; setCh(grid,rr,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,rr,c,'crashfire'); } }
    // scattered burning debris across the wider blast zone
    for(let k=0;k<COLS*0.25;k++){ const c=ix+(((Math.random()*R*3)|0)-Math.floor(R*1.5)), r=streetRow-((Math.random()*3)|0);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["*","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'crashfire'); } }
  }
  return {grid,mg};
}


function __m13_loop(){
if(phase==='crash'){
    scene.style.textShadow="0 0 8px #e0e6ee";
    if(!crashStarted){ crashStarted=true; crashT=0; planeX=-18; planeY=1; crashHit=false; crashFire=0; document.body.style.background="#080a0e"; }
    stepRain();
    if(!crashHit){
      planeX+=Math.max(2,Math.floor(COLS/20)); planeY+=Math.max(1,Math.floor(streetRow/16));
      if(planeX>=cx || planeY>=streetRow-2){ crashHit=true; }
    } else { crashFire=Math.min(Math.floor(COLS*0.3), crashFire+Math.max(2,Math.floor(COLS/22))); }
    const {grid,mg}=crashRender(planeX,planeY,crashHit,crashFire);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(crashHit) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = !crashHit ? "AN AIRLINER GOES DOWN…" : "IMPACT — THE CITY IS ABLAZE";
    sub.style.color="#e0e6ee"; sub.style.textShadow="0 0 8px #99a";
    crashT++;
    if(!(crashHit && crashFire>=Math.floor(COLS*0.3) && crashT>40)){ timer=setTimeout(loop,70); }
    else { phase='crash_hold'; loop(); }
  }else if(phase==='crash_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=crashRender(planeX,planeY,true,Math.floor(COLS*0.3));
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="wreckage and flames. — press RESET"; sub.style.color="#e0e6ee"; sub.className="";
    crashT++;
    timer=setTimeout(loop,150);
  }
}


function __m13_start(){
      // WHITE-GREY -> air crash
    attackMode='crash';
    cmd.style.color="#e0e6ee"; cmd.style.textShadow="0 0 20px #99a";
    crashStarted=false; phase='crash';
  
}


function __m13_reset(){
  crashStarted=false; crashT=0; planeX=0; planeY=0; crashHit=false; crashFire=0;
}


registerMethod(13, { start: __m13_start, resetFn: __m13_reset, loopFn: __m13_loop, phaseNames: ['crash', 'crash_hold'] });
