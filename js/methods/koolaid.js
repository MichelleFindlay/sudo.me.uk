let koolStarted=false, koolT=0, koolX=0, koolaidShards=[];


// ---- KOOL-AID: he bursts through half the city, then shatters into glass and punch ----
const koolaidSprite=[
  "   ___",
  "  /   \\",
  " | o o |)",
  " |  >  |",
  " | --- |",
  " \\_____/",
  "  |   |",
];
function koolaidRender(x, ohYeah){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(x);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=koolaidSprite;
  const left=Math.round(x)-spr[0].length, top=streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'koolaid'); } }
  if(ohYeah){ const txt="OH YEAH!", tc=left+Math.floor(spr[0].length/2)-Math.floor(txt.length/2), tr=top-1;
    for(let j=0;j<txt.length;j++){ const c=tc+j; if(c>=0&&c<COLS&&tr>=0&&tr<ROWS){ setCh(grid,tr,c,txt[j]); setMode(mg,tr,c,'koolaid'); } } }
  return {grid,mg};
}
// he explodes into glass shards + spilled punch, which arc outward then settle on the street
function koolaidShatterInit(x){
  koolaidShards=[];
  const ox=Math.round(x)-Math.floor(koolaidSprite[0].length/2), oy=streetRow-Math.floor(koolaidSprite.length/2);
  for(let i=0;i<40;i++){ const ang=Math.random()*Math.PI*2, spd=0.5+Math.random()*2.5;
    koolaidShards.push({x:ox, y:oy, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd*0.6-0.3, glass:Math.random()<0.4}); }
}
function koolaidShatterStep(){
  for(const s of koolaidShards){ s.x+=s.vx; s.y+=s.vy; s.vy+=0.15;
    if(s.y>=streetRow){ s.y=streetRow; s.vy=0; s.vx*=0.7; } }
}
function koolaidShatterRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const s of koolaidShards){ const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){
    setCh(grid,r,c, s.glass?["/","\\","*"][(Math.random()*3)|0]:["~",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'koolaidburst'); } }
  return {grid,mg};
}


function __m40_loop(){
if(phase==='koolaid'){
    scene.style.textShadow="0 0 8px #ff2a40";
    if(!koolStarted){ koolStarted=true; koolT=0; koolX=-10; document.body.style.background="#0c0405"; }
    const stopAt=cx;                                        // he only bursts through half the city
    koolX=Math.min(stopAt, koolX+Math.max(1,Math.floor(COLS/45)));
    const arrived=koolX>=stopAt;
    const ohYeah=(koolT%10)<4;
    const {grid,mg}=koolaidRender(koolX, ohYeah);
    scene.innerHTML=paint(grid,mg,'city');
    if(!arrived) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= arrived ? "OH YEAH!" : "THE KOOL-AID MAN BURSTS THROUGH EVERYTHING";
    sub.style.color="#ff2a40"; sub.style.textShadow="0 0 8px #a00010";
    koolT++;
    if(!arrived){ timer=setTimeout(loop,70); }
    else { koolaidShatterInit(koolX); phase='koolaid_shatter'; koolT=0; loop(); }
  }else if(phase==='koolaid_shatter'){
    stage.classList.add('shake');
    koolaidShatterStep();
    const {grid,mg}=koolaidShatterRender();
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="…AND THEN HE JUST KIND OF FELL APART.";
    sub.style.color="#ff2a40"; sub.style.textShadow="0 0 8px #a00010";
    koolT++;
    if(koolT<24){ timer=setTimeout(loop,60); }
    else { phase='koolaid_hold'; loop(); }
  }else if(phase==='koolaid_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=koolaidShatterRender();
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="just a puddle of punch and broken glass now. — press RESET"; sub.style.color="#ff2a40"; sub.className="";
    koolT++;
    timer=setTimeout(loop,150);
  }
}


function __m40_start(){
      // PUNCH RED -> Kool-Aid
    attackMode='koolaid';
    cmd.style.color="#ff2a40"; cmd.style.textShadow="0 0 20px #a00010";
    koolStarted=false; phase='koolaid';
  
}


function __m40_reset(){
  koolStarted=false; koolT=0; koolX=0; koolaidShards=[];
}


registerMethod(40, { start: __m40_start, resetFn: __m40_reset, loopFn: __m40_loop, phaseNames: ['koolaid', 'koolaid_shatter', 'koolaid_hold'] });
