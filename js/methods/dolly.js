let dollyStarted=false, dollyT=0, dollySubPhase='arrive', dollyWorkers=[], dollyLineIdx=0, dollyLineT=0;


// ---- DOLLY: no destruction here — the city just clocks in, sings along, and clocks out ----
const dollyLines=[
  "Tumble outta bed",
  "And I stumble to the kitchen",
  "Pour myself a cup of ambition",
  "And yawn and stretch and try to come to life",
  "Jump in the shower",
  "And the blood starts pumpin'",
  "Out on the streets",
  "The traffic starts jumpin'",
  "With folks like me on the job from 9 to 5",
  "Working 9 to 5",
  "What a way to make a livin'",
  "Barely gettin' by",
  "It's all takin' and no givin'",
  "They just use your mind",
  "And they never give you credit",
  "It's enough to drive you",
  "Crazy if you let it",
  "9 to 5, for service and devotion",
  "You would think that I",
  "Would deserve a fair promotion",
  "Want to move ahead",
  "But the boss won't seem to let me",
  "I swear sometimes that man is out to get me",
];
function dollyInit(){
  dollyWorkers=[];
  const n=Math.max(6,Math.floor(COLS/14));
  for(let i=0;i<n;i++){
    const fromLeft=Math.random()<0.5;
    dollyWorkers.push({
      x: fromLeft ? -((Math.random()*20)|0) : COLS+((Math.random()*20)|0),
      homeX: (i+0.5)/n*COLS + (Math.random()*4-2),
      spd: 0.5+Math.random()*0.5,
      ph: Math.random()*6,
      arrived: false,
    });
  }
  dollyLineIdx=0; dollyLineT=0;
}
function dollyStepArrive(){
  for(const w of dollyWorkers){
    if(!w.arrived){
      const dx=w.homeX-w.x;
      if(Math.abs(dx)<1){ w.arrived=true; w.x=w.homeX; }
      else { w.x += Math.sign(dx)*w.spd; }
    }
    w.ph+=0.4;
  }
}
function dollyStepLeave(){
  for(const w of dollyWorkers){ w.x += (w.homeX<COLS/2 ? -1 : 1) * (0.6+Math.random()*0.4); w.ph+=0.4; }
}
function dollyRender(clockLabel){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the big clock, front and centre
  const cC=cx-Math.floor(clockLabel.length/2);
  for(let j=0;j<clockLabel.length;j++){ const c=cC+j; if(c>=0&&c<COLS && clockLabel[j]!==" "){ setCh(grid,1,c,clockLabel[j]); setMode(mg,1,c,'dolly'); } }
  // the 9-to-5 crowd, clocking in and out
  for(const w of dollyWorkers){
    const xi=Math.round(w.x); if(xi<-3||xi>COLS+3) continue;
    const bob=(Math.sin(w.ph)>0)?0:1, r=streetRow-1-bob;
    const art=(Math.floor(w.ph)%2===0)?"o/":"\\o";
    for(let j=0;j<art.length;j++){ const c=xi+j; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,art[j]); setMode(mg,r,c,'dolly'); } }
  }
  return {grid,mg};
}


function __m55_loop(){
if(phase==='dolly'){
    scene.style.textShadow="0 0 8px #ff8fc0";
    if(!dollyStarted){ dollyStarted=true; dollyT=0; dollySubPhase='arrive'; dollyInit(); document.body.style.background="#100a14"; }
    if(dollySubPhase==='arrive'){
      dollyStepArrive();
      const {grid,mg}=dollyRender("9:00 AM");
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      dollyLineT++;
      if(dollyLineT>11){ dollyLineT=0; dollyLineIdx=Math.min(dollyLines.length-1, dollyLineIdx+1); }
      sub.textContent=dollyLines[dollyLineIdx]; sub.style.color="#ff8fc0"; sub.style.textShadow="0 0 8px #a0308a";
      dollyT++;
      const allArrived=dollyWorkers.every(w=>w.arrived);
      if(!allArrived){ timer=setTimeout(loop,80); }
      else { dollySubPhase='work'; dollyT=0; loop(); }
    }else if(dollySubPhase==='work'){
      for(const w of dollyWorkers) w.ph+=0.3;
      const {grid,mg}=dollyRender("WORKING 9 TO 5");
      scene.innerHTML=paint(grid,mg,'city');
      dollyLineT++;
      if(dollyLineT>11){ dollyLineT=0; dollyLineIdx=Math.min(dollyLines.length-1, dollyLineIdx+1); }
      sub.textContent=dollyLines[dollyLineIdx]; sub.style.color="#ff8fc0"; sub.style.textShadow="0 0 8px #a0308a";
      dollyT++;
      if(dollyLineIdx<dollyLines.length-1){ timer=setTimeout(loop,80); }
      else { dollySubPhase='leave'; dollyT=0; loop(); }
    }else if(dollySubPhase==='leave'){
      dollyStepLeave();
      const {grid,mg}=dollyRender("5:00 PM");
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="QUITTIN' TIME!"; sub.style.color="#ff8fc0"; sub.style.textShadow="0 0 8px #a0308a";
      dollyT++;
      const allGone=dollyWorkers.every(w=> w.x<-6 || w.x>COLS+6);
      if(!(allGone && dollyT>10)){ timer=setTimeout(loop,70); }
      else { phase='dolly_hold'; loop(); }
    }
  }else if(phase==='dolly_hold'){
    stage.classList.remove('shake');
    const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="RIP Dolly Parton. — press RESET"; sub.style.color="#ff8fc0"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m55_start(){
      // DOLLY PINK -> 9 to 5
    attackMode='dolly';
    cmd.style.color="#ff8fc0"; cmd.style.textShadow="0 0 20px #a0308a";
    dollyStarted=false; phase='dolly';
  
}


function __m55_reset(){
  dollyStarted=false; dollyT=0; dollySubPhase='arrive'; dollyWorkers=[]; dollyLineIdx=0; dollyLineT=0;
}


registerMethod(55, { start: __m55_start, resetFn: __m55_reset, loopFn: __m55_loop, phaseNames: ['dolly', 'dolly_hold'] });
