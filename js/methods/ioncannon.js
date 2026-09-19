let ionStarted=false, ionT=0, ionTx=0, ionBlastR=0;


// ---- ION CANNON: a satellite locks on, then drops a column of pure energy on the city ----
// permanently craters the target zone — mutates cityGridArr so the wreckage sticks

function ionRender(t, stageName, tx, beamY, blastR){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(blastR>0) ionDemolish(tx, Math.round(blastR));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(stageName==='target'){
    // a pulsing HUD-style targeting reticle locked onto the street
    const pulse=(t%6<3), ty=streetRow-1;
    setCh(grid,ty,tx,pulse?"+":"x"); setMode(mg,ty,tx,'ion');
    for(const d of [-3,-2,2,3]){ const c=tx+d; if(c>=0&&c<COLS){ setCh(grid,ty,c,"-"); setMode(mg,ty,c,'ion'); } }
    for(const d of [-2,-1,1,2]){ const r=ty+d; if(r>=0&&r<ROWS){ setCh(grid,r,tx,"|"); setMode(mg,r,tx,'ion'); } }
    for(const p of [[-2,-3],[-2,3],[2,-3],[2,3]]){ const r=ty+p[0], c=tx+p[1]; if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,p[1]<0?"[":"]"); setMode(mg,r,c,'ion'); } }
  } else if(stageName==='beam' || stageName==='blast'){
    // the beam, punching straight down from orbit with static crackling around it
    for(let r=0;r<=beamY;r++){ setCh(grid,r,tx,"|"); setMode(mg,r,tx,'ion');
      if(Math.random()<0.3){ const c=tx+(Math.random()<0.5?-1:1); if(c>=0&&c<COLS){ setCh(grid,r,c,["*",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'ion'); } } }
  }
  if(stageName==='blast'){
    const R=blastR, ground=streetRow, domeH=Math.min(ground,Math.floor(R*0.75));
    for(let r=ground;r>=ground-domeH;r--){ const frac=(ground-r)/Math.max(1,domeH);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=tx+j; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'ion'); } }
  }
  if(stageName==='hold'){
    // lingering ion sparks drifting over the crater
    for(let k=0;k<COLS*0.04;k++){ const c=tx+(((Math.random()*24)|0)-12), r=streetRow-((Math.random()*4)|0);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.5){ setCh(grid,r,c,["*","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'ion'); } }
  }
  return {grid,mg};
}


function __m45_loop(){
if(phase==='ion'){
    scene.style.textShadow="0 0 8px #7ad4ff";
    if(!ionStarted){ ionStarted=true; ionT=0; ionTx=cx; document.body.style.background="#050a10"; }
    const {grid,mg}=ionRender(ionT,'target',ionTx,0,0);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent= ionT<10 ? "TARGET ACQUIRED" : "ION CANNON — FIRING";
    sub.style.color="#7ad4ff"; sub.style.textShadow="0 0 8px #2a5a8a";
    ionT++;
    if(ionT<18){ timer=setTimeout(loop,80); }
    else { phase='ion_beam'; ionT=0; loop(); }
  }else if(phase==='ion_beam'){
    stage.classList.add('shake');
    ionT++;
    const beamY=Math.min(streetRow, ionT*Math.max(2,Math.floor(streetRow/6)));
    const {grid,mg}=ionRender(ionT,'beam',ionTx,beamY,0);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="IMPACT IMMINENT";
    sub.style.color="#eaffff"; sub.style.textShadow="0 0 10px #7ad4ff";
    if(beamY<streetRow){ timer=setTimeout(loop,50); }
    else { phase='ion_blast'; ionT=0; ionBlastR=0; loop(); }
  }else if(phase==='ion_blast'){
    stage.classList.add('shake');
    ionBlastR=Math.min(16, ionBlastR+1.3);
    const {grid,mg}=ionRender(ionT,'blast',ionTx,streetRow,ionBlastR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="DIRECT HIT";
    sub.style.color="#eaffff"; sub.style.textShadow="0 0 10px #7ad4ff";
    ionT++;
    if(ionBlastR<16){ timer=setTimeout(loop,60); }
    else { phase='ion_hold'; loop(); }
  }else if(phase==='ion_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=ionRender(ionT,'hold',ionTx,streetRow,0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="target eliminated. — press RESET"; sub.style.color="#7ad4ff"; sub.className="";
    ionT++;
    timer=setTimeout(loop,150);
  }
}


function __m45_start(){
      // ION BLUE -> Ion Cannon
    attackMode='ion';
    cmd.style.color="#7ad4ff"; cmd.style.textShadow="0 0 20px #2a5a8a";
    ionStarted=false; phase='ion';
  
}


function __m45_reset(){
  ionStarted=false; ionT=0; ionTx=0; ionBlastR=0;
}


registerMethod(45, { start: __m45_start, resetFn: __m45_reset, loopFn: __m45_loop, phaseNames: ['ion', 'ion_beam', 'ion_blast', 'ion_hold'] });
