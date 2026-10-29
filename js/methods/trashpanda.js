let rcStarted=false, rcT=0, rcIdx=0, rcG=null, rcBins=[], rcRacs=[], rcEyes=[], rcTrash=[], rcParts=[], rcTexts=[];
let rcBoss=null, rcPizza=null, rcLorry=null, rcWater=0, rcJunk=null, rcFront=-1, rcHomes=[], rcDark=false, rcShake=0, rcSandwich=false, rcVault=false;

// ---- TRASHPANDA: Trash Pandemonium ----
// bin night. One raccoon becomes hundreds; bins, cash machines, car boots, vending machines
// and the bank vault all get opened; everything gets washed in the river until it floods;
// then the tip collapses into a landslide that buries the city under one junk mountain
const RC_BEATS=[
  {key:'est',       cap:"THE PEACEFUL CITY ON BIN NIGHT. WHEELIE BINS ARE LINED UP NEATLY ALONG EVERY STREET, LIDS CLOSED."},
  {key:'eyes',      cap:"UNDER A HEDGE, A PAIR OF SMALL EYES GLINTS IN THE DARK."},
  {key:'first',     cap:"A SINGLE RACCOON WADDLES OUT, TIPS OVER ONE BIN WITH A DELICATE PUSH, AND STARTS RUMMAGING."},
  {key:'pizza',     cap:"IT FINDS HALF A PIZZA, HOLDS IT UP IN ITS LITTLE HANDS, AND STARES AT IT WITH REVERENCE."},
  {key:'spread',    cap:"ANOTHER PAIR OF EYES APPEARS. THEN TEN. THEN A HUNDRED."},
  {key:'emerge',    cap:"RACCOONS EMERGE FROM DRAINS, CHIMNEYS, CAT FLAPS, AND ONE VERY SURPRISED MAN'S COAT POCKET."},
  {key:'binwar',    cap:"BIN NIGHT BECOMES BIN WAR. EVERY BIN IN THE CITY GOES OVER AT ONCE."},
  {key:'surf',      cap:"RUBBISH FILLS THE STREETS. RACCOONS SURF ON PIZZA BOXES."},
  {key:'lorry',     cap:"ONE DRIVES OFF IN A RECYCLING LORRY, WITH NO IDEA HOW BUT COMPLETE CONFIDENCE."},
  {key:'boss',      cap:"THEY GET ORGANISED. A LARGE ONE IN A TINY HARD HAT DIRECTS THE OTHERS WITH A CHIP."},
  {key:'dismantle', cap:"THEY START DISMANTLING THINGS, METHODICALLY. EVERYTHING MIGHT HAVE FOOD INSIDE IT."},
  {key:'atm',       cap:"NOTHING IS SAFE. THEY PRY OPEN CASH MACHINES. NOTHING EDIBLE, SO THE MONEY GETS THROWN AWAY."},
  {key:'boots',     cap:"THEY OPEN EVERY CAR BOOT. EVERY VENDING MACHINE..."},
  {key:'vault',     cap:"...AND THE BANK VAULT. INSIDE IS A SINGLE FORGOTTEN SANDWICH. THEY CHEER."},
  {key:'wash',      cap:"RACCOONS WASH THEIR FOOD. SO THEY WASH EVERYTHING THEY FIND IN THE RIVER: BIKES, PHONES, A DOUBLE-DECKER BUS."},
  {key:'overflow',  cap:"THE RIVER CLOGS, AND OVERFLOWS INTO THE STREETS."},
  {key:'tip',       cap:"THEN THEY DISCOVER THE CITY'S MAIN TIP: ONE GIANT MOUNTAIN OF RUBBISH."},
  {key:'tunnel',    cap:"THEY TUNNEL INTO IT FROM EVERY SIDE AT ONCE..."},
  {key:'landslide', cap:"...UNTIL IT COLLAPSES INTO A LANDSLIDE THAT ROLLS THROUGH THE CITY AND BURIES EVERYTHING."},
  {key:'settle',    cap:"THE CITY IS NOW ONE HUGE, BURIED MOUNTAIN OF JUNK. THE RACCOONS COULDN'T BE HAPPIER."},
  {key:'homes',     cap:"THEY'VE BUILT TINY HOMES OUT OF TAKEAWAY BOXES, WITH LITTLE BOTTLE-CAP SATELLITE DISHES."},
  {key:'throne',    cap:"ON TOP OF THE PILE, THE RACCOON IN THE HARD HAT SITS ON A THRONE MADE FROM A SHOPPING TROLLEY."},
  {key:'bite',      cap:"IT HOLDS UP THE ORIGINAL HALF-PIZZA. TAKES ONE BITE. DROPS THE REST OVER ITS SHOULDER."},
  {key:'lens',      cap:"THEN IT LOOKS AT THE CAMERA. WHOSE LENS IS NOW ALSO GONE."}
];
const RC_HOLD="TRASH PANDEMONIUM. — press RESET";

const rcArt=["(o-o)"," u u~"];
const rcBinUp=["[_]","|#|"], rcBinDown=["=[#"];
const rcPizzaArt=["(::>"];
const rcLorryArt=["  _____  ","[RECYC|=\\","'o----oo'"];
const rcBossArts=[[" _^_ ","(o-o)","/| |\\"],[" _^_ ","(O-O)","/| |\\"]];
const rcThroneArt=["|\\_____/|"," \\#####/ ","  o   o  "];
const rcAtmArt=["[ATM]","|$$ |"], rcVendArt=["[VEND]","|o o |","|____|"];
const rcBankArt=[" ______ ","| BANK |","| (@)  |","|______|"];

function rcDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function rcPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function rcText(s,x,y,mode,life){ rcTexts.push({s,x,y,mode:mode||'rctext',life:life||20}); }
function rcColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function rcAddRac(x,y,vx,from){ if(rcRacs.length<60) rcRacs.push({x,y:y===undefined?streetRow-1:y,vx:vx===undefined?(Math.random()<0.5?-1:1)*(0.2+Math.random()*0.4):vx,surf:false,from:from||null}); }
function rcClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++) setCh(cityGridArr,r,c," "); }
function rcStamp(art,left){
  const top=streetRow-art.length;
  for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){ const ch=art[i][j]; if(ch!==" ") setCh(cityGridArr,top+i,left+j,ch); }
}

function rcInit(){
  rcStarted=true; rcT=0; rcIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const at=f=>Math.round(COLS*f);
  const g={hedge:2, atm:at(0.3), vend:at(0.42), bank:at(0.52), rv0:at(0.64), rv1:at(0.64)+Math.max(5,at(0.05)), tipL:at(0.8), man:at(0.24)};
  rcG=g;
  rcClear(0,10); rcClear(g.atm-1,g.atm+5); rcClear(g.vend-1,g.vend+6); rcClear(g.bank-1,g.bank+8); rcClear(g.rv0-1,g.rv1+1); rcClear(g.tipL,COLS-1);
  rcStamp(rcBankArt,g.bank);
  // the tip: a mound of rubbish at the far end of town
  g.tipC=Math.round((g.tipL+COLS)/2); g.tipHW=Math.max(6,Math.round((COLS-g.tipL)/2)); g.tipH=Math.max(5,Math.round(streetRow*0.35));
  rcBins=[]; for(let c=12;c<g.tipL-3;c+=Math.max(6,Math.round(COLS/20))){ if(c>=g.rv0-2&&c<=g.rv1+2) continue; rcBins.push({x:c, up:true}); }
  rcRacs=[]; rcEyes=[]; rcTrash=Array(COLS).fill(0); rcParts=[]; rcTexts=[];
  rcBoss=null; rcPizza=null; rcLorry=null; rcWater=0; rcJunk=null; rcFront=-1; rcHomes=[]; rcDark=false; rcShake=0; rcSandwich=false; rcVault=false;
  document.body.style.background="#121828";
}

function rcJunkH(c){
  // the landslide: a junk mountain that rolls left from the tip and buries everything
  if(!rcJunk) return 0;
  const J=rcJunk, full=Math.round(J.H*(0.7+0.3*Math.sin(Math.PI*(c+0.5)/COLS)));
  if(c>=J.front) return full;
  const d=J.front-c; return Math.max(0,Math.round(full-d*1.5));
}
function rcTipH(c){
  const g=rcG; if(rcJunk) return 0; const u=(c-g.tipC)/g.tipHW; if(Math.abs(u)>1) return 0;
  return Math.round(g.tipH*(1-u*u));
}

function rcRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=rcG, key=beat?beat.key:'hold';
  let grid=cityGridArr.slice(); const mg=modeGridFill(ROWS,COLS,'city');
  // the lens is gone: just two eyes in the dark
  if(rcDark){
    for(let r=0;r<ROWS;r++) grid[r]=" ".repeat(COLS);
    if((rcT%30)>3){ rcPlace(grid,mg,["o   o"],cx-2,Math.round(ROWS*0.4),'rceyes'); }
    scene.innerHTML=paint(grid,mg,'city'); return;
  }
  // the hedge and its eyes
  rcPlace(grid,mg,["  ####  "," ###### ","########"],g.hedge,streetRow-3,'rchedge');
  if(['eyes','first'].includes(key) && (rcT%20)>2) rcPlace(grid,mg,["o o"],g.hedge+3,streetRow-2,'rceyes');
  for(const E of rcEyes) if((rcT+E.ph)%24>2) rcPlace(grid,mg,["o o"],E.x,E.y,'rceyes');
  // the river (and what's being washed in it), the tip, street furniture
  for(let c=g.rv0;c<=g.rv1;c++){ setCh(grid,streetRow,c,((c+rcT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
  if(['wash','overflow'].includes(key)){
    rcPlace(grid,mg,["o^o"],g.rv0+1,streetRow-1,'rcbike'); rcPlace(grid,mg,["[]"],g.rv0+4,streetRow-1,'rcphone');
    rcPlace(grid,mg,["[][]","[][]"],g.rv1-3,streetRow-2,'rcbus');
  }
  for(let c=0;c<COLS;c++){ const h=rcTipH(c); for(let k=0;k<h;k++){ const r=streetRow-1-k; setCh(grid,r,c,"%&#*;~"[(c*5+k*3)%6]); setMode(mg,r,c,'rctrash'); } }
  if(key==='tunnel') for(let k=0;k<4;k++){ const c=g.tipC+Math.round((k-1.5)*g.tipHW*0.45), h=rcTipH(c); if(h>2) rcPlace(grid,mg,["( )"],c-1,streetRow-1-Math.floor(h/2),'rchole'); }
  if(!rcJunk){
    rcPlace(grid,mg,rcAtmArt,g.atm,streetRow-2,'rcatm');
    rcPlace(grid,mg,rcVendArt,g.vend,streetRow-3,'rcvend');
    if(rcVault) rcPlace(grid,mg,["(O)"],g.bank+2,streetRow-2,'rcvault');
  }
  for(const B of rcBins) rcPlace(grid,mg,B.up?rcBinUp:rcBinDown,B.x,streetRow-(B.up?2:1),'rcbin');
  // loose rubbish, and the overflowing river
  for(let c=0;c<COLS;c++) for(let k=0;k<rcTrash[c];k++){ const r=streetRow-1-k; setCh(grid,r,c,"%&*;~,"[(c*3+k)%6]); setMode(mg,r,c,'rctrash'); }
  for(let k=0;k<Math.round(rcWater);k++){ const r=streetRow-1-k; for(let c=0;c<COLS;c++){ if(Math.abs(c-(g.rv0+g.rv1)/2)>rcWater*14) continue; setCh(grid,r,c,k===Math.round(rcWater)-1?"~":"\u2248"); setMode(mg,r,c,'water'); } }
  if(key==='surf'||key==='lorry'||key==='boss') for(const R of rcRacs) if(R.surf) rcPlace(grid,mg,["[__]"],R.x,R.y,'rcbox');
  // the man with the very surprised coat pocket
  if(['emerge'].includes(key)){ rcPlace(grid,mg,[" o ","/|\\","/ \\"],g.man,streetRow-3,'body'); if(f>0.6) rcText("!",g.man+1,streetRow-5,'rctext',2); }
  if(rcLorry) rcPlace(grid,mg,rcLorryArt,rcLorry.x,streetRow-3-Math.round(rcLorry.hop),'rclorry');
  // the junk mountain, once the tip comes down
  if(rcJunk) for(let c=0;c<COLS;c++){ const h=rcJunkH(c); for(let k=0;k<h;k++){ const r=streetRow-1-k; if(r<0) break; setCh(grid,r,c,"%&#*;~@=[]"[(c*7+k*3+(rcFront>=0?0:0))%10]); setMode(mg,r,c,'rctrash'); } }
  for(const H of rcHomes){ const h=rcJunkH(H.x); rcPlace(grid,mg,["  o)","[__]"],H.x-1,streetRow-1-h-1,'rchome'); }
  // raccoons
  for(const R of rcRacs){
    const top=Math.round(R.y)-1-(R.surf?1:0);
    rcPlace(grid,mg,R.vx<0?["(o-o)","~u u "]:rcArt,R.x,top,'rcrac');
  }
  if(rcPizza) rcPlace(grid,mg,rcPizzaArt,rcPizza.x,rcPizza.y,'rcpizza');
  if(rcSandwich) rcPlace(grid,mg,["[===]"],g.bank+1,streetRow-6,'rcsandwich');
  if(rcBoss){
    const art=rcBossArts[(rcT>>3)%2&&key==='lens'?1:0];
    if(rcBoss.throne) rcPlace(grid,mg,rcThroneArt,rcBoss.x-2,rcBoss.y+1,'rcthrone');
    rcPlace(grid,mg,art,rcBoss.x,rcBoss.y-2,'rcrac'); rcPlace(grid,mg,[" _^_ "],rcBoss.x,rcBoss.y-2,'rchat');
    if(key==='boss') rcPlace(grid,mg,["|"],rcBoss.x+5,rcBoss.y-2+((rcT>>2)%2),'rcchip');
  }
  for(const p of rcParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of rcTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function rcStepFx(){
  for(const p of rcParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx=0; p.vy=0; } }
  rcParts=rcParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of rcTexts){ t.life--; if(t.life%3===0) t.y--; }
  rcTexts=rcTexts.filter(t=>t.life>0);
}
function rcTipBin(B){ if(!B.up) return; B.up=false; for(let k=0;k<5;k++) rcParts.push({x:B.x+1,y:streetRow-2,vx:(Math.random()-0.3)*1.2,vy:-0.4,g:0.08,ch:"%&*~"[(Math.random()*4)|0],mode:'rctrash',life:30}); for(let c=B.x;c<B.x+5&&c<COLS;c++) rcTrash[c]=Math.max(rcTrash[c],1); }

function __m88_loop(){
  if(phase==='rc_run'){
    if(!rcStarted) rcInit();
    const beat=RC_BEATS[rcIdx], dur=rcDur(beat.cap), f=rcT/Math.max(1,dur-1), key=beat.key, g=rcG;
    // raccoons wander the street (or the junk) unless they've got something better to do
    for(const R of rcRacs){
      if(R.from){ R.y+=(streetRow-1-R.y)*0.15; if(Math.abs(R.y-(streetRow-1))<0.5){ R.y=streetRow-1; R.from=null; } continue; }
      R.x+=R.vx*(R.surf?3:1); if(R.x<1||R.x>COLS-7) R.vx=-R.vx;
      R.y=rcJunk?streetRow-1-rcJunkH(Math.max(0,Math.min(COLS-1,Math.round(R.x+2)))):streetRow-1-rcTrash[Math.max(0,Math.min(COLS-1,Math.round(R.x+2)))]-Math.round(rcWater>1?rcWater-1:0);
    }

    if(key==='first'){
      if(!rcRacs.length) rcRacs.push({x:g.hedge+2,y:streetRow-1,vx:0,surf:false});
      const R=rcRacs[0], B=rcBins[0]; R.vx=0;
      if(R.x<B.x-6) R.x+=0.4; else { rcTipBin(B); if(rcT%6===0) rcText("rummage",B.x+1,streetRow-4,'rctext',10); }
    }
    if(key==='pizza'){ const R=rcRacs[0]; rcPizza={x:R.x+1,y:streetRow-3}; if(rcT%15===5) rcText("*",R.x+3,streetRow-5,'rcpizza',10); if(rcT===Math.round(dur*0.5)) rcText("ooh...",R.x+2,streetRow-6,'rctext',30); }
    if(key==='spread'){
      // eyes in every dark corner: one pair, then ten, then a hundred (as far as they fit)
      const want=f<0.3?2:(f<0.6?11:Math.min(100,Math.round(COLS*streetRow/40)));
      while(rcEyes.length<want){ const c=(Math.random()*(COLS-3))|0, r=Math.max(rcColTop(c),2)+((Math.random()*(streetRow-rcColTop(c)))|0); rcEyes.push({x:c,y:Math.min(streetRow-1,r),ph:(Math.random()*24)|0}); }
      rcPizza=null;
    }
    if(key==='emerge'){
      if(rcT%3===0){
        const src=["drain","chimney","flap"][(rcT/3)%3];
        if(src==="drain"){ const c=(Math.random()*(COLS-6))|0; rcAddRac(c,streetRow+2,undefined,'drain'); rcRacs[rcRacs.length-1].from='drain'; }
        else if(src==="chimney"){ const c=(Math.random()*(COLS-6))|0, t=rcColTop(c); rcAddRac(c,t,undefined,'chimney'); }
        else rcAddRac((Math.random()*(COLS-6))|0);
      }
      if(rcT===Math.round(dur*0.6)){ rcAddRac(g.man+2,streetRow-2); rcText("?!",g.man+1,streetRow-6,'rctext',20); }
      if(f>0.5) rcEyes=rcEyes.filter(()=>Math.random()>0.03);
    }
    if(key==='binwar'){ rcEyes=[]; if(rcT===2){ for(const B of rcBins) rcTipBin(B); rcText("CLATTER",cx,streetRow-8,'rctext',30); rcShake=3; } for(let c=0;c<COLS;c++) if(Math.random()<0.02) rcTrash[c]=Math.min(2,rcTrash[c]+1); }
    if(key==='surf'){ for(let c=0;c<COLS;c++) if(Math.random()<0.03) rcTrash[c]=Math.min(2,rcTrash[c]+1); rcRacs.forEach((R,i)=>{ if(i%3===0) R.surf=true; }); if(rcT%10===0) rcText("WHEEE",(Math.random()*COLS)|0,streetRow-6,'rctext',10); }
    if(key==='lorry'){
      if(!rcLorry) rcLorry={x:-10,hop:0};
      rcLorry.x+=1; rcLorry.hop=Math.abs(Math.sin(rcT*0.4))*1.5;
      if(rcT%12===0) rcText("BEEP BEEP",rcLorry.x+5,streetRow-6,'rctext',10);
    }
    if(key==='boss'){
      rcLorry=null; rcRacs.forEach(R=>R.surf=false);
      if(!rcBoss) rcBoss={x:Math.round(COLS*0.15), y:streetRow-1-rcTrash[Math.round(COLS*0.15)], throne:false};
      // the others line up in front of the boss
      rcRacs.forEach((R,i)=>{ R.vx=0; R.x+=((rcBoss.x+8+(i%12)*6)-R.x)*0.08; });
      if(rcT%14===4) rcText(["YOU. BINS.","YOU. CARS.","EVERYONE: EVERYTHING."][(rcT/14|0)%3],rcBoss.x+2,rcBoss.y-5,'rctext',14);
    }
    if(key==='dismantle'){
      rcRacs.forEach(R=>{ if(!R.vx) R.vx=(Math.random()<0.5?-1:1)*0.3; });
      // the tallest few buildings get taken apart from the roof down, a piece at a time
      if(rcT%2===0) for(let k=0;k<Math.max(2,Math.round(COLS/40));k++){
        const c=(Math.random()*(g.tipL-2))|0, t=rcColTop(c); if(t>=streetRow) continue;
        setCh(cityGridArr,t,c," "); rcParts.push({x:c,y:t,vx:(Math.random()-0.5)*0.8,vy:-0.3,g:0.06,ch:"#",mode:'rubble',life:20});
      }
    }
    if(key==='atm'){ if(rcT%2===0) rcParts.push({x:g.atm+2,y:streetRow-2,vx:-0.6-Math.random(),vy:-0.6-Math.random()*0.4,g:0.05,ch:"$",mode:'rcmoney',life:30}); if(rcT%14===0) rcText("pfft.",g.atm+2,streetRow-5,'rctext',12); }
    if(key==='boots'){ if(rcT%3===0) rcParts.push({x:g.vend+3,y:streetRow-2,vx:(Math.random()-0.5)*1.4,vy:-0.6,g:0.07,ch:"u",mode:'rccan',life:22}); if(rcT%10===0) rcText("CLUNK",(Math.random()*COLS)|0,streetRow-4,'rctext',10); }
    if(key==='vault'){ if(f>0.2) rcVault=true; if(f>0.5){ rcSandwich=true; if(rcT%6===0) rcText("YAAAY",g.bank+3+(Math.random()-0.5)*16,streetRow-9,'rctext',10); } }
    if(key==='wash'){ rcSandwich=false; if(rcT%6===0) rcText("scrub scrub",(g.rv0+g.rv1)/2,streetRow-5,'rctext',10); rcRacs.forEach((R,i)=>{ if(i<6){ R.vx=0; R.x+=((g.rv0-2+i*2)-R.x)*0.1; } }); }
    if(key==='overflow'){ rcWater=Math.min(3,3*f); }
    if(key==='tip'){ rcWater=Math.max(0,rcWater-0.1); if(rcT%12===0) rcText("!!!",g.tipC,streetRow-g.tipH-3,'rctext',12); rcRacs.forEach(R=>{ R.vx=Math.abs(R.vx||0.3); }); }
    if(key==='tunnel'){ if(rcT%8===0) rcText("dig dig",g.tipC+(Math.random()-0.5)*g.tipHW,streetRow-g.tipH-2,'rctext',10); rcShake=1; }
    if(key==='landslide'){
      const maxB=(function(){ let m=0; for(let c=0;c<COLS;c++) m=Math.max(m,streetRow-rcColTop(c)); return m; })();
      if(!rcJunk){ rcJunk={H:Math.min(streetRow-4,maxB+3), front:g.tipL}; rcText("RUMBLE",g.tipC,streetRow-g.tipH-4,'rctext',30); }
      rcJunk.front=Math.round(g.tipL-(g.tipL+COLS*0.1)*Math.min(1,f/0.85)); rcFront=rcJunk.front;
      rcShake=4;
      if(f>0.9) for(let r=0;r<streetRow;r++) cityGridArr[r]=" ".repeat(COLS);
      rcBins=[]; rcTrash.fill(0); rcWater=0;
    }
    if(key==='settle'){ rcJunk.front=-COLS; if(rcRacs.length<30) rcAddRac((Math.random()*(COLS-6))|0); if(rcT%12===0) rcText("\u2665",(Math.random()*COLS)|0,6,'rcheart',14); }
    if(key==='homes'){ if(rcHomes.length<Math.max(4,Math.round(COLS/14)) && rcT%4===0) rcHomes.push({x:2+((Math.random()*(COLS-6))|0)}); }
    if(key==='throne'){
      let pc=0, ph=0; for(let c=0;c<COLS;c++){ const h=rcJunkH(c); if(h>ph){ ph=h; pc=c; } }
      if(rcBoss){ rcBoss.throne=true; rcBoss.x=pc-2; rcBoss.y=streetRow-1-ph-3; }
    }
    if(key==='bite'){
      const B=rcBoss;
      if(!rcPizza) rcPizza={x:B.x+1,y:B.y-4};
      if(rcT===Math.round(dur*0.45)){ rcText("chomp",B.x+2,B.y-6,'rctext',16); rcPizzaArt[0]="(:: "; }
      if(f>0.6){ rcPizza.x-=0.7; rcPizza.y+=0.6; if(rcPizza.y>streetRow) rcPizza=null; }
    }
    if(key==='lens'){ rcPizza=null; if(f>0.5 && !rcDark){ rcDark=true; document.body.style.background="#000000"; } }

    if(rcShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*rcShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*rcShake).toFixed(1)+"px)"; rcShake*=0.9; }
    else { stage.style.transform=""; rcShake=0; }
    rcStepFx();
    rcRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#c8c0b0"; sub.style.textShadow="0 0 8px #3a3a4a";
    rcT++;
    if(rcT>=dur){ rcT=0; rcIdx++; if(rcIdx>=RC_BEATS.length){ phase='rc_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='rc_hold'){
    stage.style.transform="";
    rcT++;
    rcRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=RC_HOLD; sub.style.color="#c8c0b0"; sub.style.textShadow="0 0 8px #3a3a4a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m88_start(){
  attackMode='rc_run';
  cmd.style.color="#c8c0b0"; cmd.style.textShadow="0 0 20px #3a3a4a";
  rcStarted=false; phase='rc_run';
}

function __m88_reset(){
  rcStarted=false; rcT=0; rcIdx=0; rcG=null; rcBins=[]; rcRacs=[]; rcEyes=[]; rcTrash=[]; rcParts=[]; rcTexts=[];
  rcBoss=null; rcPizza=null; rcLorry=null; rcWater=0; rcJunk=null; rcFront=-1; rcHomes=[]; rcDark=false; rcShake=0; rcSandwich=false; rcVault=false;
  rcPizzaArt[0]="(::>";
  stage.style.transform="";
}

registerMethod(88, { start: __m88_start, resetFn: __m88_reset, loopFn: __m88_loop, phaseNames: ['rc_run','rc_hold'] });
