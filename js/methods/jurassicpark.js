let dinoStarted=false, dinoT=0, rex=null, raptors=[], dinoDmg=0;


// ---- JURASSIC PARK SAN DIEGO: a T. rex rampages downtown, raptors roam the streets ----
// big T. rex sprite (drawn bottom-anchored, feet on the street)
const rexSprite=[
  "            __ ",
  "          _/ o\\_ ",
  "         / VVVV \\ ",
  "     ___/'------ ",
  "   _/   \\        ",
  "  / /|    \\___   ",
  " |_/ |   /|   \\  ",
  "     |  / |    | ",
  "    _|  \\ |   /| ",
  "   /_|   \\|__/ | ",
  "  (__)   /  \\  | ",
  "        (_)  (_)  ",
];
const raptorSprite=["<^== O>","  / \\ \\"];   // small raptor
function dinoInit(){
  dinoDmg=0;
  rex={ x:COLS+6, dir:-1, spd:0.7, step:0 };     // T. rex enters from the right, walks left
  raptors=[];
  for(let i=0;i<4;i++){ raptors.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.6+Math.random()*1.0, ph:Math.random()*6 }); }
}
function dinoStep(t){
  rex.x+=rex.spd*rex.dir; rex.step+=0.3;
  if(rex.x<-14){ rex.x=COLS+6; }                 // loop the rex across town
  for(const r of raptors){ r.x+=r.spd*r.dir; r.ph+=0.4; if(r.x<0)r.x=COLS; if(r.x>COLS)r.x=0; if(Math.random()<0.02)r.dir*=-1; }
  // the rex flattens buildings it walks through; damage spreads behind it
  dinoDmg=Math.min(COLS, dinoDmg+ (t%2===0?1:0));
}
function dinoRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ---- JURASSIC PARK SAN DIEGO amphitheater/banner in the background (left) ----
  const banner="JURASSIC PARK  -  SAN DIEGO";
  const bC=2;
  for(let j=0;j<banner.length;j++){ const c=bC+j; if(c>=0&&c<COLS && banner[j]!==" "){ setCh(grid,1,c, banner[j]); setMode(mg,1,c,'jpsign'); } }
  // amphitheater arch under the banner
  const arch=[" /=========\\ ","/  GATE 1   \\","|===========|"];
  for(let i=0;i<arch.length;i++){ for(let j=0;j<arch[i].length;j++){ const c=bC+j; const r=2+i; if(c<COLS && arch[i][j]!==" "){ setCh(grid,r,c,arch[i][j]); setMode(mg,r,c,'jpsign'); } } }

  // ---- the rex smashes a swath of buildings around its position ----
  const rexC=Math.round(rex.x)+5;
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=rexC;c<COLS;c++){ if(Math.abs(c-rexC)<3 && ln[c]!==" " && Math.random()<0.6) ln[c]=" "; }  // right where it steps
    // trailing wreckage across everywhere it's already walked (to the right of it)
    for(let c=rexC+6;c<COLS;c++){ if(ln[c]!==" " && Math.random()<0.25) ln[c]=" "; }
    grid[r]=ln.join(""); }
  // rubble + cracked road under the rampage
  { let g=grid[streetRow].split(""); for(let c=rexC;c<COLS;c++){ if(Math.random()<0.3) g[c]=[".",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }

  // ---- draw the T. rex, bottom-anchored ----
  const rexTop=streetRow-rexSprite.length+1;
  const bob=(Math.sin(rex.step)>0)?0:1;
  for(let i=0;i<rexSprite.length;i++){ const art=rexSprite[i], r=rexTop+i-bob;
    for(let j=0;j<art.length;j++){ const c=Math.round(rex.x)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'dino'); } }
  // ROAR! near its head
  if(t%12<3){ const roar="ROAAAR!"; const hc=Math.round(rex.x)+14; for(let j=0;j<roar.length;j++){ const c=hc+j; if(c>=0&&c<COLS){ setCh(grid,Math.max(0,rexTop-1),c,roar[j]); setMode(mg,Math.max(0,rexTop-1),c,'dino'); } } }

  // ---- raptors darting along the street ----
  const rr=streetRow-1;
  for(const rp of raptors){
    const xi=Math.round(rp.x), bob2=(Math.sin(rp.ph)>0)?0:1;
    const spr = rp.dir>0 ? "<^==Oo>" : "<oO==^>";
    for(let j=0;j<spr.length;j++){ const c=xi+j-3; if(c<0||c>=COLS)continue; if(spr[j]===" ")continue; setCh(grid,rr-bob2,c,spr[j]); setMode(mg,rr-bob2,c,'dino'); }
    // legs
    setCh(grid,rr+1-bob2 < ROWS ? rr : rr, xi, "^");
  }
  // fleeing people (tiny) scattering from the dinos
  for(let k=0;k<Math.max(2,Math.floor(COLS*0.04));k++){ const c=((t*2+k*13)%COLS); if(Math.abs(c-rexC)>8){ setCh(grid,streetRow-1,c,"!"); } }
  return {grid,mg};
}


function __m25_loop(){
if(phase==='dino'){
    scene.style.textShadow="0 0 8px #8ac030";
    if(!dinoStarted){ dinoStarted=true; dinoT=0; dinoInit(); document.body.style.background="#060c04"; }
    stepRain();
    dinoStep(dinoT);
    const {grid,mg}=dinoRender(dinoT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(dinoDmg>COLS*0.3) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= dinoDmg<COLS*0.5 ? "A T. REX IS LOOSE IN SAN DIEGO" : "THE DINOSAURS RUN WILD IN THE CITY";
    sub.style.color="#aae050"; sub.style.textShadow="0 0 8px #3a6a10";
    dinoT++;
    if(!(dinoDmg>=COLS && dinoT>50)){ timer=setTimeout(loop,80); }
    else { phase='dino_hold'; loop(); }
  }else if(phase==='dino_hold'){
    stage.classList.remove('shake');
    dinoStep(dinoT);
    const {grid,mg}=dinoRender(dinoT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the dinosaurs have the city now. — press RESET"; sub.style.color="#aae050"; sub.className="";
    dinoT++;
    timer=setTimeout(loop,140);
  }
}


function __m25_start(){
      // JUNGLE GREEN -> Jurassic Park San Diego
    attackMode='dino';
    cmd.style.color="#8ac030"; cmd.style.textShadow="0 0 22px #3a6a10";
    dinoStarted=false; phase='dino';
  
}


function __m25_reset(){
  dinoStarted=false; dinoT=0; rex=null; raptors=[]; dinoDmg=0;
}


registerMethod(25, { start: __m25_start, resetFn: __m25_reset, loopFn: __m25_loop, phaseNames: ['dino', 'dino_hold'] });
