let triffStarted=false, triffT=0, triffStalks=[];


// ---- THE DAY OF THE TRIFFIDS: a green comet blinds everyone, then the triffids walk ----
function triffidInit(){
  triffStalks=[];
  const n=Math.max(4,Math.floor(COLS/16));
  for(let i=0;i<n;i++){ triffStalks.push({
    x: Math.round((i+0.5)*COLS/n), h:0, maxH: 6+((Math.random()*4)|0),
    lash:0, lashDir: Math.random()<0.5?-1:1 }); }
}
// each stalk grows, then periodically lashes its stinger out and stings whatever it hits
function triffidStep(){
  for(const s of triffStalks){
    if(s.h<s.maxH){ s.h+=0.15; continue; }
    if(s.lash>0){ s.lash--; }
    else if(Math.random()<0.05){ s.lash=6; triffidLash(s.x+s.lashDir*8); s.lashDir=Math.random()<0.5?-1:1; }
  }
}
// the sting permanently damages whatever it connects with — mutates cityGridArr
function triffidLash(col){
  if(cityGridArr.length!==ROWS) return;
  for(let r=Math.max(0,streetRow-3); r<streetRow; r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
    for(let c=col-1;c<=col+1;c++){ if(c>=0&&c<COLS && ln[c]!==" " && Math.random()<0.6) ln[c]=" "; }
    cityGridArr[r]=ln.join(""); }
  collapseCity(1);
}
function triffidRender(t, cometFlash){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the strange green comet, streaking overhead and blinding everyone who watches it
  if(cometFlash>0){ for(let c=0;c<COLS;c++){ if(Math.random()<0.4){ const r=1+((Math.random()*3)|0);
    setCh(grid,r,c,["*",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'comet'); } } }
  // the stalks: grown height, a bulb head once mature, and an occasional stinger lash
  for(const s of triffStalks){ const h=Math.floor(s.h);
    for(let k=0;k<h;k++){ const r=streetRow-1-k; if(r<0) break; setCh(grid,r,s.x,"|"); setMode(mg,r,s.x,'triffid'); }
    if(s.h>=s.maxH){ const topR=streetRow-1-h; if(topR>=0){ setCh(grid,topR,s.x,"@"); setMode(mg,topR,s.x,'triffid');
      if(s.lash>0){ const len=6-s.lash+1; for(let k=1;k<=len;k++){ const c=s.x+s.lashDir*k; if(c>=0&&c<COLS){ setCh(grid,topR,c,"~"); setMode(mg,topR,c,'triffidwhip'); } } } } }
  }
  return {grid,mg};
}


function __m43_loop(){
if(phase==='triffid'){
    scene.style.textShadow="0 0 8px #3a8a3a";
    if(!triffStarted){ triffStarted=true; triffT=0; triffidInit(); document.body.style.background="#04100a"; }
    triffidStep();
    const cometFlash = triffT<20 ? (20-triffT) : 0;
    const {grid,mg}=triffidRender(triffT, cometFlash);
    scene.innerHTML=paint(grid,mg,'city');
    if(triffStalks.some(s=>s.lash>0)) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = cometFlash>0 ? "A STRANGE GREEN COMET LIGHTS THE SKY…" : "THE TRIFFIDS ARE LOOSE, AND EVERYONE IS BLIND";
    sub.style.color="#7ad07a"; sub.style.textShadow="0 0 8px #2a5a2a";
    triffT++;
    if(triffT<90){ timer=setTimeout(loop,80); }
    else { phase='triffid_hold'; loop(); }
  }else if(phase==='triffid_hold'){
    stage.classList.remove('shake');
    triffidStep();
    const {grid,mg}=triffidRender(triffT, 0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the triffids have inherited the earth. — press RESET"; sub.style.color="#7ad07a"; sub.className="";
    triffT++;
    timer=setTimeout(loop,150);
  }
}


function __m43_start(){
      // TRIFFID GREEN -> Day of the Triffids
    attackMode='triffid';
    cmd.style.color="#7ad07a"; cmd.style.textShadow="0 0 20px #2a5a2a";
    triffStarted=false; phase='triffid';
  
}


function __m43_reset(){
  triffStarted=false; triffT=0; triffStalks=[];
}


registerMethod(43, { start: __m43_start, resetFn: __m43_reset, loopFn: __m43_loop, phaseNames: ['triffid', 'triffid_hold'] });
