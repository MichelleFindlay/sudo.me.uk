let simStarted=false, simT=0, simGrowCols=[], simSubPhase='grass', simHoldT=0;


// ---- SIM CITY: an empty field, then a city rises from it — before an asteroid wipes it out ----
// reuses the standalone Asteroid method's phases/functions for the destruction half, once the
// grown city sits in cityGridArr exactly like a normally-built one.
function simcityGrassRender(){
  const grid=blankGrid(ROWS);
  const mg=modeGridFill(ROWS,COLS,'grass');
  for(let r=streetRow-2;r<=streetRow;r++){
    if(r<0) continue;
    let line=grid[r].split("");
    for(let c=0;c<COLS;c++){ if(Math.random()<0.5) line[c]=[",","'",".","`"][(Math.random()*4)|0]; }
    grid[r]=line.join("");
  }
  return {grid,mg};
}
function simcityGrowStep(){
  for(let c=0;c<COLS;c++){
    if(simGrowCols[c] < streetRow && Math.random()<0.18){
      simGrowCols[c] = Math.min(streetRow, simGrowCols[c] + 1 + ((Math.random()*2)|0));
    }
  }
}
function simcityGrowRender(){
  const grid=blankGrid(ROWS);
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let c=0;c<COLS;c++){
    const revealed=simGrowCols[c];
    if(revealed<3){                                    // grass still showing where nothing's grown yet
      const r=streetRow-1;
      if(r>=0 && Math.random()<0.4){ setCh(grid,r,c,[",","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'grass'); }
    }
    for(let r=streetRow-revealed;r<=streetRow;r++){     // the building (and street), grown so far
      if(r<0) continue;
      const ch=cityGridArr[r] ? cityGridArr[r][c] : " ";
      if(ch && ch!==" ") setCh(grid,r,c,ch);
    }
    if(revealed>0){                                     // underground arrives with its column
      for(let r=streetRow+1;r<ROWS;r++){
        const ch=cityGridArr[r] ? cityGridArr[r][c] : " ";
        if(ch && ch!==" ") setCh(grid,r,c,ch);
      }
    }
  }
  return {grid,mg};
}


function __m53_loop(){
if(phase==='simcity'){
    scene.style.textShadow="0 0 8px #4a9a3a";
    if(!simStarted){
      simStarted=true; simT=0; simHoldT=0; simSubPhase='grass';
      cityGridArr=buildCity();               // establishes streetRow/layout; kept hidden by the grass field until grown
      simGrowCols=new Array(COLS).fill(0);
      document.body.style.background="#0a140a";
    }
    if(simSubPhase==='grass'){
      const {grid,mg}=simcityGrassRender();
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      sub.textContent="AN EMPTY FIELD…"; sub.style.color="#7aca5a"; sub.style.textShadow="0 0 8px #2a5a1a";
      simT++;
      if(simT<14){ timer=setTimeout(loop,90); }
      else { simSubPhase='grow'; loop(); }
    }else if(simSubPhase==='grow'){
      const done = simGrowCols.every(h=>h>=streetRow);
      if(!done) simcityGrowStep();
      const {grid,mg}=simcityGrowRender();
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent = done ? "THE CITY IS COMPLETE" : "THE CITY RISES FROM THE FIELD";
      sub.style.color="#7aca5a"; sub.style.textShadow="0 0 8px #2a5a1a";
      simT++;
      if(done) simHoldT++;
      if(!(done && simHoldT>18)){ timer=setTimeout(loop,70); }
      else { attackMode='asteroid'; astStarted=false; phase='asteroid'; loadMethodScript(METHOD_FILES[2], loop); }
    }
  }
}


function __m53_start(){
      // GRASS GREEN -> Sim City (build from a field, then an asteroid ends it)
    attackMode='simcity';
    cmd.style.color="#4a9a3a"; cmd.style.textShadow="0 0 20px #2a5a1a";
    simStarted=false; phase='simcity';
  
}


function __m53_reset(){
  simStarted=false; simT=0; simGrowCols=[]; simSubPhase='grass'; simHoldT=0;
}


registerMethod(53, { start: __m53_start, resetFn: __m53_reset, loopFn: __m53_loop, phaseNames: ['simcity'] });
