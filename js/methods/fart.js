let fartStarted=false, fartT=0, fartPersonX=0, fartWaveR=0, fartCrowd=[];


// ---- FART: a performer clears their throat, turns around, and a sound wave shatters every window ----
const fartStageSprite=[
  "_________________",
  "|_______________|",
];
const fartSpeakerSprite=[
  " ____ ",
  "[####]",
  "[####]",
  "[####]",
  "[####]",
  "|_||_|",
];
const fartPersonFrontSprite=[
  " q ",
  " o ",
  "/|\\",
  "/ \\",
];
const fartPersonCoughSprite=[
  "*q*",
  " o ",
  "/|\\",
  "/ \\",
];
const fartPersonBackSprite=[
  " o ",
  "/|\\",
  "/q\\",
  "/ \\",
];
function fartCrowdInit(){
  fartCrowd=[];
  const n=Math.max(10, Math.floor(COLS*0.5));
  for(let i=0;i<n;i++){ fartCrowd.push({x:(i+0.5)/n*COLS + (Math.random()*2-1)}); }
}
function fartDrawScene(grid, mg, opts){
  opts=opts||{};
  const personPose=opts.pose||'front';
  const px=opts.personX!==undefined?opts.personX:cx;
  const fled=!!opts.fled;
  const spkL=cx-Math.floor(COLS*0.18), spkR=cx+Math.floor(COLS*0.18);
  for(const sx of [spkL,spkR]){
    const spr=fartSpeakerSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=sx+j-3;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'fartstage'); } }
  }
  { const spr=fartStageSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=cx+j-Math.floor(spr[0].length/2);
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'fartstage'); } }
  }
  for(const p of fartCrowd){ const xi=Math.round(p.x); if(xi<0||xi>=COLS) continue;
    setCh(grid,streetRow-1,xi, fled?"!":"o"); setMode(mg,streetRow-1,xi,'fartcrowd'); }
  const spr = personPose==='back' ? fartPersonBackSprite : (personPose==='cough' ? fartPersonCoughSprite : fartPersonFrontSprite);
  const top=streetRow-spr.length;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=Math.round(px)+j-1;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'fartperson'); } }
  if(opts.bubble) mtDrawBubble(grid, mg, Math.round(px), top, opts.bubble);
  return {grid,mg};
}
// permanently shatters windows (not the buildings themselves) within reach — mutates cityGridArr
function fartBreakWindows(cxi, radius){
  if(cityGridArr.length!==ROWS) return;
  for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
    for(let c=cxi-radius;c<=cxi+radius;c++){ if(c<0||c>=COLS)continue;
      if((ln[c]==="."||ln[c]===":") && Math.random()<0.8) ln[c]="%"; }
    cityGridArr[r]=ln.join(""); }
}
// broken-window glass gets its own colour regardless of when it was shattered
function fartMarkBroken(grid, mg){
  for(let r=0;r<ROWS;r++){ const row=grid[r]; if(!row) continue;
    for(let c=0;c<COLS;c++){ if(row[c]==="%") setMode(mg,r,c,'fartbroken'); } }
}
function fartWaveRender(px, R){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(R>0) fartBreakWindows(Math.round(px), Math.round(R));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  fartDrawScene(grid, mg, {pose:'back', personX:px, fled:true, bubble:"*PPPPFFFFFT*"});
  const waveRow=streetRow-4;
  for(const dir of [-1,1]){
    const c=Math.round(px)+dir*R;
    for(let dr=-2;dr<=2;dr++){ const r=waveRow+dr; if(r<0||r>=ROWS||c<0||c>=COLS)continue;
      setCh(grid,r,c, dir>0?")":"("); setMode(mg,r,c,'fartwave'); }
  }
  for(const dir of [-1,1]){
    const c=Math.round(px)+dir*Math.max(0,R-4);
    for(let dr=-1;dr<=1;dr++){ const r=waveRow+dr; if(r<0||r>=ROWS||c<0||c>=COLS)continue;
      if(Math.random()<0.5){ setCh(grid,r,c, dir>0?"}":"{"); setMode(mg,r,c,'fartwave'); } }
  }
  fartMarkBroken(grid, mg);
  return {grid,mg};
}


function __m60_loop(){
if(phase==='fart'){
    scene.style.textShadow="0 0 10px #a0d040";
    if(!fartStarted){ fartStarted=true; fartT=0; fartPersonX=-6; fartCrowdInit();
      if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
      document.body.style.background="#0a0e04"; }
    fartPersonX=Math.min(cx, fartPersonX+Math.max(1,Math.floor(COLS/70)));
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    fartDrawScene(grid, mg, {pose:'front', personX:fartPersonX, fled:false});
    fartMarkBroken(grid, mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="A LONE PERFORMER TAKES THE STAGE"; sub.style.color="#a0d040"; sub.style.textShadow="0 0 8px #5a7a1a";
    fartT++;
    if(fartPersonX<cx){ timer=setTimeout(loop,80); }
    else { phase='fart_cough'; fartT=0; loop(); }
  }else if(phase==='fart_cough'){
    scene.style.textShadow="0 0 10px #a0d040";
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    fartDrawScene(grid, mg, {pose:'cough', personX:fartPersonX, fled:false, bubble:"*COUGH*"});
    fartMarkBroken(grid, mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="*COUGH* — THEY LOWER THE MIC"; sub.style.color="#a0d040"; sub.style.textShadow="0 0 8px #5a7a1a";
    fartT++;
    if(fartT<16){ timer=setTimeout(loop,90); }
    else { phase='fart_turn'; fartT=0; loop(); }
  }else if(phase==='fart_turn'){
    scene.style.textShadow="0 0 10px #a0d040";
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    fartDrawScene(grid, mg, {pose:'back', personX:fartPersonX, fled:false});
    fartMarkBroken(grid, mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THEY TURN AROUND..."; sub.style.color="#a0d040"; sub.style.textShadow="0 0 8px #5a7a1a";
    fartT++;
    if(fartT<16){ timer=setTimeout(loop,90); }
    else { phase='fart_blast'; fartT=0; fartWaveR=0; loop(); }
  }else if(phase==='fart_blast'){
    scene.style.textShadow="0 0 12px #c8f050";
    stage.classList.add('shake');
    fartWaveR+=Math.max(1, COLS/50);
    const {grid,mg}=fartWaveRender(fartPersonX, fartWaveR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="A SOUND WAVE ROLLS OUT ACROSS THE CITY"; sub.style.color="#c8f050"; sub.style.textShadow="0 0 10px #5a7a1a";
    fartT++;
    if(fartWaveR < Math.ceil(COLS/2)+2){ timer=setTimeout(loop,60); }
    else { phase='fart_hold'; loop(); }
  }else if(phase==='fart_hold'){
    stage.classList.remove('shake');
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    fartDrawScene(grid, mg, {pose:'back', personX:fartPersonX, fled:true});
    fartMarkBroken(grid, mg);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="That really blew everybody away. — press RESET"; sub.style.color="#a0d040"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m60_start(){
      // GAS GREEN -> Fart
    attackMode='fart';
    cmd.style.color="#a0d040"; cmd.style.textShadow="0 0 20px #5a7a1a";
    fartStarted=false; phase='fart';
  
}


function __m60_reset(){
  fartStarted=false; fartT=0; fartPersonX=0; fartWaveR=0; fartCrowd=[];
}


registerMethod(60, { start: __m60_start, resetFn: __m60_reset, loopFn: __m60_loop, phaseNames: ['fart', 'fart_cough', 'fart_turn', 'fart_blast', 'fart_hold'] });
