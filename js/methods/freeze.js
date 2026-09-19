let frzStarted=false, frzT=0, frzLevel=0, snowflakes=[], spTrainX=0;


// ---- WORLDWIDE FREEZE: a Snowpiercer deep-freeze locks the city in ice ----
function freezeInit(){
  snowflakes=[];
  const n=Math.floor(COLS*0.7);
  for(let i=0;i<n;i++){ snowflakes.push({ x:(Math.random()*COLS)|0, y:(Math.random()*ROWS)|0, spd:0.5+Math.random()*1.2, drift:(Math.random()*2-1)*0.6, ch:["*","+",".","\u2744"][(Math.random()*4)|0] }); }
}
function freezeStep(){
  for(const f of snowflakes){ f.y+=f.spd; f.x+=f.drift; if(f.y>ROWS){ f.y=-1; f.x=(Math.random()*COLS)|0; } if(f.x<0)f.x=COLS-1; if(f.x>=COLS)f.x=0; }
}
function freezeRender(t, level){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ice creeps UP the buildings from the ground as `level` (0..1) grows,
  // encasing them: building chars get frosted/replaced with ice.
  const iceTop=Math.floor(streetRow - level*streetRow);
  for(let r=streetRow;r>=iceTop;r--){
    for(let c=0;c<COLS;c++){
      if(grid[r] && grid[r][c] && grid[r][c]!==" "){
        // frost over existing structure
        if(Math.random()<0.5){ setCh(grid,r,c,(Math.random()<0.4?"#":grid[r][c])); setMode(mg,r,c,'ice'); }
      } else if(r>=streetRow-1 && Math.random()<0.4){
        // ice/snow drifts piling at street level
        setCh(grid,r,c,(Math.random()<0.5?"=":"#")); setMode(mg,r,c,'ice');
      }
    }
  }
  // icicles hanging + frost sparkle on the frozen zone
  for(let k=0;k<COLS*0.2;k++){ const c=(Math.random()*COLS)|0, r=iceTop+((Math.random()*Math.max(1,streetRow-iceTop))|0);
    if(r>=0&&r<streetRow && grid[r] && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"V":".")); setMode(mg,r,c,'ice'); } }
  // thick snowpack on the street
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.3+level*0.5) g[c]="#"; if(g[c]==="#") setMode(mg,streetRow,c,'ice'); } grid[streetRow]=g.join(""); }

  // driving blizzard snow over everything
  for(const f of snowflakes){ const r=Math.round(f.y), c=Math.round(f.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,f.ch); setMode(mg,r,c,'snow'); } }

  // ---- SNOWPIERCER: an elevated track ringing the city with a train looping around it ----
  const trackRow=streetRow-1;
  // lay the track across the full width (train circles the frozen world endlessly)
  { let g=grid[trackRow].split(""); for(let c=0;c<COLS;c++){ g[c]="="; setMode(mg,trackRow,c,'sptrain'); } grid[trackRow]=g.join(""); }
  // trestle supports under the track
  for(let c=0;c<COLS;c+=6){ setCh(grid,streetRow,c,"|"); setMode(mg,streetRow,c,'sptrain'); }
  // the train itself: an engine + a long chain of cars, continuously circling (looping)
  const car="[#oo#]";                       // one carriage
  const engine="@DD==>";                    // engine at the front
  const trainStr=engine + car.repeat(7);    // long Snowpiercer
  const L=trainStr.length;
  const head=((spTrainX % COLS)+COLS)%COLS;  // head column, wraps 0..COLS-1
  for(let j=0;j<L;j++){
    const c=((head - (L-1-j)) % COLS + COLS) % COLS;   // cars trail behind the head, wrapping
    const ch=trainStr[j]; if(ch===" ")continue;
    setCh(grid,trackRow,c,ch); setMode(mg,trackRow,c,'sptrain');
  }

  return {grid,mg};
}


function __m18_loop(){
if(phase==='freeze'){
    scene.style.textShadow="0 0 10px #bfe6ff";
    if(!frzStarted){ frzStarted=true; frzT=0; frzLevel=0; freezeInit(); document.body.style.background="#060c14"; }
    freezeStep();
    spTrainX+=Math.max(1,Math.floor(COLS/44));   // the Snowpiercer circles
    frzLevel=Math.min(1, frzLevel+0.02);
    const {grid,mg}=freezeRender(frzT, frzLevel);
    scene.innerHTML=paint(grid,mg,'city');
    // background pales as the deep freeze sets in
    document.body.style.background = frzLevel<0.5 ? "#0a1420" : (frzLevel<0.9?"#16283a":"#3a5a72");
    sub.textContent = frzLevel<0.5 ? "A GLOBAL DEEP FREEZE DESCENDS" : "THE WORLD LOCKS IN ICE — THE TRAIN CIRCLES ON";
    sub.style.color="#dff2ff"; sub.style.textShadow="0 0 8px #6ab0e0";
    frzT++;
    if(!(frzLevel>=1 && frzT>50)){ timer=setTimeout(loop,80); }
    else { phase='freeze_hold'; loop(); }
  }else if(phase==='freeze_hold'){
    stage.classList.remove('shake');
    freezeStep();
    spTrainX+=Math.max(1,Math.floor(COLS/44));   // train keeps looping forever
    const {grid,mg}=freezeRender(frzT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#3a5a72";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="frozen solid — the train never stops. — press RESET"; sub.style.color="#dff2ff"; sub.className="";
    frzT++;
    timer=setTimeout(loop,140);
  }
}


function __m18_start(){
      // ICE BLUE -> worldwide freeze
    attackMode='freeze';
    cmd.style.color="#bfe6ff"; cmd.style.textShadow="0 0 22px #6ab0e0";
    frzStarted=false; phase='freeze';
  
}


function __m18_reset(){
  frzStarted=false; frzT=0; frzLevel=0; snowflakes=[]; spTrainX=0;
}


registerMethod(18, { start: __m18_start, resetFn: __m18_reset, loopFn: __m18_loop, phaseNames: ['freeze', 'freeze_hold'] });
