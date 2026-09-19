let toxStarted=false, toxT=0, toxLevel=0, toxBubbles=[];


// ---- TOXIC WASTE: glowing green sludge floods and dissolves the city ----
function toxicRender(t, dissolve){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // sludge sits at a fixed ~1-storey depth on the street (never climbs the buildings)
  const storey=Math.max(2, Math.floor(streetRow*0.12));   // ~one storey tall
  const top=Math.max(1, streetRow-storey+1);
  // dissolve the buildings from the ground UP as `dissolve` (0..1) grows:
  // the sludge is eating the city away — lower floors go first, then higher.
  const eatRow=Math.floor(streetRow - dissolve*(streetRow-1));   // everything below this is gone
  for(let r=streetRow-1;r>=0;r--){
    if(r>=eatRow){
      let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){ if(ln[c]!==" " && Math.random()<0.7) ln[c]=" "; }   // dissolved away
      grid[r]=ln.join("");
    }
  }
  // draw the pooled sludge (1 storey) sitting on the street
  for(let r=streetRow;r>=top;r--){
    for(let c=0;c<COLS;c++){
      const surface=(r===top);
      if(surface){ setCh(grid,r,c,(Math.random()<0.5?"~":"\u2248")); setMode(mg,r,c,'toxic'); }
      else if(Math.random()<0.8){ setCh(grid,r,c,(Math.random()<0.85?"~":"\u2248")); setMode(mg,r,c,'toxic'); }
    }
  }
  // bubbles rising off the surface
  for(let k=0;k<COLS*0.25;k++){ const c=(Math.random()*COLS)|0, r=top-((Math.random()*3)|0);
    if(r>=0){ setCh(grid,r,c,["O","o","\u00b0"][(Math.random()*3)|0]); setMode(mg,r,c,'toxic'); } }
  if(t%10<3){ const msg="\u2620 TOXIC \u2620"; const sC=cx-Math.floor(msg.length/2);
    for(let j=0;j<msg.length;j++){ const c=sC+j; if(c>=0&&c<COLS){ setCh(grid,Math.max(0,top-4),c,msg[j]); setMode(mg,Math.max(0,top-4),c,'toxic'); } } }
  return {grid,mg};
}


function __m14_loop(){
if(phase==='toxic'){
    scene.style.textShadow="0 0 8px #7fff4a";
    if(!toxStarted){ toxStarted=true; toxT=0; toxLevel=0; document.body.style.background="#040a04"; }
    stepRain();
    // toxLevel now tracks dissolve progress 0..1: hold a beat as the pool forms, then eat the city
    const settle=14;                                  // frames for the storey-deep pool to settle
    const dissolve = toxT<settle ? 0 : Math.min(1, (toxT-settle)/50);
    const {grid,mg}=toxicRender(toxT, dissolve);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= dissolve<0.5 ? "TOXIC WASTE POOLS IN THE STREETS" : "THE BUILDINGS DISSOLVE INTO SLUDGE";
    sub.style.color="#9dff6a"; sub.style.textShadow="0 0 8px #2a8a10";
    toxT++;
    if(!(dissolve>=1 && toxT>settle+55)){ timer=setTimeout(loop,80); }
    else { phase='toxic_hold'; loop(); }
  }else if(phase==='toxic_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=toxicRender(toxT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="a poisoned wasteland. — press RESET"; sub.style.color="#9dff6a"; sub.className="";
    toxT++;
    timer=setTimeout(loop,150);
  }
}


function __m14_start(){
      // TOXIC GREEN -> toxic waste
    attackMode='toxic';
    cmd.style.color="#7fff4a"; cmd.style.textShadow="0 0 20px #2a8a10";
    toxStarted=false; phase='toxic';
  
}


function __m14_reset(){
  toxStarted=false; toxT=0; toxLevel=0; toxBubbles=[];
}


registerMethod(14, { start: __m14_start, resetFn: __m14_reset, loopFn: __m14_loop, phaseNames: ['toxic', 'toxic_hold'] });
