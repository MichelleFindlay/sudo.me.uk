let ntStarted=false, ntT=0, ntIdx=0, ntG=null, ntMG=null, ntIvy=[], ntMeadow=-1, ntGrassH=0, ntCut=null, ntCars=[], ntOak=0, ntPeople=[];
let ntPigeons=[], ntRiver=0, ntFalls=false, ntMyc=0, ntPulses=[], ntParts=[], ntTexts=[], ntBadger=null, ntPhone=null, ntRobin=0, ntSlump=null, ntShake=0;

// ---- NATURE: gently composted ----
// nothing explodes. Ivy climbs every column (ntIvy[c] = how high it's got), the street turns
// to meadow, the animals take over the civic buildings, a fungal network spreads through the
// underground rows, and in the end every hedge-covered building slumps into a grassy mound
const NT_BEATS=[
  {key:'dandelion', cap:"IT STARTS WITH A SINGLE DANDELION PUSHING THROUGH THE PAVEMENT OUTSIDE THE TOWN HALL. NOBODY NOTICES."},
  {key:'meadow',    cap:"BY TUESDAY THERE ARE THOUSANDS. BY FRIDAY THE HIGH STREET IS A MEADOW."},
  {key:'ivy',       cap:"IVY CREEPS UP THE OFFICE BLOCKS OVERNIGHT. BY MORNING THE SKYLINE IS A ROW OF VERY TALL HEDGES."},
  {key:'commuters', cap:"COMMUTERS STAND OUTSIDE, LANYARDS DANGLING, UNSURE WHETHER TO KNOCK."},
  {key:'moss',      cap:"MOSS SWALLOWS THE CAR PARKS. EVERY PARKED CAR BECOMES A RAISED FLOWER BED."},
  {key:'oak',       cap:"THE MOTORWAY CLOSES WHEN AN OAK TREE SIMPLY DECIDES TO BE THERE, AND REFUSES TO MOVE."},
  {key:'foxes',     cap:"THE ANIMALS MOVE IN. FOXES RUN THE LATE-NIGHT SHOPS."},
  {key:'stag',      cap:"A STAG WANDERS INTO THE COUNCIL CHAMBERS AND IS ELECTED MAYOR UNOPPOSED."},
  {key:'badgers',   cap:"BADGERS DIG BENEATH THE BANK VAULTS, AND FIND NOTHING WORTH KEEPING."},
  {key:'pigeons',   cap:"THE PIGEONS LEAVE THE CITY ENTIRELY. QUIETLY. AS IF THEY'D BEEN WAITING FOR AN EXCUSE."},
  {key:'river',     cap:"RIVERS REMEMBER WHERE THEY USED TO RUN, AND TAKE THE SCENIC ROUTE THROUGH THE SHOPPING CENTRE."},
  {key:'falls',     cap:"THE ESCALATORS BECOME WATERFALLS."},
  {key:'fungi',     cap:"THEN THE FUNGI START TALKING TO EACH OTHER UNDERGROUND."},
  {key:'network',   cap:"THE NETWORK SPREADS UNDER EVERY STREET. IT'S FASTER THAN THE INTERNET EVER WAS. AND IT HAS OPINIONS."},
  {key:'fight',     cap:"PEOPLE TRY TO FIGHT IT AT FIRST. THEY TRIM. THEY SPRAY. THEY MOW."},
  {key:'smug',      cap:"BUT EVERY TIME THEY CUT SOMETHING BACK, IT RETURNS TWICE AS GREEN. AND SLIGHTLY SMUG."},
  {key:'stop',      cap:"EVENTUALLY, THEY STOP. THEY SIT DOWN IN THE LONG GRASS."},
  {key:'shoes',     cap:"SOMEONE TAKES THEIR SHOES OFF. SOMEONE ELSE FALLS ASLEEP UNDER A TREE."},
  {key:'phone',     cap:"THE LAST WORKING PHONE RINGS ONCE, BURIED UNDER LEAVES. NOBODY ANSWERS."},
  {key:'robin',     cap:"A ROBIN BUILDS A NEST ON TOP OF IT."},
  {key:'exhale',    cap:"SILENCE. BIRDSONG. THE PLANET EXHALES."},
  {key:'compost',   cap:"HUMANITY HASN'T BEEN DESTROYED. IT'S JUST BEEN GENTLY COMPOSTED."}
];
const NT_HOLD="PLEASE DO NOT REINSTALL. — press RESET";
const ntHallArt=[" __/\\__ ","|COUNCIL|","|[] []|","|__||__|"].map(s=>s.padEnd(9," "));
const ntBankArt=[" _____ ","|BANK |","|[$$]|","|_____|"].map(s=>s.padEnd(7," "));
const ntShopArt=[" ______ ","|OPEN24|","|[]  []|","|______|"];
const ntMallArt=[" ________________ ","| SHOPPING CENTRE|","|  \\       []    |","|   \\      []    |","|    \\     []    |","|_____\\__________|"];

function ntDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function ntPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function ntText(s,x,y,mode,life){ ntTexts.push({s,x,y,mode:mode||'nttext',life:life||20}); }
function ntColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function ntStamp(art,left,mode){
  const top=streetRow-art.length;
  for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){ const ch=art[i][j], c=left+j; if(ch===" "||c<0||c>=COLS) continue; setCh(cityGridArr,top+i,c,ch); ntMG[top+i][c]=mode; }
}
function ntClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){ setCh(cityGridArr,r,c," "); ntMG[r][c]=null; } }

function ntInit(){
  ntStarted=true; ntT=0; ntIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  ntMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const at=f=>Math.round(COLS*f);
  const g={shop:at(0.06), bank:at(0.24), hall:at(0.44), mall:at(0.62), oak:at(0.9)};
  ntG=g;
  ntClear(g.shop-1,g.shop+8); ntStamp(ntShopArt,g.shop,'ntshop');
  ntClear(g.bank-1,g.bank+7); ntStamp(ntBankArt,g.bank,'ntcivic');
  ntClear(g.hall-2,g.hall+10); ntStamp(ntHallArt,g.hall,'ntcivic');
  ntClear(g.mall-1,g.mall+18); ntStamp(ntMallArt,g.mall,'ntmall');
  ntClear(g.oak-8,g.oak+8);
  ntIvy=Array(COLS).fill(0); ntMeadow=-1; ntGrassH=0; ntCut=null; ntOak=0;
  ntCars=[0.16,0.36,0.56,0.82].map(f=>({x:at(f), bed:false}));
  ntPeople=[]; for(let i=0;i<Math.max(5,Math.round(COLS/16));i++) ntPeople.push({x:3+Math.random()*(COLS-8), pose:'stand'});
  ntPigeons=[]; for(let i=0;i<6;i++){ const c=(Math.random()*(COLS-3))|0; ntPigeons.push({x:c, y:ntColTop(c)-1, fly:false}); }
  ntRiver=0; ntFalls=false; ntMyc=0; ntPulses=[]; ntParts=[]; ntTexts=[]; ntBadger=null; ntPhone=null; ntRobin=0; ntSlump=null; ntShake=0;
  document.body.style.background="#000000";
}

function ntRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!ntMG||ntMG.length!==ROWS||ntMG[0].length!==COLS) ntMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const g=ntG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){ const mr=ntMG[r]; for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c]; }
  // ivy: every building cell below the ivy line becomes leaves; at full height, a hedge
  for(let c=0;c<COLS;c++){
    const iv=ntIvy[c]; if(iv<=0) continue;
    for(let r=streetRow-1;r>=0 && streetRow-1-r<iv;r--){
      if(grid[r][c]===" ") continue;
      setCh(grid,r,c,"%&@*8"[(r*7+c*3)%5]); setMode(mg,r,c,(r*5+c*11)%17===0?'ntflower':'ntivy');
    }
  }
  // the fungal network under the street: branching hyphae with pulses running along them
  if(ntMyc>0){
    for(let r=streetRow+1;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const d=Math.abs(c-g.hall-4)+Math.abs(r-streetRow-2)*3;
      if(d>ntMyc) continue;
      const on=((r*3+c)%7===0)||(r===streetRow+3)||((c*5+r)%11===0&&r>streetRow+1);
      if(!on) continue;
      setCh(grid,r,c,r===streetRow+3?"-":((c+r)%3===0?"+":"'")); setMode(mg,r,c,'ntmyc');
    }
    for(const P of ntPulses){ const c=Math.round(P.x); if(c>=0&&c<COLS){ setCh(grid,streetRow+3,c,"*"); setMode(mg,streetRow+3,c,'ntpulse'); } }
  }
  if(ntBadger){ for(let c=g.bank;c<=Math.round(ntBadger.x);c++){ setCh(grid,streetRow+4,c,"="); setMode(mg,streetRow+4,c,'ntdirt'); } ntPlace(grid,mg,["(=)"],ntBadger.x,streetRow+4,'ntbadger'); }
  // the meadow along the high street, cut back by the mower, grown back taller
  if(ntMeadow>=0){
    for(let c=0;c<COLS;c++){
      if(Math.abs(c-g.hall-4)>ntMeadow) continue;
      let h=Math.max(1,ntGrassH); if(ntCut && ((ntCut.dir>0&&c<ntCut.x)||(ntCut.dir<0&&c>ntCut.x))) h=ntCut.regrow?ntGrassH:0;
      for(let k=0;k<h;k++){ const r=streetRow-1-k; if(grid[r][c]!==" "&&mg[r][c]!=='city') continue; const fl=(c*7+k*3)%9===0; setCh(grid,r,c,fl?"*":(k===h-1?"\"":"|")); setMode(mg,r,c,fl?'ntflower':'ntgrass'); }
    }
  } else { setCh(grid,streetRow-1,g.hall-3,"*"); setMode(mg,streetRow-1,g.hall-3,'ntdandelion'); }
  // the river, finding its old route through the shopping centre
  if(ntRiver>0) for(let c=0;c<Math.min(COLS,Math.round(ntRiver));c++){ setCh(grid,streetRow,c,((c+ntT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
  if(ntFalls) for(let k=0;k<4;k++){ const r=streetRow-4+k, c=g.mall+3+k; for(const dc of [0,1]){ setCh(grid,r,c+dc,(ntT+k)%2?"|":"\u2248"); setMode(mg,r,c+dc,'water'); } }
  // cars and their flower beds; the oak in the motorway
  for(const C of ntCars) ntPlace(grid,mg,C.bed?["[*.*]"]:["o==o"],C.x,streetRow-1,C.bed?'ntbed':'car');
  if(ntOak>0){
    const h=Math.round(ntOak), w=Math.round(h*1.4);
    for(let k=0;k<Math.ceil(h*0.4);k++){ const r=streetRow-1-k; ntPlace(grid,mg,["||"],g.oak,r,'ntbark'); }
    for(let r=0;r<Math.ceil(h*0.7);r++){ const rr=streetRow-1-Math.ceil(h*0.4)-r, half=Math.round(w/2*Math.sin(Math.PI*(r+0.5)/Math.ceil(h*0.7))); for(let c=g.oak+1-half;c<=g.oak+1+half;c++){ if(rr<0||c<0||c>=COLS) continue; setCh(grid,rr,c,"@%&"[(rr+c)%3]); setMode(mg,rr,c,'ntoak'); } }
    if(['oak','foxes'].includes(key)) ntPlace(grid,mg,["[ROAD CLOSED]"],g.oak-12,streetRow-1,'ntsign');
  }
  // animals in charge
  if(['foxes','stag','badgers','pigeons','river','falls'].includes(key)) ntPlace(grid,mg,["v>o~"],g.shop+2,streetRow-2,'ntfox');
  if(['stag','badgers','pigeons','river','falls','fungi','network'].includes(key)){ ntPlace(grid,mg,["\\Y/"," o ","/|\\"],g.hall+3,streetRow-3,'ntstag'); if(key==='stag') ntPlace(grid,mg,["MAYOR"],g.hall+2,streetRow-6,'ntsign'); }
  for(const P of ntPigeons) ntPlace(grid,mg,[P.fly?((ntT>>1)%2?"v":"^"):"o>"],P.x,P.y,'ntpigeon');
  // people: commuters, mowers, then sitting in the grass, shoes off, asleep under the oak
  if(['commuters','moss','fight','smug','stop','shoes','phone','robin','exhale','compost','hold'].includes(key)) for(const P of ntPeople){
    const art=P.pose==='sit'?["   "," o ","/|_"]:(P.pose==='lie'?["   ","   ","o__"]:[" o ","/|\\","/ \\"]);
    ntPlace(grid,mg,art,P.x,streetRow-3,'body');
    if(P.pose==='stand' && key==='commuters') ntPlace(grid,mg,["|"],P.x+1,streetRow-2,'ntlanyard');
  }
  if(ntCut) ntPlace(grid,mg,["o[=]"],ntCut.x,streetRow-1,'ntmower');
  if(ntPhone){ ntPlace(grid,mg,["[==]"],ntPhone.x,streetRow-1,'ntphone'); if(ntPhone.ring) ntPlace(grid,mg,["((    ))"],ntPhone.x-2,streetRow-1,'nttext'); }
  if(ntRobin>0 && ntPhone){ ntPlace(grid,mg,["\\_/"],ntPhone.x,streetRow-2,'ntnest'); if(ntRobin>1) ntPlace(grid,mg,["(o>"],ntPhone.x,streetRow-3,'ntrobin'); }
  for(const p of ntParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of ntTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function ntStepFx(){
  for(const p of ntParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  ntParts=ntParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of ntTexts){ t.life--; if(t.life%3===0) t.y--; }
  ntTexts=ntTexts.filter(t=>t.life>0);
  for(const P of ntPulses){ P.x+=P.v; } ntPulses=ntPulses.filter(P=>P.x>=0&&P.x<COLS);
}
function ntBird(){ ntParts.push({x:Math.random()*COLS,y:2+Math.random()*5,vx:0.3+Math.random()*0.3,vy:0,g:0,ch:"v",mode:'ntbird',life:60}); }

function __m92_loop(){
  if(phase==='nt_run'){
    if(!ntStarted) ntInit();
    const beat=NT_BEATS[ntIdx], dur=ntDur(beat.cap), f=ntT/Math.max(1,dur-1), key=beat.key, g=ntG;
    const maxH=(function(){ let m=0; for(let c=0;c<COLS;c++) m=Math.max(m,streetRow-ntColTop(c)); return m; })();

    if(key==='meadow'){ ntMeadow=Math.round(f*COLS); ntGrassH=1; }
    if(key==='ivy'){ for(let c=0;c<COLS;c++) ntIvy[c]=Math.round((maxH+1)*Math.min(1,f*1.2)*(0.85+0.15*Math.sin(c*0.7))); }
    if(key==='commuters' && ntT%10===5){ const P=ntPeople[(ntT/10|0)%ntPeople.length]; ntText("*knock?*",P.x+1,streetRow-5,'nttext',12); }
    if(key==='moss') ntCars.forEach((C,i)=>{ if(f>i/ntCars.length) C.bed=true; });
    if(key==='oak'){ ntOak=Math.min(Math.max(8,Math.round(streetRow*0.55)),ntOak+0.4); if(ntT%10===0) ntText("*creak*",g.oak+1,streetRow-ntOak-2,'nttext',10); }
    if(key==='foxes' && ntT%14===4) ntText("anything else?",g.shop+4,streetRow-6,'nttext',14);
    if(key==='stag' && ntT===Math.round(dur*0.6)) ntText("ELECTED (UNOPPOSED)",g.hall+4,streetRow-8,'ntsign',30);
    if(key==='badgers'){ if(!ntBadger) ntBadger={x:g.bank}; ntBadger.x=Math.min(g.bank+6,ntBadger.x+0.15); if(ntT===Math.round(dur*0.75)) ntText("meh.",g.bank+4,streetRow+2,'nttext',24); }
    if(key==='pigeons'){ ntBadger=null; for(const P of ntPigeons){ if(f>0.2) P.fly=true; if(P.fly){ P.x+=0.6; P.y-=0.2; } } ntPigeons=ntPigeons.filter(P=>P.x<COLS&&P.y>-1); }
    if(key==='river') ntRiver=Math.min(g.mall+4,(g.mall+4)*f/0.8);
    if(key==='falls'){ ntFalls=true; ntRiver=COLS; if(ntT%8===0) ntText("sploosh",g.mall+5,streetRow-6,'nttext',10); }
    if(key==='fungi'){ ntMyc=Math.min(COLS*0.4,f*COLS*0.4); if(ntT%10===0) ntParts.push({x:g.hall+4+(Math.random()-0.5)*ntMyc*2,y:streetRow-1,vx:0,vy:0,g:0,ch:"n",mode:'ntshroom',life:200}); }
    if(key==='network'){
      ntMyc=COLS*0.4+COLS*f;
      if(ntT%3===0) ntPulses.push({x:g.hall+4,v:(Math.random()<0.5?-1:1)*(1.5+Math.random())});
      if(ntT%12===0) ntText(["well, actually","hot take: concrete","unsubscribe","we've read your emails","nice try, tarmac"][(ntT/12|0)%5],Math.random()*COLS,streetRow-2,'ntopinion',16);
    }
    if(key==='fight'){
      if(!ntCut) ntCut={x:-4, dir:1, regrow:false};
      ntCut.x+=Math.max(0.6,COLS/(dur*0.9)); if(ntT%10===0) ntText(["TRIM","SPRAY","MOW"][(ntT/10|0)%3],ntCut.x+2,streetRow-5,'nttext',10);
    }
    if(key==='smug'){ ntCut.regrow=true; ntGrassH=Math.min(3,1+Math.round(f*2)); for(let c=0;c<COLS;c++) ntIvy[c]=Math.max(ntIvy[c],maxH+2); if(ntT%14===4) ntText("smug",Math.random()*COLS,streetRow-5,'ntopinion',14); if(f>0.8) ntCut.x+=1.5; }
    if(key==='stop'){ ntCut=null; ntPeople.forEach((P,i)=>{ if(f>i/ntPeople.length) P.pose='sit'; }); }
    if(key==='shoes'){ if(ntT===Math.round(dur*0.2)) ntText("ahhh",ntPeople[0].x+1,streetRow-5,'nttext',20); const P=ntPeople[ntPeople.length-1]; P.x+=(g.oak-6-P.x)*0.1; if(f>0.5) P.pose='lie'; if(f>0.5&&ntT%12===0) ntText("z",P.x+1,streetRow-4,'nttext',12); }
    if(key==='phone'){ if(!ntPhone) ntPhone={x:Math.round(COLS*0.3), ring:false}; ntPhone.ring=f>0.2&&f<0.45&&(ntT>>1)%2===0; if(ntT===Math.round(dur*0.2)) ntText("ring",ntPhone.x+2,streetRow-4,'nttext',14); }
    if(key==='robin'){ ntPhone.ring=false; ntRobin=f<0.4?1:2; if(ntT%10===0&&f>0.4) ntText("\u266a",ntPhone.x+3,streetRow-5,'ntrobin',12); }
    if(key==='exhale'){ if(ntT%5===0) ntBird(); if(ntT%9===0) ntText("\u266a",Math.random()*COLS,4+Math.random()*4,'ntbird',12); }
    if(key==='compost'){
      // every hedge slumps into a soft grassy mound, a row at a time
      if(!ntSlump){ ntSlump={t:Array.from({length:COLS},(_,c)=>Math.max(0,Math.round(2+2*Math.sin(c*0.15)+1.5*Math.sin(c*0.05+1))))}; }
      if(ntT%2===0) for(let c=0;c<COLS;c++){
        const h=streetRow-ntColTop(c); if(h<=ntSlump.t[c]) continue;
        for(let r=streetRow-1;r>0;r--){ setCh(cityGridArr,r,c,cityGridArr[r-1][c]); ntMG[r][c]=ntMG[r-1][c]; }
        setCh(cityGridArr,0,c," "); ntMG[0][c]=null;
      }
      if(ntT%7===0) ntBird();
    }

    if(ntShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*ntShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*ntShake).toFixed(1)+"px)"; ntShake*=0.9; }
    else { stage.style.transform=""; ntShake=0; }
    ntStepFx();
    ntRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#a8e080"; sub.style.textShadow="0 0 8px #2a5a2a";
    ntT++;
    if(ntT>=dur){ ntT=0; ntIdx++; if(ntIdx>=NT_BEATS.length){ phase='nt_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='nt_hold'){
    stage.style.transform="";
    if(ntT%9===0) ntBird();
    ntStepFx(); ntT++;
    ntRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=NT_HOLD; sub.style.color="#a8e080"; sub.style.textShadow="0 0 8px #2a5a2a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m92_start(){
  attackMode='nt_run';
  cmd.style.color="#a8e080"; cmd.style.textShadow="0 0 20px #2a7a2a";
  ntStarted=false; phase='nt_run';
}

function __m92_reset(){
  ntStarted=false; ntT=0; ntIdx=0; ntG=null; ntMG=null; ntIvy=[]; ntMeadow=-1; ntGrassH=0; ntCut=null; ntCars=[]; ntOak=0; ntPeople=[];
  ntPigeons=[]; ntRiver=0; ntFalls=false; ntMyc=0; ntPulses=[]; ntParts=[]; ntTexts=[]; ntBadger=null; ntPhone=null; ntRobin=0; ntSlump=null; ntShake=0;
  stage.style.transform="";
}

registerMethod(92, { start: __m92_start, resetFn: __m92_reset, loopFn: __m92_loop, phaseNames: ['nt_run','nt_hold'] });
