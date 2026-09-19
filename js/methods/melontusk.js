let tuskStarted=false, tuskT=0, tuskCarX=0, tuskCarY=0, tuskLineIdx=0, tuskLineT=0,
    tuskDiveStartX=0, tuskDiveStartY=0, tuskDiveT=0, tuskArmLost=false, tuskCraterX=0,
    tuskBlastR=0, tuskEmbers=[], tuskCyberX=0, tuskTuskX=0, tuskReporterX=0,
    tuskArrivalLineIdx=0, tuskArrivalLineT=0, tuskEndLineIdx=0, tuskEndLineT=0;


// ---- MELON TUSK: an Optimus-piloted Roadster deorbits itself, and a tech titan spins the fallout ----
const roadsterSprite=[
  "  Y  ",
  " /=\\ ",
  "o___o",
];
const roadsterDamagedSprite=[
  "     ",
  " /#\\ ",
  "o___o",
];
const optimusStandSprite=[
  " (O) ",
  "/[#]\\",
  " / \\ ",
];
const optimusWaveSprite=[
  " (O)b",
  "/[#]\\",
  " / \\ ",
];
const cyberTruckSprite=[
  "   ______ ",
  "  /     /|",
  " /_____/ |",
  "|  CT   | ",
  "o_______o ",
];
const tuskPersonSprite=[
  " ^ ",
  "(o)",
  "/|\\",
  "/ \\",
];
const tuskMugSprite=[
  " ^  b",
  "(o) |",
  "/|\\  ",
  "/ \\  ",
];
const reporterSprite=[
  " o ",
  "/|\\",
  "/ \\",
];
const missionLines1=[
  "MISSION CONTROL: TELEMETRY LOOKS GOOD. ORBIT STABLE. BATTERY AT 98%.",
  "OPTIMUS: BATTERY... AT NINETY-EIGHT PERCENT. DEORBIT SEQUENCE... ENGAGED.",
  "MISSION CONTROL: WAIT — WE DIDN'T SEND THAT COMMAND—",
];
const missionLines2=[
  "OPTIMUS: LANDING SITE ACQUIRED. POPULATION DENSITY: HIGH. THIS IS... ACCEPTABLE.",
  "MISSION CONTROL: ABORT! ABORT! THERE ARE PEOPLE DOWN THERE—",
  "OPTIMUS: ABORT... NOT RECOGNIZED.",
];
const arrivalLines=[
  "REPORTER: MR. TUSK — THE ROBOT — THE CAR — THE CITY'S ON FIRE — WHAT HAPPENED?!",
  "MELON TUSK: IT PERFORMED AN UNSCHEDULED RAPID UNPLANNED ENERGETIC LANDING. THE FIRE WAS ACTUALLY JUST EXCESS THERMAL ENERGY BEING SAFELY VENTED INTO THE SURROUNDING METROPOLITAN AREA. THIS IS COMPLETELY NOMINAL, AND HONESTLY A HUGE WIN FOR THE PROGRAM.",
  "REPORTER: ...A WIN?",
  "MELON TUSK: MASSIVE WIN. WE GATHERED INCREDIBLE DATA. VERSION TWO WILL VENT THERMAL ENERGY INTO APPROXIMATELY FORTY PERCENT FEWER CITY BLOCKS. PROBABLY. Q3.",
];
const arrivalHolds=[50,170,40,170];
const endLines=[
  "MELON TUSK: GOOD LANDING.",
  "OPTIMUS: NOMINAL.",
];
function tuskStarfield(grid, mg){
  for(let k=0;k<COLS*0.2;k++){ const c=(Math.random()*COLS)|0, r=(Math.random()*Math.floor(ROWS*0.7))|0;
    if(grid[r] && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"*":".")); setMode(mg,r,c,'tuskstar'); } }
}
function tuskEarthCurve(grid, mg){
  const baseRow=ROWS-3;
  for(let c=0;c<COLS;c++){ const dip=Math.floor(Math.sin((c/COLS)*Math.PI)*3);
    for(let r=baseRow+dip;r<ROWS;r++){ if(r<0||r>=ROWS)continue; setCh(grid,r,c,(Math.random()<0.5?"~":"#")); setMode(mg,r,c,'tuskearth'); } }
}
function tuskDiveInit(){
  tuskDiveStartX=cx-Math.floor(COLS*0.15); tuskDiveStartY=2;
  tuskCarX=tuskDiveStartX; tuskCarY=tuskDiveStartY;
  tuskDiveT=0; tuskArmLost=false;
  tuskCraterX=cx+Math.floor(COLS*0.05);
}
function tuskDiveStep(){
  tuskDiveT++;
  const totalDive=Math.max(8, Math.floor(ROWS*0.6));
  const f=Math.min(1, tuskDiveT/totalDive);
  const fe=f*f;
  tuskCarX=Math.round(tuskDiveStartX + (tuskCraterX-tuskDiveStartX)*fe);
  tuskCarY=Math.round(tuskDiveStartY + (streetRow-tuskDiveStartY)*fe);
  if(f>0.5) tuskArmLost=true;
  return f>=1;
}
function tuskReenterRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let t=1;t<=10;t++){ const tx=Math.round(tuskCarX-t*0.4), ty=Math.round(tuskCarY-t*0.9);
    if(ty>=0&&ty<ROWS&&tx>=0&&tx<COLS&&Math.random()<0.7){ setCh(grid,ty,tx,["#","*","'","@"][(Math.random()*4)|0]); setMode(mg,ty,tx,'tuskflame'); } }
  const spr=tuskArmLost?roadsterDamagedSprite:roadsterSprite;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=Math.round(tuskCarY)+i;
    for(let j=0;j<art.length;j++){ const c=Math.round(tuskCarX)+j-2; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskroadster'); } }
  return {grid,mg};
}
function tuskDemolish(cxi, r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=cxi-r;c<=cxi+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.55) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
  if(cityGridArr[streetRow]){ let g=cityGridArr[streetRow].split("");
    for(let c=cxi-r;c<=cxi+r;c++){ if(c>=0&&c<COLS&&Math.random()<0.5) g[c]=["#","%","."][(Math.random()*3)|0]; }
    cityGridArr[streetRow]=g.join(""); }
}
function tuskImpactRender(cxi, R){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(R>0) tuskDemolish(cxi, Math.round(R));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const ground=streetRow, domeH=Math.min(ground, Math.floor(R*0.75));
  for(let r=ground;r>=ground-domeH;r--){ const frac=(ground-r)/Math.max(1,domeH);
    const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
    for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=cxi+j; if(c<0||c>=COLS)continue;
      setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'tuskflame'); } }
  // a hot-dog cart, launched skyward in slow motion
  { const hcX=cxi+Math.round(R*0.6), hcY=Math.max(1, ground-Math.round(R*0.9));
    if(hcY>=0 && hcY<ROWS && hcX>=0 && hcX<COLS){ setCh(grid,hcY,hcX,"@"); setMode(mg,hcY,hcX,'tuskflame');
      if(hcX+1<COLS){ setCh(grid,hcY,hcX+1,"="); setMode(mg,hcY,hcX+1,'tuskflame'); } } }
  return {grid,mg};
}
function tuskRiseRender(cxi){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let k=0;k<COLS*0.06;k++){ const c=cxi+(((Math.random()*20)|0)-10), r=streetRow-((Math.random()*4)|0);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.5){ setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]); setMode(mg,r,c,'tuskflame'); } }
  const spr=optimusStandSprite, top=streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=cxi+j-2; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskoptimus'); } }
  return {grid,mg};
}
function tuskArrivalRender(cxi, cyberX, tuskX, repX){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let k=0;k<COLS*0.05;k++){ const c=(Math.random()*COLS)|0, r=streetRow-((Math.random()*Math.floor(streetRow*0.5))|0);
    if(Math.random()<0.4){ setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]); setMode(mg,r,c,'tuskflame'); } }
  { const spr=optimusStandSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=cxi+j-2; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskoptimus'); } } }
  { const spr=cyberTruckSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=Math.round(cyberX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskcyber'); } } }
  { const spr=tuskPersonSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=Math.round(tuskX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskperson'); } } }
  { const spr=reporterSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=Math.round(repX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskreporter'); } } }
  return {grid,mg};
}
function tuskEmbersInit(){
  tuskEmbers=[];
  for(let i=0;i<Math.floor(COLS*0.15);i++){ tuskEmbers.push({x:Math.random()*COLS, y:Math.random()*Math.floor(streetRow*0.6), vy:0.15+Math.random()*0.2}); }
}
function tuskEmbersStep(){
  for(const p of tuskEmbers){ p.y+=p.vy; if(p.y>streetRow){ p.y=0; p.x=Math.random()*COLS; } }
}
function tuskEndRender(cxi, tuskX, embers){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  { const spr=optimusWaveSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=cxi+j-2; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskoptimus'); } } }
  { const spr=tuskMugSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=Math.round(tuskX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tuskperson'); } } }
  if(embers){ for(const p of tuskEmbers){ const r=Math.round(p.y), c=Math.round(p.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,(Math.random()<0.5?"'":".")); setMode(mg,r,c,'tuskember'); } } }
  return {grid,mg};
}


function __m59_loop(){
if(phase==='tusk'){
    scene.style.textShadow="0 0 10px #a0c0ff";
    if(!tuskStarted){ tuskStarted=true; tuskT=0; tuskLineIdx=0; tuskLineT=0; tuskCarX=-8; tuskCarY=3; document.body.style.background="#000"; }
    const grid=blankGrid(ROWS);
    const mg=modeGridFill(ROWS,COLS,'tuskstar');
    tuskStarfield(grid,mg);
    tuskEarthCurve(grid,mg);
    tuskCarX+=0.4;
    { const art=roadsterSprite;
      for(let i=0;i<art.length;i++){ const row=art[i], r=Math.round(tuskCarY)+i;
        for(let j=0;j<row.length;j++){ const c=Math.round(tuskCarX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(row[j]===" ")continue; setCh(grid,r,c,row[j]); setMode(mg,r,c,'tuskroadster'); } } }
    scene.innerHTML=paint(grid,mg,'tuskstar');
    stage.classList.remove('shake');
    tuskLineT++;
    if(tuskLineT>40 && tuskLineIdx<missionLines1.length-1){ tuskLineT=0; tuskLineIdx++; }
    sub.textContent=missionLines1[tuskLineIdx]; sub.style.color="#a0c0ff"; sub.style.textShadow="0 0 8px #2a6a9a";
    tuskT++;
    if(!(tuskLineIdx>=missionLines1.length-1 && tuskLineT>40)){ timer=setTimeout(loop,90); }
    else {
      phase='tusk_reenter'; tuskT=0; tuskLineIdx=0; tuskLineT=0;
      document.body.style.background="#140806";
      tuskDiveInit(); loop();
    }
  }else if(phase==='tusk_reenter'){
    scene.style.textShadow="0 0 12px #ff6a00";
    const done=tuskDiveStep();
    const {grid,mg}=tuskReenterRender();
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    tuskLineT++;
    if(tuskLineT>35 && tuskLineIdx<missionLines2.length-1){ tuskLineT=0; tuskLineIdx++; }
    sub.textContent=missionLines2[tuskLineIdx]; sub.style.color="#ff8c1a"; sub.style.textShadow="0 0 8px #ff6a00";
    tuskT++;
    if(!done){ timer=setTimeout(loop,60); }
    else { phase='tusk_flash'; loop(); }
  }else if(phase==='tusk_flash'){
    flash.style.transition="opacity 0.02s"; flash.style.opacity=1;
    document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="* IMPACT *";
    stage.classList.add('shake');
    tuskBlastR=2;
    timer=setTimeout(()=>{ flash.style.transition="opacity 1.5s"; flash.style.opacity=0; document.body.style.background="#140806"; phase='tusk_impact'; loop(); }, 200);
  }else if(phase==='tusk_impact'){
    scene.style.textShadow="0 0 14px #ff6a00";
    stage.classList.add('shake');
    const {grid,mg}=tuskImpactRender(tuskCraterX, tuskBlastR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="A CONCUSSIVE BOOM ROLLS OUTWARD, BLOCK BY BLOCK"; sub.style.color="#ff8c1a"; sub.style.textShadow="0 0 8px #ff6a00";
    tuskBlastR+=Math.max(1, COLS/45);
    if(tuskBlastR < Math.floor(COLS*0.35)){ timer=setTimeout(loop,60); }
    else { phase='tusk_rise'; tuskT=0; loop(); }
  }else if(phase==='tusk_rise'){
    stage.classList.remove('shake');
    const {grid,mg}=tuskRiseRender(tuskCraterX);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="OPTIMUS: LANDING... COMPLETE. DEVIATION FROM TARGET: ZERO METERS. EXCELLENT."; sub.style.color="#40c0ff"; sub.style.textShadow="0 0 8px #2a6a9a";
    tuskT++;
    if(tuskT<30){ timer=setTimeout(loop,90); }
    else {
      phase='tusk_arrival'; tuskT=0; tuskArrivalLineIdx=0; tuskArrivalLineT=0;
      tuskCyberX=tuskCraterX+8; tuskTuskX=tuskCyberX+2; tuskReporterX=COLS+6;
      loop();
    }
  }else if(phase==='tusk_arrival'){
    scene.style.textShadow="0 0 8px #ff7a1a";
    if(tuskReporterX>tuskTuskX+6) tuskReporterX-=Math.max(1,Math.floor(COLS/60));
    const {grid,mg}=tuskArrivalRender(tuskCraterX, tuskCyberX, tuskTuskX, tuskReporterX);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    tuskArrivalLineT++;
    if(tuskArrivalLineT>arrivalHolds[tuskArrivalLineIdx] && tuskArrivalLineIdx<arrivalLines.length-1){ tuskArrivalLineT=0; tuskArrivalLineIdx++; }
    sub.textContent=arrivalLines[tuskArrivalLineIdx]; sub.style.color="#ff9a3a"; sub.style.textShadow="0 0 8px #b04010";
    tuskT++;
    if(!(tuskArrivalLineIdx>=arrivalLines.length-1 && tuskArrivalLineT>arrivalHolds[arrivalLines.length-1])){ timer=setTimeout(loop,80); }
    else { phase='tusk_end'; tuskT=0; tuskEndLineIdx=0; tuskEndLineT=0; tuskEmbersInit(); loop(); }
  }else if(phase==='tusk_end'){
    scene.style.textShadow="0 0 10px #ff9a3a";
    stage.classList.remove('shake');
    tuskEmbersStep();
    const {grid,mg}=tuskEndRender(tuskCraterX, tuskTuskX, true);
    scene.innerHTML=paint(grid,mg,'city');
    tuskEndLineT++;
    if(tuskEndLineT>40 && tuskEndLineIdx<endLines.length-1){ tuskEndLineT=0; tuskEndLineIdx++; }
    sub.textContent=endLines[tuskEndLineIdx]; sub.style.color="#ffd070"; sub.style.textShadow="0 0 8px #ff9a3a";
    tuskT++;
    if(!(tuskEndLineIdx>=endLines.length-1 && tuskEndLineT>40)){ timer=setTimeout(loop,90); }
    else { phase='tusk_hold'; loop(); }
  }else if(phase==='tusk_hold'){
    stage.classList.remove('shake');
    tuskEmbersStep();
    const {grid,mg}=tuskEndRender(tuskCraterX, tuskTuskX, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="NOMINAL — coming Q3. terms and conditions apply. do not stand in venting zone. — press RESET"; sub.style.color="#ffd070"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m59_start(){
      // ROCKET STEEL -> Melon Tusk
    attackMode='tusk';
    cmd.style.color="#d0d4d8"; cmd.style.textShadow="0 0 20px #2a6a9a";
    tuskStarted=false; phase='tusk';
  
}


function __m59_reset(){
  tuskStarted=false; tuskT=0; tuskCarX=0; tuskCarY=0; tuskLineIdx=0; tuskLineT=0;
  tuskDiveStartX=0; tuskDiveStartY=0; tuskDiveT=0; tuskArmLost=false; tuskCraterX=0;
  tuskBlastR=0; tuskEmbers=[]; tuskCyberX=0; tuskTuskX=0; tuskReporterX=0;
  tuskArrivalLineIdx=0; tuskArrivalLineT=0; tuskEndLineIdx=0; tuskEndLineT=0;
}


registerMethod(59, { start: __m59_start, resetFn: __m59_reset, loopFn: __m59_loop, phaseNames: ['tusk', 'tusk_reenter', 'tusk_flash', 'tusk_impact', 'tusk_rise', 'tusk_arrival', 'tusk_end', 'tusk_hold'] });
