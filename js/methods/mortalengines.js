let mortalStarted=false, mortalT=0, tcX=0, mortalSmoke=[];


// ---- MORTAL ENGINES: cranes strip the city for parts, which drives off as a Traction City ----
// tower cranes are taller than anything they're demolishing: the jib sits above the whole
// skyline and the mast runs almost all the way down to street level, alongside the buildings.
function craneCols(){ const n=Math.max(3,Math.min(6,Math.floor(COLS/26))); return Array.from({length:n},(_,i)=>Math.round((i+0.5)*COLS/n)); }
function craneReach(){ const n=craneCols().length; return Math.max(9,Math.ceil(COLS/n/2)+3); }   // wide enough that neighbouring cranes' reach overlaps — no gaps left standing
// permanently strips buildings within reach of every crane — mutates cityGridArr so the demolition sticks
function mortalCraneDemolish(rate){
  if(cityGridArr.length!==ROWS) return;
  const reach=craneReach();
  for(const cc of craneCols()){
    for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
      for(let c=cc-reach;c<=cc+reach;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<rate) ln[c]=" "; }
      cityGridArr[r]=ln.join(""); }
  }
}
function craneRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  mortalCraneDemolish(0.18);
  const jibRow=1, mastBottom=Math.max(jibRow,streetRow-1), reach=craneReach();
  // work out each crane's hook position first, and rip an extra chunk out right where it grips —
  // ties the visible demolition to the hook actually reaching down into the buildings
  const hooks=craneCols().map(cc=>{
    const swing=Math.round(Math.sin(t*0.1+cc)*reach*0.8);
    const hookCol=cc+swing;
    const cyc=16, ph=(t+Math.round(cc))%cyc;
    const depth=ph<cyc/2 ? ph/(cyc/2) : (cyc-ph)/(cyc/2);          // 0 raised .. 1 lowered .. 0 raised
    const hookRow=Math.round(jibRow+2+depth*Math.max(1,mastBottom-jibRow-2));
    if(depth>0.7){
      for(let dr=-1;dr<=1;dr++){ for(let dc=-2;dc<=2;dc++){ const r=hookRow+dr,c=hookCol+dc;
        if(r>=0&&r<streetRow&&c>=0&&c<COLS&&cityGridArr[r]&&cityGridArr[r][c]!==" "&&Math.random()<0.6){
          let ln=cityGridArr[r].split(""); ln[c]=" "; cityGridArr[r]=ln.join(""); } } }
    }
    return {cc,hookCol,hookRow};
  });
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const cc of craneCols()){
    for(let r=jibRow;r<=mastBottom;r++){ setCh(grid,r,cc,"|"); setMode(mg,r,cc,'crane'); }         // mast, down alongside the buildings
    for(let dc=-reach;dc<=reach;dc++){ const c=cc+dc; if(c<0||c>=COLS)continue; setCh(grid,jibRow,c,(dc===0?"+":"=")); setMode(mg,jibRow,c,'crane'); } // jib, above the skyline
  }
  for(const h of hooks){
    for(let r=jibRow+1;r<h.hookRow;r++){ if(h.hookCol>=0&&h.hookCol<COLS&&r>=0&&r<ROWS){ setCh(grid,r,h.hookCol,":"); setMode(mg,r,h.hookCol,'crane'); } }
    if(h.hookCol>=0&&h.hookCol<COLS&&h.hookRow>=0&&h.hookRow<ROWS){ setCh(grid,h.hookRow,h.hookCol,"O"); setMode(mg,h.hookRow,h.hookCol,'crane'); }
  }
  return {grid,mg};
}
// the Traction City: a mobile fortress on tracks, salvaged from the demolished skyline
const tractionCitySprite=[
  "        |    |    |          ",   // exhaust stacks
  "     ___|____|____|________  ",
  "    /   []   []   []      \\ ",
  "   /______________________  \\",
  "  |  T R A C T I O N  C I T Y |",
  "  |_____________________ ____|",
  "   (O)(O)   (O)(O)   (O)(O)(O)",
];
function tractionRender(tx){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(tx);                            // whatever's still standing gets flattened as it drives through
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=tractionCitySprite;
  const sh=spr.length, sw=spr[0].length;
  const left=Math.round(tx)-sw;                   // tx = leading (right) edge
  const keelRow=streetRow;
  const top=keelRow-sh+1;

  // exhaust plumes billowing back from the stacks as it drives off
  if(mortalT%2===0){ for(const sc of [8,13,18]){ mortalSmoke.push({x:left+sc, y:top-1, vx:-(0.4+Math.random()*0.6), vy:-(0.2+Math.random()*0.4), life:22}); } }
  for(const s of mortalSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,(s.life>12?"@":".")); setMode(mg,r,c,'steam'); } }
  mortalSmoke=mortalSmoke.filter(s=>s.life>0);

  for(let i=0;i<sh;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'traction'); } }

  return {grid,mg};
}


function __m36_loop(){
if(phase==='mortal'){
    scene.style.textShadow="0 0 8px #d0a020";
    if(!mortalStarted){ mortalStarted=true; mortalT=0; tcX=0; mortalSmoke=[]; document.body.style.background="#0a0805"; }
    const {grid,mg}=craneRender(mortalT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="CRANES TEAR THE CITY DOWN, GIRDER BY GIRDER";
    sub.style.color="#d0a020"; sub.style.textShadow="0 0 8px #8a6a20";
    mortalT++;
    if(mortalT<40){ timer=setTimeout(loop,80); }
    else { phase='mortal_build'; mortalT=0; tcX=4+tractionCitySprite[0].length; loop(); }
  }else if(phase==='mortal_build'){
    stage.classList.remove('shake');
    const {grid,mg}=tractionRender(tcX);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE RUBBLE RISES AS A TRACTION CITY";
    sub.style.color="#d0a020"; sub.style.textShadow="0 0 8px #8a6a20";
    mortalT++;
    if(mortalT<16){ timer=setTimeout(loop,80); }
    else { phase='mortal_drive'; mortalT=0; loop(); }
  }else if(phase==='mortal_drive'){
    stage.classList.add('shake');
    const sw=tractionCitySprite[0].length;
    tcX=Math.min(COLS+sw, tcX+Math.max(1,Math.floor(COLS/45)));
    const {grid,mg}=tractionRender(tcX);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="MUNICIPAL DARWINISM — IT DRIVES OFF, DEVOURING THE HORIZON";
    sub.style.color="#d0a020"; sub.style.textShadow="0 0 8px #8a6a20";
    mortalT++;
    if(tcX<COLS+sw){ timer=setTimeout(loop,70); }
    else { phase='mortal_hold'; loop(); }
  }else if(phase==='mortal_hold'){
    stage.classList.remove('shake');
    titanicDemolish(COLS);                    // scrub whatever's left of the skyline
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    // drifting exhaust haze settling over the empty wasteland
    if(mortalT%4===0){ mortalSmoke.push({x:Math.random()*COLS, y:streetRow-2, vx:(Math.random()-0.5)*0.3, vy:-(0.1+Math.random()*0.2), life:30}); }
    for(const s of mortalSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,"."); setMode(mg,r,c,'steam'); } }
    mortalSmoke=mortalSmoke.filter(s=>s.life>0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city itself became the predator. — press RESET"; sub.style.color="#d0a020"; sub.className="";
    mortalT++;
    timer=setTimeout(loop,150);
  }
}


function __m36_start(){
      // CONSTRUCTION YELLOW -> Mortal Engines
    attackMode='mortal';
    cmd.style.color="#e0b030"; cmd.style.textShadow="0 0 20px #8a6a20";
    mortalStarted=false; phase='mortal';
  
}


function __m36_reset(){
  mortalStarted=false; mortalT=0; tcX=0; mortalSmoke=[];
}


registerMethod(36, { start: __m36_start, resetFn: __m36_reset, loopFn: __m36_loop, phaseNames: ['mortal', 'mortal_build', 'mortal_drive', 'mortal_hold'] });
