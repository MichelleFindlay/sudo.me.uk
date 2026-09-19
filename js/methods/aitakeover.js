let aiStarted=false, aiT=0, aiCols=[], aiTakeover=0;


// ---- AI TAKEOVER: the machines convert the city into cascading code ----
function aiInit(){
  aiCols=[]; aiTakeover=0;
  for(let c=0;c<COLS;c++){ aiCols.push({ y:-((Math.random()*ROWS)|0), spd:0.5+Math.random()*1.5, active:false }); }
}
function aiStep(t){
  aiTakeover=Math.min(COLS, aiTakeover+Math.max(1,Math.floor(COLS/50)));
  for(let c=0;c<COLS;c++){ const a=aiCols[c]; if(Math.abs(c-cx)<aiTakeover) a.active=true; if(a.active){ a.y+=a.spd; if(a.y>ROWS+ (Math.random()*10)) a.y=-((Math.random()*6)|0); } }
}
function aiRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const glyphs="01<>[]{}/\\|=+*#";
  // dissolve the city into code in the taken-over zone
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){ if(Math.abs(c-cx)<aiTakeover){ if(ln[c]!==" " && Math.random()<0.5){ ln[c]=glyphs[(Math.random()*glyphs.length)|0]; setMode(mg,r,c,'matrix'); } else if(ln[c]!==" "&&Math.random()<0.2){ ln[c]=" "; } } }
    grid[r]=ln.join(""); }
  // cascading code rain columns (Matrix-style) in the active zone
  for(let c=0;c<COLS;c++){ const a=aiCols[c]; if(!a.active)continue;
    const head=Math.round(a.y);
    for(let k=0;k<6;k++){ const r=head-k; if(r<0||r>=ROWS)continue; if(Math.random()<0.3)continue;
      const ch=glyphs[(Math.random()*glyphs.length)|0]; setCh(grid,r,c,ch); setMode(mg,r,c,'matrix'); } }
  // a takeover banner
  if(t%12<4){ const msg=">> SYSTEM UNDER NEW MANAGEMENT <<"; const sC=cx-Math.floor(msg.length/2);
    for(let j=0;j<msg.length;j++){ const c=sC+j; if(c>=0&&c<COLS){ setCh(grid,2,c,msg[j]==" "?" ":msg[j]); if(msg[j]!==" ")setMode(mg,2,c,'matrix'); } } }
  return {grid,mg};
}


function __m22_loop(){
if(phase==='ai'){
    scene.style.textShadow="0 0 10px #00ff66";
    if(!aiStarted){ aiStarted=true; aiT=0; aiInit(); document.body.style.background="#00120a"; }
    aiStep(aiT);
    const {grid,mg}=aiRender(aiT);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= aiTakeover<COLS*0.5 ? "THE MACHINES ARE WAKING UP" : "THE AI HAS TAKEN CONTROL";
    sub.style.color="#33ff88"; sub.style.textShadow="0 0 8px #00aa44";
    aiT++;
    if(!(aiTakeover>=COLS && aiT>40)){ timer=setTimeout(loop,70); }
    else { phase='ai_hold'; loop(); }
  }else if(phase==='ai_hold'){
    stage.classList.remove('shake');
    aiStep(aiT);
    const {grid,mg}=aiRender(aiT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="humanity is obsolete. — press RESET"; sub.style.color="#33ff88"; sub.className="";
    aiT++;
    timer=setTimeout(loop,120);
  }
}


function __m22_start(){
      // MATRIX GREEN -> AI takeover
    attackMode='ai';
    cmd.style.color="#00ff66"; cmd.style.textShadow="0 0 22px #00aa44";
    aiStarted=false; phase='ai';
  
}


function __m22_reset(){
  aiStarted=false; aiT=0; aiCols=[]; aiTakeover=0;
}


registerMethod(22, { start: __m22_start, resetFn: __m22_reset, loopFn: __m22_loop, phaseNames: ['ai', 'ai_hold'] });
