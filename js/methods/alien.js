let ufoStarted=false, ufoY=0, ufoT=0, ufoBeams=[], ufoDmg=0, ufoX=0;


// ---- alien invasion: a mothership descends and blasts the city with green beams ----
// Saucer sprite (wide). Drawn centred at (ufoCX, hullTop).
const ufoSprite=[
  "        ______________        ",
  "     __/  o  o  o  o   \\__     ",   // dome lights
  "  __/_____________________\\__  ",
  " /  o   O   o   O   o   O   o \\",   // hull lights
  " \\___========================/",
];
function alien(hullTop, beamCols, dmgCols, tick, beamHalf, shipX){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const ufoCX=(shipX!==undefined)?shipX:cx;
  const sw=ufoSprite[0].length;
  const startC=ufoCX-Math.floor(sw/2);

  // ---- beams: wide green energy columns punching down to the street ----
  const beamChars=["#","@","|",":"];
  for(const bc of beamCols){
    const half=beamHalf!==undefined ? beamHalf : Math.max(2,Math.floor(COLS*0.045));
    for(let dc=-half;dc<=half;dc++){
      const c=bc+dc; if(c<0||c>=COLS)continue;
      const edge=Math.abs(dc)>=half-1;
      for(let r=hullTop+5;r<=streetRow;r++){
        if(edge && Math.random()<0.5) continue;
        if(Math.random()<0.12) continue;
        const ch = edge ? ":" : beamChars[(Math.random()*beamChars.length)|0];
        setCh(grid,r,c,ch); setMode(mg,r,c,'beam');
      }
      // scorch/impact splash at the street
      setCh(grid,streetRow,c,(Math.random()<0.5?"#":"@")); setMode(mg,streetRow,c,'beam');
    }
  }
  // ---- disintegrate buildings inside the damaged columns ----
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(const dc of dmgCols){
      const half=(beamHalf!==undefined?beamHalf:Math.max(3,Math.floor(COLS*0.05)))+1;
      for(let c=dc-half;c<=dc+half;c++){
        if(c<0||c>=COLS)continue;
        if(line[c]!==" " && mg[r][c]!=='beam' && Math.random()<0.85) line[c]=" ";
      }
    }
    grid[r]=line.join("");
  }

  // ---- draw the mothership over the top ----
  for(let i=0;i<ufoSprite.length;i++){
    const row=hullTop+i;
    const art=ufoSprite[i];
    for(let j=0;j<art.length;j++){
      const ch=art[j]; if(ch===" ")continue;
      const c=startC+j;
      if(c<0||c>=COLS||row<0||row>=ROWS)continue;
      // blink the lights
      let out=ch;
      if((ch==="o"||ch==="O") && (tick+j)%4===0) out=(ch==="o"?"O":"o");
      setCh(grid,row,c,out); setMode(mg,row,c,'ufo');
    }
  }
  // hovering glow / small scout saucers drifting
  for(let k=0;k<3;k++){
    const sx=((tick*(k+2))%(COLS+20))-10;
    const sy=2+k*2;
    const scout="<oO o>";
    for(let j=0;j<scout.length;j++){ const c=Math.round(sx)+j; if(c>=0&&c<COLS && scout[j]!==" "){ setCh(grid,sy,c,scout[j]); setMode(mg,sy,c,'ufo'); } }
  }
  return {grid,mg};
}


function __m6_loop(){
if(phase==='alien'){
    scene.style.textShadow="0 0 10px #39ff14";
    if(!ufoStarted){ ufoStarted=true; ufoT=0; ufoY=-5; ufoX=-Math.floor(ufoSprite[0].length/2); document.body.style.background="#02100a"; }
    stepRain();
    const hoverTop=2;
    if(ufoY<hoverTop){ ufoY+=1; }
    const firing = ufoY>=hoverTop;
    const shipHalf=Math.floor(ufoSprite[0].length/2);   // beam is exactly ship-width
    let beams=[], dmg=[], beamHalf=0;
    if(firing){
      // ship flies left -> right; a ship-width beam under it vaporises everything it passes
      beamHalf=shipHalf;
      beams=[Math.round(ufoX)]; dmg=[Math.round(ufoX)];
      // permanently clear the city columns the beam is currently over (destruction stays behind)
      for(let r=0;r<streetRow;r++){
        let line=(cityGridArr[r]||" ".repeat(COLS)).split("");
        for(let c=Math.round(ufoX)-shipHalf;c<=Math.round(ufoX)+shipHalf;c++){
          if(c<0||c>=COLS)continue; line[c]=" ";
        }
        cityGridArr[r]=line.join("");
      }
      // leave scorched rubble on the street behind the beam
      { let g=cityGridArr[streetRow].split("");
        for(let c=0;c<=Math.round(ufoX)+shipHalf;c++){ if(c<COLS && Math.random()<0.4) g[c]=[".",",","_"][(Math.random()*3)|0]; }
        cityGridArr[streetRow]=g.join(""); }
    }
    const {grid,mg}=alien(Math.round(ufoY), beams, dmg, ufoT, beamHalf, Math.round(ufoX));
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(firing) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = firing ? "WE COME IN PEACE… PSYCH — DEATH RAY" : "A MOTHERSHIP DESCENDS…";
    sub.style.color="#39ff14"; sub.style.textShadow="0 0 8px #39ff14";
    ufoT++;
    if(firing) ufoX+=Math.max(1,Math.floor(COLS/34));   // advance after this frame's beam/ship are drawn in sync
    if(!(firing && ufoX>COLS+shipHalf)){ timer=setTimeout(loop,70); }
    else { phase='alien_hold'; loop(); }
  }else if(phase==='alien_hold'){
    stage.classList.remove('shake');
    // whole city gone; ship hovers off to the right over the wasteland, beam off
    const shipHalf=Math.floor(ufoSprite[0].length/2);
    const {grid,mg}=alien(2, [], [], ufoT, 0, COLS-shipHalf-2);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city was harvested. — press RESET"; sub.style.color="#39ff14"; sub.className="";
    ufoT++;
    timer=setTimeout(loop,160);
  }
}


function __m6_start(){
       // NEON GREEN -> alien invasion
    attackMode='alien';
    cmd.style.color="#39ff14"; cmd.style.textShadow="0 0 22px #39ff14";
    ufoStarted=false; phase='alien';
  
}


function __m6_reset(){
  ufoStarted=false; ufoY=0; ufoT=0; ufoBeams=[]; ufoDmg=0; ufoX=0;
}


registerMethod(6, { start: __m6_start, resetFn: __m6_reset, loopFn: __m6_loop, phaseNames: ['alien', 'alien_hold'] });
