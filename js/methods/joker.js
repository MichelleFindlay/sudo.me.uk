let jokerStarted=false, jokerT=0, jokerMarchers=[], jokerGasParticles=[], jokerBystanders=[], jokerFloatX=0, batX=0, batFailed=false, jokerGasFront=0;


// ---- THE JOKER: a street parade rolls out the gas canisters, and Batman is too late ----
const jokerFloatSprite=[
  " [O]  [O]  [O]",
  "==============",
  "(o)        (o)",
];
const batmobileSprite=[
  " __/\\  /\\__",
  "/___========\\",
  "(o)       (o)",
];
function jokerInit(){
  jokerMarchers=[]; jokerGasParticles=[]; jokerBystanders=[];
  const n=Math.max(4,Math.floor(COLS/20));
  for(let i=0;i<n;i++){ jokerBystanders.push({x:(i+0.5)/n*COLS, down:false}); }
}
function jokerStep(floatX, gasActive){
  if(Math.random()<0.3 && jokerMarchers.length<8){ jokerMarchers.push({x:-3, ph:Math.random()*6}); }
  for(const m of jokerMarchers){ m.x+=0.9; m.ph+=0.4; }
  jokerMarchers=jokerMarchers.filter(m=>m.x<COLS+4);
  if(gasActive && jokerT%2===0){ for(let k=0;k<2;k++){
    jokerGasParticles.push({x:floatX-6+((Math.random()*10)|0), y:streetRow-3, vx:(Math.random()-0.5)*0.5, vy:-(0.3+Math.random()*0.4), life:34}); } }
  for(const p of jokerGasParticles){ p.x+=p.vx; p.y+=p.vy; p.life--; }
  jokerGasParticles=jokerGasParticles.filter(p=>p.life>0);
}
function jokerRender(t, floatX, batX, batFailedFlag, gasFront){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the gas front, hazing over everything it's already swept past
  if(gasFront>0){ for(let c=0;c<Math.min(COLS,Math.ceil(gasFront));c++){
    for(let r=Math.max(0,streetRow-6);r<streetRow;r++){ if(Math.random()<0.35){ setCh(grid,r,c,["'",",","~"][(Math.random()*3)|0]); setMode(mg,r,c,'jokergas'); } } } }
  // bystanders — upright until the gas front reaches them, then down and grinning
  for(const b of jokerBystanders){ if(!b.down && b.x<gasFront) b.down=true;
    const xi=Math.round(b.x);
    if(b.down){ const art=(xi%2===0)?"-):":":-(";
      for(let j=0;j<art.length;j++){ const c=xi-1+j; if(c>=0&&c<COLS){ setCh(grid,streetRow,c,art[j]); setMode(mg,streetRow,c,'jokergas'); } } }
    else { const r=streetRow-1; for(let j=0;j<3;j++){ const c=xi-1+j; if(c>=0&&c<COLS){ setCh(grid,r,c,"\\o/"[j]); setMode(mg,r,c,'body'); } } }
  }
  // gas particles drifting up from the canisters
  for(const p of jokerGasParticles){ const r=Math.round(p.y), c=Math.round(p.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && p.life>0){ setCh(grid,r,c,(p.life>18?"@":".")); setMode(mg,r,c,'jokergas'); } }
  // the marchers, leading the way
  for(const m of jokerMarchers){ const xi=Math.round(m.x), bob=(Math.sin(m.ph)>0)?0:1, r=streetRow-1-bob;
    const art=(Math.floor(m.ph)%2===0)?"o/":"\\o";
    for(let j=0;j<art.length;j++){ const c=xi+j; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,art[j]); setMode(mg,r,c,'joker'); } } }
  // the Joker's float, canisters and all
  if(floatX!==undefined){ const spr=jokerFloatSprite, left=Math.round(floatX)-spr[0].length, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'joker'); } } }
  // the Batmobile — always arriving just a little too late
  if(batX!==undefined){ const spr=batmobileSprite, left=Math.round(batX)-spr[0].length, top=streetRow-spr.length+1;
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'batman'); } }
    if(batFailedFlag) mtDrawBubble(grid, mg, left+Math.floor(spr[0].length/2), top, "HA HA HA!"); }
  return {grid,mg};
}


function __m48_loop(){
if(phase==='joker'){
    scene.style.textShadow="0 0 8px #8a2ab0";
    if(!jokerStarted){ jokerStarted=true; jokerT=0; jokerInit(); jokerFloatX=-14; batX=COLS+11; batFailed=false; document.body.style.background="#06040a"; }
    jokerFloatX+=Math.max(1,Math.floor(COLS/70));
    if(!batFailed){ batX-=Math.max(1,Math.floor(COLS/55)); if(batX<=jokerFloatX+6) batFailed=true; }
    jokerStep(jokerFloatX, true);
    const {grid,mg}=jokerRender(jokerT, jokerFloatX, batX, batFailed, 0);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent= batFailed ? "BATMAN FAILS TO STOP THE PARADE" : "A STRANGE PARADE ROLLS THROUGH GOTHAM";
    sub.style.color="#c090e0"; sub.style.textShadow="0 0 8px #3a1a4a";
    jokerT++;
    if(jokerFloatX<COLS+14){ timer=setTimeout(loop,70); }
    else { phase='joker_gas'; jokerT=0; jokerGasFront=0; loop(); }
  }else if(phase==='joker_gas'){
    jokerGasFront=Math.min(COLS, jokerGasFront+Math.max(1,COLS/60));
    jokerStep(jokerFloatX, false);
    const {grid,mg}=jokerRender(jokerT, undefined, batX, true, jokerGasFront);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="THE LAUGHING GAS SPREADS ACROSS THE CITY";
    sub.style.color="#8aff9a"; sub.style.textShadow="0 0 8px #1a6a2a";
    jokerT++;
    if(jokerGasFront<COLS){ timer=setTimeout(loop,70); }
    else { phase='joker_hold'; loop(); }
  }else if(phase==='joker_hold'){
    stage.classList.remove('shake');
    jokerStep(jokerFloatX, false);
    const {grid,mg}=jokerRender(jokerT, undefined, batX, true, COLS);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="why so serious? batman failed. — press RESET"; sub.style.color="#8aff9a"; sub.className="";
    jokerT++;
    timer=setTimeout(loop,150);
  }
}


function __m48_start(){
      // CLOWN PURPLE -> The Joker
    attackMode='joker';
    cmd.style.color="#8a2ab0"; cmd.style.textShadow="0 0 20px #3a1a4a";
    jokerStarted=false; phase='joker';
  
}


function __m48_reset(){
  jokerStarted=false; jokerT=0; jokerMarchers=[]; jokerGasParticles=[]; jokerBystanders=[]; jokerFloatX=0; batX=0; batFailed=false; jokerGasFront=0;
}


registerMethod(48, { start: __m48_start, resetFn: __m48_reset, loopFn: __m48_loop, phaseNames: ['joker', 'joker_gas', 'joker_hold'] });
