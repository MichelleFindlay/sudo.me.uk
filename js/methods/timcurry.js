let curryStarted=false, curryT=0, curryIdx=0, curryWarpT=0, curryWarpDone=0;


// ---- TIM CURRY: a victory lap through his best-known roles, ending in the Time Warp ----
const curryFrankSprite=[" .--."," (o  o)"," |==|","/|##|\\"," |  |"," () ()"];
const curryPennySprite=[" .--."," (o  o)"," |^^|","/|##|\\"," |  |"];
const curryDarkSprite=["  \\  |  /","   \\ | /","  ( O )","   \\_/","  /|###|\\"];
const curryWadsSprite=[" .--."," (o  o)"," |##|","/|##|\\"," |  |"];
const curryLechuckSprite=["  ,--."," ( o  o )","  |~~~~|"," (|####|)","  |    |"];
const curryConciergeSprite=[" .--."," (o  o)"," |##|","/|##|\\"," |  |"];
const curryVignettes=[
  {sprite:curryFrankSprite, mode:'curryfrank', label:"FRANK-N-FURTER", sub:"DON'T DREAM IT, BE IT."},
  {sprite:curryPennySprite, mode:'currypenny', label:"PENNYWISE", sub:"THEY ALL FLOAT."},
  {sprite:curryDarkSprite, mode:'currydark', label:"THE LORD OF DARKNESS", sub:"THE NIGHT CREATURES STIR."},
  {sprite:curryWadsSprite, mode:'currywads', label:"WADSWORTH", sub:"THE BUTLER DID IT — WITH THE WRENCH."},
  {sprite:curryLechuckSprite, mode:'currylechuck', label:"LECHUCK", sub:"A GHOST PIRATE RISES FROM THE SEA."},
  {sprite:curryConciergeSprite, mode:'curryconcierge', label:"THE CONCIERGE", sub:"HE'S SEEN SOME THINGS TONIGHT."},
];
function curryVignetteRender(v, t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=v.sprite;
  if(v.mode==='currydark'){
    // looms huge over the whole skyline, near the top of the screen
    const top=1, left=cx-Math.floor(spr[0].length/2);
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,v.mode); } }
  } else {
    const top=streetRow-spr.length+1, left=cx-Math.floor(spr[0].length/2)+Math.round(Math.sin(t*0.15)*6);
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,v.mode); } }
    if(v.mode==='currypenny'){
      // the red balloon, bobbing alongside
      const bc=left+spr[0].length+1, br=top-3;
      if(bc>=0&&bc<COLS&&br>=0&&br<ROWS){ setCh(grid,br,bc,"@"); setMode(mg,br,bc,'currypenny'); }
      if(bc>=0&&bc<COLS&&br+1>=0&&br+1<ROWS){ setCh(grid,br+1,bc,"|"); setMode(mg,br+1,bc,'currypenny'); }
    }
  }
  return {grid,mg};
}
function curryWarpRender(t, collapseRate){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(collapseRate>0) collapseCity(collapseRate);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // a flashing dance-floor under it all
  for(let c=0;c<COLS;c++){ if((c+Math.floor(t/4))%4===0){ setCh(grid,streetRow,c, (Math.floor(t/8)%2===0)?"#":"@"); setMode(mg,streetRow,c,'currywarp'); } }
  return {grid,mg};
}


function __m56_loop(){
if(phase==='curry'){
    scene.style.textShadow="0 0 10px #ffd700";
    if(!curryStarted){ curryStarted=true; curryT=0; curryIdx=0; document.body.style.background="#0a0410"; }
    if(curryIdx>=curryVignettes.length){ phase='curry_warp'; curryT=0; curryWarpT=0; curryWarpDone=0; loop(); return; }
    const v=curryVignettes[curryIdx];
    const {grid,mg}=curryVignetteRender(v, curryT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent=v.label+" — "+v.sub; sub.style.color="#ffd700"; sub.style.textShadow="0 0 8px #e0203a";
    curryT++;
    if(curryT<34){ timer=setTimeout(loop,80); }
    else { curryIdx++; curryT=0; loop(); }
  }else if(phase==='curry_warp'){
    stage.classList.add('shake');
    curryWarpT++;
    const dancing = curryWarpT<28;
    const {grid,mg}=curryWarpRender(curryWarpT, dancing?0:0.4);
    let outGrid=grid;
    if(dancing){
      const off=(Math.floor(curryWarpT/4)%2===0) ? -2 : 2;
      outGrid=grid.map(row=>{ const n=row.length; const o=((off%n)+n)%n; return o===0?row:(row.slice(n-o)+row.slice(0,n-o)); });
    }
    scene.innerHTML=paint(outGrid,mg,'city');
    sub.textContent = dancing ? "THE CITY DOES THE TIME WARP" : "…AND THE BUILDINGS GIVE WAY";
    sub.style.color="#ffd700"; sub.style.textShadow="0 0 10px #e0203a";
    if(!dancing) curryWarpDone++;
    if(dancing || curryWarpDone<40){ timer=setTimeout(loop,70); }
    else { phase='curry_hold'; loop(); }
  }else if(phase==='curry_hold'){
    stage.classList.remove('shake');
    const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the dance floor has closed. RIP Tim Curry — press RESET"; sub.style.color="#ffd700"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m56_start(){
      // CURRY RED/GOLD -> Tim Curry
    attackMode='curry';
    cmd.style.color="#e0203a"; cmd.style.textShadow="0 0 20px #ffd700";
    curryStarted=false; phase='curry';
  
}


function __m56_reset(){
  curryStarted=false; curryT=0; curryIdx=0; curryWarpT=0; curryWarpDone=0;
}


registerMethod(56, { start: __m56_start, resetFn: __m56_reset, loopFn: __m56_loop, phaseNames: ['curry', 'curry_warp', 'curry_hold'] });
