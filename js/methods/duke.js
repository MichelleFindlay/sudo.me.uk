let dukeStarted=false, dukeT=0, dukeSubPhase='logos', dukeX=0, dukePigs=[], dukeBrains=[], dukeBursts=[], dukeBlastR=0,
    dukeShipX=0, dukeShipY=0, dukeAlienX=0, dukeAlienY=0, dukeShipTargetX=0, dukeShipTargetY=0, dukeCrashR=0,
    dukeShipStartX=0, dukeShipStartY=0;


// ---- DUKE NUKEM 3D: the mirror one-liner, then Duke wades through an alien-infested city ----
const dukeSprite=[
  " o ",
  "/#>",
  "/ \\",
];
const pigcopSprite=[
  "(o)",
  "/#\\",
];
const octabrainSprite=["(@)","<#>"];
const dukeLines=[
  "IT'S TIME TO KICK ASS AND CHEW BUBBLEGUM...",
  "COME GET SOME!",
  "HAIL TO THE KING, BABY.",
  "GROOVY.",
  "YOUR FACE, YOUR ASS — WHAT'S THE DIFFERENCE?",
  "LET GOD SORT 'EM OUT!",
];
// centered multi-line text splash (logo cards, title screen, level-start banner)
function dukeTextRender(lines, mode){
  const grid=blankGrid(ROWS);
  const mg=modeGridFill(ROWS,COLS,mode||'duke');
  const startR=Math.max(0,Math.floor(ROWS/2)-Math.floor(lines.length/2));
  for(let i=0;i<lines.length;i++){
    const text=lines[i], c0=cx-Math.floor(text.length/2), r=startR+i;
    for(let j=0;j<text.length;j++){ const c=c0+j; if(c>=0&&c<COLS&&r>=0&&r<ROWS&&text[j]!==" "){ setCh(grid,r,c,text[j]); setMode(mg,r,c,mode||'duke'); } }
  }
  return {grid,mg};
}
// an original delta-wing flyer for the intro (not a reproduction of any specific game's ship)
const dukeShipSprite=[
  "   __^__   ",
  " <[=====]> ",
  "   \\___/   ",
];
function dukeShipRender(sx, sy, sparking){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let i=0;i<dukeShipSprite.length;i++){ const art=dukeShipSprite[i], r=Math.round(sy)+i;
    for(let j=0;j<art.length;j++){ const c=Math.round(sx)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue;
      setCh(grid,r,c,art[j]); setMode(mg,r,c,'duke'); } }
  if(sparking){ for(let k=0;k<5;k++){ const c=Math.round(sx)+((Math.random()*dukeShipSprite[0].length)|0), r=Math.round(sy)+((Math.random()*3)|0);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,["*","#","@"][(Math.random()*3)|0]); setMode(mg,r,c,'dukefire'); } } }
  return {grid,mg};
}
// a lone alien on a rooftop opens fire; the beam connects with the passing ship
function dukeBeamRender(sx, sy, bx, by){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const steps=Math.max(4,Math.round(Math.hypot(sx-bx,sy-by)));
  for(let s=0;s<=steps;s++){ const c=Math.round(bx+(sx-bx)*s/steps), r=Math.round(by+(sy-by)*s/steps);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.8){ setCh(grid,r,c,["*","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'pigalien'); } }
  if(by>=0&&by<ROWS&&bx>=0&&bx<COLS){ setCh(grid,by,bx,"@"); setMode(mg,by,bx,'pigalien'); }
  for(let i=0;i<dukeShipSprite.length;i++){ const art=dukeShipSprite[i], r=Math.round(sy)+i;
    for(let j=0;j<art.length;j++){ const c=Math.round(sx)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue;
      setCh(grid,r,c,art[j]); setMode(mg,r,c,'duke'); } }
  return {grid,mg};
}
// the impact where the ship goes down onto a rooftop
function dukeCrashBlastRender(cxi, cyi, R){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const Ri=Math.ceil(R);
  for(let dr=-Ri;dr<=Ri;dr++){ for(let dc=-Ri;dc<=Ri;dc++){ const dist=Math.hypot(dc,dr*1.6);
    if(dist>R) continue; const r=cyi+dr, c=cxi+dc; if(r<0||r>=ROWS||c<0||c>=COLS) continue;
    if(Math.random()<0.5){ setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'dukefire'); } } }
  return {grid,mg};
}
function dukeInit(){
  dukePigs=[]; dukeBrains=[]; dukeBursts=[];
  const n=Math.max(5,Math.floor(COLS/16));
  for(let i=0;i<n;i++){ dukePigs.push({x:(i+0.6)/n*COLS + (Math.random()*6-3), alive:true, ph:Math.random()*6}); }
  const m=Math.max(3,Math.floor(COLS/26));
  for(let i=0;i<m;i++){ dukeBrains.push({x:(i+0.3)/m*COLS + (Math.random()*8-4), y:2+((Math.random()*4)|0), alive:true, ph:Math.random()*6, vy:0.1+Math.random()*0.1}); }
}
function dukeStep(dx){
  for(const p of dukePigs){ p.ph+=0.4;
    if(p.alive && Math.abs(p.x-dx)<3){ p.alive=false; dukeBursts.push({x:p.x,y:streetRow-1,life:8});
      if(cityGridArr.length===ROWS && Math.random()<0.3){ const col=Math.round(p.x);
        for(let r=Math.max(0,streetRow-4);r<streetRow;r++){ if(cityGridArr[r]){ let ln=cityGridArr[r].split("");
          if(ln[col]!==" " && Math.random()<0.4) ln[col]=" "; cityGridArr[r]=ln.join(""); } } } } }
  for(const b of dukeBrains){ b.ph+=0.3; b.y+=Math.sin(b.ph)*b.vy;
    if(b.alive && Math.abs(b.x-dx)<4){ b.alive=false; dukeBursts.push({x:b.x,y:b.y,life:8}); } }
  for(const b of dukeBursts){ b.life--; } dukeBursts=dukeBursts.filter(b=>b.life>0);
}
function dukeRender(t, dx){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const p of dukePigs){ if(!p.alive) continue; const xi=Math.round(p.x), bob=(Math.sin(p.ph)>0)?0:1, top=streetRow-pigcopSprite.length+1-bob;
    for(let i=0;i<pigcopSprite.length;i++){ const art=pigcopSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=xi+j-1; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'pigalien'); } } }
  for(const b of dukeBrains){ if(!b.alive) continue; const xi=Math.round(b.x), yi=Math.round(b.y);
    for(let i=0;i<octabrainSprite.length;i++){ const art=octabrainSprite[i], r=yi+i;
      for(let j=0;j<art.length;j++){ const c=xi+j-1; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'pigalien'); } } }
  for(const b of dukeBursts){ const xi=Math.round(b.x), yi=Math.round(b.y);
    for(let dj=-1;dj<=1;dj++){ const c=xi+dj; if(c>=0&&c<COLS&&yi>=0&&yi<ROWS){ setCh(grid,yi,c,["*","#","@"][(Math.random()*3)|0]); setMode(mg,yi,c,'dukefire'); } } }
  const dtop=streetRow-dukeSprite.length+1;
  for(let i=0;i<dukeSprite.length;i++){ const art=dukeSprite[i], r=dtop+i;
    for(let j=0;j<art.length;j++){ const c=Math.round(dx)+j-1; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'duke'); } }
  if(t%2===0){ const mc=Math.round(dx)+2, mr=dtop+1; if(mc>=0&&mc<COLS){ setCh(grid,mr,mc,["*","-","="][(Math.random()*3)|0]); setMode(mg,mr,mc,'dukefire'); } }
  return {grid,mg};
}
// permanently craters the blast zone — mutates cityGridArr so the wreckage sticks
function dukeDemolish(cxi, r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=cxi-r;c<=cxi+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.45) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
}


function __m54_loop(){
if(phase==='duke'){
    scene.style.textShadow="0 0 10px #ff8000";
    if(!dukeStarted){
      dukeStarted=true; dukeT=0; dukeSubPhase='logos'; dukeX=-4;
      cityGridArr=buildCity();             // establishes streetRow ahead of the city sub-phases
      dukeInit();
      document.body.style.background="#000";
    }
    if(dukeSubPhase==='logos'){
      const idx=Math.floor(dukeT/14);
      const lines = idx===0 ? ["3 D   R E A L M S","P R E S E N T S"] : ["A P O G E E","S O F T W A R E"];
      const {grid,mg}=dukeTextRender(lines,'duke');
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      sub.textContent=""; cmd.textContent="";
      dukeT++;
      if(dukeT<28){ timer=setTimeout(loop,110); }
      else { dukeSubPhase='title'; dukeT=0; loop(); }
    }else if(dukeSubPhase==='title'){
      const {grid,mg}=dukeTextRender(["D U K E   N U K E M   3 D","","> NEW GAME","  OPTIONS","  QUIT"],'duke');
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent=""; cmd.textContent="";
      dukeT++;
      if(dukeT<20){ timer=setTimeout(loop,110); }
      else { dukeSubPhase='flight'; dukeT=0; dukeShipX=-14; dukeShipY=3; document.body.style.background="#0a0e18"; loop(); }
    }else if(dukeSubPhase==='flight'){
      dukeShipX+=Math.max(1,Math.floor(COLS/50));
      const {grid,mg}=dukeShipRender(dukeShipX, dukeShipY, false);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="FLYING OVER THE CITY…"; sub.style.color="#ff8000"; sub.style.textShadow="0 0 8px #ff3000";
      dukeT++;
      if(dukeShipX < cx-6){ timer=setTimeout(loop,70); }
      else { dukeSubPhase='shotdown'; dukeT=0; dukeAlienX=cx+8; dukeAlienY=streetRow-10; loop(); }
    }else if(dukeSubPhase==='shotdown'){
      dukeShipX+=0.6;
      const {grid,mg}=dukeBeamRender(dukeShipX, dukeShipY, dukeAlienX, dukeAlienY);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent="TAKING FIRE!"; sub.style.color="#ff3030"; sub.style.textShadow="0 0 8px #ff3000";
      dukeT++;
      if(dukeT<10){ timer=setTimeout(loop,80); }
      else { dukeSubPhase='crash'; dukeT=0; dukeShipStartX=dukeShipX; dukeShipStartY=dukeShipY; dukeShipTargetX=dukeShipX; dukeShipTargetY=streetRow-1; loop(); }
    }else if(dukeSubPhase==='crash'){
      const CRASH_FRAMES=16;
      const f=Math.min(1, dukeT/CRASH_FRAMES);
      dukeShipX=dukeShipStartX+(dukeShipTargetX-dukeShipStartX)*f;
      dukeShipY=dukeShipStartY+(dukeShipTargetY-dukeShipStartY)*f;
      const {grid,mg}=dukeShipRender(dukeShipX, dukeShipY, true);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="GOING DOWN!"; sub.style.color="#ff3030"; sub.style.textShadow="0 0 8px #ff3000";
      dukeT++;
      if(dukeT<CRASH_FRAMES){ timer=setTimeout(loop,60); }
      else { dukeSubPhase='impact'; dukeT=0; dukeCrashR=0; loop(); }
    }else if(dukeSubPhase==='impact'){
      stage.classList.add('shake');
      dukeCrashR=Math.min(9, dukeCrashR+1.3);
      const {grid,mg}=dukeCrashBlastRender(Math.round(dukeShipTargetX), Math.round(dukeShipTargetY), dukeCrashR);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="CRASH LANDING"; sub.style.color="#ff3030"; sub.style.textShadow="0 0 10px #ff3000";
      dukeT++;
      if(dukeCrashR<9 && dukeT<12){ timer=setTimeout(loop,60); }
      else { dukeSubPhase='levelstart'; dukeT=0; loop(); }
    }else if(dukeSubPhase==='levelstart'){
      stage.classList.remove('shake');
      const {grid,mg}=dukeTextRender(["HOLLYWOOD HOLOCAUST","","THESE ALIENS WRECKED MY RIDE —","TIME TO EVEN THE SCORE."],'duke');
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent=""; cmd.textContent="";
      dukeT++;
      if(dukeT<20){ timer=setTimeout(loop,110); }
      else { dukeSubPhase='arrive'; dukeT=0; dukeX=dukeShipTargetX-10; document.body.style.background="#0a0a0a"; loop(); }
    }else if(dukeSubPhase==='arrive'){
      dukeX=Math.min(cx-Math.floor(COLS*0.35), dukeX+Math.max(1,Math.floor(COLS/60)));
      dukeStep(dukeX);
      const {grid,mg}=dukeRender(dukeT, dukeX);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="HAIL TO THE KING, BABY."; sub.style.color="#ff8000"; sub.style.textShadow="0 0 8px #ff3000";
      dukeT++;
      if(dukeX < cx-Math.floor(COLS*0.35)){ timer=setTimeout(loop,80); }
      else { dukeSubPhase='blast'; dukeT=0; loop(); }
    }else if(dukeSubPhase==='blast'){
      dukeX=Math.min(COLS+4, dukeX+Math.max(1,Math.floor(COLS/70)));
      dukeStep(dukeX);
      const {grid,mg}=dukeRender(dukeT, dukeX);
      scene.innerHTML=paint(grid,mg,'city');
      if(dukeBursts.length>0) stage.classList.add('shake'); else stage.classList.remove('shake');
      sub.textContent=dukeLines[Math.floor(dukeT/16)%dukeLines.length]; sub.style.color="#ff8000"; sub.style.textShadow="0 0 8px #ff3000";
      dukeT++;
      if(dukeX < COLS+4){ timer=setTimeout(loop,70); }
      else { dukeSubPhase='final'; dukeT=0; dukeBlastR=0; loop(); }
    }else if(dukeSubPhase==='final'){
      stage.classList.add('shake');
      dukeBlastR=Math.min(Math.ceil(COLS/2)+2, dukeBlastR+Math.max(1,COLS/40));
      dukeDemolish(cx, Math.round(dukeBlastR));
      const grid=cityGridArr.slice();
      const mg=modeGridFill(ROWS,COLS,'city');
      const ground=streetRow, domeH=Math.min(ground,Math.floor(dukeBlastR*0.75));
      for(let r=ground;r>=ground-domeH;r--){ const frac=(ground-r)/Math.max(1,domeH);
        const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*dukeBlastR*1.1);
        for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=cx+j; if(c<0||c>=COLS)continue;
          setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'dukefire'); } }
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="LET GOD SORT 'EM OUT!"; sub.style.color="#ff8000"; sub.style.textShadow="0 0 10px #ff3000";
      dukeT++;
      if(dukeBlastR < Math.ceil(COLS/2)+2){ timer=setTimeout(loop,60); }
      else { phase='duke_hold'; loop(); }
    }
  }else if(phase==='duke_hold'){
    stage.classList.remove('shake');
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    for(let k=0;k<COLS*0.03;k++){ const c=cx+(((Math.random()*30)|0)-15), r=streetRow-((Math.random()*3)|0);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.5){ setCh(grid,r,c,["*","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'dukefire'); } }
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="hail to the king, baby. — press RESET"; sub.style.color="#ff8000"; sub.className="";
    timer=setTimeout(loop,150);
  }
}


function __m54_start(){
      // DUKE ORANGE -> Duke Nukem 3D
    attackMode='duke';
    cmd.style.color="#ff8000"; cmd.style.textShadow="0 0 20px #ff3000";
    dukeStarted=false; phase='duke';
  
}


function __m54_reset(){
  dukeStarted=false; dukeT=0; dukeSubPhase='logos'; dukeX=0; dukePigs=[]; dukeBrains=[]; dukeBursts=[]; dukeBlastR=0;
  dukeShipX=0; dukeShipY=0; dukeAlienX=0; dukeAlienY=0; dukeShipTargetX=0; dukeShipTargetY=0; dukeCrashR=0;
  dukeShipStartX=0; dukeShipStartY=0;
}


registerMethod(54, { start: __m54_start, resetFn: __m54_reset, loopFn: __m54_loop, phaseNames: ['duke', 'duke_hold'] });
