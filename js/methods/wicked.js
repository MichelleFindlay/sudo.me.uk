let wickedStarted=false, wickedT=0, wickedFront=0, wickedWitch=null, wickedMonkeys=[], wickedDmgCols=[], wickedDmg=0,
    wickedGlindaX=0, wickedGlindaY=0, wickedMeltT=0;


// ---- WICKED: the city turns emerald, and the flying monkeys give chase over the rooftops ----
const witchSprite=[" /\\","(O)","=#>~~~"];
const flyingMonkeySprite=["^-^","(o)","/|\\"];
const glindaBubbleSprite=[" .--. ","( o  )"," '--' "];
function wickedEmeraldRender(front){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let c=0;c<Math.min(COLS,Math.ceil(front));c++){
    for(let r=0;r<streetRow;r++){ if(grid[r] && grid[r][c]!==" ") setMode(mg,r,c,'emerald'); }
  }
  return {grid,mg};
}
function wickedChaseInit(){
  wickedWitch={x:-8, y:4, dir:1, trail:[]};
  wickedMonkeys=[];
  for(let i=0;i<4;i++){ wickedMonkeys.push({x:-8, y:4, lag:6+i*4}); }
  wickedDmgCols=new Array(COLS).fill(0);
  wickedGlindaX=Math.floor(COLS*0.85); wickedGlindaY=3;
  wickedDmg=0;
}
function wickedChaseStep(t){
  wickedWitch.x+=wickedWitch.dir*2.2;
  wickedWitch.y=4+Math.sin(t*0.15)*3;
  if(wickedWitch.x>COLS+6) wickedWitch.dir=-1;
  if(wickedWitch.x<-6) wickedWitch.dir=1;
  wickedWitch.trail.push({x:wickedWitch.x, y:wickedWitch.y});
  if(wickedWitch.trail.length>70) wickedWitch.trail.shift();
  const xi=Math.round(wickedWitch.x);
  for(let dj=-3;dj<=3;dj++){ const c=xi+dj; if(c>=0&&c<COLS) wickedDmgCols[c]=Math.min(1, wickedDmgCols[c]+0.3); }
  for(const m of wickedMonkeys){
    const idx=Math.max(0, wickedWitch.trail.length-1-m.lag);
    const p=wickedWitch.trail[idx];
    if(p){ m.x=p.x; m.y=p.y+(Math.random()<0.5?-1:1);
      const mxi=Math.round(m.x); for(let dj=-2;dj<=2;dj++){ const c=mxi+dj; if(c>=0&&c<COLS) wickedDmgCols[c]=Math.min(1, wickedDmgCols[c]+0.2); }
    }
  }
  let dmgCount=0; for(let c=0;c<COLS;c++) if(wickedDmgCols[c]>0.4) dmgCount++;
  wickedDmg=dmgCount;
}
function wickedChaseRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  for(let c=0;c<COLS;c++){ if(wickedDmgCols[c]>0.3){
    for(let r=0;r<streetRow;r++){ if(cityGridArr[r] && cityGridArr[r][c] && cityGridArr[r][c]!==" " && Math.random()<wickedDmgCols[c]*0.2){ let ln=cityGridArr[r].split(""); ln[c]=" "; cityGridArr[r]=ln.join(""); } } } }
  collapseCity(0.3);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'emerald');
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(wickedDmgCols[c]>0.5 && Math.random()<0.4) g[c]=[".",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }
  // Glinda, serene in her bubble, watching it all unfold
  { const gb=glindaBubbleSprite;
    for(let i=0;i<gb.length;i++){ const art=gb[i], r=wickedGlindaY+i;
      for(let j=0;j<art.length;j++){ const c=wickedGlindaX+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'glindabubble'); } } }
  // the flying monkeys, in pursuit
  for(const m of wickedMonkeys){
    const xi=Math.round(m.x), yi=Math.round(m.y);
    for(let i=0;i<flyingMonkeySprite.length;i++){ const art=flyingMonkeySprite[i], r=yi+i;
      for(let j=0;j<art.length;j++){ const c=xi+j-1; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'flyingmonkey'); } }
  }
  // the witch herself, streaking overhead
  { const xi=Math.round(wickedWitch.x), yi=Math.round(wickedWitch.y);
    let spr=witchSprite; if(wickedWitch.dir<0) spr=spr.map(s=>s.split("").reverse().join(""));
    for(let i=0;i<spr.length;i++){ const art=spr[i], r=yi+i;
      for(let j=0;j<art.length;j++){ const c=xi+j-1; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'witch'); } } }
  return {grid,mg};
}
function wickedMeltRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'emerald');
  { const gb=glindaBubbleSprite;
    for(let i=0;i<gb.length;i++){ const art=gb[i], r=wickedGlindaY+i;
      for(let j=0;j<art.length;j++){ const c=wickedGlindaX+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'glindabubble'); } } }
  // the witch, shrinking away to nothing on the street below
  const xi=cx, yi=streetRow-2;
  for(let k=0;k<Math.min(3, t);k++){ const c=xi+k-1, r=yi; if(c>=0&&c<COLS){ setCh(grid,r,c,(Math.random()<0.5?"~":".")); setMode(mg,r,c,'witch'); } }
  if(t<3){ setCh(grid,yi,xi,"O"); setMode(mg,yi,xi,'witch'); }
  return {grid,mg};
}


function __m57_loop(){
if(phase==='wicked'){
    scene.style.textShadow="0 0 10px #1fae5a";
    if(!wickedStarted){ wickedStarted=true; wickedT=0; wickedFront=0; document.body.style.background="#02140a"; }
    wickedFront=Math.min(COLS, wickedFront+Math.max(1,COLS/60));
    const {grid,mg}=wickedEmeraldRender(wickedFront);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="THE CITY TURNS EMERALD GREEN"; sub.style.color="#1fae5a"; sub.style.textShadow="0 0 8px #0a5a2a";
    wickedT++;
    if(wickedFront<COLS){ timer=setTimeout(loop,60); }
    else { phase='wicked_chase'; wickedT=0; wickedChaseInit(); loop(); }
  }else if(phase==='wicked_chase'){
    wickedChaseStep(wickedT);
    const {grid,mg}=wickedChaseRender();
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent=["THE WITCH TAKES TO THE SKIES","THE FLYING MONKEYS GIVE CHASE","SHE WON'T GET AWAY THAT EASILY","GLINDA WATCHES FROM HER BUBBLE, UNBOTHERED"][Math.floor(wickedT/16)%4];
    sub.style.color="#1fae5a"; sub.style.textShadow="0 0 8px #0a5a2a";
    wickedT++;
    if(!(wickedDmg>=COLS*0.55 && wickedT>40)){ timer=setTimeout(loop,60); }
    else { phase='wicked_melt'; wickedMeltT=0; loop(); }
  }else if(phase==='wicked_melt'){
    stage.classList.remove('shake');
    const {grid,mg}=wickedMeltRender(wickedMeltT);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="I'M MELTING!"; sub.style.color="#7ad020"; sub.style.textShadow="0 0 10px #1fae5a";
    wickedMeltT++;
    if(wickedMeltT<12){ timer=setTimeout(loop,90); }
    else { phase='wicked_hold'; loop(); }
  }else if(phase==='wicked_hold'){
    stage.classList.remove('shake');
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'emerald');
    { const gb=glindaBubbleSprite;
      for(let i=0;i<gb.length;i++){ const art=gb[i], r=wickedGlindaY+i;
        for(let j=0;j<art.length;j++){ const c=wickedGlindaX+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'glindabubble'); } } }
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the monkeys stand down. Glinda floats serenely on. — press RESET"; sub.style.color="#1fae5a"; sub.className="";
    timer=setTimeout(loop,200);
  }
}


function __m57_start(){
      // EMERALD GREEN -> Wicked
    attackMode='wicked';
    cmd.style.color="#1fae5a"; cmd.style.textShadow="0 0 20px #0a5a2a";
    wickedStarted=false; phase='wicked';
  
}


function __m57_reset(){
  wickedStarted=false; wickedT=0; wickedFront=0; wickedWitch=null; wickedMonkeys=[]; wickedDmgCols=[]; wickedDmg=0;
  wickedGlindaX=0; wickedGlindaY=0; wickedMeltT=0;
}


registerMethod(57, { start: __m57_start, resetFn: __m57_reset, loopFn: __m57_loop, phaseNames: ['wicked', 'wicked_chase', 'wicked_melt', 'wicked_hold'] });
