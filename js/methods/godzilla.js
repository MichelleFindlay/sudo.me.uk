let gzStarted=false, gzX=0, gzStomp=0, gzDmgL=0, gzDmgR=0, gzFrame=0;


// ---- Godzilla: a giant kaiju stomping in from the right, flattening the city ----
// Big ASCII lizard sprite (drawn bottom-anchored at street level). ~14 wide, ~10 tall.
const gzSprite=[
  "        /\\    ",
  "     /\\/  \\   ",
  "  __/ () o \\_ ",   // head w/ eye
  " /   \\____/  \\",
  "/  /\\        |",   // arm
  "|__|  \\  /\\  |",
  "   |   \\/  \\ |",
  "   |___/\\  /\\|",
  "   /   |  |  \\",   // legs
  "  /_/  |__|  \\",
];
const gzBreath=["=","~","*","-","\u2248"];
function godzilla(gx, breathOn, dmgL, dmgR, tick){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // flatten everything he's already trampled: columns to the RIGHT of gx (he walks right->left)
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=Math.floor(gx)+8;c<COLS;c++){                 // trampled zone behind him
      if(Math.random()<0.85) line[c]=" ";
      else line[c]=[".","'"][(Math.random()*2)|0];
    }
    grid[r]=line.join("");
  }
  // leave smoking rubble on the street where he's walked
  {
    let line=grid[streetRow].split("");
    for(let c=Math.floor(gx)+8;c<COLS;c++){ if(Math.random()<0.5) line[c]=[".",",","_"][(Math.random()*3)|0]; }
    grid[streetRow]=line.join("");
  }
  // rising smoke plumes from the destruction behind him
  for(let k=0;k<COLS*0.15;k++){
    const c=Math.floor(gx)+10+((Math.random()*Math.max(1,COLS-gx-10))|0);
    const r=streetRow-1-((Math.random()*6)|0);
    if(c>=0&&c<COLS&&r>0){ setCh(grid,r,c,["'",".","o"][(Math.random()*3)|0]); }
  }

  // draw Godzilla, bottom-anchored so his feet sit on the street
  const gh=gzSprite.length;
  const topRow=streetRow-gh+1;
  // little walk bob
  const bob=(tick%2===0)?0:0;
  for(let i=0;i<gh;i++){
    const row=topRow+i+bob;
    const art=gzSprite[i];
    for(let j=0;j<art.length;j++){
      const ch=art[j]; if(ch===" ")continue;
      const c=Math.floor(gx)+j;
      if(c<0||c>=COLS||row<0||row>=ROWS)continue;
      setCh(grid,row,c,ch); setMode(mg,row,c,'godzilla');
    }
  }

  // atomic breath: a beam firing left from his mouth, incinerating a column swath
  if(breathOn){
    const mouthR=topRow+2, mouthC=Math.floor(gx);      // mouth at left edge of head
    for(let c=mouthC-1;c>=0;c--){
      const spread=1+Math.floor((mouthC-c)/14);
      for(let dr=-spread;dr<=spread;dr++){
        const r=mouthR+dr;
        if(r<0||r>=ROWS)continue;
        if(Math.random()<0.85){ setCh(grid,r,c,gzBreath[(Math.random()*gzBreath.length)|0]); setMode(mg,r,c,'breath'); }
      }
    }
  }
  return {grid,mg};
}


function __m3_loop(){
if(phase==='godzilla'){
    scene.style.textShadow="0 0 10px #3a5a2a";
    if(!gzStarted){ gzStarted=true; gzX=COLS-14; gzFrame=0; document.body.style.background="#0d0a05"; }
    stepRain();
    const breathOn=(Math.floor(gzFrame/3)%3===0);   // fire breath in bursts
    const {grid,mg}=godzilla(gzX, breathOn, gzDmgL, gzDmgR, gzFrame);
    drawRain(grid,mg);
    if(breathOn) stage.classList.add('shake'); else stage.classList.remove('shake');
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= breathOn ? "RRRAAAWWWR!! ATOMIC BREATH!!" : "GODZILLA IS HERE"; 
    sub.style.color="#7fffd4"; sub.style.textShadow="0 0 8px #33e0ff";
    gzFrame++;
    gzX-=Math.max(1,Math.floor(COLS/40));
    if(gzX>-2){ timer=setTimeout(loop,90); }
    else { phase='gz_hold'; gzX=-14; loop(); }
  }else if(phase==='gz_hold'){
    stage.classList.remove('shake');
    // he's crossed the whole city — everything flattened, Godzilla standing at the left
    const {grid,mg}=godzilla(-14, false, 0, 0, gzFrame);   // sprite off-screen; only rubble shows
    // ensure whole skyline is flattened rubble
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is rubble. — press RESET"; sub.style.color="#7fffd4"; sub.className="";
    timer=setTimeout(loop,240);
  }
}


function __m3_start(){
       // BROWN -> Godzilla
    attackMode='godzilla';
    cmd.style.color="#8a5a2b"; cmd.style.textShadow="0 0 20px #b5732f";
    gzStarted=false; phase='godzilla';
  
}


function __m3_reset(){
  gzStarted=false; gzX=0; gzDmgL=0; gzDmgR=0; gzFrame=0;
}


registerMethod(3, { start: __m3_start, resetFn: __m3_reset, loopFn: __m3_loop, phaseNames: ['godzilla', 'gz_hold'] });
