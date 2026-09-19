let sdStarted=false, sdT=0, sdWaveX=0;

// a proper mug outline — rim, straight walls, a flat base, and a real handle ring on
// the right — with "SPORT" in blue over "DIRECT" in red, matching the real thing
const mugUpright=[
  "   ______________    ",
  "  /              \\   ",
  " |                |   ",
  " |     SPORT      |--.",
  " |                |   )",
  " |    DIRECT      |  )",
  " |                |--'",
  " |                |   ",
  "  \\______________/   "
];
// the same mug, lying on its side once it's fully tipped over — a rigid rotation,
// hand-drawn rather than computed, so it stays recognisable as a mug and not a smear
const mugFallen=[
  "    ________________________    ",
  "   /                        \\   ",
  "  (    SPORT      DIRECT      )--.",
  "   \\________________________/    )",
  "                               `--'"
];

// ---- SPORTS DIRECT: a mug tips over, and the city drowns in coffee ----
// it leans in place first — a rigid per-row horizontal shear with no vertical
// squashing, so every row keeps its own line and nothing overlaps or garbles —
// then swaps to the hand-drawn fallen-on-its-side pose once it's tipped past balance.
function sportsdirectDrawArt(grid, mg, art, left, top, shiftFn){
  for(let i=0;i<art.length;i++){
    const row=art[i], r=top+i;
    const sportIdx=row.indexOf('SPORT'), directIdx=row.indexOf('DIRECT');
    const shift=shiftFn ? shiftFn(i, art.length) : 0;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j+shift; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch);
      let mode='sdmug';
      if(/[A-Z]/.test(ch)){
        if(sportIdx>=0 && j>=sportIdx && j<sportIdx+5) mode='sdmugblue';
        else if(directIdx>=0 && j>=directIdx && j<directIdx+6) mode='sdmugred';
      }
      setMode(mg,r,c,mode);
    }
  }
}
function sportsdirectRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(t<20){
    const leanAmt = t<5 ? 0 : (t-5)/15*1.4;           // 0 -> 1.4 columns of shear per row of height
    const left=3, top=streetRow-mugUpright.length;
    sportsdirectDrawArt(grid, mg, mugUpright, left, top, (i,len)=>Math.round((len-1-i)*leanAmt));
  } else {
    const left=3, top=streetRow-mugFallen.length;
    sportsdirectDrawArt(grid, mg, mugFallen, left, top, null);
  }
  return {grid,mg};
}
// the flood itself — a curling coffee front sweeping left->right, same shape as the
// tidal wave but browner (and caused by a mug, not the ocean)
function coffeeFlood(wx){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const waterTop=Math.max(1, streetRow - Math.floor(ROWS*0.55));
  const crestH=Math.min(streetRow-waterTop, Math.floor(ROWS*0.5));

  for(let r=0;r<ROWS;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      if(c<wx-2){
        if(r>=waterTop){
          const surface=(r===waterTop);
          if(surface){ line[c]=(Math.random()<0.3?"~":"≈"); }
          else { line[c]=(Math.random()<0.15?"≈":"~"); }
          setMode(mg,r,c,'coffee');
        }
        else if(r<waterTop && line[c]!==" " && r<streetRow){
          if(Math.random()<0.5){ line[c]=" "; }
        }
      } else if(c>=wx-2 && c<=wx+1){
        const faceTop=streetRow-crestH;
        if(r>=faceTop && r<=streetRow){
          const atCrest=(r<=faceTop+2);
          let ch;
          if(atCrest) ch=(Math.random()<0.5?"#":"@");
          else ch=(Math.random()<0.6?"~":"≈");
          line[c]=ch; setMode(mg,r,c,'coffee');
        }
        if(r>=faceTop-3 && r<faceTop && Math.random()<0.35){
          line[c]=(Math.random()<0.5?"*":"°"); setMode(mg,r,c,'coffee');
        }
      }
    }
    grid[r]=line.join("");
  }
  return {grid,mg};
}


function __m67_loop(){
if(phase==='sportsdirect'){
    scene.style.textShadow="0 0 10px #6a3a18";
    if(!sdStarted){ sdStarted=true; sdT=0; sdWaveX=-Math.floor(COLS*0.15); document.body.style.background="#160a04"; }
    if(sdT<23){
      const {grid,mg}=sportsdirectRender(sdT);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent = sdT<5 ? "A SPORTS DIRECT MUG WOBBLES…" : "…AND TIPS RIGHT OVER";
      sub.style.color="#c89050"; sub.style.textShadow="0 0 8px #6a3a18";
      sdT++;
      timer=setTimeout(loop,90);
    } else if(sdT<31){                                // hold on the fully-fallen mug before it floods
      const {grid,mg}=sportsdirectRender(sdT);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="COFFEE EVERYWHERE"; sub.style.color="#c89050"; sub.style.textShadow="0 0 8px #6a3a18";
      sdT++;
      timer=setTimeout(loop,90);
    } else {
      stage.classList.add('shake');
      const {grid,mg}=coffeeFlood(sdWaveX);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE CITY IS DROWNING IN COFFEE"; sub.style.color="#c89050"; sub.style.textShadow="0 0 8px #6a3a18";
      sdWaveX+=Math.max(1,Math.floor(COLS/26));
      if(sdWaveX<COLS+Math.floor(COLS*0.2)){ timer=setTimeout(loop,70); }
      else { phase='sportsdirect_hold'; loop(); }
    }
  }else if(phase==='sportsdirect_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=coffeeFlood(COLS+COLS);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is drowning in a large mocha. — press RESET"; sub.style.color="#c89050"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m67_start(){
      // COFFEE BROWN -> Sports Direct
    attackMode='sportsdirect';
    cmd.style.color="#c89050"; cmd.style.textShadow="0 0 20px #6a3a18";
    sdStarted=false; phase='sportsdirect';

}


function __m67_reset(){
  sdStarted=false; sdT=0; sdWaveX=0;
}


registerMethod(67, { start: __m67_start, resetFn: __m67_reset, loopFn: __m67_loop, phaseNames: ['sportsdirect', 'sportsdirect_hold'] });
