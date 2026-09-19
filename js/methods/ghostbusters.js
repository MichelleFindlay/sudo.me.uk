let ghostStarted=false, ghostT=0, ghostPhase='haunt', puftX=0, ghosts=[], protonBeams=[], puftDmg=0, ectoX=0, slimer=null;


// ---- GHOSTBUSTERS: ghosts swarm, then the Stay Puft Marshmallow Man stomps the city ----
const puftSprite=[
  "        .-\"\"\"\"\"-.        ",
  "       / ^^^^^^^ \\       ",   // sailor hat brim
  "      | (o)   (o) |      ",   // eyes
  "      |    ___    |      ",   // smile
  "       \\  \\___/  /       ",
  "     ~~~=========~~~     ",   // blue scarf / red collar
  "    /  M A R S H  \\      ",
  "   |  ###########  |     ",
  "   |  ###########  |     ",
  "   |  ###########  |     ",
  "   / /|         |\\ \\     ",
  "  |_/ |         | \\_|    ",
  "      |__|   |__|        ",
];
const ghostSprite=["(oo)","/~~\\"];
// the Ghostbusters HQ firehouse (stands on the left of the street)
const firehouseSprite=[
  " _____________ ",
  "|  FIREHOUSE  |",
  "| [!NO GHOST!]|",
  "|=============|",
  "| ___________ |",
  "||  GARAGE   ||",
  "||   (O)     ||",
  "||___________||",
];
// Ecto-1 — the converted ambulance with roof light bar & fins
const ectoSprite=[
  "   *!*    ",
  " __=====__",
  "/ECTO-1   \\_",
  "|_[]___[]__|",
  " (O)===(O) ",
];
function ghostInit(){
  ghosts=[]; protonBeams=[]; puftDmg=0; puftX=cx-11;
  ectoX=-14;   // Ecto-1 starts off-screen left, races in
  slimer={ x:cx*0.5, y:6, ph:0, trail:[] };   // Slimer buzzes around the scene
  for(let i=0;i<10;i++){ ghosts.push({ x:(Math.random()*COLS)|0, y:1+((Math.random()*Math.floor(streetRow*0.6))|0), vx:(Math.random()*2-1)*0.6, vy:(Math.random()*2-1)*0.3, ph:Math.random()*6 }); }
}
function ghostStep(t){
  for(const g of ghosts){ g.x+=g.vx; g.y+=Math.sin(t*0.2+g.ph)*0.3; g.ph+=0.3; if(g.x<0)g.x=COLS; if(g.x>COLS)g.x=0; }
  if(t%4===0 && ghosts.length<COLS*0.3){ ghosts.push({ x:(Math.random()*COLS)|0, y:1+((Math.random()*Math.floor(streetRow*0.5))|0), vx:(Math.random()*2-1)*0.6, vy:0, ph:Math.random()*6 }); }
  // Ecto-1 races across, then parks near the firehouse
  ectoX += (ectoX < Math.floor(COLS*0.30)) ? Math.max(1,Math.floor(COLS/26)) : 0;
  // Slimer buzzes around in a wandering loop, leaving a slime trail
  if(slimer){ slimer.ph+=0.18;
    slimer.x = cx + Math.cos(slimer.ph)*COLS*0.28 + Math.sin(slimer.ph*2.3)*6;
    slimer.y = Math.floor(streetRow*0.35) + Math.sin(slimer.ph*1.5)*Math.floor(streetRow*0.22);
    slimer.trail.push({x:Math.round(slimer.x),y:Math.round(slimer.y)}); if(slimer.trail.length>7) slimer.trail.shift();
  }
}
function ghostRender(t, mode){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ectoplasm slime dripping down the buildings
  for(let k=0;k<COLS*0.15;k++){ const c=(Math.random()*COLS)|0, r=(Math.random()*streetRow)|0; if(grid[r] && grid[r][c]===" " && Math.random()<0.4){ setCh(grid,r,c,["~","S","%"][(Math.random()*3)|0]); setMode(mg,r,c,'ghost'); } }

  // the Ghostbusters firehouse HQ standing on the left
  { const fw=firehouseSprite[0].length, fh=firehouseSprite.length, fx=2, ftop=streetRow-fh+1;
    for(let i=0;i<fh;i++){ const art=firehouseSprite[i], r=ftop+i;
      for(let j=0;j<art.length;j++){ const c=fx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'firehouse'); } } }

  // the Stay Puft Marshmallow Man (once he arrives) squashes buildings around him
  if(mode==='puft'){
    const pw=puftSprite[0].length, ph2=puftSprite.length;
    const px=Math.round(puftX), top=streetRow-ph2+1;
    // flatten buildings under/around him
    for(let r=0;r<streetRow;r++){ if(cityGridArr[r]){ let ln=cityGridArr[r].split("");
      for(let c=px;c<px+pw;c++){ if(c>=0&&c<COLS && ln[c]!==" " && Math.random()<0.3) ln[c]=" "; } cityGridArr[r]=ln.join(""); } }
    // re-copy after mutation
    for(let r=0;r<ROWS;r++) grid[r]=cityGridArr[r];
    // redraw firehouse (survives on the left)
    { const fw=firehouseSprite[0].length, fh=firehouseSprite.length, fx=2, ftop=streetRow-fh+1;
      for(let i=0;i<fh;i++){ const art=firehouseSprite[i], r=ftop+i;
        for(let j=0;j<art.length;j++){ const c=fx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'firehouse'); } } }
    // draw Stay Puft
    for(let i=0;i<ph2;i++){ const art=puftSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=px+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue;
        setCh(grid,r,c,art[j]); setMode(mg,r,c,'puft'); } }
    // proton beams zapping up at him from the lower corners (the Ghostbusters!)
    for(const bx of [4, COLS-6]){
      const rightSide=(bx>cx);
      // the ghostbuster: head, body with proton pack, arms holding a raygun aimed UP at Stay Puft
      const gr=streetRow-2;
      setCh(grid,gr-1,bx,"o"); setMode(mg,gr-1,bx,'proton');            // head
      setCh(grid,gr,bx,"#");  setMode(mg,gr,bx,'proton');              // body/pack
      setCh(grid,gr,bx+(rightSide?-1:1),"="); setMode(mg,gr,bx+(rightSide?-1:1),'proton'); // proton pack side
      // the raygun / wand, angled up toward the marshmallow man
      const gunTip = rightSide ? "\\" : "/";
      setCh(grid,gr-1,bx+(rightSide?-1:1),gunTip); setMode(mg,gr-1,bx+(rightSide?-1:1),'proton');
      setCh(grid,gr-2,bx+(rightSide?-2:2),">".replace(">",rightSide?"<":">")); setMode(mg,gr-2,bx+(rightSide?-2:2),'proton');
      // the crackling proton stream from the raygun tip up to Stay Puft
      let cx0=bx+(rightSide?-2:2), cy0=gr-2, tx=px+Math.floor(pw/2), ty=top+3;
      const steps=Math.max(4,Math.round(Math.hypot(tx-cx0,ty-cy0)));
      for(let s=0;s<=steps;s++){ const c=Math.round(cx0+(tx-cx0)*s/steps + Math.sin(s*0.8+t)*1.6), r=Math.round(cy0+(ty-cy0)*s/steps);
        if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.8){ setCh(grid,r,c,["~","*","z","="][(Math.random()*4)|0]); setMode(mg,r,c,'proton'); } }
    }
    // trampled goo on the street
    { let g=grid[streetRow].split(""); for(let c=px;c<px+pw&&c<COLS;c++){ if(Math.random()<0.4) g[c]=["~",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }
  }

  // Ecto-1 parked/racing along the street (light bar flashing)
  { const ew=ectoSprite.length, ex=Math.round(ectoX), etop=streetRow-ectoSprite.length+1;
    for(let i=0;i<ectoSprite.length;i++){ let art=ectoSprite[i]; const r=etop+i;
      // flash the light bar
      if(i===0 && (t%2===0)) art=art.replace(/\*!\*/,'!*!');
      for(let j=0;j<art.length;j++){ const c=ex+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'ecto'); } } }

  // the swarming ghosts (all phases)
  for(const g of ghosts){ const xi=Math.round(g.x), yi=Math.round(g.y);
    for(let i=0;i<ghostSprite.length;i++){ const art=ghostSprite[i], r=yi+i;
      for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'ghost'); } } }

  // Slimer — the green blob ghost — buzzing around with a slime trail
  if(slimer){
    for(const tr of slimer.trail){ if(tr.x>=0&&tr.x<COLS&&tr.y>=0&&tr.y<ROWS){ setCh(grid,tr.y,tr.x,(Math.random()<0.5?"~":".")); setMode(mg,tr.y,tr.x,'ghost'); } }
    const sx=Math.round(slimer.x), sy=Math.round(slimer.y);
    const slSpr=[" ~@@@~ ","(o\\_/o)","\\~VVV~/"," \\___/ "];   // blobby body, eyes, gaping grin, dribbles
    for(let i=0;i<slSpr.length;i++){ const art=slSpr[i], r=sy+i;
      for(let j=0;j<art.length;j++){ const c=sx+j-3; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'slimer'); } }
  }
  return {grid,mg};
}


function __m32_loop(){
if(phase==='ghost'){
    scene.style.textShadow="0 0 8px #a0e0d0";
    if(!ghostStarted){ ghostStarted=true; ghostT=0; ghostPhase='haunt'; ghostInit(); document.body.style.background="#060a0c"; }
    stepRain();
    ghostStep(ghostT);
    if(ghostPhase==='haunt'){
      const {grid,mg}=ghostRender(ghostT,'haunt');
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE CITY IS OVERRUN WITH GHOSTS"; sub.style.color="#c0f0ff"; sub.style.textShadow="0 0 8px #40a080";
      ghostT++;
      if(ghostT<24){ timer=setTimeout(loop,80); }
      else { ghostPhase='puft'; loop(); }
    }else if(ghostPhase==='puft'){
      // the Stay Puft Marshmallow Man arrives and stomps through town
      puftDmg=Math.min(1, puftDmg+0.02);
      const {grid,mg}=ghostRender(ghostT,'puft');
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent= puftDmg<0.6 ? "STAY PUFT STOMPS THROUGH DOWNTOWN" : "NOBODY STEPS ON A CHURCH IN MY TOWN!";
      sub.style.color="#fafaf0"; sub.style.textShadow="0 0 8px #e02020";
      ghostT++;
      if(!(puftDmg>=1 && ghostT>70)){ timer=setTimeout(loop,80); }
      else { phase='ghost_hold'; loop(); }
    }
  }else if(phase==='ghost_hold'){
    stage.classList.remove('shake');
    ghostStep(ghostT);
    const {grid,mg}=ghostRender(ghostT,'puft');
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="toasted, and covered in marshmallow. — press RESET"; sub.style.color="#fafaf0"; sub.className="";
    ghostT++;
    timer=setTimeout(loop,140);
  }
}


function __m32_start(){
      // MARSHMALLOW WHITE -> Ghostbusters
    attackMode='ghost';
    cmd.style.color="#f0f0e0"; cmd.style.textShadow="0 0 20px #e02020";
    ghostStarted=false; phase='ghost';
  
}


function __m32_reset(){
  ghostStarted=false; ghostT=0; ghostPhase='haunt'; puftX=0; ghosts=[]; protonBeams=[]; puftDmg=0; ectoX=0; slimer=null;
}


registerMethod(32, { start: __m32_start, resetFn: __m32_reset, loopFn: __m32_loop, phaseNames: ['ghost', 'ghost_hold'] });
