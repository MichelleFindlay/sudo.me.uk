let satanStarted=false, satanT=0, satanPhase='rift', riftW=0, demons=[], satanRise=0;


// ---- SATAN: the ground splits open, Hell's army rises, and the Devil claims his throne ----
function satanInit(){
  riftW=0; demons=[]; satanRise=0;
}
function spawnDemon(){
  // demons climb out of the rift near the centre and spread outward
  demons.push({ x:cx+(((Math.random()*riftW*2)|0)-riftW), y:streetRow-1, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5, ph:Math.random()*6, climb:6+((Math.random()*6)|0) });
}
// the fiery chasm + lava at the bottom
function drawRift(grid, mg, w){
  const half=w;
  for(let r=streetRow;r>=Math.max(1,streetRow-2);r--){}   // (street handled below)
  // carve the chasm: everything within half of centre becomes the pit
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cx-half;c<=cx+half;c++){ if(c<0||c>=COLS)continue; ln[c]=" "; } grid[r]=ln.join(""); }
  // jagged glowing chasm walls
  for(let r=streetRow;r>streetRow-Math.min(streetRow, Math.floor(w*0.8));r--){
    const wob=Math.floor(Math.sin(r*0.7)*1.5);
    setCh(grid,r,cx-half+wob,"\\"); setMode(mg,r,cx-half+wob,'hellfire');
    setCh(grid,r,cx+half-wob,"/"); setMode(mg,r,cx+half-wob,'hellfire');
  }
  // lava + flames roiling up from the pit
  for(let r=streetRow;r>streetRow-Math.min(streetRow, Math.floor(w*0.7));r--){
    for(let c=cx-half+1;c<cx+half;c++){ if(c<0||c>=COLS)continue;
      const deep=(streetRow-r);
      if(Math.random()< 0.35 - deep*0.02){ setCh(grid,r,c,["#","@","%","~","'"][(Math.random()*5)|0]); setMode(mg,r,c,'hellfire'); }
    }
  }
  // rubble lip at the street edges of the rift
  setCh(grid,streetRow,cx-half,"V"); setCh(grid,streetRow,cx+half,"V"); setMode(mg,streetRow,cx-half,'hellfire'); setMode(mg,streetRow,cx+half,'hellfire');
}
// a small demon sprite
function drawDemon(grid,mg,d){
  const xi=Math.round(d.x), yi=Math.round(d.y);
  const bob=(Math.sin(d.ph)>0)?0:1;
  // horns + head
  setCh(grid,yi-1-bob,xi,"V"); setMode(mg,yi-1-bob,xi,'demon');       // horns
  setCh(grid,yi-bob,xi,"o"); setMode(mg,yi-bob,xi,'demon');           // head/eye
  // body + wings + trident
  setCh(grid,yi+1-bob,xi-1,"/"); setCh(grid,yi+1-bob,xi,"T"); setCh(grid,yi+1-bob,xi+1,"\\");
  setMode(mg,yi+1-bob,xi-1,'demon'); setMode(mg,yi+1-bob,xi,'demon'); setMode(mg,yi+1-bob,xi+1,'demon');
}
function satanRender(t, mode, w, rise){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // the rift is open in all phases once started
  drawRift(grid, mg, w);

  // demons overrunning the city (army phase onward)
  if(mode!=='rift'){
    for(const d of demons){ drawDemon(grid,mg,d);
      // demons trample buildings where they roam
      const xi=Math.round(d.x); for(let r=0;r<streetRow;r++){ if(grid[r]&&grid[r][xi]&&grid[r][xi]!==" "&&mg[r][xi]!=='demon'&&Math.random()<0.2){ let ln=grid[r].split(""); ln[xi]=" "; grid[r]=ln.join(""); } }
    }
    // red hellish sky embers
    for(let k=0;k<COLS*0.12;k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.floor(streetRow*0.4))|0); setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]); setMode(mg,r,c,'hellfire'); }
  }

  // SATAN himself rises from the pit and takes his throne (throne phase)
  if(mode==='throne'){
    const satan=[
      "  \\W/   \\W/  ",
      "   \\Y/^Y^\\Y/   ",
      "    ( O  O )    ",
      "   / \\ VV / \\   ",
      "  /   \\__/   \\  ",
      "  |   #==#   |  ",
      "  |  #====#  |  ",
      " _|__#====#__|_ ",
    ];
    const sh=satan.length;
    // rise from below the street up to sit on a throne over the rift
    const seat=streetRow - Math.floor(rise*(sh+2));
    const top=seat - sh + 1;
    for(let i=0;i<sh;i++){ const art=satan[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=cx+j-Math.floor(art.length/2); if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'satan'); } }
    // throne back / hellglow behind him once fully risen
    if(rise>=1){
      for(let r=top-2;r<=seat;r++){ setCh(grid,r,cx-9,"H"); setCh(grid,r,cx+9,"H"); setMode(mg,r,cx-9,'satan'); setMode(mg,r,cx+9,'satan'); }
      for(let k=0;k<COLS*0.1;k++){ const c=cx+(((Math.random()*20)|0)-10), r=Math.max(0,top-((Math.random()*3)|0)); setCh(grid,r,c,["*","+"][(Math.random()*2)|0]); setMode(mg,r,c,'satan'); }
    }
  }
  return {grid,mg};
}


function __m26_loop(){
if(phase==='satan'){
    scene.style.textShadow="0 0 12px #ff2000";
    if(!satanStarted){ satanStarted=true; satanT=0; satanPhase='rift'; riftW=0; demons=[]; satanRise=0; document.body.style.background="#0e0202"; }
    stage.classList.add('shake');
    if(satanPhase==='rift'){
      // the ground tears open in the middle of the city, widening
      riftW=Math.min(Math.floor(COLS*0.16), riftW+Math.max(1,Math.floor(COLS/40)));
      const {grid,mg}=satanRender(satanT, 'rift', riftW, 0);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE GROUND SPLITS — HELL YAWNS OPEN"; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #800000";
      satanT++;
      if(riftW<Math.floor(COLS*0.16)){ timer=setTimeout(loop,80); }
      else { satanPhase='army'; loop(); }
    }else if(satanPhase==='army'){
      // Satan's army pours out and overruns the world above
      if(satanT%2===0 && demons.length<COLS*0.6) spawnDemon();
      for(const d of demons){ d.x+=d.spd*d.dir; d.ph+=0.4; if(d.x<1){d.x=1;d.dir=1;} if(d.x>COLS-2){d.x=COLS-2;d.dir=-1;} if(Math.random()<0.02)d.dir*=-1; }
      const {grid,mg}=satanRender(satanT, 'army', riftW, 0);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE ARMIES OF HELL TAKE THE WORLD ABOVE"; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #800000";
      satanT++;
      if(!(demons.length>=COLS*0.5 && satanT>60)){ timer=setTimeout(loop,80); }
      else { satanPhase='throne'; satanRise=0; loop(); }
    }else if(satanPhase==='throne'){
      // Satan ascends and claims his throne
      satanRise=Math.min(1, satanRise+0.03);
      for(const d of demons){ d.x+=d.spd*d.dir; d.ph+=0.4; if(d.x<1){d.x=1;d.dir=1;} if(d.x>COLS-2){d.x=COLS-2;d.dir=-1;} }
      const {grid,mg}=satanRender(satanT, 'throne', riftW, satanRise);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent = satanRise<1 ? "SATAN RISES FROM THE PIT…" : "THE DEVIL CLAIMS HIS THRONE";
      sub.style.color="#ff4020"; sub.style.textShadow="0 0 10px #ff2000";
      satanT++;
      if(!(satanRise>=1 && satanT>70)){ timer=setTimeout(loop,80); }
      else { phase='satan_hold'; loop(); }
    }
  }else if(phase==='satan_hold'){
    stage.classList.remove('shake');
    for(const d of demons){ d.x+=d.spd*d.dir; d.ph+=0.4; if(d.x<1){d.x=1;d.dir=1;} if(d.x>COLS-2){d.x=COLS-2;d.dir=-1;} }
    const {grid,mg}=satanRender(satanT, 'throne', riftW, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Hell reigns on Earth. — press RESET"; sub.style.color="#ff4020"; sub.className="";
    satanT++;
    timer=setTimeout(loop,150);
  }
}


function __m26_start(){
      // INFERNAL RED -> Satan / Hell rises
    attackMode='satan';
    cmd.style.color="#c81810"; cmd.style.textShadow="0 0 24px #ff2000";
    satanStarted=false; phase='satan';
  
}


function __m26_reset(){
  satanStarted=false; satanT=0; satanPhase='rift'; riftW=0; demons=[]; satanRise=0;
}


registerMethod(26, { start: __m26_start, resetFn: __m26_reset, loopFn: __m26_loop, phaseNames: ['satan', 'satan_hold'] });
