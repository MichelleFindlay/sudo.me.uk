let pgStarted=false, pgT=0, pgIdx=0, pgX=0, pgScale=1, pgHop=0, pgStepT=0, pgStomps=0, pgNootT=0, pgShakeAmp=0;
let pgSegs=[], pgParts=[], pgSnow=[], pgRubble=[], pgRubbleCh=[], pgFish=null, pgDomino=null;

// ---- PINGU: a small penguin eats a very unusual fish ----
// five stages on one beat list (calm / growth / stomp / collapse / end); the shake is our own
// stage transform rather than the shared .shake class, so it can get harder with every stomp
const PG_BEATS=[
  {key:'waddle',  cap:"A QUIET DAY IN THE CITY. A SMALL PENGUIN WADDLES IN FROM THE LEFT."},
  {key:'hello',   cap:"IT'S PINGU.", bubble:"NOOT NOOT!"},
  {key:'fish',    cap:"PINGU FINDS A FISH. PINGU EATS THE FISH."},
  {key:'grow',    cap:"IT WAS NOT AN ORDINARY FISH."},
  {key:'stomp',   cap:"PINGU IS NOW VERY LARGE, AND VERY EXCITED"},
  {key:'stomp',   cap:"EVERY STEP LANDS ON A BUILDING"},
  {key:'domino',  cap:"THE REST OF THE SKYLINE GOES DOWN LIKE DOMINOES"},
  {key:'domino',  cap:"EACH STOMP SHAKES THE GROUND HARDER THAN THE LAST"},
  {key:'sit',     cap:"PINGU SITS ON THE RUBBLE, LOOKING VERY PLEASED WITH HIMSELF", bubble:"NOOT NOOT!"},
  {key:'tinyfish',cap:"THEN A TINY FISH FLOPS PAST."},
  {key:'chase',   cap:"PINGU WADDLES OFF AFTER IT."}
];
const PG_HOLD="THE CITY IS FLAT. SOMEWHERE OVER THE HORIZON: NOOT NOOT. — press RESET";

const pgWalkArts=[
  ["  .##.  "," #o##o# "," ##==## ","#(::::)#","/(::::)\\"," (::::) ","  =  =  "],
  ["  .##.  "," #o##o# "," ##==## ","#(::::)#","/(::::)\\"," (::::) "," =    = "]
];
const pgNootArt=["  .##.  "," #o##o# "," ##<>## ","#(::::)#","\\(::::)/"," (::::) ","  =  =  "];
const pgSitArt=["  .##.  "," #^##^# "," ##<>## ","#(::::)#","/(::::)\\","=(::::)="];
const pgFishArt=["><>"];
const PG_SKY="#2a4060";

function pgDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function pgMaxScale(){ return Math.max(1,Math.min(5,Math.floor((streetRow-2)*0.8/pgWalkArts[0].length))); }
function pgScaleArt(art,s){
  if(s<=1) return art;
  const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out;
}
function pgPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function pgColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function pgCrush(c0,c1){
  // flatten these columns where they stand: a puff of dust and a line of rubble
  for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){
    const top=pgColTop(c); if(top>=streetRow) continue;
    for(let r=top;r<streetRow;r++){
      if(cityGridArr[r][c]!==" " && Math.random()<0.15) pgParts.push({x:c,y:r,vx:(Math.random()-0.5)*1.2,vy:-0.3-Math.random()*0.4,g:0.03,ch:"'",mode:'pgdust',life:18});
      setCh(cityGridArr,r,c," ");
    }
    pgRubble[c]=Math.random()<0.5?1:2; pgRubbleCh[c]=[0,1].map(()=>".,_#%"[(Math.random()*5)|0]).join("");
  }
}
function pgTopple(seg,dir){
  // a domino: every piece of the building tips over in the direction of the wave
  for(let c=seg.c0;c<=seg.c1;c++){
    for(let r=0;r<streetRow;r++){
      const ch=cityGridArr[r][c]; if(ch===" ") continue;
      if(Math.random()<0.55) pgParts.push({x:c,y:r,vx:dir*(0.4+Math.random()*0.9)*(1-r/streetRow+0.3),vy:-0.1,g:0.06,ch,mode:'city',life:26+Math.random()*12});
    }
  }
  pgCrush(seg.c0,seg.c1);
  for(let k=0;k<6;k++) pgParts.push({x:(seg.c0+seg.c1)/2+(Math.random()-0.5)*6,y:streetRow-1,vx:dir*Math.random(),vy:-0.25,g:0,ch:"o",mode:'pgdust',life:16});
  seg.down=true;
}
function pgFindSegments(){
  const out=[]; let c=0;
  while(c<COLS){
    if(pgColTop(c)>=streetRow){ c++; continue; }
    let e=c; while(e+1<COLS && pgColTop(e+1)<streetRow) e++;
    const n=Math.max(1,Math.round((e-c+1)/7)), w=(e-c+1)/n;
    for(let k=0;k<n;k++) out.push({c0:Math.round(c+k*w), c1:Math.round(c+(k+1)*w)-1, down:false});
    c=e+1;
  }
  return out;
}

function pgInit(){
  pgStarted=true; pgT=0; pgIdx=0; pgX=-6; pgScale=1; pgHop=0; pgStepT=0; pgStomps=0; pgNootT=0; pgShakeAmp=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  // a little bare pavement on the left for him to arrive on and grow from
  const w=pgWalkArts[0][0].length*pgMaxScale();
  for(let r=0;r<streetRow;r++) for(let c=0;c<w+3;c++) setCh(cityGridArr,r,c," ");
  pgParts=[]; pgRubble=Array(COLS).fill(0); pgRubbleCh=Array(COLS).fill("");
  pgSnow=[]; for(let i=0;i<Math.round(COLS/6);i++) pgSnow.push({x:Math.random()*COLS,y:Math.random()*streetRow,v:0.15+Math.random()*0.25});
  pgFish=null; pgDomino=null; pgSegs=[];
  document.body.style.background=PG_SKY;
}
function pgWidth(){ return pgWalkArts[0][0].length*Math.max(1,Math.round(pgScale)); }

// one stomp cycle: lift, travel, land (crush + noot + shake), pause
function pgStompStep(travel){
  const P=14, lift=8, w=pgWidth(), stepLen=Math.max(4,Math.round(w*0.4));
  const ph=pgStepT%P;
  if(ph<lift){
    pgHop=Math.sin(Math.PI*ph/lift)*Math.max(1,Math.round(pgScale));
    if(travel) pgX=Math.min(COLS-w/2-2,pgX+stepLen/lift);
  } else if(ph===lift){
    pgHop=0; pgStomps++;
    pgCrush(Math.round(pgX-w/2),Math.round(pgX+w/2));
    for(let k=0;k<10;k++) pgParts.push({x:pgX+(Math.random()-0.5)*w,y:streetRow-1,vx:(Math.random()-0.5)*1.6,vy:-0.3-Math.random()*0.4,g:0.04,ch:"o",mode:'pgdust',life:16});
    pgNootT=9;
    pgShakeAmp=Math.min(16,3+pgStomps*1.4);
  }
  pgStepT++;
}
function pgApplyShake(){
  if(pgShakeAmp>0.3){
    stage.style.transform="translate("+((Math.random()-0.5)*2*pgShakeAmp).toFixed(1)+"px,"+((Math.random()-0.5)*2*pgShakeAmp).toFixed(1)+"px)";
    pgShakeAmp*=0.82;
  } else { stage.style.transform=""; pgShakeAmp=0; }
}

function pgRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  for(const s of pgSnow){
    s.y+=s.v; s.x+=Math.sin(s.y*0.3)*0.1; if(s.y>=streetRow){ s.y=0; s.x=Math.random()*COLS; }
    const r=Math.round(s.y), c=Math.round(s.x); if(grid[r] && grid[r][c]===" "){ setCh(grid,r,c,s.v>0.3?"*":"."); setMode(mg,r,c,'pgsnow'); }
  }
  for(let c=0;c<COLS;c++){
    const h=pgRubble[c]||0;
    for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,pgRubbleCh[c][k]); setMode(mg,streetRow-1-k,c,'rubble'); }
  }
  if(pgFish) pgPlace(grid,mg,pgFishArt,pgFish.x-1,streetRow-1-Math.round(pgFish.hop),'pgfish');
  // Pingu
  const s=Math.max(1,Math.round(pgScale));
  let art;
  if(beat && beat.key==='sit') art=pgSitArt;
  else if(pgNootT>0 || (beat && beat.bubble && f<0.85)) art=pgNootArt;
  else art=pgWalkArts[(pgStepT>>2)%2];
  art=pgScaleArt(art,s);
  const w=art[0].length, h=art.length, left=Math.round(pgX-w/2), top=streetRow-h-Math.round(pgHop);
  const here=beat!==null && left+w>0 && left<COLS;
  if(here) pgPlace(grid,mg,art,left,top,'pingu');
  const bubble=pgNootT>0?"NOOT NOOT!":(beat && beat.bubble && f<0.85?beat.bubble:null);
  if(bubble && here){
    const len=bubble.length+4, c0=Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(pgX)));
    mtDrawBubble(grid,mg,c0,top,bubble);
  }
  for(const p of pgParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  scene.innerHTML=paint(grid,mg,'city');
}
function pgStepParts(){
  for(const p of pgParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx*=0.5; p.vy=0; } }
  pgParts=pgParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<streetRow);
}

function __m78_loop(){
  if(phase==='pg_run'){
    if(!pgStarted) pgInit();
    const beat=PG_BEATS[pgIdx], dur=pgDur(beat.cap), f=pgT/Math.max(1,dur-1);
    const w0=pgWalkArts[0][0].length, startX=Math.ceil(w0*pgMaxScale()/2)+1;

    if(beat.key==='waddle'){
      pgX=-6+(startX+6)*Math.min(1,f/0.8); pgStepT++;
    }else if(beat.key==='hello'){
      // nothing moves; he says hello
    }else if(beat.key==='fish'){
      if(f<0.45){ pgFish={x:Math.round(pgX+6+(1-f/0.45)*6), hop:Math.abs(Math.sin(pgT*0.5))}; }
      else if(f<0.55){ pgFish={x:Math.round(pgX+2), hop:0}; }
      else { if(pgFish){ pgFish=null; pgNootT=6; } }
    }else if(beat.key==='grow'){
      const g=Math.min(1,f/0.7);
      pgScale=1+(pgMaxScale()-1)*g;
      if(f<0.75) pgShakeAmp=Math.max(pgShakeAmp,2+g*4);
      pgX=Math.max(pgX,Math.ceil(pgWidth()/2)+1);
      if(pgT===0) pgSegs=pgFindSegments();
    }else if(beat.key==='stomp'){
      pgScale=pgMaxScale();
      pgStompStep(true);
    }else if(beat.key==='domino'){
      pgStompStep(false);
      if(!pgDomino){
        const w=pgWidth();
        pgDomino={L:Math.round(pgX-w/2)-1, R:Math.round(pgX+w/2)+1, t:0};
      }
      const d=pgDomino; d.t++;
      for(const s of pgSegs) if(!s.down){ let any=false; for(let c=s.c0;c<=s.c1;c++) if(pgColTop(c)<streetRow){ any=true; break; } if(!any) s.down=true; }
      if(d.t%5===0){
        // the next building out on each side tips over away from him
        const right=pgSegs.filter(s=>!s.down && s.c0>=d.R).sort((a,b)=>a.c0-b.c0)[0];
        const left=pgSegs.filter(s=>!s.down && s.c1<=d.L).sort((a,b)=>b.c1-a.c1)[0];
        if(right){ pgTopple(right,1); d.R=right.c1+1; }
        if(left){ pgTopple(left,-1); d.L=left.c0-1; }
      }
      if(pgIdx===PG_BEATS.length-4 && pgT===dur-1){                     // anything left falls too
        for(const s of pgSegs) if(!s.down) pgTopple(s,s.c0>pgX?1:-1);
        pgCrush(0,COLS-1);
      }
    }else if(beat.key==='sit'){
      pgHop=0; pgNootT=0;
    }else if(beat.key==='tinyfish'){
      const fx=Math.round(COLS-2-(COLS-2-(pgX+pgWidth()/2+6))*Math.min(1,f/0.6));
      pgFish={x:fx, hop:Math.abs(Math.sin(pgT*0.5))*1.5};
    }else if(beat.key==='chase'){
      // fast enough to cross any screen within the caption; the beat also waits
      // (below) until he is fully off the right edge before the ending
      const sp=Math.max(1.2,(COLS+pgWidth())/(dur*0.8));
      pgFish.x+=sp; pgFish.hop=Math.abs(Math.sin(pgT*0.5))*1.5;
      if(f>0.15){ pgX+=sp; pgStepT++; pgHop=((pgStepT>>2)%2)*Math.max(1,Math.round(pgScale)/2); }
    }

    if(pgNootT>0) pgNootT--;
    pgApplyShake();
    pgStepParts();
    pgRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#e8f0ff"; sub.style.textShadow="0 0 8px #ff8a1a";
    pgT++;
    const offscreen=pgX-pgWidth()/2>=COLS;
    if(pgT>=dur && (beat.key!=='chase' || offscreen)){ pgT=0; pgIdx++; if(pgIdx>=PG_BEATS.length){ phase='pg_hold'; pgFish=null; } }
    timer=setTimeout(loop,80);
  }else if(phase==='pg_hold'){
    stage.style.transform="";
    pgStepParts();
    pgRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=PG_HOLD; sub.style.color="#e8f0ff"; sub.style.textShadow="0 0 8px #ff8a1a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m78_start(){
  attackMode='pg_run';
  cmd.style.color="#e8f0ff"; cmd.style.textShadow="0 0 20px #ff8a1a";
  pgStarted=false; phase='pg_run';
}

function __m78_reset(){
  pgStarted=false; pgT=0; pgIdx=0; pgX=0; pgScale=1; pgHop=0; pgStepT=0; pgStomps=0; pgNootT=0; pgShakeAmp=0;
  pgSegs=[]; pgParts=[]; pgSnow=[]; pgRubble=[]; pgRubbleCh=[]; pgFish=null; pgDomino=null;
  stage.style.transform="";
}

registerMethod(78, { start: __m78_start, resetFn: __m78_reset, loopFn: __m78_loop, phaseNames: ['pg_run','pg_hold'] });
