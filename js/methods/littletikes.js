let tikesStarted=false, tikesT=0, tikesX=0, childX=0, tikesBoarded=false, tikesMomX=0, tikesMomDown=false;


// ---- LITTLE TIKES: a kid climbs into the Cozy Coupe (monster-truck edition) ----
const tikesSprite=[
  " ______",
  "/ o  o \\",
  "|_______|",
  "(@@)  (@@)",
];
const tikesChildSprite=["o","/|\\","/ \\"];
const tikesFlippedSprite=[
  "(@@)  (@@)",
  "|_______|",
  "/ o  o \\",
  " ______",
];
function tikesRender(x, childXpos, showChild, bubbleText, momX, momDown, flipped){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(x);                             // whatever's in its path gets flattened
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=flipped?tikesFlippedSprite:tikesSprite;
  const left=Math.round(x)-spr[0].length, top=streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'tikes'); } }
  if(showChild){ const cspr=tikesChildSprite, ctop=streetRow-cspr.length+1, cleft=Math.round(childXpos);
    for(let i=0;i<cspr.length;i++){ const art=cspr[i], r=ctop+i;
      for(let j=0;j<art.length;j++){ const c=cleft+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'body'); } } }
  if(bubbleText) mtDrawBubble(grid, mg, left+Math.floor(spr[0].length/2), top, bubbleText);
  // mom: furiously chasing the truck, right up until she isn't
  if(momX!==undefined){ const mc=Math.round(momX);
    if(momDown){ const r=streetRow, art=(mc%2===0)?"-o-":"~o~";
      for(let j=0;j<art.length;j++){ const c=mc-1+j; if(c>=0&&c<COLS){ setCh(grid,r,c,art[j]); setMode(mg,r,c,'mom'); } } }
    else { const r=streetRow-1;
      for(let j=0;j<3;j++){ const c=mc-1+j; if(c>=0&&c<COLS){ setCh(grid,r,c,"\\o/"[j]); setMode(mg,r,c,'mom'); } }
      mtDrawBubble(grid, mg, mc, r, "GET BACK HERE THIS INSTANT!"); }
  }
  return {grid,mg};
}


function __m44_loop(){
if(phase==='tikes'){
    scene.style.textShadow="0 0 8px #e0201a";
    if(!tikesStarted){ tikesStarted=true; tikesT=0; tikesX=14; childX=-4; tikesBoarded=false; tikesMomX=-2; tikesMomDown=false; document.body.style.background="#100504"; }
    const boardAt=tikesX-tikesSprite[0].length+2;
    if(!tikesBoarded){
      childX=Math.min(boardAt, childX+0.35);
      if(childX>=boardAt) tikesBoarded=true;
    }
    tikesMomX=Math.min(boardAt-2, tikesMomX+0.3);     // furious, but always a step behind
    const shout=tikesBoarded && tikesT%20<13;
    const {grid,mg}=tikesRender(tikesX, childX, !tikesBoarded, shout?"MONSTER TRUUUUUUCK!":null, tikesMomX, false);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent= tikesBoarded ? "MONSTER TRUUUUUUCK!" : "A CHILD CLIMBS INTO THE LITTLE TIKES MONSTER TRUCK, MOM IN HOT PURSUIT";
    sub.style.color="#e0201a"; sub.style.textShadow="0 0 8px #8a1010";
    tikesT++;
    if(!(tikesBoarded && tikesT>70)){ timer=setTimeout(loop,90); }
    else { phase='tikes_drive'; tikesT=0; loop(); }
  }else if(phase==='tikes_drive'){
    stage.classList.add('shake');
    if(!tikesMomDown){ tikesMomDown=true; }           // the engine roars to life right as she catches up
    const stopAt=Math.floor(COLS/3);                 // knocks over a third of the city
    tikesX=Math.min(stopAt, tikesX+Math.max(1,Math.floor(COLS/40)));
    const arrived=tikesX>=stopAt;
    const {grid,mg}=tikesRender(tikesX, 0, false, null, tikesMomX, true);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="MONSTER TRUUUUUUCK!!!";
    sub.style.color="#e0201a"; sub.style.textShadow="0 0 10px #ff2010";
    tikesT++;
    if(!arrived){ timer=setTimeout(loop,65); }
    else { phase='tikes_flip'; tikesT=0; loop(); }
  }else if(phase==='tikes_flip'){
    stage.classList.add('shake');
    // two full end-over-end flips, held long enough per pose to actually read, landing on flipped
    const flipped=Math.floor(tikesT/3)%2===1;
    const {grid,mg}=tikesRender(tikesX, 0, false, null, tikesMomX, true, flipped);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="IT FLIPS!";
    sub.style.color="#ff5a40"; sub.style.textShadow="0 0 10px #ff2010";
    tikesT++;
    if(tikesT<12){ timer=setTimeout(loop,70); }
    else { phase='tikes_hold'; loop(); }
  }else if(phase==='tikes_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=tikesRender(tikesX, 0, false, "MUM look what i did!", tikesMomX, true, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the child is thrilled. mom and a third of the city are not. — press RESET"; sub.style.color="#e0201a"; sub.className="";
    tikesT++;
    timer=setTimeout(loop,150);
  }
}


function __m44_start(){
      // COZY COUPE RED -> Little Tikes
    attackMode='tikes';
    cmd.style.color="#e0201a"; cmd.style.textShadow="0 0 20px #8a1010";
    tikesStarted=false; phase='tikes';
  
}


function __m44_reset(){
  tikesStarted=false; tikesT=0; tikesX=0; childX=0; tikesBoarded=false; tikesMomX=0; tikesMomDown=false;
}


registerMethod(44, { start: __m44_start, resetFn: __m44_reset, loopFn: __m44_loop, phaseNames: ['tikes', 'tikes_drive', 'tikes_flip', 'tikes_hold'] });
