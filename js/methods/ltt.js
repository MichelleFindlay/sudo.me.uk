let lttStarted=false, lttT=0, lttSubPhase='intro', lttGpuX=0, lttGpuY=0, lttGpuVX=0, lttGpuVY=0, lttGpuBounces=0,
    lttFloodR=0, lttDataR=0, lttSpireAngle=0, lttSponsorT=0, lttRubble=[], lttDistrictBackup=null;


// ---- LTT: a routine GPU review goes wrong, and Linus saves it with a sponsor read ----
const linusHoldSprite=[" o ","(#)","/ \\"];       // holding the prototype aloft, triumphant
const linusPanicSprite=["\\o/","/#\\","/ \\"];    // "OH NO."
const linusCalmSprite=[" o ","/|\\","/ \\"];       // mid-sponsor-read, unbothered
const gpuSprite=["[======]","[ GPU  ]"];
const wanTowerSprite=[
  "   ___   ",
  "  | W |  ",
  "  | A |  ",
  "  | N |  ",
  "  |###|  ",
  "  |###|  ",
  " _|###|_ ",
];
const screwdriverSpireSprite=[
  "   --D   ",
  "    |    ",
  "   /|\\   ",
  "  /|||\\  ",
  "  |||||  ",
  "  |||||  ",
];
const watercoolTowerSprite=[
  " _________ ",
  "|~ ~ ~ ~ ~|",
  "|[] [] []|",
  "|~~~~~~~~|",
  "|[] [] []|",
  "|~~~~~~~~|",
  "|________|",
];
const storageServerSprite=[
  " __________ ",
  "|##########|",
  "|[#][#][#]|",
  "|##########|",
  "|[#][#][#]|",
  "|##########|",
  "|[#][#][#]|",
  "|__________|",
];
function lttPositions(){
  return {
    wanX: Math.floor(COLS*0.18),
    spireX: Math.floor(COLS*0.38),
    coolX: Math.floor(COLS*0.55),
    serverX: Math.floor(COLS*0.74),
  };
}
// draws the whole LMG skyline; opts: floodLevel/dataLevel (0..1), spireAngle (deg, topples as it grows), glow (the sponsor save)
function drawLMGSkyline(grid, mg, opts){
  opts=opts||{};
  const pos=lttPositions();
  const floodLevel=opts.floodLevel||0, dataLevel=opts.dataLevel||0, spireAngle=opts.spireAngle||0, glow=!!opts.glow;
  const tmode=glow?'lttsponsor':'ltttower';

  // the WAN Show Tower — stands proud throughout
  { const spr=wanTowerSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=pos.wanX+j-4;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,tmode); } } }

  // the Screwdriver Spire — spins loose and topples as spireAngle grows, rights itself when it's saved
  { const spr=screwdriverSpireSprite, sh=spr.length, sw=spr[0].length;
    const phi=spireAngle*Math.PI/180, cosP=Math.cos(phi), sinP=Math.sin(phi);
    for(let i=0;i<sh;i++){ const art=spr[i];
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue;
        const X=j-Math.floor(sw/2), Y=-(sh-1-i);
        const Xr=X*cosP-Y*sinP, Yr=X*sinP+Y*cosP;
        const c=Math.round(pos.spireX+Xr), r=Math.round(streetRow+Yr);
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,tmode); } } }

  // the watercooled high-rise — leaks and floods the block, recedes once it's saved
  { const spr=watercoolTowerSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=pos.coolX+j-5;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,tmode); } }
    if(floodLevel>0){ const poolW=Math.round(10*floodLevel);
      for(let dc=-poolW;dc<=poolW;dc++){ const c=pos.coolX+dc; if(c<0||c>=COLS)continue;
        setCh(grid,streetRow,c,(Math.random()<0.5?"~":"\u2248")); setMode(mg,streetRow,c,'lttflood'); } }
  }

  // the Petabyte Storage Server — sheds panels as dataLevel grows, DATA LOSS spreading
  { const spr=storageServerSprite, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=pos.serverX+j-6;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue;
        if(dataLevel>0 && Math.random()<dataLevel*0.4) continue;
        setCh(grid,r,c,ch); setMode(mg,r,c,tmode); } }
    if(dataLevel>0.15){ const msg="DATA LOSS"; const mc=pos.serverX-Math.floor(msg.length/2);
      for(let j=0;j<msg.length;j++){ const c=mc+j; if(c>=0&&c<COLS){ setCh(grid,top-1,c,msg[j]); setMode(mg,top-1,c,'lttdata'); } } }
  }
  return pos;
}
// the prototype GPU falls in slow motion, bouncing off ledges before it craters the street
function lttGpuInit(){
  const pos=lttPositions();
  lttGpuX=pos.wanX; lttGpuY=Math.max(1, streetRow-Math.floor(streetRow*0.9));
  lttGpuVX=0.35; lttGpuVY=0.2; lttGpuBounces=0;
}
function lttGpuStep(){
  lttGpuVY+=0.35;
  lttGpuY+=lttGpuVY*0.3;
  lttGpuX+=lttGpuVX;
  const ledges=[streetRow-Math.floor(streetRow*0.6), streetRow-Math.floor(streetRow*0.35), streetRow-Math.floor(streetRow*0.12)];
  for(let i=lttGpuBounces;i<ledges.length;i++){
    if(lttGpuY>=ledges[i]){ lttGpuY=ledges[i]; lttGpuVY=-Math.abs(lttGpuVY)*0.5; lttGpuBounces=i+1;
      stage.classList.add('shake'); setTimeout(()=>stage.classList.remove('shake'),120); break; }
  }
  if(lttGpuY>=streetRow){ lttGpuY=streetRow; return true; }
  return false;
}
// contained, one-district damage: the chaos never spreads to the whole city
function lttDemolishDistrict(left, right, rate){
  if(cityGridArr.length!==ROWS) return;
  for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
    for(let c=left;c<=right;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<rate) ln[c]=" "; }
    cityGridArr[r]=ln.join(""); }
}
// the sponsor read undoes the damage — the district is saved exactly as it stood before the drop
function lttSaveDistrict(left, right){
  lttDistrictBackup=cityGridArr.map(row=> row ? row.slice(left,right+1) : "");
}
function lttRestoreDistrict(left, right){
  if(!lttDistrictBackup) return;
  for(let r=0;r<cityGridArr.length;r++){
    if(!cityGridArr[r]) continue;
    const seg=lttDistrictBackup[r]||"";
    let ln=cityGridArr[r].split("");
    for(let k=0;k<seg.length;k++){ const c=left+k; if(c>=0&&c<COLS) ln[c]=seg[k]; }
    cityGridArr[r]=ln.join("");
  }
}


function __m58_loop(){
if(phase==='ltt'){
    scene.style.textShadow="0 0 10px #ff7b00";
    if(!lttStarted){ lttStarted=true; lttT=0; lttSubPhase='intro';
      if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
      document.body.style.background="#100a04"; }
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    const pos=drawLMGSkyline(grid,mg,{});
    { const spr=linusHoldSprite, top=streetRow-wanTowerSprite.length-spr.length, left=pos.wanX-1;
      for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
        for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'lttperson'); } }
      mtDrawBubble(grid,mg,left+1,top,"THIS IS THE FASTEST GPU WE'VE EVER TESTED."); }
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="LINUS MEDIA GROUP METROPOLIS"; sub.style.color="#ff7b00"; sub.style.textShadow="0 0 8px #cc5c00";
    lttT++;
    if(lttT<26){ timer=setTimeout(loop,90); }
    else { lttGpuInit(); phase='ltt_drop'; lttT=0; loop(); }
  }else if(phase==='ltt_drop'){
    scene.style.textShadow="0 0 10px #ff7b00";
    const landed=lttGpuStep();
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    const pos=drawLMGSkyline(grid,mg,{});
    { const spr=linusPanicSprite, top=streetRow-wanTowerSprite.length-spr.length, left=pos.wanX-1;
      for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
        for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'lttperson'); } }
      mtDrawBubble(grid,mg,left+1,top,"OH NO."); }
    for(let i=0;i<gpuSprite.length;i++){ const art=gpuSprite[i], r=Math.round(lttGpuY)+i;
      for(let j=0;j<art.length;j++){ const c=Math.round(lttGpuX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'lttgpu'); } }
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE PROTOTYPE SLIPS… IN GLORIOUS SLOW MOTION"; sub.style.color="#ff7b00"; sub.style.textShadow="0 0 8px #cc5c00";
    lttT++;
    if(!landed){ timer=setTimeout(loop,70); }
    else {
      const districtLeft=Math.floor(COLS*0.12), districtRight=Math.floor(COLS*0.82);
      lttSaveDistrict(districtLeft,districtRight);
      phase='ltt_chaos'; lttT=0; lttFloodR=0; lttDataR=0; lttSpireAngle=0; loop();
    }
  }else if(phase==='ltt_chaos'){
    scene.style.textShadow="0 0 12px #ff3000";
    stage.classList.add('shake');
    const districtLeft=Math.floor(COLS*0.12), districtRight=Math.floor(COLS*0.82);
    lttFloodR=Math.min(1, lttFloodR+0.03);
    lttDataR=Math.min(1, lttDataR+0.025);
    lttSpireAngle=Math.min(70, lttSpireAngle+2.2);
    lttDemolishDistrict(districtLeft, districtRight, 0.02);
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    drawLMGSkyline(grid,mg,{floodLevel:lttFloodR, dataLevel:lttDataR, spireAngle:lttSpireAngle});
    { const cx0=Math.round(lttGpuX); for(let dj=-3;dj<=3;dj++){ const c=cx0+dj; if(c>=0&&c<COLS && Math.random()<0.6){ setCh(grid,streetRow,c,["#","@","."][(Math.random()*3)|0]); setMode(mg,streetRow,c,'lttgpu'); } } }
    { const ax=Math.floor(COLS*0.3), jx=Math.floor(COLS*0.62);
      setCh(grid,streetRow-1,ax,"A"); setMode(mg,streetRow-1,ax,'lttperson');
      setCh(grid,streetRow-1,jx,"J"); setMode(mg,streetRow-1,jx,'lttperson');
      mtDrawBubble(grid,mg,jx,streetRow-1,"WE'RE LOSING THE B-ROLL!"); }
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = lttDataR<0.5 ? "THE WATERCOOLING LOOP GIVES OUT" : "DATA LOSS SPREADS THROUGH THE RACKS";
    sub.style.color="#ff5a1a"; sub.style.textShadow="0 0 8px #ff2a00";
    lttT++;
    if(!(lttFloodR>=1 && lttDataR>=1 && lttSpireAngle>=70 && lttT>40)){ timer=setTimeout(loop,70); }
    else {
      lttRubble=[]; for(let k=0;k<40;k++){ lttRubble.push({x:districtLeft+Math.random()*(districtRight-districtLeft), y:streetRow-1-Math.random()*Math.floor(streetRow*0.6), ch:["#","@","%","*"][(Math.random()*4)|0]}); }
      phase='ltt_sponsor'; lttT=0; lttSponsorT=0; loop();
    }
  }else if(phase==='ltt_sponsor'){
    scene.style.textShadow="0 0 14px #ffd700";
    stage.classList.remove('shake');
    const districtLeft=Math.floor(COLS*0.12), districtRight=Math.floor(COLS*0.82);
    const wasComplete = lttSponsorT>=1;
    lttSponsorT=Math.min(1, lttSponsorT+0.03);
    if(lttSponsorT>=1 && !wasComplete){ lttRestoreDistrict(districtLeft,districtRight); }
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    const spireAngleNow = 70*(1-lttSponsorT), floodNow = 1-lttSponsorT, dataNow = 1-lttSponsorT;
    const pos=drawLMGSkyline(grid,mg,{floodLevel:floodNow, dataLevel:dataNow, spireAngle:spireAngleNow, glow:true});
    if(lttSponsorT<1){ for(const p of lttRubble){ const r=Math.round(p.y), c=Math.round(p.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,p.ch); setMode(mg,r,c,'lttsponsor'); } } }
    { const spr=linusCalmSprite, top=streetRow-wanTowerSprite.length-spr.length, left=pos.wanX-1;
      for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
        for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'lttperson'); } }
      mtDrawBubble(grid,mg,left+1,top,"...AND THAT'S WHY YOU SHOULD CHECK OUT TODAY'S SPONSOR."); }
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE AD READ IS SO SMOOTH IT HOLDS THE CITY TOGETHER"; sub.style.color="#ffd700"; sub.style.textShadow="0 0 10px #ff9a2a";
    lttT++;
    if(lttSponsorT<1 || lttT<20){ timer=setTimeout(loop,70); }
    else { phase='ltt_hold'; loop(); }
  }else if(phase==='ltt_hold'){
    stage.classList.remove('shake');
    const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    const pos=drawLMGSkyline(grid,mg,{});
    { const spr=linusCalmSprite, top=streetRow-wanTowerSprite.length-spr.length, left=pos.wanX-1;
      for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
        for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'lttperson'); } }
      setCh(grid,top-1,left+1,"T"); setMode(mg,top-1,left+1,'lttperson'); }
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the water bottle is still sold out. — press RESET"; sub.style.color="#ff7b00"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m58_start(){
      // LTT ORANGE -> Linus Tech Tips
    attackMode='ltt';
    cmd.style.color="#ff7b00"; cmd.style.textShadow="0 0 20px #cc5c00";
    lttStarted=false; phase='ltt';
  
}


function __m58_reset(){
  lttStarted=false; lttT=0; lttSubPhase='intro'; lttGpuX=0; lttGpuY=0; lttGpuVX=0; lttGpuVY=0; lttGpuBounces=0;
  lttFloodR=0; lttDataR=0; lttSpireAngle=0; lttSponsorT=0; lttRubble=[]; lttDistrictBackup=null;
}


registerMethod(58, { start: __m58_start, resetFn: __m58_reset, loopFn: __m58_loop, phaseNames: ['ltt', 'ltt_drop', 'ltt_chaos', 'ltt_sponsor', 'ltt_hold'] });
