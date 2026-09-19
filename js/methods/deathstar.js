let dsStarted=false, dsT=0, dsBlastR=0;


// ---- DEATH STAR: it hovers above the city, then unleashes its superlaser ----
const deathStarSprite=[
  "    .---------.",
  "  /             \\",
  " |               |",
  " |_______________|",
  " |   .-----.     |",
  " |  (   .   )    |",
  "  \\  '-----'    /",
  "    '---------'",
];
const dsEmitterCol=8, dsEmitterRow=5;               // the dish's centre, where the beam originates
function deathstarRender(t, stageName, beamW, blastR){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const sw=18, sh=deathStarSprite.length;
  const bob=Math.sin(t*0.1)>0?0:1;                  // a slow, menacing hover
  const top=2+bob, left=cx-Math.floor(sw/2);
  const shipBottom=top+sh;
  const beamCol=left+dsEmitterCol, beamStartRow=top+dsEmitterRow+1;
  if(blastR>0) ionDemolish(beamCol, Math.round(blastR));   // the same persistent city-clearing the Ion Cannon uses
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the beam, punching straight down from the dish
  if(stageName==='beam' || stageName==='blast'){
    for(let r=beamStartRow;r<streetRow;r++){ for(let dc=-Math.floor(beamW/2);dc<=Math.floor(beamW/2);dc++){ const c=beamCol+dc;
      if(c<0||c>=COLS)continue; setCh(grid,r,c,"|"); setMode(mg,r,c,'superlaser'); } }
  }
  // the blast dome, radiating from ground zero — capped so it never climbs high enough to touch the ship
  if(stageName==='blast'){
    const ground=streetRow, maxDomeH=Math.max(1, ground-shipBottom-1);
    const domeH=Math.min(maxDomeH, Math.floor(blastR*0.75));
    for(let r=ground;r>=ground-domeH;r--){ const frac=(ground-r)/Math.max(1,domeH);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*blastR*1.1);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=beamCol+j; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'superlaser'); } }
  }
  // residual glow drifting over the ruins, once it's all over
  if(stageName==='hold'){
    for(let k=0;k<COLS*0.03;k++){ const c=beamCol+(((Math.random()*30)|0)-15), r=streetRow-((Math.random()*3)|0);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.5){ setCh(grid,r,c,["*","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'superlaser'); } }
  }
  // the Death Star itself, drawn last so it always sits above the beam and blast
  for(let i=0;i<sh;i++){ const art=deathStarSprite[i], r=top+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=left+j;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'deathstar'); } }
  if(stageName==='charge'){ const glow=(t%4<2)?"*":"."; const r=top+dsEmitterRow;
    if(r>=0&&r<ROWS&&beamCol>=0&&beamCol<COLS){ setCh(grid,r,beamCol,glow); setMode(mg,r,beamCol,'superlaser'); } }
  return {grid,mg};
}


function __m46_loop(){
if(phase==='deathstar'){
    scene.style.textShadow="0 0 10px #4aff6a";
    if(!dsStarted){ dsStarted=true; dsT=0; document.body.style.background="#04060a"; }
    const {grid,mg}=deathstarRender(dsT,'charge',0,0);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent= dsT<10 ? "THE DEATH STAR HOVERS ABOVE THE CITY" : "SUPERLASER CHARGING…";
    sub.style.color="#7affa0"; sub.style.textShadow="0 0 8px #1a6a2a";
    dsT++;
    if(dsT<24){ timer=setTimeout(loop,80); }
    else { phase='deathstar_beam'; dsT=0; loop(); }
  }else if(phase==='deathstar_beam'){
    stage.classList.add('shake');
    dsT++;
    const beamW=Math.min(5, 1+Math.floor(dsT/3));
    const {grid,mg}=deathstarRender(dsT,'beam',beamW,0);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="IT UNLEASHES ITS LASER";
    sub.style.color="#aaffc0"; sub.style.textShadow="0 0 10px #4aff6a";
    if(dsT<14){ timer=setTimeout(loop,55); }
    else { phase='deathstar_blast'; dsT=0; dsBlastR=0; loop(); }
  }else if(phase==='deathstar_blast'){
    stage.classList.add('shake');
    const maxR=Math.ceil(COLS/2)+2;                  // grows until it's cleared the entire city
    dsBlastR=Math.min(maxR, dsBlastR+Math.max(1,COLS/40));
    const {grid,mg}=deathstarRender(dsT,'blast',5,dsBlastR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THAT'S NO MOON.";
    sub.style.color="#aaffc0"; sub.style.textShadow="0 0 10px #4aff6a";
    dsT++;
    if(dsBlastR<maxR){ timer=setTimeout(loop,60); }
    else { phase='deathstar_hold'; loop(); }
  }else if(phase==='deathstar_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=deathstarRender(dsT,'hold',0,0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city has been eliminated. — press RESET"; sub.style.color="#7affa0"; sub.className="";
    dsT++;
    timer=setTimeout(loop,150);
  }
}


function __m46_start(){
      // SUPERLASER GREEN -> Death Star
    attackMode='deathstar';
    cmd.style.color="#7affa0"; cmd.style.textShadow="0 0 20px #1a6a2a";
    dsStarted=false; phase='deathstar';
  
}


function __m46_reset(){
  dsStarted=false; dsT=0; dsBlastR=0;
}


registerMethod(46, { start: __m46_start, resetFn: __m46_reset, loopFn: __m46_loop, phaseNames: ['deathstar', 'deathstar_beam', 'deathstar_blast', 'deathstar_hold'] });
