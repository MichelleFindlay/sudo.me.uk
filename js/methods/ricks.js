let ricksStarted=false, ricksT=0, rickPop=[], ricksPortalCols=[], ricksCouncilIdx=-1, ricksCops=[], ricksAssassinX=-2, ricksAssassinHit=false, ricksFires=[];


// ---- RICKS: the Citadel of Ricks — thousands of Ricks build a society purely to govern
// themselves, which promptly develops class inequality, a police state, and an assassination
// plot, and tears itself apart before anyone else has to ----
function ricksRoofRow(){ return Math.max(1, streetRow-Math.floor(streetRow*0.55)); }
function ricksPortalRow(){ return Math.max(0, ricksRoofRow()-2); }
function ricksInit(){
  rickPop=[]; ricksCops=[]; ricksFires=[]; ricksCouncilIdx=-1; ricksAssassinX=-2; ricksAssassinHit=false;
  const nPortals=Math.max(3,Math.floor(COLS*0.06));
  ricksPortalCols=[]; for(let k=0;k<nPortals;k++) ricksPortalCols.push(Math.round((k+0.5)/nPortals*COLS));
}
function ricksBuildStep(t){
  const target=Math.max(20,Math.floor(COLS*0.5));
  if(rickPop.length<target){
    const addN=Math.max(1,Math.floor(COLS/40));
    for(let i=0;i<addN && rickPop.length<target;i++){
      const col=ricksPortalCols[(Math.random()*ricksPortalCols.length)|0];
      rickPop.push({ x: col+(Math.random()*6-3), cls:'worker', rx:0, alive:true });
    }
  }
}
// picks a slice of the population to become the ruling class the moment the citadel is built —
// one of them, standing dead centre atop it, becomes the Council
function ricksStratify(){
  const eliteN=Math.max(3,Math.floor(rickPop.length*0.15));
  let made=0;
  for(const p of rickPop){
    if(made>=eliteN) break;
    if(p.cls==='worker' && Math.random()<0.3){ p.cls='elite'; p.rx=cx+(Math.random()*Math.min(30,COLS*0.3)-15); made++; }
  }
  const elites=rickPop.filter(p=>p.cls==='elite');
  if(elites.length){ const c=elites[(Math.random()*elites.length)|0]; c.cls='council'; c.rx=cx; ricksCouncilIdx=rickPop.indexOf(c); }
}
function ricksPoliceStep(t){
  const copTarget=Math.max(4,Math.floor(COLS*0.08));
  if(ricksCops.length<copTarget && t%2===0){ ricksCops.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.3+Math.random()*0.4 }); }
  for(const c of ricksCops){ c.x=Math.max(0,Math.min(COLS-1,c.x+c.spd*c.dir)); if(Math.random()<0.02) c.dir*=-1; }
  if(t%8===0){
    for(const c of ricksCops){
      for(const p of rickPop){ if(p.cls==='worker' && p.alive && Math.abs(p.x-c.x)<3 && Math.random()<0.5){ p.alive=false; } }
    }
  }
}
function ricksAssassinateStep(){
  if(ricksAssassinHit) return;
  const council=rickPop[ricksCouncilIdx];
  const targetX=council?council.rx:cx;
  ricksAssassinX=Math.min(targetX,ricksAssassinX+Math.max(1,Math.floor(COLS/50)));
  if(ricksAssassinX>=targetX){ ricksAssassinHit=true; if(council) council.alive=false; }
}
function ricksRiotStep(t){
  if(t%3===0){ for(let k=0;k<3;k++){ const idx=(Math.random()*rickPop.length)|0; if(rickPop[idx] && rickPop[idx].alive) rickPop[idx].alive=false; } }
  if(t%5===0){ for(const c of ricksCops){ if(Math.random()<0.3) ricksCops.splice(ricksCops.indexOf(c),1); } }
  if(t%3===0 && ricksFires.length<COLS*0.3){ ricksFires.push({ c:(Math.random()*COLS)|0, h:1, max:2+Math.random()*Math.floor(streetRow*0.6) }); }
  for(const f of ricksFires){ if(f.h<f.max) f.h+=0.4; }
}
function ricksDrawPopulation(grid, mg, t, opts){
  opts=opts||{};
  const roof=ricksRoofRow(), br=streetRow-1;
  for(const p of rickPop){
    if(!p.alive){
      const r=(p.cls==='worker'||p.cls==='cop')?br:roof, xi=Math.round(p.x);
      if(xi>=0&&xi<COLS&&r>=0&&r<ROWS){ setCh(grid,r,xi,"x"); setMode(mg,r,xi,'body'); }
      continue;
    }
    if(p.cls==='worker'){
      const xi=Math.round(p.x), r=br-(Math.random()<0.3?1:0);
      if(xi>=0&&xi<COLS&&r>=0&&r<ROWS){ setCh(grid,r,xi,"r"); setMode(mg,r,xi,'ricksworker'); }
    } else {
      const xi=Math.round(p.rx);
      if(xi>=0&&xi<COLS&&roof>=0&&roof<ROWS){ setCh(grid,roof,xi,p.cls==='council'?"@":"R"); setMode(mg,roof,xi,'rickselite'); }
    }
  }
  if(!opts.noCops){
    for(const c of ricksCops){ const xi=Math.round(c.x); if(xi>=0&&xi<COLS){ setCh(grid,br,xi,"C"); setMode(mg,br,xi,'rickscop'); } }
  }
}
function ricksDrawPortals(grid, mg, t){
  const pr=ricksPortalRow(); if(pr<0||pr>=ROWS) return;
  const glyphs=["(","0",")"];
  for(const col of ricksPortalCols){
    for(let j=-1;j<=1;j++){ const c=col+j; if(c<0||c>=COLS) continue;
      setCh(grid,pr,c,glyphs[((t+j+10)%3+3)%3]); setMode(mg,pr,c,'ricksportal'); }
  }
}
function ricksBuildRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  ricksDrawPortals(grid,mg,t);
  ricksDrawPopulation(grid,mg,t,{noCops:true});
  return {grid,mg};
}
function ricksAssassinateRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  ricksDrawPopulation(grid,mg,t);
  const roof=ricksRoofRow(), xi=Math.round(ricksAssassinX);
  if(xi>=0&&xi<COLS&&roof>=0&&roof<ROWS){ setCh(grid,roof,xi,"A"); setMode(mg,roof,xi,'ricksassassin'); }
  if(ricksAssassinHit && t%4<2){
    const council=rickPop[ricksCouncilIdx];
    if(council){ const cxi=Math.round(council.rx);
      for(let j=-1;j<=1;j++){ const c=cxi+j; if(c>=0&&c<COLS&&roof-1>=0){ setCh(grid,roof-1,c,"*"); setMode(mg,roof-1,c,'ricksassassin'); } } }
  }
  return {grid,mg};
}
// the fire overlay is recomputed fresh from the untouched base city every frame, exactly
// like Riots' burn effect — only ricksFires' heights persist between frames
function ricksRiotRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const fireCh=["#","@","^"];
  for(const f of ricksFires){
    const h=Math.floor(f.h);
    for(let k=0;k<h;k++){ const r=streetRow-k; if(r<0)break; if(Math.random()<0.2)continue;
      setCh(grid,r,f.c,fireCh[(Math.random()*fireCh.length)|0]); setMode(mg,r,f.c,'riot'); }
    for(let r=streetRow-1;r>streetRow-h;r--){ if(grid[r]&&grid[r][f.c]&&grid[r][f.c]!==" "&&mg[r][f.c]!=='riot'&&Math.random()<0.5){ let ln=grid[r].split(""); ln[f.c]=" "; grid[r]=ln.join(""); } }
  }
  ricksDrawPopulation(grid,mg,t);
  return {grid,mg};
}


function __m68_loop(){
if(phase==='ricks_build'){
    scene.style.textShadow="0 0 10px #1a6a3a";
    if(!ricksStarted){ ricksStarted=true; ricksT=0; ricksInit(); document.body.style.background="#04140a"; }
    ricksBuildStep(ricksT);
    const {grid,mg}=ricksBuildRender(ricksT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    const target=Math.max(20,Math.floor(COLS*0.5));
    sub.textContent = rickPop.length<target ? "THOUSANDS OF RICKS POUR THROUGH THE PORTALS" : "…TO BUILD A SOCIETY PURELY TO GOVERN THEMSELVES";
    sub.style.color="#4dff8a"; sub.style.textShadow="0 0 8px #0d5c2e";
    ricksT++;
    if(!(rickPop.length>=target && ricksT>25)){ timer=setTimeout(loop,80); }
    else { phase='ricks_class'; ricksT=0; ricksStratify(); loop(); }
  }else if(phase==='ricks_class'){
    const {grid,mg}=ricksBuildRender(ricksT);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="A GOVERNMENT FORMS OVERNIGHT — SOME RICKS ARE MORE EQUAL THAN OTHERS";
    sub.style.color="#ffd700"; sub.style.textShadow="0 0 8px #8a6a00";
    ricksT++;
    if(ricksT<22){ timer=setTimeout(loop,80); }
    else { phase='ricks_police'; ricksT=0; loop(); }
  }else if(phase==='ricks_police'){
    ricksPoliceStep(ricksT);
    const {grid,mg}=ricksBuildRender(ricksT);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE CITADEL BUILDS A POLICE STATE TO KEEP ITSELF IN LINE";
    sub.style.color="#3a7bff"; sub.style.textShadow="0 0 8px #0a1a6a";
    ricksT++;
    if(ricksT<30){ timer=setTimeout(loop,80); }
    else { phase='ricks_assassinate'; ricksT=0; ricksAssassinX=2; ricksAssassinHit=false; loop(); }
  }else if(phase==='ricks_assassinate'){
    ricksAssassinateStep();
    const {grid,mg}=ricksAssassinateRender(ricksT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', ricksAssassinHit);
    sub.textContent = ricksAssassinHit ? "THE COUNCIL OF RICKS HAS BEEN ASSASSINATED" : "IN THE SHADOWS, ONE OF THEIR OWN MAKES A MOVE";
    sub.style.color="#ff2a2a"; sub.style.textShadow="0 0 8px #6a0a0a";
    ricksT++;
    if(!(ricksAssassinHit && ricksT>16)){ timer=setTimeout(loop,70); }
    else { phase='ricks_riot'; ricksT=0; loop(); }
  }else if(phase==='ricks_riot'){
    ricksRiotStep(ricksT);
    const {grid,mg}=ricksRiotRender(ricksT);
    scene.innerHTML=paint(grid,mg,'city');
    if(ricksFires.length>COLS*0.2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent="WITH NO ONE IN CHARGE, THE CITADEL TEARS ITSELF APART";
    sub.style.color="#ff9a3a"; sub.style.textShadow="0 0 8px #6a3a10";
    ricksT++;
    if(!(ricksFires.length>=COLS*0.22 && ricksT>30)){ timer=setTimeout(loop,80); }
    else { phase='ricks_hold'; loop(); }
  }else if(phase==='ricks_hold'){
    stage.classList.remove('shake');
    ricksRiotStep(ricksT);
    const {grid,mg}=ricksRiotRender(ricksT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the Citadel of Ricks tore itself apart before anyone else could. — press RESET"; sub.style.color="#ff9a3a"; sub.className="";
    ricksT++;
    timer=setTimeout(loop,140);
  }
}


function __m68_start(){
      // PORTAL GREEN -> Ricks
    attackMode='ricks_build';
    cmd.style.color="#4dff8a"; cmd.style.textShadow="0 0 20px #0d5c2e";
    ricksStarted=false; phase='ricks_build';

}


function __m68_reset(){
  ricksStarted=false; ricksT=0; rickPop=[]; ricksPortalCols=[]; ricksCouncilIdx=-1; ricksCops=[]; ricksAssassinX=-2; ricksAssassinHit=false; ricksFires=[];
}


registerMethod(68, { start: __m68_start, resetFn: __m68_reset, loopFn: __m68_loop, phaseNames: ['ricks_build', 'ricks_class', 'ricks_police', 'ricks_assassinate', 'ricks_riot', 'ricks_hold'] });
