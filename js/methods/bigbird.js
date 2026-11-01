let bgStarted=false, bgT=0, bgIdx=0, bgG=null, bgMG=null, bgX=-20, bgS=1, bgParts=[], bgTexts=[], bgFeather=null, bgKid=true, bgFriend=null;
let bgGone={}, bgCount=0, bgDrift=[], bgSat=false, bgBigWord=null, bgShake=0, bgDark=0, bgHurr=[];

// ---- BIG BIRD ----
// a very large, very friendly yellow bird walks into town to teach a lesson, growing with
// every step. Each landmark is stamped with its name and taken out by the lesson it's in
// (sharing, the letter B, counting to ten); then a woolly friend, a feather blizzard that
// buries everything, and one gentle sit-down in the stadium
const BG_BEATS=[
  {key:'feather', cap:"IT STARTS WITH A SINGLE YELLOW FEATHER DRIFTING DOWN ONTO A QUIET SUBURBAN STREET."},
  {key:'kid',     cap:"A CHILD PICKS IT UP. IT'S TALLER THAN SHE IS."},
  {key:'shadow',  cap:"THEN THE SHADOW FALLS OVER THE TOWN."},
  {key:'stride',  cap:"HE COMES STRIDING ROUND THE CORNER: EIGHT FEET TALL, THEN TWENTY, THEN FIFTY, GROWING WITH EVERY FRIENDLY STEP."},
  {key:'wave',    cap:"HE WAVES. THE WAVE KNOCKS DOWN A ROW OF TERRACED HOUSES. HE LOOKS GENUINELY SORRY ABOUT IT.", say:"OOPS. SORRY!"},
  {key:'help',    cap:"HE'S JUST HERE TO HELP. HE WANTS TO TEACH EVERYONE SOMETHING TODAY.", say:"HI, EVERYBODY!"},
  {key:'share',   cap:"AT THE PRIMARY SCHOOL HE TALKS ABOUT SHARING, LEANS IN TO SAY HELLO, AND SHARES THE ENTIRE ROOF WITH THE NEXT VILLAGE.", say:"SHARING IS CARING!"},
  {key:'letterb', cap:"HE TRIES TO EXPLAIN THE LETTER B.", say:"B IS FOR..."},
  {key:'bank',    cap:"HE DEMONSTRATES BY BUMPING INTO THE BANK...", target:'bank'},
  {key:'bridge',  cap:"...BOUNCING OFF THE BRIDGE...", target:'bridge'},
  {key:'bus',     cap:"...AND BRINGING DOWN THE BUS STATION. EVERYONE LEARNS A LOT.", target:'bus'},
  {key:'count',   cap:"HE COUNTS TO TEN. EACH NUMBER IS A STOMP. BY SEVEN, THE TOWN HALL IS A CAR PARK."},
  {key:'reason',  cap:"PEOPLE TRY TO REASON WITH HIM. HE LISTENS CAREFULLY, NODDING HIS HUGE HEAD. EACH NOD PRODUCES A SMALL HURRICANE."},
  {key:'words',   cap:"HE THANKS THEM FOR USING THEIR WORDS.", say:"THANK YOU FOR USING YOUR WORDS!"},
  {key:'sad',     cap:"THEN HE GETS A LITTLE SAD, BECAUSE NOBODY BELIEVES HIM ABOUT HIS IMAGINARY FRIEND.", say:"HE'S REAL, YOU KNOW..."},
  {key:'friend',  cap:"THE IMAGINARY FRIEND APPEARS. HE'S REAL. HE'S ENORMOUS. HE'S WOOLLY. HE'S VERY MUCH STEPPING ON THE CATHEDRAL."},
  {key:'blizzard',cap:"FEATHERS FILL THE SKY LIKE A YELLOW BLIZZARD. SNOWPLOUGHS ARE DEPLOYED. THE SNOWPLOUGHS ARE BURIED."},
  {key:'pillows', cap:"PILLOW FACTORIES GO INTO OVERDRIVE, AND STILL CAN'T KEEP UP."},
  {key:'sit',     cap:"AS THE SUN SETS OVER THE FLATTENED, FLUFFY CITY, HE SITS DOWN GENTLY IN THE FOOTBALL STADIUM. SOFT CRUNCH."},
  {key:'letterd', cap:"HE SMILES AT THE SURVIVORS: TODAY HAS BEEN BROUGHT TO YOU BY THE LETTER D.", big:"D"},
  {key:'destroy', cap:"FOR DESTRUCTION.", big:"D"},
  {key:'zero',    cap:"AND THE NUMBER ZERO.", big:"0"},
  {key:'left',    cap:"FOR WHAT'S LEFT.", big:"0"}
];
const BG_HOLD="...AND THE NUMBER ZERO. FOR WHAT'S LEFT. — press RESET";
const bgArt=["  ___  "," (o o) ","  \\v/  ","/#####\\","|#####|"," ##### ","  | |  ","  ^ ^  "];
const bgSitArt=["  ___  "," (^ ^) ","  \\v/  ","/#####\\","|#####|","=#####="];
const bgFriendArt=["   .-------.    ","  ( o    ~~~~~~~","( ~~~~~~~~~~~~ )"," (~~~~~~~~~~~~) ","  ||  ||  ||  ||"];
const BG_BIG={D:["####  ","#   # ","#   # ","#   # ","####  "],"0":[" ### ","#   #","#   #","#   #"," ### "]};
const bgPlaces={
  houses:{art:[" /\\/\\/\\/\\ ","|[]|[]|[]|","|__|__|__|"], f:0.14},
  school:{art:[" ________ ","| SCHOOL |","|[]    []|","|________|"], f:0.27},
  bank:{art:[" ______ ","| BANK |","|[$$]  |","|______|"], f:0.39},
  bridge:{art:["=========","|       |"], f:0.48},
  bus:{art:[" ________ ","|BUS STN |","|[]  [] |","|________|"], f:0.57},
  hall:{art:["  _/\\_  ","|TOWN  |","|HALL  |","|______|"], f:0.67},
  cathedral:{art:["   +   ","  /^\\  "," /   \\ ","|  o  |","|_|^|_|"], f:0.78},
  stadium:{art:["  ________  "," (________) ","(__________)"], f:0.9}
};

function bgDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function bgScale(art,s){ if(s<=1) return art; const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out; }
function bgPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function bgText(s,x,y,mode,life){ bgTexts.push({s,x,y,mode:mode||'bgtext',life:life||20}); }
function bgBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function bgColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function bgClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){ setCh(cityGridArr,r,c," "); bgMG[r][c]=null; } }
function bgWide(){ return bgArt[0].length*bgS; }
function bgKnock(name,word,dir){
  // a landmark goes down; its bits fly off in the direction he hit it from
  const P=bgG[name]; if(!P||bgGone[name]) return; bgGone[name]=true;
  for(let r=0;r<streetRow;r++) for(let c=P.x-1;c<=P.x+P.w;c++){ if(c<0||c>=COLS||cityGridArr[r][c]===" ") continue; if(Math.random()<0.3) bgParts.push({x:c,y:r,vx:(dir||1)*(0.5+Math.random()),vy:-0.4-Math.random()*0.4,g:0.05,ch:cityGridArr[r][c],mode:bgMG[r][c]||'rubble',life:28}); }
  bgClear(P.x-1,P.x+P.w);
  if(word) bgText(word,P.c,streetRow-8,'bgbig',22);
  bgShake=Math.max(bgShake,5);
}

function bgInit(){
  bgStarted=true; bgT=0; bgIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  bgMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  bgG={};
  for(const k in bgPlaces){
    const P=bgPlaces[k], w=P.art[0].length, x=Math.max(1,Math.min(COLS-w-1,Math.round(COLS*P.f)-Math.floor(w/2)));
    bgClear(x-1,x+w); const top=streetRow-P.art.length;
    for(let i=0;i<P.art.length;i++) for(let j=0;j<w;j++){ const ch=P.art[i][j]||" "; if(ch!==" "){ setCh(cityGridArr,top+i,x+j,ch); bgMG[top+i][x+j]='bg'+k; } }
    bgG[k]={x,w,c:x+Math.floor(w/2),top};
  }
  bgClear(0,8);
  bgX=-20; bgS=1; bgParts=[]; bgTexts=[]; bgFeather={x:4,y:0}; bgKid=true; bgFriend=null;
  bgGone={}; bgCount=0; bgDrift=Array(COLS).fill(0); bgSat=false; bgBigWord=null; bgShake=0; bgDark=0; bgHurr=[];
  document.body.style.background="#16244a";
}

function bgRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!bgMG||bgMG.length!==ROWS||bgMG[0].length!==COLS) bgMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const g=bgG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){ const mr=bgMG[r]; for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c]; }
  // river under the bridge
  for(let c=g.bridge.x;c<g.bridge.x+g.bridge.w;c++){ setCh(grid,streetRow,c,((c+bgT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
  // the feather, and the child holding it
  if(bgFeather) bgPlace(grid,mg,["\\|/"," | "," | "," | "],bgFeather.x,bgFeather.y,'bgfeather');
  if(bgKid) bgPlace(grid,mg,[" o ","/|\\","/ \\"],5,streetRow-3,'body');
  // the yellow drifts piling up during the blizzard
  for(let c=0;c<COLS;c++) for(let k=0;k<bgDrift[c];k++){ const r=streetRow-1-k; if(r<0) break; setCh(grid,r,c,(c+k)%3?"~":"^"); setMode(mg,r,c,'bgdrift'); }
  // car park where the town hall was
  if(bgGone.hall) bgPlace(grid,mg,["[P]"],g.hall.c-1,streetRow-1,'bgsign');
  // the friend
  if(bgFriend) bgPlace(grid,mg,bgScale(bgFriendArt,bgFriend.s),bgFriend.x,streetRow-bgFriendArt.length*bgFriend.s,'bgfriend');
  for(const H of bgHurr) bgPlace(grid,mg,[(bgT>>1)%2?"@":"%"],H.x,H.y,'bgwind');
  // the bird
  if(bgX>-30){
    const art=bgScale(bgSat?bgSitArt:bgArt,bgS), h=art.length;
    const nod=key==='reason'&&(bgT>>3)%2?bgS:0;
    bgPlace(grid,mg,art,bgX,streetRow-h+nod-(bgSat?0:0),'bgbird');
    if(beat && beat.say && f<0.92) bgBubble(grid,mg,bgX+art[0].length/2,streetRow-h,beat.say);
  }
  // the big letter or number, sponsored
  if(bgBigWord){ const art=bgScale(BG_BIG[bgBigWord],Math.max(1,Math.min(3,Math.floor(streetRow*0.35/5),Math.floor(COLS*0.2/6)))); bgPlace(grid,mg,art,Math.min(COLS-art[0].length-1,Math.round(cx+COLS*0.15)),Math.max(6,Math.round(streetRow*0.15)),'bgbig'); }
  for(const p of bgParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of bgTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function bgStepFx(){
  for(const p of bgParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.flake && p.y>=streetRow-1-bgDrift[Math.max(0,Math.min(COLS-1,Math.round(p.x)))]){ const c=Math.max(0,Math.min(COLS-1,Math.round(p.x))); bgDrift[c]=Math.min(Math.round(streetRow*0.45),bgDrift[c]+1); p.life=0; } }
  bgParts=bgParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=-1 && p.y<ROWS);
  for(const t of bgTexts){ t.life--; if(t.life%3===0) t.y--; }
  bgTexts=bgTexts.filter(t=>t.life>0);
  for(const H of bgHurr){ H.x+=H.vx; H.y+=Math.sin(bgT*0.5+H.x)*0.4; } bgHurr=bgHurr.filter(H=>H.x>=0&&H.x<COLS);
}
function bgWalkTo(rightEdge,speed){ const tgt=rightEdge-bgWide(); bgX+=Math.sign(tgt-bgX)*Math.min(Math.abs(tgt-bgX),speed); }

function __m97_loop(){
  if(phase==='bg_run'){
    if(!bgStarted) bgInit();
    const beat=BG_BEATS[bgIdx], dur=bgDur(beat.cap), f=bgT/Math.max(1,dur-1), key=beat.key, g=bgG;
    const Smax=Math.max(2,Math.min(5,Math.floor((streetRow-2)*0.8/bgArt.length),Math.floor(COLS*0.22/bgArt[0].length)));
    bgBigWord=beat.big||null;

    if(key==='feather' && bgFeather){ bgFeather.y=Math.min(streetRow-4,f/0.8*(streetRow-4)); bgFeather.x=4+Math.round(Math.sin(bgT*0.15)*2); }
    if(key==='kid' && bgT===Math.round(dur*0.4)) bgText("!",6,streetRow-6,'bgtext',20);
    if(key==='shadow'){ bgDark=f; document.body.style.background="rgb("+[22,36,74].map(v=>Math.round(v*(1-0.6*f))).join(",")+")"; }
    if(key==='stride'){
      // three growth spurts, one per caption phrase; he walks in from the left
      bgS=Math.max(1,Math.min(Smax,1+Math.floor(f*Smax)));
      bgWalkTo(g.houses.x-1,0.6);
      if(bgT%12===0){ bgText("STOMP",bgX+bgWide()/2,streetRow-bgArt.length*bgS-2,'bgtext',10); bgShake=Math.max(bgShake,1+bgS*0.5); }
    }
    if(key==='wave'){ bgS=Smax; bgWalkTo(g.houses.x+1,0.5); if(f>0.3) bgKnock('houses',"WHOOSH",1); }
    if(key==='share'){ bgWalkTo(g.school.x+2,0.6); if(f>0.55 && !bgGone.school){ bgGone.school=true; const P=g.school; for(let j=0;j<P.w;j++) bgParts.push({x:P.x+j,y:P.top,vx:1.5,vy:-0.8,g:0.01,ch:"_",mode:'bgschool',life:60}); for(let r=P.top;r<P.top+1;r++) for(let c=P.x;c<P.x+P.w;c++){ setCh(cityGridArr,r,c," "); bgMG[r][c]=null; } bgText("NEXT VILLAGE \u2192",COLS-10,P.top-3,'bgtext',30); } }
    if(beat.target){ const P=g[beat.target]; bgWalkTo(P.x+2,Math.max(0.6,COLS/(dur*3))); if(f>0.5) bgKnock(beat.target,"B!",1); }
    if(key==='count'){
      bgWalkTo(g.hall.x+g.hall.w+2,0.5);
      const n=Math.min(10,1+Math.floor(f*10));
      if(n>bgCount){ bgCount=n; bgText(String(n)+"!",bgX+bgWide()/2,streetRow-bgArt.length*bgS-3,'bgbig',14); bgShake=Math.max(bgShake,3); if(n===7) bgKnock('hall',"",1); }
    }
    if(key==='reason'){ if((bgT%16)===8) for(let k=0;k<6;k++) bgHurr.push({x:bgX+bgWide()+1,y:streetRow-bgArt.length*bgS+2+k,vx:1+Math.random()}); }
    if(key==='sad' && bgT%14===0) bgText("*sniff*",bgX+bgWide()/2,streetRow-bgArt.length*bgS-2,'bgtext',12);
    if(key==='friend'){
      const fs=Math.max(1,Math.min(3,Math.floor(bgS*0.7)));
      if(!bgFriend) bgFriend={x:COLS+2,s:fs};
      const tgt=g.cathedral.x-2; bgFriend.x+=Math.sign(tgt-bgFriend.x)*Math.min(Math.abs(tgt-bgFriend.x),Math.max(0.8,COLS/(dur*1.2)));
      if(Math.abs(bgFriend.x-tgt)<2) bgKnock('cathedral',"SQUISH",-1);
    }
    if(key==='blizzard'||key==='pillows'){
      for(let k=0;k<Math.max(3,COLS/25);k++) bgParts.push({x:Math.random()*COLS,y:0,vx:(Math.random()-0.5)*0.4,vy:0.5+Math.random()*0.4,g:0,ch:Math.random()<0.5?"~":",",mode:'bgfeather',life:200,flake:true});
      if(key==='blizzard' && bgT%16===0) bgText("[PLOUGH] ...buried",Math.random()*COLS,streetRow-4,'bgtext',12);
      if(key==='pillows' && bgT%12===0) bgText("FLUMP",Math.random()*COLS,streetRow-6,'bgtext',10);
      // everything still standing slowly disappears under the feathers
      if(key==='pillows' && f>0.6) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++) if(cityGridArr[r][c]!==" " && Math.random()<0.05){ setCh(cityGridArr,r,c," "); bgMG[r][c]=null; }
      bgKid=false; bgFeather=null;
    }
    if(key==='sit'){
      if(bgT===0){ for(let r=0;r<streetRow;r++){ cityGridArr[r]=" ".repeat(COLS); bgMG[r].fill(null); } bgFriend=null; bgParts=bgParts.filter(p=>!p.flake); }
      document.body.style.background="rgb("+Math.round(60+60*f)+","+Math.round(30+20*f)+",40)";
      bgWalkTo(g.stadium.x+g.stadium.w,0.8);
      if(f>0.6 && !bgSat){ bgSat=true; bgText("crunch.",g.stadium.c,streetRow-bgSitArt.length*bgS-2,'bgtext',30); bgShake=4; }
    }

    if(bgShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*bgShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*bgShake).toFixed(1)+"px)"; bgShake*=0.88; }
    else { stage.style.transform=""; bgShake=0; }
    bgStepFx();
    bgRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffe040"; sub.style.textShadow="0 0 8px #ff8a1a";
    bgT++;
    if(bgT>=dur){ bgT=0; bgIdx++; if(bgIdx>=BG_BEATS.length){ phase='bg_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='bg_hold'){
    stage.style.transform="";
    bgBigWord="0";
    bgStepFx(); bgT++;
    bgRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=BG_HOLD; sub.style.color="#ffe040"; sub.style.textShadow="0 0 8px #ff8a1a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m97_start(){
  attackMode='bg_run';
  cmd.style.color="#ffe040"; cmd.style.textShadow="0 0 20px #ff8a1a";
  bgStarted=false; phase='bg_run';
}

function __m97_reset(){
  bgStarted=false; bgT=0; bgIdx=0; bgG=null; bgMG=null; bgX=-20; bgS=1; bgParts=[]; bgTexts=[]; bgFeather=null; bgKid=true; bgFriend=null;
  bgGone={}; bgCount=0; bgDrift=[]; bgSat=false; bgBigWord=null; bgShake=0; bgDark=0; bgHurr=[];
  stage.style.transform="";
}

registerMethod(97, { start: __m97_start, resetFn: __m97_reset, loopFn: __m97_loop, phaseNames: ['bg_run','bg_hold'] });
