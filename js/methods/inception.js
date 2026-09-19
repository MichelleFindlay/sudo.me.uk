let incStarted=false, incT=0, incFold=0;


// ---- INCEPTION: the city folds up and over onto itself ----
function inceptionRender(t, fold){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const base=cityGridArr.slice();
  const grid=blankGrid(ROWS);
  const mg=modeGridFill(ROWS,COLS,'city');
  // copy base city first
  for(let r=0;r<ROWS;r++) grid[r]=base[r]||" ".repeat(COLS);

  // the right half of the city lifts and folds up over the left as `fold` (0..1) grows,
  // hinging at the centre: mirrored buildings arc up and overhead.
  const hinge=cx;
  const ang=fold*Math.PI*0.9;                    // 0 = flat, ~PI = folded fully over
  for(let r=0;r<streetRow;r++){
    for(let c=hinge;c<COLS;c++){
      const src=base[r] && base[r][c];
      if(!src || src===" ") continue;
      const d=c-hinge;                            // distance from hinge along the folding flap
      const hgt=streetRow-r;                      // building height at this point
      // rotate the point up and back toward the hinge
      const nc=Math.round(hinge + d*Math.cos(ang));
      const nr=Math.round(r - d*Math.sin(ang));
      if(nc>=0&&nc<COLS&&nr>=0&&nr<ROWS){
        setCh(grid,nr,nc, (Math.random()<0.3?"/":src)); setMode(mg,nr,nc,'fold');
      }
      // clear the original as it lifts away
      if(fold>0.2){ let ln=grid[r].split(""); if(ln[c]===src) ln[c]=" "; grid[r]=ln.join(""); }
    }
  }
  // dreamy debris drifting in the folded space
  for(let k=0;k<COLS*0.2*fold;k++){ const c=(Math.random()*COLS)|0, r=(Math.random()*streetRow)|0;
    if(grid[r] && grid[r][c]===" "){ setCh(grid,r,c,["*",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'fold'); } }
  return {grid,mg};
}


function __m20_loop(){
if(phase==='inception'){
    scene.style.textShadow="0 0 10px #8a7ad0";
    if(!incStarted){ incStarted=true; incT=0; incFold=0; document.body.style.background="#0a0818"; }
    stepRain();
    incFold=Math.min(1, incFold+0.02);
    const {grid,mg}=inceptionRender(incT, incFold);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= incFold<0.5 ? "THE CITY FOLDS IN ON ITSELF" : "REALITY COLLAPSES INTO THE DREAM";
    sub.style.color="#aa9aee"; sub.style.textShadow="0 0 8px #4a3a8a";
    incT++;
    if(!(incFold>=1 && incT>40)){ timer=setTimeout(loop,80); }
    else { phase='inception_hold'; loop(); }
  }else if(phase==='inception_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=inceptionRender(incT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="lost in the dream. — press RESET"; sub.style.color="#aa9aee"; sub.className="";
    incT++;
    timer=setTimeout(loop,150);
  }
}


function __m20_start(){
      // INDIGO -> Inception
    attackMode='inception';
    cmd.style.color="#8a7ad0"; cmd.style.textShadow="0 0 22px #4a3a8a";
    incStarted=false; phase='inception';
  
}


function __m20_reset(){
  incStarted=false; incT=0; incFold=0;
}


registerMethod(20, { start: __m20_start, resetFn: __m20_reset, loopFn: __m20_loop, phaseNames: ['inception', 'inception_hold'] });
