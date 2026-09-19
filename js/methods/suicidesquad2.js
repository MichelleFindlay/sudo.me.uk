let squad2Started=false, squad2T=0, squad2Decoys=[], squad2MemberXs=[], squad2Members=[], squad2Creatures=[], squad2DomeR=0, squad2RatR=0;


// ---- SUICIDE SQUAD 2: a decoy team dies on the beach, the real team blows up Jotunheim, and Starro breaks loose ----
const jotunheimSprite=[
  "   |||   ",
  "  _|_|_  ",
  " /JOTUN\\ ",
  "|=======|",
  "|[#] [#]|",
  "|=======|",
  "|[#] [#]|",
  "|_______|",
];
const starroSprite=[
  "      \\   |   /      ",
  "       \\  |  /       ",
  "    ----( O )----    ",
  "       /  |  \\       ",
  "      /   |   \\      ",
];
function squad2DecoyInit(){
  squad2Decoys=["H","F","S"].map((letter,i)=>({x:cx-4+i*4, letter, down:false}));
}
function squad2DecoyRender(firing){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const n=Math.max(4,Math.floor(COLS/20));
  for(let i=0;i<n;i++){ const c=Math.round((i+0.5)/n*COLS); setCh(grid,streetRow-1,c,"@"); setMode(mg,streetRow-1,c,'war'); }
  if(firing){ for(let k=0;k<COLS*0.1;k++){ const c=(Math.random()*COLS)|0; setCh(grid,streetRow-2,c,"-"); setMode(mg,streetRow-2,c,'warfire'); } }
  for(const d of squad2Decoys){ const xi=Math.round(d.x); if(xi<0||xi>=COLS)continue;
    setCh(grid,streetRow-1,xi, d.down?"x":d.letter); setMode(mg,streetRow-1,xi,'decoy'); }
  return {grid,mg};
}
function squad2TowerRender(memberXs){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const tw=jotunheimSprite[0].length, tx=Math.floor(COLS*0.75)-Math.floor(tw/2), ttop=streetRow-jotunheimSprite.length+1;
  for(let i=0;i<jotunheimSprite.length;i++){ const art=jotunheimSprite[i], r=ttop+i;
    for(let j=0;j<art.length;j++){ const c=tx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'jotunheim'); } }
  const letters=["B","P","K","R","D"];
  for(let i=0;i<memberXs.length;i++){ const xi=Math.round(memberXs[i]); if(xi<0||xi>=COLS)continue;
    setCh(grid,streetRow-1,xi,letters[i]); setMode(mg,streetRow-1,xi,'squad2'); }
  return {grid,mg};
}
// permanently gouges the blast zone — mutates cityGridArr
function squad2Demolish(col,r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=col-r;c<=col+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.6) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
}
function squad2ExplodeRender(col, R){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  squad2Demolish(col, Math.round(R));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const dome=Math.min(streetRow, Math.floor(R*0.9));
  for(let r=streetRow;r>=streetRow-dome;r--){ const frac=(streetRow-r)/Math.max(1,dome);
    const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
    for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=col+j; if(c<0||c>=COLS)continue;
      setCh(grid,r,c,["#","@","%","^"][(Math.random()*4)|0]); setMode(mg,r,c,'dragonfire'); } }
  return {grid,mg};
}
function squad2Init(col){
  squad2Creatures=[];
  const n=Math.max(6,Math.floor(COLS/16));
  for(let i=0;i<n;i++){ squad2Creatures.push({x:(i+0.5)/n*COLS, turned:false}); }
  squad2Members=["B","P","K","R","D"].map((letter,i)=>({x:col-2+((i-2)*2), letter}));
}
// citizens turn into Starro's mind-controlled thralls as the spore front reaches them
function squad2Step(domeR, col){
  for(const c of squad2Creatures){ if(!c.turned && Math.abs(c.x-col)<domeR) c.turned=true; }
}
function squad2Render(col, domeR, ratR, starroAlive){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(domeR>0) squad2Demolish(col, Math.round(domeR*0.15));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // citizens — faceless mind-controlled thralls once the spores reach them
  for(const c of squad2Creatures){ const xi=Math.round(c.x); if(xi<0||xi>=COLS)continue;
    if(c.turned){ setCh(grid,streetRow-1,xi,"X"); setMode(mg,streetRow-1,xi,'thrall'); }
    else { setCh(grid,streetRow-1,xi,"o"); setMode(mg,streetRow-1,xi,'body'); } }
  // drifting spores near the edge of the spread
  for(let k=0;k<Math.floor(domeR*0.6);k++){ const ang=Math.random()*Math.PI*2, rad=domeR*(0.6+Math.random()*0.4);
    const c=Math.round(col+Math.cos(ang)*rad), r=Math.round(streetRow-1+Math.sin(ang)*2);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,"*"); setMode(mg,r,c,'spore'); } }
  // Starro himself, looming over the wreckage — shrinking as the rats devour him
  if(starroAlive){
    const scale=Math.max(0.3, 1-ratR/16);
    const sw=starroSprite[0].length, sh=starroSprite.length;
    const stop=streetRow-Math.floor(sh*scale*1.6);
    for(let i=0;i<sh;i++){ const art=starroSprite[i]; const r=stop+Math.floor(i*scale);
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=col-Math.floor(sw/2)+Math.floor(j*scale);
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'starro'); } }
  }
  // the rat swarm, converging and devouring Starro from every side
  if(ratR>0){ for(let k=0;k<COLS*0.25;k++){ const ang=Math.random()*Math.PI*2, rad=ratR+Math.random()*4;
    const c=Math.round(col+Math.cos(ang)*rad), r=Math.round((streetRow-4)+Math.sin(ang)*3);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,"r"); setMode(mg,r,c,'ratswarm'); } } }
  // the real squad, still fighting at ground level
  for(const m of squad2Members){ const xi=Math.round(m.x); if(xi<0||xi>=COLS)continue;
    setCh(grid,streetRow-1,xi,m.letter); setMode(mg,streetRow-1,xi,'squad2'); }
  return {grid,mg};
}


function __m51_loop(){
if(phase==='squad2_decoy'){
    scene.style.textShadow="0 0 8px #c02020";
    if(!squad2Started){ squad2Started=true; squad2T=0; squad2DecoyInit(); document.body.style.background="#0a0604"; }
    const firing = squad2T>10;
    if(firing){ for(const d of squad2Decoys){ if(!d.down && Math.random()<0.15) d.down=true; } }
    const {grid,mg}=squad2DecoyRender(firing);
    scene.innerHTML=paint(grid,mg,'city');
    if(firing) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = firing ? "THE DECOY TEAM IS CUT DOWN ON THE BEACH" : "TASK FORCE X HITS THE BEACH AT CORTO MALTESE";
    sub.style.color="#ff8080"; sub.style.textShadow="0 0 8px #800000";
    squad2T++;
    const allDown = squad2Decoys.every(d=>d.down);
    if(!(allDown && squad2T>30)){ timer=setTimeout(loop,80); }
    else { phase='squad2_infiltrate'; squad2T=0; squad2MemberXs=[-3,-7,-11,-15,-19]; loop(); }
  }else if(phase==='squad2_infiltrate'){
    const targetCol=Math.floor(COLS*0.75);
    for(let i=0;i<squad2MemberXs.length;i++){ squad2MemberXs[i]=Math.min(targetCol-3+i, squad2MemberXs[i]+Math.max(1,Math.floor(COLS/60))); }
    const {grid,mg}=squad2TowerRender(squad2MemberXs);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="THE REAL TEAM MOVES ON JOTUNHEIM"; sub.style.color="#e0b030"; sub.style.textShadow="0 0 8px #6a4a10";
    squad2T++;
    const arrived = squad2MemberXs.every((x,i)=> x>=targetCol-3+i);
    if(!(arrived && squad2T>20)){ timer=setTimeout(loop,80); }
    else { phase='squad2_explode'; squad2T=0; squad2DomeR=0; loop(); }
  }else if(phase==='squad2_explode'){
    stage.classList.add('shake');
    const col=Math.floor(COLS*0.75);
    squad2DomeR=Math.min(14, squad2DomeR+1.3);
    const {grid,mg}=squad2ExplodeRender(col, squad2DomeR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="JOTUNHEIM GOES UP — AND SOMETHING BREAKS FREE"; sub.style.color="#ff8000"; sub.style.textShadow="0 0 10px #ff2000";
    squad2T++;
    if(squad2DomeR<14){ timer=setTimeout(loop,60); }
    else { phase='squad2_rampage'; squad2T=0; squad2DomeR=0; squad2RatR=0; squad2Init(col); document.body.style.background="#0a0410"; loop(); }
  }else if(phase==='squad2_rampage'){
    stage.classList.add('shake');
    const col=Math.floor(COLS*0.75);
    squad2DomeR=Math.min(Math.floor(COLS*0.4), squad2DomeR+Math.max(1,Math.floor(COLS/60)));
    squad2Step(squad2DomeR, col);
    const {grid,mg}=squad2Render(col, squad2DomeR, 0, true);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="STARRO RAMPAGES — MIND-CONTROLLED THRALLS SWARM THE STREETS";
    sub.style.color="#c060e0"; sub.style.textShadow="0 0 8px #4a1a6a";
    squad2T++;
    if(!(squad2DomeR>=Math.floor(COLS*0.4) && squad2T>40)){ timer=setTimeout(loop,70); }
    else { phase='squad2_fight'; squad2T=0; squad2RatR=0; loop(); }
  }else if(phase==='squad2_fight'){
    stage.classList.add('shake');
    const col=Math.floor(COLS*0.75);
    squad2RatR=Math.min(16, squad2RatR+1);
    const {grid,mg}=squad2Render(col, squad2DomeR, squad2RatR, squad2RatR<16);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = squad2RatR<16 ? "RATCATCHER 2 UNLEASHES THE SWARM" : "BLOODSPORT LANDS THE KILLING BLOW";
    sub.style.color="#8aff40"; sub.style.textShadow="0 0 8px #2a5a10";
    squad2T++;
    if(squad2RatR<16){ timer=setTimeout(loop,80); }
    else { phase='squad2_hold'; squad2T=0; loop(); }
  }else if(phase==='squad2_hold'){
    stage.classList.remove('shake');
    const col=Math.floor(COLS*0.75);
    const {grid,mg}=squad2Render(col, squad2DomeR, 0, false);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Starro is dead. the city is wrecked but standing. Waller has been blackmailed. — press RESET"; sub.style.color="#8aff40"; sub.className="";
    squad2T++;
    timer=setTimeout(loop,150);
  }
}


function __m51_start(){
      // BLOODSPORT BLUE -> Suicide Squad 2
    attackMode='squad2';
    cmd.style.color="#4080ff"; cmd.style.textShadow="0 0 20px #1a2a6a";
    squad2Started=false; phase='squad2_decoy';
  
}


function __m51_reset(){
  squad2Started=false; squad2T=0; squad2Decoys=[]; squad2MemberXs=[]; squad2Members=[]; squad2Creatures=[]; squad2DomeR=0; squad2RatR=0;
}


registerMethod(51, { start: __m51_start, resetFn: __m51_reset, loopFn: __m51_loop, phaseNames: ['squad2_decoy', 'squad2_infiltrate', 'squad2_explode', 'squad2_rampage', 'squad2_fight', 'squad2_hold'] });
