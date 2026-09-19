let lsStarted=false, lsT=0, lsFront=0, boulders=[], lsDebris=[];


// ---- LANDSLIDE: a mass of earth and boulders slides down from the upper-left ----
function landslideInit(){
  lsFront=-6; boulders=[]; lsDebris=[];
}
function landslideStep(t){
  lsFront += Math.max(1, Math.floor(COLS/34));   // the leading edge advances rightward
  // spawn tumbling boulders rolling ahead of the slide front
  if(t%3===0){ boulders.push({ x:lsFront + (Math.random()*8), y:streetRow-1-((Math.random()*Math.floor(streetRow*0.3))|0), vx:1+Math.random()*1.5, vy:0.2+Math.random()*0.5, g:0.12, spin:0 }); }
  for(const b of boulders){ b.x+=b.vx; b.y+=b.vy; b.vy+=b.g; b.spin+=0.5; if(b.y>=streetRow-1){ b.y=streetRow-1; b.vy=-b.vy*0.3; b.vx*=0.8; } }
  boulders=boulders.filter(b=> b.x<COLS+4 && b.x < lsFront+Math.floor(COLS*0.3));  // buried once slide catches up
  // the slide permanently buries buildings behind the front — a sloped wedge (higher on the left)
  const front=Math.round(lsFront);
  for(let c=0;c<Math.min(COLS,front);c++){
    // slope: buries higher near the left (origin), tapering down toward the front edge
    const depthFrac=(front-c)/Math.max(1,front);          // 1 at left, 0 at front
    const buryTop=streetRow - Math.floor(depthFrac * streetRow*0.85);
    for(let r=streetRow;r>=buryTop;r--){ if(cityGridArr[r]){ let ln=cityGridArr[r].split(""); if(ln[c]!==" " && Math.random()<0.6) ln[c]=" "; cityGridArr[r]=ln.join(""); } }
  }
}
function landslideRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const front=Math.round(lsFront);

  // the earth mass itself: a sloped pile of rock/mud, thick on the left, tapering to the front
  for(let c=0;c<Math.min(COLS,front);c++){
    const depthFrac=(front-c)/Math.max(1,front);
    const pileTop=streetRow - Math.floor(depthFrac * streetRow*0.85);
    for(let r=streetRow;r>=pileTop;r--){
      // denser/rockier lower, dusty near the surface
      const surface=(r<=pileTop+1);
      let ch;
      if(surface) ch = (Math.random()<0.4)?"O":["~","#","."][(Math.random()*3)|0];
      else ch = (Math.random()<0.2)?"O":["#","%","~","@"][(Math.random()*4)|0];
      setCh(grid,r,c,ch); setMode(mg,r,c,'landslide');
    }
  }
  // dust cloud billowing up along the advancing front
  for(let k=0;k<COLS*0.3;k++){ const c=front - ((Math.random()*Math.floor(COLS*0.2))|0), r=1+((Math.random()*streetRow)|0);
    if(c>=0&&c<COLS && grid[r] && grid[r][c]===" " && Math.random()<0.5){ setCh(grid,r,c,["'","*",".","~"][(Math.random()*4)|0]); setMode(mg,r,c,'landslide'); } }

  // tumbling boulders rolling ahead of the slide
  for(const b of boulders){ const xi=Math.round(b.x), yi=Math.round(b.y);
    // a chunky 2x2-ish boulder
    for(let dr=0;dr<=1;dr++)for(let dc=0;dc<=1;dc++){ const c=xi+dc, r=yi+dr; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,(dr+dc)%2===0?"O":"@"); setMode(mg,r,c,'landslide'); } }
    // little debris trail
    if(xi-1>=0){ setCh(grid,yi,xi-1,"."); setMode(mg,yi,xi-1,'landslide'); }
  }
  return {grid,mg};
}


function __m34_loop(){
if(phase==='landslide'){
    scene.style.textShadow="0 0 8px #9a6a3a";
    if(!lsStarted){ lsStarted=true; lsT=0; landslideInit(); document.body.style.background="#0c0805"; }
    stepRain();
    landslideStep(lsT);
    const {grid,mg}=landslideRender(lsT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent= lsFront<cx ? "A LANDSLIDE ROARS DOWN FROM THE HILLS" : "THE CITY IS BURIED UNDER EARTH AND ROCK";
    sub.style.color="#c08a50"; sub.style.textShadow="0 0 8px #4a2a10";
    lsT++;
    if(!(lsFront>=COLS && lsT>40)){ timer=setTimeout(loop,70); }
    else { phase='landslide_hold'; loop(); }
  }else if(phase==='landslide_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=landslideRender(lsT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="buried under a mountain of rubble. — press RESET"; sub.style.color="#c08a50"; sub.className="";
    lsT++;
    timer=setTimeout(loop,150);
  }
}


function __m34_start(){
      // EARTH BROWN -> Landslide
    attackMode='landslide';
    cmd.style.color="#9a6a3a"; cmd.style.textShadow="0 0 20px #4a2a10";
    lsStarted=false; phase='landslide';
  
}


function __m34_reset(){
  lsStarted=false; lsT=0; lsFront=0; boulders=[]; lsDebris=[];
}


registerMethod(34, { start: __m34_start, resetFn: __m34_reset, loopFn: __m34_loop, phaseNames: ['landslide', 'landslide_hold'] });
