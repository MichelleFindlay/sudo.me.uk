let titanicStarted=false, titanicT=0, shipX=0, titanicSmoke=[], titanicAngle=0;


// ---- TITANIC: the great liner never stopped and ploughs straight through the city ----
// The ship is tall (funnels + superstructure + hull). Drawn with its bow at shipX (moving right).
function titanicSprite(){
  // built relative to a hull length; funnels sit atop the superstructure
  return [
    "        |    |    |    |            ",   // funnel tops
    "       .|.  .|.  .|.  .|.           ",
    "      _|H|__|H|__|H|__|H|__         ",   // funnels (banded)
    "   __/=====================\\___     ",   // boat deck
    "  /  o  o  o  o  o  o  o  o   \\__    ",   // lifeboats / superstructure
    " / R.M.S.  T I T A N I C  ..... \\_  ",   // name + portholes
    "/_______________________________ \\ ",   // hull top
    "\\  . . . . . . . . . . . . . . .  =>",   // hull w/ bow point (=>)
    " \\_____________________________/    ",   // hull bottom / keel
  ];
}
// permanently demolishes the base city up to column bx — mutates cityGridArr so the
// wreckage sticks around instead of flickering back to intact buildings next frame.

function titanicRender(bx){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(bx);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=titanicSprite();
  const sh=spr.length, sw=spr[0].length;
  const shipLeft=Math.round(bx)-sw;               // bx = bow (right edge) column
  const keelRow=streetRow;                        // keel rides along the street
  const top=keelRow-sh+1;

  // funnel smoke billowing back over the city
  if(titanicT%2===0){ for(let f=0;f<4;f++){ const fc=shipLeft+7+f*7; titanicSmoke.push({x:fc, y:top-1, vx:-(0.3+Math.random()*0.5), vy:-(0.2+Math.random()*0.4), life:20}); } }
  for(const s of titanicSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,(s.life>10?"@":".")); setMode(mg,r,c,'steam'); } }
  titanicSmoke=titanicSmoke.filter(s=>s.life>0);

  // draw the ship
  for(let i=0;i<sh;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=shipLeft+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'ship'); } }

  // crumpling buildings toppling at the bow (impact splinters)
  for(let k=0;k<COLS*0.12;k++){ const c=Math.round(bx)+((Math.random()*5)|0), r=streetRow-((Math.random()*Math.floor(streetRow*0.7))|0);
    if(c>=0&&c<COLS){ setCh(grid,r,c,["#","/","\\","*"][(Math.random()*4)|0]); setMode(mg,r,c,'rubble'); } }
  return {grid,mg};
}

// ---- TITANIC WRECK: once wedged to a stop it keels over, listing hard onto its side ----
// angleDeg: 0 upright .. ~26, how far it has rolled over. The hull stays intact as one rigid
// piece, pivoting around the bow where it's jammed into the ruins.
function titanicWreckRender(bx, angleDeg){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(COLS);                          // the whole plough path stays permanently wrecked
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=titanicSprite();
  const sh=spr.length, sw=spr[0].length;
  const aspect=2;                                 // terminal cells are roughly twice as tall as wide

  // thinning funnel smoke, still drifting off the capsized hull
  if(titanicT%3===0){ const fc=Math.round(bx)-sw*0.4-Math.random()*sw*0.3; titanicSmoke.push({x:fc, y:streetRow-sh*0.6, vx:-(0.2+Math.random()*0.4), vy:-(0.2+Math.random()*0.3), life:16}); }
  for(const s of titanicSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,(s.life>8?"@":".")); setMode(mg,r,c,'steam'); } }
  titanicSmoke=titanicSmoke.filter(s=>s.life>0);

  // rotate the whole hull as one rigid piece around where the bow is wedged into the ruins
  const pr=sh-1, pc=sw-3;
  const pivotRow=streetRow, pivotCol=Math.round(bx)-3;
  const phi=angleDeg*Math.PI/180, cosP=Math.cos(phi), sinP=Math.sin(phi);
  for(let i=0;i<sh;i++){ const art=spr[i];
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue;
      const X=j-pc, Y=-(i-pr)*aspect;
      const Xr=X*cosP-Y*sinP, Yr=X*sinP+Y*cosP;
      const c=Math.round(pivotCol+Xr), r=Math.round(pivotRow-Yr/aspect);
      if(c<0||c>=COLS||r<0||r>=ROWS)continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,'ship'); } }

  return {grid,mg};
}


function __m27_loop(){
if(phase==='titanic'){
    scene.style.textShadow="0 0 8px #5aa0d0";
    if(!titanicStarted){ titanicStarted=true; titanicT=0; shipX=-4; titanicSmoke=[]; document.body.style.background="#040a12"; }
    stepRain();
    const stopAt=COLS-3;                    // bow halts against the last building at the far edge
    shipX=Math.min(stopAt, shipX+Math.max(1,Math.floor(COLS/40)));
    const arrived=(shipX>=stopAt);
    const {grid,mg}=titanicRender(shipX);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(!arrived) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= arrived ? "…AND THEN IT STOPPED." : (shipX<cx ? "THE TITANIC NEVER STOPPED — FULL STEAM AHEAD" : "THE GREAT LINER PLOUGHS THROUGH THE CITY");
    sub.style.color="#8ac0e0"; sub.style.textShadow="0 0 8px #103a5a";
    titanicT++;
    if(!(arrived && titanicT>14)){ timer=setTimeout(loop,70); }     // pause ~1s once it stops
    else { phase='titanic_topple'; titanicT=0; loop(); }
  }else if(phase==='titanic_topple'){
    stage.classList.add('shake');
    titanicAngle=Math.min(26, titanicAngle+2.6);
    const {grid,mg}=titanicWreckRender(COLS-3, titanicAngle);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="IT KEELS OVER, LISTING HARD TO PORT";
    sub.style.color="#8ac0e0"; sub.style.textShadow="0 0 8px #103a5a";
    titanicT++;
    if(!(titanicAngle>=26 && titanicT>10)){ timer=setTimeout(loop,80); }
    else { phase='titanic_hold'; loop(); }
  }else if(phase==='titanic_hold'){
    stage.classList.remove('shake');
    // the wreck lies motionless, capsized in the ruins
    const {grid,mg}=titanicWreckRender(COLS-3, titanicAngle);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the wreck lies capsized in the ruins. — press RESET"; sub.style.color="#8ac0e0"; sub.className="";
    titanicT++;
    timer=setTimeout(loop,150);
  }
}


function __m27_start(){
      // OCEAN BLUE -> Titanic
    attackMode='titanic';
    cmd.style.color="#5aa0d0"; cmd.style.textShadow="0 0 22px #103a5a";
    titanicStarted=false; phase='titanic';
  
}


function __m27_reset(){
  titanicStarted=false; titanicT=0; shipX=0; titanicSmoke=[]; titanicAngle=0;
}


registerMethod(27, { start: __m27_start, resetFn: __m27_reset, loopFn: __m27_loop, phaseNames: ['titanic', 'titanic_topple', 'titanic_hold'] });
