let thanosStarted=false, thanosT=0, thanosPhase='assemble', dustMotes=[], snapFade=0, thanosX=0;


// ---- THANOS: the Avengers fail, he snaps, and half of everything turns to dust ----
// Stark Tower on the left, Thanos striding from the right, heroes lined up between.
const thanosSprite=[
  "   ___   ",
  "  /@ @\\  ",
  "  \\_-_/  ",
  " /|MWM|\\=*",   // right hand ends in the glowing gauntlet (=*)
  "  |###|  ",
  "  /###\\  ",
  "  |  |  ",
  " _|  |_ ",
];
const starkTower=[
  "   _____   ",
  "  |  A  |  ",
  "  | STARK| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  " _|#####|_ ",
];
const heroSprites=["o/|","o|\\","\\o/","o+|","|o|"];   // little avengers
function thanosDraw(px, snapped, fade){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // Stark Tower stands tall and central over the skyline
  const twW=starkTower[0].length;
  const stCx=cx, stTop=streetRow-starkTower.length+1;
  for(let i=0;i<starkTower.length;i++){ const r=stTop+i, art=starkTower[i];
    for(let j=0;j<art.length;j++){ const c=stCx+j-Math.floor(twW/2); if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'stark'); } }

  // after the snap: half the buildings crumble to dust (every other column)
  if(snapped){
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){ if((c%2===0) && ln[c]!==" " && mg[r][c]!=='stark' && Math.random()<fade){ ln[c]=(Math.random()<0.4?".":" "); if(ln[c]===".") setMode(mg,r,c,'dust'); } }
      grid[r]=ln.join(""); }
  }

  // the Avengers lined up defending in front of the tower, disintegrating after the snap
  const heroRow=streetRow-1, heroStart=Math.floor(COLS*0.18);
  const heroN=6;
  for(let h=0;h<heroN;h++){
    const hx=heroStart+h*3;
    // half the heroes vanish after the snap
    if(snapped && h%2===0 && Math.random()<fade) continue;   // dusted
    const spr=heroSprites[h%heroSprites.length];
    for(let j=0;j<spr.length;j++){ const c=hx+j; if(c<0||c>=COLS)continue; setCh(grid,heroRow,c,spr[j]); setMode(mg,heroRow,c,'hero'); }
    setCh(grid,heroRow-1,hx+1,"o"); setMode(mg,heroRow-1,hx+1,'hero');  // head
  }

  // Thanos striding in from the right
  const tTop=streetRow-thanosSprite.length+1;
  for(let i=0;i<thanosSprite.length;i++){ const r=tTop+i, art=thanosSprite[i];
    for(let j=0;j<art.length;j++){ const c=Math.round(px)+j; if(c<0||c>=COLS)continue; if(art[j]===" ")continue;
      const isGaunt=(art[j]==="*"||art[j]==="=");
      setCh(grid,r,c,art[j]); setMode(mg,r,c,isGaunt?'gauntlet':'thanos'); } }

  // drifting dust motes after the snap
  if(snapped){
    for(const m of dustMotes){ const r=Math.round(m.y), c=Math.round(m.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,["."," ","'","*"][(Math.random()*4)|0]||"."); setMode(mg,r,c,'dust'); } }
  }
  return {grid,mg};
}


function __m19_loop(){
if(phase==='thanos'){
    scene.style.textShadow="0 0 10px #b060e0";
    if(!thanosStarted){ thanosStarted=true; thanosT=0; thanosPhase='assemble'; thanosX=COLS-9; snapFade=0; document.body.style.background="#0a0410"; }
    stepRain();
    if(thanosPhase==='assemble'){
      // Thanos strides toward the Avengers line; they stand and fail to stop him
      thanosX-=Math.max(1,Math.floor(COLS/40));
      const {grid,mg}=thanosDraw(thanosX, false, 0);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE AVENGERS MAKE THEIR STAND…"; sub.style.color="#d090ff"; sub.style.textShadow="0 0 8px #6a20a0";
      thanosT++;
      if(thanosX>Math.floor(COLS*0.6)){ timer=setTimeout(loop,80); }
      else { thanosPhase='snapflash'; loop(); }
    }else if(thanosPhase==='snapflash'){
      flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
      document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="* SNAP *";
      stage.classList.add('shake');
      // seed dust motes rising from where things stood
      dustMotes=[]; for(let i=0;i<Math.floor(COLS*0.8);i++){ dustMotes.push({ x:(Math.random()*COLS)|0, y:streetRow-((Math.random()*streetRow)|0), vx:(Math.random()*2-1)*0.6, vy:-(0.3+Math.random()*0.8) }); }
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.6s"; flash.style.opacity=0; document.body.style.background="#160a1e"; thanosPhase='dusting'; snapFade=0; loop(); }, 240);
    }else if(thanosPhase==='dusting'){
      snapFade=Math.min(1, snapFade+0.05);
      for(const m of dustMotes){ m.x+=m.vx; m.y+=m.vy; m.vy+=0.01; if(m.y<0||m.x<0||m.x>=COLS){ m.y=streetRow-((Math.random()*4)|0); m.x=(Math.random()*COLS)|0; m.vy=-(0.3+Math.random()*0.8); } }
      const {grid,mg}=thanosDraw(thanosX, true, snapFade);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      sub.textContent = snapFade<0.7 ? "HALF OF EVERYTHING TURNS TO DUST" : "THEY LOST. — you should've gone for the head.";
      sub.style.color="#d090ff"; sub.style.textShadow="0 0 8px #6a20a0";
      thanosT++;
      if(!(snapFade>=1 && thanosT>50)){ timer=setTimeout(loop,90); }
      else { phase='thanos_hold'; loop(); }
    }
  }else if(phase==='thanos_hold'){
    stage.classList.remove('shake');
    for(const m of dustMotes){ m.x+=m.vx; m.y+=m.vy; m.vy+=0.01; if(m.y<0||m.x<0||m.x>=COLS){ m.y=streetRow-((Math.random()*4)|0); m.x=(Math.random()*COLS)|0; m.vy=-(0.3+Math.random()*0.8); } }
    const {grid,mg}=thanosDraw(thanosX, true, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="half the world is dust. — press RESET"; sub.style.color="#d090ff"; sub.className="";
    thanosT++;
    timer=setTimeout(loop,140);
  }
}


function __m19_start(){
      // PURPLE -> Thanos snap
    attackMode='thanos';
    cmd.style.color="#b060e0"; cmd.style.textShadow="0 0 22px #6a20a0";
    thanosStarted=false; phase='thanos';
  
}


function __m19_reset(){
  thanosStarted=false; thanosT=0; thanosPhase='assemble'; dustMotes=[]; snapFade=0; thanosX=0;
}


registerMethod(19, { start: __m19_start, resetFn: __m19_reset, loopFn: __m19_loop, phaseNames: ['thanos', 'thanos_hold'] });
