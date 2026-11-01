let bbStarted=false, bbT=0, bbIdx=0, bbG=null, bbX=-12, bbS=1, bbMouth=false, bbParts=[], bbTexts=[], bbCars=[], bbDogs=[];
let bbBig=null, bbShattered=false, bbBakery=true, bbBalloon=0, bbPigeon=true, bbPlugs=[], bbMic=0, bbEng=null, bbMount=0, bbMoonX=0, bbBirds=[], bbRiver=0, bbVolc=true, bbSplit=0, bbShake=0;

// ---- BRIAN BLESSED ----
// a very loud, very happy man walks into town. Volume is the only weapon: big pixel-font
// words, windows shattering, a distant mountain crumbling out of respect, and finally one
// word so loud the whole frame splits down the middle and drifts apart, still ringing
const BB_BEATS=[
  {key:'rumble',   cap:"IT STARTS AS A LOW RUMBLE FROM SOMEWHERE BEYOND THE HILLS."},
  {key:'alarms',   cap:"DOGS SIT UP. CAR ALARMS GO OFF ONE BY ONE, LIKE THEY'RE PASSING ON A WARNING."},
  {key:'horizon',  cap:"THEN A MAN APPEARS ON THE HORIZON. HE IS ENORMOUS. HE IS BEARDED. HE IS WEARING A CAPE FOR NO CLEAR REASON."},
  {key:'opens',    cap:"HE OPENS HIS MOUTH."},
  {key:'hello',    cap:"\"HELLO!\"", big:"HELLO!"},
  {key:'shatter',  cap:"EVERY WINDOW IN THE CITY SHATTERS AT ONCE."},
  {key:'baker',    cap:"HE STRIDES INTO TOWN, DELIGHTED BY EVERYTHING. HE GREETS THE BAKER. THE BAKER'S OVENS COLLAPSE.", say:"GOOD MORNING!"},
  {key:'balloon',  cap:"HE COMPLIMENTS A TODDLER'S BALLOON. THE BALLOON POPS, AS DOES THE TODDLER'S GRASP ON REALITY.", say:"WHAT A BALLOON!"},
  {key:'pigeon',   cap:"HE SAYS \"MARVELLOUS!\" TO A PIGEON. THE PIGEON IS NEVER SEEN AGAIN.", say:"MARVELLOUS!"},
  {key:'plugs',    cap:"PEOPLE TRY EARPLUGS. THE EARPLUGS FLEE."},
  {key:'mic',      cap:"AT THE TOWN FETE, HE FINDS A MICROPHONE AND TAPS IT TO CHECK IT'S WORKING."},
  {key:'engineer', cap:"THE SOUND ENGINEER IS BLOWN INTO THE NEXT COUNTY. THE MICROPHONE IS NOW A FINE POWDER."},
  {key:'story',    cap:"HE BEGINS A STORY, ABOUT THE TIME HE CLIMBED A MOUNTAIN.", say:"I WAS HALFWAY UP EVEREST--"},
  {key:'mountain', cap:"THE MOUNTAIN HE'S TALKING ABOUT, FORTY MILES AWAY, STARTS TO CRUMBLE OUT OF RESPECT."},
  {key:'birds',    cap:"BIRDS MIGRATE EARLY. RIVERS FLOW AWAY FROM HIM. THE MOON SHIFTS A FEW INCHES BACK IN ITS ORBIT."},
  {key:'laugh',    cap:"HE LAUGHS AT HIS OWN JOKE, AND THE LAUGH ROLLS ACROSS THE CONTINENT. VOLCANOES GO QUIET, OUTCLASSED."},
  {key:'breath',   cap:"OVERCOME WITH JOY AT THE SHEER WONDER OF EXISTENCE, HE TAKES THE DEEPEST BREATH EVER TAKEN BY A HUMAN BEING..."},
  {key:'magnif',   cap:"\"MAGNIFICENT!\"", big:"MAGNIFICENT!"},
  {key:'split',    cap:"THE EARTH SPLITS NEATLY IN HALF. BOTH HALVES DRIFT APART, STILL RINGING."},
  {key:'echo',     cap:"SOMEWHERE IN THE DEBRIS, A FAINT ECHO..."},
  {key:'silence',  cap:"THEN SILENCE. THE LOUDEST SILENCE THERE HAS EVER BEEN."}
];
const BB_HOLD="THE LOUDEST SILENCE THERE HAS EVER BEEN. — press RESET";

const bbManArt=["  .---.  "," ( o o ) "," (#####) ","/(#####)\\","||=====||","||     ||","|| | | ||","   | |   ","   / \\   "];
const bbManOpen=["  .---.  "," ( O O ) "," (##O##) ","/(#####)\\","||=====||","||     ||","|| | | ||","   | |   ","   / \\   "];
const BB_FONT={
  H:["#   #","#   #","#####","#   #","#   #"], E:["#####","#    ","#### ","#    ","#####"], L:["#    ","#    ","#    ","#    ","#####"],
  O:[" ### ","#   #","#   #","#   #"," ### "], "!":["#","#","#"," ","#"], M:["#   #","## ##","# # #","#   #","#   #"],
  A:[" ### ","#   #","#####","#   #","#   #"], G:[" ### ","#    ","# ###","#   #"," ### "], N:["#   #","##  #","# # #","#  ##","#   #"],
  I:["###"," # "," # "," # ","###"], F:["#####","#    ","#### ","#    ","#    "], C:[" ####","#    ","#    ","#    "," ####"], T:["#####","  #  ","  #  ","  #  ","  #  "]
};

function bbDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function bbScale(art,s){ if(s<=1) return art; const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out; }
function bbPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function bbText(s,x,y,mode,life){ bbTexts.push({s,x,y,mode:mode||'bbtext',life:life||20}); }
function bbBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function bbColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function bbWord(word){ const rows=["","","","",""]; for(const ch of word){ const gl=BB_FONT[ch]; for(let i=0;i<5;i++) rows[i]+=gl[i]+" "; } return rows; }
function bbClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++) setCh(cityGridArr,r,c," "); }

function bbInit(){
  bbStarted=true; bbT=0; bbIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const at=f=>Math.round(COLS*f);
  bbG={bakery:at(0.3), kid:at(0.42), pigeon:at(0.52), fete:at(0.66), river:at(0.84)};
  bbClear(bbG.bakery-1,bbG.bakery+8); bbClear(bbG.kid-2,bbG.kid+3); bbClear(bbG.fete-2,bbG.fete+12); bbClear(bbG.river-1,bbG.river+6);
  const top=streetRow-4, art=[" ______ ","|BAKERY|","|[]  []|","|______|"];
  for(let i=0;i<4;i++) for(let j=0;j<8;j++){ const ch=art[i][j]; if(ch!==" ") setCh(cityGridArr,top+i,bbG.bakery+j,ch); }
  bbX=-12; bbS=1; bbMouth=false; bbParts=[]; bbTexts=[];
  bbCars=[0.12,0.36,0.58,0.76].map(f=>({x:at(f), on:false})); bbDogs=[0.2,0.48,0.9].map(f=>({x:at(f), up:false}));
  bbBig=null; bbShattered=false; bbBakery=true; bbBalloon=0; bbPigeon=true; bbPlugs=[]; bbMic=0; bbEng=null; bbMount=0; bbMoonX=Math.round(COLS*0.12); bbBirds=[]; bbRiver=0; bbVolc=true; bbSplit=0; bbShake=0;
  document.body.style.background="#0c1020";
}

function bbRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=bbG, key=beat?beat.key:'hold';
  let grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  // far background: the moon, a mountain forty miles away, a volcano (only into empty sky)
  const sky=(art,left,top,mode,keep)=>{ for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){ const ch=art[i][j], r=top+i, c=left+j; if(ch===" "||r<0||r>=ROWS||c<0||c>=COLS||grid[r][c]!==" ") continue; if(keep && !keep(r,c)) continue; setCh(grid,r,c,ch); setMode(mg,r,c,mode); } };
  sky(["(  )"],Math.round(bbMoonX),2,'bbmoon');
  const mh=Math.max(5,Math.round(streetRow*0.35)), mx=Math.round(COLS*0.62), mart=[]; for(let k=0;k<mh;k++) mart.push(" ".repeat(mh-k-1)+"/"+(k?"^".repeat(k*2-1):"")+"\\");
  sky(mart,mx-mh,streetRow-mh-6,'bbmount',(r,c)=>((r*31+c*17)%100)>=bbMount*100);
  sky(["  /\\  "," /  \\ ","/____\\"],Math.round(COLS*0.86),streetRow-12,'bbvolc');
  if(bbVolc) for(let k=0;k<3;k++) sky([(bbT+k)%3?"~":"."],Math.round(COLS*0.86)+3+((bbT>>2)+k)%2,streetRow-13-k,'bbsmoke');
  // windows (until they're gone), cars, dogs, the bakery, the river
  if(bbShattered) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if(ch==="."||ch===":") setCh(grid,r,c," "); }
  for(let c=g.river;c<=g.river+5;c++){ setCh(grid,streetRow,c,bbRiver?((c+bbT)%4<2?">":"~"):((c+bbT)%4<2?"~":"\u2248")); setMode(mg,streetRow,c,'water'); }
  for(const C of bbCars) bbPlace(grid,mg,["o=o"],C.x,streetRow-1,C.on&&(bbT>>1)%2?'bbalarm':'car');
  for(const D of bbDogs) bbPlace(grid,mg,[D.up?" ^ ":"   ",D.up?"o_|":"o__"],D.x,streetRow-2,'bbdog');
  if(!bbBakery) for(let c=g.bakery;c<g.bakery+8;c++){ setCh(grid,streetRow-1,c,"#%.,"[(c*3)%4]); setMode(mg,streetRow-1,c,'rubble'); }
  // the toddler and the balloon, the pigeon, the fete
  if(bbBalloon<2){ bbPlace(grid,mg,["o","|","|"],g.kid+1,streetRow-7,'bbballoon'); }
  bbPlace(grid,mg,[" o ","/|\\"],g.kid,streetRow-2,'body');
  if(bbBalloon>=2 && key==='balloon') bbPlace(grid,mg,["?!"],g.kid,streetRow-4,'bbtext');
  if(bbPigeon) bbPlace(grid,mg,["o>"],g.pigeon,streetRow-1,'bbpigeon');
  bbPlace(grid,mg,["  /\\/\\/\\  "," / FETE \\ ","|________|"],g.fete,streetRow-3,'bbfete');
  if(bbMic<2) bbPlace(grid,mg,["O","|","|"],g.fete+10,streetRow-3,'bbmic');
  if(bbEng) bbPlace(grid,mg,["\\o/"],bbEng.x,bbEng.y,'body');
  for(const P of bbPlugs) bbPlace(grid,mg,["()"],P.x,P.y,'bbplug');
  for(const B of bbBirds) bbPlace(grid,mg,[(bbT>>1)%2?"v":"^"],B.x,B.y,'bbbird');
  // the man himself
  if(bbX>-20 && !['split','echo','silence','hold'].includes(key)){
    const art=bbScale(bbMouth?bbManOpen:bbManArt,bbS), h=art.length;
    bbPlace(grid,mg,art,bbX,streetRow-h,'bbman');
    if(beat && beat.say && f<0.9) bbBubble(grid,mg,bbX+art[0].length/2,streetRow-h,beat.say);
  }
  // the big words, filling the sky
  if(bbBig){
    // too wide for the screen? split the word over two lines
    let lines=[bbBig.w]; if(bbWord(bbBig.w)[0].length>COLS-2){ const h=Math.ceil(bbBig.w.length/2); lines=[bbBig.w.slice(0,h),bbBig.w.slice(h)]; }
    const widest=Math.max(...lines.map(w=>bbWord(w)[0].length)), s=Math.max(1,Math.min(3,Math.floor((COLS-2)/widest)));
    const jit=(bbT%2)?1:-1, top0=Math.max(6,Math.round(streetRow*0.2))+((bbT>>1)%2);
    lines.forEach((w,i)=>{ const art=bbScale(bbWord(w),s); bbPlace(grid,mg,art,Math.round(cx-art[0].length/2)+jit,top0+i*6*s,'bbbig'); });
  }
  for(const p of bbParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  // the Earth splits: the left half drifts left and up, the right half right and down
  if(bbSplit>0){
    const off=Math.round(bbSplit), dv=Math.min(4,Math.round(bbSplit/8)), crack=cx;
    const g2=Array.from({length:ROWS},()=>" ".repeat(COLS)), m2=modeGridFill(ROWS,COLS,'city');
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const ch=grid[r][c]; if(ch===" ") continue;
      const left=c<crack+Math.round(Math.sin(r*0.7)*2);
      const nc=left?c-off:c+off, nr=left?r-dv:r+dv;
      if(nc<0||nc>=COLS||nr<0||nr>=ROWS) continue;
      setCh(g2,nr,nc,ch); setMode(m2,nr,nc,mg[r][c]);
    }
    grid=g2; mg=m2;
  }
  for(const t of bbTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function bbStepFx(){
  for(const p of bbParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  bbParts=bbParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of bbTexts){ t.life--; if(t.life%3===0) t.y--; }
  bbTexts=bbTexts.filter(t=>t.life>0);
}
function bbStride(to,speed){ bbX+=Math.sign(to-bbX)*Math.min(Math.abs(to-bbX),speed); }

function __m94_loop(){
  if(phase==='bb_run'){
    if(!bbStarted) bbInit();
    const beat=BB_BEATS[bbIdx], dur=bbDur(beat.cap), f=bbT/Math.max(1,dur-1), key=beat.key, g=bbG;
    const manW=bbManArt[0].length*bbS;
    bbMouth=false; bbBig=null;

    if(key==='rumble'){ bbShake=1; if(bbT%12===0) bbText("rumble",4+Math.random()*10,streetRow-8,'bbtext',12); }
    if(key==='alarms'){ bbDogs.forEach(D=>D.up=true); bbCars.forEach((C,i)=>{ if(f>i/bbCars.length) C.on=true; }); if(bbT%8===0) bbText("weeoo",bbCars[Math.min(bbCars.length-1,Math.floor(f*bbCars.length))].x+1,streetRow-3,'bbalarm',10); bbShake=1; }
    // enormous, but never wider than a third of the screen
    if(key==='horizon'){ bbS=Math.max(1,Math.min(4,Math.floor((streetRow-2)*0.7/bbManArt.length),Math.floor(COLS*0.3/bbManArt[0].length))); bbStride(2,0.4); bbShake=0.5; }
    if(key==='opens'){ bbMouth=f>0.5; }
    if(key==='hello'){ bbMouth=true; bbBig={w:"HELLO!"}; bbShake=8; if(bbT===2){ flash.style.transition="opacity 0.03s"; flash.style.opacity=0.4; setTimeout(()=>{ flash.style.transition="opacity 0.5s"; flash.style.opacity=0; },60); } }
    if(key==='shatter' && !bbShattered){
      bbShattered=true; bbShake=5;
      for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=cityGridArr[r][c]; if((ch==="."||ch===":") && Math.random()<0.3) bbParts.push({x:c,y:r,vx:(Math.random()-0.5)*0.8,vy:-0.2,g:0.06,ch:Math.random()<0.5?"*":"'",mode:'bbglass',life:30}); }
      bbText("KSSSHHHH",cx,streetRow*0.4,'bbglass',30);
    }
    if(key==='baker'){ bbMouth=(bbT>>3)%2===0; bbStride(g.bakery-manW-1,0.6); if(f>0.6 && bbBakery){ bbBakery=false; bbClear(g.bakery,g.bakery+7); bbText("CLANG",g.bakery+4,streetRow-6,'bbtext',20); bbShake=3; } }
    if(key==='balloon'){ bbMouth=(bbT>>3)%2===0; bbStride(g.kid-manW-1,0.6); if(f>0.55 && bbBalloon<2){ bbBalloon=2; bbText("POP",g.kid+1,streetRow-8,'bbtext',20); } }
    if(key==='pigeon'){ bbMouth=(bbT>>3)%2===0; bbStride(g.pigeon-manW-1,0.6); if(f>0.5 && bbPigeon){ bbPigeon=false; bbParts.push({x:g.pigeon,y:streetRow-1,vx:1.6,vy:-1.4,g:0,ch:"o",mode:'bbpigeon',life:40}); } }
    if(key==='plugs'){ if(bbT%3===0 && bbPlugs.length<14) bbPlugs.push({x:bbX+manW+4+Math.random()*10,y:streetRow-2,v:0.8+Math.random()}); for(const P of bbPlugs) P.x+=P.v; bbPlugs=bbPlugs.filter(P=>P.x<COLS); if(bbT%10===0) bbText("nope",bbX+manW+12,streetRow-4,'bbtext',10); }
    if(key==='mic'){ bbPlugs=[]; bbStride(g.fete+10-manW-1,0.6); if(f>0.6 && bbT%8===0){ bbText("*TAP*",g.fete+10,streetRow-6,'bbtext',8); bbShake=2; } }
    if(key==='engineer'){ if(!bbEng){ bbEng={x:g.fete+11,y:streetRow-3}; bbMic=2; for(let k=0;k<20;k++) bbParts.push({x:g.fete+10,y:streetRow-3,vx:(Math.random()-0.5)*0.6,vy:-0.1,g:0.01,ch:".",mode:'bbdust',life:40}); bbText("THUMP",g.fete+10,streetRow-7,'bbtext',20); bbShake=6; } bbEng.x+=1.6; bbEng.y-=0.5; if(bbEng.x>COLS) bbEng=null; }
    if(key==='story'){ bbMouth=(bbT>>3)%2===0; bbShake=1; }
    if(key==='mountain'){ bbMouth=(bbT>>3)%2===0; bbMount=Math.min(1,f*1.1); if(bbT%3===0) bbParts.push({x:Math.round(COLS*0.62)+(Math.random()-0.5)*12,y:streetRow-8-Math.random()*6,vx:(Math.random()-0.5)*0.3,vy:0.3,g:0.03,ch:".",mode:'bbmount',life:24}); }
    if(key==='birds'){ if(bbT%3===0) bbBirds.push({x:Math.random()*COLS*0.6,y:3+Math.random()*5}); for(const B of bbBirds){ B.x+=0.9; B.y-=0.05; } bbBirds=bbBirds.filter(B=>B.x<COLS); bbRiver=1; bbMoonX=Math.round(COLS*0.12)-Math.round(f*4); }
    if(key==='laugh'){
      bbBirds=[]; bbMouth=(bbT>>2)%2===0; bbShake=4; bbVolc=f<0.6;
      if(bbT%5===0) bbTexts.push({s:"HA HA HA HA",x:bbX+manW+6,y:streetRow-6-((bbT/5)%4),mode:'bbbig',life:40,vx:1.5});
    }
    for(const t of bbTexts) if(t.vx) t.x+=t.vx;
    if(key==='breath'){ const Smax=Math.max(bbS,Math.min(5,Math.floor((streetRow-2)*0.95/bbManArt.length),Math.floor(COLS*0.36/bbManArt[0].length))); if(bbT%Math.max(1,Math.round(dur/4))===0 && bbS<Smax) bbS++; if(bbT%10===0) bbText("hhhhhhhhh",bbX+manW/2,streetRow-bbManArt.length*bbS-2,'bbtext',10); }
    if(key==='magnif'){ bbMouth=true; bbBig={w:"MAGNIFICENT!"}; bbShake=14; if(bbT===2){ flash.style.transition="opacity 0.03s"; flash.style.opacity=0.6; setTimeout(()=>{ flash.style.transition="opacity 0.6s"; flash.style.opacity=0; },80); } }
    if(key==='split'){ bbSplit=Math.min(COLS*0.45,bbSplit+Math.max(0.3,COLS*0.45/(dur*0.9))); bbShake=Math.max(2,6*(1-f)); if(bbT%8===0) bbText("~ RINNNG ~",cx,streetRow*0.5,'bbtext',8); document.body.style.background="#000000"; }
    if(key==='echo'){ bbShake=0; if(bbT===Math.round(dur*0.3)) bbTexts.push({s:"...WONDERFUL...",x:cx,y:streetRow*0.45,mode:'bbecho',life:Math.round(dur*0.6)}); }

    if(bbShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*bbShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*bbShake).toFixed(1)+"px)"; bbShake*=0.9; }
    else { stage.style.transform=""; bbShake=0; }
    bbStepFx();
    bbRender(beat,f);
    sub.textContent=beat.cap; sub.style.color=beat.big?"#ff4040":"#ffd890"; sub.style.textShadow="0 0 8px #a02020";
    bbT++;
    if(bbT>=dur){ bbT=0; bbIdx++; if(bbIdx>=BB_BEATS.length){ phase='bb_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='bb_hold'){
    stage.style.transform="";
    bbStepFx(); bbT++;
    bbRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=BB_HOLD; sub.style.color="#ffd890"; sub.style.textShadow="0 0 8px #a02020";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m94_start(){
  attackMode='bb_run';
  cmd.style.color="#ff4040"; cmd.style.textShadow="0 0 20px #ffd020";
  bbStarted=false; phase='bb_run';
}

function __m94_reset(){
  bbStarted=false; bbT=0; bbIdx=0; bbG=null; bbX=-12; bbS=1; bbMouth=false; bbParts=[]; bbTexts=[]; bbCars=[]; bbDogs=[];
  bbBig=null; bbShattered=false; bbBakery=true; bbBalloon=0; bbPigeon=true; bbPlugs=[]; bbMic=0; bbEng=null; bbMount=0; bbMoonX=0; bbBirds=[]; bbRiver=0; bbVolc=true; bbSplit=0; bbShake=0;
  stage.style.transform="";
}

registerMethod(94, { start: __m94_start, resetFn: __m94_reset, loopFn: __m94_loop, phaseNames: ['bb_run','bb_hold'] });
