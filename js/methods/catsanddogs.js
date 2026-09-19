let cdStarted=false, cdT=0, cdDrops=[], cdLanded=[];


// ---- CATS AND DOGS: it rains cats and dogs, literally — they land safely and mill about on the street ----
function catsdogsInit(){
  cdDrops=[]; cdLanded=[];
  const n=Math.max(8,Math.floor(COLS*0.35));
  for(let i=0;i<n;i++){
    cdDrops.push({ x:(Math.random()*COLS)|0, y:-((Math.random()*ROWS)|0), spd:1+Math.random()*1.5, kind: Math.random()<0.5?'cat':'dog' });
  }
}
function catsdogsStep(){
  for(const d of cdDrops){
    d.y+=d.spd;
    if(d.y>=streetRow-1){
      cdLanded.push({ x:d.x, kind:d.kind, wob:Math.random()*Math.PI*2 });
      d.y=-((Math.random()*10)|0); d.x=(Math.random()*COLS)|0; d.spd=1+Math.random()*1.5; d.kind=Math.random()<0.5?'cat':'dog';
    }
  }
}
function catsdogsRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();           // the city itself is never touched — nobody's buildings are harmed
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const a of cdLanded){
    const jitter=Math.sin(t*0.15+a.wob)*1.2;    // gentle side-to-side milling
    const c=Math.round(a.x+jitter), r=streetRow-1;
    if(c<0||c>=COLS||r<0)continue;
    setCh(grid,r,c, a.kind==='cat'?"c":"d");
    setMode(mg,r,c,'catsdogs');
  }
  for(const d of cdDrops){
    const r=Math.round(d.y), c=d.x|0;
    if(r<0||r>=ROWS||c<0||c>=COLS)continue;
    setCh(grid,r,c, d.kind==='cat'?"C":"D");
    setMode(mg,r,c,'catsdogsfall');
    if(r-1>=0){ setCh(grid,r-1,c,"'"); setMode(mg,r-1,c,'catsdogsfall'); }
  }
  if(cdLanded.length>0 && t%25===0){
    const pick=cdLanded[(Math.random()*cdLanded.length)|0];
    mtDrawBubble(grid, mg, Math.round(pick.x), streetRow-1, pick.kind==='cat'?'MEOW':'WOOF');
  }
  return {grid,mg};
}


function __m64_loop(){
if(phase==='catsdogs'){
    scene.style.textShadow="0 0 10px #c9a06e";
    if(!cdStarted){ cdStarted=true; cdT=0; catsdogsInit(); document.body.style.background="#0a0c14"; }
    catsdogsStep();
    const {grid,mg}=catsdogsRender(cdT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="IT'S RAINING CATS AND DOGS"; sub.style.color="#e0a458"; sub.style.textShadow="0 0 8px #8a5a2a";
    cdT++;
    const enough = cdLanded.length >= COLS*1.1;
    if(!(enough && cdT>80)){ timer=setTimeout(loop,80); }
    else { phase='catsdogs_hold'; loop(); }
  }else if(phase==='catsdogs_hold'){
    catsdogsStep();                          // keeps drizzling gently, more pets pile up
    const {grid,mg}=catsdogsRender(cdT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the streets are full of cats and dogs. the city is unscathed. — press RESET"; sub.style.color="#e0a458"; sub.className="";
    cdT++;
    timer=setTimeout(loop,120);
  }
}


function __m64_start(){
      // TAN -> Cats and Dogs
    attackMode='catsdogs';
    cmd.style.color="#e0a458"; cmd.style.textShadow="0 0 20px #8a5a2a";
    cdStarted=false; phase='catsdogs';

}


function __m64_reset(){
  cdStarted=false; cdT=0; cdDrops=[]; cdLanded=[];
}


registerMethod(64, { start: __m64_start, resetFn: __m64_reset, loopFn: __m64_loop, phaseNames: ['catsdogs', 'catsdogs_hold'] });
