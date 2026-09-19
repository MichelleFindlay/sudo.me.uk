
// ---- tidal wave: a curling water front sweeping left->right ----
// wx = leading edge column. Returns {grid, mg}. Everything left of the front is flooded.
function tsunami(wx){
  // start from a copy of the city so the wave crashes over the actual skyline
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const waterTop=Math.max(1, streetRow - Math.floor(ROWS*0.55));  // how high the flood rises
  const crestH=Math.min(streetRow-waterTop, Math.floor(ROWS*0.5));// height of the curling face

  for(let r=0;r<ROWS;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      if(c<wx-2){
        // ---- FLOODED zone (behind the front): fill with water up to waterTop ----
        if(r>=waterTop){
          const surface=(r===waterTop);
          if(surface){ line[c]= (Math.random()<0.3?"~":"\u2248"); }
          else { line[c]= (Math.random()<0.15?"\u2248":"~"); }
          setMode(mg,r,c,'water');
        }
        // above waterTop: leave sky/rain (buildings poking out get submerged look) -> clear tops
        else if(r<waterTop && line[c]!==" " && r<streetRow){
          // partially demolish building tops that the wave has passed
          if(Math.random()<0.5){ line[c]=" "; }
        }
      } else if(c>=wx-2 && c<=wx+1){
        // ---- THE CURLING WAVE FACE (tall crest) ----
        const faceTop=streetRow-crestH;
        if(r>=faceTop && r<=streetRow){
          const atCrest=(r<=faceTop+2);
          let ch;
          if(atCrest) ch=(Math.random()<0.5?"#":"@");   // foaming crest
          else ch=(Math.random()<0.6?"~":"\u2248");
          line[c]=ch; setMode(mg,r,c,'water');
        }
        // spray/foam thrown ahead & above the crest
        if(r>=faceTop-3 && r<faceTop && Math.random()<0.35){
          line[c]=(Math.random()<0.5?"*":"\u00b0"); setMode(mg,r,c,'water');
        }
      }
      // ahead of the wave (c>wx+1): city stands untouched (leave as-is)
    }
    grid[r]=line.join("");
  }
  return {grid,mg};
}


function __m1_loop(){
if(phase==='tsunami'){
    scene.style.textShadow="0 0 10px #2b8fd6";
    if(!waveStarted){ waveStarted=true; waveX=-Math.floor(COLS*0.15); stage.classList.add('shake'); document.body.style.background="#04121e"; }
    // advance the wave front; rain keeps falling ahead of it
    stepRain();
    const {grid,mg}=tsunami(waveX);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="~~~ TIDAL WAVE ~~~"; sub.style.color="#22aaff"; sub.style.textShadow="0 0 8px #22aaff";
    waveX+=Math.max(1,Math.floor(COLS/26));
    if(waveX<COLS+Math.floor(COLS*0.2)){ timer=setTimeout(loop,70); }
    else { phase='flooded'; ft=0; loop(); }
  }else if(phase==='flooded'){
    // city fully submerged: gentle rippling water sitting over the drowned city
    stage.classList.remove('shake');
    const {grid,mg}=tsunami(COLS+COLS);   // front past the far edge = everything flooded
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is gone. — press RESET"; sub.style.color="#22aaff"; sub.className="";
    ft++;
    timer=setTimeout(loop, 200);          // keep rippling in place
  }
}


function __m1_start(){
              // BLUE -> tidal wave
    attackMode='tsunami';
    cmd.style.color="#22aaff"; cmd.style.textShadow="0 0 20px #22aaff";
    waveStarted=false; waveX=-1; phase='tsunami';
  
}


function __m1_reset(){

}


registerMethod(1, { start: __m1_start, resetFn: __m1_reset, loopFn: __m1_loop, phaseNames: ['tsunami', 'flooded'] });
