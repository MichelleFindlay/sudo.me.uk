let dragStarted=false, dragT=0, dragons=[], dragDmg=0, dragBurn=null;


// ---- DRAGONS: Drogon & co. wheel over the city and burn it to ash ----
const dragonSprite=["<vvVOvv>", "  ^^^^  "];    // wings + body with eye
function dragonsInit(){
  dragons=[]; dragDmg=0; dragBurn=null;
  for(let i=0;i<3;i++){ dragons.push({ x:-((Math.random()*COLS)|0), y:2+((Math.random()*Math.floor(streetRow*0.4))|0), spd:1+Math.random()*1.5, dir:1, burn:Math.random()<0.5, burnCool:((Math.random()*20)|0) }); }
}
function dragonsStep(t){
  if(!dragBurn) dragBurn=new Array(COLS).fill(0);   // per-column burn intensity (0..1)
  for(const d of dragons){ d.x+=d.spd*d.dir; d.y+=Math.sin(t*0.2+d.x*0.05)*0.4;
    // dragons toggle their fire breath on and off as they fly
    d.burnCool--; if(d.burnCool<=0){ d.burn=!d.burn; d.burnCool=8+((Math.random()*16)|0); }
    if(d.dir>0 && d.x>COLS+8){ d.x=-8; d.y=2+((Math.random()*Math.floor(streetRow*0.4))|0); }
    if(d.dir<0 && d.x<-8){ d.x=COLS+8; }
    // where a breathing dragon is, ignite the columns beneath it
    if(d.burn){ const xi=Math.round(d.x); for(let dj=-3;dj<=3;dj++){ const c=xi+dj; if(c>=0&&c<COLS) dragBurn[c]=Math.min(1, dragBurn[c]+0.15); } }
  }
  // track how far the fire has spread (for the completion check) = burned column count
  let burned=0; for(let c=0;c<COLS;c++) if(dragBurn[c]>0.3) burned++;
  dragDmg=burned;
}
function dragonsRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!dragBurn) dragBurn=new Array(COLS).fill(0);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // permanently burn away buildings ONLY in columns that have actually been torched
  for(let c=0;c<COLS;c++){ if(dragBurn[c]>0.4 && cityGridArr[0]!==undefined){
    for(let r=0;r<streetRow;r++){ if(cityGridArr[r] && cityGridArr[r][c] && cityGridArr[r][c]!==" " && Math.random()<dragBurn[c]*0.25){ let ln=cityGridArr[r].split(""); ln[c]=" "; cityGridArr[r]=ln.join(""); } } } }
  collapseCity(0.35);   // burnt-out buildings collapse
  for(let r=0;r<ROWS;r++) grid[r]=cityGridArr[r];
  // ground fires + ash only where actually burned (small licks at street level)
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(dragBurn[c]>0.35 && Math.random()<dragBurn[c]*0.35){ g[c]=(Math.random()<0.5?"#":"^"); setMode(mg,streetRow,c,'dragonfire'); } } grid[streetRow]=g.join(""); }
  // flames flickering ON the burning buildings — recolour building cells as fire, plus a lick just above the rooftop
  for(let c=0;c<COLS;c++){ if(dragBurn[c]<=0.35) continue;
    let topSolid=-1;
    for(let r=0;r<streetRow;r++){
      if(grid[r] && grid[r][c] && grid[r][c]!==" "){
        if(topSolid<0) topSolid=r;                 // remember the rooftop
        // set the building surface alight (some of its own material turns to flame)
        if(Math.random()<dragBurn[c]*0.4){ setCh(grid,r,c,["#","@","^"][(Math.random()*3)|0]); setMode(mg,r,c,'dragonfire'); }
      }
    }
    // a small flame flickering just above the rooftop of the burning building
    if(topSolid>0 && Math.random()<dragBurn[c]*0.6){ setCh(grid,topSolid-1,c,(Math.random()<0.5?"^":"*")); setMode(mg,topSolid-1,c,'dragonfire'); }
  }
  // the dragons wheeling overhead, breathing fire down
  for(const d of dragons){
    const xi=Math.round(d.x), yi=Math.round(d.y);
    for(let i=0;i<dragonSprite.length;i++){ const art=dragonSprite[i];
      for(let j=0;j<art.length;j++){ const c=xi+j-4, r=yi+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'dragon'); } }
    // breath cone down to the ground (only when actively breathing)
    if(d.burn){ const mc=xi; for(let r=yi+2;r<streetRow;r++){ const spread=1+Math.floor((r-yi)/6);
      for(let dj=-spread;dj<=spread;dj++){ const c=mc+dj; if(c<0||c>=COLS)continue; if(Math.random()<0.6){ setCh(grid,r,c,["#","@","%"][(Math.random()*3)|0]); setMode(mg,r,c,'dragonfire'); } } } }
  }
  return {grid,mg};
}


function __m21_loop(){
if(phase==='dragons'){
    scene.style.textShadow="0 0 10px #ff9020";
    if(!dragStarted){ dragStarted=true; dragT=0; dragonsInit(); document.body.style.background="#100604"; }
    stepRain();
    dragonsStep(dragT);
    const {grid,mg}=dragonsRender(dragT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(dragDmg>COLS*0.3) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= dragDmg<COLS*0.5 ? "DRAGONS CIRCLE OVERHEAD" : "DRACARYS — THE CITY BURNS";
    sub.style.color="#ffb050"; sub.style.textShadow="0 0 8px #c04000";
    dragT++;
    if(!(dragDmg>=Math.floor(COLS*0.75) && dragT>40)){ timer=setTimeout(loop,75); }
    else { phase='dragons_hold'; loop(); }
  }else if(phase==='dragons_hold'){
    stage.classList.remove('shake');
    dragonsStep(dragT);
    const {grid,mg}=dragonsRender(dragT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="burned to ash by dragonfire. — press RESET"; sub.style.color="#ffb050"; sub.className="";
    dragT++;
    timer=setTimeout(loop,150);
  }
}


function __m21_start(){
      // GOLD -> dragons
    attackMode='dragons';
    cmd.style.color="#ff9020"; cmd.style.textShadow="0 0 22px #c04000";
    dragStarted=false; phase='dragons';
  
}


function __m21_reset(){
  dragStarted=false; dragT=0; dragons=[]; dragDmg=0; dragBurn=null;
}


registerMethod(21, { start: __m21_start, resetFn: __m21_reset, loopFn: __m21_loop, phaseNames: ['dragons', 'dragons_hold'] });
