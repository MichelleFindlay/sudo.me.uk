let fznStarted=false, fznT=0, fznLevel=0, castleH=0, olafX=0, snowFall=[];


// ---- FROZEN: Elsa's magic sweeps out, an ice castle rises, the world freezes ----
function frozenInit(){
  fznLevel=0; castleH=0; olafX=-6; snowFall=[];
  for(let i=0;i<Math.floor(COLS*0.5);i++){ snowFall.push({ x:(Math.random()*COLS)|0, y:(Math.random()*ROWS)|0, spd:0.4+Math.random()*0.8, drift:(Math.random()*2-1)*0.4 }); }
}
function frozenStep(t){
  fznLevel=Math.min(1, fznLevel+0.018);
  castleH=Math.min(Math.floor(streetRow*0.6), castleH + (fznLevel>0.25 ? 1 : 0));
  for(const s of snowFall){ s.y+=s.spd; s.x+=s.drift; if(s.y>ROWS){ s.y=-1; s.x=(Math.random()*COLS)|0; } if(s.x<0)s.x=COLS-1; if(s.x>=COLS)s.x=0; }
  // Olaf waddles along the street
  olafX += 0.4;
  if(olafX > COLS+6) olafX = -6;
}
function frozenRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ice climbs and encases the buildings from the ground up (proportion = fznLevel)
  const iceTop=Math.floor(streetRow - fznLevel*streetRow*0.9);
  for(let r=streetRow;r>=iceTop;r--){
    for(let c=0;c<COLS;c++){
      if(grid[r] && grid[r][c] && grid[r][c]!==" "){ if(Math.random()<0.4){ setCh(grid,r,c,(Math.random()<0.4?"#":grid[r][c])); setMode(mg,r,c,'frost'); } }
      else if(r>=streetRow-1 && Math.random()<0.3){ setCh(grid,r,c,(Math.random()<0.5?"=":"#")); setMode(mg,r,c,'frost'); }
    }
  }
  // icicles + frost sparkle hanging in the frozen zone
  for(let k=0;k<COLS*0.15;k++){ const c=(Math.random()*COLS)|0, r=iceTop+((Math.random()*Math.max(1,streetRow-iceTop))|0);
    if(r>=0&&r<streetRow && grid[r] && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"V":"*")); setMode(mg,r,c,'frost'); } }

  // ---- Elsa's ICE CASTLE rising in the centre (a proper castle silhouette) ----
  if(castleH>0){
    // castle sprite, drawn bottom-up so it "rises" as castleH grows
    const castle=[
      "        /\\        ",   // central spire
      "        ||        ",
      "       /##\\       ",   // spire base
      "  /\\   |##|   /\\  ",   // side turret tips
      " /##\\ _|##|_ /##\\ ",
      " |^^| |####| |^^| ",   // battlements
      " |##|=|####|=|##| ",
      " |[]| |[##]| |[]| ",   // windows
      " |##|=|####|=|##| ",
      " |##| |####| |##| ",
      " |##|_|_/\\_|_|##| ",   // gateway arch
      " |##| | || | |##| ",
      "_|##|_|_||_|_|##|_",   // base
    ];
    const cw=castle[0].length, chh=castle.length;
    const cx0=cx-Math.floor(cw/2);
    const maxCastleH=Math.floor(streetRow*0.6);
    const shown=Math.min(chh, Math.max(2, Math.round(castleH/maxCastleH * chh)));
    // reveal from the bottom (street) upward
    for(let i=0;i<shown;i++){
      const srcRow=chh-1-i;             // bottom-most rows first
      const r=streetRow-i;
      const art=castle[srcRow];
      for(let j=0;j<art.length;j++){ const c=cx0+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'castle'); }
    }
    // sparkle glints around the fully-risen castle
    if(shown>=chh){ for(let k=0;k<COLS*0.05;k++){ const c=cx+(((Math.random()*cw)|0)-Math.floor(cw/2)), r=(streetRow-chh)+((Math.random()*4)|0)-1; if(c>=0&&c<COLS&&r>=0){ setCh(grid,r,c,["*","+","."][(Math.random()*3)|0]); setMode(mg,r,c,'castle'); } } }
  }

  // ---- snow drifts piling on the street ----
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.3+fznLevel*0.5) g[c]="#"; if(g[c]==="#") setMode(mg,streetRow,c,'frost'); } grid[streetRow]=g.join(""); }

  // ---- Olaf the snowman waddling along ----
  { const ox=Math.round(olafX);
    // olaf: head (eyes + carrot nose), two snowball body segments
    const os=[ " o ", "(o>)", " O ", "(O)" ];
    const oy=streetRow-os.length+1;
    for(let i=0;i<os.length;i++){ const art=os[i]; for(let j=0;j<art.length;j++){ const c=ox+j-1; const r=oy+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'olaf'); } }
    // twig arms sticking out + tuft of hair
    setCh(grid,oy+2,ox-2,"\\"); setCh(grid,oy+2,ox+2,"/"); setMode(mg,oy+2,ox-2,'olaf'); setMode(mg,oy+2,ox+2,'olaf');
    setCh(grid,oy-1,ox,"Y"); setMode(mg,oy-1,ox,'olaf');
  }

  // ---- falling snow over everything ----
  for(const s of snowFall){ const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"*":".")); setMode(mg,r,c,'frost'); } }
  return {grid,mg};
}


function __m33_loop(){
if(phase==='frozen'){
    scene.style.textShadow="0 0 10px #8ad8f0";
    if(!fznStarted){ fznStarted=true; fznT=0; frozenInit(); document.body.style.background="#081420"; }
    frozenStep(fznT);
    const {grid,mg}=frozenRender(fznT);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background = fznLevel<0.5 ? "#0c1c2c" : (fznLevel<0.9?"#16324a":"#2a5578");
    sub.textContent = fznLevel<0.4 ? "LET IT GO — THE FROST SPREADS" : (castleH<streetRow*0.5 ? "AN ICE CASTLE RISES OVER THE CITY" : "AN ETERNAL WINTER GRIPS THE WORLD");
    sub.style.color="#c0f0ff"; sub.style.textShadow="0 0 8px #4a90c0";
    fznT++;
    if(!(fznLevel>=1 && fznT>60)){ timer=setTimeout(loop,80); }
    else { phase='frozen_hold'; loop(); }
  }else if(phase==='frozen_hold'){
    stage.classList.remove('shake');
    frozenStep(fznT);
    const {grid,mg}=frozenRender(fznT);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#2a5578";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="frozen in eternal winter. and Olaf likes warm hugs. — press RESET"; sub.style.color="#c0f0ff"; sub.className="";
    fznT++;
    timer=setTimeout(loop,140);
  }
}


function __m33_start(){
      // FROST BLUE -> Frozen
    attackMode='frozen';
    cmd.style.color="#8ad8f0"; cmd.style.textShadow="0 0 20px #4a90c0";
    fznStarted=false; phase='frozen';
  
}


function __m33_reset(){
  fznStarted=false; fznT=0; fznLevel=0; castleH=0; olafX=0; snowFall=[];
}


registerMethod(33, { start: __m33_start, resetFn: __m33_reset, loopFn: __m33_loop, phaseNames: ['frozen', 'frozen_hold'] });
