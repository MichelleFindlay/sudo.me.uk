let rubberStarted=false, rubberT=0, rubberTireX=0, rubberPeople=[], rubberTargetIdx=0, rubberFocusT=0, rubberSubPhase='approach';


// ---- RUBBER: a telepathic car tire named Robert rolls around making heads explode ----
const rubberTireSpriteA=[
  " .--. ",
  "|(||)|",
  " '--' ",
];
const rubberTireSpriteB=[
  " .--. ",
  "|(==)|",
  " '--' ",
];

function rubberPeopleInit(){
  rubberPeople=[];
  const n=Math.max(6, Math.floor(COLS/16));
  for(let i=0;i<n;i++){ rubberPeople.push({x:(i+0.5)/n*COLS + (Math.random()*4-2), state:'idle', burstT:0}); }
}
function rubberDrawTire(grid, mg, x, spin){
  const spr = spin ? rubberTireSpriteA : rubberTireSpriteB;
  const top = streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=Math.round(x)+j-3;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'rubbertire'); } }
}
function rubberDrawPerson(grid, mg, p){
  if(p.state==='gone'){
    const c=Math.round(p.x); if(c>=0&&c<COLS){ setCh(grid,streetRow,c, Math.random()<0.5?".":","); setMode(mg,streetRow,c,'rubberburst'); }
    return;
  }
  if(p.state==='exploding'){
    const xi=Math.round(p.x), yi=streetRow-2;
    for(let dr=-2;dr<=1;dr++){ for(let dc=-2;dc<=2;dc++){ const r=yi+dr, c=xi+dc; if(r<0||r>=ROWS||c<0||c>=COLS)continue;
      if(Math.random()<0.6){ setCh(grid,r,c, ["*","#","%","@"][(Math.random()*4)|0]); setMode(mg,r,c,'rubberburst'); } } }
    return;
  }
  const spr=rubberPersonSprite, top=streetRow-spr.length+1, xi=Math.round(p.x);
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j-1;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'rubberperson'); } }
}
function rubberDrawBeam(grid, mg, tireX, personX){
  const tx=Math.round(tireX), px=Math.round(personX), r=streetRow-2;
  const steps=Math.max(3, Math.abs(px-tx));
  for(let s=0;s<=steps;s++){ const c=Math.round(tx+(px-tx)*s/steps);
    if(c<0||c>=COLS||r<0||r>=ROWS)continue;
    if(Math.random()<0.7){ setCh(grid,r,c, (Math.random()<0.5?"~":"*")); setMode(mg,r,c,'rubberbeam'); }
  }
}
function rubberRender(tireX, spin, people, focusIdx, beamOn){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const p of people){ rubberDrawPerson(grid,mg,p); }
  if(beamOn && focusIdx>=0 && focusIdx<people.length){ rubberDrawBeam(grid,mg,tireX,people[focusIdx].x); }
  rubberDrawTire(grid,mg,tireX,spin);
  return {grid,mg};
}


function __m61_loop(){
if(phase==='rubber'){
    scene.style.textShadow="0 0 10px #3a3a3a";
    if(!rubberStarted){ rubberStarted=true; rubberT=0; rubberTireX=-6; rubberPeopleInit(); rubberTargetIdx=0; rubberFocusT=0; rubberSubPhase='approach';
      if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
      document.body.style.background="#0a0a0a"; }
    if(rubberTargetIdx>=rubberPeople.length){ phase='rubber_hold'; loop(); return; }
    const target=rubberPeople[rubberTargetIdx];
    let beamOn=false;
    stage.classList.remove('shake');
    if(rubberSubPhase==='approach'){
      const stopX=target.x-7, diff=stopX-rubberTireX;
      if(Math.abs(diff)>1){ rubberTireX += Math.sign(diff)*Math.min(Math.abs(diff), Math.max(1,COLS/60)); }
      else { rubberSubPhase='focus'; rubberFocusT=0; }
    } else if(rubberSubPhase==='focus'){
      beamOn=true; stage.classList.add('shake');
      rubberFocusT++;
      if(rubberFocusT>18){ target.state='exploding'; target.burstT=0; rubberSubPhase='explode'; }
    } else if(rubberSubPhase==='explode'){
      stage.classList.add('shake');
      target.burstT++;
      if(target.burstT>10){ target.state='gone'; rubberTargetIdx++; rubberSubPhase='approach'; rubberFocusT=0; }
    }
    const spin=Math.floor(rubberT/2)%2===0;
    const {grid,mg}=rubberRender(rubberTireX, spin, rubberPeople, rubberTargetIdx, beamOn);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = rubberSubPhase==='focus' ? "ROBERT FOCUSES..." : (rubberSubPhase==='explode' ? "BOOM." : "A TIRE ROLLS THROUGH TOWN");
    sub.style.color="#8a2ab0"; sub.style.textShadow="0 0 8px #3a1a4a";
    rubberT++;
    timer=setTimeout(loop,70);
  }else if(phase==='rubber_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=rubberRender(rubberTireX, false, rubberPeople, -1, false);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="no further explanation is offered. — press RESET"; sub.style.color="#8a2ab0"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m61_start(){
      // TIRE BLACK -> Rubber
    attackMode='rubber';
    cmd.style.color="#3a3a3a"; cmd.style.textShadow="0 0 20px #8a2ab0";
    rubberStarted=false; phase='rubber';
  
}


function __m61_reset(){
  rubberStarted=false; rubberT=0; rubberTireX=0; rubberPeople=[]; rubberTargetIdx=0; rubberFocusT=0; rubberSubPhase='approach';
}


registerMethod(61, { start: __m61_start, resetFn: __m61_reset, loopFn: __m61_loop, phaseNames: ['rubber', 'rubber_hold'] });
