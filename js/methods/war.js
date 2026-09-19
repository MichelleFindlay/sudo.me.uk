let warStarted=false, warT=0, tanks=[], jets=[], shells=[], warBlasts=[], warDmg=0;


// ---- WAR: tanks roll in, jets strafe, artillery shells level the city ----

function warInit(){
  tanks=[]; jets=[]; shells=[]; warBlasts=[]; warDmg=0;
  for(let i=0;i<3;i++){ tanks.push({ x:-((Math.random()*30)|0)-i*12, spd:0.5+Math.random()*0.4, cool:((Math.random()*20)|0) }); }
  for(let i=0;i<2;i++){ jets.push({ x:COLS+((Math.random()*40)|0), y:2+((Math.random()*4)|0), spd:2+Math.random()*1.5 }); }
}
function warStep(t){
  // tanks advance, firing shells periodically
  for(const tk of tanks){ tk.x+=tk.spd; tk.cool--; if(tk.cool<=0 && tk.x>2){ tk.cool=18+((Math.random()*20)|0);
    shells.push({x:tk.x+7, y:streetRow-2, vx:1.2+Math.random(), vy:-(1.6+Math.random()*0.8), g:0.14}); }
    if(tk.x>COLS+12) tk.x=-((Math.random()*20)|0)-10; }
  // jets streak left, dropping bombs
  for(const j of jets){ j.x-=j.spd; if(Math.random()<0.15){ shells.push({x:j.x, y:j.y+1, vx:-0.4, vy:0.6, g:0.16}); } if(j.x<-6){ j.x=COLS+((Math.random()*30)|0); j.y=2+((Math.random()*4)|0); } }
  // artillery from off-screen: arcing shells
  if(t%5===0){ shells.push({x:(Math.random()*COLS)|0, y:0, vx:(Math.random()*1.5-0.75), vy:0.8+Math.random()*0.6, g:0.12}); }
  // advance shells; detonate on the ground
  for(const s of shells){ s.x+=s.vx; s.y+=s.vy; s.vy+=s.g;
    if(s.y>=streetRow-1){ const bx=Math.round(s.x), max=3+((Math.random()*4)|0);
      warBlasts.push({x:bx, r:0, max});
      // permanently gouge the buildings out of the city where the shell landed
      const br=max+1;
      for(let r=0;r<streetRow;r++){ if(cityGridArr[r]){ let ln=cityGridArr[r].split("");
        for(let c=bx-br;c<=bx+br;c++){ if(c>=0&&c<COLS && ln[c]!==" " && Math.random()<0.75) ln[c]=" "; }
        cityGridArr[r]=ln.join(""); } }
      s.dead=true; } }
  shells=shells.filter(s=>!s.dead && s.x>-2 && s.x<COLS+2);
  // grow + expire blasts
  for(const b of warBlasts){ b.r+=1; } warBlasts=warBlasts.filter(b=>b.r<=b.max+2);
  warDmg=Math.min(COLS, warDmg+ (t%2===0?1:0));
  collapseCity(0.5);   // damaged, unsupported buildings topple
}
function warRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // (building destruction is permanent — baked into cityGridArr by warStep)

  // craters + rubble on the street
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<warDmg/COLS*0.3) g[c]=[".",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }

  // explosions (fireballs)
  for(const b of warBlasts){ for(let dr=0;dr<=b.r;dr++){ const w=b.r-dr; for(let dc=-w;dc<=w;dc++){ const c=b.x+dc, rr=streetRow-1-dr; if(c<0||c>=COLS||rr<0)continue; if(Math.random()<0.25)continue; setCh(grid,rr,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,rr,c,'warfire'); } } }

  // flying shells / tracers
  for(const s of shells){ const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,"*"); setMode(mg,r,c,'warfire'); if(r-1>=0){ setCh(grid,r-1,c,":"); setMode(mg,r-1,c,'warfire'); } } }

  // jets streaking overhead
  for(const j of jets){ const xi=Math.round(j.x), r=Math.round(j.y); const spr="<^==>"; for(let k=0;k<spr.length;k++){ const c=xi+k; if(c>=0&&c<COLS && r>=0&&r<ROWS){ setCh(grid,r,c,spr[k]); setMode(mg,r,c,'war'); } } }

  // tanks rolling along the street
  const tankTop=streetRow-tankSprite.length+1;
  for(const tk of tanks){ const xi=Math.round(tk.x);
    for(let i=0;i<tankSprite.length;i++){ const art=tankSprite[i], r=tankTop+i;
      for(let k=0;k<art.length;k++){ const c=xi+k; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[k]===" ")continue; setCh(grid,r,c,art[k]); setMode(mg,r,c,'war'); } } }

  // drifting smoke over the battlefield
  for(let k=0;k<COLS*0.15;k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.floor(streetRow*0.6))|0); if(Math.random()<warDmg/COLS){ setCh(grid,r,c,["'",",","."][(Math.random()*3)|0]); setMode(mg,r,c,'warfire'); } }
  return {grid,mg};
}


function __m30_loop(){
if(phase==='war'){
    scene.style.textShadow="0 0 8px #8a8a4a";
    if(!warStarted){ warStarted=true; warT=0; warInit(); document.body.style.background="#0a0a06"; }
    stepRain();
    warStep(warT);
    const {grid,mg}=warRender(warT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(warBlasts.length>2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= warDmg<COLS*0.5 ? "WAR — TANKS AND JETS MOVE IN" : "THE CITY IS A WARZONE";
    sub.style.color="#b0b060"; sub.style.textShadow="0 0 8px #4a4a20";
    warT++;
    if(!(warDmg>=COLS && warT>55)){ timer=setTimeout(loop,70); }
    else { phase='war_hold'; loop(); }
  }else if(phase==='war_hold'){
    stage.classList.remove('shake');
    warStep(warT);
    const {grid,mg}=warRender(warT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="reduced to a smoking battlefield. — press RESET"; sub.style.color="#b0b060"; sub.className="";
    warT++;
    timer=setTimeout(loop,140);
  }
}


function __m30_start(){
      // OLIVE DRAB -> War
    attackMode='war';
    cmd.style.color="#8a8a4a"; cmd.style.textShadow="0 0 20px #4a4a20";
    warStarted=false; phase='war';
  
}


function __m30_reset(){
  warStarted=false; warT=0; tanks=[]; jets=[]; shells=[]; warBlasts=[]; warDmg=0;
}


registerMethod(30, { start: __m30_start, resetFn: __m30_reset, loopFn: __m30_loop, phaseNames: ['war', 'war_hold'] });
