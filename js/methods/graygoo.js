let gooStarted=false, gooT=0, gooR=0;


// ---- GRAY GOO: self-replicating nanomachines consume everything, spreading outward ----
// r grows from the epicenter until it swallows the farthest corner of the screen — no
// mutation needed, since the same geometric test just keeps re-covering the same ground.
const gooGlyphs="%@o0*+.,";
function gooRender(r){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const gy=Math.floor(streetRow*0.6);             // epicenter roughly mid-skyline
  const aspect=2;                                 // terminal cells are ~2x taller than wide
  for(let row=0; row<ROWS; row++){ let ln=(grid[row]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      const dx=c-cx, dy=(row-gy)*aspect;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>r) continue;
      const front=dist>r-3;                       // the actively-consuming wavefront
      if(ln[c]!==" " || Math.random()<0.15){       // devour structures; only lightly haze empty space
        ln[c]=gooGlyphs[(Math.random()*gooGlyphs.length)|0];
        setMode(mg,row,c, front?'goofront':'goo');
      }
    }
    grid[row]=ln.join(""); }
  return {grid,mg};
}


function __m41_loop(){
if(phase==='goo'){
    scene.style.textShadow="0 0 8px #b8c4cc";
    if(!gooStarted){ gooStarted=true; gooT=0; gooR=0; document.body.style.background="#0a0b0c"; }
    const maxR=Math.sqrt(Math.pow(Math.max(cx,COLS-cx),2)+Math.pow(streetRow*2,2))+4;
    gooR=Math.min(maxR, gooR+Math.max(1,COLS/70));
    const covered=gooR>=maxR;
    const {grid,mg}=gooRender(gooR);
    scene.innerHTML=paint(grid,mg,'city');
    if(!covered) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= covered ? "ECOPHAGY COMPLETE." : "SELF-REPLICATING NANITES CONSUME EVERYTHING";
    sub.style.color="#b8c4cc"; sub.style.textShadow="0 0 8px #5a6068";
    gooT++;
    if(!(covered && gooT>30)){ timer=setTimeout(loop,70); }
    else { phase='goo_hold'; loop(); }
  }else if(phase==='goo_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=gooRender(999999);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="all biomass. all matter. gray goo. — press RESET"; sub.style.color="#b8c4cc"; sub.className="";
    gooT++;
    timer=setTimeout(loop,150);
  }
}


function __m41_start(){
      // NANITE GREY -> Gray Goo
    attackMode='goo';
    cmd.style.color="#b8c4cc"; cmd.style.textShadow="0 0 20px #5a6068";
    gooStarted=false; phase='goo';
  
}


function __m41_reset(){
  gooStarted=false; gooT=0; gooR=0;
}


registerMethod(41, { start: __m41_start, resetFn: __m41_reset, loopFn: __m41_loop, phaseNames: ['goo', 'goo_hold'] });
