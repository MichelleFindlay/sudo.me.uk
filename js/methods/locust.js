let locStarted=false, locT=0, locusts=[], locEaten=0;


// ---- locust swarm: a plague of insects blots the sky and devours the city ----
const locChars=["}","{","x","X",")","("];
function locustInit(){
  locusts=[]; locEaten=0;
  const n=Math.floor(COLS*1.2);
  for(let i=0;i<n;i++){
    locusts.push({ x:-((Math.random()*COLS)|0)-2, y:(Math.random()*(streetRow))|0,
      spd:0.8+Math.random()*1.8, bob:Math.random()*6, amp:0.4+Math.random()*1.2 });
  }
}
function locustStep(t){
  for(const l of locusts){
    l.x+=l.spd; l.bob+=0.5;
    if(l.x>COLS+2){ l.x=-2-((Math.random()*10)|0); l.y=(Math.random()*streetRow)|0; }
  }
  // the swarm eats inward from the left as it passes over the city
  locEaten=Math.min(COLS, locEaten + Math.max(1,Math.floor(COLS/44)));
}
function locustRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // devour buildings in the eaten zone (left..locEaten): nibble away, leaving sparse husks
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<locEaten && c<COLS;c++){
      if(line[c]!==" "){
        // closer to the leading edge = more thoroughly stripped
        const depth=(locEaten-c)/Math.max(1,locEaten);
        if(Math.random()<0.3+depth*0.6) line[c]=" ";
      }
    }
    grid[r]=line.join("");
  }
  // frass/dust on the street where they've fed
  { let g=grid[streetRow].split("");
    for(let c=0;c<locEaten && c<COLS;c++){ if(Math.random()<0.3) g[c]=(Math.random()<0.5?"`":"."); }
    grid[streetRow]=g.join(""); }

  // draw the flying swarm (dense cloud of insects)
  for(const l of locusts){
    const xi=Math.round(l.x), yi=Math.round(l.y+Math.sin(l.bob)*l.amp);
    if(xi<0||xi>=COLS||yi<0||yi>=ROWS)continue;
    setCh(grid,yi,xi, locChars[(Math.random()*locChars.length)|0]);
    setMode(mg,yi,xi,'locust');
  }
  return {grid,mg};
}


function __m8_loop(){
if(phase==='locust'){
    scene.style.textShadow="0 0 8px #c99a3a";
    if(!locStarted){ locStarted=true; locT=0; locustInit(); document.body.style.background="#0c0a04"; }
    stepRain();
    locustStep(locT);
    const {grid,mg}=locustRender(locT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = locEaten<COLS*0.5 ? "A PLAGUE OF LOCUSTS DARKENS THE SKY" : "THE SWARM DEVOURS EVERYTHING";
    sub.style.color="#d9b45a"; sub.style.textShadow="0 0 8px #8a6a1a";
    locT++;
    if(!(locEaten>=COLS && locT>40)){ timer=setTimeout(loop,70); }
    else { phase='locust_hold'; loop(); }
  }else if(phase==='locust_hold'){
    stage.classList.remove('shake');
    locustStep(locT);
    const {grid,mg}=locustRender(locT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="nothing but bones and dust. — press RESET"; sub.style.color="#d9b45a"; sub.className="";
    locT++;
    timer=setTimeout(loop,140);
  }
}


function __m8_start(){
       // AMBER -> locust swarm
    attackMode='locust';
    cmd.style.color="#c99a3a"; cmd.style.textShadow="0 0 20px #8a6a1a";
    locStarted=false; phase='locust';
  
}


function __m8_reset(){
  locStarted=false; locT=0; locusts=[]; locEaten=0;
}


registerMethod(8, { start: __m8_start, resetFn: __m8_reset, loopFn: __m8_loop, phaseNames: ['locust', 'locust_hold'] });
