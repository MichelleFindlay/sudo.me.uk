let npStarted=false, npT=0, npDrops=[], npFire=[];


// ---- napalm: incendiary blobs rain down, igniting spreading flames that consume the city ----
// npDrops: falling blobs {x,y,spd}; npFire: {c, h} columns of fire with a height that grows.
function napalmInit(){
  npDrops=[]; npFire=[];
  const n=Math.max(10,Math.floor(COLS*0.5));
  for(let i=0;i<n;i++){
    npDrops.push({ x:(Math.random()*COLS)|0, y:-((Math.random()*ROWS)|0), spd:1+Math.random()*2 });
  }
}
function napalmStep(t){
  // advance blobs; when one reaches street (or a building top), start/boost a fire column
  for(const d of npDrops){
    d.y+=d.spd;
    // ignite when it passes street level
    if(d.y>=streetRow){
      igniteFire(d.x|0);
      d.y=-((Math.random()*8)|0); d.x=(Math.random()*COLS)|0; d.spd=1+Math.random()*2;
    }
  }
  // fires grow taller over time and spread to neighbours
  for(const f of npFire){ if(f.h < f.max) f.h+=0.5; }
  if(t%2===0){
    const spread=[];
    for(const f of npFire){
      if(f.h>3 && Math.random()<0.5){ spread.push(f.c-1); spread.push(f.c+1); }
    }
    for(const c of spread) igniteFire(c);
  }
}
function igniteFire(c){
  if(c<0||c>=COLS)return;
  let f=npFire.find(x=>x.c===c);
  if(!f){ npFire.push({c, h:1, max:streetRow*(0.5+Math.random()*0.45)}); }
  else { f.h=Math.min(f.max, f.h+1); }
}
function napalmRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const fireChars=["#","@","A","^","/","\\"];
  const emberChars=["'","\u00b0","."];

  // draw fire columns rising from the street, burning away the buildings behind them
  for(const f of npFire){
    const h=Math.floor(f.h);
    for(let k=0;k<h;k++){
      const r=streetRow-k;
      if(r<0)break;
      // flame body denser at base, flickery at top
      const near=k<h*0.6;
      const ch= near ? fireChars[(Math.random()*fireChars.length)|0]
                     : (Math.random()<0.5?emberChars[(Math.random()*emberChars.length)|0]:fireChars[(Math.random()*2)|0]);
      // little horizontal flicker
      const jitter=(Math.random()<0.3)?(Math.random()<0.5?-1:1):0;
      const c=f.c+jitter;
      if(c<0||c>=COLS)continue;
      if(Math.random()<0.1)continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,'flames');
    }
    // scorch the street under the fire
    setCh(grid,streetRow,f.c,"^"); setMode(mg,streetRow,f.c,'flames');
  }
  // clear building material that fire has reached (burn them down)
  for(const f of npFire){
    const h=Math.floor(f.h);
    for(let r=streetRow-1;r>streetRow-h;r--){
      // above the visible flame, leave charred gaps
      if(Math.random()<0.5 && grid[r] && grid[r][f.c] && grid[r][f.c]!==" " && mg[r][f.c]!=='flames'){
        setCh(grid,r,f.c," ");
      }
    }
  }

  // falling napalm blobs
  for(const d of npDrops){
    const r=Math.round(d.y), c=d.x|0;
    if(r<0||r>=ROWS||c<0||c>=COLS)continue;
    if(!grid[r]||grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"*":"o")); setMode(mg,r,c,'napalm'); }
    // little tail
    if(r-1>=0 && (!grid[r-1]||grid[r-1][c]===" ")){ setCh(grid,r-1,c,"'"); setMode(mg,r-1,c,'napalm'); }
  }

  // drifting smoke high above the inferno
  for(let k=0;k<COLS*0.2;k++){
    const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.max(1,streetRow-8))|0);
    if(npFire.length>COLS*0.3 && Math.random()<0.3){ setCh(grid,r,c,["'",".","\u00b0"][(Math.random()*3)|0]); setMode(mg,r,c,'flames'); }
  }
  return {grid,mg};
}


function __m4_loop(){
if(phase==='napalm'){
    scene.style.textShadow="0 0 12px #ff6a00";
    if(!npStarted){ npStarted=true; npT=0; napalmInit(); document.body.style.background="#160a04"; }
    stepRain();
    napalmStep(npT);
    const {grid,mg}=napalmRender(npT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    // shake harder as the firestorm builds
    if(npFire.length>COLS*0.25) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent="~ FIREBOMBING RUN ~ EVERYTHING BURNS"; sub.style.color="#ff8c1a"; sub.style.textShadow="0 0 8px #ff6a00";
    npT++;
    // done once fire covers most of the width and has burned a while
    const covered = npFire.length >= COLS*0.85;
    if(!(covered && npT>60)){ timer=setTimeout(loop,70); }
    else { phase='np_hold'; loop(); }
  }else if(phase==='np_hold'){
    stage.classList.remove('shake');
    napalmStep(npT);                 // keep flames flickering in place
    const {grid,mg}=napalmRender(npT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is ash. — press RESET"; sub.style.color="#ff8c1a"; sub.className="";
    npT++;
    timer=setTimeout(loop,120);
  }
}


function __m4_start(){
       // ORANGE -> napalm
    attackMode='napalm';
    cmd.style.color="#ff8c1a"; cmd.style.textShadow="0 0 22px #ff6a00";
    npStarted=false; phase='napalm';
  
}


function __m4_reset(){
  npStarted=false; npT=0; npDrops=[]; npFire=[];
}


registerMethod(4, { start: __m4_start, resetFn: __m4_reset, loopFn: __m4_loop, phaseNames: ['napalm', 'np_hold'] });
