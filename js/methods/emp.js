let empStarted=false, empT=0, empPhase='charge', empR=0, empArcs=[];


// ---- EMP: an electromagnetic pulse blacks out the city (buildings stand, lights die) ----
// darken the city: strip lit windows in the pulse's reach, dim the rest to silhouettes.
function empRender(t, R, mode){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const half=R;

  // everything within the pulse radius loses power: windows go dark, buildings become silhouettes
  for(let r=0;r<=streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cx-half;c<=cx+half;c++){ if(c<0||c>=COLS)continue;
      if(ln[c]==="."||ln[c]===":"){ ln[c]=" "; }        // lit windows switch OFF
      else if(ln[c]!==" "){ setMode(mg,r,c,'dead'); }   // structure dims to a dark silhouette
    }
    grid[r]=ln.join(""); }

  // the pulse: a bright expanding ring sweeping outward from ground zero
  if(mode==='pulse'){
    for(const dir of [-1,1]){ const c=cx+dir*R;
      for(let r=Math.max(0,streetRow-Math.floor(R*0.6));r<=streetRow;r++){ const cc=c; if(cc>=0&&cc<COLS){ setCh(grid,r,cc, dir>0?")":"("); setMode(mg,r,cc,'emp'); } }
    }
    // crackling arcs along the ring edge and radiating from centre
    for(let k=0;k<COLS*0.25;k++){ const ang=Math.random()*Math.PI - Math.PI; const rad=R*(0.7+Math.random()*0.4);
      const c=Math.round(cx+Math.cos(ang)*rad), rr=Math.round(streetRow+Math.sin(ang)*rad*0.5);
      if(c>=0&&c<COLS&&rr>=0&&rr<ROWS){ setCh(grid,rr,c,["z","/","\\","~","x"][(Math.random()*5)|0]); setMode(mg,rr,c,'emp'); } }
    // central burst
    for(let k=0;k<COLS*0.15;k++){ const c=cx+(((Math.random()*R)|0)-Math.floor(R/2)), rr=1+((Math.random()*streetRow)|0);
      if(c>=0&&c<COLS){ setCh(grid,rr,c,["*","+","x"][(Math.random()*3)|0]); setMode(mg,rr,c,'emp'); } }
  }
  // dead planes/sparks falling once powered down
  if(mode==='dead' || R>=COLS){
    for(let k=0;k<COLS*0.05;k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.floor(streetRow*0.5))|0); setCh(grid,r,c,(Math.random()<0.5?"'":".")); setMode(mg,r,c,'dead'); }
  }
  return {grid,mg};
}


function __m29_loop(){
if(phase==='emp'){
    scene.style.textShadow="0 0 12px #a0f0ff";
    if(!empStarted){ empStarted=true; empT=0; empPhase='charge'; empR=0; document.body.style.background="#04080e"; }
    if(empPhase==='charge'){
      // a device crackles and charges — arcs gathering at the centre
      stepRain();
      const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
      const mg=modeGridFill(ROWS,COLS,'city');
      for(let k=0;k<COLS*0.15;k++){ const c=cx+(((Math.random()*16)|0)-8), r=streetRow-((Math.random()*Math.floor(streetRow*0.4))|0); if(c>=0&&c<COLS){ setCh(grid,r,c,["z","*","x","~"][(Math.random()*4)|0]); setMode(mg,r,c,'emp'); } }
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="EMP CHARGING… "+("|".repeat((empT%4)+1)); sub.style.color="#d0faff"; sub.style.textShadow="0 0 8px #2080c0";
      empT++;
      if(empT<16){ timer=setTimeout(loop,80); }
      else { empPhase='flash'; loop(); }
    }else if(empPhase==='flash'){
      flash.style.transition="opacity 0.02s"; flash.style.opacity=1;
      document.body.style.background="#e8feff"; scene.innerHTML=""; sub.textContent="* PULSE *";
      stage.classList.add('shake');
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.2s"; flash.style.opacity=0; document.body.style.background="#02060a"; empPhase='pulse'; empR=2; loop(); }, 160);
    }else if(empPhase==='pulse'){
      // the pulse ring sweeps outward; lights die behind it
      const {grid,mg}=empRender(empT, empR, 'pulse');
      scene.innerHTML=paint(grid,mg,'city');
      if(empR<COLS*0.3) stage.classList.add('shake'); else stage.classList.remove('shake');
      sub.textContent="ELECTROMAGNETIC PULSE — THE GRID GOES DOWN"; sub.style.color="#d0faff"; sub.style.textShadow="0 0 8px #2080c0";
      empR+=Math.max(3,Math.floor(COLS/16));
      if(empR<cx+4){ timer=setTimeout(loop,55); }
      else { empPhase='dead'; empT=0; loop(); }
    }else if(empPhase==='dead'){
      // silent, dark, powerless city
      const {grid,mg}=empRender(empT, COLS, 'dead');
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      sub.textContent="EVERYTHING IS DARK AND SILENT"; sub.style.color="#6a90a0"; sub.style.textShadow="0 0 6px #204050";
      empT++;
      if(empT<24){ timer=setTimeout(loop,110); }
      else { phase='emp_hold'; loop(); }
    }
  }else if(phase==='emp_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=empRender(empT, COLS, 'dead');
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#02060a";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="no power, no lights, nothing works. — press RESET"; sub.style.color="#6a90a0"; sub.className="";
    empT++;
    timer=setTimeout(loop,160);
  }
}


function __m29_start(){
      // ELECTRIC CYAN -> EMP
    attackMode='emp';
    cmd.style.color="#a0f0ff"; cmd.style.textShadow="0 0 22px #2080c0";
    empStarted=false; phase='emp';
  
}


function __m29_reset(){
  empStarted=false; empT=0; empPhase='charge'; empR=0; empArcs=[];
}


registerMethod(29, { start: __m29_start, resetFn: __m29_reset, loopFn: __m29_loop, phaseNames: ['emp', 'emp_hold'] });
