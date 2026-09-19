let squadStarted=false, squadT=0, squadPortalR=0, squadFireR=0, squadCreatures=[], squadMembers=[];


// ---- SUICIDE SQUAD: the Enchantress opens her machine, the Squad fights through, Diablo burns it down ----
function squadInit(){
  squadCreatures=[]; squadMembers=[];
  const n=Math.max(6,Math.floor(COLS/16));
  for(let i=0;i<n;i++){ squadCreatures.push({x:(i+0.5)/n*COLS, turned:false}); }
  const letters=["D","H","B","C","E","W"];   // Deadshot, Harley, Boomerang, Croc, El Diablo, Waller
  squadMembers=letters.map((letter,i)=>({x:-3-i*4, letter}));
}
// citizens turn as the corruption front (the machine's reach) sweeps past them
function squadStep(portalR){
  for(const c of squadCreatures){ if(!c.turned && c.x<portalR) c.turned=true; }
}
function squadAdvance(){
  for(const m of squadMembers){ m.x+=0.6;
    for(const c of squadCreatures){ if(Math.abs(c.x-m.x)<2) c.turned=false; }   // fought off as the Squad passes
  }
}
// permanently tears up the infrastructure under the machine — mutates cityGridArr
function squadDemolish(r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=cx-r;c<=cx+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.12) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
}
function squadRender(portalR, squadOn, fireR, destroying){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(portalR>0 && !destroying) squadDemolish(Math.round(portalR*0.3));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the swirling sky machine hanging over downtown
  if(portalR>0){ const py=Math.floor(streetRow*0.18), hw=Math.max(1,Math.round(portalR*0.5));
    for(let dr=-3;dr<=3;dr++){ for(let dc=-hw;dc<=hw;dc++){
      const dist=Math.hypot(dc/hw, dr/3);
      if(dist<=1 && Math.random()<0.5){ const rr=py+dr, cc=cx+dc; if(rr>=0&&rr<ROWS&&cc>=0&&cc<COLS){ setCh(grid,rr,cc,["@","#","~","*"][(Math.random()*4)|0]); setMode(mg,rr,cc,'enchantress'); } } } } }
  // citizens — faceless and blackened once the corruption reaches them
  for(const c of squadCreatures){ const xi=Math.round(c.x); if(xi<0||xi>=COLS)continue;
    if(c.turned){ setCh(grid,streetRow-1,xi,"X"); setMode(mg,streetRow-1,xi,'creature'); }
    else { setCh(grid,streetRow-1,xi,"o"); setMode(mg,streetRow-1,xi,'body'); } }
  // Task Force X, cutting a path through the horde
  if(squadOn){ for(const m of squadMembers){ const xi=Math.round(m.x); if(xi<0||xi>=COLS)continue;
    setCh(grid,streetRow-1,xi,m.letter); setMode(mg,streetRow-1,xi,'squad'); } }
  // El Diablo's fire, erupting from the centre
  if(fireR>0){ const domeH=Math.min(streetRow, Math.floor(fireR*0.8));
    for(let r=streetRow;r>=streetRow-domeH;r--){ const frac=(streetRow-r)/Math.max(1,domeH);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*fireR);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=cx+j; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["#","@","%","^"][(Math.random()*4)|0]); setMode(mg,r,c,'dragonfire'); } } }
  return {grid,mg};
}


function __m49_loop(){
if(phase==='squad'){
    scene.style.textShadow="0 0 8px #a040e0";
    if(!squadStarted){ squadStarted=true; squadT=0; squadPortalR=0; squadInit(); document.body.style.background="#08040c"; }
    squadPortalR=Math.min(Math.floor(COLS*0.45), squadPortalR+Math.max(1,Math.floor(COLS/50)));
    squadStep(squadPortalR);
    const {grid,mg}=squadRender(squadPortalR, false, 0, false);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="THE ENCHANTRESS OPENS HER MACHINE IN THE SKY";
    sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #4a1a6a";
    squadT++;
    if(squadPortalR<Math.floor(COLS*0.45)){ timer=setTimeout(loop,70); }
    else { phase='squad_fight'; squadT=0; loop(); }
  }else if(phase==='squad_fight'){
    stage.classList.add('shake');
    squadAdvance();
    const {grid,mg}=squadRender(squadPortalR, true, 0, false);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="TASK FORCE X FIGHTS THROUGH THE HORDE";
    sub.style.color="#e0c000"; sub.style.textShadow="0 0 8px #6a4a00";
    squadT++;
    const allArrived=squadMembers.every(m=>m.x>=cx);
    if(!allArrived){ timer=setTimeout(loop,70); }
    else { phase='squad_diablo'; squadT=0; squadFireR=0; loop(); }
  }else if(phase==='squad_diablo'){
    stage.classList.add('shake');
    squadFireR=Math.min(14, squadFireR+1.2);
    const {grid,mg}=squadRender(squadPortalR, true, squadFireR, false);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="EL DIABLO UNLEASHES HIS FIRE";
    sub.style.color="#ff6020"; sub.style.textShadow="0 0 10px #ff2000";
    squadT++;
    if(squadFireR<14){ timer=setTimeout(loop,60); }
    else { phase='squad_destroy'; squadT=0; loop(); }
  }else if(phase==='squad_destroy'){
    stage.classList.add('shake');
    squadPortalR=Math.max(0, squadPortalR-Math.max(1,Math.floor(COLS/30)));
    const {grid,mg}=squadRender(squadPortalR, true, squadFireR, true);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE MACHINE FALLS — ENCHANTRESS IS DEFEATED";
    sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #4a1a6a";
    squadT++;
    if(squadPortalR>0){ timer=setTimeout(loop,60); }
    else { phase='squad_hold'; loop(); }
  }else if(phase==='squad_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=squadRender(0, true, 0, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="mission complete. Task Force X heads back to prison. — press RESET"; sub.style.color="#c090ff"; sub.className="";
    squadT++;
    timer=setTimeout(loop,150);
  }
}


function __m49_start(){
      // TASK FORCE GOLD -> Suicide Squad
    attackMode='squad';
    cmd.style.color="#e0c000"; cmd.style.textShadow="0 0 20px #4a1a6a";
    squadStarted=false; phase='squad';
  
}


function __m49_reset(){
  squadStarted=false; squadT=0; squadPortalR=0; squadFireR=0; squadCreatures=[]; squadMembers=[];
}


registerMethod(49, { start: __m49_start, resetFn: __m49_reset, loopFn: __m49_loop, phaseNames: ['squad', 'squad_fight', 'squad_diablo', 'squad_destroy', 'squad_hold'] });
