let sunStarted=false, sunT=0;


// ---- the Sun: red giant swells over the horizon and scorches Earth to nothing ----
// t grows 0..1 (approx). The sun is a filled disc rising from bottom, radius growing to engulf all.
function sunRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const sunCh=["@","#","%","&"];

  // sun disc: centre below the horizon early, rising and swelling
  const maxR=Math.hypot(COLS, ROWS);                 // enough to cover screen
  const R=Math.max(3, t*maxR*1.05);
  const scy=streetRow + Math.floor(ROWS*0.9) - Math.floor(t*ROWS*1.4); // centre rises over time
  const scx=cx;
  const aspect=0.55;                                  // chars are taller than wide -> squash vertically

  // heat haze: as the sun grows, scorch the city (progressively clear + char the ground)
  const scorchFrac=Math.min(1, t*1.6);
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      if(line[c]!==" " && Math.random()<scorchFrac*0.6){ line[c]=" "; }  // buildings burn away
    }
    grid[r]=line.join("");
  }
  if(scorchFrac>0.2){
    let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){ g[c]=(Math.random()<0.5?"^":"~"); setMode(mg,streetRow,c,'scorch'); }
    grid[streetRow]=g.join("");
    for(let r=streetRow+1;r<ROWS;r++){ // underground bakes to charred rock
      let gl=grid[r].split("");
      for(let c=0;c<COLS;c++){ if(Math.random()<scorchFrac*0.5) gl[c]="\u2588"; }
      grid[r]=gl.join(""); for(let c=0;c<COLS;c++) if(grid[r][c]==="\u2588") setMode(mg,r,c,'scorch');
    }
  }

  // draw the sun disc (filled, roiling)
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const dx=(c-scx), dy=(r-scy)/aspect;
      const dist=Math.hypot(dx,dy);
      if(dist<=R){
        // surface texture: brighter core, mottled edge
        let ch;
        const edge=(dist>R-3);
        if(edge && Math.random()<0.5) continue;        // fuzzy limb
        ch = sunCh[(Math.random()*sunCh.length)|0];
        setCh(grid,r,c,ch); setMode(mg,r,c,'sun');
      }
    }
  }
  // solar flares / prominences licking off the limb
  for(let k=0;k<COLS*0.4;k++){
    const ang=Math.random()*Math.PI*2;
    const rr=R+ (Math.random()*4);
    const c=Math.round(scx+Math.cos(ang)*rr);
    const r=Math.round(scy+Math.sin(ang)*rr*aspect);
    if(r>=0&&r<ROWS&&c>=0&&c<COLS && (grid[r][c]===" ")){
      setCh(grid,r,c,["*","\u00b0",".","'"][(Math.random()*4)|0]); setMode(mg,r,c,'sun');
    }
  }
  return {grid,mg};
}


function __m5_loop(){
if(phase==='sun'){
    scene.style.textShadow="0 0 14px #ff6a00";
    if(!sunStarted){ sunStarted=true; sunT=0; document.body.style.background="#0a0400"; }
    const t=sunT/70;                                  // ~70 frames to fully engulf
    const {grid,mg}=sunRender(t);
    scene.innerHTML=paint(grid,mg,'city');
    // background reddens then whitens as the sun swells
    document.body.style.background = t<0.6 ? "#1a0600" : (t<0.9?"#3a1400":"#e8c060");
    if(t>0.4) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = t<0.5 ? "THE SUN IS DYING — IT SWELLS" : "HEAT DEATH — THE EARTH IS CONSUMED";
    sub.style.color="#ffd000"; sub.style.textShadow="0 0 10px #ff6a00";
    sunT++;
    if(t<1.05){ timer=setTimeout(loop,80); }
    else { phase='sun_hold'; loop(); }
  }else if(phase==='sun_hold'){
    stage.classList.remove('shake');
    // screen fully swallowed by the sun's surface, roiling
    const {grid,mg}=sunRender(1.15);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#e8c060";
    cmd.textContent="$ _"; cmd.style.color="#3a1400"; cmd.style.textShadow="0 0 14px #ff8c00"; cmd.classList.remove('flametext');
    sub.textContent="the Earth is gone. — press RESET"; sub.style.color="#5a1400"; sub.className="";
    timer=setTimeout(loop,140);
  }
}


function __m5_start(){
       // FLAME -> the Sun / heat death
    attackMode='sun';
    cmd.classList.add('flametext');
    sunStarted=false; phase='sun';
  
}


function __m5_reset(){
  sunStarted=false; sunT=0; cmd.classList.remove('flametext');
}


registerMethod(5, { start: __m5_start, resetFn: __m5_reset, loopFn: __m5_loop, phaseNames: ['sun', 'sun_hold'] });
