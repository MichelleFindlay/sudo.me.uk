let trbStarted=false, trbT=0, trbAngle=0, trbReleased=false, trbRelFrom=null;
let trbAX=0, trbAY=0, trbDir=1, trbSpeed=0, trbTX=0, trbFenceX=0, trbPondX=0;
let trbMG=null, trbLand=[], trbKeys=null, trbParts=[], trbTexts=[], trbWave=null, trbCarpark=null;
let trbGive=null, trbRubble=[], trbRubbleCh=[], trbLanded=false, trbDuckGone=false, trbShakeT=0;

// ---- MATILDA: the Trunchbull's hammer throw, as seen from the town it lands on ----
// Amanda Thripp is spun by her pigtails and let go; seven named landmarks are stamped
// into the city in order so she can hit each one on its own caption, bounce off the last,
// and fly back over a skyline that gives up ahead of her
const TRB_SPIN=[
  "CRUNCHEM HALL. AMANDA THRIPP HAS COME TO SCHOOL WITH PIGTAILS.",
  "THE TRUNCHBULL PLANTS HER FEET, SETS HER SHOULDERS, AND BEGINS TO SPIN",
  "ONCE. TWICE. THREE TIMES. FASTER AND FASTER.",
  "AMANDA IS A SHRIEKING PIGTAILED PROPELLER, AND THE AIR AROUND THE PLAYGROUND STARTS TO HOWL",
  "ON THE FOURTH ROTATION, THE TRUNCHBULL LETS GO WITH A ROAR THAT RATTLES THE CLASSROOM WINDOWS"
];
const TRB_FLIGHT=[
  "AMANDA DOES NOT STOP AT THE FENCE.",
  "SHE CLEARS IT BY SIXTY FEET, STILL CLIMBING, AND KEEPS GOING STRAIGHT FOR THE TOWN",
  "THE CHURCH SPIRE IS FIRST. THE WHOLE STEEPLE FOLDS LIKE A DECKCHAIR, BELLS CLANGING ALL THE WAY DOWN",
  "SHE RICOCHETS OFF THE BANK, PUNCHING A NEAT, GIRL-SHAPED HOLE IN ONE SIDE AND OUT THE OTHER",
  "...FOLLOWED BY A BLIZZARD OF BANKNOTES",
  "THE GASWORKS GO NEXT.",
  "THEN THE MULTI-STOREY CAR PARK, WHICH COLLAPSES LEVEL BY LEVEL LIKE A STACK OF DROPPED PANCAKES",
  "SHE SKIMS THE TOP OF THE DEPARTMENT STORE",
  "SHE TAKES OUT THE CLOCK TOWER. IT STOPS AT 10:42 FOREVER.",
  "SHE BOUNCES OFF THE WATER TOWER SO HARD IT BURSTS, SENDING A TIDAL WAVE THROUGH THE HIGH STREET"
];
const TRB_GIVEUP=[
  "BY NOW SHE'S PICKED UP SO MUCH SPEED THAT BUILDINGS SIMPLY GIVE UP AS SHE APPROACHES",
  "THE CINEMA. THE POST OFFICE. THE COOLING TOWERS ON THE HILL.",
  "THE TALL BLOCK OF FLATS NOBODY LIKED.",
  "ONE AFTER ANOTHER THEY BUCKLE, TOPPLE, AND CRUMBLE INTO GREAT ROLLING CLOUDS OF DUST"
];
const TRB_POND=[
  "AT LAST, WITH NOTHING LEFT STANDING ON THE HORIZON, AMANDA DROPS GENTLY INTO THE DUCK POND IN THE PARK",
  "SHE SITS UP IN THE SHALLOWS AND WIPES THE WEED OUT OF HER EYES",
  "BEHIND HER, THE SKYLINE IS A FLAT, SMOKING LINE OF RUBBLE"
];
const TRB_HOLD=[
  "BACK AT CRUNCHEM HALL, THE TRUNCHBULL SHADES HER EYES AND SQUINTS AT THE EMPTY HORIZON",
  "\"HMPH,\" SHE SAYS."
];

const trbStandArt=["  ___  "," (o_o) "," /|#|\\ ","  |#|  ","  / \\  "];
const trbSpinFrontArt=["  ___  "," (>_<) ","--|#|--","  |#|  ","  / \\  "];
const trbSpinBackArt=["  ___  "," (___) ","--|#|--","  |#|  ","  / \\  "];
const trbRoarArt=["  ___  "," (>O<) ","--|#|--","  |#|  ","  / \\  "];
const trbShadeArt=["  ___ _"," (-_-)/"," /|#|  ","  |#|  ","  / \\  "];
const trbFenceArt=["^^^","|||","|||"];
const trbAmandaArt="~o~";

// landmark templates: rep = row duplicated to stretch the building to the skyline's
// scale, hit = the row Amanda passes through (indexed before stretching)
const trbLandDefs=[
  {kind:'church', mode:'trbchurch', rep:7, hit:1, word:"CLANG!",
    art:["  +  ","  ^  "," /^\\ "," |o| "," |o| ","/___\\","|[ ]|","|   |","|_n_|"]},
  {kind:'bank', mode:'trbbank', rep:2, hit:2, word:"KER-CHING",
    art:[" ____ ","/BANK\\","|[][]|","|[][]|","|[][]|","|_$$_|"]},
  {kind:'gas', mode:'trbgas', rep:2, hit:2, word:"WHUMPF!",
    art:[" ___ ","/###\\","|###|","|###|","|___|"]},
  {kind:'carpark', mode:'trbcarpark', rep:1, hit:0, word:"CRUNCH",
    art:["_____","|===|","|===|","|===|","|===|","|___|"]},
  {kind:'store', mode:'trbstore', rep:2, hit:0, word:"SCRAPE",
    art:["______","|DEPT|","|[][]|","|[][]|","|_||_|"]},
  {kind:'clock', mode:'trbclock', rep:2, hit:1, word:"BONG.",
    art:[" _ ","(o)","| |","| |","| |","| |","|_|"]},
  {kind:'water', mode:'trbtower', rep:4, hit:1, word:"SPLOOSH!",
    art:[" ___ ","(~~~)","(~~~)"," /|\\ "," | | "," | | "," | | "]}
];

function trbDur(text){ return Math.max(38, Math.ceil(text.length*0.85)); }
function trbTotal(beats){ let s=0; for(const b of beats) s+=trbDur(b); return s; }
function trbBeatAt(beats,t){
  let s=0;
  for(let i=0;i<beats.length;i++){ const d=trbDur(beats[i]); if(t<s+d) return {i,local:t-s,dur:d,start:s}; s+=d; }
  return {i:beats.length,local:t-s,dur:0,start:s};
}
function trbStarts(beats){ const out=[]; let s=0; for(const b of beats){ out.push(s); s+=trbDur(b); } return out; }
function trbSub(text,color,glow){
  sub.textContent=text; sub.style.color=color||"#9ac05a"; sub.style.textShadow="0 0 8px "+(glow||"#3a5a1a");
}
function trbFlash(a){
  flash.style.transition="opacity 0.03s"; flash.style.opacity=a;
  setTimeout(()=>{ flash.style.transition="opacity 0.6s"; flash.style.opacity=0; },60);
}

function trbClearCell(r,c){
  if(r<0||r>=streetRow||c<0||c>=COLS||!cityGridArr[r]) return;
  setCh(cityGridArr,r,c," ");
  if(trbMG&&trbMG[r]) trbMG[r][c]=null;
}
function trbClearCols(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=c0;c<=c1;c++) trbClearCell(r,c); }
function trbStamp(art,left,bottom,mode){
  const top=bottom-art.length+1;
  for(let i=0;i<art.length;i++){
    const r=top+i; if(r<0||r>=streetRow) continue;
    for(let j=0;j<art[i].length;j++){
      const c=left+j, ch=art[i][j]; if(ch===" "||c<0||c>=COLS) continue;
      setCh(cityGridArr,r,c,ch); if(trbMG&&trbMG[r]) trbMG[r][c]=mode;
    }
  }
  return top;
}
function trbPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=top+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=left+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function trbText(s,x,y,mode,delay){ trbTexts.push({s,x,y,mode,life:24,delay:delay||0}); }
function trbPart(x,y,vx,vy,g,ch,mode,life){ if(trbParts.length<900) trbParts.push({x,y,vx,vy,g,ch,mode,life}); }
function trbBurst(x,y,n,speed,chars,mode,g,life){
  for(let k=0;k<n;k++){
    const a=Math.random()*Math.PI*2, s=speed*(0.4+Math.random()*0.6);
    trbPart(x,y,Math.cos(a)*s,Math.sin(a)*s*0.5,g,chars[(Math.random()*chars.length)|0],mode,life*(0.6+Math.random()*0.6));
  }
}

function trbInit(){
  trbStarted=true; trbT=0; trbAngle=0; trbReleased=false;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  trbMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  trbTX=8; trbFenceX=17; trbPondX=Math.round(COLS*0.55);
  trbClearCols(0,trbFenceX+1);                                 // the playground
  // lay the seven landmarks out evenly between the fence and the right edge
  const maxB=Math.min(streetRow-2,30), f=Math.max(1,Math.min(2,maxB/14));
  const regionL=trbFenceX+4, regionR=COLS-2;
  const widths=trbLandDefs.map(d=>d.art[0].length), sumW=widths.reduce((a,b)=>a+b,0);
  const gap=Math.max(1,(regionR-regionL-sumW)/(trbLandDefs.length-1));
  let x=regionL;
  trbLand=trbLandDefs.map((d,i)=>{
    const art=d.art.slice(), target=Math.min(maxB,Math.round(d.art.length*f));
    while(art.length<target) art.splice(d.rep,0,d.art[d.rep]);
    const extra=art.length-d.art.length, hit=d.hit>d.rep?d.hit+extra:d.hit;
    const left=Math.round(x), w=widths[i];
    trbClearCols(left-1,left+w);
    const top=trbStamp(art,left,streetRow-1,d.mode);
    x+=w+gap;
    return {kind:d.kind, mode:d.mode, word:d.word, art, left, w, top, x:left+Math.floor(w/2), hitRow:top+hit, hit:false};
  });
  trbParts=[]; trbTexts=[]; trbWave=null; trbCarpark=null; trbKeys=null; trbGive=null;
  trbRubble=Array(COLS).fill(0); trbRubbleCh=Array(COLS).fill("");
  trbLanded=false; trbDuckGone=false; trbShakeT=0;
  document.body.style.background="#070a06";
}

// ---- landmark impacts ----
function trbHit(lm){
  lm.hit=true;
  trbText(lm.word,lm.x,lm.top-2,lm.kind==='bank'?'trbcash':'trbbell');
  if(lm.kind==='church'){
    // the steeple folds over like a deckchair; the bells go the rest of the way on their own
    for(let i=0;i<5;i++) for(let j=0;j<lm.w;j++) trbClearCell(lm.top+i,lm.left+j);
    trbStamp(["_/\\/_"],lm.left,lm.top+4,'trbchurch');
    for(let k=0;k<3;k++) trbPart(lm.x+k-1,lm.top+3,(Math.random()-0.5)*0.6,-0.3,0.08,"o",'trbbell',90);
    trbText("CLANG!",lm.x+3,lm.top-4,'trbbell',12); trbText("DONG",lm.x-2,lm.top,'trbbell',26);
  } else if(lm.kind==='bank'){
    for(let r=lm.hitRow;r<=lm.hitRow+1;r++) for(let j=0;j<lm.w;j++) trbClearCell(r,lm.left+j);
    for(let k=0;k<60;k++) trbPart(lm.left+lm.w,lm.hitRow+Math.random()*2,0.2+Math.random()*1.2,(Math.random()-0.6)*0.5,0.012,
      ["$","=","$","#"][(Math.random()*4)|0],'trbcash',90+Math.random()*60);
  } else if(lm.kind==='gas'){
    for(let r=lm.top;r<streetRow;r++) for(let j=0;j<lm.w;j++) trbClearCell(r,lm.left+j);
    trbBurst(lm.x,lm.hitRow,45,2.4,["*","#","@","%"],'fire',0.03,22);
    trbBurst(lm.x,lm.hitRow,25,0.8,[".","'","`",":"],'trbdust',-0.01,45);
    trbFlash(0.45); trbShakeT=10;
  } else if(lm.kind==='carpark'){
    trbCarpark={lm, levels:lm.art.length-1, total:lm.art.length-1, t:0};
  } else if(lm.kind==='store'){
    for(let j=0;j<lm.w;j++){ trbClearCell(lm.top,lm.left+j); if(Math.random()<0.4) trbClearCell(lm.top+1,lm.left+j); }
    trbBurst(lm.x,lm.top,14,1.4,["*","'"],'trbspark',0.04,14);
  } else if(lm.kind==='clock'){
    // the tower comes down; the face lands in the street, stopped for good
    for(let r=lm.top;r<streetRow;r++) for(let j=0;j<lm.w;j++) trbClearCell(r,lm.left+j);
    trbStamp(["10:42"],lm.x-2,streetRow-1,'trbclock');
    trbBurst(lm.x,lm.hitRow,12,1,[".","'","`"],'trbdust',0.02,30);
  } else if(lm.kind==='water'){
    for(let i=0;i<3;i++) for(let j=0;j<lm.w;j++) trbClearCell(lm.top+i,lm.left+j);
    trbBurst(lm.x,lm.top+1,50,2,["~","*","°","~"],'water',0.06,26);
    trbWave={x:lm.left, src:lm.left+lm.w, fade:0};
    trbShakeT=8;
  }
}
function trbCarparkStep(){
  const cp=trbCarpark; if(!cp||cp.levels<=0) return;
  cp.t++; if(cp.t%5!==0) return;
  cp.levels--;
  const lm=cp.lm, pan=Math.ceil((cp.total-cp.levels)/2), art=[];
  if(cp.levels>0){ art.push("_____"); for(let i=0;i<cp.levels;i++) art.push("|===|"); }
  for(let i=0;i<pan;i++) art.push("=-=-=");
  trbClearCols(lm.left,lm.left+lm.w-1);
  const top=trbStamp(art,lm.left,streetRow-1,'trbcarpark');
  for(let k=0;k<4;k++) trbPart(lm.left+Math.random()*lm.w,top,(Math.random()-0.5)*0.8,-0.15,0,".",'trbdust',20);
}

// ---- per-frame effects ----
function trbStepParts(){
  for(const p of trbParts){
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--;
    if(p.mode==='trbcash') p.vx+=(Math.random()-0.5)*0.12;          // banknotes flutter
    if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx=0; p.vy=0; p.g=0; }
  }
  trbParts=trbParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<streetRow);
  for(const t of trbTexts){ if(t.delay>0) t.delay--; else { t.life--; if(t.life%3===0) t.y-=1; } }
  trbTexts=trbTexts.filter(t=>t.life>0);
}
function trbStepWave(){
  const w=trbWave; if(!w) return;
  if(w.x>trbFenceX+2) w.x-=1.6; else w.fade++;
  if(w.fade>30) trbWave=null;
}
function trbSpawnSmoke(){
  for(let k=0;k<Math.max(2,COLS/40);k++){
    const c=(Math.random()*COLS)|0; if(!trbRubble[c]) continue;
    trbPart(c,streetRow-1-trbRubble[c],(Math.random()-0.5)*0.15,-0.15-Math.random()*0.2,0,
      ["'",".","`",":"][(Math.random()*4)|0],'trbdust',25+Math.random()*25);
  }
}

// ---- drawing ----
function trbRenderBase(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!trbMG||trbMG.length!==ROWS||trbMG[0].length!==COLS) trbMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){
    const mr=trbMG[r];
    for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c];
  }
  for(let c=0;c<COLS;c++){
    const h=trbRubble[c]||0;
    for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,trbRubbleCh[c][k]); setMode(mg,streetRow-1-k,c,'rubble'); }
  }
  return {grid,mg};
}
function trbDrawWave(grid,mg){
  const w=trbWave; if(!w) return;
  const x0=Math.max(0,Math.round(w.x));
  for(let c=x0;c<Math.min(COLS,w.src);c++){
    const back=c-x0;
    let h=back<3?3:(back<20?2:1);
    h=Math.max(0,h-Math.floor(w.fade/10));
    for(let k=0;k<h;k++){
      const r=streetRow-1-k;
      const ch=(back===0&&k===h-1)?"@":(k===h-1?(Math.random()<0.3?"#":"~"):"≈");
      setCh(grid,r,c,ch); setMode(mg,r,c,'water');
    }
  }
}
function trbDrawParts(grid,mg){
  for(const p of trbParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of trbTexts){
    if(t.delay>0) continue;
    const r=Math.round(t.y); if(r<0) continue;
    const left=Math.max(0,Math.min(COLS-t.s.length,t.x-Math.floor(t.s.length/2)));
    for(let j=0;j<t.s.length;j++){ setCh(grid,r,left+j,t.s[j]); setMode(mg,r,left+j,t.mode); }
  }
}
function trbDrawSchool(grid,mg,art){
  trbPlace(grid,mg,art,trbTX-3,streetRow-art.length,'trunchbull');
  trbPlace(grid,mg,trbFenceArt,trbFenceX-1,streetRow-trbFenceArt.length,'trbfence');
  const sign="CRUNCHEM HALL", sr=streetRow-10;
  if(sr>=0) trbPlace(grid,mg,[sign],Math.max(0,trbTX-Math.floor(sign.length/2)),sr,'trbsign');
}
function trbDrawAmanda(grid,mg,x,y){
  const xi=Math.round(x), yi=Math.round(y);
  // motion streak trailing behind her, longer the faster she's going
  const n=Math.min(6,Math.round(trbSpeed*2));
  for(let k=2;k<2+n;k++){ const c=xi-trbDir*k; setCh(grid,yi,c,k<4?"=":"-"); setMode(mg,yi,c,'trbwind'); }
  trbPlace(grid,mg,[trbAmandaArt],xi-1,yi,'amanda');
}
function trbPaint(grid,mg){
  scene.innerHTML=paint(grid,mg,'city');
  if(trbShakeT>0){ trbShakeT--; stage.classList.toggle('shake',trbShakeT%2===0); }
  else stage.classList.remove('shake');
}

function __m76_loop(){
  if(phase==='trb_spin'){
    if(!trbStarted) trbInit();
    const S=trbStarts(TRB_SPIN), b=trbBeatAt(TRB_SPIN,trbT);
    const relT=S[4]+Math.round(trbDur(TRB_SPIN[4])*0.55), endT=trbTotal(TRB_SPIN);
    const rx=6, ry=2, cRow=streetRow-4;
    const {grid,mg}=trbRenderBase();
    if(!trbReleased){
      let w=0;
      if(b.i>=1){ const f=Math.min(1,(trbT-S[1])/(S[4]-S[1])); w=0.06+1.1*Math.pow(f,1.6); }
      trbAngle+=w; trbSpeed=0;
      trbAX=trbTX+Math.cos(trbAngle)*rx; trbAY=cRow+Math.sin(trbAngle)*ry;
      if(trbT>=relT){
        trbReleased=true; trbRelFrom={x:trbAX,y:trbAY};
        trbText("RAAAARGH!",Math.max(5,trbTX),streetRow-7,'trbroar'); trbFlash(0.3); trbShakeT=14;
      }
      const s=Math.sin(trbAngle), cs=Math.cos(trbAngle);
      const body=b.i===0?trbStandArt:(s<-0.3?trbSpinBackArt:trbSpinFrontArt);
      if(s<0) trbDrawAmanda(grid,mg,trbAX,trbAY);
      trbDrawSchool(grid,mg,body);
      // the pigtails, stretched taut between her fists and Amanda
      const hx=trbTX+(cs>=0?3:-3), hy=streetRow-3, steps=Math.max(1,Math.round(Math.abs(trbAX-hx)));
      for(let k=1;k<steps;k++){ const c=Math.round(hx+(trbAX-hx)*k/steps), r=Math.round(hy+(trbAY-hy)*k/steps); setCh(grid,r,c,"."); setMode(mg,r,c,'trbpigtail'); }
      if(s>=0) trbDrawAmanda(grid,mg,trbAX,trbAY);
      // the air starts to howl
      for(let k=0;k<w*7;k++){
        const a=Math.random()*Math.PI*2, c=Math.round(trbTX+Math.cos(a)*(rx+2)), r=Math.round(cRow+Math.sin(a)*(ry+1));
        setCh(grid,r,c,Math.random()<0.5?"~":"-"); setMode(mg,r,c,'trbwind');
      }
    } else {
      const f=Math.min(1,(trbT-relT)/Math.max(1,endT-relT));
      const nx=trbRelFrom.x+(trbFenceX-1-trbRelFrom.x)*f, ny=trbRelFrom.y+(streetRow-8-trbRelFrom.y)*f;
      trbSpeed=Math.hypot(nx-trbAX,ny-trbAY)+1.5; trbDir=1; trbAX=nx; trbAY=ny;
      trbDrawSchool(grid,mg,trbT-relT<12?trbRoarArt:trbStandArt);
      trbDrawAmanda(grid,mg,trbAX,trbAY);
    }
    trbStepParts(); trbDrawParts(grid,mg);
    if(b.i<TRB_SPIN.length) trbSub(TRB_SPIN[b.i]);
    trbPaint(grid,mg);
    trbT++;
    if(trbT<endT){ timer=setTimeout(loop,80); }
    else { phase='trb_flight'; trbT=0; loop(); }
  }else if(phase==='trb_flight'){
    const {grid,mg}=trbRenderBase();
    if(!trbKeys){
      // one keyframe per caption: transit beats arrive near their end, impacts early,
      // so each landmark's damage plays out under its own caption
      const S=trbStarts(TRB_FLIGHT), L=trbLand, top=2;
      const pts=[
        [trbFenceX+4, Math.max(top,streetRow-10), null],
        [Math.round((trbFenceX+4+L[0].x)/2), top, null],
        [L[0].x, L[0].hitRow, L[0]],
        [L[1].x, L[1].hitRow, L[1]],
        [Math.round((L[1].x+L[2].x)/2), Math.max(top,L[1].top-2), null],
        [L[2].x, L[2].hitRow, L[2]],
        [L[3].x, L[3].top, L[3]],
        [L[4].x, L[4].top, L[4]],
        [L[5].x, L[5].hitRow, L[5]],
        [L[6].x, L[6].hitRow, L[6]]
      ];
      trbKeys=[{t:0,x:trbAX,y:trbAY,lm:null}].concat(pts.map((p,i)=>({
        t:S[i]+Math.round(trbDur(TRB_FLIGHT[i])*(p[2]?0.35:0.9)), x:p[0], y:p[1], lm:p[2]
      })));
    }
    const last=trbKeys[trbKeys.length-1];
    let nx, ny;
    if(trbT<last.t){
      let k=1; while(trbKeys[k].t<=trbT) k++;
      const a=trbKeys[k-1], z=trbKeys[k], f=(trbT-a.t)/Math.max(1,z.t-a.t);
      nx=a.x+(z.x-a.x)*f;
      ny=a.y+(z.y-a.y)*f-Math.sin(Math.PI*f)*Math.min(3,Math.abs(z.x-a.x)/8);
    } else {
      // rebound off the water tower, back up and over the town
      nx=trbAX-1.2; ny=Math.max(2,trbAY-0.5);
    }
    trbSpeed=Math.hypot(nx-trbAX,ny-trbAY); trbDir=nx>=trbAX?1:-1; trbAX=nx; trbAY=ny;
    for(const key of trbKeys) if(key.lm && !key.lm.hit && trbT>=key.t) trbHit(key.lm);
    trbCarparkStep(); trbStepWave(); trbStepParts();
    trbDrawWave(grid,mg);
    trbDrawSchool(grid,mg,trbStandArt);
    trbDrawParts(grid,mg);
    trbDrawAmanda(grid,mg,trbAX,trbAY);
    const b=trbBeatAt(TRB_FLIGHT,trbT);
    if(b.i<TRB_FLIGHT.length) trbSub(TRB_FLIGHT[b.i]);
    trbPaint(grid,mg);
    trbT++;
    if(trbT<trbTotal(TRB_FLIGHT)){ timer=setTimeout(loop,80); }
    else { phase='trb_giveup'; trbT=0; loop(); }
  }else if(phase==='trb_giveup'){
    const Tg=trbTotal(TRB_GIVEUP);
    if(!trbGive){
      trbCarpark=null;
      trbGive={x0:trbAX, y0:trbAY, cols:[]};
      for(let c=trbFenceX+2;c<COLS;c++) trbGive.cols.push({c, on:false, done:false, had:false,
        jit:Math.random()*10, late:Tg*0.45+Math.random()*Tg*0.3});
    }
    const g=trbGive;
    const fx=1-Math.pow(1-Math.min(1,trbT/(Tg*0.85)),2), fy=1-Math.pow(1-Math.min(1,trbT/25),2);
    const nx=g.x0+(trbPondX-g.x0)*fx, ny=g.y0+(2-g.y0)*fy;
    trbSpeed=Math.abs(nx-trbAX)*1.5; trbDir=-1; trbAX=nx; trbAY=ny;
    // buildings give up ahead of her, and behind her, and eventually everywhere
    const perFrame=streetRow>30?2:1;
    for(const col of g.cols){
      if(col.done) continue;
      if(!col.on && (col.c>=trbAX-12-col.jit || trbT>=col.late)) col.on=true;
      if(!col.on) continue;
      for(let n=0;n<perFrame;n++){
        let r=0; while(r<streetRow && cityGridArr[r][col.c]===" ") r++;
        if(r>=streetRow){
          col.done=true;
          if(col.had){ const h=Math.random()<0.5?1:2; trbRubble[col.c]=h; trbRubbleCh[col.c]=[0,1].map(()=>".,_#%"[(Math.random()*5)|0]).join(""); }
          break;
        }
        trbClearCell(r,col.c); col.had=true;
        if(Math.random()<0.25) trbPart(col.c,r,(Math.random()-0.5)*0.3,-0.05-Math.random()*0.15,0,".",'trbdust',20+Math.random()*20);
        if(Math.random()<0.12) trbPart(col.c,streetRow-1-Math.random()*4,(Math.random()-0.5)*0.9,-0.08,0,
          ["@","%","o","'"][(Math.random()*4)|0],'trbdust',25+Math.random()*25);
      }
    }
    if(trbT>Tg*0.3 && trbT<Tg*0.8) trbShakeT=Math.max(trbShakeT,2);
    trbStepWave(); trbStepParts();
    const {grid,mg}=trbRenderBase();
    trbDrawWave(grid,mg);
    trbDrawSchool(grid,mg,trbStandArt);
    trbDrawParts(grid,mg);
    trbDrawAmanda(grid,mg,trbAX,trbAY);
    const b=trbBeatAt(TRB_GIVEUP,trbT);
    if(b.i<TRB_GIVEUP.length) trbSub(TRB_GIVEUP[b.i]);
    trbPaint(grid,mg);
    trbT++;
    if(trbT<Tg){ timer=setTimeout(loop,80); }
    else {
      // anything still standing gives up too
      for(const col of g.cols){
        if(col.done) continue;
        for(let r=0;r<streetRow;r++){ if(cityGridArr[r][col.c]!==" "){ col.had=true; trbClearCell(r,col.c); } }
        if(col.had){ trbRubble[col.c]=1; trbRubbleCh[col.c]=".,_#%"[(Math.random()*5)|0]; }
      }
      for(let c=trbPondX-7;c<=trbPondX+7;c++) if(c>=0&&c<COLS) trbRubble[c]=0;   // the park
      trbWave=null; stage.classList.remove('shake'); trbShakeT=0;
      phase='trb_pond'; trbT=0; loop();
    }
  }else if(phase==='trb_pond'){
    const S=trbStarts(TRB_POND), b=trbBeatAt(TRB_POND,trbT);
    const landT=Math.round(trbDur(TRB_POND[0])*0.6);
    const {grid,mg}=trbRenderBase();
    // the pond, the reeds, and (briefly) a duck
    for(let c=trbPondX-6;c<=trbPondX+6;c++){ setCh(grid,streetRow,c,"~"); setMode(mg,streetRow,c,'water'); }
    trbPlace(grid,mg,["|"],trbPondX-7,streetRow-1,'trbreed'); trbPlace(grid,mg,["|"],trbPondX+7,streetRow-1,'trbreed');
    if(!trbDuckGone) trbPlace(grid,mg,["(.)>"],trbPondX+2,streetRow-1,'trbduck');
    trbDrawSchool(grid,mg,trbStandArt);
    if(trbT<landT){
      const f=trbT/landT, e=1-Math.pow(1-f,2);
      trbAY=2+(streetRow-1-2)*e; trbAX=trbPondX+Math.sin(trbT*0.25)*2*(1-f); trbSpeed=0;
      trbDrawParts(grid,mg);
      trbPlace(grid,mg,[trbAmandaArt],Math.round(trbAX)-1,Math.round(trbAY),'amanda');
    } else {
      if(!trbLanded){
        trbLanded=true; trbDuckGone=true;
        trbBurst(trbPondX,streetRow-1,24,1.6,["~","*","°"],'water',0.08,16);
        trbTexts.push({s:"(.)>",x:trbPondX+4,y:streetRow-2,mode:'trbduck',life:30,delay:0});
        trbText("SPLOSH",trbPondX,streetRow-4,'speech');
      }
      if(trbT%2===0) trbSpawnSmoke();
      trbDrawParts(grid,mg);
      const rip=(trbT>>2)%2===0;
      trbPlace(grid,mg,[rip?"~     ~":" ~   ~ "],trbPondX-3,streetRow-1,'water');
      trbPlace(grid,mg,[trbAmandaArt],trbPondX-1,streetRow-1,'amanda');
      if(b.i===1 && b.local<b.dur*0.5) trbPlace(grid,mg,["%"],trbPondX,streetRow-2,'amanda');
    }
    for(const t of trbTexts) if(t.s==="(.)>" && t.life%2===0) t.x++;    // the duck leaves
    trbStepParts();
    if(b.i<TRB_POND.length) trbSub(TRB_POND[b.i], b.i===2?"#9aa2ac":null, b.i===2?"#3a3a3a":null);
    trbPaint(grid,mg);
    trbT++;
    if(trbT<trbTotal(TRB_POND)){ timer=setTimeout(loop,80); }
    else { phase='trb_hold'; trbT=0; loop(); }
  }else if(phase==='trb_hold'){
    const b=trbBeatAt(TRB_HOLD,trbT);
    const {grid,mg}=trbRenderBase();
    for(let c=trbPondX-6;c<=trbPondX+6;c++){ setCh(grid,streetRow,c,"~"); setMode(mg,streetRow,c,'water'); }
    trbPlace(grid,mg,["|"],trbPondX-7,streetRow-1,'trbreed'); trbPlace(grid,mg,["|"],trbPondX+7,streetRow-1,'trbreed');
    trbPlace(grid,mg,[trbAmandaArt],trbPondX-1,streetRow-1,'amanda');
    trbSpawnSmoke(); trbStepParts(); trbDrawParts(grid,mg);
    trbDrawSchool(grid,mg,trbShadeArt);
    const hr=streetRow-trbShadeArt.length;
    if(b.i===1){ mtDrawBubble(grid,mg,Math.max(trbTX,5),hr,"HMPH."); }
    else if(b.i>=2){ const s="UNDERARM NEXT TIME."; mtDrawBubble(grid,mg,Math.max(trbTX,Math.ceil((s.length+4)/2)),hr,s); }
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    if(b.i<TRB_HOLD.length) trbSub(TRB_HOLD[b.i]);
    else trbSub("\"UNDERARM NEXT TIME.\" — press RESET","#8ab04a","#3a5a1a");
    sub.className="";
    trbT++;
    timer=setTimeout(loop,140);
  }
}

function __m76_start(){
  attackMode='trb_spin';
  cmd.style.color="#8ab04a"; cmd.style.textShadow="0 0 20px #4a6a2a";
  trbStarted=false; phase='trb_spin';
}

function __m76_reset(){
  trbStarted=false; trbT=0; trbAngle=0; trbReleased=false; trbRelFrom=null;
  trbAX=0; trbAY=0; trbDir=1; trbSpeed=0;
  trbMG=null; trbLand=[]; trbKeys=null; trbParts=[]; trbTexts=[]; trbWave=null; trbCarpark=null;
  trbGive=null; trbRubble=[]; trbRubbleCh=[]; trbLanded=false; trbDuckGone=false; trbShakeT=0;
}

registerMethod(76, { start: __m76_start, resetFn: __m76_reset, loopFn: __m76_loop, phaseNames: ['trb_spin','trb_flight','trb_giveup','trb_pond','trb_hold'] });
