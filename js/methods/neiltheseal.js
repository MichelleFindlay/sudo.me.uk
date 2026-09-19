let neilStarted=false, neilT=0, neilX=0;


// ---- NEIL THE SEAL: he waddles up to each building, bashes it flat, then moves to the next ----
const neilSprite=[
  "   __",
  "  /  \\__",
  " (  o    )",
  "  \\______/",
  "   ()  ()",
];
const neilLeanSprite=[
  "   __",
  "  /  \\__",
  " (  o    )",
  "  \\______/",
  "     ()",
];
const coneSprite=[
  " /\\",
  "/--\\",
  "/____\\",
];
// true while something solid still stands in the few columns right in front of him
function neilBlocked(col){
  if(cityGridArr.length!==ROWS) return false;
  for(let r=0;r<streetRow;r++){ const ln=cityGridArr[r]; if(!ln) continue;
    for(let c=col;c<=col+2;c++){ if(c>=0&&c<COLS&&ln[c]!==" ") return true; }
  }
  return false;
}
// headbutts whatever's at this column — punches a hole in its base so the rest crashes down
function neilBash(col){
  if(cityGridArr.length!==ROWS) return;
  for(let r=Math.max(0,streetRow-3); r<streetRow; r++){ if(!cityGridArr[r])continue; let ln=cityGridArr[r].split("");
    for(let c=col-1;c<=col+3;c++){ if(c>=0&&c<COLS) ln[c]=" "; }
    cityGridArr[r]=ln.join(""); }
  collapseCity(1);
}
function neilRender(x, leaning, bashing){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the cone, waiting patiently at the end of the city
  const coneLeft=COLS-8, coneTop=streetRow-coneSprite.length+1;
  for(let i=0;i<coneSprite.length;i++){ const art=coneSprite[i], r=coneTop+i;
    for(let j=0;j<art.length;j++){ const c=coneLeft+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'cone'); } }
  // Neil himself
  const spr=leaning?neilLeanSprite:neilSprite;
  const jitter=bashing?(Math.random()<0.5?-1:0):0;         // a little recoil while he's headbutting
  const left=Math.round(x)+jitter, top=streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'neil'); } }
  if(bashing){ const nc=left+spr[0].length+1; for(let k=0;k<3;k++){ const c=nc+k, r=top+1+((Math.random()*2)|0);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.7){ setCh(grid,r,c,["*","#","'"][(Math.random()*3)|0]); setMode(mg,r,c,'rubble'); } } }
  if(leaning){ const c=left+spr[0].length, r=top-1; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,"z"); setMode(mg,r,c,'neil'); } }
  return {grid,mg};
}


function __m39_loop(){
if(phase==='neil'){
    scene.style.textShadow="0 0 8px #c8ccd0";
    if(!neilStarted){ neilStarted=true; neilT=0; neilX=-6; document.body.style.background="#0a0c10"; }
    const coneLeft=COLS-8, stopX=coneLeft-neilSprite[0].length-1;
    const arrived=neilX>=stopX;
    const noseCol=Math.round(neilX)+neilSprite[0].length;
    let bashing=false;
    if(!arrived){
      if(neilBlocked(noseCol)){
        bashing=true;
        if(neilT%3===0) neilBash(noseCol);       // keep headbutting until it gives way
      } else {
        neilX+=Math.max(1,Math.floor(COLS/60));  // nothing in the way — waddle onward
      }
    }
    const {grid,mg}=neilRender(neilX, arrived, bashing);
    scene.innerHTML=paint(grid,mg,'city');
    if(bashing) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= arrived ? "…AND THEN HE FOUND A CONE."
                    : (bashing ? "NEIL HEADBUTTS THE BUILDING — IT DOESN'T STAND A CHANCE" : "NEIL WADDLES ON, LOOKING FOR SOMETHING TO BASH");
    sub.style.color="#c8ccd0"; sub.style.textShadow="0 0 8px #4a4e54";
    neilT++;
    if(!(arrived && neilT>30)){ timer=setTimeout(loop,80); }
    else { phase='neil_hold'; loop(); }
  }else if(phase==='neil_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=neilRender(neilX, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Neil is having a lovely time. — press RESET"; sub.style.color="#c8ccd0"; sub.className="";
    neilT++;
    timer=setTimeout(loop,150);
  }
}


function __m39_start(){
      // SEAL GREY -> Neil the Seal
    attackMode='neil';
    cmd.style.color="#c8ccd0"; cmd.style.textShadow="0 0 20px #4a4e54";
    neilStarted=false; phase='neil';
  
}


function __m39_reset(){
  neilStarted=false; neilT=0; neilX=0;
}


registerMethod(39, { start: __m39_start, resetFn: __m39_reset, loopFn: __m39_loop, phaseNames: ['neil', 'neil_hold'] });
