let msStarted=false, msT=0, msCrowd=[], msParticles=[];
let msArchesDown=false, msBucketPopped=false, msArcadeBroken=false, msSwallowed=false;

// ---- MASCOT MAYHEM: twenty-two fast-food mascots, one city, no survivors ----
// everyone shares one small body sprite; only the "head" letter differs, same
// convention already used for the Suicide Squad crews elsewhere in this project
const msBody=[" X "," /|\\ ","/   \\"];
const msRoster=[
  {l:'R',n:"Ronald McDonald"},{l:'G',n:"Grimace"},{l:'H',n:"Hamburglar"},
  {l:'I',n:"Birdie"},{l:'Y',n:"Mayor McCheese"},{l:'K',n:"The King"},
  {l:'C',n:"Colonel Sanders"},{l:'W',n:"Wendy"},{l:'J',n:"Jack Box"},
  {l:'B',n:"Big Boy"},{l:'L',n:"Little Caesar"},{l:'N',n:"The Noid"},
  {l:'S',n:"Happy Star"},{l:'E',n:"Chuck E. Cheese"},{l:'O',n:"Rooty"},
  {l:'Q',n:"the Chick-fil-A cows"},{l:'T',n:"Gidget"},{l:'M',n:"Oven Mitt"},
  {l:'P',n:"Mr Wimpy"},{l:'F',n:"Fat Charlie"},{l:'X',n:"the Barcelos Cockerel"},
  {l:'A',n:"Happy Eater"}
];
const msArchesArt=["| |  | |","| |__| |","|      |"];
const msBucketArt=[" ____ ","|KFC |","|____|"];
const msArcadeArt=[" ___ ","|@_@|","|___|"];

function msPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const row=art[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function msDrawOne(grid,mg,letter,x,top){
  const art=[msBody[0].replace('X',letter), msBody[1], msBody[2]];
  msPlace(grid,mg,art,Math.round(x)-2,top,'mascot');
}
function msFlatten(centerCol,halfWidth){
  if(cityGridArr.length!==ROWS) return;
  for(let r=0;r<streetRow;r++){
    if(!cityGridArr[r]) continue;
    let ln=cityGridArr[r].split("");
    for(let c=centerCol-halfWidth;c<=centerCol+halfWidth;c++){
      if(c<0||c>=COLS) continue;
      ln[c]=" ";
    }
    cityGridArr[r]=ln.join("");
  }
}
function msInitCrowd(){
  const n=msRoster.length, ukStart=n-4;   // last 4 entries are the UK contingent
  msCrowd=msRoster.map((r,i)=>{
    const target=Math.round((i+1)/(n+1)*COLS);
    const fromLeft = i<ukStart;
    return { l:r.l, n:r.n, x: fromLeft ? -10-i*2 : COLS+10+(n-1-i)*2, target, fromLeft };
  });
}
function msStepCrowd(t){
  for(const m of msCrowd){ m.x += (m.target-m.x)*Math.min(0.2, 0.02+t*0.002); }
}
function msDrawCrowd(grid,mg){
  for(const m of msCrowd) msDrawOne(grid,mg,m.l,m.x,streetRow-msBody.length);
}
function msRenderBase(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  return {grid,mg};
}
function msStepParticles(){
  for(const p of msParticles){ p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; }
  msParticles=msParticles.filter(p=>p.x>=0&&p.x<COLS&&p.y<ROWS);
}
function msDrawParticles(grid,mg){
  for(const p of msParticles){
    const r=Math.round(p.y), c=Math.round(p.x);
    if(r<0||r>=ROWS||c<0||c>=COLS) continue;
    setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode);
  }
}

function __m76_loop(){
  const archesX=cx-Math.floor(COLS*0.3), kingX=cx-Math.floor(COLS*0.15), colX=cx-Math.floor(COLS*0.02),
        wendyX=cx+Math.floor(COLS*0.1), caesarX=cx+Math.floor(COLS*0.22), arcadeX=cx+Math.floor(COLS*0.34);
  if(phase==='ms_gather'){
    if(!msStarted){ msStarted=true; msT=0; msInitCrowd(); document.body.style.background="#140a06"; }
    msStepCrowd(msT);
    const {grid,mg}=msRenderBase();
    msDrawCrowd(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = msT<33
      ? "THE US FAST-FOOD MASCOTS MARCH IN FROM THE WEST"
      : "THE UK LOT ARRIVE FROM THE EAST, THOROUGHLY UNBOTHERED";
    sub.style.color="#ffcc00"; sub.style.textShadow="0 0 8px #d8252c";
    msT++;
    if(msT<71){ timer=setTimeout(loop,85); }
    else { phase='ms_brawl'; msT=0; loop(); }
  }else if(phase==='ms_brawl'){
    msStepParticles();
    const {grid,mg}=msRenderBase();
    if(!msArchesDown) msPlace(grid,mg,msArchesArt,archesX-4,streetRow-msArchesArt.length,'arches');
    if(!msBucketPopped) msPlace(grid,mg,msBucketArt,colX-3,streetRow-msBucketArt.length,'bucket');
    if(!msArcadeBroken) msPlace(grid,mg,msArcadeArt,arcadeX-2,streetRow-msArcadeArt.length,'arcade');
    msDrawCrowd(grid,mg);
    msDrawParticles(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#ffcc00"; sub.style.textShadow="0 0 8px #d8252c";
    if(msT<29){
      sub.textContent="RONALD'S CREW KNOCK OVER THE GOLDEN ARCHES";
      if(msT===26){ msArchesDown=true; msFlatten(archesX,3); stage.classList.add('shake'); }
    } else if(msT<50){
      stage.classList.remove('shake');
      sub.textContent="THE KING SILENTLY FLIPS A CAR";
      if(msT===41) for(let k=0;k<3;k++) msParticles.push({x:kingX,y:streetRow-1,vx:(Math.random()-0.5)*3,vy:-3-Math.random()*2,ch:'=',mode:'car'});
    } else if(msT<81){
      sub.textContent="THE COLONEL'S BUCKET GOES OFF LIKE A GRENADE";
      if(msT===62 && !msBucketPopped){
        msBucketPopped=true; flash.style.transition="opacity 0.05s"; flash.style.opacity=0.5;
        for(let k=0;k<10;k++) msParticles.push({x:colX,y:streetRow-2,vx:(Math.random()-0.5)*5,vy:-3-Math.random()*3,ch:(Math.random()<0.5?'#':'@'),mode:'flames'});
      } else flash.style.opacity=0;
    } else if(msT<106){
      sub.textContent="WENDY'S PIGTAILS TAKE OUT A LAMPPOST";
      if(msT%4===0) stage.classList.add('shake'); else stage.classList.remove('shake');
    } else if(msT<136){
      stage.classList.remove('shake');
      sub.textContent="JACK BOUNCES HIS HEAD THROUGH A SHOP WINDOW";
    } else if(msT<175){
      sub.textContent="LITTLE CAESAR FLINGS \"PIZZA! PIZZA!\" IN EVERY DIRECTION";
      if(msT%3===0) msParticles.push({x:caesarX,y:streetRow-3,vx:(Math.random()-0.5)*6,vy:-2-Math.random()*2,ch:'o',mode:'pizza'});
    } else if(msT<202){
      sub.textContent="THE NOID RUINS EVERYTHING, AS PROMISED";
      if(msT===187) msFlatten(cx,2);
    } else if(msT<245){
      sub.textContent="A GLITCHING ARCADE CABINET AND HAPPY STAR PUT ON A LIGHT SHOW";
      if(msT===216){ msArcadeBroken=true; }
      if(msT%2===0) msParticles.push({x:arcadeX+1,y:streetRow-3,vx:(Math.random()-0.5)*2,vy:-1-Math.random(),ch:'*',mode:'arcade'});
    } else if(msT<286){
      sub.textContent="ROOTY BARRELS THROUGH TRAFFIC WHILE THE COWS HOLD UP A SIGN";
      mtDrawBubble(grid,mg,cx-Math.floor(COLS*0.4),streetRow-msBody.length,"EAT MOR BUILDING");
    } else {
      sub.textContent="THE COCKEREL CROWS. EVERY WINDOW IN EARSHOT GOES. HAPPY EATER SWALLOWS A BUILDING WHOLE.";
      if(msT===302){ msSwallowed=true; msFlatten(cx+Math.floor(COLS*0.4),3); stage.classList.add('shake'); }
    }
    msT++;
    if(msT<347){ timer=setTimeout(loop,85); }
    else { phase='ms_climax'; msT=0; loop(); }
  }else if(phase==='ms_climax'){
    const {grid,mg}=msRenderBase();
    for(const m of msCrowd){ m.x += (cx-m.x)*0.12; }
    msDrawCrowd(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent = msT<25 ? "IT ALL COLLAPSES INTO ONE ENORMOUS DOGPILE" : "NOBODY REMEMBERS WHO STARTED IT";
    sub.style.color="#ffcc00"; sub.style.textShadow="0 0 8px #d8252c";
    msT++;
    if(msT<45){ timer=setTimeout(loop,85); }
    else { phase='ms_hold'; msT=0; cityGridArr=buildCity(); loop(); }
  }else if(phase==='ms_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=msRenderBase();
    for(const m of msCrowd){ m.x += (m.target-m.x)*0.05; }
    msDrawCrowd(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    if(msT<55){ sub.textContent="THE SMOKE CLEARS. NOBODY WON."; sub.style.color="#ffcc00"; sub.style.textShadow="0 0 8px #d8252c"; }
    else { sub.textContent="TWENTY-TWO MASCOTS, ZERO WINNERS, ONE RUINED CITY. — press RESET"; sub.style.color="#ffcc00"; sub.style.textShadow="0 0 8px #d8252c"; }
    sub.className="";
    msT++;
    timer=setTimeout(loop, 140);
  }
}

function __m76_start(){
  attackMode='ms_gather';
  cmd.style.color="#ffcc00"; cmd.style.textShadow="0 0 20px #d8252c";
  msStarted=false; phase='ms_gather';
}

function __m76_reset(){
  msStarted=false; msT=0; msCrowd=[]; msParticles=[];
  msArchesDown=false; msBucketPopped=false; msArcadeBroken=false; msSwallowed=false;
}

registerMethod(76, { start: __m76_start, resetFn: __m76_reset, loopFn: __m76_loop, phaseNames: ['ms_gather','ms_brawl','ms_climax','ms_hold'] });
