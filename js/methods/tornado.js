let tornStarted=false, tornT=0, tornX=0, tornDebris=[];


// ---- TORNADO: a funnel crosses the city, sucking buildings into flying debris ----
function tornadoRender(tx, t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const cxi=Math.round(tx);

  // destroy buildings within the funnel's reach (a band around tx that widens near ground)
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    const reach=2+Math.floor((r/streetRow)*Math.floor(COLS*0.10));   // wider lower down
    for(let c=cxi-reach;c<=cxi+reach;c++){ if(c>=0&&c<COLS && Math.random()<0.7) line[c]=" "; }
    grid[r]=line.join("");
  }

  // draw the funnel: narrow at top, flaring to the ground, made of spinning slashes
  for(let r=0;r<=streetRow;r++){
    const frac=r/streetRow;
    const w=1+Math.floor(frac*Math.floor(COLS*0.09));
    const swirl=Math.sin((r*0.7)+t*0.9);
    for(let j=-w;j<=w;j++){
      if(Math.random()<0.35)continue;
      const c=cxi+j+Math.round(swirl*1.5);
      if(c<0||c>=COLS)continue;
      const ch = (j%2===0) ? ((swirl>0)?"/":"\\") : (Math.random()<0.5?"(":"|");
      setCh(grid,r,c,ch); setMode(mg,r,c,'tornado');
    }
  }
  // flying debris flung around the funnel
  for(let k=0;k<COLS*0.25;k++){
    const ang=Math.random()*Math.PI*2, rad=2+Math.random()*Math.floor(COLS*0.14);
    const c=Math.round(cxi+Math.cos(ang)*rad);
    const r=Math.round((streetRow*0.5)+Math.sin(ang)*rad*0.5 - (t%6));
    if(c>=0&&c<COLS&&r>=0&&r<streetRow){ setCh(grid,r,c,["@","#","0","*"][(Math.random()*4)|0]); setMode(mg,r,c,'tornado'); }
  }
  // debris/rubble on the street where it's passed
  { let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){ if(c<cxi && Math.random()<0.25) g[c]=[".",",","_"][(Math.random()*3)|0]; }
    grid[streetRow]=g.join(""); }
  return {grid,mg};
}


function __m9_loop(){
if(phase==='tornado'){
    scene.style.textShadow="0 0 8px #b8c0cc";
    if(!tornStarted){ tornStarted=true; tornT=0; tornX=-4; document.body.style.background="#0a0c0e"; }
    stepRain();
    const {grid,mg}=tornadoRender(tornX, tornT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="A TORNADO TEARS THROUGH THE CITY"; sub.style.color="#cdd6e0"; sub.style.textShadow="0 0 8px #7a8694";
    tornX+=Math.max(1,Math.floor(COLS/40)); tornT++;
    if(tornX<COLS+4){ timer=setTimeout(loop,70); }
    else { phase='torn_hold'; loop(); }
  }else if(phase==='torn_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=tornadoRender(COLS+10, tornT);   // funnel gone off-screen; ruins remain
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="swept away. — press RESET"; sub.style.color="#cdd6e0"; sub.className="";
    tornT++;
    timer=setTimeout(loop,160);
  }
}


function __m9_start(){
       // GREY -> tornado
    attackMode='tornado';
    cmd.style.color="#b8c0cc"; cmd.style.textShadow="0 0 20px #7a8694";
    tornStarted=false; phase='tornado';
  
}


function __m9_reset(){
  tornStarted=false; tornT=0; tornX=0; tornDebris=[];
}


registerMethod(9, { start: __m9_start, resetFn: __m9_reset, loopFn: __m9_loop, phaseNames: ['tornado', 'torn_hold'] });
