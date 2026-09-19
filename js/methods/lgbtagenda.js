let prideStarted=false, prideT=0, prideFront=0, prideMarchers=[];


// ---- LGBT AGENDA: no destruction here — the city just gets a very fabulous makeover ----
const prideColors=["#e40303","#ff8c00","#ffed00","#008026","#004dff","#750787"];
const prideVenueSprite=[
  " _____________ ",
  "|   PRIDE     |",
  "|  BAR & GRILL|",
  "|=============|",
  "| [] [] [] [] |",
  "|_____________|",
];
function prideStep(){
  if(Math.random()<0.3 && prideMarchers.length<10){ prideMarchers.push({x:-3, ph:Math.random()*6}); }
  for(const m of prideMarchers){ m.x+=0.8; m.ph+=0.4; }
  prideMarchers=prideMarchers.filter(m=>m.x<COLS+4);
}
function prideRender(t, front){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // every swept column gets repainted, and every ninth gets a flag on its roof
  for(let c=0;c<Math.min(COLS,Math.ceil(front));c++){
    for(let r=0;r<streetRow;r++){ if(grid[r] && grid[r][c]!==" ") setMode(mg,r,c,'pride'); }
    if(c%9===4){
      let roofRow=streetRow;
      for(let r=0;r<streetRow;r++){ if(grid[r] && grid[r][c]!==" "){ roofRow=r; break; } }
      const poleTop=Math.max(0, roofRow-3);
      for(let r=poleTop;r<roofRow;r++){ setCh(grid,r,c,"|"); setMode(mg,r,c,'pride'); }
      if(poleTop>=0 && c+1<COLS){ setCh(grid,poleTop,c+1,">"); setMode(mg,poleTop,c+1,'pride'); }
    }
  }
  // the pride venue — fabulous from the very first frame
  const vspr=prideVenueSprite, vleft=Math.max(1,Math.floor(COLS*0.12)), vtop=streetRow-vspr.length+1;
  for(let i=0;i<vspr.length;i++){ const art=vspr[i], r=vtop+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=vleft+j;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'pridevenue'); } }
  // the parade, marching down the street
  for(const m of prideMarchers){ const xi=Math.round(m.x), bob=(Math.sin(m.ph)>0)?0:1, r=streetRow-1-bob;
    const art=(Math.floor(m.ph)%2===0)?"o/":"\\o";
    for(let j=0;j<art.length;j++){ const c=xi+j; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,art[j]); setMode(mg,r,c,'parade'); } } }
  return {grid,mg};
}


function __m47_loop(){
if(phase==='pride'){
    scene.style.textShadow="0 0 10px #ff66cc";
    if(!prideStarted){ prideStarted=true; prideT=0; prideFront=0; prideMarchers=[]; document.body.style.background="#0a0410"; }
    prideFront=Math.min(COLS, prideFront+Math.max(1,COLS/70));
    prideStep();
    const {grid,mg}=prideRender(prideT, prideFront);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="THE PRIDE PARADE SWEEPS THROUGH THE CITY";
    sub.style.color="#ff9ad6"; sub.style.textShadow="0 0 8px #a0308a";
    prideT++;
    if(prideFront<COLS){ timer=setTimeout(loop,70); }
    else { phase='pride_hold'; loop(); }
  }else if(phase==='pride_hold'){
    stage.classList.remove('shake');
    prideStep();
    const {grid,mg}=prideRender(prideT, COLS);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city has never looked better. — press RESET"; sub.style.color="#ff9ad6"; sub.className="";
    prideT++;
    timer=setTimeout(loop,120);
  }
}


function __m47_start(){
      // RAINBOW PINK -> LGBT Agenda
    attackMode='pride';
    cmd.style.color="#ff66cc"; cmd.style.textShadow="0 0 20px #a0308a";
    prideStarted=false; phase='pride';
  
}


function __m47_reset(){
  prideStarted=false; prideT=0; prideFront=0; prideMarchers=[];
}


registerMethod(47, { start: __m47_start, resetFn: __m47_reset, loopFn: __m47_loop, phaseNames: ['pride', 'pride_hold'] });
