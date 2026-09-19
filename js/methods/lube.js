let lbStarted=false, lbT=0, lbSegs=[], lbOrigRows=[];


// ---- LUBE: everything gets an oily coating, and the skyline slides sideways to the ground ----
// the city is chopped into narrow vertical segments; each one shears sideways over time,
// its rows collapsing toward street level, until it's lying flat — no explosions, just physics.
function lubeInit(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  lbOrigRows=cityGridArr.slice(0,streetRow);          // snapshot of the pristine building rows
  lbSegs=[];
  const segW=Math.max(6,Math.floor(COLS/14));
  for(let start=0;start<COLS;start+=segW){
    lbSegs.push({
      start, width:Math.min(segW,COLS-start),
      dir: Math.random()<0.5?1:-1,
      delay: Math.floor(Math.random()*40),
      t: 0,
      speed: 0.02+Math.random()*0.02,
      done: false
    });
  }
  for(let r=0;r<streetRow;r++){ cityGridArr[r]=" ".repeat(COLS); }   // segments render fresh each frame until baked
}
function lubeSegPos(seg, origRow, t){
  const d=streetRow-origRow;
  const newRow=Math.round(origRow+(streetRow-1-origRow)*t);
  const shift=Math.round(seg.dir*t*d*0.6);
  return {newRow, shift};
}
function lubeBakeSegment(seg){
  for(let origRow=0;origRow<streetRow;origRow++){
    const line=lbOrigRows[origRow];
    if(!line) continue;
    for(let c=seg.start;c<seg.start+seg.width;c++){
      const ch=line[c];
      if(!ch||ch===" ") continue;
      const {newRow, shift}=lubeSegPos(seg, origRow, 1);
      const newCol=c+shift;
      if(newCol<0||newCol>=COLS||newRow<0||newRow>=streetRow) continue;
      let ln=cityGridArr[newRow].split("");
      ln[newCol]=ch;
      cityGridArr[newRow]=ln.join("");
    }
  }
}
function lubeStep(t){
  let allDone=true;
  for(const seg of lbSegs){
    if(seg.done) continue;
    if(t<seg.delay){ allDone=false; continue; }
    seg.t=Math.min(1, seg.t+seg.speed);
    if(seg.t<1){ allDone=false; }
    else { lubeBakeSegment(seg); seg.done=true; }
  }
  return allDone;
}
function lubeRenderSegmentLive(grid, mg, seg){
  for(let origRow=0;origRow<streetRow;origRow++){
    const line=lbOrigRows[origRow];
    if(!line) continue;
    for(let c=seg.start;c<seg.start+seg.width;c++){
      const ch=line[c];
      if(!ch||ch===" ") continue;
      const {newRow, shift}=lubeSegPos(seg, origRow, seg.t);
      const newCol=c+shift;
      if(newCol<0||newCol>=COLS||newRow<0||newRow>=streetRow) continue;
      setCh(grid,newRow,newCol,ch);
      setMode(mg,newRow,newCol, Math.random()<0.15?'lubeshine':'city');
    }
  }
}
function lubeRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // t=0 is the identity transform (no shift/no row change), so this also covers segments
  // still waiting out their delay — they keep showing their pristine standing form
  for(const seg of lbSegs){ if(!seg.done) lubeRenderSegmentLive(grid,mg,seg); }
  for(let k=0;k<COLS*0.3;k++){                        // oily glints everywhere — it's slippery now
    const c=(Math.random()*COLS)|0, r=(Math.random()*streetRow)|0;
    if(grid[r] && grid[r][c]!==" " && Math.random()<0.5) setMode(mg,r,c,'lubeshine');
  }
  return {grid,mg};
}


function __m65_loop(){
if(phase==='lube'){
    scene.style.textShadow="0 0 10px #7fe0e8";
    if(!lbStarted){ lbStarted=true; lbT=0; lubeInit(); document.body.style.background="#0a1214"; }
    const allDone=lubeStep(lbT);
    const {grid,mg}=lubeRender();
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', !allDone);
    sub.textContent="EVERYTHING IS EXTREMELY SLIPPERY"; sub.style.color="#7fe0e8"; sub.style.textShadow="0 0 8px #1a6a70";
    lbT++;
    if(!(allDone && lbT>20)){ timer=setTimeout(loop,80); }
    else { phase='lube_hold'; loop(); }
  }else if(phase==='lube_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=lubeRender();
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the skyline is lying down. it's slicker than ever. — press RESET"; sub.style.color="#7fe0e8"; sub.className="";
    lbT++;
    timer=setTimeout(loop,150);
  }
}


function __m65_start(){
      // SLICK CYAN -> Lube
    attackMode='lube';
    cmd.style.color="#7fe0e8"; cmd.style.textShadow="0 0 20px #1a6a70";
    lbStarted=false; phase='lube';

}


function __m65_reset(){
  lbStarted=false; lbT=0; lbSegs=[]; lbOrigRows=[];
}


registerMethod(65, { start: __m65_start, resetFn: __m65_reset, loopFn: __m65_loop, phaseNames: ['lube', 'lube_hold'] });
