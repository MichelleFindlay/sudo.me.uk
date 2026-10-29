let nkStarted=false, nkT=0, nkIdx=0, nkG=null, nkPeople=[], nkProps=[], nkParts=[], nkTexts=[], nkPath=[], nkHead=-1, nkSpeed=1;
let nkCollided=false, nkGameOver=0, nkTanks=null, nkShells=[], nkBand=[], nkShake=0, nkCrack=0, nkPiano=null, nkCar=null, nkDrill=null, nkTyped=0, nkLol=0;

// ---- NOKIA 3310 ----
// the phone sits in the gutter and nothing can hurt it. Snake leaves its screen along one
// precomputed path that circles the city and finally turns back into its own body; the
// head eats as it goes, and the body is just a window onto that path. Everything the snake
// ate then explodes outward, and the tanks' shells bounce off the phone into downtown
const NK_BEATS=[
  {key:'est',      cap:"THE PEACEFUL CITY ON A NORMAL AFTERNOON. EVERYONE IS STARING AT SLEEK, FRAGILE SMARTPHONES."},
  {key:'gutter',   cap:"IN A GUTTER, HALF-BURIED IN LEAVES, LIES A CHUNKY GREY-BLUE NOKIA 3310. STILL ON FULL BATTERY."},
  {key:'trip',     cap:"A MAN TRIPS OVER IT, AND DROPS HIS OWN EXPENSIVE SMARTPHONE. IT SHATTERS INTO A THOUSAND PIECES."},
  {key:'scratch',  cap:"THE 3310 DOESN'T EVEN GET A SCRATCH. THE PAVEMENT UNDERNEATH IT CRACKS."},
  {key:'ring',     cap:"THEN IT STARTS RINGING, WITH THAT INSTANTLY RECOGNISABLE, TINNY OLD JINGLE. THE WHOLE CITY FREEZES."},
  {key:'pockets',  cap:"A FEW OLDER PEOPLE INSTINCTIVELY REACH FOR POCKETS THEY HAVEN'T USED SINCE 2003."},
  {key:'car',      cap:"PEOPLE TRY TO SILENCE IT. A CAR RUNS IT OVER. THE CAR IS WRECKED."},
  {key:'piano',    cap:"A WOMAN DROPS A PIANO ON IT. THE PIANO EXPLODES."},
  {key:'drill',    cap:"A PNEUMATIC DRILL BOUNCES OFF IT, AND INTO THE OPERATOR'S OWN FOOT."},
  {key:'snake',    cap:"THE SCREEN LIGHTS UP GREEN. SNAKE STARTS. A PIXELATED SNAKE SLITHERS ACROSS THE TINY SCREEN..."},
  {key:'off',      cap:"...THEN OFF THE SCREEN, AND ACROSS THE CITY, EATING EVERYTHING IN ITS PATH. BINS. BENCHES. CARS."},
  {key:'circle',   cap:"IT CIRCLES THE WHOLE CITY, GETTING LONGER AND LONGER, LEAVING A PIXELATED TRAIL THROUGH THE STREETS."},
  {key:'tips',     cap:"PEOPLE RUN IN PANIC. A FEW TEENAGERS JUST SHOUT TIPS AT IT."},
  {key:'collide',  cap:"NOW LONGER THAN THE CITY ITSELF, IT TURNS SHARPLY... AND HITS ITS OWN TAIL."},
  {key:'gameover', cap:"GAME OVER."},
  {key:'tanks',    cap:"THE MILITARY ROLLS IN. THE TANKS OPEN FIRE ON THE PHONE."},
  {key:'bounce',   cap:"THE SHELLS BOUNCE OFF IT, AND LEVEL WHAT'S LEFT OF DOWNTOWN."},
  {key:'battery',  cap:"IN THE SMOKE AND RUBBLE, THE 3310 SITS COMPLETELY UNTOUCHED."},
  {key:'bars',     cap:"ITS BATTERY STILL SHOWS FOUR BARS. AFTER NINE DAYS. NINE YEARS. MAYBE FOREVER."},
  {key:'text',     cap:"THE PHONE VIBRATES. A TEXT MESSAGE SLOWLY SCROLLS ACROSS THE SCREEN, TYPED IN T9:"},
  {key:'lol',      cap:"THEN IT BUZZES AGAIN, AND ADDS: \"lol.\" THE BATTERY STAYS AT FOUR BARS."}
];
const NK_HOLD="R U OK? X — press RESET";
const NK_MSG="R U OK? X";

const nkPhoneArt=["[==]","|##|"];
const nkBigPhone=[
  "  .--------------.  ",
  " /  NOKIA         \\ ",
  "|  .------------.  |",
  "|  |            |  |",
  "|  |            |  |",
  "|  |            |  |",
  "|  '------------'  |",
  "|    (   ==   )    |",
  "|   [1] [2] [3]    |",
  "|   [4] [5] [6]    |",
  "|   [7] [8] [9]    |",
  "|   [*] [0] [#]    |",
  " \\________________/ "
];
const NK_FONT={
  G:[" ### ","#    ","# ###","#   #"," ### "], A:[" ### ","#   #","#####","#   #","#   #"], M:["#   #","## ##","# # #","#   #","#   #"],
  E:["#####","#    ","#### ","#    ","#####"], O:[" ### ","#   #","#   #","#   #"," ### "], V:["#   #","#   #","#   #"," # # ","  #  "],
  R:["#### ","#   #","#### ","#  # ","#   #"], " ":["   ","   ","   ","   ","   "]
};
const nkPianoArt=[" _______ ","|#|#|#|#|","'-------'"];

function nkDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function nkPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function nkText(s,x,y,mode,life){ nkTexts.push({s,x,y,mode:mode||'nktext',life:life||20}); }
function nkColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function nkBurst(x,y,n,chars,mode){ for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2; nkParts.push({x,y,vx:Math.cos(a)*1.2,vy:Math.sin(a)*0.7-0.4,g:0.06,ch:chars[(Math.random()*chars.length)|0],mode,life:20}); } }

function nkInit(){
  nkStarted=true; nkT=0; nkIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const phone=Math.round(COLS*0.3), sr=streetRow-1;
  nkG={phone, sr};
  for(let r=0;r<streetRow;r++) for(let c=phone-8;c<=phone+8;c++) setCh(cityGridArr,r,c," ");
  // the snake's route: along the street, up the right side, back along the top, down the
  // left, across the middle, then a sharp turn down into its own body on the street
  const R=COLS-3, L=2, T=Math.max(2,Math.round(streetRow*0.3)), M=Math.round((T+sr)/2), X=Math.max(phone+12,R-6);
  const pts=[[phone+3,sr],[R,sr],[R,T],[L,T],[L,M],[X,M],[X,sr]];
  nkPath=[]; for(let i=0;i+1<pts.length;i++){ const [x0,y0]=pts[i], [x1,y1]=pts[i+1], n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)); for(let k=(i?1:0);k<=n;k++) nkPath.push({c:Math.round(x0+(x1-x0)*k/n), r:Math.round(y0+(y1-y0)*k/n)}); }
  nkHead=-1;
  let frames=0; for(const k of ['off','circle','tips']) frames+=nkDur(NK_BEATS.find(b=>b.key===k).cap);
  frames+=Math.round(nkDur(NK_BEATS.find(b=>b.key==='collide').cap)*0.6);
  nkSpeed=nkPath.length/frames;
  nkPeople=[]; for(let i=0;i<Math.max(6,Math.round(COLS/14));i++) nkPeople.push({x:Math.random()*(COLS-4), d:Math.random()<0.5?-1:1, old:i%4===0, teen:i%5===1, run:false});
  nkPeople[0].x=phone-10; nkPeople[0].d=1; nkPeople[0].tripper=true;
  nkProps=[]; for(const f of [0.4,0.5,0.6,0.72,0.84]){ const x=Math.round(COLS*f); nkProps.push({x, kind:['bin','bench','car'][nkProps.length%3]}); }
  nkParts=[]; nkTexts=[]; nkCollided=false; nkGameOver=0; nkTanks=null; nkShells=[]; nkBand=[]; nkShake=0; nkCrack=0; nkPiano=null; nkCar=null; nkDrill=null; nkTyped=0; nkLol=0;
  document.body.style.background="#20304a";
}

function nkBody(){
  if(nkHead<0) return [];
  const h=Math.floor(nkHead), len=Math.floor(8+nkHead*0.95), t=Math.max(0,h-len);
  return nkPath.slice(t,h+1);
}

function nkRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=nkG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  // leaves in the gutter, the cracked pavement, the phone itself
  for(let k=-3;k<=6;k++){ const c=g.phone+k; if(c>=0&&c<COLS&&Math.random()<0.7){ setCh(grid,streetRow-1,c,(k*7)%3?"&":","); setMode(mg,streetRow-1,c,'nkleaf'); } }
  for(let k=0;k<nkCrack;k++) for(const s of [-1,1]){ const c=g.phone+1+s*(k+2); if(c>=0&&c<COLS){ setCh(grid,streetRow,c,k%2?"/":"\\"); setMode(mg,streetRow,c,'nkcrack'); } }
  const phoneMode=['snake','off','circle','tips','collide'].includes(key)?'nkphonelit':'nkphone';
  nkPlace(grid,mg,nkPhoneArt,g.phone,streetRow-2,phoneMode);
  if(['ring','pockets','car','piano','drill'].includes(key) && (nkT>>1)%2) nkPlace(grid,mg,["((   ))"],g.phone-2,streetRow-2,'nkring');
  // props the snake will eat
  for(const P of nkProps){
    const art=P.kind==='bin'?["[_]","|#|"]:(P.kind==='bench'?["_____","|   |"]:["o==o"]);
    nkPlace(grid,mg,art,P.x,streetRow-art.length,P.kind==='car'?'car':'nkprop');
  }
  // people
  for(const P of nkPeople){
    const art=P.run?["\\o/"," | ","/ \\"]:[" o ","/|"+(P.old&&key==='pockets'?"\\":"[")," / \\"].map(s=>s.slice(0,4));
    nkPlace(grid,mg,art,P.x,streetRow-3,'body');
    if(!P.run && !P.down) nkPlace(grid,mg,["[]"],P.x+2,streetRow-2,'nksmart');
  }
  if(nkCar) nkPlace(grid,mg,["o==o"],nkCar.x,streetRow-1-(nkCar.hop||0),'car');
  if(nkPiano) nkPlace(grid,mg,nkPianoArt,g.phone-3,nkPiano.y,'nkpiano');
  if(nkDrill) nkPlace(grid,mg,[" o ","/|T","/ |"],g.phone+3,streetRow-3-(nkDrill.hop||0),'nkdrill');
  // the snake
  const body=nkBody();
  body.forEach((p,i)=>{ for(const dc of [0,1]){ const c=p.c+dc; if(c<0||c>=COLS) continue; setCh(grid,p.r,c,i===body.length-1?"@":"#"); setMode(mg,p.r,c,'nksnake'); } });
  // the tiny-screen close-up while snake starts
  if(key==='snake'){
    const L=Math.max(0,COLS-22), T=1;
    nkPlace(grid,mg,nkBigPhone,L,T,'nkbig');
    const len=4+Math.round(f*6);
    for(let k=0;k<len;k++){ const pos=(nkT+k)%12; nkPlace(grid,mg,["#"],L+4+pos,T+4,'nkscreen'); }
  }
  // GAME OVER in huge pixels
  if(nkGameOver>0){                                                   // always on; the colour does the flashing
    const word="GAME OVER", rows=["","","","",""];
    for(const ch of word){ const gl=NK_FONT[ch]; for(let i=0;i<5;i++) rows[i]+=gl[i]+" "; }
    nkPlace(grid,mg,rows,Math.round(cx-rows[0].length/2),Math.max(4,Math.round(streetRow*0.25)),'nkgameover');   // below the corner buttons
  }
  // tanks and their shells
  if(nkTanks){
    nkPlace(grid,mg,tankSprite,nkTanks.l,streetRow-tankSprite.length,'nktank');
    nkPlace(grid,mg,tankSprite.map(s=>s.split("").reverse().map(ch=>ch==="("?")":(ch===")"?"(":ch)).join("")),nkTanks.r,streetRow-tankSprite.length,'nktank');
  }
  for(const S of nkShells) nkPlace(grid,mg,["*"],S.x,S.y,'nkshell');
  // battery overlay, then the close-up with the text message
  if(key==='bars'){ nkPlace(grid,mg,["[||||]"],g.phone-1,streetRow-4,'nkbattery'); nkPlace(grid,mg,[["9 DAYS","9 YEARS","FOREVER"][Math.min(2,Math.floor(f*3))]],g.phone-1,streetRow-6,'nktext'); }
  if(['text','lol','hold'].includes(key)){
    const L=Math.round(cx-nkBigPhone[0].length/2), T=Math.max(1,streetRow-nkBigPhone.length-1)+(nkLol>0&&(nkT%4<2)?0:0);
    const jit=(key==='text'&&f<0.2)||(key==='lol'&&f<0.25)?((nkT%2)?1:-1):0;
    nkPlace(grid,mg,nkBigPhone,L+jit,T,'nkbig');
    nkPlace(grid,mg,["||||"],L+4+jit,T+3,'nkscreen');
    nkPlace(grid,mg,[NK_MSG.slice(0,nkTyped)],L+4+jit,T+4,'nkscreen');
    if(nkLol>0) nkPlace(grid,mg,["lol.".slice(0,nkLol)],L+4+jit,T+5,'nkscreen');
    if(jit) nkText("bzzt",L+nkBigPhone[0].length+3,T+2,'nktext',2);
  }
  for(const p of nkParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of nkTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function nkStepFx(){
  for(const p of nkParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx*=0.5; p.vy=0; } }
  nkParts=nkParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of nkTexts){ t.life--; if(t.life%3===0) t.y--; }
  nkTexts=nkTexts.filter(t=>t.life>0);
}

function __m90_loop(){
  if(phase==='nk_run'){
    if(!nkStarted) nkInit();
    const beat=NK_BEATS[nkIdx], dur=nkDur(beat.cap), f=nkT/Math.max(1,dur-1), key=beat.key, g=nkG;
    let hold=false;
    const frozen=['ring','pockets','car','piano','drill','snake'].includes(key);
    for(const P of nkPeople){
      if(P.down) continue;
      if(P.run){ P.x+=P.x<cx?-1.2:1.2; continue; }
      if(!frozen && !P.tripper) { P.x+=P.d*0.25; if(P.x<1||P.x>COLS-5) P.d=-P.d; }
    }

    if(key==='trip'){
      const P=nkPeople[0];
      if(P.x<g.phone-2) P.x+=0.35;
      else if(!P.down){ P.down=true; nkText("WHOOPS",g.phone,streetRow-6,'nktext',20); nkBurst(g.phone+1,streetRow-2,40,["/","\\","*","'","."],'nkglass'); nkText("CRACK",g.phone+4,streetRow-4,'nkglass',16); }
    }
    if(key==='scratch'){ nkCrack=Math.min(5,Math.round(f*6)); if(nkT===Math.round(dur*0.3)) nkText("...",g.phone+1,streetRow-4,'nktext',20); }
    if(key==='ring'||key==='pockets'||key==='car'||key==='piano'||key==='drill'){ if(nkT%6===0) nkParts.push({x:g.phone+1+(Math.random()-0.5)*4,y:streetRow-3,vx:(Math.random()-0.5)*0.3,vy:-0.2,g:0,ch:Math.random()<0.5?"\u266a":"\u266b",mode:'nkring',life:20}); }
    if(key==='pockets' && nkT%12===4){ const P=nkPeople.find(p=>p.old&&!p.down); if(P) nkText("*pat pat*",P.x+1,streetRow-5,'nktext',12); }
    if(key==='car'){
      if(!nkCar) nkCar={x:-5,hop:0};
      if(nkCar.x<g.phone-1) nkCar.x+=1.2; else if(!nkCar.wrecked){ nkCar.wrecked=true; nkBurst(g.phone+1,streetRow-2,24,["o","=","#","*"],'car'); nkText("CRUNCH",g.phone+1,streetRow-6,'nktext',20); nkShake=3; }
      if(nkCar.wrecked) nkCar=null;
    }
    if(key==='piano'){
      if(!nkPiano) nkPiano={y:-3};
      if(nkPiano.y<streetRow-5) nkPiano.y+=Math.max(0.6,(streetRow-5)/(dur*0.5));
      else if(!nkPiano.done){ nkPiano.done=true; nkBurst(g.phone+1,streetRow-3,30,["#","|","'","="],'nkpiano'); nkText("PLONNNG",g.phone+1,streetRow-7,'nktext',20); nkShake=4; }
      if(nkPiano && nkPiano.done) nkPiano.y=-50;
    }
    if(key==='drill'){
      if(!nkDrill) nkDrill={hop:0};
      nkDrill.hop=(nkT>>1)%2;
      if(nkT%5===0) nkText("DUGDUGDUG",g.phone+5,streetRow-5,'nktext',6);
      if(nkT===Math.round(dur*0.7)){ nkText("OW",g.phone+4,streetRow-6,'nktext',24); }
    }
    if(key==='snake'){ nkDrill=null; nkPiano=null; }
    if(['off','circle','tips','collide'].includes(key) && !nkCollided){
      // advance the head along the route, eating whatever it reaches
      const prev=Math.floor(nkHead);
      nkHead=Math.min(nkPath.length-1,nkHead+nkSpeed);
      for(let i=Math.max(0,prev+1);i<=Math.floor(nkHead);i++){
        const p=nkPath[i];
        for(const dc of [0,1]){ const c=p.c+dc; if(c>=0&&c<COLS&&p.r<streetRow&&cityGridArr[p.r][c]!==" ") setCh(cityGridArr,p.r,c," "); }
        for(const P of nkProps.slice()) if(p.r===g.sr && p.c>=P.x-1 && p.c<=P.x+4){ nkProps.splice(nkProps.indexOf(P),1); nkText("CHOMP",P.x+2,streetRow-4,'nksnake',14); }
      }
      if(Math.floor(nkHead)>=nkPath.length-1){ nkCollided=true; nkText("!",nkPath[nkPath.length-1].c,streetRow-4,'nktext',20); }
    }
    if(key==='tips'){
      nkPeople.forEach(P=>{ if(!P.teen && !P.down) P.run=true; });
      if(nkT%9===0){ const P=nkPeople.find(p=>p.teen); if(P) nkText(["GO LEFT!","EAT THE BUS!","DON'T HIT YOURSELF!","USE THE CORNERS!"][(nkT/9|0)%4],P.x+1,streetRow-5,'nktext',14); }
    }
    if(key==='collide' && !nkCollided) hold=true;                         // the caption waits for the crash
    if(key==='gameover'){
      nkGameOver=1;
      if(nkT===Math.round(dur*0.3)){
        // every block it ate comes back out at once
        const body=nkBody(); nkHead=-1;
        for(const p of body) if(Math.random()<0.5) nkParts.push({x:p.c,y:p.r,vx:(p.c-cx)/COLS*3+(Math.random()-0.5),vy:-0.6-Math.random()*0.8,g:0.05,ch:"#",mode:'nksnake',life:40});
        const band=Math.round(COLS*0.15);
        for(let c=0;c<COLS;c++){ if(Math.abs(c-cx)<=band) continue; for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" "){ if(Math.random()<0.08) nkParts.push({x:c,y:r,vx:(Math.random()-0.5)*1.5,vy:-0.5,g:0.05,ch:cityGridArr[r][c],mode:'rubble',life:30}); setCh(cityGridArr,r,c," "); } }
        nkBand=[]; for(let c=cx-band;c<=cx+band;c++) if(nkColTop(c)<streetRow) nkBand.push(c);
        nkShake=10; nkProps=[]; nkPeople=nkPeople.filter(P=>P.teen);
        flash.style.transition="opacity 0.03s"; flash.style.opacity=0.5; setTimeout(()=>{ flash.style.transition="opacity 0.6s"; flash.style.opacity=0; },60);
      }
    }
    if(key==='tanks'||key==='bounce'){
      nkGameOver=0;
      if(!nkTanks) nkTanks={l:-9, r:COLS+1};
      nkTanks.l=Math.min(g.phone-18,nkTanks.l+0.6); nkTanks.r=Math.max(g.phone+12,nkTanks.r-0.6);
      if(nkT%6===0) nkShells.push({x:(nkT/6)%2?nkTanks.l+8:nkTanks.r-1, y:streetRow-2, vx:0, vy:0, phase:'in'});
      for(const S of nkShells){
        if(S.phase==='in'){ S.x+=(g.phone+1-S.x)*0.3; if(Math.abs(S.x-g.phone-1)<1){ S.phase='out'; nkText("PING",g.phone+1,streetRow-4,'nktext',8); const tgt=nkBand.length?nkBand[(Math.random()*nkBand.length)|0]:cx; S.tx=tgt; S.vy=-1.2; S.vx=(tgt-S.x)/20; } }
        else { S.x+=S.vx; S.y+=S.vy; S.vy+=0.12; if(S.y>=streetRow-1 || (S.y>0&&cityGridArr[Math.round(S.y)]&&cityGridArr[Math.round(S.y)][Math.round(S.x)]!==" "&&S.vy>0)){ S.dead=true; const c=Math.round(S.tx); for(let k=-2;k<=2;k++){ const cc=c+k; if(cc<0||cc>=COLS) continue; for(let r=0;r<streetRow;r++) if(cityGridArr[r][cc]!==" "){ if(Math.random()<0.15) nkParts.push({x:cc,y:r,vx:(Math.random()-0.5)*1.2,vy:-0.5,g:0.05,ch:cityGridArr[r][cc],mode:'rubble',life:24}); setCh(cityGridArr,r,cc," "); } } nkText("BOOM",c,streetRow-8,'nktext',12); nkShake=3; } }
      }
      nkShells=nkShells.filter(S=>!S.dead && S.x>=0 && S.x<COLS);
      if(key==='bounce' && nkT===dur-1){ for(let r=0;r<streetRow;r++) cityGridArr[r]=" ".repeat(COLS); }
    }
    if(key==='battery'){ nkShells=[]; if(nkTanks){ nkTanks.l-=0.8; nkTanks.r+=0.8; if(nkTanks.l<-10) nkTanks=null; } if(nkT%3===0) nkParts.push({x:Math.random()*COLS,y:streetRow-1,vx:0.1,vy:-0.15,g:0,ch:"~",mode:'nksmoke',life:30}); }
    if(key==='bars'){ if(nkT%3===0) nkParts.push({x:Math.random()*COLS,y:streetRow-1,vx:0.1,vy:-0.15,g:0,ch:"~",mode:'nksmoke',life:30}); }
    if(key==='text'){ nkTyped=Math.min(NK_MSG.length,Math.floor(Math.max(0,f-0.2)/0.6*NK_MSG.length)); }
    if(key==='lol'){ nkTyped=NK_MSG.length; nkLol=Math.min(4,Math.floor(Math.max(0,f-0.25)/0.4*4)); }

    if(nkShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*nkShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*nkShake).toFixed(1)+"px)"; nkShake*=0.88; }
    else { stage.style.transform=""; nkShake=0; }
    nkStepFx();
    nkRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#9adf5a"; sub.style.textShadow="0 0 8px #2a4a2a";
    nkT++;
    if(nkT>=dur && !hold){ nkT=0; nkIdx++; if(nkIdx>=NK_BEATS.length){ phase='nk_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='nk_hold'){
    stage.style.transform="";
    nkStepFx(); nkT++;
    nkRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=NK_HOLD; sub.style.color="#9adf5a"; sub.style.textShadow="0 0 8px #2a4a2a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m90_start(){
  attackMode='nk_run';
  cmd.style.color="#9adf5a"; cmd.style.textShadow="0 0 20px #2a4a2a";
  nkStarted=false; phase='nk_run';
}

function __m90_reset(){
  nkStarted=false; nkT=0; nkIdx=0; nkG=null; nkPeople=[]; nkProps=[]; nkParts=[]; nkTexts=[]; nkPath=[]; nkHead=-1; nkSpeed=1;
  nkCollided=false; nkGameOver=0; nkTanks=null; nkShells=[]; nkBand=[]; nkShake=0; nkCrack=0; nkPiano=null; nkCar=null; nkDrill=null; nkTyped=0; nkLol=0;
  stage.style.transform="";
}

registerMethod(90, { start: __m90_start, resetFn: __m90_reset, loopFn: __m90_loop, phaseNames: ['nk_run','nk_hold'] });
