let issStarted=false, issT=0, issX=0, issY=0, issHit=false, issBoom=0;


// ---- ISS CRASH: the space station deorbits, burns through the sky, and impacts ----
const issSprite=[
  "  [|]        [|]  ",
  "  [|]==#==H==#==[|]  ",
  "  [|]   =====   [|]  ",
  "  [|]        [|]  ",
];
function issRender(ix,iy,hit,boom){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(!hit){
    // fiery reentry trail
    for(let k=1;k<=16;k++){ const tx=Math.round(ix-k*1.5), ty=Math.round(iy-k*0.8);
      if(ty>=0&&ty<ROWS&&tx>=0&&tx<COLS && Math.random()<0.7){ setCh(grid,ty,tx,["*","'",".","#"][(Math.random()*4)|0]); setMode(mg,ty,tx,'iss'); } }
    // tumbling station
    for(let i=0;i<issSprite.length;i++){ const art=issSprite[i];
      for(let j=0;j<art.length;j++){ const c=Math.round(ix)+j, r=Math.round(iy)+i;
        if(c>=0&&c<COLS&&r>=0&&r<ROWS&&art[j]!==" "){ setCh(grid,r,c,art[j]); setMode(mg,r,c,'iss'); } } }
  } else {
    // impact blast + debris field
    const R=boom;
    // MIDDLE: fully obliterated within R
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=cx-R;c<=cx+R;c++){ if(c<0||c>=COLS)continue; if(Math.random()<0.7) ln[c]=" "; } grid[r]=ln.join(""); }
    // OUTSKIRTS: shrapnel damage thinning out with distance
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){ const d=Math.abs(c-cx);
        if(d>R){ const dmg=Math.max(0, 0.5*(1-(d-R)/(COLS*0.6)));
          if(ln[c]!==" " && Math.random()<dmg) ln[c]=(Math.random()<0.4?"#":" "); } }
      grid[r]=ln.join(""); }
    const dome=Math.min(streetRow, Math.floor(R*0.8));
    for(let rr=streetRow;rr>=streetRow-dome;rr--){ const frac=(streetRow-rr)/Math.max(1,dome);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.2)continue; const c=cx+j; if(c<0||c>=COLS)continue;
        setCh(grid,rr,c,["#","@","*"][(Math.random()*3)|0]); setMode(mg,rr,c,'iss'); } }
    // scattered station debris + panels across the wider blast zone
    for(let k=0;k<COLS*0.3;k++){ const c=cx+(((Math.random()*R*3)|0)-Math.floor(R*1.5)), r=streetRow-((Math.random()*4)|0);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["[","]","=","H","*"][(Math.random()*5)|0]); setMode(mg,r,c,'iss'); } }
  }
  return {grid,mg};
}


function __m15_loop(){
if(phase==='iss'){
    scene.style.textShadow="0 0 8px #8ad0ff";
    if(!issStarted){ issStarted=true; issT=0; issX=-20; issY=0; issHit=false; issBoom=0; document.body.style.background="#03060c"; }
    stepRain();
    if(!issHit){
      issX+=Math.max(2,Math.floor(COLS/22)); issY+=Math.max(1,Math.floor(streetRow/18));
      if(issX>=cx || issY>=streetRow-3){ issHit=true; }
    } else { issBoom=Math.min(Math.floor(COLS*0.32), issBoom+Math.max(2,Math.floor(COLS/22))); }
    const {grid,mg}=issRender(issX,issY,issHit,issBoom);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(issHit) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = !issHit ? "THE ISS IS DEORBITING…" : "IT SLAMS INTO THE CITY";
    sub.style.color="#aae0ff"; sub.style.textShadow="0 0 8px #2a6a9a";
    issT++;
    if(!(issHit && issBoom>=Math.floor(COLS*0.32) && issT>40)){ timer=setTimeout(loop,70); }
    else { phase='iss_hold'; loop(); }
  }else if(phase==='iss_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=issRender(issX,issY,true,Math.floor(COLS*0.32));
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="flattened by falling debris. — press RESET"; sub.style.color="#aae0ff"; sub.className="";
    issT++;
    timer=setTimeout(loop,150);
  }
}


function __m15_start(){
      // BLUE -> ISS crash
    attackMode='iss';
    cmd.style.color="#8ad0ff"; cmd.style.textShadow="0 0 20px #2a6a9a";
    issStarted=false; phase='iss';
  
}


function __m15_reset(){
  issStarted=false; issT=0; issX=0; issY=0; issHit=false; issBoom=0;
}


registerMethod(15, { start: __m15_start, resetFn: __m15_reset, loopFn: __m15_loop, phaseNames: ['iss', 'iss_hold'] });
