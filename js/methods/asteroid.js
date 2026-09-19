let astStarted=false, astX=0, astY=0, astPhase='streak', craterR=0, astT=0, astSteps=20;


// ---- asteroid: a flaming rock streaking down from upper-left to city centre ----
const astArt=[" @@@ ","@@0@@","@%@@0"," @@@ "];   // chunky rock
function asteroidStreak(ax,ay){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // fiery trail behind (up-left of the rock), fading
  for(let t=1;t<=14;t++){
    const tx=Math.round(ax - t*1.6), ty=Math.round(ay - t*1.2);
    if(ty<0||ty>=ROWS||tx<0||tx>=COLS)continue;
    const spread=Math.max(0,3-Math.floor(t/4));
    for(let dj=-spread;dj<=spread;dj++){
      const c=tx+dj; if(c<0||c>=COLS)continue;
      if(Math.random()<0.75){ setCh(grid,ty,c, (t<5)?["#","*","@"][(Math.random()*3)|0]:[".","'","*"][(Math.random()*3)|0]); setMode(mg,ty,c,'trail'); }
    }
  }
  // the rock itself
  for(let i=0;i<astArt.length;i++){
    for(let j=0;j<astArt[i].length;j++){
      const ch=astArt[i][j]; if(ch===" ")continue;
      const r=Math.round(ay)+i-2, c=Math.round(ax)+j-2;
      setCh(grid,r,c,ch); setMode(mg,r,c,'asteroid');
    }
  }
  return {grid,mg};
}
// expanding fireball + growing crater that eats the whole map
function asteroidImpact(t){
  const grid=blankGrid(ROWS), mg=modeGridFill(ROWS,COLS,'impact');
  const ground=ROWS-1;
  const R=t;                                     // blast radius in columns
  const fbChars=["#","@","%","&","*"];
  // ground-hugging fireball dome centred at cx
  const domeH=Math.min(ground, Math.floor(R*0.7));
  for(let r=ground;r>=ground-domeH;r--){
    const frac=(ground-r)/Math.max(1,domeH);
    const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.15);
    for(let j=-w;j<=w;j++){
      if(Math.abs(j)>w-2&&Math.random()<0.4)continue;
      if(Math.random()<0.12)continue;
      const c=cx+j; if(c<0||c>=COLS)continue;
      setCh(grid,r,c,fbChars[(Math.random()*fbChars.length)|0]);
    }
  }
  // scorched crater line + ejecta
  for(let c=0;c<COLS;c++){
    const d=Math.abs(c-cx);
    if(d<=R){ setCh(grid,ground,c,"\u2588"); }               // charred crater floor
    else if(Math.random()<0.3){ setCh(grid,ground,c,[".",",","_"][(Math.random()*3)|0]); }
  }
  // flung debris / sparks in the sky
  for(let k=0;k<COLS*0.35;k++){
    const c=(Math.random()*COLS)|0, r=1+((Math.random()*(ROWS-4))|0);
    if(Math.abs(c-cx) < R*1.3 && Math.random()<0.5){ setCh(grid,r,c,["'",".","*","\u00b0"][(Math.random()*4)|0]); }
  }
  return {grid,mg};
}


function __m2_loop(){
if(phase==='asteroid'){
    scene.style.textShadow="0 0 12px #ff7a1a";
    if(!astStarted){ astStarted=true; astT=0; astSteps=Math.max(14,Math.floor(COLS/5)); document.body.style.background="#0a0604"; }
    stepRain();
    // linear path from upper-left to city centre at street level
    const sx=Math.floor(COLS*0.10), sy=1, ex=cx, ey=streetRow;
    const f=astT/astSteps;
    astX=Math.round(sx+(ex-sx)*f);
    astY=Math.round(sy+(ey-sy)*f);
    const {grid,mg}=asteroidStreak(astX,astY);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="!!! ASTEROID INBOUND !!!"; sub.style.color="#ff7a1a"; sub.style.textShadow="0 0 8px #ff7a1a";
    astT++;
    if(astT>astSteps){ phase='ast_flash'; loop(); }
    else timer=setTimeout(loop,55);
  }else if(phase==='ast_flash'){
    flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
    document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="";
    stage.classList.add('shake');
    timer=setTimeout(()=>{ flash.style.transition="opacity 1.8s"; flash.style.opacity=0;
      document.body.style.background="#1a0d06"; phase='ast_impact'; craterR=2; loop(); }, 220);
  }else if(phase==='ast_impact'){
    scene.style.textShadow="0 0 14px #ff7a1a";
    const {grid,mg}=asteroidImpact(craterR);
    scene.innerHTML=paint(grid,mg,'impact');
    sub.textContent="WIPED OFF THE MAP"; sub.style.color="#ff9030"; sub.style.textShadow="0 0 8px #ff7a1a";
    craterR+=Math.max(2,Math.floor(COLS/20));
    if(craterR < COLS){ timer=setTimeout(loop,60); }
    else { phase='ast_hold'; loop(); }
  }else if(phase==='ast_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=asteroidImpact(COLS);   // full-map smouldering crater
    scene.innerHTML=paint(grid,mg,'impact');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="nothing left. — press RESET"; sub.style.color="#ff9030"; sub.className="";
    timer=setTimeout(loop,220);
  }
}


function __m2_start(){
       // WHITE -> asteroid
    attackMode='asteroid';
    cmd.style.color="#ffffff"; cmd.style.textShadow="0 0 24px #ffffff";
    astStarted=false; phase='asteroid';
  
}


function __m2_reset(){
  astStarted=false; astPhase='streak'; craterR=0;
}


registerMethod(2, { start: __m2_start, resetFn: __m2_reset, loopFn: __m2_loop, phaseNames: ['asteroid', 'ast_flash', 'ast_impact', 'ast_hold'] });
