let mtStartedFlag=false, mtT=0, mtCol=0, mtFallers=[], mtBodies=[], mtBlastR=0;


// ---- TOMSKA: everybody does the flop off the rooftops, right onto the mine turtle ----
const mineTurtleSprite=[
  " ^ ^ ^",
  "(=====)",
  "o|   |o",
];
// drops a new flopper off a random rooftop; `doomed` marks the one fated to land on the turtle
function mtSpawnFaller(mtCol, doomed){
  if(cityGridArr.length!==ROWS) return;
  const c=doomed?mtCol:((Math.random()*COLS)|0);
  let roofRow=streetRow;
  for(let r=0;r<streetRow;r++){ if(cityGridArr[r] && cityGridArr[r][c]!==" "){ roofRow=r; break; } }
  mtFallers.push({x:c, y:Math.max(0,roofRow-1), vy:0.3+Math.random()*0.3, doomed:!!doomed, speaks:true});
}
// advances fallers + settled bodies; landed fallers become bodies (returns true if the doomed one just landed)
function mtStep(spawnRandom){
  if(spawnRandom && Math.random()<0.35 && mtFallers.length<8) mtSpawnFaller();
  let doomedLanded=false;
  for(const f of mtFallers){ f.y+=f.vy; f.vy+=0.15;
    if(f.y>=streetRow){ f.y=streetRow; f.landed=true; mtBodies.push({x:f.x, y:streetRow, vx:0, vy:0, flying:false}); if(f.doomed) doomedLanded=true; } }
  mtFallers=mtFallers.filter(f=>!f.landed);
  for(const b of mtBodies){ if(!b.flying) continue;
    b.x+=b.vx; b.y+=b.vy; b.vy+=0.2;
    if(b.y>=streetRow){ b.y=streetRow; b.flying=false; b.vx=0; b.vy=0; } }
  return doomedLanded;
}
// the blast flings anyone standing nearby up and outward
function mtTriggerBlast(mtCol){
  for(const b of mtBodies){ const d=b.x-mtCol;
    if(Math.abs(d)<20){ const dir=d===0?(Math.random()<0.5?-1:1):Math.sign(d);
      b.vx=dir*(1+Math.random()*2.5); b.vy=-(1+Math.random()*1.5); b.flying=true; } }
}
// permanently craters the city around the blast — mutates cityGridArr so the wreckage sticks
function mtBlastDemolish(mtCol, r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=mtCol-r;c<=mtCol+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.5) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
  if(cityGridArr[streetRow]){ let g=cityGridArr[streetRow].split("");
    for(let c=mtCol-r;c<=mtCol+r;c++){ if(c>=0&&c<COLS&&Math.random()<0.5) g[c]=["#","%","."][(Math.random()*3)|0]; }
    cityGridArr[streetRow]=g.join(""); }
}
// a little speech bubble with a tail, drawn above a given point if there's room

function mtRender(t, mtCol, showTurtle, blastR){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(blastR>0) mtBlastDemolish(mtCol, Math.round(blastR));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // settled bodies littering the street
  for(const b of mtBodies){ const c=Math.round(b.x), r=Math.round(b.y); const art=(t+c)%2===0?"-o-":"~o~";
    for(let j=0;j<art.length;j++){ const cc=c-1+j; if(cc>=0&&cc<COLS&&r>=0&&r<ROWS){ setCh(grid,r,cc,art[j]); setMode(mg,r,cc,'body'); } } }
  // mid-air flops, tumbling down — shouting the mantra on the way
  for(const f of mtFallers){ const r=Math.round(f.y), c=Math.round(f.x); const art=(t%2===0)?"\\o/":"/o\\";
    for(let j=0;j<art.length;j++){ const cc=c-1+j; if(cc>=0&&cc<COLS&&r>=0&&r<ROWS){ setCh(grid,r,cc,art[j]); setMode(mg,r,cc,'body'); } }
    if(f.speaks) mtDrawBubble(grid,mg,c,r,"EVERYBODY DO THE FLOP!"); }
  // the mine turtle, patiently waiting (and friendly, right up until it isn't)
  if(showTurtle){ const left=mtCol-3, top=streetRow-mineTurtleSprite.length+1;
    for(let i=0;i<mineTurtleSprite.length;i++){ const art=mineTurtleSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'mine'); } }
    mtDrawBubble(grid,mg,mtCol,top,"Hello!"); }
  // the blast itself
  if(blastR>0){ const R=blastR, ground=streetRow, domeH=Math.min(ground,Math.floor(R*0.7));
    for(let r=ground;r>=ground-domeH;r--){ const frac=(ground-r)/Math.max(1,domeH);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=mtCol+j; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'impact'); } } }
  return {grid,mg};
}


function __m42_loop(){
if(phase==='mineturtle'){
    scene.style.textShadow="0 0 8px #4a6ab0";
    if(!mtStartedFlag){
      mtStartedFlag=true; mtT=0; mtCol=cx; mtFallers=[]; mtBodies=[]; mtBlastR=0;
      document.body.style.background="#0a0c10";
      // everybody jumps together — one of them is fated to land right on the turtle
      const n=Math.max(6,Math.floor(COLS/14));
      const doomedIdx=(Math.random()*n)|0;
      for(let i=0;i<n;i++){ mtSpawnFaller(mtCol, i===doomedIdx); }
    }
    const doomedLanded=mtStep(false);
    const {grid,mg}=mtRender(mtT, mtCol, true, 0);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="EVERYBODY DO THE FLOP";
    sub.style.color="#4a6ab0"; sub.style.textShadow="0 0 8px #203050";
    mtT++;
    if(!doomedLanded){ timer=setTimeout(loop,70); }
    else { mtTriggerBlast(mtCol); phase='mineturtle_blast'; mtT=0; mtBlastR=0; loop(); }
  }else if(phase==='mineturtle_blast'){
    stage.classList.add('shake');
    mtStep(false);
    mtBlastR=Math.min(14, mtBlastR+1.2);
    const {grid,mg}=mtRender(mtT, mtCol, false, mtBlastR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="MINE TURTLE!";
    sub.style.color="#ff6a2a"; sub.style.textShadow="0 0 10px #ff2a00";
    mtT++;
    if(mtBlastR<14){ timer=setTimeout(loop,60); }
    else { phase='mineturtle_hold'; loop(); }
  }else if(phase==='mineturtle_hold'){
    stage.classList.remove('shake');
    mtStep(false);
    const {grid,mg}=mtRender(mtT, mtCol, false, 0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="mine turtle. — press RESET"; sub.style.color="#4a6ab0"; sub.className="";
    mtT++;
    timer=setTimeout(loop,150);
  }
}


function __m42_start(){
      // FLOP BLUE -> Mine Turtle
    attackMode='mineturtle';
    cmd.style.color="#6a8ad0"; cmd.style.textShadow="0 0 20px #203050";
    mtStartedFlag=false; phase='mineturtle';
  
}


function __m42_reset(){
  mtStartedFlag=false; mtT=0; mtCol=0; mtFallers=[]; mtBodies=[]; mtBlastR=0;
}


registerMethod(42, { start: __m42_start, resetFn: __m42_reset, loopFn: __m42_loop, phaseNames: ['mineturtle', 'mineturtle_blast', 'mineturtle_hold'] });
