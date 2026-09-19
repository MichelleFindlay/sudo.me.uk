let volStarted=false, volT=0, volBombs=[], volLava=0, volRise=0;


// ---- VOLCANO: a mountain erupts, raining lava bombs and flooding the city with lava ----
function volcanoRender(t, lavaLevel, bombs, rise){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const vcx=cx;
  if(rise===undefined) rise=1;

  // the volcano cone RISES up out of the ground: current height scales with `rise`
  const coneCx=Math.floor(COLS*0.78);
  const fullH=Math.floor(streetRow*0.7);
  const coneH=Math.max(1, Math.floor(fullH*rise));
  const coneBase=streetRow;
  // push up debris/ground shudder as it emerges
  for(let i=0;i<coneH;i++){
    const r=coneBase-i;
    // width uses the FULL cone profile so the mountain keeps its shape as it grows taller
    const halfW=2+Math.floor((fullH-i)*0.5);
    for(let j=-halfW;j<=halfW;j++){
      const c=coneCx+j; if(c<0||c>=COLS)continue;
      if(i===coneH-1){ setCh(grid,r,c,(Math.random()<0.5?"~":"#")); setMode(mg,r,c,'lava'); } // glowing crater rim at current summit
      else { setCh(grid,r,c,"\u2588"); setMode(mg,r,c,'lava'); }
    }
  }
  // rock/ash kicked up around the base while it's still rising
  if(rise<1){
    for(let k=0;k<COLS*0.15;k++){
      const c=coneCx+(((Math.random()*30)|0)-15), r=streetRow-((Math.random()*3)|0);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["\u00b0",".","'","*"][(Math.random()*4)|0]); setMode(mg,r,c,'lava'); }
    }
  }
  const craterR=coneBase-coneH+1, craterC=coneCx;

  // eruption plume + lava bombs only once the cone has fully risen
  if(rise>=1){
    for(let k=0;k<COLS*0.2;k++){
      const r=Math.max(0,craterR-((Math.random()*10)|0)), c=craterC+(((Math.random()*14)|0)-7);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["#","@","*","\u00b0"][(Math.random()*4)|0]); setMode(mg,r,c,'lava'); }
    }
    for(const b of bombs){
      const r=Math.round(b.y), c=Math.round(b.x);
      if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,"@"); setMode(mg,r,c,'lava'); }
    }
    // lava flooding the streets from the right, rising & spreading left
    const floodRight=COLS-1, floodLeft=Math.max(0, COLS-1-lavaLevel);
    for(let c=floodLeft;c<=floodRight;c++){
      for(let r=0;r<streetRow;r++){ if(grid[r] && grid[r][c] && grid[r][c]!==" " && mg[r][c]!=='lava' && Math.random()<0.5){ let ln=grid[r].split(""); ln[c]=" "; grid[r]=ln.join(""); } }
      const surface=streetRow;
      setCh(grid,surface,c,(Math.random()<0.5?"~":"\u2248")); setMode(mg,surface,c,'lava');
      if(Math.random()<0.4){ setCh(grid,surface-1,c,(Math.random()<0.5?"~":"*")); setMode(mg,surface-1,c,'lava'); }
    }
  }
  return {grid,mg};
}


function __m11_loop(){
if(phase==='volcano'){
    scene.style.textShadow="0 0 10px #ff5a1a";
    if(!volStarted){ volStarted=true; volT=0; volRise=0; volLava=0; volBombs=[];
      for(let i=0;i<Math.max(6,Math.floor(COLS/10));i++){ volBombs.push({ x:Math.floor(COLS*0.78), y:Math.floor(streetRow*0.3), vx:(Math.random()*-3-0.5), vy:-(1+Math.random()*2), g:0.25 }); }
      document.body.style.background="#160604"; }
    stepRain();
    // PHASE 1: the mountain rises out of the ground; PHASE 2: it erupts & floods
    if(volRise<1){ volRise=Math.min(1, volRise+0.06); }
    const risen = volRise>=1;
    if(risen){
      for(const b of volBombs){ b.x+=b.vx; b.y+=b.vy; b.vy+=b.g; if(b.y>=streetRow || b.x<0){ b.x=Math.floor(COLS*0.78); b.y=Math.floor(streetRow*0.3); b.vx=(Math.random()*-3-0.5); b.vy=-(1+Math.random()*2); } }
      volLava=Math.min(COLS, volLava+Math.max(1,Math.floor(COLS/40)));
    }
    const {grid,mg}=volcanoRender(volT, volLava, volBombs, volRise);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');   // ground rumbles as it rises and erupts
    sub.textContent = !risen ? "A VOLCANO RISES FROM THE EARTH…" : (volLava<COLS*0.5 ? "THE VOLCANO ERUPTS!" : "LAVA CONSUMES THE CITY");
    sub.style.color="#ff7a2a"; sub.style.textShadow="0 0 8px #ff2a00";
    volT++;
    if(!(risen && volLava>=COLS && volT>40)){ timer=setTimeout(loop,70); }
    else { phase='volcano_hold'; loop(); }
  }else if(phase==='volcano_hold'){
    stage.classList.remove('shake');
    for(const b of volBombs){ b.x+=b.vx; b.y+=b.vy; b.vy+=b.g; if(b.y>=streetRow||b.x<0){ b.x=Math.floor(COLS*0.78); b.y=Math.floor(streetRow*0.3); b.vx=(Math.random()*-3-0.5); b.vy=-(1+Math.random()*2); } }
    const {grid,mg}=volcanoRender(volT, COLS, volBombs, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="buried in molten rock. — press RESET"; sub.style.color="#ff7a2a"; sub.className="";
    volT++;
    timer=setTimeout(loop,150);
  }
}


function __m11_start(){
      // RED-ORANGE -> volcano
    attackMode='volcano';
    cmd.style.color="#ff5a1a"; cmd.style.textShadow="0 0 22px #ff2a00";
    volStarted=false; phase='volcano';
  
}


function __m11_reset(){
  volStarted=false; volT=0; volBombs=[]; volLava=0; volRise=0;
}


registerMethod(11, { start: __m11_start, resetFn: __m11_reset, loopFn: __m11_loop, phaseNames: ['volcano', 'volcano_hold'] });
