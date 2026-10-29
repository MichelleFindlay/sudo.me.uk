let lgStarted=false, lgT=0, lgIdx=0, lgG=null, lgSegs=[], lgSegOf=[], lgFigs=[], lgCars=[], lgTrees=[], lgParts=[], lgTexts=[];
let lgPile=[], lgPileCol=[], lgBeatP=6, lgBeatN=0, lgHead=null, lgGown=null, lgBook=null, lgExploded=false, lgHum=null, lgShake=0;

// ---- LEGO: Some Assembly Required ----
// the city is redrawn as interlocking brick courses, one colour per building segment, and
// everything (feet, traffic, cranes, fountains, bouncing buildings, popping bricks) runs off
// one beat clock that halves its period at the key change. Loose bricks pile up per column
const LG_BEATS=[
  {key:'est',     cap:"THE PEACEFUL CITY. EXCEPT EVERY BUILDING, CAR AND TREE IS MADE OF PLASTIC BRICKS."},
  {key:'figs',    cap:"LITTLE YELLOW MINIFIGURES GO ABOUT THEIR DAY WITH FIXED SMILES AND CLAW HANDS."},
  {key:'radio',   cap:"A RELENTLESSLY UPBEAT TUNE STARTS DRIFTING FROM A RADIO ON A BUILDER'S SCAFFOLD."},
  {key:'tap',     cap:"ONE MINIFIGURE STARTS TAPPING HIS FOOT. THEN ANOTHER. A PIGEON MADE OF THREE BRICKS BOBS ITS HEAD."},
  {key:'sing',    cap:"WITHIN SECONDS THE WHOLE CITY IS BELTING OUT \"EVERYTHING IS AWESOME\" IN PERFECT UNISON."},
  {key:'dead',    cap:"OFFICE WORKERS, BUS DRIVERS AND A POLICE OFFICER ALL SING WITH TOTAL COMMITMENT AND ABSOLUTELY DEAD EYES."},
  {key:'dance',   cap:"EVERYONE FALLS INTO THE SAME DANCE. THE TRAFFIC MOVES IN TIME TO THE BEAT."},
  {key:'cranes',  cap:"CRANES SWING TO THE RHYTHM AND FOUNTAINS SPURT ON EVERY DOWNBEAT. IT'S JOYFUL, AND SLIGHTLY TERRIFYING."},
  {key:'key',     cap:"THE SONG HITS A KEY CHANGE, AND THE ENERGY DOUBLES."},
  {key:'bounce',  cap:"BUILDINGS START BOUNCING IN TIME. BRICKS POP LOOSE ON EVERY BEAT, TINY CLICKS LOST UNDER THE SINGING."},
  {key:'top',     cap:"A SKYSCRAPER LOSES ITS TOP FOUR FLOORS MID-CHORUS. NOBODY STOPS SINGING."},
  {key:'head',    cap:"A MINIFIGURE'S HEAD POPS OFF, ROLLS DOWN THE STREET, AND KEEPS SINGING."},
  {key:'flood',   cap:"THE BRICKS FLOOD THE STREETS."},
  {key:'gown',    cap:"A MINIFIGURE, BAREFOOT IN A DRESSING GOWN, STEPS ON ONE."},
  {key:'scream',  cap:"THE ONLY SCREAM IN THE WHOLE FILM RINGS OUT. PERFECTLY IN TUNE."},
  {key:'final',   cap:"THE FINAL CHORUS HITS, AND THE ENTIRE CITY COMES APART AT ONCE."},
  {key:'rain',    cap:"EVERY BUILDING, CAR AND TREE RAINS DOWN IN ONE HUGE, MULTICOLOURED PILE OF LOOSE BRICKS."},
  {key:'silence', cap:"SILENCE."},
  {key:'book',    cap:"A GIANT INSTRUCTION BOOKLET FLOATS DOWN FROM THE SKY AND LANDS OPEN ON TOP OF THE PILE."},
  {key:'page',    cap:"PAGE ONE IS BLANK EXCEPT FOR ONE SMALL ARROW POINTING AT THE MESS. STEP 1 OF 46,000."},
  {key:'hum',     cap:"A TINY HEAD, SITTING ALONE ON TOP OF THE PILE, IS STILL HUMMING THE SONG."}
];
const LG_HOLD="STEP 1 OF 46,000. — press RESET";
const LG_SONG="EVERYTHING IS AWESOME";
const LG_COLOURS=6;

const lgFigArts={
  stand:["(:)","c#c","| |"], sing:["(O)","c#c","| |"], tap:["(:)","c#c","|/ "],
  armsup:["\\O/"," # ","| |"], armsdn:["(O)","c#c","/ \\"], headless:["   ","c#c","| |"],
  police:[" ^ ","(O)","c#c"], gown:["(:)","c%c","| |"], gownhop:["(O)","c%c","|  "], dead:["(.)","c#c","| |"]
};
const lgBusArt=[" _______ ","|[][](:)|","'o-----o'"];
const lgCarArt=["[==]","o  o"];
const lgTreeArt=[" @@ ","@@@@"," || "];
const lgScaffoldArt=["[o=o]","|=|=|","| | |","|=|=|","| | |"];
const lgPigeonArts=[["[]>"],["[]v"]];

function lgDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function lgPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function lgColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function lgText(s,x,y,mode,life){ lgTexts.push({s,x,y,mode:mode||'lgtext',life:life||20}); }
function lgAddPile(c,col){
  c=Math.max(0,Math.min(COLS-1,Math.round(c)));
  // let a brick roll off a peak onto a lower neighbour, so heaps form slopes, not spikes
  for(let k=0;k<3;k++){
    const l=c>0?lgPile[c-1]:1e9, r=c<COLS-1?lgPile[c+1]:1e9;
    if(lgPile[c]>Math.min(l,r)+1) c+=(l<r?-1:1); else break;
  }
  lgPileCol[c].push(col); lgPile[c]++;
}
function lgSegments(){
  const out=[]; let c=0;
  while(c<COLS){
    if(lgColTop(c)>=streetRow){ c++; continue; }
    let e=c; while(e+1<COLS && lgColTop(e+1)<streetRow) e++;
    const n=Math.max(1,Math.round((e-c+1)/6)), w=(e-c+1)/n;
    for(let k=0;k<n;k++) out.push({c0:Math.round(c+k*w), c1:Math.round(c+(k+1)*w)-1, col:(Math.random()*LG_COLOURS)|0, ph:out.length%2});
    c=e+1;
  }
  return out;
}

function lgInit(){
  lgStarted=true; lgT=0; lgIdx=0; lgBeatP=6; lgBeatN=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const scaf=Math.max(1,Math.round(COLS*0.05)), crane=Math.round(COLS*0.88), fountain=cx;
  lgG={scaf, crane, fountain, cranePh:0, spurt:0};
  const clear=(a,b)=>{ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,a);c<=Math.min(COLS-1,b);c++) setCh(cityGridArr,r,c," "); };
  clear(scaf-1,scaf+5); clear(fountain-4,fountain+4); clear(crane-1,crane+1);
  lgSegs=lgSegments(); lgSegOf=Array(COLS).fill(-1);
  lgSegs.forEach((s,i)=>{ for(let c=s.c0;c<=s.c1;c++) lgSegOf[c]=i; });
  lgFigs=[]; const n=Math.max(5,Math.round(COLS/11));
  for(let i=0;i<n;i++) lgFigs.push({x:2+Math.random()*(COLS-6), d:Math.random()<0.5?-1:1, col:(Math.random()*LG_COLOURS)|0, kind:i===1?'police':'fig', head:true});
  lgCars=[{x:COLS*0.3,bus:false,col:0},{x:COLS*0.55,bus:true,col:2},{x:COLS*0.75,bus:false,col:1}];
  lgTrees=[0.18,0.66].map(f=>({x:Math.round(COLS*f)}));
  lgParts=[]; lgTexts=[]; lgPile=Array(COLS).fill(0); lgPileCol=Array.from({length:COLS},()=>[]);
  lgHead=null; lgGown=null; lgBook=null; lgExploded=false; lgHum=null; lgShake=0;
  document.body.style.background="#1a2a48";
}

function lgOnBeat(){ return lgT%lgBeatP===0; }

function lgRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=lgG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  // redraw every building as brick courses, bouncing per segment once things get going
  const bouncing=['bounce','top','head','flood','gown','scream'].includes(key);
  for(let r=0;r<streetRow;r++) grid[r]=" ".repeat(COLS);
  for(let c=0;c<COLS;c++){
    const si=lgSegOf[c], s=si>=0?lgSegs[si]:null, top=lgColTop(c); if(top>=streetRow) continue;
    const up=(bouncing && s && ((lgBeatN+s.ph)%2===0))?1:0;
    for(let r=top;r<streetRow;r++){
      if(cityGridArr[r][c]===" ") continue;
      const k=streetRow-1-r, p=((c-(s?s.c0:0))+(k%2)*2)%4;
      const ch=r===top?((c%2)?"o":"_"):(p===0?"[":(p===3?"]":"="));
      const rr=r-up; setCh(grid,rr,c,ch); setMode(mg,rr,c,'lgb'+(s?s.col:0));
    }
  }
  // loose bricks heaped on the street
  for(let c=0;c<COLS;c++) for(let k=0;k<lgPile[c];k++){ const r=streetRow-1-k; if(r<0) break; setCh(grid,r,c,(k+c)%2?"]":"["); setMode(mg,r,c,'lgb'+lgPileCol[c][k]); }
  if(!lgExploded){
    // scaffold and radio, crane, fountain, trees, traffic
    lgPlace(grid,mg,lgScaffoldArt,g.scaf,streetRow-lgScaffoldArt.length,'lgscaffold');
    for(let r=3;r<streetRow;r++){ setCh(grid,r,g.crane,"#"); setMode(mg,r,g.crane,'lgcrane'); }
    const swingR=['cranes','key','bounce','top','head','flood','gown','scream'].includes(key)?(lgBeatN%2===0):true;
    const jl=Math.min(12,Math.round(COLS*0.08));
    for(let k=1;k<=jl;k++){ const c=g.crane+(swingR?k:-k); setCh(grid,3,c,"="); setMode(mg,3,c,'lgcrane'); }
    const hookC=g.crane+(swingR?jl:-jl); for(let r=4;r<8;r++){ setCh(grid,r,hookC,"|"); setMode(mg,r,hookC,'lgcrane'); }
    lgPlace(grid,mg,["[]"],hookC-1,8,'lgb3');
    lgPlace(grid,mg,["\\___/"],g.fountain-2,streetRow-1,'lgfountain');
    if(g.spurt>0) for(let k=0;k<g.spurt;k++){ setCh(grid,streetRow-2-k,g.fountain,k===g.spurt-1?"*":"|"); setMode(mg,streetRow-2-k,g.fountain,'water'); }
    for(const t of lgTrees) lgPlace(grid,mg,lgTreeArt,t.x-2,streetRow-lgTreeArt.length,'lgtree');
    for(const car of lgCars){
      const art=car.bus?lgBusArt:lgCarArt;
      lgPlace(grid,mg,art,car.x,streetRow-art.length,car.bus?'lgbus':'lgb'+car.col);
    }
  }
  // the three-brick pigeon on the scaffold
  if(!lgExploded && ['tap','sing','dead','dance','cranes'].includes(key)) lgPlace(grid,mg,lgPigeonArts[lgBeatN%2],g.scaf+1,streetRow-lgScaffoldArt.length-2,'lgpigeon');
  // the minifigures
  if(!lgExploded) for(const F of lgFigs){
    let a='stand';
    const dancing=['dance','cranes','key','bounce','top','head','flood','gown','scream'].includes(key);
    if(dancing) a=lgBeatN%2?'armsup':'armsdn';
    else if(key==='dead') a=lgBeatN%2?'dead':'sing';
    else if(key==='sing') a=lgBeatN%2?'sing':'stand';
    else if(key==='tap' && F.tapping) a=lgBeatN%2?'tap':'stand';
    if(F.kind==='police') a='police';
    if(!F.head) a='headless';
    const art=lgFigArts[a];
    for(let i=0;i<art.length;i++) for(let j=0;j<3;j++){
      const ch=art[i][j], r=streetRow-3+i, c=Math.round(F.x)+j; if(ch===" "||c<0||c>=COLS) continue;
      // torso in the figure's colour, yellow head and claw hands, dark legs, blue police hat
      const m=(ch==="#"||ch==="%")?'lgb'+F.col:(ch==="^"&&F.kind==='police'?'lgpolice':((i===0||ch==="c"||ch==="O"||ch==="(")?'lgfig':'lglegs'));
      setCh(grid,r,c,ch); setMode(mg,r,c,m);
    }
  }
  if(lgGown){ const art=lgFigArts[lgGown.hop?'gownhop':'gown']; lgPlace(grid,mg,art,lgGown.x,streetRow-3-lgPile[Math.round(lgGown.x)+1]-(lgGown.hop?1:0),'lggown'); }
  if(lgHead) lgPlace(grid,mg,[lgHead.sing?"O":"o"],lgHead.x,Math.round(lgHead.y),'lgfig');
  // the booklet
  if(lgBook){
    const B=lgBook, w=B.w, half=Math.floor((w-3)/2), rows=["+"+"-".repeat(half)+"+"+"-".repeat(w-3-half)+"+"];
    for(let i=0;i<3;i++) rows.push("|"+" ".repeat(half)+"|"+" ".repeat(w-3-half)+"|");
    rows.push(rows[0]);
    lgPlace(grid,mg,rows,B.x,B.y,'lgbook');
    if(B.open){
      lgPlace(grid,mg,["-->"],B.x+2,B.y+2,'lgbookink');
      const step="1 of 46,000"; lgPlace(grid,mg,[step.slice(0,Math.max(4,w-4-half))],B.x+half+2,B.y+3,'lgbookink');
      lgPlace(grid,mg,["1"],B.x+half+2,B.y+1,'lgbookink');
    }
  }
  if(lgHum) lgPlace(grid,mg,["o"],lgHum.x,lgHum.y,'lgfig');
  for(const p of lgParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of lgTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  // one big unison bubble over the crowd while they sing
  const singing=['sing','dead','dance','cranes','key','bounce','top','flood'].includes(key);
  if(singing && !lgExploded && lgFigs.length && (lgT%40)<30){
    const F=lgFigs[(lgT/40|0)%lgFigs.length], len=LG_SONG.length+4;
    mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(F.x)+1)),streetRow-3,LG_SONG);
  }
  if(key==='scream' && lgGown && f<0.9){
    const s="AAAAAAAAAAH \u266a", len=s.length+4;
    mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(lgGown.x)+1)),streetRow-4-lgPile[Math.round(lgGown.x)+1],s);
  }
  scene.innerHTML=paint(grid,mg,'city');
}

function lgPopBrick(c){
  // knock a two-stud brick off the top of this column; it falls into the street
  const top=lgColTop(c); if(top>=streetRow) return;
  const s=lgSegOf[c]>=0?lgSegs[lgSegOf[c]]:null;
  for(const cc of [c,c+1]) if(cc<COLS && lgColTop(cc)===top) setCh(cityGridArr,top,cc," ");
  lgParts.push({x:c,y:top,vx:(Math.random()-0.5)*0.8,vy:-0.4,g:0.08,ch:"#",mode:'lgb'+(s?s.col:0),col:s?s.col:0,brick:true,life:120});
}
function lgStepFx(){
  for(const p of lgParts){
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--;
    if(p.brick && p.vy>0){
      const c=Math.max(0,Math.min(COLS-1,Math.round(p.x)));
      if(p.y>=streetRow-1-lgPile[c]){ lgAddPile(c,p.col); p.life=0; }
    }
  }
  lgParts=lgParts.filter(p=>p.life>0 && p.x>=-1 && p.x<COLS+1 && p.y<ROWS && p.y>-30);
  for(const t of lgTexts){ t.life--; if(t.life%3===0) t.y--; }
  lgTexts=lgTexts.filter(t=>t.life>0);
}
function lgNote(x,y){ lgParts.push({x,y,vx:(Math.random()-0.5)*0.2,vy:-0.25,g:0,ch:Math.random()<0.5?"\u266a":"\u266b",mode:'lgnote',life:20}); }

function __m84_loop(){
  if(phase==='lg_run'){
    if(!lgStarted) lgInit();
    const beat=LG_BEATS[lgIdx], dur=lgDur(beat.cap), f=lgT/Math.max(1,dur-1), key=beat.key, g=lgG;
    const beatNow=lgOnBeat(); if(beatNow) lgBeatN++;
    const singing=['sing','dead','dance','cranes','key','bounce','top','head','flood','gown','scream','final'].includes(key);

    // people walk around until the music takes over; then traffic only moves on the beat
    if(['est','figs','radio'].includes(key)){ for(const F of lgFigs){ F.x+=F.d*0.25; if(F.x<1||F.x>COLS-4) F.d=-F.d; } for(const c of lgCars){ c.x+=0.4; if(c.x>COLS) c.x=-10; } }
    else if(['dance','cranes','key','bounce','top','head','flood','gown','scream'].includes(key) && beatNow){ for(const c of lgCars){ c.x+=2; if(c.x>COLS) c.x=-10; } }

    if(key==='radio' && lgT%4===0) lgNote(g.scaf+2,streetRow-lgScaffoldArt.length-1);
    if(key==='tap'){ lgFigs.forEach((F,i)=>{ if(f>i/lgFigs.length*0.8) F.tapping=true; }); if(lgT%5===0) lgNote(g.scaf+2,streetRow-lgScaffoldArt.length-1); }
    if(singing && !lgExploded && lgT%3===0){ const F=lgFigs[(Math.random()*lgFigs.length)|0]; if(F) lgNote(F.x+1,streetRow-4); }
    if(key==='cranes'||key==='key'||key==='bounce'){ g.spurt=beatNow&&lgBeatN%2===0?5:Math.max(0,g.spurt-1); }
    if(key==='key'){
      if(lgT===0){ lgBeatP=3; lgText("KEY CHANGE!",cx,Math.round(streetRow*0.3),'lgnote',30);
        flash.style.transition="opacity 0.03s"; flash.style.opacity=0.35; setTimeout(()=>{ flash.style.transition="opacity 0.5s"; flash.style.opacity=0; },60); }
    }
    if(['bounce','top','head','flood','gown','scream'].includes(key) && beatNow){
      const n=key==='flood'?Math.max(4,Math.round(COLS/10)):Math.max(1,Math.round(COLS/40));
      for(let k=0;k<n;k++) lgPopBrick((Math.random()*(COLS-1))|0);
      if(Math.random()<0.4) lgText("click",(Math.random()*COLS)|0,streetRow*0.4,'lgclick',10);
      lgShake=1.5;
    }
    if(key==='top' && lgT===Math.round(dur*0.25)){
      // the tallest segment's top four floors come off in one piece
      let best=null; for(const s of lgSegs){ let t=streetRow; for(let c=s.c0;c<=s.c1;c++) t=Math.min(t,lgColTop(c)); if(!best||t<best.t) best={s,t}; }
      if(best && best.t<streetRow-6){
        const vx=(Math.random()<0.5?-1:1)*0.35;
        for(let r=best.t;r<best.t+4;r++) for(let c=best.s.c0;c<=best.s.c1;c++) if(cityGridArr[r][c]!==" "){
          setCh(cityGridArr,r,c," ");
          lgParts.push({x:c,y:r,vx,vy:-0.3,g:0.05,ch:"#",mode:'lgb'+best.s.col,col:best.s.col,brick:true,life:200});
        }
        lgText("CLICK.",(best.s.c0+best.s.c1)/2,best.t-2,'lgclick',20);
      }
    }
    if(key==='head'){
      if(!lgHead){ const F=lgFigs[lgFigs.length-1]; F.head=false; lgHead={x:F.x+1, y:streetRow-3, vy:-0.8, sing:false}; }
      lgHead.x+=0.5; lgHead.vy+=0.12; lgHead.y+=lgHead.vy;
      const floor=streetRow-1-lgPile[Math.max(0,Math.min(COLS-1,Math.round(lgHead.x)))];
      if(lgHead.y>=floor){ lgHead.y=floor; lgHead.vy=lgHead.vy>0.4?-lgHead.vy*0.5:0; }
      lgHead.sing=lgBeatN%2===0; if(lgT%4===0) lgNote(lgHead.x,lgHead.y-1);
      if(lgHead.x>COLS-2) lgHead.x=COLS-2;
    }
    if(key==='gown'){
      if(!lgGown) lgGown={x:-3, hop:false};
      lgGown.x=Math.min(cx-6,lgGown.x+0.5);
      if(f>0.8 && lgT%20===0) lgText("click",lgGown.x+1,streetRow-3,'lgclick',10);
    }
    if(key==='scream'){ lgGown.hop=(lgT>>2)%2===0; lgShake=2; }
    if(key==='final' && !lgExploded){
      // the whole city comes apart: every brick becomes a particle aimed at one central heap
      lgExploded=true; lgHead=null; lgGown=null;
      const T=lgDur(LG_BEATS[lgIdx+1].cap);
      const addObj=(x,y,col)=>lgParts.push({x,y,vx:(cx-x)/T*(0.6+Math.random()*0.8)+(Math.random()-0.5)*0.6,vy:-1.2-Math.random()*1.4,g:0.06,ch:"#",mode:'lgb'+col,col,brick:true,life:400});
      for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c+=2){
        if(cityGridArr[r][c]===" ") continue;
        const s=lgSegOf[c]>=0?lgSegs[lgSegOf[c]]:null; addObj(c,r,s?s.col:0);
      }
      for(let r=0;r<streetRow;r++) cityGridArr[r]=" ".repeat(COLS);
      for(const F of lgFigs) addObj(F.x,streetRow-2,F.col);
      for(const car of lgCars) for(let k=0;k<3;k++) addObj(car.x+k*2,streetRow-2,car.bus?2:car.col);
      for(const t of lgTrees) for(let k=0;k<3;k++) addObj(t.x,streetRow-2,3);
      // the street's existing loose bricks get swept up into the heap too
      for(let c=0;c<COLS;c++) while(lgPile[c]>0){ lgPile[c]--; addObj(c,streetRow-1,lgPileCol[c].pop()||0); }
      lgShake=6;
    }
    if(key==='book'){
      const w=Math.max(19,Math.min(27,COLS-6))|1;
      let peak=0; for(let c=0;c<COLS;c++) peak=Math.max(peak,lgPile[c]);
      const restY=streetRow-1-peak-5+1;
      if(!lgBook) lgBook={x:Math.round(cx-w/2), y:-6, w, open:false};
      lgBook.y=Math.min(restY,-6+(restY+6)*Math.min(1,f/0.8)); lgBook.x=Math.round(cx-w/2+Math.sin(f*Math.PI*3)*4*(1-f));
      if(f>=0.8 && !lgBook.open){ lgBook.open=true; lgText("flump",cx,restY-2,'lgtext',18); }
    }
    if(key==='hum'){
      if(!lgHum && lgBook){ const x=Math.min(COLS-2,lgBook.x+lgBook.w+1); lgHum={x, y:streetRow-2-lgPile[x]}; }
      if(lgHum && lgT%8===0) lgParts.push({x:lgHum.x,y:lgHum.y-1,vx:0.05,vy:-0.15,g:0,ch:"\u266a",mode:'lgnote',life:24});
      if(lgHum && lgT%24===4) lgText("hmm hmm",lgHum.x,lgHum.y-2,'lgnote',20);
    }

    if(lgShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*lgShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*lgShake).toFixed(1)+"px)"; lgShake*=0.85; }
    else { stage.style.transform=""; lgShake=0; }
    lgStepFx();
    lgRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffd500"; sub.style.textShadow="0 0 8px #d01010";
    lgT++;
    if(lgT>=dur){ lgT=0; lgIdx++; if(lgIdx>=LG_BEATS.length){ phase='lg_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='lg_hold'){
    stage.style.transform="";
    if(lgHum && lgT%10===0) lgParts.push({x:lgHum.x,y:lgHum.y-1,vx:0.05,vy:-0.15,g:0,ch:"\u266a",mode:'lgnote',life:24});
    lgT++;
    lgStepFx();
    lgRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=LG_HOLD; sub.style.color="#ffd500"; sub.style.textShadow="0 0 8px #d01010";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m84_start(){
  attackMode='lg_run';
  cmd.style.color="#ffd500"; cmd.style.textShadow="0 0 20px #d01010";
  lgStarted=false; phase='lg_run';
}

function __m84_reset(){
  lgStarted=false; lgT=0; lgIdx=0; lgG=null; lgSegs=[]; lgSegOf=[]; lgFigs=[]; lgCars=[]; lgTrees=[]; lgParts=[]; lgTexts=[];
  lgPile=[]; lgPileCol=[]; lgBeatP=6; lgBeatN=0; lgHead=null; lgGown=null; lgBook=null; lgExploded=false; lgHum=null; lgShake=0;
  stage.style.transform="";
}

registerMethod(84, { start: __m84_start, resetFn: __m84_reset, loopFn: __m84_loop, phaseNames: ['lg_run','lg_hold'] });
