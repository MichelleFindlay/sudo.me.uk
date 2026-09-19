let nautStarted=false, nautT=0, nautPhase='descend', nautX=0, nautY=0, nautDmg=0, brainPods=[], nautImpactR=0;
let nautDiveSteps=0, nautStartX=0, nautStartY=0, nautDiveT=0;


// ---- BALDUR'S GATE: a mind flayer nautiloid crashes through the city ----
// the squid-ship: bulbous fleshy body up top, curling tentacles trailing beneath
const nautSprite=[
  "        _.-~@@@~-._        ",
  "     .-~ @@#####@@ ~-.     ",
  "   /  @#############@  \\   ",
  "  | @###############@  |  ",
  "   \\ @#####( O )#####@ /   ",
  "    '~-.@#########@.-~'    ",
  "    (  )~)~( | )~(~(  )    ",   // tentacle roots
  "   ) ( ~) ( ~ ) ( ~) ( )   ",   // dangling tentacles
  "  ~ ) ~( )~ ~ ~( )~ )~ ( ~ ",
];
function nautInit(){
  nautDmg=0; brainPods=[];
  nautX=-16; nautY=-4;   // enters from upper-left, out of a portal
}
function nautRender(t, mode, nx, ny){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const sw=nautSprite[0].length, sh=nautSprite.length;
  const sx=Math.round(nx), sy=Math.round(ny);

  // fiery planar portal it emerged from (upper-left), swirling
  if(mode!=='crashed'){
    const pc=Math.floor(COLS*0.12), pr=Math.floor(streetRow*0.18);
    for(let dr=-3;dr<=3;dr++)for(let dc=-5;dc<=5;dc++){ if(dr*dr+dc*dc*0.3<12){ const c=pc+dc,r=pr+dr; if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.6){ setCh(grid,r,c,["#","%","@","~","*"][(Math.random()*5)|0]); setMode(mg,r,c,'illithid'); } } }
  }

  // the ship smashes buildings around and beneath it as it careens through
  const reach=8;
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=sx-2;c<sx+sw+2;c++){ if(c<0||c>=COLS)continue;
      // only destroy where the ship overlaps this row (roughly)
      if(r>=sy && r<=sy+sh+2 && ln[c]!==" " && Math.random()<0.6) ln[c]=" ";
    }
    // trailing wreckage behind it (to the left, where it's been)
    if(mode!=='descend'){ for(let c=0;c<sx;c++){ if(ln[c]!==" " && Math.random()<0.2) ln[c]=" "; } }
    grid[r]=ln.join(""); }

  // psionic tadpoles / debris raining from the underside
  for(let k=0;k<COLS*0.1;k++){ const c=sx+((Math.random()*sw)|0), r=sy+sh+((Math.random()*4)|0); if(c>=0&&c<COLS&&r>=0&&r<streetRow){ setCh(grid,r,c,["S","e","~","."][(Math.random()*4)|0]); setMode(mg,r,c,'illithid'); } }

  // draw the nautiloid
  for(let i=0;i<sh;i++){ const art=nautSprite[i], r=sy+i;
    for(let j=0;j<art.length;j++){ const c=sx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'nautiloid'); } }
  // the central psionic eye glow
  const eyeC=sx+Math.floor(sw/2), eyeR=sy+4;
  if(eyeR>=0&&eyeR<ROWS){ setCh(grid,eyeR,eyeC,"O"); setMode(mg,eyeR,eyeC,'illithid'); }

  // once crashed, wedged in the ruins with lingering portal glow + rubble mound
  if(mode==='crashed'){
    { let g=grid[streetRow].split(""); for(let c=Math.max(0,sx-4);c<Math.min(COLS,sx+sw+4);c++){ if(Math.random()<0.5) g[c]=[".",",","_","#"][(Math.random()*4)|0]; } grid[streetRow]=g.join(""); }
    for(let k=0;k<COLS*0.08;k++){ const c=sx+((Math.random()*sw)|0), r=sy+((Math.random()*sh)|0); if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,(Math.random()<0.5?"*":".")); setMode(mg,r,c,'illithid'); } }
  }
  return {grid,mg};
}
// the violent impact: expanding shockwave that blows the city outward from ground zero
function nautImpact(R, cxi){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // obliterate everything within the blast radius
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cxi-R;c<=cxi+R;c++){ if(c<0||c>=COLS)continue; if(Math.random()<0.75) ln[c]=" "; }
    // fainter damage rippling past the blast front
    for(let c=0;c<COLS;c++){ const d=Math.abs(c-cxi); if(d>R && d<R+8 && ln[c]!==" " && Math.random()<0.4) ln[c]=(Math.random()<0.4?"#":" "); }
    grid[r]=ln.join(""); }
  // psionic fireball dome at ground zero
  const dome=Math.min(streetRow, Math.floor(R*0.9));
  for(let rr=streetRow;rr>=streetRow-dome;rr--){ const frac=(streetRow-rr)/Math.max(1,dome);
    const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.05);
    for(let j=-w;j<=w;j++){ if(Math.abs(j)>w-2&&Math.random()<0.4)continue; if(Math.random()<0.12)continue;
      const c=cxi+j; if(c<0||c>=COLS)continue; setCh(grid,rr,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,rr,c, Math.random()<0.5?'illithid':'nautiloid'); } }
  // shockwave ring markers along the ground
  for(const dir of [-1,1]){ const c=cxi+dir*R; if(c>=0&&c<COLS){ setCh(grid,streetRow,c,dir>0?">":"<"); setMode(mg,streetRow,c,'illithid'); setCh(grid,streetRow-1,c,dir>0?")":"("); setMode(mg,streetRow-1,c,'illithid'); } }
  // flung debris + tadpoles
  for(let k=0;k<COLS*0.3;k++){ const c=cxi+(((Math.random()*R*2)|0)-R), r=streetRow-((Math.random()*Math.floor(streetRow*0.7))|0);
    if(c>=0&&c<COLS){ setCh(grid,r,c,["*","'",".","S","e"][(Math.random()*5)|0]); setMode(mg,r,c,'illithid'); } }
  return {grid,mg};
}


function __m28_loop(){
if(phase==='nautiloid'){
    scene.style.textShadow="0 0 10px #9a5ad0";
    if(!nautStarted){ nautStarted=true; nautT=0; nautPhase='descend'; nautInit(); document.body.style.background="#0a0616"; }
    const gzX=cx+Math.floor(COLS*0.12);                 // ground-zero column
    const endX=gzX-Math.floor(nautSprite[0].length/2), endY=streetRow-nautSprite.length+2;  // ship buried into the street
    if(nautPhase==='descend'){
      stepRain();
      // STEEP, FAST plunge along a straight line to the exact crash point
      if(nautDiveSteps===0){ nautDiveSteps = 1; nautStartX = nautX; nautStartY = nautY; }
      nautDiveT = (nautDiveT||0) + 1;
      const totalDive = Math.max(6, Math.floor(ROWS*0.5));
      const f = Math.min(1, nautDiveT/totalDive);
      const fe = f*f;                                     // ease-in = accelerating dive
      nautX = Math.round(nautStartX + (endX - nautStartX)*fe);
      nautY = Math.round(nautStartY + (endY - nautStartY)*fe);
      const {grid,mg}=nautRender(nautT,'descend',nautX,nautY);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent="A NAUTILOID PLUMMETS OUT OF A PLANAR PORTAL"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #2a8a7a";
      nautT++;
      if(f<1){ timer=setTimeout(loop,40); }               // fast frames = fast dive
      else { nautPhase='impactflash'; nautX=endX; nautY=endY; loop(); }
    }else if(nautPhase==='impactflash'){
      // slammed into the ground — blinding psionic flash
      flash.style.transition="opacity 0.02s"; flash.style.opacity=1;
      document.body.style.background="#e0d0ff"; scene.innerHTML=""; sub.textContent="* IMPACT *";
      stage.classList.add('shake');
      nautImpactR=2;
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.5s"; flash.style.opacity=0; document.body.style.background="#160a1e"; nautPhase='impact'; loop(); }, 180);
    }else if(nautPhase==='impact'){
      // massive shockwave blows the city outward from ground zero
      const {grid,mg}=nautImpact(nautImpactR, gzX);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent="THE CITY IS BLOWN APART BY THE CRASH"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 10px #40e0c0";
      nautImpactR+=Math.max(3,Math.floor(COLS/16));
      if(nautImpactR < Math.floor(COLS*0.6)){ timer=setTimeout(loop,55); }
      else { nautPhase='crashed'; nautT=0; loop(); }
    }else if(nautPhase==='crashed'){
      // the wreck settles, half-buried and smoking in the crater
      const {grid,mg}=nautRender(nautT,'crashed',endX,endY);
      scene.innerHTML=paint(grid,mg,'city');
      if(nautT<8) stage.classList.add('shake'); else stage.classList.remove('shake');
      sub.textContent="THE MIND FLAYER SHIP LIES SMOKING IN THE CRATER"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #2a8a7a";
      nautT++;
      if(nautT<40){ timer=setTimeout(loop,90); }
      else { phase='nautiloid_hold'; loop(); }
    }
  }else if(phase==='nautiloid_hold'){
    stage.classList.remove('shake');
    const gzX=cx+Math.floor(COLS*0.12);
    const endX=gzX-Math.floor(nautSprite[0].length/2), endY=streetRow-nautSprite.length+2;
    const {grid,mg}=nautRender(nautT,'crashed',endX,endY);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the wreck smoulders in the crater. roll for initiative. — press RESET"; sub.style.color="#c090ff"; sub.className="";
    nautT++;
    timer=setTimeout(loop,150);
  }
}


function __m28_start(){
      // ILLITHID PURPLE -> Baldur's Gate nautiloid
    attackMode='nautiloid';
    cmd.style.color="#9a5ad0"; cmd.style.textShadow="0 0 22px #2a8a7a";
    nautStarted=false; phase='nautiloid';
  
}


function __m28_reset(){
  nautStarted=false; nautT=0; nautPhase='descend'; nautX=0; nautY=0; nautDmg=0; brainPods=[]; nautImpactR=0;
  nautDiveSteps=0; nautStartX=0; nautStartY=0; nautDiveT=0;
}


registerMethod(28, { start: __m28_start, resetFn: __m28_reset, loopFn: __m28_loop, phaseNames: ['nautiloid', 'nautiloid_hold'] });
