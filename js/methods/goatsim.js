let gtStarted=false, gtT=0, gtIdx=0, gtX=0, gtY=0, gtArt='side', gtHidden=false, gtTongue=false;
let gtG=null, gtMG=null, gtProps=[], gtChain=[], gtTrail=[], gtParts=[], gtTexts=[], gtShakeAmp=0;
let gtPetrol=null, gtVib=null, gtTposers=[], gtHovers=[], gtDog=null, gtRiverClimb=0, gtBanner=null, gtFixedTrail=false;

// ---- GOAT SIMULATOR: Feature Creep ----
// a goat licks things and they stick to its tongue. The chain of stuck things follows the
// goat's own trail (a history of where it has been), so it drags along the street, dangles
// when it clips into a tower, and whips through the city like a wrecking ball once it
// has a jetpack. Every prop, the petrol station, the skyscraper and the town hall are laid
// out once at the start along the street, left to right, in the order the goat meets them
const GT_BEATS=[
  {key:'est',      cap:"SAME PEACEFUL CITY. A SINGLE GOAT STANDS IN THE MIDDLE OF A ROUNDABOUT."},
  {key:'stare',    cap:"IT STARES AT THE CAMERA. COMPLETELY MOTIONLESS. FOR FAR TOO LONG."},
  {key:'lick',     cap:"IT LICKS A LAMPPOST. THE LAMPPOST STICKS TO ITS TONGUE."},
  {key:'drag',     cap:"IT WALKS OFF DRAGGING THE LAMPPOST BEHIND IT, CLANGING. IT DOESN'T SEEM BOTHERED."},
  {key:'collect',  cap:"IT KEEPS LICKING THINGS: A BIN, A BICYCLE, A PARKED CAR..."},
  {key:'collect2', cap:"...A MAN WAITING FOR A BUS. THEN THE BUS."},
  {key:'headbutt', cap:"THE GOAT HEADBUTTS A PETROL STATION."},
  {key:'launch',   cap:"IT DOESN'T BREAK. IT LAUNCHES IN A PERFECT ARC OVER THE SKYLINE. THE GOAT RECEIVES POINTS FOR THIS."},
  {key:'ragdoll',  cap:"PHYSICS GIVE UP. EVERY COLLISION FLINGS THE GOAT INTO A FULL RAGDOLL FLOP."},
  {key:'clip',     cap:"IT CLIPS HALFWAY INTO A SKYSCRAPER AND GETS STUCK, VIBRATING. SO DOES THE SKYSCRAPER."},
  {key:'glitch',   cap:"THE GLITCH SPREADS. PEDESTRIANS T-POSE. CARS HOVER AND SPIN SLOWLY."},
  {key:'uphill',   cap:"THE RIVER FLOWS UPHILL. SOMEONE'S DOG FALLS THROUGH THE PAVEMENT AND REAPPEARS ON A ROOFTOP."},
  {key:'jetpack',  cap:"THE GOAT UNLOCKS A JETPACK. BECAUSE OF COURSE IT DOES."},
  {key:'whip',     cap:"STILL DRAGGING EVERYTHING ON ITS TONGUE, IT WHIPS THE CHAIN THROUGH THE CITY LIKE A WRECKING BALL."},
  {key:'peak',     cap:"AT PEAK ALTITUDE, THE GOAT STOPS. TURNS TO CAMERA. BLINKS ONCE."},
  {key:'drop',     cap:"THEN IT DROPS STRAIGHT DOWN, HEADFIRST, ONTO THE TOWN HALL."},
  {key:'sky',      cap:"THE IMPACT SENDS THE WHOLE CITY INTO THE SKY, EVERY BUILDING RAGDOLLING IN SLOW MOTION."},
  {key:'settle',   cap:"DUST SETTLES ON A FLAT, EMPTY PLAIN."},
  {key:'land',     cap:"THE GOAT LANDS ON ITS FEET, CHEWING CALMLY."},
  {key:'bus',      cap:"THE BUS IS STILL STUCK TO ITS TONGUE. THE MAN IS STILL WAITING AT THE BUS STOP SIGN, WHICH IS ALSO IN THE BUS."}
];
const GT_HOLD="CITY DELETED. +1,000,000 POINTS. — press RESET";

// goat art, right-facing; feet on the last row
const GT_ARTS={
  side:   ["      /)"," ____(o>","(____)  "," || ||  "],
  chew:   ["      /)"," ____(o=","(____)  "," || ||  "],
  front:  [" )  ( ","(o  o)"," \\../ ","  ||  "],
  blink:  [" )  ( ","(-  -)"," \\../ ","  ||  "],
  head:   ["  ||  "," /''\\ ","(o  o)"," )  ( "],
  jet:    ["      /)"," [___(o>","(____)  "," || ||  "],
  rag0:   [" \\  /)  ","  \\(o>  ","(____)\\ ","/ /\\ \\  "],
  rag1:   ["  \\|/   "," (o)__  ","   \\__)/","  /  \\  "]
};
const GT_ITEMS={
  lamp: {art:["o","|","|","|"], mode:'gtlamp', word:"CLANG"},
  bin:  {art:["[_]","|#|"], mode:'gtbin', word:"+10 LICK"},
  bike: {art:[" _\\","o^o"], mode:'gtbike', word:"+10 LICK"},
  car:  {art:[" __ ","[==]","o  o"], mode:'gtcar', word:"+25 LICK"},
  man:  {art:[" o ","/|\\","/ \\"], mode:'body', word:"+50 LICK?"},
  bus:  {art:[" ____ ","|[][]|","'o--o'"], mode:'gtbus', word:"+100 BUS"}
};
const gtRoundaboutArt=[".=====."];
const gtStopArt=["[BUS]","  |  ","  |  "];
const gtPetrolArt=[" ______ ","|PETROL|","|[]  []|","|______|"];
const gtHallArt=["   _   ","  / \\  "," |(o)| ","[=====]","|| | ||","||_|_||"];
const gtTposeArt=["--o--","  |  ","  ^  "];
const gtHoverArts=[["[==]"],["|  |"]];
const gtDogArt=["U^.^U"];

function gtDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function gtPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function gtColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function gtClearCols(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){ setCh(cityGridArr,r,c," "); gtMG[r][c]=null; } }
function gtStamp(art,left,bottom,mode){
  const top=bottom-art.length+1;
  for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){
    const r=top+i, c=left+j, ch=art[i][j]; if(ch===" "||r<0||r>=streetRow||c<0||c>=COLS) continue;
    setCh(cityGridArr,r,c,ch); gtMG[r][c]=mode;
  }
  return top;
}
function gtText(s,x,y,mode,life){ gtTexts.push({s,x,y,mode:mode||'gtpoints',life:life||24}); }
function gtShake(){
  if(gtShakeAmp>0.3){
    stage.style.transform="translate("+((Math.random()-0.5)*2*gtShakeAmp).toFixed(1)+"px,"+((Math.random()-0.5)*2*gtShakeAmp).toFixed(1)+"px)";
    gtShakeAmp*=0.86;
  } else { stage.style.transform=""; gtShakeAmp=0; }
}
function gtArtNow(){ return GT_ARTS[gtArt]; }
function gtArtW(){ return gtArtNow()[0].length; }

function gtInit(){
  gtStarted=true; gtT=0; gtIdx=0; gtHidden=false; gtTongue=false; gtArt='side';
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  gtMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const at=f=>Math.round(COLS*f);
  const g={rb:at(0.10), lamp:at(0.17), bin:at(0.22), bike:at(0.27), car:at(0.32), stop:at(0.38), bus:at(0.43),
           pet:at(0.53), sk:at(0.62), rv0:at(0.68), rv1:at(0.68)+Math.max(5,at(0.05)), hall:at(0.86)};
  gtG=g;
  // the street furniture gets a clear stretch of pavement to itself
  gtClearCols(0,g.bus+4);
  gtClearCols(g.pet-1,g.pet+8);
  gtClearCols(g.rv0-1,g.rv1+1);
  gtClearCols(g.hall-4,g.hall+4);
  gtStamp(gtPetrolArt,g.pet,streetRow-1,'gtpetrol');
  // a skyscraper to get stuck in, and the town hall to land on
  const skH=Math.min(streetRow-3,Math.max(12,Math.round(streetRow*0.75)));
  gtClearCols(g.sk-1,g.sk+6);
  const sky=[" _/\\_ "]; for(let i=1;i<skH;i++) sky.push(i%2?"|[][]|":"|    |");
  g.skTop=gtStamp(sky,g.sk,streetRow-1,'gttower'); g.skL=g.sk; g.skR=g.sk+5;
  g.hallTop=gtStamp(gtHallArt,g.hall-3,streetRow-1,'gthall');
  gtProps=['lamp','bin','bike','car','man','bus'].map(k=>({k, x:g[k==='man'?'stop':k]+(k==='man'?-2:0)}));
  gtChain=[]; gtTrail=[]; gtParts=[]; gtTexts=[]; gtShakeAmp=0;
  gtX=g.rb; gtY=streetRow-1;
  gtPetrol=null; gtVib=null; gtTposers=[]; gtHovers=[]; gtDog=null; gtRiverClimb=0; gtBanner=null; gtFixedTrail=false;
  document.body.style.background="#14223a";
}

// the trail is where the goat has been; each stuck thing sits a fixed distance back along it
function gtRecord(){
  const last=gtTrail[gtTrail.length-1];
  if(!last || Math.hypot(last.x-gtX,last.y-gtY)>=1){ gtTrail.push({x:gtX,y:gtY}); if(gtTrail.length>600) gtTrail.shift(); }
}
function gtChainPositions(){
  const out=[]; let back=Math.ceil(gtArtW()/2)+1;
  for(let k=0;k<gtChain.length;k++){
    const it=GT_ITEMS[gtChain[k]], w=it.art[0].length;
    back+=Math.ceil(w/2)+(k?Math.ceil(GT_ITEMS[gtChain[k-1]].art[0].length/2)+1:0);
    if(gtFixedTrail){ out.push({x:gtX-back, y:gtY, it}); continue; }
    const i=Math.max(0,gtTrail.length-1-back), p=gtTrail[i]||{x:gtX-back,y:gtY};
    out.push({x:p.x, y:p.y, it});
  }
  return out;
}
function gtLine(grid,mg,x0,y0,x1,y1,ch,mode){
  const n=Math.max(1,Math.round(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))));
  for(let k=0;k<=n;k++){ const r=Math.round(y0+(y1-y0)*k/n), c=Math.round(x0+(x1-x0)*k/n); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,ch); setMode(mg,r,c,mode); } }
}

function gtRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!gtMG||gtMG.length!==ROWS||gtMG[0].length!==COLS) gtMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const g=gtG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){ const mr=gtMG[r]; for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c]; }
  // vibration: rows of the affected columns shuffle sideways a column at a time
  if(gtVib){
    for(let r=0;r<streetRow;r++){
      if(Math.random()>gtVib.p) continue;
      const j=Math.random()<0.5?-1:1, L=Math.max(1,gtVib.L), R=Math.min(COLS-2,gtVib.R);
      const row=grid[r].split(""), mrow=mg[r].slice();
      for(let c=L;c<=R;c++){ row[c]=grid[r][c-j]; mg[r][c]=mrow[c-j]; }
      grid[r]=row.join("");
    }
  }
  if(!['sky','settle','land','bus','hold'].includes(key)){
    gtPlace(grid,mg,gtRoundaboutArt,g.rb-3,streetRow-1,'gtrb');
    if(gtProps.some(p=>p.k==='man')) gtPlace(grid,mg,gtStopArt,g.stop-2,streetRow-3,'gtsign');
    for(const p of gtProps){ const it=GT_ITEMS[p.k]; gtPlace(grid,mg,it.art,p.x-Math.floor(it.art[0].length/2),streetRow-it.art.length,it.mode); }
  }
  // the river: normally flowing along the street, later climbing up into the sky
  if(!['sky','settle','land','bus','hold'].includes(key)){
    for(let c=g.rv0;c<=g.rv1;c++){ setCh(grid,streetRow,c,((c+gtT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
    for(let k=0;k<Math.round(gtRiverClimb);k++){
      const r=streetRow-1-k, c0=g.rv0+Math.round(k*0.6);
      for(let c=c0;c<=c0+2;c++){ setCh(grid,r,c,((r+gtT)%3)?"~":"\u2248"); setMode(mg,r,c,'water'); }
    }
  }
  for(const t of gtTposers) gtPlace(grid,mg,gtTposeArt,t.x,streetRow-3,'body');
  for(const h of gtHovers) gtPlace(grid,mg,gtHoverArts[((gtT>>2)+h.ph)%2],h.x,streetRow-3-Math.round(h.lift),'gtcar');
  if(gtDog) gtPlace(grid,mg,gtDogArt,gtDog.x,gtDog.y,'gtdog');
  if(gtPetrol) gtPlace(grid,mg,gtPetrol.flip?gtPetrolArt.slice().reverse():gtPetrolArt,gtPetrol.x,gtPetrol.y,'gtpetrol');
  // the chain of stuck things, then the tongue holding it, then the goat
  const art=gtArtNow(), w=art[0].length, h=art.length;
  const jx=(gtVib&&key==='clip')?(Math.random()<0.5?-1:1):0;
  const left=Math.round(gtX-w/2)+jx, top=Math.round(gtY)-h+1;
  if(!gtHidden){
    const pos=gtChainPositions();
    let prev={x:left+w-1, y:top+1};
    for(const p of pos){
      const iw=p.it.art[0].length, ih=p.it.art.length, il=Math.round(p.x-iw/2), it=Math.round(p.y)-ih+1;
      gtLine(grid,mg,prev.x,prev.y,il+Math.floor(iw/2),it,"~",'gttongue');
      prev={x:il+Math.floor(iw/2), y:it+ih-1};
    }
    for(const p of pos){
      const iw=p.it.art[0].length, ih=p.it.art.length;
      gtPlace(grid,mg,p.it.art,Math.round(p.x-iw/2),Math.round(p.y)-ih+1,p.it.mode);
      if(['bus','hold'].includes(key) && p.it===GT_ITEMS.bus){
        // the man and the bus stop sign, both inside the bus now
        gtPlace(grid,mg,["o"],Math.round(p.x-iw/2)+2,Math.round(p.y)-1,'body');
        gtPlace(grid,mg,["[BUS]"],Math.round(p.x-iw/2)+1,Math.round(p.y)-ih,'gtsign');
      }
    }
    if(gtTongue && !gtChain.length) gtPlace(grid,mg,["~~"],left+w,top+1,'gttongue');
    gtPlace(grid,mg,art,left,top,'goat');
    if(gtArt==='jet') gtPlace(grid,mg,[(gtT%2)?" **":" * "],left,top+h,'fire');
  }
  for(const p of gtParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of gtTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  // banners sit in open sky, below the corner buttons
  if(gtBanner) gtPlace(grid,mg,[gtBanner],Math.max(0,Math.round(cx-gtBanner.length/2)),Math.max(4,Math.round(streetRow*0.25)),'gtbanner');
  scene.innerHTML=paint(grid,mg,'city');
}
function gtStepFx(){
  for(const p of gtParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0.02 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx=0; p.vy=0; p.g=0; } }
  gtParts=gtParts.filter(p=>p.life>0 && p.x>=-2 && p.x<COLS+2 && p.y>=-2 && p.y<ROWS);
  for(const t of gtTexts){ t.life--; if(t.life%3===0) t.y--; }
  gtTexts=gtTexts.filter(t=>t.life>0);
}
function gtWalkTo(target,frames){ const step=(target-gtX)/Math.max(1,frames); gtX+=step; return Math.abs(step); }
function gtLickCheck(){
  // anything the goat's mouth reaches is now attached to the goat
  const mouth=gtX+Math.ceil(gtArtW()/2);
  gtTongue=gtProps.some(p=>p.x-mouth<4 && p.x-mouth>-2);
  for(const p of gtProps.slice()){
    if(mouth>=p.x-1){
      gtProps.splice(gtProps.indexOf(p),1); gtChain.unshift(p.k);
      gtText(GT_ITEMS[p.k].word,p.x,streetRow-6,'gtpoints',22);
    }
  }
}

function __m82_loop(){
  if(phase==='gt_run'){
    if(!gtStarted) gtInit();
    const beat=GT_BEATS[gtIdx], dur=gtDur(beat.cap), f=gtT/Math.max(1,dur-1), key=beat.key, g=gtG;
    const left=dur-gtT;
    let interval=80;

    if(key==='est'){ gtArt='side'; }
    else if(key==='stare'){ gtArt='front'; }
    else if(key==='lick'){
      gtArt='side';
      gtWalkTo(g.lamp-Math.ceil(gtArtW()/2)+1,Math.max(1,Math.round(dur*0.7)-gtT));
      gtLickCheck();
    }else if(key==='drag'){
      gtWalkTo(g.bin-Math.ceil(gtArtW()/2)-3,left);
      if(gtT%10===0) gtText("clang",gtX-8,streetRow-5,'gtclang',14);
    }else if(key==='collect'){
      gtWalkTo(g.car-Math.ceil(gtArtW()/2)+1,Math.max(1,Math.round(dur*0.9)-gtT));
      gtLickCheck();
      if(gtT%12===0) gtText("clang",gtX-10,streetRow-5,'gtclang',14);
    }else if(key==='collect2'){
      gtWalkTo(g.bus-Math.ceil(gtArtW()/2)+1,Math.max(1,Math.round(dur*0.85)-gtT));
      gtLickCheck();
    }else if(key==='headbutt'){
      gtTongue=false;
      const target=g.pet-Math.ceil(gtArtW()/2);
      if(f<0.6) gtWalkTo(target,Math.max(1,Math.round(dur*0.6)-gtT));
      else gtX=target+(f<0.7?1:0);
      if(gtT===Math.round(dur*0.62)){ gtText("BONK",g.pet+4,streetRow-7,'gtpoints',18); gtShakeAmp=5; }
    }else if(key==='launch'){
      if(!gtPetrol){
        gtClearCols(g.pet,g.pet+7);
        const T=Math.round(dur*0.85), H=Math.max(6,streetRow-6);
        gtPetrol={x:g.pet, y:streetRow-gtPetrolArt.length, vx:(COLS+12-g.pet)/T, vy:-2*H/(T/2), g:2*H/((T/2)*(T/2)), flip:false};
        gtText("+500 COMBO",gtX,streetRow-9,'gtpoints',40);
      }
      const P=gtPetrol; P.x+=P.vx; P.y+=P.vy; P.vy+=P.g; P.flip=P.vy>0;
      if(P.x>COLS+10) gtPetrol=null;
    }else if(key==='ragdoll'){
      gtPetrol=null;
      gtArt=(gtT>>2)%2?'rag0':'rag1';
      const x0=g.pet-Math.ceil(8/2), x1=g.skL;
      gtX=x0+(x1-x0)*f;
      gtY=streetRow-1-Math.abs(Math.sin(Math.PI*3*f))*Math.min(8,streetRow*0.3)-(f>0.85?(f-0.85)/0.15*(streetRow*0.35):0);
      if(Math.abs(Math.sin(Math.PI*3*f))<0.08 && f<0.8 && gtT%3===0) gtText("FLOP",gtX,gtY-5,'gtpoints',12);
    }else if(key==='clip'){
      gtArt='rag0';
      gtX=g.skL+1; gtY=Math.round(streetRow-1-streetRow*0.35);
      gtVib={L:g.skL-1, R:g.skR+1, p:0.7};
      if(gtT===4) gtText("+100 STUCK",gtX,gtY-6,'gtpoints',30);
    }else if(key==='glitch' || key==='uphill'){
      // the vibration spreads out from the tower until the whole city is shaking
      const total=dur+gtDur(GT_BEATS[gtIdx+(key==='glitch'?1:0)].cap), tt=(key==='glitch'?0:gtDur(GT_BEATS[gtIdx-1].cap))+gtT, s=Math.min(1,tt/(total*0.7));
      gtVib={L:Math.round(g.skL-(g.skL)*s), R:Math.round(g.skR+(COLS-g.skR)*s), p:0.5+0.4*s};
      if(key==='glitch'){
        if(gtT%8===0 && gtTposers.length<6) gtTposers.push({x:Math.round(Math.random()*(COLS-6))});
        if(gtT%12===0 && gtHovers.length<4) gtHovers.push({x:Math.round(Math.random()*(COLS-5)), lift:0, ph:gtHovers.length});
      } else {
        gtRiverClimb=Math.min(streetRow-2,(streetRow-2)*Math.min(1,f/0.7));
        if(!gtDog) gtDog={x:Math.round(COLS*0.45), y:streetRow-1, phase:'fall'};
        if(gtDog.phase==='fall'){ gtDog.y+=0.5; if(gtDog.y>=ROWS){ const c=Math.round(COLS*0.2+Math.random()*COLS*0.2); let t=streetRow; for(let k=c;k<c+5;k++) t=Math.min(t,gtColTop(Math.min(COLS-1,k))); gtDog={x:c, y:t-1, phase:'roof'}; gtText("?",c+2,t-3,'gtpoints',20); } }
      }
      for(const h of gtHovers) h.lift=Math.min(3,h.lift+0.08);
    }else if(key==='jetpack'){
      gtArt='jet';
      if(gtT===0){ gtBanner="ACHIEVEMENT UNLOCKED: JETPACK"; gtTposers=[]; gtHovers=[]; gtDog=null; }
      gtY=Math.max(4,gtY-0.6); gtX=Math.min(COLS*0.5,gtX+0.3);
      for(let k=0;k<2;k++) gtParts.push({x:gtX-2+Math.random(),y:gtY+1,vx:(Math.random()-0.5)*0.4,vy:0.4,g:0,ch:"*",mode:'fire',life:6});
    }else if(key==='whip'){
      gtBanner=null; gtArt='jet'; gtVib=null;
      const t=gtT;
      gtX=cx+Math.sin(t*0.07)*COLS*0.38; gtY=5+Math.abs(Math.sin(t*0.11))*(streetRow*0.35);
      // everything on the chain smashes through whatever it swings into
      for(const p of gtChainPositions()){
        const iw=p.it.art[0].length, ih=p.it.art.length, l=Math.round(p.x-iw/2)-1, tp=Math.round(p.y)-ih;
        for(let r=Math.max(0,tp);r<=Math.min(streetRow-1,Math.round(p.y)+1);r++) for(let c=Math.max(0,l);c<=Math.min(COLS-1,l+iw+1);c++){
          if(cityGridArr[r][c]!==" "){ if(Math.random()<0.15) gtParts.push({x:c,y:r,vx:(Math.random()-0.5)*1.2,vy:-0.4,g:0.05,ch:cityGridArr[r][c],mode:'rubble',life:22}); setCh(cityGridArr,r,c," "); gtMG[r][c]=null; }
        }
      }
      if(gtT%14===7) gtText(["+50 WRECKING BALL","+75 INFRASTRUCTURE","+20 BIN","+200 BUS COMBO"][(Math.random()*4)|0],gtX,gtY-6,'gtpoints',18);
      for(let k=0;k<2;k++) gtParts.push({x:gtX-2+Math.random(),y:gtY+1,vx:(Math.random()-0.5)*0.4,vy:0.4,g:0,ch:"*",mode:'fire',life:6});
    }else if(key==='peak'){
      const ty=2+GT_ARTS.front.length-1;
      if(f<0.4){ gtArt='jet'; gtX+=(g.hall-gtX)*0.12; gtY+=(ty-gtY)*0.12; }
      else { gtX=g.hall; gtY=ty; gtArt=(f>0.62&&f<0.68)?'blink':'front'; }
    }else if(key==='drop'){
      const roof=g.hallTop-1, impact=0.6;
      if(f<impact){ gtArt='head'; gtX=g.hall; const e=Math.pow(f/impact,2); gtY=(2+3)+(roof-(2+3))*e; }
      else if(!gtHidden){
        gtHidden=true; gtShakeAmp=20; gtText("KABOOM",g.hall,roof-4,'gtpoints',30);
        flash.style.transition="opacity 0.03s"; flash.style.opacity=0.7;
        setTimeout(()=>{ flash.style.transition="opacity 0.7s"; flash.style.opacity=0; },70);
        for(let k=0;k<30;k++){ const a=Math.random()*Math.PI*2; gtParts.push({x:g.hall,y:roof,vx:Math.cos(a)*1.5,vy:Math.sin(a)*0.8,g:0.03,ch:"#",mode:'rubble',life:20}); }
      }
    }else if(key==='sky'){
      interval=110;                                                     // slow motion
      if(gtT===0){
        // every building lifts off in one piece, each on its own slow, tumbling arc
        gtProps=[]; gtChain=[]; gtVib=null; gtRiverClimb=0;
        let c=0;
        while(c<COLS){
          const w=4+((Math.random()*4)|0), vx=((c+w/2)-g.hall)/COLS*0.5+(Math.random()-0.5)*0.2, vy=-0.25-Math.random()*0.35, spin=(Math.random()-0.5)*0.08;
          for(let r=0;r<streetRow;r++) for(let cc=c;cc<Math.min(COLS,c+w);cc++){
            const ch=cityGridArr[r][cc]; if(ch===" ") continue;
            gtParts.push({x:cc,y:r,vx:vx+spin*(r-streetRow/2),vy:vy+spin*(cc-c-w/2),g:-0.004,ch,mode:gtMG[r][cc]||'city',life:400});
          }
          c+=w;
        }
        for(let r=0;r<streetRow;r++){ cityGridArr[r]=" ".repeat(COLS); gtMG[r].fill(null); }
      }
    }else if(key==='settle'){
      interval=110;
      if(gtT%2===0) gtParts.push({x:Math.random()*COLS,y:streetRow-1,vx:(Math.random()-0.5)*0.3,vy:-0.08,g:0,ch:Math.random()<0.5?".":"'",mode:'gtdust',life:30});
    }else if(key==='land'){
      gtHidden=false; gtArt='side'; gtChain=['bus']; gtFixedTrail=true;
      gtX=cx; const e=Math.min(1,f/0.4); gtY=Math.round(2+((streetRow-1)-2)*e*e);
      if(gtT===Math.round(dur*0.4)) gtText("thud",gtX,streetRow-6,'gtclang',16);
      if(f>0.45) gtArt=(gtT>>2)%2?'chew':'side';
    }else if(key==='bus'){
      gtArt=(gtT>>2)%2?'chew':'side';
    }

    gtRecord();
    gtShake();
    gtStepFx();
    gtRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#f0ece4"; sub.style.textShadow="0 0 8px #3a7a3a";
    gtT++;
    if(gtT>=dur){ gtT=0; gtIdx++; if(gtIdx>=GT_BEATS.length){ phase='gt_hold'; } }
    timer=setTimeout(loop,interval);
  }else if(phase==='gt_hold'){
    stage.style.transform="";
    gtArt=(gtT>>2)%2?'chew':'side'; gtT++;
    gtStepFx();
    gtBanner="CITY DELETED. +1,000,000 POINTS.";
    gtRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=GT_HOLD; sub.style.color="#f0ece4"; sub.style.textShadow="0 0 8px #3a7a3a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m82_start(){
  attackMode='gt_run';
  cmd.style.color="#f0ece4"; cmd.style.textShadow="0 0 20px #3a7a3a";
  gtStarted=false; phase='gt_run';
}

function __m82_reset(){
  gtStarted=false; gtT=0; gtIdx=0; gtX=0; gtY=0; gtArt='side'; gtHidden=false; gtTongue=false;
  gtG=null; gtMG=null; gtProps=[]; gtChain=[]; gtTrail=[]; gtParts=[]; gtTexts=[]; gtShakeAmp=0;
  gtPetrol=null; gtVib=null; gtTposers=[]; gtHovers=[]; gtDog=null; gtRiverClimb=0; gtBanner=null; gtFixedTrail=false;
  stage.style.transform="";
}

registerMethod(82, { start: __m82_start, resetFn: __m82_reset, loopFn: __m82_loop, phaseNames: ['gt_run','gt_hold'] });
