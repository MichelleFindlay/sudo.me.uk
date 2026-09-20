let idioStarted=false, idioT=0, idioGarbageLevel=0, idioCamachoIn=false, idioMountainOffsets=[], idioMountainAvg=0, idioClimbY=0;


// ---- IDIOCRACY: two hibernation volunteers oversleep by 500 years, and wake to a
// country buried in garbage, watered with Brawndo, and run by a wrestler-president ----
const idioPod=[
  " ___ ",
  "| Z |",
  "|___|"
];
function idioGarbageCap(){ return Math.max(6, Math.floor(streetRow*0.5)); }
function idioSurfaceTop(){ return streetRow-idioGarbageLevel-rubberPersonSprite.length; }
// a jagged mountain-range silhouette, not a flat fill line: a handful of random peaks,
// blended by inverse-square distance so the ridge is uneven but still continuous
function idioBuildMountainProfile(){
  idioMountainOffsets=new Array(COLS);
  const peaks=[]; const n=Math.max(4,Math.floor(COLS/12));
  for(let i=0;i<n;i++){ peaks.push({ c: Math.round((i+Math.random()*0.6)/n*COLS), h: 2+Math.random()*5 }); }
  let sum=0;
  for(let c=0;c<COLS;c++){
    let val=0, wsum=0;
    for(const p of peaks){ const d=Math.abs(c-p.c)+1, w=1/(d*d); val+=p.h*w; wsum+=w; }
    idioMountainOffsets[c]=val/wsum; sum+=idioMountainOffsets[c];
  }
  idioMountainAvg=sum/COLS;
}
function idioInit(){ idioGarbageLevel=0; idioCamachoIn=false; idioClimbY=0; idioBuildMountainProfile(); }
function idioDrawPods(grid, mg, topOverride){
  const left1=cx-8, left2=cx+3, top=(topOverride===undefined) ? streetRow-idioPod.length : topOverride;
  for(const left of [left1, left2]){
    for(let i=0;i<idioPod.length;i++){
      const row=idioPod[i], r=top+i;
      for(let j=0;j<row.length;j++){
        const ch=row[j]; if(ch===" ") continue;
        const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
        setCh(grid,r,c,ch); setMode(mg,r,c, ch==="Z" ? 'idiosleep' : 'idiopod');
      }
    }
  }
}
// buries the ENTIRE city under a rising mountain RANGE of trash — jagged peaks and
// valleys per column (from idioMountainOffsets), not one flat fill line — recomputed
// fresh from the untouched base city every frame
function idioGarbageFill(grid, mg, level){
  for(let c=0;c<COLS;c++){
    const colLevel=Math.min(streetRow-1, Math.max(0, Math.round(level+(idioMountainOffsets[c]||0)-idioMountainAvg)));
    for(let k=0;k<colLevel;k++){
      const r=streetRow-k; if(r<0) break;
      const surface=(k>=colLevel-2);
      const ch = surface ? ["%","@","#"][(Math.random()*3)|0] : ["%","@","#","x","o"][(Math.random()*5)|0];
      setCh(grid,r,c,ch); setMode(mg,r,c,'idiogarbage');
    }
  }
}
// a thin neon puddle sitting on top of the garbage mountain's surface, with a few
// wilted crops poking up out of it that never get any greener
function idioBrawndoOverlay(grid, mg, level){
  const surfaceRow=streetRow-level;
  for(let k=1;k<=2;k++){
    const r=surfaceRow-k; if(r<0) break;
    for(let c=0;c<COLS;c++){
      if(Math.random()<0.85){ setCh(grid,r,c,(Math.random()<0.5?"~":"≈")); setMode(mg,r,c,'idiobrawndo'); }
    }
  }
  for(let n=0;n<Math.max(3,Math.floor(COLS/25));n++){
    const c=Math.round((n+0.5)/Math.max(3,Math.floor(COLS/25))*COLS);
    const r=surfaceRow-3; if(r<0||c<0||c>=COLS) continue;
    setCh(grid,r,c,"y"); setMode(mg,r,c,'idioplant');
  }
}
function idioDrawPeople(grid, mg, top, includeCamacho){
  const positions = includeCamacho ? [cx-6, cx, cx+6] : [cx-3, cx+3];
  const modes = includeCamacho ? ['idiojoe','idiorita','idiocamacho'] : ['idiojoe','idiorita'];
  for(let p=0;p<positions.length;p++){
    const left=positions[p]-1;
    for(let i=0;i<rubberPersonSprite.length;i++){
      const row=rubberPersonSprite[i], r=top+i;
      for(let j=0;j<row.length;j++){
        const ch=row[j]; if(ch===" ") continue;
        const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
        setCh(grid,r,c,ch); setMode(mg,r,c,modes[p]);
      }
    }
  }
}
function idioRender(t, opts){
  opts=opts||{};
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(opts.pods) idioDrawPods(grid,mg);
  if(opts.podsTop!==undefined) idioDrawPods(grid,mg,opts.podsTop);
  if(idioGarbageLevel>0) idioGarbageFill(grid,mg,idioGarbageLevel);
  if(opts.brawndo) idioBrawndoOverlay(grid,mg,idioGarbageLevel);
  if(opts.debris){                                // dirt kicked loose as the pods slip free
    const debrisTop = opts.podsTop!==undefined ? opts.podsTop : opts.peopleTop;
    for(let n=0;n<5;n++){
      const c=cx-6+((Math.random()*12)|0), r=debrisTop-1-((Math.random()*2)|0);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.6){ setCh(grid,r,c,["%","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'idiogarbage'); }
    }
  }
  if(opts.peopleTop!==undefined){
    idioDrawPeople(grid, mg, opts.peopleTop, !!opts.includeCamacho);
    if(opts.caption) mtDrawBubble(grid, mg, cx, opts.peopleTop, opts.caption);
    if(opts.sprout){
      for(let n=0;n<4;n++){
        const c=cx-6+n*4, r=opts.peopleTop+rubberPersonSprite.length;
        if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,"'"); setMode(mg,r,c,'idiosprout'); }
      }
    }
  }
  return {grid,mg};
}


function __m71_loop(){
if(phase==='idio_sleep'){
    scene.style.textShadow="0 0 10px #4a5a6a";
    if(!idioStarted){ idioStarted=true; idioT=0; idioInit(); document.body.style.background="#0a0e14"; }
    const {grid,mg}=idioRender(idioT,{pods:true});
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent = idioT<12 ? "TWO VOLUNTEERS ENTER A TOP-SECRET HIBERNATION EXPERIMENT" : "THE PROJECT IS FORGOTTEN. THEY SLEEP FOR 500 YEARS.";
    sub.style.color="#7fa0c0"; sub.style.textShadow="0 0 8px #1a3a5a";
    idioT++;
    if(idioT<26){ timer=setTimeout(loop,90); }
    else { phase='idio_garbage'; idioT=0; loop(); }
  }else if(phase==='idio_garbage'){
    idioGarbageLevel=Math.min(idioGarbageCap(), idioGarbageLevel+Math.max(1,Math.floor(streetRow/30)));
    const {grid,mg}=idioRender(idioT,{});
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', idioGarbageLevel>idioGarbageCap()*0.3);
    sub.textContent="GARBAGE PILES INTO MOUNTAINS ACROSS THE COUNTRY";
    sub.style.color="#a08850"; sub.style.textShadow="0 0 8px #4a3a10";
    idioT++;
    if(!(idioGarbageLevel>=idioGarbageCap() && idioT>18)){ timer=setTimeout(loop,80); }
    else { phase='idio_wakeup'; idioT=0; idioClimbY=streetRow; loop(); }
  }else if(phase==='idio_wakeup'){
    idioClimbY=Math.max(idioSurfaceTop(), idioClimbY-Math.max(1,Math.floor(streetRow/24)));
    const atSurface = idioClimbY<=idioSurfaceTop();
    const {grid,mg}=idioRender(idioT,{ podsTop:idioClimbY, debris:true, peopleTop: atSurface ? idioSurfaceTop() : undefined });
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', !atSurface);
    sub.textContent = !atSurface ? "500 YEARS LATER, THE PODS SLIP LOOSE AND SLIDE OUT OF THE GARBAGE" : "JOE AND RITA CLIMB OUT";
    sub.style.color="#c0c890"; sub.style.textShadow="0 0 8px #4a4a2a";
    idioT++;
    if(!(atSurface && idioT>26)){ timer=setTimeout(loop,80); }
    else { phase='idio_brawndo'; idioT=0; loop(); }
  }else if(phase==='idio_brawndo'){
    stage.classList.remove('shake');
    const {grid,mg}=idioRender(idioT,{brawndo:true, peopleTop:idioSurfaceTop()});
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = idioT<15 ? "CROPS ARE WATERED WITH BRAWNDO. IT'S GOT ELECTROLYTES." : "THE CROPS ARE DYING";
    sub.style.color="#c0e030"; sub.style.textShadow="0 0 8px #4a6a10";
    idioT++;
    if(idioT<30){ timer=setTimeout(loop,90); }
    else { phase='idio_camacho'; idioT=0; loop(); }
  }else if(phase==='idio_camacho'){
    idioCamachoIn=true;
    const {grid,mg}=idioRender(idioT,{brawndo:true, peopleTop:idioSurfaceTop(), includeCamacho:true, caption:"SECRETARY OF THE INTERIOR"});
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="JOE BAUERS: SMARTEST MAN ALIVE, LARGELY BY DEFAULT"; sub.style.color="#ffd700"; sub.style.textShadow="0 0 8px #8a6a00";
    idioT++;
    if(idioT<30){ timer=setTimeout(loop,90); }
    else { phase='idio_hold'; loop(); }
  }else if(phase==='idio_hold'){
    const {grid,mg}=idioRender(idioT,{brawndo:true, peopleTop:idioSurfaceTop(), includeCamacho:true, sprout:true});
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="human progress restarts. barely. — press RESET"; sub.style.color="#c0e030"; sub.className="";
    idioT++;
    timer=setTimeout(loop,150);
  }
}


function __m71_start(){
      // BRAWNDO GREEN -> Idiocracy
    attackMode='idio_sleep';
    cmd.style.color="#c0e030"; cmd.style.textShadow="0 0 20px #4a6a10";
    idioStarted=false; phase='idio_sleep';

}


function __m71_reset(){
  idioStarted=false; idioT=0; idioGarbageLevel=0; idioCamachoIn=false; idioMountainOffsets=[]; idioMountainAvg=0; idioClimbY=0;
}


registerMethod(71, { start: __m71_start, resetFn: __m71_reset, loopFn: __m71_loop, phaseNames: ['idio_sleep', 'idio_garbage', 'idio_wakeup', 'idio_brawndo', 'idio_camacho', 'idio_hold'] });
