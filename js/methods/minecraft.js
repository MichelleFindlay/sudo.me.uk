let mcStarted=false, mcT=0, mcDmg=0, mcCreeperX=-2, mcCreeperDir=1, mcCreeperArrived=false, mcSteveX=-2, mcSteveActive=false;


// ---- MINECRAFT: the whole city gets repainted in blocky, glowstone-and-cobblestone
// colours, a stack of TNT sits in the town square, and a creeper wanders up to it ----
const mcTntStack=[
  "#####",
  "#TNT#",
  "#####",
  "#####",
  "#TNT#",
  "#####",
  "#####",
  "#TNT#",
  "#####"
];
// a blocky, pixel-art creeper face — camo-green body, black hollow eyes/mouth
const mcCreeperSprite=[
  "#######",
  "#X#X###",
  "#X#X###",
  "###X###",
  "##XXX##",
  "#######",
  " ## ## "
];
// Steve, sensibly fleeing left the moment the creeper shows up — hair, face, cyan
// shirt and legs each get their own char so colorFor can tell the parts apart
const mcSteveBody=[
  "^^^",
  "#o#",
  "==="
];
const mcSteveLegsA="| |", mcSteveLegsB="/ \\";
function mcMaxDmg(){ return Math.max(6, Math.floor(COLS*0.14)); }
function mcInit(){
  mcDmg=0; mcCreeperArrived=false;
  mcCreeperDir = Math.random()<0.5 ? 1 : -1;
  mcCreeperX = mcCreeperDir>0 ? 2 : COLS-2;
  mcSteveX = cx+4; mcSteveActive=true;
}
function mcSteveStep(){
  if(!mcSteveActive) return;
  mcSteveX -= Math.max(1, COLS/60);
  if(mcSteveX < -6) mcSteveActive=false;
}
function mcDrawSteve(grid, mg, t){
  if(!mcSteveActive) return;
  const art=[...mcSteveBody, (t%6<3 ? mcSteveLegsA : mcSteveLegsB)];
  const left=Math.round(mcSteveX)-1, top=streetRow-art.length+1;
  mcDrawArt(grid,mg,art,left,top,'mcsteve');
}
function mcDrawArt(grid, mg, art, left, top, mode){
  for(let i=0;i<art.length;i++){
    const row=art[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function mcBuildRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'minecraft');
  const left=cx-2, top=streetRow-mcTntStack.length;
  mcDrawArt(grid,mg,mcTntStack,left,top,'mctnt');
  return {grid,mg};
}
function mcCreeperRender(t){
  const {grid,mg}=mcBuildRender();
  const top=streetRow-mcCreeperSprite.length+1, left=Math.round(mcCreeperX)-3;
  mcDrawArt(grid,mg,mcCreeperSprite,left,top, (mcCreeperArrived && t%4<2) ? 'mccreeperflash' : 'mccreeper');
  mcDrawSteve(grid,mg,t);
  return {grid,mg};
}
// the crater is recomputed fresh from the untouched base city every frame — only mcDmg's
// radius persists between frames, exactly like the nuke's shockwave growth
function mcBoomRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const cg=renderCity(null, mcDmg);
  const mg=modeGridFill(ROWS,COLS,'minecraft');
  for(let r=0;r<ROWS;r++){
    for(let c=cx-mcDmg;c<=cx+mcDmg;c++){ if(c<0||c>=COLS) continue; setMode(mg,r,c,'mcblast'); }
  }
  // flying debris at the crater's growing edge
  for(const side of [cx-mcDmg, cx+mcDmg]){
    for(let k=0;k<3;k++){
      const c=side+((Math.random()*5)|0)-2, r=streetRow-((Math.random()*6)|0);
      if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      if(Math.random()<0.5){ setCh(cg,r,c,["*","#","@"][(Math.random()*3)|0]); setMode(mg,r,c,'mcblast'); }
    }
  }
  mcDrawSteve(cg,mg,t);
  return {grid:cg, mg};
}


function __m69_loop(){
if(phase==='mc_build'){
    scene.style.textShadow="0 0 10px #3a8a2a";
    if(!mcStarted){ mcStarted=true; mcT=0; mcInit(); document.body.style.background="#0a1408"; }
    const {grid,mg}=mcBuildRender();
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent = mcT<10 ? "THE WORLD LOADS IN, BLOCK BY BLOCK" : "SOMEONE STACKED TNT IN THE TOWN SQUARE";
    sub.style.color="#7ed321"; sub.style.textShadow="0 0 8px #2a5a10";
    mcT++;
    if(mcT<24){ timer=setTimeout(loop,90); }
    else { phase='mc_creeper'; mcT=0; loop(); }
  }else if(phase==='mc_creeper'){
    if(!mcCreeperArrived){
      mcCreeperX += mcCreeperDir*Math.max(1,COLS/45);
      if((mcCreeperDir>0 && mcCreeperX>=cx) || (mcCreeperDir<0 && mcCreeperX<=cx)){ mcCreeperX=cx; mcCreeperArrived=true; mcT=0; }
    }
    mcSteveStep();
    const {grid,mg}=mcCreeperRender(mcT);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = mcCreeperArrived ? "SSSSSSSSSSSS…" : "A CREEPER SSSSSNEAKS CLOSER";
    sub.style.color="#7ed321"; sub.style.textShadow="0 0 8px #2a5a10";
    mcT++;
    if(!(mcCreeperArrived && mcT>12)){ timer=setTimeout(loop,80); }
    else { phase='mc_boom'; mcT=0; loop(); }
  }else if(phase==='mc_boom'){
    scene.style.textShadow="0 0 14px #ff6a00";
    mcDmg=Math.min(mcMaxDmg(), mcDmg+Math.max(1,Math.floor(COLS/60)));
    mcSteveStep();
    const {grid,mg}=mcBoomRender(mcT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="THE CREEPER SETS OFF THE TNT — CHUNKS EVERYWHERE";
    sub.style.color="#ff9a3a"; sub.style.textShadow="0 0 8px #8a3a00";
    mcT++;
    if(!(mcDmg>=mcMaxDmg() && mcT>16)){ timer=setTimeout(loop,70); }
    else { phase='mc_hold'; loop(); }
  }else if(phase==='mc_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=mcBoomRender(mcT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the town square is a crater now. — press RESET"; sub.style.color="#ff9a3a"; sub.className="";
    mcT++;
    timer=setTimeout(loop,150);
  }
}


function __m69_start(){
      // MINECRAFT GREEN -> Minecraft
    attackMode='mc_build';
    cmd.style.color="#7ed321"; cmd.style.textShadow="0 0 20px #2a5a10";
    mcStarted=false; phase='mc_build';

}


function __m69_reset(){
  mcStarted=false; mcT=0; mcDmg=0; mcCreeperX=-2; mcCreeperDir=1; mcCreeperArrived=false; mcSteveX=-2; mcSteveActive=false;
}


registerMethod(69, { start: __m69_start, resetFn: __m69_reset, loopFn: __m69_loop, phaseNames: ['mc_build', 'mc_creeper', 'mc_boom', 'mc_hold'] });
