let dfStarted=false, dfT=0, dfX=0, dfDir=1, dfPass=1, dfFire=[];

// ---- DUMPSTER FIRE: a burning bin rolls through the city, setting fire to everything
// in its wake. Fire-column growth/spread mechanic adapted from napalm.js's proven one ----
const dfBinArt=[
  " ______ ",
  "|      |",
  "|______|",
  "o      o"
];
function dfRenderBase(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  return {grid,mg};
}
function dfIgniteFire(c){
  if(c<0||c>=COLS) return;
  let f=dfFire.find(x=>x.c===c);
  if(!f){ dfFire.push({c, h:1, max:streetRow*(0.5+Math.random()*0.45)}); }
  else { f.h=Math.min(f.max, f.h+1); }
}
function dfFireStep(){
  for(const f of dfFire){ if(f.h<f.max) f.h+=0.5; }
  const spread=[];
  for(const f of dfFire){ if(f.h>3 && Math.random()<0.35){ spread.push(f.c-1); spread.push(f.c+1); } }
  for(const c of spread) dfIgniteFire(c);
}
function dfFireRender(grid,mg){
  const fireChars=["#","@","A","^","/","\\"];
  const emberChars=["'","°","."];
  for(const f of dfFire){
    const h=Math.floor(f.h);
    for(let k=0;k<h;k++){
      const r=streetRow-k; if(r<0) break;
      const near=k<h*0.6;
      const ch = near ? fireChars[(Math.random()*fireChars.length)|0]
                      : (Math.random()<0.5?emberChars[(Math.random()*emberChars.length)|0]:fireChars[(Math.random()*2)|0]);
      const jitter=(Math.random()<0.3)?(Math.random()<0.5?-1:1):0;
      const c=f.c+jitter; if(c<0||c>=COLS) continue;
      if(Math.random()<0.1) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,'flames');
    }
    setCh(grid,streetRow,f.c,"^"); setMode(mg,streetRow,f.c,'flames');
  }
  // burn away building material the flame has reached
  for(const f of dfFire){
    const h=Math.floor(f.h);
    for(let r=streetRow-1;r>streetRow-h;r--){
      if(Math.random()<0.5 && grid[r] && grid[r][f.c] && grid[r][f.c]!==" " && mg[r][f.c]!=='flames'){
        setCh(grid,r,f.c," ");
      }
    }
  }
}
function dfDrawDumpster(grid,mg,x){
  const xi=Math.round(x), top=streetRow-dfBinArt.length;
  for(let i=0;i<dfBinArt.length;i++){
    const row=dfBinArt[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=xi-4+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,'dumpster');
    }
  }
  // flames licking up out of the open top — same palette as the fires it's setting
  for(let k=0;k<3;k++){
    const r=top-1-k; if(r<0) break;
    for(let j=0;j<6;j++){
      const c=xi-3+j; if(c<0||c>=COLS) continue;
      if(Math.random()<0.55){
        const ch=["^","/","\\","*","'"][(Math.random()*5)|0];
        setCh(grid,r,c,ch); setMode(mg,r,c,'flames');
      }
    }
  }
}

function __m73_loop(){
  if(phase==='df_roll'){
    if(!dfStarted){ dfStarted=true; dfT=0; dfX=-6; dfDir=1; dfPass=1; dfFire=[]; document.body.style.background="#160a04"; }
    dfX += dfDir*1.4;
    for(let k=-2;k<=2;k++) dfIgniteFire(Math.round(dfX)+k);
    dfFireStep();
    const {grid,mg}=dfRenderBase();
    dfFireRender(grid,mg);
    dfDrawDumpster(grid,mg,dfX);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', dfFire.length>COLS*0.2);
    sub.textContent = dfPass===1
      ? "A DUMPSTER FIRE ROLLS THROUGH THE CITY, SETTING FIRE TO EVERYTHING IN ITS WAKE"
      : "IT ROLLS BACK FOR A SECOND PASS, JUST TO BE THOROUGH";
    sub.style.color="#ff8c1a"; sub.style.textShadow="0 0 8px #ff6a00";
    dfT++;
    const offRight = dfDir>0 && dfX>COLS+8;
    const offLeft = dfDir<0 && dfX<-8;
    if(offRight && dfPass===1){ dfPass=2; dfDir=-1; timer=setTimeout(loop,70); }
    else if(offLeft && dfPass===2){ phase='df_hold'; dfT=0; dfX=cx; loop(); }
    else { timer=setTimeout(loop,70); }
  }else if(phase==='df_hold'){
    dfFireStep();
    const {grid,mg}=dfRenderBase();
    dfFireRender(grid,mg);
    dfDrawDumpster(grid,mg,dfX);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="this is fine. — press RESET"; sub.style.color="#ff8c1a"; sub.className="";
    dfT++;
    timer=setTimeout(loop,120);
  }
}

function __m73_start(){
  attackMode='df_roll';
  cmd.style.color="#4a9a5a"; cmd.style.textShadow="0 0 20px #ff6a00";
  dfStarted=false; phase='df_roll';
}

function __m73_reset(){
  dfStarted=false; dfT=0; dfX=0; dfDir=1; dfPass=1; dfFire=[];
}

registerMethod(73, { start: __m73_start, resetFn: __m73_reset, loopFn: __m73_loop, phaseNames: ['df_roll','df_hold'] });
