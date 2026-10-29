let tkStarted=false, tkT=0, tkIdx=0, tkG=null, tkY=-12, tkPeople=[], tkCars=[], tkParts=[], tkTexts=[];
let tkLanded=false, tkCloud=null, tkRing=0, tkCrater=false, tkPop=null, tkShake=0, tkWhite=false, tkStare=0;

// ---- TANK ENGINE, INCOMING ----
// a blue dot at the top of the sky becomes a nose-down tank engine with stabiliser fins;
// he lands on the town square, there's a beat of silence and a white-out, then a mushroom
// cloud (with his face in it), a shockwave ring that flattens everything, and a crater
// with a circular track laid neatly around the rim
const TK_BEATS=[
  {key:'est',      cap:"THE PEACEFUL CITY AT MIDDAY. BLUE SKY, BUSY STREETS, NOTHING UNUSUAL."},
  {key:'faint',    cap:"SOMEWHERE HIGH ABOVE, VERY FAINTLY, THERE IS THE SOUND OF A TRAIN WHISTLE."},
  {key:'look',     cap:"A MAN WAITING FOR A BUS GLANCES UP, AND SQUINTS AT A TINY BLUE DOT FAR UP IN THE SKY."},
  {key:'nudge',    cap:"HE NUDGES THE PERSON NEXT TO HIM. NOW THEY'RE BOTH SQUINTING."},
  {key:'louder',   cap:"THE WHISTLE GETS LOUDER, DOPPLER-SHIFTING DOWNWARD LIKE A FALLING BOMB."},
  {key:'stare',    cap:"MORE PEOPLE LOOK UP. THEN THE TRAFFIC STOPS. THEN THE WHOLE CITY IS STARING AT THE SKY."},
  {key:'visible',  cap:"HE'S VISIBLE NOW. IT'S THOMAS, FALLING NOSE-FIRST LIKE A BOMB, WITH LITTLE STABILISER FINS WELDED TO HIS CAB."},
  {key:'serene',   cap:"HIS FACE IS TURNED TOWARD THE CITY, SMILING WITH COMPLETE SERENITY."},
  {key:'theme',    cap:"HIS JAUNTY THEME TUNE STARTS PLAYING FROM NOWHERE, GETTING LOUDER AS HE FALLS."},
  {key:'run',      cap:"A FEW PEDESTRIANS START TO RUN. A FEW OTHERS JUST STAND THERE, HUMMING ALONG."},
  {key:'approach', cap:"FINAL APPROACH. WHEELS SPINNING IN MID-AIR, SMOKE STREAMING FROM HIS FUNNEL IN A LONG VAPOUR TRAIL."},
  {key:'eyes',     cap:"THE WHISTLE IS NOW AN EAR-SPLITTING SHRIEK. HIS EYES MEET THE CAMERA."},
  {key:'impact',   cap:"HE LANDS DEAD CENTRE ON THE TOWN SQUARE."},
  {key:'flash',    cap:"A SINGLE BEAT OF TOTAL SILENCE. THEN A BLINDING WHITE FLASH WIPES OUT THE SCREEN."},
  {key:'cloud',    cap:"A TOWERING MUSHROOM CLOUD RISES OVER THE CITY."},
  {key:'shock',    cap:"THE SHOCKWAVE ROLLS OUTWARDS, FLATTENING EVERY BUILDING IN A PERFECT RING."},
  {key:'face',     cap:"AT THE TOP OF THE CLOUD, SCULPTED IN SMOKE, IS THOMAS'S SMILING FACE, LOOKING DOWN ON WHAT HE'S DONE."},
  {key:'drift',    cap:"THE SMOKE SLOWLY DRIFTS AWAY."},
  {key:'crater',   cap:"THE CITY IS GONE. THERE'S A CRATER, AND A PERFECTLY CIRCULAR TRACK NEATLY LAID AROUND THE RIM."},
  {key:'popup',    cap:"AT THE BOTTOM OF THE CRATER, A LITTLE SOOTY BLUE ENGINE POPS UP FROM THE DUST, COMPLETELY UNHARMED."},
  {key:'toot',     cap:"HE GIVES ONE CHEERFUL TOOT. THE THEME TUNE ENDS ON ITS FINAL, JAUNTY NOTE."}
];
const TK_HOLD="PEEP PEEP. — press RESET";
const TK_ORDER=['est','faint','look','nudge','louder','stare','visible','serene','theme','run','approach','eyes','impact'];

// nose-down, fins at the top, face at the bottom looking at the city
const tkBomb=[
  "/\\      /\\",
  "|\\______/|",
  " |[]  1 | ",
  "O|======|O",
  " |======|=",
  "O|______|O",
  "  .----.  ",
  " ( o  o ) ",
  "  ( \\_/ ) ",
  "   '--'   "
];
const tkMiniArts=[["."],["o"],[" ^ ","(o)"],["/\\ /\\","|[1]|","(o o)"]];
const tkFaceSmoke=["  .---------.  "," /   O   O   \\ ","|      _      |"," \\   \\___/   / ","  '---------'  "];
const tkLittle=[" _[]_n  ","|_1__|(u)","(o)(o)   "];

function tkDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function tkPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function tkText(s,x,y,mode,life){ tkTexts.push({s,x,y,mode:mode||'tktext',life:life||20}); }
function tkColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function tkBeatStart(key){ let s=0; for(const b of TK_BEATS){ if(b.key===key) return s; s+=tkDur(b.cap); } return s; }

function tkInit(){
  tkStarted=true; tkT=0; tkIdx=0; tkY=-12;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  // the town square in the middle; the bus stop off to its left
  const sq=Math.max(9,Math.round(COLS*0.07)), stop=Math.max(8,cx-sq-8);
  for(let r=0;r<streetRow;r++) for(let c=cx-sq;c<=cx+sq;c++) setCh(cityGridArr,r,c," ");
  for(let r=0;r<streetRow;r++) for(let c=stop-7;c<=stop+6;c++) setCh(cityGridArr,r,c," ");
  tkG={sq, stop, Rc:Math.max(12,Math.round(COLS*0.2))};
  tkPeople=[{x:stop, look:false, kind:'man'},{x:stop+3, look:false, kind:'friend'}];
  for(let i=0;i<Math.max(4,Math.round(COLS/16));i++) tkPeople.push({x:Math.random()*(COLS-3), look:false, kind:'walker', d:Math.random()<0.5?-1:1});
  tkCars=[0.15,0.4,0.62,0.85].map(f=>({x:COLS*f, v:0.5}));
  tkParts=[]; tkTexts=[]; tkLanded=false; tkCloud=null; tkRing=0; tkCrater=false; tkPop=null; tkShake=0; tkWhite=false; tkStare=0;
  document.body.style.background="#2a5aa0";
}

// his fall is one continuous function of time across all the falling beats: a dot far up
// to begin with, then the full engine accelerating onto the square at the end of 'impact'
function tkFall(){
  const start=tkBeatStart('faint'), impact=tkBeatStart('impact')+Math.round(tkDur(TK_BEATS.find(b=>b.key==='impact').cap)*0.3);
  let t=0; for(let i=0;i<tkIdx;i++) t+=tkDur(TK_BEATS[i].cap); t+=tkT;
  const p=Math.max(0,Math.min(1,(t-start)/(impact-start)));
  const groundTop=streetRow-tkBomb.length;
  // nearly all the visible descent happens in the last half: bombs fall fast
  const vis=Math.max(0,(p-0.45)/0.55);
  return {p, y:-tkBomb.length+(groundTop+tkBomb.length)*vis*vis, stage:p<0.12?0:(p<0.25?1:(p<0.35?2:(p<0.45?3:4)))};
}

function tkRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=tkG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  // the square
  if(!tkLanded) for(let c=cx-g.sq;c<=cx+g.sq;c++){ setCh(grid,streetRow-1,c,"_"); setMode(mg,streetRow-1,c,'tksquare'); }
  if(!tkLanded) tkPlace(grid,mg,["[BUS]","  |  ","  |  "],g.stop-6,streetRow-4,'tksign');
  // people and cars
  if(!tkLanded) for(const P of tkPeople){
    const art=P.run?["\\o/"," | ","/ \\"]:[" o ","/|\\","/ \\"];
    tkPlace(grid,mg,art,P.x,streetRow-3,'body');
    if(P.look) tkPlace(grid,mg,["^"],P.x+1,streetRow-4,'tktext');
  }
  if(!tkLanded) for(const C of tkCars) tkPlace(grid,mg,["o=o"],C.x,streetRow-1,'car');
  // faces in windows as the city stares up
  if(!tkLanded && tkStare>0) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if((ch==="."||ch===":") && ((r*13+c*7)%10)<tkStare*10){ setCh(grid,r,c,"o"); setMode(mg,r,c,'tkwindow'); } }
  // the falling engine
  if(!tkLanded && TK_ORDER.includes(key) && key!=='est'){
    const F=tkFall(), x=cx;
    if(F.stage<4){ const art=tkMiniArts[F.stage]; tkPlace(grid,mg,art,x-Math.floor(art[0].length/2),1+F.stage,'tkbody'); }
    else {
      const wheels=(tkT>>1)%2;
      const art=tkBomb.map(r=>wheels?r.replace(/O/g,"o"):r);
      for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){
        const ch=art[i][j]; if(ch===" ") continue;
        const r=Math.round(F.y)+i, c=x-5+j; if(r<0||r>=ROWS||c<0||c>=COLS) continue;
        setCh(grid,r,c,ch);
        setMode(mg,r,c,i>=6?'tkface':(ch==="O"||ch==="o"?'tkwheel':(ch==="1"?'tknum':(ch==="["||ch==="]"?'tkwin':(i===0?'tkfin':'tkbody')))));
      }
      if(key==='eyes') tkPlace(grid,mg,["( O  O )"],x-4,Math.round(F.y)+7,'tkface');
    }
  }
  // the mushroom cloud: a stem, and a cap that grows; Thomas's face sculpted into it later
  if(tkCloud){
    const C=tkCloud, top=streetRow-1-Math.round(C.stem);
    for(let r=top;r<streetRow;r++) for(let c=cx-3;c<=cx+3;c++){ if(Math.random()<C.fade){ setCh(grid,r,c,"%#@"[(r+c+tkT)%3]); setMode(mg,r,c,r>streetRow-4?'tkfire':'tksmoke'); } }
    for(let r=Math.max(0,top-Math.round(C.ry));r<=top+Math.round(C.ry*0.5);r++) for(let c=Math.max(0,Math.round(cx+C.dx-C.rx));c<=Math.min(COLS-1,Math.round(cx+C.dx+C.rx));c++){
      const ux=(c-cx-C.dx)/C.rx, uy=(r-top)/C.ry, d=ux*ux+uy*uy; if(d>1||Math.random()>C.fade) continue;
      setCh(grid,r,c,"@Oo%"[(r*3+c+tkT)%4]); setMode(mg,r,c,d<0.35&&C.hot?'tkfire':'tksmoke');
    }
    if(C.face) tkPlace(grid,mg,tkFaceSmoke.map(row=>row.split("").map(ch=>Math.random()<C.fade?ch:" ").join("")),Math.round(cx+C.dx-tkFaceSmoke[0].length/2),top-Math.round(C.ry*0.6),'tkfacesmoke');
  }
  // the shockwave front, rolling outwards both ways
  if(tkRing>0 && tkRing<Math.max(cx,COLS-cx)+3) for(const s of [-1,1]){ const c=Math.round(cx+s*tkRing); for(let r=streetRow-6;r<streetRow;r++){ setCh(grid,r,c,s<0?"(":")"); setMode(mg,r,c,'tkring'); } }
  // the crater, and the circular track laid round its rim (drawn as a flattened ellipse)
  if(tkCrater){
    const R=g.Rc;
    for(let k=0;k<4;k++){ const w=Math.round(R*(1-k/5)); for(let c=cx-w;c<=cx+w;c++){ setCh(grid,streetRow+k,c," "); } }
    for(const s of [-1,1]) for(let k=0;k<2;k++){ setCh(grid,streetRow-1+k,cx+s*(R+1+k),"^"); setMode(mg,streetRow-1+k,cx+s*(R+1+k),'rubble'); }
    for(let k=0;k<5;k++){ const w=Math.round(R*(1-(k+1)/5)); for(const s of [-1,1]){ const c=cx+s*(w+1); setCh(grid,streetRow+k,c,s<0?"\\":"/"); setMode(mg,streetRow+k,c,'rubble'); } }
    for(let a=0;a<360;a+=2){
      const t=a*Math.PI/180, c=Math.round(cx+(R+4)*Math.cos(t)), r=Math.round(streetRow-1+2*Math.sin(t));
      if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,(a%12===0)?"+":"="); setMode(mg,r,c,'tkrail');
    }
  }
  if(tkPop) tkPlace(grid,mg,tkLittle,cx-4,Math.round(tkPop.y),'tksooty');
  for(const p of tkParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of tkTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function tkStepFx(){
  for(const p of tkParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  tkParts=tkParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of tkTexts){ t.life--; if(t.vy) t.y+=t.vy; else if(t.life%3===0) t.y--; }
  tkTexts=tkTexts.filter(t=>t.life>0);
}
function tkNote(x,y){ tkParts.push({x,y,vx:(Math.random()-0.5)*0.3,vy:-0.2,g:0,ch:Math.random()<0.5?"\u266a":"\u266b",mode:'tknote',life:22}); }

function __m86_loop(){
  if(phase==='tk_run'){
    if(!tkStarted) tkInit();
    const beat=TK_BEATS[tkIdx], dur=tkDur(beat.cap), f=tkT/Math.max(1,dur-1), key=beat.key, g=tkG;
    const traffic=!['stare','visible','serene','theme','run','approach','eyes','impact'].includes(key);
    if(!tkLanded){
      for(const P of tkPeople) if(P.kind==='walker' && !P.look){ P.x+=P.d*0.25; if(P.x<1||P.x>COLS-4) P.d=-P.d; }
      for(const P of tkPeople) if(P.run){ P.x+=P.x<cx?-1:1; }
      if(traffic) for(const C of tkCars){ C.x+=C.v; if(C.x>COLS) C.x=-3; }
    }

    if(key==='faint' && tkT%16===8) tkText("peep",cx,1,'tkfaint',14);
    else if(key==='look'){ tkPeople[0].look=true; if(tkT%14===4) tkText("?",g.stop+1,streetRow-6,'tktext',12); }
    else if(key==='nudge'){ if(f>0.3) tkPeople[1].look=true; if(tkT===Math.round(dur*0.3)) tkText("*nudge*",g.stop+2,streetRow-6,'tktext',18); }
    else if(key==='louder'){ if(tkT%10===0){ const s=["peeeEEEEE","EEEEEEEEoo","ooooowwww","owwwwwwww"][Math.min(3,tkT/10|0)]; tkText(s,cx,2+(tkT/10|0),'tktext',16); } }
    else if(key==='stare'){ tkStare=Math.min(1,f*1.2); tkPeople.forEach((P,i)=>{ if(f>i/tkPeople.length) P.look=true; }); }
    else if(key==='theme'||key==='run'||key==='approach'||key==='eyes'){
      const n=key==='theme'?1+Math.round(f*3):4;
      for(let k=0;k<n;k++) if(Math.random()<0.4) tkNote(Math.random()*COLS,streetRow-4-Math.random()*6);
      if(key==='run') tkPeople.forEach((P,i)=>{ if(i%2===0 && P.kind==='walker') P.run=true; if(i%2===1 && tkT%10===i) tkNote(P.x+1,streetRow-4); });
    }
    if(key==='approach'||key==='eyes'){
      const F=tkFall();
      for(let k=0;k<2;k++) tkParts.push({x:cx+5+Math.random(),y:F.y+4,vx:(Math.random()-0.5)*0.2,vy:-0.4,g:0,ch:"o",mode:'tksmoke',life:30});
      if(key==='eyes'){ tkShake=3; if(tkT%5===0) tkText("EEEEEEEEEEEEE",cx+(Math.random()-0.5)*20,F.y-2,'tkshriek',8); }
    }
    if(key==='impact'){
      const F=tkFall();
      if(F.p>=1 && !tkLanded){ tkLanded=true; tkShake=0; tkParts=[]; tkTexts=[]; }       // ...and nothing. Not a sound.
    }
    if(key==='flash'){
      if(f>0.3 && !tkWhite){ tkWhite=true; flash.style.transition="opacity 0.05s"; flash.style.opacity=1; }
      if(f>0.85){ flash.style.transition="opacity 1.2s"; flash.style.opacity=0; }
      if(tkWhite && !tkCloud){
        tkCloud={stem:0, rx:2, ry:1, dx:0, fade:1, face:false, hot:true};
        for(let r=0;r<streetRow;r++) for(let c=cx-g.sq;c<=cx+g.sq;c++) setCh(cityGridArr,r,c," ");
      }
    }
    if(key==='cloud'){
      const C=tkCloud, e=Math.min(1,f/0.8);
      C.stem=streetRow*0.55*e; C.rx=2+(COLS*0.22)*e; C.ry=1+streetRow*0.15*e;
      tkShake=Math.max(tkShake,4*(1-e));
      document.body.style.background="#6a3a20";
    }
    if(key==='shock'){
      const maxR=Math.max(cx,COLS-cx)+3, prev=tkRing;
      tkRing=maxR*Math.min(1,f/0.85);
      for(let c=0;c<COLS;c++){
        const d=Math.abs(c-cx); if(d>tkRing || d<=prev-1) continue;
        for(let r=0;r<streetRow;r++){ const ch=cityGridArr[r][c]; if(ch===" ") continue; if(Math.random()<0.12) tkParts.push({x:c,y:r,vx:(c<cx?-1:1)*(0.6+Math.random()),vy:-0.2,g:0.04,ch,mode:'rubble',life:18}); setCh(cityGridArr,r,c," "); }
      }
      tkShake=Math.max(tkShake,3);
      tkCloud.hot=f<0.5;
    }
    if(key==='face'){ tkCloud.face=true; tkCloud.hot=false; tkRing=0; document.body.style.background="#4a3a3a"; }
    if(key==='drift'){ tkCloud.fade=Math.max(0,1-f); tkCloud.dx+=0.3; document.body.style.background="#3a4a6a"; }
    if(key==='crater'){ tkCloud=null; tkCrater=true; document.body.style.background="#2a5aa0"; }
    if(key==='popup'){
      if(!tkPop) tkPop={y:streetRow+3};
      tkPop.y=Math.max(streetRow+3-tkLittle.length+1,streetRow+3-(f/0.3)*tkLittle.length);
      if(tkT===Math.round(dur*0.3)) for(let k=0;k<12;k++) tkParts.push({x:cx+(Math.random()-0.5)*8,y:streetRow,vx:(Math.random()-0.5)*0.6,vy:-0.3,g:0,ch:".",mode:'tksmoke',life:20});
    }
    if(key==='toot'){
      if(tkT===Math.round(dur*0.15)) tkText("toot!",cx+5,streetRow-2,'tktext',30);
      if(tkT===Math.round(dur*0.6)) tkText("\u266a",cx,streetRow-4,'tknote',40);
    }

    if(tkShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*tkShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*tkShake).toFixed(1)+"px)"; tkShake*=0.92; }
    else { stage.style.transform=""; tkShake=0; }
    tkStepFx();
    tkRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#6ab0ff"; sub.style.textShadow="0 0 8px #d02020";
    tkT++;
    if(tkT>=dur){ tkT=0; tkIdx++; if(tkIdx>=TK_BEATS.length){ phase='tk_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='tk_hold'){
    stage.style.transform="";
    tkStepFx(); tkT++;
    tkRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=TK_HOLD; sub.style.color="#6ab0ff"; sub.style.textShadow="0 0 8px #d02020";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m86_start(){
  attackMode='tk_run';
  cmd.style.color="#6ab0ff"; cmd.style.textShadow="0 0 20px #d02020";
  tkStarted=false; phase='tk_run';
}

function __m86_reset(){
  tkStarted=false; tkT=0; tkIdx=0; tkG=null; tkY=-12; tkPeople=[]; tkCars=[]; tkParts=[]; tkTexts=[];
  tkLanded=false; tkCloud=null; tkRing=0; tkCrater=false; tkPop=null; tkShake=0; tkWhite=false; tkStare=0;
  stage.style.transform="";
}

registerMethod(86, { start: __m86_start, resetFn: __m86_reset, loopFn: __m86_loop, phaseNames: ['tk_run','tk_hold'] });
