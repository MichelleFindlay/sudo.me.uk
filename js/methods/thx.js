let txStarted=false, txT=0, txIdx=0, txG=null, txMG=null, txTones=[], txCv=0, txLoud=0, txThick=0;
let txParts=[], txTexts=[], txAerials=[], txPigeons=[], txDogs=[], txPuddles=[], txCars=[], txCrowd=[];
let txRiverH=0, txSway=0, txShattered=false, txVol=6, txButton=null, txCrumbleH=null, txShake=0;

// ---- THX: The Audience Is Listening ----
// the Deep Note is drawn as a handful of tone lines across the sky; txCv (0..1) is how far
// they've converged, and at 1 they lie on top of each other as one chord band that then
// thickens. Everything in town reacts to txCv / txLoud, until it all resonates into dust
const TX_BEATS=[
  {key:'est',      cap:"THE PEACEFUL CITY AT NIGHT. A HUGE OUTDOOR CINEMA SCREEN STANDS IN THE MAIN SQUARE."},
  {key:'hush',     cap:"EVERYONE HAS GATHERED WITH POPCORN. THE LIGHTS DIM, AND A HUSH FALLS."},
  {key:'murmur',   cap:"IT BEGINS AS A LOW, SHAPELESS SWIRL OF TONES, LIKE A DOZEN ORCHESTRAS TUNING UP IN DIFFERENT ROOMS.", cv:0},
  {key:'pigeons',  cap:"PIGEONS TILT THEIR HEADS. A FEW CAR ALARMS CHIRP NERVOUSLY IN REPLY.", cv:0.1},
  {key:'rise',     cap:"THE TONES START SLIDING UPWARD AND CONVERGING. WINDOWS HUM. TEACUPS RATTLE ON SAUCERS.", cv:0.35},
  {key:'glasses',  cap:"A MAN'S GLASSES SLIDE DOWN HIS NOSE ON THEIR OWN.", cv:0.45},
  {key:'popcorn',  cap:"IT KEEPS CLIMBING IN PITCH AND VOLUME. THE POPCORN STARTS POPPING AGAIN INSIDE THE BOXES.", cv:0.6},
  {key:'dogs',     cap:"PUDDLES RIPPLE IN PERFECT RINGS, AND EVERY DOG IN THE CITY SITS DOWN AT ONCE.", cv:0.7},
  {key:'hair',     cap:"THE TONES ARE ALMOST TOGETHER NOW, AND THE SOUND IS PHYSICAL. HAIR STANDS ON END.", cv:0.85},
  {key:'aerials',  cap:"ROOFTOP AERIALS BEND TOWARD THE SCREEN. THE RIVER STANDS UP IN A WAVE, AND WAITS.", cv:0.93},
  {key:'chord',    cap:"THE NOTES LOCK INTO ONE COLOSSAL, PERFECT CHORD.", cv:1},
  {key:'shatter',  cap:"EVERY WINDOW IN THE CITY SHATTERS AT ONCE, IN TUNE. THE GLASS HANGS IN THE AIR, SHIMMERING.", cv:1},
  {key:'nostop',   cap:"IT DOESN'T STOP. THE CHORD JUST KEEPS GOING.", cv:1},
  {key:'button',   cap:"THE PROJECTIONIST HITS THE VOLUME-DOWN BUTTON WITH MOUNTING PANIC.", cv:1},
  {key:'falloff',  cap:"THE BUTTON FALLS OFF. THE VOLUME GOES UP.", cv:1},
  {key:'sway',     cap:"EVERY BUILDING FINDS ITS RESONANT FREQUENCY AND STARTS SWAYING IN TIME.", cv:1},
  {key:'bells',    cap:"BRIDGES BOUNCE LIKE TRAMPOLINES. THE CLOCK TOWER RINGS EVERY BELL AT ONCE, ALL PERFECTLY IN KEY.", cv:1},
  {key:'part',     cap:"THE WHOLE CITY IS NOW PART OF THE CHORD.", cv:1},
  {key:'sustain',  cap:"THE CHORD HOLDS, IMPOSSIBLY LONG. THE BUILDINGS CRUMBLE INTO FINE, HARMONICALLY PLEASING DUST.", cv:1},
  {key:'last',     cap:"THE CINEMA SCREEN IS THE LAST THING STANDING, STILL GLOWING.", cv:1},
  {key:'silence',  cap:"TOTAL SILENCE."},
  {key:'crisp',    cap:"A LONE SURVIVOR, COVERED IN DUST, SLOWLY TAKES A CRISP OUT OF A BAG."},
  {key:'shhh',     cap:"SOMEWHERE IN THE RUINS, SOMEONE SAYS \"shhh.\""}
];
const TX_HOLD="THE AUDIENCE IS LISTENING. — press RESET";
const TX_LOGO=["TTT H H X X"," T  HHH  X "," T  H H X X"];
const txClockArt=["  ^  "," (o) ","|ooo|","| | |","|   |","|___|"];
const txBoothArt=["[====]","|PROJ|","|_[]_|"];
const txDogStand=["o__~","|  |"], txDogSit=["o_~ ","\\_| "];

function txDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function txPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function txColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function txClearCols(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){ setCh(cityGridArr,r,c," "); txMG[r][c]=null; } }
function txText(s,x,y,mode,life){ txTexts.push({s,x,y,mode:mode||'txtext',life:life||22}); }
function txProtected(c){ const g=txG; return c>=g.scrL-1 && c<=g.scrR+1; }

function txInit(){
  txStarted=true; txT=0; txIdx=0; txCv=0; txLoud=0; txThick=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  txMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  // the screen in the main square, the crowd in front of it, the booth off to one side
  const sw=Math.max(17,Math.min(31,Math.round(COLS*0.3)))|1, sh=Math.max(7,Math.min(11,Math.round(streetRow*0.3)));
  const scrL=Math.round(cx-sw/2), scrR=scrL+sw-1, scrTop=Math.max(4,streetRow-4-sh);
  const rv0=Math.round(COLS*0.14), rv1=rv0+Math.max(5,Math.round(COLS*0.05));
  const clock=Math.round(COLS*0.84);
  const booth=Math.max(0,scrL-9);
  txG={sw,sh,scrL,scrR,scrTop,rv0,rv1,clock,booth,yc:Math.max(3,Math.round(streetRow*0.18))};
  txClearCols(booth-1,scrR+3); txClearCols(rv0-1,rv1+1); txClearCols(clock-3,clock+3);
  txG.clockTop=(function(){ const top=streetRow-txClockArt.length; for(let i=0;i<txClockArt.length;i++) for(let j=0;j<txClockArt[i].length;j++){ const ch=txClockArt[i][j]; if(ch!==" "){ setCh(cityGridArr,top+i,clock-2+j,ch); txMG[top+i][clock-2+j]='txclock'; } } return top; })();
  // the tones of the Deep Note, starting all over the sky
  txTones=[]; for(let i=0;i<8;i++) txTones.push({y0:2+Math.random()*(streetRow*0.45), k0:0.05+Math.random()*0.35, a0:1+Math.random()*2.5, ph:Math.random()*6, w:0.05+Math.random()*0.2, hue:i});
  txCrowd=[]; for(let c=scrL+1;c<scrR;c+=2) txCrowd.push({c, box:Math.random()<0.4, hair:0});
  txAerials=[]; for(let i=0;i<8;i++){ const c=(Math.random()*COLS)|0; if(!txProtected(c) && txColTop(c)<streetRow-3) txAerials.push({c}); }
  txPigeons=[]; for(let i=0;i<5;i++){ const c=(Math.random()*(COLS-2))|0; if(!txProtected(c) && txColTop(c)<streetRow-2) txPigeons.push({c}); }
  txDogs=[]; for(const f of [0.3,0.62,0.95]){ const c=Math.round(COLS*f)-2; if(c>0 && !txProtected(c) && !txProtected(c+4)) txDogs.push({c}); }
  txPuddles=[Math.round(COLS*0.08),Math.round(COLS*0.72)].map(c=>({c}));
  txCars=[Math.round(COLS*0.27),Math.round(COLS*0.68)].filter(c=>!txProtected(c)).map(c=>({c}));
  txParts=[]; txTexts=[]; txRiverH=0; txSway=0; txShattered=false; txVol=6; txButton=null; txCrumbleH=null; txShake=0;
  document.body.style.background="#0c0c1c";
}

function txRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!txMG||txMG.length!==ROWS||txMG[0].length!==COLS) txMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const g=txG, key=beat?beat.key:'hold', ended=['silence','crisp','shhh','hold'].includes(key);
  let grid=cityGridArr.slice();
  let mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){ const mr=txMG[r]; for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c]; }
  // humming windows
  if(txCv>0.3 && !txShattered) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if((ch==="."||ch===":") && Math.random()<txCv*0.3) setCh(grid,r,c,ch==="."?":":"."); }
  // resonance: every row sways sideways, more at the top; the screen and square stay put
  if(txSway>0){
    for(let r=0;r<streetRow;r++){
      const off=Math.round(txSway*Math.sin(txT*0.3)*(streetRow-1-r)/streetRow);
      if(!off) continue;
      const row=grid[r].split(""), mrow=mg[r].slice(), src=grid[r];
      for(const [L,R] of [[0,g.scrL-3],[g.scrR+3,COLS-1]]){
        for(let c=L;c<=R;c++){ const s=c-off; row[c]=(s>=L&&s<=R)?src[s]:" "; mg[r][c]=(s>=L&&s<=R)?mrow[s]:'city'; }
      }
      grid[r]=row.join("");
    }
  }
  // the tones: drawn behind everything, into empty sky only
  if(!ended && beat && beat.cv!==undefined){
    const dens=0.35+0.65*Math.min(1,txLoud);
    for(const t of txTones){
      const cv=txCv, y=t.y0+(g.yc-t.y0)*cv, k=t.k0+(0.15-t.k0)*cv, a=t.a0+(1.2-t.a0)*cv, ph=t.ph*(1-cv);
      for(let c=0;c<COLS;c++){
        if(Math.random()>dens) continue;
        const r=Math.round(y+a*Math.sin(k*c+ph+txT*t.w*(1-cv)+txT*0.2*cv));
        if(r<0||r>=streetRow||grid[r][c]!==" ") continue;
        setCh(grid,r,c,cv>=1?"=":"~"); setMode(mg,r,c,cv>=1?'txchord':'txtone'+(t.hue%4));
      }
    }
    for(let k=1;k<=txThick;k++) for(const d of [-k,k]) for(let c=0;c<COLS;c++){
      const r=Math.round(g.yc+1.2*Math.sin(0.15*c+txT*0.2)+d); if(r<0||r>=streetRow||grid[r][c]!==" "||Math.random()<0.2) continue;
      setCh(grid,r,c,"="); setMode(mg,r,c,'txchord');
    }
  }
  // aerials, pigeons, dogs, puddles, car alarms
  if(!txCrumbleH) for(const A of txAerials){
    const top=txColTop(A.c); if(top>=streetRow-1) continue;
    const bend=txCv>0.9?(A.c<cx?"/":"\\"):"|";
    txPlace(grid,mg,[txCv>0.9?bend:"T",bend],A.c,top-2,'txaerial');
  }
  if(['pigeons','rise','glasses'].includes(key)) for(const P of txPigeons){ const top=txColTop(P.c); txPlace(grid,mg,[(txT>>3)%2?"o>":"o^"],P.c,top-1,'txpigeon'); }
  if(!txCrumbleH) for(const D of txDogs) txPlace(grid,mg,txCv>=0.7?txDogSit:txDogStand,D.c,streetRow-2,'gtdog');
  for(const P of txPuddles){
    setCh(grid,streetRow,P.c,"~"); setMode(mg,streetRow,P.c,'water');
    if(key==='dogs'){ const rr=(txT>>1)%5+1; txPlace(grid,mg,["("],P.c-rr,streetRow-1,'water'); txPlace(grid,mg,[")"],P.c+rr,streetRow-1,'water'); }
  }
  if(!txCrumbleH) for(const C of txCars){
    const alarm=key==='pigeons' && (txT>>2)%2;
    txPlace(grid,mg,["o=o"],C.c,streetRow-1,alarm?'txalarm':'car');
  }
  // river, bridge
  if(!txCrumbleH || txCrumbleH.q<0.6){
    for(let c=g.rv0;c<=g.rv1;c++){ setCh(grid,streetRow,c,((c+txT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
    for(let k=0;k<Math.round(txRiverH);k++){ const r=streetRow-1-k; for(let c=g.rv0;c<=g.rv1;c++){ setCh(grid,r,c,k===Math.round(txRiverH)-1?"@":"\u2248"); setMode(mg,r,c,'water'); } }
    if(txRiverH<1){
      const bounce=['bells','part','sustain'].includes(key)?Math.round(2*Math.sin(txT*0.6)):0;
      for(let c=g.rv0-1;c<=g.rv1+1;c++){ const r=streetRow-3-bounce*Math.sin(Math.PI*(c-g.rv0+1)/(g.rv1-g.rv0+2)); setCh(grid,Math.round(r),c,"="); setMode(mg,Math.round(r),c,'oobridge'); }
    }
  }
  // the screen
  const flick=key==='silence'||key==='crisp'||key==='shhh'||key==='hold';
  for(let r=g.scrTop;r<g.scrTop+g.sh;r++) for(let c=g.scrL;c<=g.scrR;c++){
    const edge=r===g.scrTop||r===g.scrTop+g.sh-1, side=c===g.scrL||c===g.scrR;
    setCh(grid,r,c,edge?(side?"+":"-"):(side?"|":" ")); setMode(mg,r,c,'txframe');
  }
  for(const c of [g.scrL+1,g.scrR-1]) for(let r=g.scrTop+g.sh;r<streetRow;r++){ setCh(grid,r,c,"|"); setMode(mg,r,c,'txframe'); }
  const midR=g.scrTop+Math.floor(g.sh/2);
  if(flick){
    if(Math.random()<0.85){
      const l1="Film will begin", l2="shortly.";
      txPlace(grid,mg,[l1],Math.round(cx-l1.length/2),midR-1,'txscreen'); txPlace(grid,mg,[l2],Math.round(cx-l2.length/2),midR,'txscreen');
    }
  } else if(key!=='est'){
    txPlace(grid,mg,TX_LOGO,Math.round(cx-TX_LOGO[0].length/2),midR-1,txCv>=1?'txlogohot':'txlogo');
    const tag="THE AUDIENCE IS LISTENING";
    if(g.sw-2>=tag.length && txCv>=1) txPlace(grid,mg,[tag],Math.round(cx-tag.length/2),midR+2,'txlogo');
  }
  // the crowd (heads, popcorn boxes, hair standing on end), the man with the glasses
  if(!txCrumbleH || txCrumbleH.q<0.5){
    for(const P of txCrowd){
      setCh(grid,streetRow-2,P.c,"o"); setMode(mg,streetRow-2,P.c,'txcrowd');
      setCh(grid,streetRow-1,P.c,P.box?"u":"|"); setMode(mg,streetRow-1,P.c,P.box?'txpopcorn':'txcrowd');
      if(txCv>=0.85){ setCh(grid,streetRow-3,P.c,"^"); setMode(mg,streetRow-3,P.c,'txcrowd'); }
    }
    if(key==='glasses'){
      const gx=g.scrL+2, gy=streetRow-6, slide=Math.min(1,f/0.7);
      txPlace(grid,mg,[" ___ ","(o o)"," \\_/ "],gx,gy,'txface');
      txPlace(grid,mg,["=O-O="],gx,gy+1+Math.round(slide),'txglasses');
    }
  }
  txPlace(grid,mg,txBoothArt,g.booth,streetRow-txBoothArt.length,'txbooth');
  if(['button','falloff','sway'].includes(key) || txVol>6){
    const bar="VOL ["+"#".repeat(Math.min(10,txVol))+"-".repeat(Math.max(0,10-txVol))+"]"+(txVol>10?" "+txVol:"");
    txPlace(grid,mg,[bar],Math.max(0,g.booth),streetRow-txBoothArt.length-2,txVol>10?'txalarm':'txtext');
    if(!txButton || txButton.on) txPlace(grid,mg,["(-)"],g.booth+6,streetRow-2,'txbutton');
  }
  if(txButton && !txButton.on) txPlace(grid,mg,["(-)"],txButton.x,txButton.y,'txbutton');
  if(key==='crisp'||key==='shhh'||key==='hold'){
    const sx=g.scrR+4<COLS-4?g.scrR+4:g.scrL-6;
    txPlace(grid,mg,[" o ","/|\\","/ \\"],sx,streetRow-3,'txsurvivor');
    txPlace(grid,mg,["[]"],sx+3,streetRow-2,'txcrispbag');
  }
  if(key==='shhh' && f<0.9) mtDrawBubble(grid,mg,Math.max(6,Math.round(COLS*0.2)),streetRow-2,"shhh.");
  for(const p of txParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of txTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function txStepFx(){
  for(const p of txParts){
    if(p.hang>0){ p.hang--; p.x+=(Math.random()-0.5)*0.1; }
    else { p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; }
    if(p.sine) p.x+=Math.sin(p.y*0.6)*0.3;
    p.life--;
  }
  txParts=txParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=-1 && p.y<streetRow);
  for(const t of txTexts){ t.life--; if(t.life%3===0) t.y--; }
  txTexts=txTexts.filter(t=>t.life>0);
  if(txButton && !txButton.on){ txButton.y=Math.min(streetRow-1,txButton.y+0.4); }
}
function txApplyShake(){
  if(txShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*txShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*txShake).toFixed(1)+"px)"; }
  else stage.style.transform="";
}

function __m83_loop(){
  if(phase==='tx_run'){
    if(!txStarted) txInit();
    const beat=TX_BEATS[txIdx], dur=txDur(beat.cap), f=txT/Math.max(1,dur-1), key=beat.key, g=txG;
    let interval=80;
    // the tones ease towards this beat's convergence; the volume keeps creeping up
    if(beat.cv!==undefined){ txCv+=(beat.cv-txCv)*0.06; if(beat.cv>=1 && txCv>0.985) txCv=1; txLoud=Math.min(1.5,txLoud+0.004); }

    if(key==='hush'){ document.body.style.background="rgb("+[12,12,28].map(v=>Math.round(v*(1-f*0.6))).join(",")+")"; }
    else if(key==='pigeons'){ if(txT%10===3 && txCars.length) txText("weeoo",txCars[(txT/10|0)%txCars.length].c+1,streetRow-3,'txalarm',14); }
    else if(key==='rise'){ if(txT%9===0) txText(Math.random()<0.5?"rattle":"clink",(Math.random()*COLS)|0,streetRow*0.5,'txtext',14); txShake=1; }
    else if(key==='popcorn'){
      for(const P of txCrowd) if(P.box && Math.random()<0.3) txParts.push({x:P.c,y:streetRow-2,vx:(Math.random()-0.5)*0.4,vy:-0.4-Math.random()*0.3,g:0.06,ch:"*",mode:'txpopcorn',life:12});
      txShake=1.5;
    }
    else if(key==='dogs'){ txShake=2; }
    else if(key==='aerials'){ txRiverH=Math.min(streetRow*0.5,txRiverH+0.4); txShake=2.5; }
    else if(key==='chord'){
      if(txT===Math.round(dur*0.2)){ flash.style.transition="opacity 0.03s"; flash.style.opacity=0.5; setTimeout(()=>{ flash.style.transition="opacity 0.6s"; flash.style.opacity=0; },60); }
      txShake=4;
    }
    else if(key==='shatter'){
      if(!txShattered){
        // every window goes at once; some of the glass hangs there for a moment
        txShattered=true;
        for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){
          const ch=cityGridArr[r][c]; if(ch!=="."&&ch!==":") continue;
          setCh(cityGridArr,r,c," ");
          if(Math.random()<0.35) txParts.push({x:c,y:r,vx:(Math.random()-0.5)*0.3,vy:0,g:0.05,ch:Math.random()<0.5?"*":"'",mode:'txglass',life:dur*1.4,hang:Math.round(dur*0.55)});
        }
        txText("TSSHHINNG",cx,g.yc+3,'txglass',30);
      }
      txShake=4;
    }
    else if(key==='nostop'){ txThick=Math.min(3,Math.round(f*3)); txShake=4.5; }
    else if(key==='button'){
      if(txT%5===0) txText(txT%15===0?"CLICK":"click",g.booth+7,streetRow-4,'txtext',10);
      txVol=6+((txT/15)|0)%2;                                           // it does nothing
    }
    else if(key==='falloff'){
      if(txT===Math.round(dur*0.2)){ txButton={on:false, x:g.booth+6, y:streetRow-2}; txText("plink",g.booth+7,streetRow-4,'txtext',16); }
      if(f>0.35) txVol=Math.min(11,6+Math.round((f-0.35)/0.6*5));
      txShake=5;
    }
    else if(key==='sway'||key==='bells'||key==='part'){
      txSway=Math.min(3,txSway+0.05); txShake=5;
      if(key==='bells' && txT%4===0) txText("DONG",g.clock+(Math.random()-0.5)*6,g.clockTop-2,'txchord',14);
    }
    else if(key==='sustain'){
      // buildings crumble top-down into a fine, gently waving dust; the screen is spared
      if(!txCrumbleH){ txCrumbleH={q:0, H:Array.from({length:COLS},(_,c)=>streetRow-txColTop(c)), jit:Array.from({length:COLS},()=>Math.random())}; }
      txCrumbleH.q=f; txSway=Math.max(0,txSway-0.05);
      for(let c=0;c<COLS;c++){
        if(txProtected(c)) continue;
        const qc=Math.max(0,Math.min(1,f*1.3-txCrumbleH.jit[c]*0.3)), keep=Math.round(txCrumbleH.H[c]*(1-qc)), cut=streetRow-keep;
        for(let r=0;r<cut;r++) if(cityGridArr[r][c]!==" "){
          if(Math.random()<0.2) txParts.push({x:c,y:r,vx:(Math.random()-0.5)*0.1,vy:-0.08-Math.random()*0.1,g:0,ch:".",mode:'txdust',life:40,sine:true});
          setCh(cityGridArr,r,c," "); txMG[r][c]=null;
        }
      }
      txShake=4;
    }
    else if(key==='last'){ txShake=Math.max(0,txShake-0.3); txThick=Math.max(0,txThick-0.05); }
    else if(key==='silence'){ txShake=0; txCv=0; document.body.style.background="#050508"; }
    else if(key==='crisp'){ if(txT===Math.round(dur*0.6)) txText("crunch",(g.scrR+4<COLS-4?g.scrR+5:g.scrL-5),streetRow-5,'txtext',24); }

    txShake*=0.98;
    txApplyShake();
    txStepFx();
    txRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#e8d8a0"; sub.style.textShadow="0 0 8px #806020";
    txT++;
    if(txT>=dur){ txT=0; txIdx++; if(txIdx>=TX_BEATS.length){ phase='tx_hold'; } }
    timer=setTimeout(loop,interval);
  }else if(phase==='tx_hold'){
    stage.style.transform="";
    txStepFx(); txT++;
    txRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=TX_HOLD; sub.style.color="#e8d8a0"; sub.style.textShadow="0 0 8px #806020";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m83_start(){
  attackMode='tx_run';
  cmd.style.color="#e8d8a0"; cmd.style.textShadow="0 0 20px #806020";
  txStarted=false; phase='tx_run';
}

function __m83_reset(){
  txStarted=false; txT=0; txIdx=0; txG=null; txMG=null; txTones=[]; txCv=0; txLoud=0; txThick=0;
  txParts=[]; txTexts=[]; txAerials=[]; txPigeons=[]; txDogs=[]; txPuddles=[]; txCars=[]; txCrowd=[];
  txRiverH=0; txSway=0; txShattered=false; txVol=6; txButton=null; txCrumbleH=null; txShake=0;
  stage.style.transform="";
}

registerMethod(83, { start: __m83_start, resetFn: __m83_reset, loopFn: __m83_loop, phaseNames: ['tx_run','tx_hold'] });
