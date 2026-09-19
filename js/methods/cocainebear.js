let cbStarted=false, cbT=0, cbSubPhase='drop', cbPlaneX=0, cbBags=[], cbBearX=0, cbHigh=false, cbPeople=[], cbDmg=0, cbBearDir=1;


// ---- COCAINE BEAR: same plot, wrong setting — a smuggler's plane, some duffel bags, one bear ----
const cocaineBearSprite=[
  " ^   ^ ",
  "(o   o)",
  " \\ - / ",
  "/|   |\\",
];
const cocaineBearHighSprite=[
  " ^   ^ ",
  "(*   *)",
  " \\ w / ",
  "/|   |\\",
];
function cbPeopleInit(){
  cbPeople=[];
  const n=Math.max(8, Math.floor(COLS/14));
  for(let i=0;i<n;i++){ cbPeople.push({x:(i+0.5)/n*COLS + (Math.random()*4-2), state:'idle'}); }
}
function cbInitBags(){
  cbBags=[];
  const n=3+((Math.random()*2)|0);
  for(let i=0;i<n;i++){ cbBags.push({ x: COLS*(0.15+0.7*Math.random()), y:1, triggered:false, landed:false, eaten:false }); }
}
function cbDrawBag(grid, mg, bag){
  if(bag.eaten) return;
  const c=Math.round(bag.x), r=Math.round(bag.y);
  if(c<0||c>=COLS||r<0||r>=ROWS) return;
  setCh(grid,r,c,"%"); setMode(mg,r,c,'cocainebag');
}
function cbDrawBear(grid, mg, x, high, wobble){
  const spr = high ? cocaineBearHighSprite : cocaineBearSprite;
  const top = streetRow-spr.length+1-(wobble||0);
  const xi=Math.round(x);
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j-3;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'cocainebear'); } }
}
function cbDrawPerson(grid, mg, p){
  if(p.state==='mauled'){ const c=Math.round(p.x); if(c>=0&&c<COLS){ setCh(grid,streetRow,c, Math.random()<0.5?"@":"#"); setMode(mg,streetRow,c,'cocainegore'); } return; }
  const spr=rubberPersonSprite, top=streetRow-spr.length+1, xi=Math.round(p.x);
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j-1;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'rubberperson'); } }
}
function cbStep(t){
  if(cbSubPhase==='drop'){
    cbPlaneX += Math.max(1, COLS/45);
    for(const bag of cbBags){
      if(!bag.triggered && cbPlaneX>=bag.x){ bag.triggered=true; bag.y=3; }
      if(bag.triggered && !bag.landed){ bag.y += 1.4; if(bag.y>=streetRow){ bag.y=streetRow; bag.landed=true; } }
    }
    if(cbPlaneX>COLS+14 && cbBags.every(b=>b.landed)){ cbSubPhase='find'; cbBearX=-6; }
  } else if(cbSubPhase==='find'){
    let target=null, bestD=Infinity;
    for(const bag of cbBags){ if(bag.eaten) continue; const d=Math.abs(bag.x-cbBearX); if(d<bestD){ bestD=d; target=bag; } }
    if(target){
      const diff=target.x-cbBearX;
      cbBearX += Math.sign(diff)*Math.min(Math.abs(diff), Math.max(1, COLS/70));
      if(Math.abs(target.x-cbBearX)<3){ target.eaten=true; cbHigh=true; cbSubPhase='rampage'; cbBearDir=Math.random()<0.5?-1:1; }
    } else { cbHigh=true; cbSubPhase='rampage'; }
  } else if(cbSubPhase==='rampage'){
    if(Math.random()<0.06) cbBearDir*=-1;
    const spd=1.6+Math.random()*1.8;
    cbBearX += spd*cbBearDir;
    if(cbBearX<4){ cbBearDir=1; } if(cbBearX>COLS-4){ cbBearDir=-1; }
    const xi=Math.round(cbBearX);
    for(const p of cbPeople){ if(p.state==='idle' && Math.abs(p.x-xi)<4){ p.state='mauled'; } }
    if(cityGridArr.length===ROWS){
      for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
        for(let c=xi-3;c<=xi+3;c++){ if(c>=0&&c<COLS&&ln[c]!==" "&&Math.random()<0.08) ln[c]=" "; }
        cityGridArr[r]=ln.join(""); }
    }
    cbDmg = cbPeople.filter(p=>p.state==='mauled').length;
  }
}
function cbRender(subPhase, wobble){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const p of cbPeople){ cbDrawPerson(grid,mg,p); }
  for(const bag of cbBags){ cbDrawBag(grid,mg,bag); }
  if(subPhase==='drop'){
    const art=planeR[0];
    const xi=Math.round(cbPlaneX);
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=xi+j;
      if(c<0||c>=COLS)continue; setCh(grid,3,c,ch); setMode(mg,3,c,'plane'); }
  }
  if(cbBearX>-20){ cbDrawBear(grid, mg, cbBearX, cbHigh, wobble); }
  return {grid,mg};
}


function __m63_loop(){
if(phase==='cocainebear'){
    scene.style.textShadow="0 0 10px #6a4a2a";
    if(!cbStarted){ cbStarted=true; cbT=0; cbSubPhase='drop'; cbPlaneX=-14; cbHigh=false; cbBearX=-30; cbBearDir=1; cbInitBags(); cbPeopleInit(); cbDmg=0;
      if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
      document.body.style.background="#0a0805"; }
    cbStep(cbT);
    const wobble = cbSubPhase==='rampage' ? (Math.sin(cbT*0.6)>0?1:0) : 0;
    const {grid,mg}=cbRender(cbSubPhase, wobble);
    scene.innerHTML=paint(grid,mg,'city');
    if(cbSubPhase==='rampage') stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = cbSubPhase==='drop' ? "A SMUGGLER'S PLANE DROPS ITS CARGO"
                     : cbSubPhase==='find' ? "SOMETHING IN THE CITY HAS FOUND THE COCAINE"
                     : "THE BEAR DID A LOT OF COCAINE";
    sub.style.color="#e8d8c0"; sub.style.textShadow="0 0 8px #6a4a2a";
    cbT++;
    if(!(cbSubPhase==='rampage' && (cbDmg>=cbPeople.length*0.75 || cbT>140))){ timer=setTimeout(loop,70); }
    else { phase='cocainebear_hold'; loop(); }
  }else if(phase==='cocainebear_hold'){
    stage.classList.remove('shake');
    cbStep(cbT);
    const {grid,mg}=cbRender('rampage', 0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the bear is fine. everyone else is not. — press RESET"; sub.style.color="#e8d8c0"; sub.className="";
    cbT++;
    timer=setTimeout(loop,150);
  }
}


function __m63_start(){
      // BEAR BROWN -> Cocaine Bear
    attackMode='cocainebear';
    cmd.style.color="#6a4a2a"; cmd.style.textShadow="0 0 20px #e8d8c0";
    cbStarted=false; phase='cocainebear';
  
}


function __m63_reset(){
  cbStarted=false; cbT=0; cbSubPhase='drop'; cbPlaneX=0; cbBags=[]; cbBearX=0; cbHigh=false; cbPeople=[]; cbDmg=0; cbBearDir=1;
}


registerMethod(63, { start: __m63_start, resetFn: __m63_reset, loopFn: __m63_loop, phaseNames: ['cocainebear', 'cocainebear_hold'] });
