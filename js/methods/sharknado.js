let sharkStarted=false, sharkT=0, sharkX=0, sharks=[];


// ---- SHARKNADO: a watery funnel full of flying, chomping sharks ----
const sharkR=["<((((\u00ba>","<===xWx","<\\vvv/O>"];    // right-facing sharks
const sharkL=["<\u00ba))))>","xWx===>","<O\\vvv/>"];     // left-facing sharks
function sharknadoInit(){
  sharks=[];
  const n=7+((Math.random()*6)|0);
  for(let i=0;i<n;i++){
    const face=Math.random()<0.5?1:-1;
    sharks.push({ ang:Math.random()*Math.PI*2, rad:3+Math.random()*Math.floor(COLS*0.13),
      spin:0.15+Math.random()*0.2, yoff:(Math.random()*streetRow*0.7)|0,
      face, art:(face>0?sharkR:sharkL)[(Math.random()*sharkR.length)|0] });
  }
}
function sharknadoStep(){
  for(const s of sharks){ s.ang+=s.spin; }
}
function sharknadoRender(fx, t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const cxi=Math.round(fx);

  // destroy buildings within the spout's reach (widening toward the ground)
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    const reach=2+Math.floor((r/streetRow)*Math.floor(COLS*0.11));
    for(let c=cxi-reach;c<=cxi+reach;c++){ if(c>=0&&c<COLS && Math.random()<0.7) line[c]=" "; }
    grid[r]=line.join("");
  }

  // the watery waterspout funnel: swirling ~ and slashes
  for(let r=0;r<=streetRow;r++){
    const frac=r/streetRow;
    const w=1+Math.floor(frac*Math.floor(COLS*0.10));
    const swirl=Math.sin((r*0.6)+t*0.9);
    for(let j=-w;j<=w;j++){
      if(Math.random()<0.4)continue;
      const c=cxi+j+Math.round(swirl*1.5);
      if(c<0||c>=COLS)continue;
      const ch = (Math.random()<0.5) ? ((swirl>0)?"/":"\\") : (Math.random()<0.5?"~":"\u2248");
      setCh(grid,r,c,ch); setMode(mg,r,c,'waterspout');
    }
  }

  // flying sharks orbiting the funnel
  for(const s of sharks){
    const px=Math.round(cxi + Math.cos(s.ang)*s.rad);
    const py=Math.round((streetRow*0.5 - s.yoff*0.3) + Math.sin(s.ang)*s.rad*0.45);
    // point the shark the way it's moving
    const goingRight=Math.cos(s.ang+Math.PI/2)>0;
    const art=goingRight?s.art.replace(/</g,'>'):s.art;   // rough flip cue (kept simple)
    for(let j=0;j<s.art.length;j++){
      const c=px+j-Math.floor(s.art.length/2), r=py;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue;
      if(s.art[j]===" ")continue;
      setCh(grid,r,c,s.art[j]); setMode(mg,r,c,'shark');
    }
  }
  // splashy debris flung around
  for(let k=0;k<COLS*0.18;k++){
    const ang=Math.random()*Math.PI*2, rad=2+Math.random()*Math.floor(COLS*0.15);
    const c=Math.round(cxi+Math.cos(ang)*rad), r=Math.round((streetRow*0.5)+Math.sin(ang)*rad*0.5-(t%5));
    if(c>=0&&c<COLS&&r>=0&&r<streetRow){ setCh(grid,r,c,(Math.random()<0.5?"~":"@")); setMode(mg,r,c,'waterspout'); }
  }
  // wet wreckage on the street behind the spout
  { let g=grid[streetRow].split("");
    for(let c=0;c<cxi&&c<COLS;c++){ if(Math.random()<0.3) g[c]=(Math.random()<0.5?"~":"."); }
    grid[streetRow]=g.join(""); }
  return {grid,mg};
}


function __m16_loop(){
if(phase==='sharknado'){
    scene.style.textShadow="0 0 8px #3ad0c0";
    if(!sharkStarted){ sharkStarted=true; sharkT=0; sharkX=-4; sharknadoInit(); document.body.style.background="#050e10"; }
    stepRain();
    sharknadoStep();
    const {grid,mg}=sharknadoRender(sharkX, sharkT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="SHARKNADO! IT'S RAINING SHARKS"; sub.style.color="#5ae0d0"; sub.style.textShadow="0 0 8px #1a7a6a";
    sharkX+=Math.max(1,Math.floor(COLS/42)); sharkT++;
    if(sharkX<COLS+4){ timer=setTimeout(loop,70); }
    else { phase='shark_hold'; loop(); }
  }else if(phase==='shark_hold'){
    stage.classList.remove('shake');
    sharknadoStep();
    const {grid,mg}=sharknadoRender(COLS+10, sharkT);   // spout off-screen; sharks flop in the ruins
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="eaten and washed away. — press RESET"; sub.style.color="#5ae0d0"; sub.className="";
    sharkT++;
    timer=setTimeout(loop,150);
  }
}


function __m16_start(){
      // TEAL -> sharknado
    attackMode='sharknado';
    cmd.style.color="#3ad0c0"; cmd.style.textShadow="0 0 20px #1a7a6a";
    sharkStarted=false; phase='sharknado';
  
}


function __m16_reset(){
  sharkStarted=false; sharkT=0; sharkX=0; sharks=[];
}


registerMethod(16, { start: __m16_start, resetFn: __m16_reset, loopFn: __m16_loop, phaseNames: ['sharknado', 'shark_hold'] });
