let bttfStarted=false, bttfT=0, bttfPhase='drive', deloX=0, deloSpeed=0, fireTrail=[], westCity=null;
let tourIdx=0, tourScene=null, tourHold=0, bttfTour=[];


// ---- BACK TO THE FUTURE: a DeLorean hits 88mph, and the city becomes the Old West ----
const deloSprite=[
  "  ___________ ",
  " /_|__DeLorean\\_ ",
  "(o)==========(o)",
];
// ---- era scene builders for the time-travel tour ----
// each returns {grid, mode} — a full scene for one destination year.
function eraStreetBase(mode){
  const grid=blankGrid(ROWS);
  return grid;
}
// 1955 — pastel small town: diner, theater marquee, clock tower
function build1955(){
  const grid=blankGrid(ROWS);
  const shops=[
    [ "  ______________  ","  | LOU'S  CAFE |  ","  |==o=o=o=o=o==|  ","  | [] .  . [] |  ","  |__|_DINER_|__|  " ],
    [ "   _____________   ","  | TOWN THEATRE |  ","  |=marquee=====|  ","  | NOW PLAYING |  ","  |__[]___[]____|  " ],
    [ "   __________   ","  | HILL VALLEY|  ","  | HARDWARE  |  ","  | []  .  [] |  ","  |__|____|___|  " ],
    [ "  ___________  ","  | WESTERN  |  ","  | AUTO     |  ","  | [] . [] |  ","  |__|___|__|  " ],
    [ "   ________   ","  | TEXACO |  ","  |  (o)   |  ","  | _||_  |  ","  |_|__|__|  " ],
  ];
  let x=1;
  while(x<COLS-4){ const s=shops[(Math.random()*shops.length)|0]; const w=Math.max(...s.map(r=>r.length)), H=s.length, top=streetRow-H;
    for(let i=0;i<H;i++){ const a=s[i]; for(let j=0;j<a.length;j++){ const c=x+j; if(c<COLS && a[j]!==" ") setCh(grid,top+i,c,a[j]); } }
    x+=w+1+((Math.random()*2)|0); }
  // clock tower centre-back
  const ct=Math.floor(COLS*0.5), ctTop=streetRow-9;
  const tower=["  ___  "," |[o]| "," | : | "," |###| "," |###| "];
  for(let i=0;i<tower.length;i++){ for(let j=0;j<tower[i].length;j++){ const c=ct+j-3; if(c>=0&&c<COLS&&tower[i][j]!==" ")setCh(grid,ctTop+i,c,tower[i][j]); } }
  grid[streetRow]="~".repeat(COLS);
  // '50s cars parked along the kerb
  for(let n=0;n<Math.max(3,Math.floor(COLS/16));n++){ const c=4+((Math.random()*(COLS-8))|0); setCh(grid,streetRow-1,c,"o"); setCh(grid,streetRow-1,c+1,"="); setCh(grid,streetRow-1,c+2,"o"); }
  return {grid, mode:'era50s'};
}
// 1985 — the normal modern city (reuse the base skyline)
function build1985(){
  if(cityGridArr.length!==ROWS) cityGridArr=buildCity();
  return {grid: cityGridArr.slice(), mode:'city'};
}
// 2015 — the future: skyway, flying cars, hover-everything, holograms
function build2015(){
  if(cityGridArr.length!==ROWS) cityGridArr=buildCity();
  const grid=cityGridArr.slice();
  // neon-ify the skyline tops
  for(let r=0;r<streetRow;r++){ let ln=grid[r].split(""); for(let c=0;c<COLS;c++){ if(ln[c]==="."||ln[c]===":"){ if(Math.random()<0.5) ln[c]=(Math.random()<0.5?"=":"o"); } } grid[r]=ln.join(""); }
  // elevated skyway across the middle
  const skyRow=Math.floor(streetRow*0.45);
  for(let c=0;c<COLS;c++){ setCh(grid,skyRow,c,(c%4===0?"H":"=")); }
  // flying cars zipping along the skyway and above
  for(let n=0;n<Math.max(4,Math.floor(COLS/12));n++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*(skyRow))|0); const car=(Math.random()<0.5?"<oO>":"<@=>"); for(let j=0;j<car.length;j++){ const cc=c+j; if(cc<COLS) setCh(grid,r,cc,car[j]); } }
  // hologram sign
  const holo="HOLOMAX  JAWS 19", hc=Math.floor(COLS*0.5)-Math.floor(holo.length/2);
  for(let j=0;j<holo.length;j++){ const c=hc+j; if(c>=0&&c<COLS && holo[j]!==" ") setCh(grid,2,c,holo[j]); }
  grid[streetRow]="=".repeat(COLS);
  return {grid, mode:'era2015'};
}
// 1985-A — Biff's "Hell Valley": the Pleasure Paradise casino, fires, chaos
function buildHell(){
  if(cityGridArr.length!==ROWS) cityGridArr=buildCity();
  const grid=cityGridArr.slice();
  // torch half the skyline into grimy fiery ruin
  for(let r=0;r<streetRow;r++){ let ln=grid[r].split(""); for(let c=0;c<COLS;c++){ if(ln[c]!==" " && Math.random()<0.3) ln[c]=(Math.random()<0.4?"#":" "); } grid[r]=ln.join(""); }
  // the huge BIFF'S PLEASURE PARADISE casino tower, centre
  const bc=Math.floor(COLS*0.5), bh=Math.min(streetRow-2, 14);
  const casino=[
    "   ______________   ",
    "  |  BIFF'S  $$$  |  ",
    "  | PLEASURE PARA |  ",
    "  |  D I S E  ####|  ",
    "  |==o==o==o==o===|  ",
    "  |  [] $$ [] $$  |  ",
    "  |===============|  ",
    "  |  $$ [] $$ []  |  ",
    "  |===============|  ",
    "  |  [] $$ [] $$  |  ",
    "  |__|_|___|_|___|  " ];
  const top=streetRow-casino.length;
  for(let i=0;i<casino.length;i++){ for(let j=0;j<casino[i].length;j++){ const c=bc+j-10; if(c>=0&&c<COLS&&casino[i][j]!==" ")setCh(grid,top+i,c,casino[i][j]); } }
  // fires + smoke across the streets
  for(let k=0;k<COLS*0.4;k++){ const c=(Math.random()*COLS)|0, r=streetRow-((Math.random()*4)|0); setCh(grid,r,c,["#","@","%","'"][(Math.random()*4)|0]); }
  grid[streetRow]="#".repeat(COLS);
  return {grid, mode:'hell'};
}
function eraMode(grid, mode){
  const mg=modeGridFill(ROWS,COLS,mode);
  return mg;
}

// build a wooden Old-West town with railroad tracks (cached so it stays stable)
function buildWest(){
  const grid=blankGrid(ROWS);

  // ---- sky: sun/moon + a few stars ----
  for(let k=0;k<Math.floor(COLS*0.15);k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*3)|0); setCh(grid,r,c,(Math.random()<0.5?"*":".")); }
  // big low sun on the right
  const sunC=Math.floor(COLS*0.85), sunR=3;
  for(let dr=-1;dr<=1;dr++)for(let dc=-2;dc<=2;dc++){ if(Math.abs(dr)+Math.abs(dc)<=2){ setCh(grid,sunR+dr,sunC+dc,"*"); } }

  // ---- detailed storefronts, varied width & height, with false fronts ----
  // each template: array of text rows (top→bottom), drawn bottom-anchored to the boardwalk
  const shops=[
    // SALOON — tall false front, swinging doors, lantern
    [ "   _______________   ",
      "  /  T H E  G O L D \\  ",
      "  |   N U G G E T    | ",
      "  |=================| ",
      "  | []   SALOON   []| ",
      "  |   .---------.   | ",
      "  |   | []   [] |   | ",
      "  |___|  ) | (  |___| ",
      "  |[]| o     o |[]| " ],
    // GENERAL STORE
    [ "   ________________  ",
      "  /  GENERAL  STORE\\  ",
      "  |################| ",
      "  | [].  [].  [].  | ",
      "  |----------------| ",
      "  | [] |FEED| | [] | ",
      "  |____|_##_|_|____| ",
      "  |  []   __   []  | " ],
    // BANK — stone-ish, columns
    [ "    ____________   ",
      "   /   B A N K   \\  ",
      "   | || || || || | ",
      "   | ||[$]|| ||  | ",
      "   |=============| ",
      "   |  [].    [].  | ",
      "   |__|__||__|__|_| " ],
    // SHERIFF's office + JAIL
    [ "   ____________  ",
      "  / SHERIFF O \\  ",
      "  |==========| ",
      "  | [#] JAIL | ",
      "  | |#| .--. | ",
      "  |_|#|_|[]|_| " ],
    // HOTEL — two storeys, balcony
    [ "   _________________  ",
      "  /   G R A N D   H \\  ",
      "  |    H O T E L     | ",
      "  |==== balcony =====| ",
      "  | [].  [].  [].  []| ",
      "  |------------------| ",
      "  | []   [DOOR]   [] | ",
      "  |__||__|    |__||__| " ],
    // BLACKSMITH / LIVERY
    [ "   ______________  ",
      "  / LIVERY & IRON\\  ",
      "  |##############| ",
      "  |  (anvil) /\\  | ",
      "  |  _____  |  | | ",
      "  |_|     |_|__|_| " ],
    // small assay office
    [ "   __________  ",
      "  / ASSAY O. \\  ",
      "  |==========| ",
      "  | [].  [] | ",
      "  |__|__|___| " ],
  ];

  let x=1;
  while(x<COLS-6){
    const s=shops[(Math.random()*shops.length)|0];
    const w=Math.max(...s.map(r=>r.length));
    const H=s.length;
    const top=streetRow-H;                        // sits on the boardwalk (row above street)
    for(let i=0;i<H;i++){ const art=s[i]; for(let j=0;j<art.length;j++){ const c=x+j; if(c>=COLS)break; if(art[j]!==" ") setCh(grid,top+i,c,art[j]); } }
    // hanging lantern glow beside some shops
    if(Math.random()<0.5){ setCh(grid,top+H-2,x-1,"o"); }
    x += w + 1 + ((Math.random()*3)|0);           // alley gap
  }

  // ---- water tower on the far side ----
  const wtC=Math.floor(COLS*0.06);
  const wt=[" .--. ","/====\\","|WATER|","|====|"," |||| "," |||| "];
  const wtTop=streetRow-6-4;
  for(let i=0;i<wt.length;i++){ const r=wtTop+i; if(r<0)continue; for(let j=0;j<wt[i].length;j++){ const c=wtC+j; if(c>=0&&c<COLS && wt[i][j]!==" ") setCh(grid,r,c,wt[i][j]); } }

  // ---- boardwalk (raised wooden sidewalk) just above the street ----
  const walkRow=streetRow-1;
  let wr=grid[walkRow].split("");
  for(let c=0;c<COLS;c++){ if(wr[c]===" ") wr[c]=(c%2===0?"_":"="); }
  grid[walkRow]=wr.join("");
  // support posts + hitching rail under the boardwalk
  for(let c=3;c<COLS;c+=9){ setCh(grid,walkRow,c,"|"); }

  // ---- the dusty main street ----
  grid[streetRow]="~".repeat(COLS);

  // ---- railroad tracks running down the street (rails + ties) ----
  const trackRow=streetRow;
  let g=grid[trackRow].split("");
  for(let c=0;c<COLS;c++){ g[c]= (c%3===0)?"H":"="; }           // ties (H) + rails (=)
  grid[trackRow]=g.join("");

  // ---- scenery: cacti, tumbleweeds, horses, barrels along the street ----
  const cactus=["Y","T"];
  for(let n=0;n<Math.max(3,Math.floor(COLS/22));n++){
    const c=4+((Math.random()*(COLS-8))|0);
    // saguaro cactus poking up from the street edge
    const h=1+((Math.random()*2)|0);
    for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,"^"); }
    setCh(grid,streetRow-1-h,c,cactus[(Math.random()*cactus.length)|0]);
  }
  // a couple of horses tied up (m = horse silhouette)
  for(let n=0;n<Math.max(2,Math.floor(COLS/30));n++){
    const c=8+((Math.random()*(COLS-16))|0);
    setCh(grid,streetRow-1,c,"m"); setCh(grid,streetRow-1,c+1,"n");
  }
  // tumbleweeds + barrels
  for(let n=0;n<Math.floor(COLS/16);n++){ const c=(Math.random()*COLS)|0; setCh(grid,streetRow-1,c,(Math.random()<0.5?"o":"*")); }

  return grid;
}
function westMode(grid){
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r]&&grid[r][c]&&grid[r][c]!==" ") setMode(mg,r,c,'west'); }
  return mg;
}
function bttfDrive(dx, speed){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const carRow=streetRow-deloSprite.length+1;
  // flaming tyre-tracks trail left behind (two fiery lines on the road at 88mph)
  for(const f of fireTrail){ if(f.x<0||f.x>=COLS)continue;
    setCh(grid,streetRow,f.x, (Math.random()<0.5?"O":"o")); setMode(mg,streetRow,f.x,'fluxfire');
    if(carRow+2<ROWS){ setCh(grid,streetRow-1,f.x,(Math.random()<0.5?"~":"*")); setMode(mg,streetRow-1,f.x,'fluxfire'); } }
  // the DeLorean
  for(let i=0;i<deloSprite.length;i++){ const art=deloSprite[i], r=carRow+i;
    for(let j=0;j<art.length;j++){ const c=Math.round(dx)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'delorean'); } }
  // speedometer readout above the car
  const spd=Math.min(88,Math.round(speed));
  const label=spd+" MPH";
  const sC=Math.round(dx)+2;
  for(let j=0;j<label.length;j++){ const c=sC+j; if(c>=0&&c<COLS){ setCh(grid,carRow-2,c,label[j]===" "?" ":label[j]); if(label[j]!==" ")setMode(mg,carRow-2,c, spd>=88?'fluxfire':'delorean'); } }
  return {grid,mg};
}


function __m23_loop(){
if(phase==='bttf'){
    scene.style.textShadow="0 0 10px #40d0ff";
    if(!bttfStarted){
      bttfStarted=true; bttfT=0; bttfPhase='drive'; deloX=-14; deloSpeed=0; fireTrail=[]; tourIdx=0;
      // the full trilogy itinerary — each stop is a destination year with its scene
      bttfTour=[
        {yr:"1955", cap:"BTTF (1985→1955) — Hill Valley, past", build:build1955, bg:"#141c22"},
        {yr:"1985", cap:"BTTF (1955→1985) — back home", build:build1985, bg:"#05060d"},
        {yr:"2015", cap:"BTTF II (1985→2015) — the future!", build:build2015, bg:"#0a0a1e"},
        {yr:"1985-A", cap:"BTTF II (2015→1985) — Biff's Hell Valley", build:buildHell, bg:"#1a0604"},
        {yr:"1955", cap:"BTTF II (1985-A→1955) — fix the timeline", build:build1955, bg:"#141c22"},
        {yr:"1985", cap:"BTTF II (1955→1985) — home… then lightning!", build:build1985, bg:"#05060d"},
        {yr:"1955", cap:"BTTF III (1985→1955) — Doc's letter", build:build1955, bg:"#141c22"},
        {yr:"1885", cap:"BTTF III (1955→1885) — the Old West", build:()=>({grid:(westCity=buildWest()) && westCity.slice(), mode:'west'}), bg:"#3a2a18"},
        {yr:"1985", cap:"BTTF III (1885→1985) — finally home!", build:build1985, bg:"#05060d"},
      ];
      document.body.style.background="#05060d";
    }
    if(bttfPhase==='drive'){
      stepRain();
      deloSpeed=Math.min(92, deloSpeed+5);
      deloX+=Math.max(2, Math.floor(deloSpeed/8));
      fireTrail.push({x:Math.round(deloX)}); if(fireTrail.length>COLS) fireTrail.shift();
      const {grid,mg}=bttfDrive(deloX, deloSpeed);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      if(deloSpeed>=88) stage.classList.add('shake'); else stage.classList.remove('shake');
      const dest=bttfTour[tourIdx];
      sub.textContent = deloSpeed<88 ? "TIME CIRCUITS ON — DESTINATION "+dest.yr+" ("+Math.round(deloSpeed)+" MPH)" : "88 MPH — GREAT SCOTT! →  "+dest.yr;
      sub.style.color="#80e0ff"; sub.style.textShadow="0 0 8px #a040ff";
      bttfT++;
      if(deloSpeed>=88 && deloX>cx){ bttfPhase='flux'; loop(); }
      else timer=setTimeout(loop,60);
    }else if(bttfPhase==='flux'){
      flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
      document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="* "+bttfTour[tourIdx].yr+" *";
      stage.classList.add('shake');
      tourScene=bttfTour[tourIdx].build();      // build the destination-year scene during the flash
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.1s"; flash.style.opacity=0; document.body.style.background=bttfTour[tourIdx].bg; bttfPhase='arrive'; deloX=-14; tourHold=0; fireTrail=[]; loop(); }, 200);
    }else if(bttfPhase==='arrive'){
      // show the destination year, DeLorean rolling across it
      const dest=bttfTour[tourIdx];
      if(!tourScene) tourScene=dest.build();
      const grid=tourScene.grid.slice();
      const mg=modeGridFill(ROWS,COLS,tourScene.mode);
      // re-tag scene chars to the era palette (mode grid full-covers by mode already; keep 'city' default for 1985)
      // roll the DeLorean through
      deloX+=Math.max(2,Math.floor(COLS/24));
      const carRow=streetRow-deloSprite.length+1;
      for(let i=0;i<deloSprite.length;i++){ const art=deloSprite[i], r=carRow+i;
        for(let j=0;j<art.length;j++){ const c=Math.round(deloX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'delorean'); } }
      scene.style.textShadow="0 0 8px "+(tourScene.mode==='era2015'?"#30d0ff":tourScene.mode==='hell'?"#ff4a20":"#9a7a5a");
      scene.innerHTML=paint(grid,mg, tourScene.mode==='city'?'city':tourScene.mode);
      stage.classList.remove('shake');
      sub.textContent=dest.yr+" — "+dest.cap; sub.style.color="#80e0ff"; sub.style.textShadow="0 0 8px #a040ff";
      tourHold++;
      // let the car cross AND linger a moment so the era is readable
      if(deloX<COLS+6 || tourHold<14){ timer=setTimeout(loop,90); }
      else {
        tourIdx++;
        if(tourIdx>=bttfTour.length){ phase='bttf_hold'; loop(); }
        else { bttfPhase='drive'; deloX=-14; deloSpeed=0; fireTrail=[]; tourScene=null; loop(); }
      }
    }
  }else if(phase==='bttf_hold'){
    stage.classList.remove('shake');
    // final stop: home in 1985, safe and sound
    const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    scene.style.textShadow="0 0 8px #40d0ff";
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#05060d";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the whole trilogy, done. back home in 1985. — press RESET"; sub.style.color="#80e0ff"; sub.className="";
    bttfT++;
    timer=setTimeout(loop,200);
  }
}


function __m23_start(){
      // FLUX BLUE -> Back to the Future
    attackMode='bttf';
    cmd.style.color="#40d0ff"; cmd.style.textShadow="0 0 22px #a040ff";
    bttfStarted=false; phase='bttf';
  
}


function __m23_reset(){
  bttfStarted=false; bttfT=0; bttfPhase='drive'; deloX=0; deloSpeed=0; fireTrail=[]; westCity=null;
  tourIdx=0; tourScene=null; tourHold=0;
}


registerMethod(23, { start: __m23_start, resetFn: __m23_reset, loopFn: __m23_loop, phaseNames: ['bttf', 'bttf_hold'] });
