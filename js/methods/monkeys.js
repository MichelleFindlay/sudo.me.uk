let monkeysStarted=false, monkeysT=0, zooAnimals=[], petersX=0, virusR=0, spreadR=0, coleX=0, youngColeX=0, coleShotFlag=false;


// ---- 12 MONKEYS: the zoo stunt is a red herring, Dr. Peters spreads the real virus, the city empties, animals reclaim it, and the loop closes at the airport ----
const monkeyBeasts=[
  ["  (VVV)   "," ( O O )> ","  <####>  ","  ||  ||  "],           // lion
  ["  __/\u203f\u203f\\_ "," /  O    o \\","<##########>","  ||    ||  "], // elephant
  [" ^_______ ","/> O  ###  \\","<##########>"," ||    ||  "],     // rhino
];
const petersSprite=[" o ","/|\\","/ \\"];
const coleSprite=[" o ","/|\\","/ \\"];
function monkeysZooInit(){
  zooAnimals=[];
  const n=5;
  for(let i=0;i<n;i++){ zooAnimals.push({ x:-4-i*6, spr:monkeyBeasts[i%monkeyBeasts.length], spd:0.5+Math.random()*0.5 }); }
}
function monkeysZooStep(){
  for(const a of zooAnimals){ a.x+=a.spd; }
}
function monkeysZooRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // an emptied cage near the left, door hanging open — the "attack" was only ever this
  const cage=[" .------.","|/      |","||  []  |","|________|"];
  const ctop=streetRow-cage.length+1, cleft=2;
  for(let i=0;i<cage.length;i++){ const art=cage[i], r=ctop+i;
    for(let j=0;j<art.length;j++){ const c=cleft+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'quarantine'); } }
  for(const a of zooAnimals){ const xi=Math.round(a.x), top=streetRow-a.spr.length+1;
    for(let i=0;i<a.spr.length;i++){ const art=a.spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'beast'); } } }
  return {grid,mg};
}
function monkeysReleaseRender(px, virusR){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const top=streetRow-petersSprite.length+1, xi=Math.round(px);
  for(let i=0;i<petersSprite.length;i++){ const art=petersSprite[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'peters'); } }
  if(top>=0&&top<ROWS&&xi+2<COLS){ setCh(grid,top,xi+2,"i"); setMode(mg,top,xi+2,'virus'); }
  // the toxic mist he leaves trailing behind him
  if(virusR>0){ for(let dr=-2;dr<=2;dr++){ for(let dc=-virusR;dc<=0;dc++){ const dist=Math.hypot(dc/Math.max(1,virusR),dr/2);
    if(dist<=1 && Math.random()<0.4){ const r=top+1+dr, c=xi+dc; if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,["~","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'virus'); } } } } }
  return {grid,mg};
}
function monkeysSpreadRender(r){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const gy=streetRow-1, aspect=2;
  for(let row=0;row<ROWS;row++){ let ln=(grid[row]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      const dx=c-cx, dy=(row-gy)*aspect, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>r) continue;
      if(ln[c]==="."||ln[c]===":"){ if(Math.random()<0.7) ln[c]=" "; }
      else if(row===streetRow && Math.random()<0.05){ ln[c]="x"; setMode(mg,row,c,'body'); }
      else if(Math.random()<0.02){ ln[c]="%"; setMode(mg,row,c,'quarantine'); }
    }
    grid[row]=ln.join(""); }
  return {grid,mg};
}
function monkeysEmptyRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'dead');            // the powered-down, silhouette city (reused from EMP)
  for(let r=0;r<streetRow;r++){ let ln=grid[r].split(""); for(let c=0;c<COLS;c++){ if(ln[c]==="."||ln[c]===":") ln[c]=" "; } grid[r]=ln.join(""); }
  // quarantine tape strung along the empty street
  for(let c=0;c<COLS;c++){ if(c%4<2){ setCh(grid,streetRow-1,c, c%2===0?"#":"="); setMode(mg,streetRow-1,c,'quarantine'); } }
  // biohazard placards, all that's left of the response effort
  const nPlac=Math.max(3,Math.floor(COLS/30));
  for(let k=0;k<nPlac;k++){ const c=Math.round((k+0.5)/nPlac*COLS); if(c>=0&&c<COLS){ setCh(grid,streetRow,c,"%"); setMode(mg,streetRow,c,'quarantine'); } }
  // the animals, wandering freely now — the surface belongs to them
  for(const a of zooAnimals){ const xi=Math.round(a.x), top=streetRow-a.spr.length+1;
    for(let i=0;i<a.spr.length;i++){ const art=a.spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'beast'); } } }
  return {grid,mg};
}
function monkeysLoopRender(coleXpos, youngXpos, shotFlag){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'dead');
  const top=streetRow-coleSprite.length+1, cxi=Math.round(coleXpos);
  for(let i=0;i<coleSprite.length;i++){ const art=coleSprite[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=cxi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c, shotFlag?"x":art[j]); setMode(mg,r,c,'cole'); } }
  // his younger self, watching from across the concourse — the loop that was always closed
  const yxi=Math.round(youngXpos);
  for(let j=0;j<3;j++){ const c=yxi-1+j; if(c>=0&&c<COLS){ setCh(grid,streetRow-1,c,"\\o/"[j]); setMode(mg,streetRow-1,c,'body'); } }
  if(shotFlag) mtDrawBubble(grid, mg, cxi+1, top, "he was already there.");
  return {grid,mg};
}


function __m50_loop(){
if(phase==='monkeys'){
    scene.style.textShadow="0 0 8px #8a6a3a";
    if(!monkeysStarted){ monkeysStarted=true; monkeysT=0; monkeysZooInit(); document.body.style.background="#0a0a06"; }
    monkeysZooStep();
    const {grid,mg}=monkeysZooRender();
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="THE ARMY OF THE TWELVE MONKEYS STRIKES — THE ZOO IS EMPTIED";
    sub.style.color="#e0c080"; sub.style.textShadow="0 0 8px #6a4a10";
    monkeysT++;
    if(monkeysT<40){ timer=setTimeout(loop,90); }
    else { phase='monkeys_release'; monkeysT=0; petersX=-4; virusR=0; loop(); }
  }else if(phase==='monkeys_release'){
    petersX=Math.min(cx, petersX+Math.max(1,Math.floor(COLS/70)));
    if(petersX>=cx*0.3) virusR=Math.min(6, virusR+0.3);
    const {grid,mg}=monkeysReleaseRender(petersX, Math.round(virusR));
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = petersX<cx*0.3 ? "A LONE MAN MOVES THROUGH THE TERMINAL, CARRYING VIALS" : "IT WAS NEVER THE MONKEYS. IT WAS DR. PETERS.";
    sub.style.color="#c060e0"; sub.style.textShadow="0 0 8px #4a1a6a";
    monkeysT++;
    if(!(petersX>=cx && monkeysT>30)){ timer=setTimeout(loop,80); }
    else { phase='monkeys_spread'; monkeysT=0; spreadR=0; loop(); }
  }else if(phase==='monkeys_spread'){
    stage.classList.add('shake');
    const maxR=Math.hypot(cx,streetRow*2)+6;
    spreadR=Math.min(maxR, spreadR+Math.max(1,COLS/50));
    const {grid,mg}=monkeysSpreadRender(spreadR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE VIRUS SPREADS — CITY AFTER CITY FALLS SILENT";
    sub.style.color="#a040e0"; sub.style.textShadow="0 0 8px #4a1a6a";
    monkeysT++;
    if(spreadR<maxR){ timer=setTimeout(loop,60); }
    else { phase='monkeys_empty'; monkeysT=0; loop(); }
  }else if(phase==='monkeys_empty'){
    stage.classList.remove('shake');
    monkeysZooStep();
    for(const a of zooAnimals){ if(a.x>COLS+14) a.x=-14; }
    const {grid,mg}=monkeysEmptyRender(monkeysT);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#0a0a0c";
    sub.textContent="FIVE BILLION DEAD. THE SURFACE BELONGS TO THE ANIMALS NOW";
    sub.style.color="#8a6a3a"; sub.style.textShadow="0 0 8px #4a2a10";
    monkeysT++;
    if(monkeysT<50){ timer=setTimeout(loop,90); }
    else { phase='monkeys_loop'; monkeysT=0; coleX=cx-16; youngColeX=cx+14; coleShotFlag=false; loop(); }
  }else if(phase==='monkeys_loop'){
    coleX=Math.min(cx, coleX+Math.max(1,Math.floor(COLS/60)));
    const {grid,mg}=monkeysLoopRender(coleX, youngColeX, coleShotFlag);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = coleShotFlag ? "HE WATCHED HIMSELF DIE, AND HE WAS ALREADY THERE." : "COLE RACES THROUGH THE AIRPORT TO STOP IT";
    sub.style.color="#c0c0c0"; sub.style.textShadow="0 0 8px #4a4e54";
    monkeysT++;
    if(!coleShotFlag && coleX>=cx){ coleShotFlag=true; stage.classList.add('shake'); }
    if(!(coleShotFlag && monkeysT>26)){ timer=setTimeout(loop,80); }
    else { phase='monkeys_hold'; loop(); }
  }else if(phase==='monkeys_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=monkeysLoopRender(coleX, youngColeX, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the outbreak was never stopped. it was only ever survived. — press RESET"; sub.style.color="#c0c0c0"; sub.className="";
    monkeysT++;
    timer=setTimeout(loop,150);
  }
}


function __m50_start(){
      // KHAKI -> 12 Monkeys
    attackMode='monkeys';
    cmd.style.color="#8a6a3a"; cmd.style.textShadow="0 0 20px #4a2a10";
    monkeysStarted=false; phase='monkeys';
  
}


function __m50_reset(){
  monkeysStarted=false; monkeysT=0; zooAnimals=[]; petersX=0; virusR=0; spreadR=0; coleX=0; youngColeX=0; coleShotFlag=false;
}


registerMethod(50, { start: __m50_start, resetFn: __m50_reset, loopFn: __m50_loop, phaseNames: ['monkeys', 'monkeys_release', 'monkeys_spread', 'monkeys_empty', 'monkeys_loop', 'monkeys_hold'] });
