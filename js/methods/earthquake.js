let qStarted=false, qT=0, qCracks=[], qFall=0;


// ---- EARTHQUAKE: the ground splits and buildings topple into the fissures ----
function quakeRender(t, fall){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // progressively collapse buildings: taller portions crumble first as `fall` grows
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    const height=streetRow-r;                 // higher rows = taller
    for(let c=0;c<COLS;c++){
      if(line[c]!==" " && line[c]!=="|"){
        // collapse chance scales with how high it is and how far the quake has progressed
        if(Math.random() < fall*(0.3+height/streetRow*0.7)) line[c]=(Math.random()<0.4?"#":" ");
      }
    }
    grid[r]=line.join("");
  }

  // jagged fissures splitting the street + underground
  if(qCracks.length===0){
    const n=3+((Math.random()*4)|0);
    for(let i=0;i<n;i++) qCracks.push({ c:((i+0.5)/n*COLS)|0 + (((Math.random()*10)|0)-5), w:1+((Math.random()*2)|0) });
  }
  for(const cr of qCracks){
    let cc=cr.c;
    for(let r=streetRow;r<ROWS;r++){
      cc += (Math.random()<0.5?0:(Math.random()<0.5?-1:1));   // jagged wander
      for(let w=0;w<cr.w;w++){
        const c=cc+w; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["\\","/","V","Y","Z"][(Math.random()*5)|0]); setMode(mg,r,c,'quake');
      }
    }
    // crack opening at the street itself
    if(cr.c>=0&&cr.c<COLS){ setCh(grid,streetRow,cr.c,"V"); setMode(mg,streetRow,cr.c,'quake'); }
  }
  // toppled rubble mounds on the street
  { let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){ if(Math.random()<fall*0.4) g[c]=(Math.random()<0.5?"#":"="); if(g[c]==="#"||g[c]==="=") setMode(mg,streetRow,c,'quake'); }
    grid[streetRow]=g.join(""); }
  return {grid,mg};
}


function __m10_loop(){
if(phase==='quake'){
    scene.style.textShadow="0 0 8px #a9743a";
    if(!qStarted){ qStarted=true; qT=0; qFall=0; qCracks=[]; document.body.style.background="#0c0805"; }
    stepRain();
    qFall=Math.min(1, qFall+0.03);
    const {grid,mg}=quakeRender(qT, qFall);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');                    // constant violent shaking
    sub.textContent= qFall<0.6 ? "THE GROUND HEAVES AND SPLITS" : "THE CITY CRUMBLES INTO THE EARTH";
    sub.style.color="#c68a4a"; sub.style.textShadow="0 0 8px #6a3a10";
    qT++;
    if(!(qFall>=1 && qT>45)){ timer=setTimeout(loop,75); }
    else { phase='quake_hold'; loop(); }
  }else if(phase==='quake_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=quakeRender(qT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="reduced to ruins. — press RESET"; sub.style.color="#c68a4a"; sub.className="";
    qT++;
    timer=setTimeout(loop,150);
  }
}


function __m10_start(){
      // BROWN -> earthquake
    attackMode='quake';
    cmd.style.color="#a9743a"; cmd.style.textShadow="0 0 20px #6a3a10";
    qStarted=false; phase='quake';
  
}


function __m10_reset(){
  qStarted=false; qT=0; qCracks=[]; qFall=0;
}


registerMethod(10, { start: __m10_start, resetFn: __m10_reset, loopFn: __m10_loop, phaseNames: ['quake', 'quake_hold'] });
