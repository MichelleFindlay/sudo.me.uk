let riotStarted=false, riotT=0, rioters=[], riotFires=[], riotDmg=0;


// ---- RIOTS: an angry mob floods the streets, torching buildings ----
const riotBodies=["/o\\","<o>","\\o/","|o|","/O\\"];
function riotInit(){
  rioters=[]; riotFires=[]; riotDmg=0;
  const n=Math.floor(COLS*0.6);
  for(let i=0;i<n;i++){
    rioters.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5,
      body:riotBodies[(Math.random()*riotBodies.length)|0], arm:Math.random()<0.5, ph:Math.random()*6 });
  }
}
function riotStep(t){
  for(const r of rioters){ r.x+=r.spd*r.dir; r.ph+=0.5; if(r.x<0)r.x=COLS; if(r.x>COLS)r.x=0; if(Math.random()<0.02)r.dir*=-1; }
  // more join the mob; fires spread
  if(t%3===0 && rioters.length<COLS*1.1){ rioters.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5, body:riotBodies[(Math.random()*riotBodies.length)|0], arm:Math.random()<0.5, ph:Math.random()*6 }); }
  if(t%4===0 && riotFires.length<COLS*0.4){ riotFires.push({ c:(Math.random()*COLS)|0, h:1, max:2+Math.random()*Math.floor(streetRow*0.6) }); }
  for(const f of riotFires){ if(f.h<f.max) f.h+=0.4; }
  riotDmg=Math.min(COLS, riotDmg+ (t%2===0?1:0));
}
function riotRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const fireCh=["#","@","^"];
  // fires burning up the buildings
  for(const f of riotFires){
    const h=Math.floor(f.h);
    for(let k=0;k<h;k++){ const r=streetRow-k; if(r<0)break; if(Math.random()<0.2)continue;
      setCh(grid,r,f.c,fireCh[(Math.random()*fireCh.length)|0]); setMode(mg,r,f.c,'riot'); }
    // burn away building behind fire
    for(let r=streetRow-1;r>streetRow-h;r--){ if(grid[r]&&grid[r][f.c]&&grid[r][f.c]!==" "&&mg[r][f.c]!=='riot'&&Math.random()<0.5){ let ln=grid[r].split(""); ln[f.c]=" "; grid[r]=ln.join(""); } }
  }
  // broken glass / debris on street
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.15) g[c]=[".",",","x"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }
  // the mob (2 rows: body + legs) massed along the street
  const br=streetRow-1;
  for(const p of rioters){
    const xi=Math.round(p.x); if(xi<1||xi>=COLS-1)continue;
    const bob=(Math.sin(p.ph)>0)?0:1;
    for(let j=-1;j<=1;j++) { const c=xi+j; setCh(grid,br-bob,c,p.body[j+1]); setMode(mg,br-bob,c,'riot'); }
    // raised arm / torch / sign
    if(p.arm){ setCh(grid,br-1-bob,xi,(Math.random()<0.5?"!":"I")); setMode(mg,br-1-bob,xi,'riot'); }
    setCh(grid,br+1-bob,xi,(Math.random()<0.5?"/":"\\")); setMode(mg,br+1-bob,xi,'riot');
  }
  return {grid,mg};
}


function __m12_loop(){
if(phase==='riot'){
    scene.style.textShadow="0 0 8px #ff9a3a";
    if(!riotStarted){ riotStarted=true; riotT=0; riotInit(); document.body.style.background="#0e0805"; }
    stepRain();
    riotStep(riotT);
    const {grid,mg}=riotRender(riotT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(riotFires.length>COLS*0.2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= riotFires.length<COLS*0.2 ? "THE STREETS ERUPT IN CHAOS" : "THE CITY BURNS IN THE RIOTS";
    sub.style.color="#ffb05a"; sub.style.textShadow="0 0 8px #b04010";
    riotT++;
    if(!(riotFires.length>=COLS*0.35 && riotT>55)){ timer=setTimeout(loop,80); }
    else { phase='riot_hold'; loop(); }
  }else if(phase==='riot_hold'){
    stage.classList.remove('shake');
    riotStep(riotT);
    const {grid,mg}=riotRender(riotT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="burned and looted. — press RESET"; sub.style.color="#ffb05a"; sub.className="";
    riotT++;
    timer=setTimeout(loop,140);
  }
}


function __m12_start(){
      // ORANGE -> riots
    attackMode='riot';
    cmd.style.color="#ff9a3a"; cmd.style.textShadow="0 0 20px #b04010";
    riotStarted=false; phase='riot';
  
}


function __m12_reset(){
  riotStarted=false; riotT=0; rioters=[]; riotFires=[]; riotDmg=0;
}


registerMethod(12, { start: __m12_start, resetFn: __m12_reset, loopFn: __m12_loop, phaseNames: ['riot', 'riot_hold'] });
