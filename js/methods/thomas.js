let ttStarted=false, ttT=0, ttIdx=0, ttG=null, ttMG=null, ttX=0, ttFace='happy', ttCrate=null, ttCroissant=false, ttBike=null;
let ttBus=null, ttCyclist=null, ttEngines=[], ttParts=[], ttTexts=[], ttPile=null, ttBoss=null, ttShake=0, ttBuffer=true, ttHall=true;

// ---- THOMAS THE TANK ENGINE: a very important job ----
// Thomas's x is the left edge of his body; once he leaves the rails, the rows he occupies
// are carved out of every building he drives through, so each shortcut leaves a tunnel.
// Three more engines converge on the town hall from other directions, timed to arrive on
// the same frame as him; the hall turns into a rubble mound with faces poking out of it
const TT_BEATS=[
  {key:'est',     cap:"MORNING RUSH HOUR. A CHEERFUL BLUE TANK ENGINE WITH A NUMBER ONE ON HIS SIDE CHUFFS INTO THE STATION, WHISTLING.", station:true},
  {key:'job',     cap:"THE STATIONMASTER ANNOUNCES THAT TODAY THOMAS HAS A VERY IMPORTANT JOB.", bossSay:"A VERY IMPORTANT JOB!"},
  {key:'crate',   cap:"DELIVER ONE SINGLE, ENORMOUS CRATE TO THE TOWN HALL. ON TIME."},
  {key:'problem', cap:"THE TOWN HALL IS NOT ON THE RAILWAY."},
  {key:'look',    cap:"THOMAS LOOKS AT THE TOWN HALL. THEN AT THE TRACKS. THEN AT THE TOWN HALL AGAIN."},
  {key:'smile',   cap:"HE SMILES A BIT WIDER."},
  {key:'off',     cap:"THOMAS SIMPLY LEAVES THE TRACK.", u:0.0},
  {key:'street',  cap:"HE CHUFFS DOWN THE HIGH STREET ON BARE COBBLES, SPARKS FLYING, FACE COMPLETELY CALM. BUSES SWERVE.", u:0.15},
  {key:'bike',    cap:"A CYCLIST'S BIKE ENDS UP WEDGED ON HIS BUFFER.", u:0.27},
  {key:'bakery',  cap:"THE QUICKEST ROUTE IS A STRAIGHT LINE. HE GOES STRAIGHT THROUGH A BAKERY, AND OUT WITH A CROISSANT ON HIS FUNNEL.", u:0.45},
  {key:'library', cap:"THEN A LIBRARY. THEN A SHOPPING CENTRE.", u:0.65},
  {key:'lounge',  cap:"THEN SOMEONE'S FRONT ROOM. HE WAVES AT A STARTLED FAMILY ON THEIR SOFA.", u:0.8},
  {key:'speed',   cap:"HIS WHEELS SPIN FASTER. STEAM POURS OUT IN HUGE CLOUDS. HIS WHISTLE GETS HIGHER AND MORE FRANTIC.", u:0.9},
  {key:'rattle',  cap:"THE CRATE STARTS RATTLING. HIS SMILE HASN'T CHANGED AT ALL, WHICH MAKES IT WORSE.", u:1.0},
  {key:'others',  cap:"OTHER ENGINES APPEAR ON THE HORIZON, ROARING IN FROM ALL DIRECTIONS, ALL FACES CHEERFUL."},
  {key:'nobrake', cap:"ALL OF THEM ARE HEADING FOR THE SAME TOWN HALL. NOBODY IS BRAKING."},
  {key:'crash',   cap:"EVERY ENGINE REACHES THE TOWN HALL AT EXACTLY THE SAME MOMENT."},
  {key:'rubble',  cap:"THE TOWN HALL IS NOW A VERY LARGE PILE OF RUBBLE, WITH A LOT OF SURPRISED FACES POKING OUT OF IT."},
  {key:'silence', cap:"SILENCE. THEN THE DUST CLEARS."},
  {key:'label',   cap:"THE CRATE IS INTACT, ON TOP OF THE RUBBLE. ITS LABEL READS:"},
  {key:'watch',   cap:"THE STATIONMASTER CHECKS HIS POCKET WATCH, AND NODS."},
  {key:'useful',  cap:"THOMAS HAS BEEN A REALLY USEFUL ENGINE.", bossSay:"A REALLY USEFUL ENGINE."},
  {key:'toot',    cap:"ONE LAST, SLIGHTLY WHEEZY TOOT. HIS FACE SMILES DIRECTLY AT THE CAMERA. FOR SLIGHTLY TOO LONG."}
];
const TT_HOLD="A REALLY USEFUL ENGINE. — press RESET";
const TT_LABEL=["Contents: 1x replacement town hall.","Some assembly required."];

const ttBody=["       _  "," ____ | | ","|[]  |=|_|","| 1  |====","|____|____"," (O)   (O) (O) "];
const ttFaces={
  happy:[" .-. ","(o o)","( u )","'---'"], left:[" .-. ","(oo )","( u )","'---'"], right:[" .-. ","( oo)","( u )","'---'"],
  grin:[" .-. ","(o o)","(\\_/)","'---'"], wild:[" .-. ","(O O)","(\\_/)","'---'"], surprised:[" .-. ","(O O)","( o )","'---'"]
};
const ttCrateArt=["+-----+","|CRATE|","+-----+"];
const ttFlatbed=["[=======]"," o     o "];
const ttBossArt=[" ___ ","[___]"," (o) ","/|#|\\"," |#| "," / \\ "];
const ttBusArt=[" _______ ","|[][][]|]","'o-----o'"];
const ttBikeArt=["o^o"];
const ttCyclistArt=[" o ","/|\\"];
const ttHallArt=["   /\\   ","  /  \\  "," |TOWN| "," |HALL| ","[======]","|| || ||","||_||_||"];
const ttShops={
  bakery:{art:[" ______ ","|BAKERY|","|[]  []|","|______|"], mode:'ttbakery'},
  library:{art:[" _______ ","|LIBRARY|","|=|=|=|=|","|_______|"], mode:'ttlibrary'},
  shops:{art:[" ________ ","| SHOPS  |","|[SALE]  |","|________|"], mode:'ttshops'},
  house:{art:["   /\\   ","  /  \\  "," /    \\ ","|      |","|______|"], mode:'tthouse'}
};

function ttDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function ttPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function ttClearCols(c0,c1,r0){ for(let r=r0||0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){ setCh(cityGridArr,r,c," "); ttMG[r][c]=null; } }
function ttStamp(art,left,bottom,mode){
  const top=bottom-art.length+1;
  for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){
    const r=top+i, c=left+j, ch=art[i][j]; if(ch===" "||r<0||r>=streetRow||c<0||c>=COLS) continue;
    setCh(cityGridArr,r,c,ch); ttMG[r][c]=mode;
  }
  return top;
}
function ttText(s,x,y,mode,life){ ttTexts.push({s,x,y,mode:mode||'tttext',life:life||20}); }
function ttSteam(x,y,big){ ttParts.push({x,y,vx:(Math.random()-0.6)*0.4,vy:-0.3-Math.random()*0.3,g:0,ch:big?(Math.random()<0.5?"O":"@"):"o",mode:'ttsteam',life:big?24:14}); }

// one engine, body plus face, facing either way; returns nothing, draws straight into the grid
function ttDrawEngine(grid,mg,left,dir,bodyMode,face){
  const top=streetRow-ttBody.length;
  const rows=ttBody.map((b,i)=>(i>=1&&i<=4)?b.padEnd(10," ").slice(0,10)+ttFaces[face][i-1]:b.padEnd(15," ").slice(0,15));
  const lines=dir<0?rows.map(r=>r.padEnd(15," ").split("").reverse().join("")):rows;
  for(let i=0;i<lines.length;i++) for(let j=0;j<lines[i].length;j++){
    const ch=lines[i][j]; if(ch===" ") continue;
    const r=top+i, c=Math.round(left)+j; if(c<0||c>=COLS||r<0) continue;
    const faceCol=dir<0?j<5:j>=10, isFace=faceCol && i>=1 && i<=4;
    setCh(grid,r,c,ch);
    setMode(mg,r,c,isFace?'ttface':(ch==="O"?'ttwheel':(ch==="1"?'ttnum':(ch==="["||ch==="]"?'ttwin':bodyMode))));
  }
}

function ttInit(){
  ttStarted=true; ttT=0; ttIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  ttMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const at=f=>Math.round(COLS*f);
  const g={trackEnd:Math.max(at(0.28),30), hall:at(0.86)};
  // his route: from just past the buffer stop to a run-up short of the hall; every stop
  // along the way is a fraction of that route, so the order holds on any screen width
  g.routeStart=g.trackEnd-12; g.routeEnd=Math.max(g.routeStart+10,(g.hall-4)-15-Math.max(6,at(0.08)));
  g.xAt=u=>g.routeStart+(g.routeEnd-g.routeStart)*u;
  ttG=g;
  ttClearCols(0,g.trackEnd+16);
  // the buildings he'll take a shortcut through, and the town hall at the end of it all
  for(const [k,u] of [['bakery',0.38],['library',0.55],['shops',0.66],['house',0.78]]){
    const sh=ttShops[k], w=sh.art[0].length; g[k]=Math.round(g.xAt(u)+15-w/2);
    ttClearCols(g[k]-1,g[k]+w); ttStamp(sh.art,g[k],streetRow-1,sh.mode);
  }
  ttClearCols(g.hall-5,g.hall+5);
  g.hallTop=ttStamp(ttHallArt,g.hall-4,streetRow-1,'tthall');
  ttX=-18; ttFace='happy'; ttCrate=null; ttCroissant=false; ttBike=null;
  ttBus={x:Math.round(g.xAt(0.12))+17, y:0, gone:false}; ttCyclist={x:Math.round(g.xAt(0.22))+15, state:'ride', y:0};
  ttEngines=[]; ttParts=[]; ttTexts=[]; ttPile=null; ttBoss={x:at(0.06), y:streetRow-ttBossArt.length}; ttShake=0; ttBuffer=true; ttHall=true;
  document.body.style.background="#2a3a58";
}

function ttRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!ttMG||ttMG.length!==ROWS||ttMG[0].length!==COLS) ttMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const g=ttG, key=beat?beat.key:'hold', after=['rubble','silence','label','watch','useful','toot','hold'].includes(key);
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){ const mr=ttMG[r]; for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c]; }
  // the station: canopy, sign, rails and the buffer stop at the end of the line
  const canR=Math.max(2,streetRow-10);
  for(let c=0;c<=Math.min(COLS-1,g.trackEnd-6);c++){ setCh(grid,canR,c,"_"); setMode(mg,canR,c,'ttstation'); }
  for(const c of [1,Math.max(2,g.trackEnd-7)]) for(let r=canR+1;r<streetRow;r++){ setCh(grid,r,c,"|"); setMode(mg,r,c,'ttstation'); }
  ttPlace(grid,mg,["STATION"],Math.max(0,Math.round((g.trackEnd-6)/2)-3),canR-1,'ttsign');
  for(let c=0;c<=g.trackEnd;c++){ setCh(grid,streetRow,c,c%3?"=":"+"); setMode(mg,streetRow,c,'ttrail'); }
  if(ttBuffer) ttPlace(grid,mg,["|#"],g.trackEnd,streetRow-1,'ttbuffer');
  // the family whose front room he drives through
  if(['lounge','speed','rattle','others','nobrake','crash'].includes(key) && ttX+15>=g.house+4){
    ttPlace(grid,mg,["(o)(o)(o)","[_______]"],g.house,streetRow-2,'ttfamily');
  }
  if(ttBus && !ttBus.gone) ttPlace(grid,mg,ttBusArt,ttBus.x,streetRow-ttBusArt.length-Math.round(ttBus.y),'ttbus');
  if(ttCyclist && ttCyclist.state!=='gone'){
    if(ttCyclist.state==='ride') ttPlace(grid,mg,ttBikeArt,ttCyclist.x,streetRow-1,'ttbike');
    ttPlace(grid,mg,ttCyclistArt,ttCyclist.x,streetRow-3-Math.round(ttCyclist.y),'body');
  }
  // Thomas, his truck and the crate (unless he's now part of the rubble)
  if(!after){
    const jit=['rattle','others','nobrake','crash'].includes(key)?(Math.random()<0.5?-1:1):0;
    ttPlace(grid,mg,ttFlatbed,ttX-10,streetRow-2,'ttbody');
    if(ttCrate && ttCrate.on) ttPlace(grid,mg,ttCrateArt,ttX-9+jit,streetRow-2-ttCrateArt.length,'ttcrate');
    ttDrawEngine(grid,mg,ttX,1,'ttbody',ttFace);
    if(ttCroissant) ttPlace(grid,mg,["(~)"],ttX+6,streetRow-ttBody.length-1,'ttcroissant');
    if(ttBike) ttPlace(grid,mg,ttBikeArt,ttX+15,streetRow-2,'ttbike');
    for(const E of ttEngines) if(E.on){
      if(E.mode==='ground') ttDrawEngine(grid,mg,E.x,-1,E.body,'happy');
      else ttPlace(grid,mg,E.dir<0?["  .-.  ___","(o o)|[]1|","( u )|___|"," '-' (O)(O)"].map(s=>s):["___  .-.  ","|1[]|(o o)","|___|( u )","(O)(O) '-' "],E.x,E.y,E.body);
    }
  }
  if(ttCrate && !ttCrate.on) ttPlace(grid,mg,ttCrateArt,ttCrate.x,ttCrate.y,'ttcrate');
  // the rubble mound, with faces sticking out of it
  if(ttPile){
    const P=ttPile;
    for(let c=Math.max(0,P.c-P.hw);c<=Math.min(COLS-1,P.c+P.hw);c++){
      const h=Math.round(P.H*(1-Math.abs(c-P.c)/P.hw));
      for(let k=0;k<h;k++){ const r=streetRow-1-k; setCh(grid,r,c,"#%.,&"[(c*7+k*3)%5]); setMode(mg,r,c,(c*5+k*11)%9===0?['ttbody','ttgreen','ttred'][(c+k)%3]:'rubble'); }
    }
    for(const F of P.faces){
      const art=(key==='toot'||key==='hold')&&F.thomas?ttScaleFace(ttFaces.grin,2):ttFaces[F.thomas?'grin':'surprised'];
      const h=Math.round(P.H*(1-Math.abs(F.c-P.c)/P.hw));
      ttPlace(grid,mg,art,F.c-Math.floor(art[0].length/2),streetRow-1-h-Math.floor(art.length/2),'ttface');
    }
  }
  if(key==='label'||key==='watch'||key==='useful'||key==='toot'||key==='hold'){
    const w=Math.max(...TT_LABEL.map(s=>s.length))+4, lx=Math.max(0,Math.min(COLS-w,Math.round(ttCrate.x+3-w/2))), ly=Math.max(1,ttCrate.y-5);
    const box=["+"+"-".repeat(w-2)+"+"].concat(TT_LABEL.map(s=>"| "+s.padEnd(w-4," ")+" |"),["+"+"-".repeat(w-2)+"+"]);
    ttPlace(grid,mg,box,lx,ly,'ttlabel');
  }
  if(ttBoss){ ttPlace(grid,mg,ttBossArt,ttBoss.x,ttBoss.y+(key==='watch'&&(ttT>>3)%2?1:0),'ttboss'); if(key==='watch') ttPlace(grid,mg,["o~"],ttBoss.x+5,ttBoss.y+3,'ttnum'); }
  if(beat && beat.bossSay && f<0.9){ const len=beat.bossSay.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),ttBoss.x+2)),ttBoss.y,beat.bossSay); }
  for(const p of ttParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of ttTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function ttScaleFace(art,s){ const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out; }
function ttStepFx(){
  for(const p of ttParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  ttParts=ttParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of ttTexts){ t.life--; if(t.life%3===0) t.y--; }
  ttTexts=ttTexts.filter(t=>t.life>0);
}
function ttCarve(){
  // whatever he drives through gets a Thomas-shaped hole in it
  for(let r=streetRow-ttBody.length-2;r<streetRow;r++) for(let c=Math.max(0,Math.round(ttX)-10);c<=Math.min(COLS-1,Math.round(ttX)+15);c++){
    if(r<0||cityGridArr[r][c]===" ") continue;
    if(Math.random()<0.15) ttParts.push({x:c,y:r,vx:0.6+Math.random()*0.8,vy:-0.3-Math.random()*0.3,g:0.06,ch:cityGridArr[r][c],mode:ttMG[r][c]||'rubble',life:18});
    setCh(cityGridArr,r,c," "); ttMG[r][c]=null;
  }
}

function __m85_loop(){
  if(phase==='tt_run'){
    if(!ttStarted) ttInit();
    const beat=TT_BEATS[ttIdx], dur=ttDur(beat.cap), f=ttT/Math.max(1,dur-1), key=beat.key, g=ttG;
    const hallL=g.hall-4, front=()=>ttX+15;
    // Thomas moves towards this beat's target column, arriving just before the caption ends
    const tgt=beat.station?Math.max(11,Math.round(COLS*0.14)):(beat.u!==undefined?Math.round(g.xAt(beat.u)):null);
    if(tgt!==null && ttT<dur*0.9) ttX+=(tgt-ttX)/Math.max(1,Math.round(dur*0.9)-ttT);
    const moving=tgt!==null && ttT<dur*0.9;
    if(moving && ttT%3===0) ttSteam(ttX+7,streetRow-ttBody.length-1,false);
    if(ttIdx>=TT_BEATS.findIndex(b=>b.key==='off') && TT_BEATS.findIndex(b=>b.key==='crash')>=ttIdx) ttCarve();

    if(key==='est'){ if(ttT%14===7) ttText("PEEP PEEP",ttX+12,streetRow-9,'tttext',14); }
    else if(key==='crate'){
      if(!ttCrate) ttCrate={on:false, x:ttX-9, y:0};
      // lowered fast enough to land on the truck within this caption, however tall the screen
      if(!ttCrate.on){ ttCrate.y=Math.min(streetRow-2-ttCrateArt.length,ttCrate.y+Math.max(0.5,(streetRow-2-ttCrateArt.length)/(dur*0.6))); ttCrate.x=ttX-9; if(ttCrate.y>=streetRow-2-ttCrateArt.length){ ttCrate.on=true; ttText("THUNK",ttX-5,streetRow-7,'tttext',16); } }
    }
    else if(key==='problem'){ if(ttT%12===0) ttText("?",g.trackEnd+1,streetRow-3,'tttext',12); }
    else if(key==='look'){ ttFace=f<0.33?'right':(f<0.66?'left':'right'); }
    else if(key==='smile'){ ttFace='grin'; }
    else if(key==='off'){ if(front()>=g.trackEnd && ttBuffer){ ttBuffer=false; ttText("CLONK",g.trackEnd,streetRow-4,'tttext',16); } }
    else if(key==='street'||key==='bike'){
      if(ttT%2===0) ttParts.push({x:ttX+2+Math.random()*10,y:streetRow-1,vx:(Math.random()-0.5)*0.6,vy:-0.4,g:0.05,ch:"*",mode:'ttspark',life:8});
      if(ttBus && !ttBus.gone && front()>=ttBus.x-3){ ttBus.x+=1.2; ttBus.y=Math.min(3,ttBus.y+0.4); if(ttBus.y>=3 && ttT%10===0) ttText("HONK",ttBus.x+4,streetRow-8,'tttext',14); }
      if(ttBus && ttBus.x>COLS) ttBus.gone=true;
      if(key==='bike' && ttCyclist.state==='ride' && front()>=ttCyclist.x){ ttCyclist.state='fly'; ttBike=true; ttText("!",ttCyclist.x,streetRow-6,'tttext',16); }
      if(ttCyclist.state==='fly'){ ttCyclist.y+=0.5; ttCyclist.x+=0.3; if(ttCyclist.y>streetRow) ttCyclist.state='gone'; }
    }
    else if(key==='bakery'){ ttBus=null; if(ttX+15>=g.bakery+4) ttCroissant=true; if(ttCyclist) ttCyclist.state='gone'; }
    else if(key==='library'){ if(ttT%3===0) ttParts.push({x:front(),y:streetRow-4,vx:0.4+Math.random(),vy:-0.6,g:0.05,ch:"=",mode:['ttred','ttgreen','ttbody'][(Math.random()*3)|0],life:20}); }
    else if(key==='lounge'){ if(ttT%10===0) ttText(ttT%20===0?"!!":"hello!",ttT%20===0?g.house+4:ttX+12,streetRow-8,'tttext',14); }
    else if(key==='speed'||key==='rattle'){
      for(let k=0;k<2;k++) ttSteam(ttX+7,streetRow-ttBody.length-1,true);
      if(ttT%8===0) ttText(["PEEP","PEEEP","PEEEEEP!","WHEEEEEEE"][Math.min(3,(ttT/8|0))],ttX+12,streetRow-10,'tttext',12);
      if(key==='rattle'){ ttFace='grin'; ttShake=1.5; }
    }
    else if(key==='others'||key==='nobrake'||key==='crash'){
      // three more engines, timed so everyone hits the hall halfway through the crash beat
      const i0=TT_BEATS.findIndex(b=>b.key==='others');
      const total=ttDur(TT_BEATS[i0].cap)+ttDur(TT_BEATS[i0+1].cap)+Math.round(ttDur(TT_BEATS[i0+2].cap)*0.5);
      const tt=(ttIdx-i0>=1?ttDur(TT_BEATS[i0].cap):0)+(ttIdx-i0>=2?ttDur(TT_BEATS[i0+1].cap):0)+ttT;
      const p=Math.min(1,tt/total), e=p*p;
      if(!ttEngines.length){
        ttEngines=[
          {mode:'ground', body:'ttgreen', x0:COLS+4, x1:g.hall+5, on:true},
          {mode:'air', body:'ttred', x0:COLS+2, y0:2, x1:g.hall+1, y1:g.hallTop-3, dir:-1, on:true},
          {mode:'air', body:'ttblack', x0:g.hall-6, y0:-6, x1:g.hall-5, y1:g.hallTop-3, dir:1, on:true}
        ];
      }
      for(const E of ttEngines){ E.x=E.x0+(E.x1-E.x0)*e; if(E.mode==='air') E.y=E.y0+(E.y1-E.y0)*e; }
      const tx0=Math.round(g.routeEnd); ttX=tx0+((hallL-15)-tx0)*e;
      for(let k=0;k<2;k++) ttSteam(ttX+7,streetRow-ttBody.length-1,true);
      ttFace='wild'; ttShake=Math.max(ttShake,1+p*3);
      if(ttT%9===0) ttText(["CHUFF","TOOT TOOT","PEEEEP","PARP"][(Math.random()*4)|0],g.hall+(Math.random()-0.5)*30,streetRow-12,'tttext',12);
      if(p>=1 && ttHall){
        ttHall=false;
        for(const E of ttEngines) E.on=false;
        ttClearCols(g.hall-5,g.hall+5);
        const hw=Math.max(10,Math.round(COLS*0.12));
        ttPile={c:g.hall, hw, H:Math.min(12,Math.round(streetRow*0.4)), faces:[{c:g.hall-Math.round(hw*0.5),thomas:true},{c:g.hall-Math.round(hw*0.05)},{c:g.hall+Math.round(hw*0.35)},{c:g.hall+Math.round(hw*0.7)}]};
        ttText("CRUNCH",g.hall,streetRow-ttPile.H-6,'ttbig',40);
        ttShake=18;
        flash.style.transition="opacity 0.03s"; flash.style.opacity=0.6; setTimeout(()=>{ flash.style.transition="opacity 0.7s"; flash.style.opacity=0; },70);
        for(let k=0;k<60;k++){ const a=Math.random()*Math.PI; ttParts.push({x:g.hall,y:streetRow-6,vx:Math.cos(a)*(1+Math.random()*1.5),vy:-Math.sin(a)*(0.6+Math.random()),g:0.04,ch:["#","o","@","%"][(Math.random()*4)|0],mode:Math.random()<0.5?'ttsteam':'rubble',life:30}); }
        // the crate goes up, and comes down on the top of the pile
        ttCrate={on:false, x:g.hall-3, y:streetRow-8, vy:-1.2, landY:streetRow-1-ttPile.H-ttCrateArt.length+1};
      }
    }
    if(ttCrate && !ttCrate.on && ttCrate.vy!==undefined){ ttCrate.vy+=0.08; ttCrate.y=Math.min(ttCrate.landY,ttCrate.y+ttCrate.vy); }
    if(key==='silence'){ ttShake=0; }
    if(key==='watch' && ttBoss){ const tx=Math.max(0,ttPile.c-ttPile.hw-7); ttBoss.x+=(tx-ttBoss.x)*0.15; }
    if(key==='toot' && ttT===Math.round(dur*0.15)) ttText("toot...",ttPile.faces[0].c,streetRow-ttPile.H-4,'tttext',30);

    if(ttShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*ttShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*ttShake).toFixed(1)+"px)"; ttShake*=0.9; }
    else { stage.style.transform=""; ttShake=0; }
    ttStepFx();
    ttRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#6ab0ff"; sub.style.textShadow="0 0 8px #d02020";
    ttT++;
    if(ttT>=dur){ ttT=0; ttIdx++; if(ttIdx>=TT_BEATS.length){ phase='tt_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='tt_hold'){
    stage.style.transform="";
    ttStepFx(); ttT++;
    ttRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=TT_HOLD; sub.style.color="#6ab0ff"; sub.style.textShadow="0 0 8px #d02020";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m85_start(){
  attackMode='tt_run';
  cmd.style.color="#6ab0ff"; cmd.style.textShadow="0 0 20px #d02020";
  ttStarted=false; phase='tt_run';
}

function __m85_reset(){
  ttStarted=false; ttT=0; ttIdx=0; ttG=null; ttMG=null; ttX=0; ttFace='happy'; ttCrate=null; ttCroissant=false; ttBike=null;
  ttBus=null; ttCyclist=null; ttEngines=[]; ttParts=[]; ttTexts=[]; ttPile=null; ttBoss=null; ttShake=0; ttBuffer=true; ttHall=true;
  stage.style.transform="";
}

registerMethod(85, { start: __m85_start, resetFn: __m85_reset, loopFn: __m85_loop, phaseNames: ['tt_run','tt_hold'] });
