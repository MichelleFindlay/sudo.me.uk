let etStarted=false, etT=0, etFoamLevel=0, etStreamH=0;


// ---- ELEPHANT'S TOOTHPASTE: a science-fair demo in the town square gets way out of
// hand, and the foam it produces never stops rising, burying the city's lower floors ----
const etFlask=[
  " ___ ",
  "|   |",
  "|   |",
  "|~~~|",
  "|~~~|",
  "|~~~|",
  "|___|",
  " | | ",
  "====="
];
function etFoamCap(){ return Math.max(6, Math.min(15, Math.floor(streetRow*0.5))); }
function etInit(){ etFoamLevel=0; etStreamH=0; }
function etDrawFlask(grid, mg){
  const left=cx-Math.floor(etFlask[0].length/2), top=streetRow-etFlask.length;
  for(let i=0;i<etFlask.length;i++){
    const row=etFlask[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c, ch==="~" ? 'etliquid' : 'etflask');
    }
  }
  return {left, top};
}
// the eruption geysering up out of the flask's neck — separate from, and on top of,
// the slower city-wide flood level rising underneath it
function etDrawStream(grid, mg, flaskLeft, flaskTop, h){
  const mouth=flaskLeft+2;
  for(let k=0;k<h;k++){
    const r=flaskTop-1-k; if(r<0) break;
    const spread=Math.min(3, Math.floor(k/3));
    for(let dx=-spread;dx<=spread;dx++){
      const c=mouth+dx; if(c<0||c>=COLS) continue;
      if(Math.random()<0.7){ setCh(grid,r,c, ["o","O","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'etfoam'); }
    }
  }
}
// fills the bottom `level` rows of the ENTIRE city (not just near the flask) with
// foam texture — a rising surface line on top, bubbly fill underneath
function etFillCity(grid, mg, level){
  for(let k=0;k<level;k++){
    const r=streetRow-k; if(r<0) break;
    const surface=(k===level-1);
    for(let c=0;c<COLS;c++){
      setCh(grid,r,c, surface ? (Math.random()<0.5?"~":"≈") : ["o","O","%","@"][(Math.random()*4)|0]);
      setMode(mg,r,c,'etfoam');
    }
  }
}
function etRender(t, drawStream){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(etFoamLevel>0) etFillCity(grid,mg,etFoamLevel);
  const {left,top}=etDrawFlask(grid,mg);
  if(drawStream) etDrawStream(grid,mg,left,top,etStreamH);
  return {grid,mg};
}


function __m70_loop(){
if(phase==='et_build'){
    scene.style.textShadow="0 0 10px #a0308a";
    if(!etStarted){ etStarted=true; etT=0; etInit(); document.body.style.background="#140a12"; }
    const {grid,mg}=etRender(etT,false);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent = etT<10 ? "AN ELEPHANT'S TOOTHPASTE EXPERIMENT SITS IN THE TOWN SQUARE" : "SOMEONE ADDED WAY TOO MUCH CATALYST";
    sub.style.color="#ff2fb0"; sub.style.textShadow="0 0 8px #7a0a4a";
    etT++;
    if(etT<22){ timer=setTimeout(loop,90); }
    else { phase='et_erupt'; etT=0; etFoamLevel=0; etStreamH=0; loop(); }
  }else if(phase==='et_erupt'){
    scene.style.textShadow="0 0 14px #ff2fb0";
    etStreamH=Math.min(12, etStreamH+1);
    etFoamLevel=Math.min(etFoamCap(), etFoamLevel+Math.max(1,Math.floor(streetRow/40)));
    const {grid,mg}=etRender(etT,true);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', etFoamLevel>2);
    sub.textContent = etFoamLevel<etFoamCap() ? "THE FOAM WON'T STOP COMING" : "IT FILLS THE FIRST FIVE FLOORS OF EVERY BUILDING";
    sub.style.color="#ff2fb0"; sub.style.textShadow="0 0 8px #7a0a4a";
    etT++;
    if(!(etFoamLevel>=etFoamCap() && etT>35)){ timer=setTimeout(loop,80); }
    else { phase='et_hold'; loop(); }
  }else if(phase==='et_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=etRender(etT,false);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is buried up to the fifth floor in foam. — press RESET"; sub.style.color="#ff2fb0"; sub.className="";
    etT++;
    timer=setTimeout(loop,150);
  }
}


function __m70_start(){
      // FOAM PINK -> Elephant's Toothpaste
    attackMode='et_build';
    cmd.style.color="#ff2fb0"; cmd.style.textShadow="0 0 20px #7a0a4a";
    etStarted=false; phase='et_build';

}


function __m70_reset(){
  etStarted=false; etT=0; etFoamLevel=0; etStreamH=0;
}


registerMethod(70, { start: __m70_start, resetFn: __m70_reset, loopFn: __m70_loop, phaseNames: ['et_build', 'et_erupt', 'et_hold'] });
