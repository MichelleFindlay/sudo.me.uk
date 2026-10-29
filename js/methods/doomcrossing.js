let dcStarted=false, dcT=0, dcIdx=0, dcG=null, dcPlane=null, dcGuy=null, dcDemons=[], dcKing=null, dcParts=[], dcTexts=[];
let dcTally=0, dcNight=false, dcPortal=0, dcTrees=[], dcMuseum=true, dcHouses=[], dcCrack=0, dcWiped=false, dcCoon=null, dcOrb=null, dcBug=null, dcNet=0, dcShake=0;

// ---- DOOM CROSSING ----
// the city becomes a cosy island village (everything drawn as overlays on a cleared grid:
// trees, houses, museum, the Resident Services tent). A new resident arrives by seaplane;
// then a hell portal opens by the museum, and it goes about how you'd expect
const DC_BEATS=[
  {key:'est',     cap:"THE PEACEFUL CITY HAS BECOME A COSY ISLAND VILLAGE OVERNIGHT. FRUIT TREES, LITTLE WOODEN HOUSES, A MUSEUM."},
  {key:'dog',     cap:"A SMALL YELLOW DOG IN A CARDIGAN STANDS AT A DESK UNDER A \"RESIDENT SERVICES\" TENT."},
  {key:'tannoy',  cap:"THE VILLAGE TANNOY CHIMES. A NEW RESIDENT IS MOVING IN TODAY! EVERYONE IS SO EXCITED.", dog:"A NEW RESIDENT IS MOVING IN TODAY!"},
  {key:'plane',   cap:"A SEAPLANE LANDS AT THE DOCK."},
  {key:'arrival', cap:"A HUGE FIGURE IN BATTERED GREEN ARMOUR STEPS OFF, CARRYING A SHOTGUN, A CHAINSAW, AND A TINY POTTED PLANT."},
  {key:'tip',     cap:"HE SILENTLY TIPS HIS HELMET AT THE DOG. SHE WAVES BACK, DELIGHTED."},
  {key:'tasks',   cap:"HE'S GIVEN A TENT AND A LIST OF ISLAND TASKS: CATCH A FISH, PICK SOME FRUIT, PAY OFF YOUR HOME LOAN."},
  {key:'nod',     cap:"HE READS IT VERY CAREFULLY. THEN NODS."},
  {key:'night',   cap:"THAT NIGHT, THE GROUND CRACKS OPEN ON THE BEACH."},
  {key:'portal',  cap:"A PORTAL TO HELL ERUPTS BESIDE THE MUSEUM. DEMONS START POURING OUT AND TRAMPLING THE FLOWER BEDS."},
  {key:'rod',     cap:"HE CALMLY PUTS DOWN HIS FISHING ROD, AND PICKS UP THE CHAINSAW."},
  {key:'rip',     cap:"WHAT FOLLOWS IS A BLUR OF CARTOON VIOLENCE, SET TO HEAVY METAL."},
  {key:'trees',   cap:"DEMONS GO FLYING. PALM TREES ARE CHAINSAWED IN HALF. THE MUSEUM'S FOSSIL EXHIBIT GETS USED AS A CLUB."},
  {key:'friend',  cap:"THE LITTLE DOG DOESN'T PANIC. SHE HANDS HIM AMMO FROM HER DESK, AND WATERS HIS FLOWERS BETWEEN EXPLOSIONS."},
  {key:'tally',   cap:"SHE KEEPS A RUNNING TALLY OF DEMONS ON A CLIPBOARD. THEY HIGH-FIVE OVER A SMOULDERING IMP."},
  {key:'loan',    cap:"A RACCOON IN AN APRON APPEARS, WITH A REMINDER THAT THE HOME LOAN IS STILL OUTSTANDING.", coon:"YOUR HOME LOAN IS STILL OUTSTANDING."},
  {key:'turnips', cap:"THE ARMOURED FIGURE STARES AT HIM. THEN EMPTIES A WHOLE BAG OF TURNIPS ONTO THE COUNTER. THE RACCOON ACCEPTS THEM QUIETLY."},
  {key:'king',    cap:"THE DEMON KING RISES FROM THE PORTAL, TOWERING OVER THE ISLAND."},
  {key:'bfg',     cap:"HE PULLS OUT THE BFG. AND FIRES."},
  {key:'wipe',    cap:"THE FLASH WIPES OUT THE DEMON KING, THE PORTAL, THE MUSEUM, THE FRUIT TREES, THE AIRPORT, AND MOST OF THE ISLAND."},
  {key:'silence', cap:"SILENCE. SMOKE DRIFTS OVER A CRATER WHERE THE VILLAGE USED TO BE."},
  {key:'bench',   cap:"IN THE MIDDLE, ON THE ONE SURVIVING BENCH, THEY SIT DRINKING COFFEE FROM THE CAFE."},
  {key:'rating',  cap:"SHE SHOWS HIM THE ISLAND RATING. IT'S NOW ONE STAR. HE GIVES A THUMBS UP.", dog:"ISLAND RATING: \u2605\u2606\u2606\u2606\u2606"},
  {key:'bug',     cap:"A SINGLE BUG CATCHES HIS EYE. HE SLOWLY REACHES FOR THE NET."}
];
const DC_HOLD="RIP AND TEAR. ONE STAR. — press RESET";

const dcGuyArt=[" ___ ","[=-=]","/|#|\\","|###|"," | | ","_| |_"];
const dcSitArt=[" ___ ","[=-=]","/|#|\\","|___|"];
const dcDogArt=[" ^ ^ ","(o.o)","[=#=]"];
const dcTentArt=["  /\\  "," /RS\\ ","/____\\"];
const dcPlaneArt=["   _|_   ","=[_____]>"," ~o   o~ "];
const dcMuseumArt=["   ___   ","  /   \\  "," /MUSEUM\\","|=======|","|| | | ||","||_|_|_||"];
const dcHouseArt=[" /\\ ","/  \\","|[]|"];
const dcTreeArt=[" (@o) ","(o@@o)","  ||  ","  ||  "];
const dcTreeCutArt=["  ||  "];
const dcPortalArt=[" .~~~~~. ","(@@@@@@@)","(@@@@@@@)"," '~~~~~' "];
const dcImpArts=[["^ ^","(o)","/#\\"],["^ ^","(O)","\\#/"]];
const dcKingArt=["\\^   ^/"," (O O) ","/|###|\\"," |###| "," /   \\ "];
const dcCoonArt=["(o-o)","[==]","|  |"];
const dcTasksArt=["+--------------------+","| ISLAND TASKS:      |","| - CATCH A FISH     |","| - PICK SOME FRUIT  |","| - PAY OFF HOME LOAN|","+--------------------+"];
const dcBenchArt=["[_________]","|         |"];

function dcDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function dcScale(art,s){ if(s<=1) return art; const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out; }
function dcPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function dcText(s,x,y,mode,life){ dcTexts.push({s,x,y,mode:mode||'dctext',life:life||20}); }
function dcBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function dcColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }

function dcInit(){
  dcStarted=true; dcT=0; dcIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  for(let r=0;r<streetRow;r++) cityGridArr[r]=" ".repeat(COLS);       // the city is now a village
  const at=f=>Math.round(COLS*f);
  dcG={seaL:at(0.07), seaR:at(0.95), dock:at(0.02), tent:at(0.16), museum:at(0.56), portal:at(0.7), myTent:at(0.36), flowers:[at(0.64),at(0.8)]};
  dcTrees=[0.27,0.47,0.75,0.84,0.9].map(f=>({x:at(f), cut:false}));
  dcHouses=[0.31,0.42].map(f=>({x:at(f)}));
  dcPlane=null; dcGuy=null; dcDemons=[]; dcKing=null; dcParts=[]; dcTexts=[]; dcTally=0; dcNight=false; dcPortal=0; dcMuseum=true; dcCrack=0; dcWiped=false; dcCoon=null; dcOrb=null; dcBug=null; dcNet=0; dcShake=0;
  document.body.style.background="#5ab0e0";
}

function dcRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=dcG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  // sea either side, island grass in between (scorched once the BFG goes off)
  for(let c=0;c<COLS;c++){
    const sea=c<g.seaL||c>g.seaR;
    if(sea){ for(let r=streetRow;r<ROWS;r++){ setCh(grid,r,c,((c+r+dcT)%4<2)?"~":"\u2248"); setMode(mg,r,c,'water'); } }
    else if(dcWiped){ const crater=Math.abs(c-cx)<COLS*0.3; setCh(grid,streetRow,c,crater?"_":","); setMode(mg,streetRow,c,'dcscorch'); }
    else { setCh(grid,streetRow,c,(c%3)?"\"":"'"); setMode(mg,streetRow,c,'dcgrass'); }
  }
  if(!dcWiped){
    // the dock (also the airport) and the village
    for(let c=g.dock;c<=g.seaL+1;c++){ setCh(grid,streetRow-1,c,"="); setMode(mg,streetRow-1,c,'dcwood'); }
    dcPlace(grid,mg,["AIRPORT"],g.dock,streetRow-3,'dcsign');
    for(const T of dcTrees) dcPlace(grid,mg,T.cut?dcTreeCutArt:dcTreeArt,T.x-3,streetRow-(T.cut?1:dcTreeArt.length),'dctree');
    for(const H of dcHouses) dcPlace(grid,mg,dcHouseArt,H.x-2,streetRow-3,'dchouse');
    if(dcMuseum) dcPlace(grid,mg,dcMuseumArt,g.museum-4,streetRow-dcMuseumArt.length,'dcmuseum');
    for(const fx of g.flowers) for(let k=0;k<6;k++){ const trampled=dcDemons.length>0||dcPortal>0; setCh(grid,streetRow-1,fx+k,trampled&&k%2?",":"*"); setMode(mg,streetRow-1,fx+k,'dcflower'); }
    dcPlace(grid,mg,["[RESIDENT SERVICES]"],Math.max(0,g.tent-6),streetRow-7,'dcsign');
    dcPlace(grid,mg,dcTentArt,g.tent-3,streetRow-3,'dctent');
    if(['tasks','nod','night','portal','rod','rip','trees','friend','tally','loan','turnips','king','bfg'].includes(key)) dcPlace(grid,mg,[" /\\ ","/__\\"],g.myTent,streetRow-2,'dcmytent');
    if(dcCrack>0) for(let k=0;k<Math.round(dcCrack);k++){ setCh(grid,streetRow,g.portal-6+k,k%2?"/":"\\"); setMode(mg,streetRow,g.portal-6+k,'dclava'); }
    if(dcPortal>0) dcPlace(grid,mg,dcScale(dcPortalArt,Math.max(1,Math.round(dcPortal))),g.portal-4*Math.round(dcPortal),streetRow-dcPortalArt.length*Math.round(dcPortal),'dcportal');
  }
  // the dog at her desk, the clipboard, the raccoon
  const dogX=g.tent-2;
  if(!dcWiped || ['bench','rating','bug','hold'].includes(key)){
    if(!dcWiped){ dcPlace(grid,mg,dcDogArt,dogX,streetRow-3,'dcdog'); dcPlace(grid,mg,["[____]"],dogX-1,streetRow-1,'dcwood'); }
    if(dcTally>0 && !dcWiped) dcPlace(grid,mg,["DEMONS: "+dcTally],Math.max(0,dogX-2),streetRow-9,'dctally');
  }
  if(dcCoon) dcPlace(grid,mg,dcCoonArt,dogX+6,streetRow-3,'dccoon');
  if(dcPlane) dcPlace(grid,mg,dcPlaneArt,dcPlane.x,dcPlane.y,'dcplane');
  // demons, the king, the BFG shot
  for(const D of dcDemons) dcPlace(grid,mg,dcImpArts[(dcT>>2)%2],D.x,streetRow-3-Math.round(D.hop||0),'dcimp');
  if(dcKing) dcPlace(grid,mg,dcScale(dcKingArt,dcKing.s),g.portal-Math.round(dcKingArt[0].length*dcKing.s/2),streetRow-dcKingArt.length*dcKing.s-Math.round(dcKing.lift),'dcking');
  if(dcOrb) dcPlace(grid,mg,["(@@)","(@@)"],dcOrb.x,dcOrb.y,'dcbfg');
  // our new resident
  if(dcGuy && !dcWiped){
    dcPlace(grid,mg,dcGuyArt,dcGuy.x,streetRow-dcGuyArt.length,'dcguy');
    const hx=dcGuy.x+5, hy=streetRow-4;
    if(dcGuy.hold==='saw') dcPlace(grid,mg,["[#]=<"],hx,hy,(dcT%2)?'dcsaw':'dcsaw2');
    else if(dcGuy.hold==='rod') dcPlace(grid,mg,["--/"],hx,hy,'dcwood');
    else if(dcGuy.hold==='bfg') dcPlace(grid,mg,["[BFG]=O"],hx,hy,'dcbfgun');
    else if(dcGuy.hold==='club') dcPlace(grid,mg,["<o==o>"],hx,hy-1,'dcbone');
    else dcPlace(grid,mg,["=-","u*"],hx,hy,'dcplant');
  }
  if(key==='tasks'||key==='nod') dcPlace(grid,mg,dcTasksArt,Math.max(0,Math.min(COLS-22,g.myTent-6)),Math.max(1,streetRow-16),'dclist');
  // the survivors, on the bench
  if(dcWiped && ['bench','rating','bug','hold'].includes(key)){
    const bx=cx-5;
    dcPlace(grid,mg,dcBenchArt,bx,streetRow-2,'dcwood');
    dcPlace(grid,mg,dcSitArt,bx+1,streetRow-2-dcSitArt.length,'dcguy');
    dcPlace(grid,mg,dcDogArt,bx+6,streetRow-2-dcDogArt.length,'dcdog');
    dcPlace(grid,mg,["u"],bx+5,streetRow-5,'dccoffee'); dcPlace(grid,mg,["u"],bx+11,streetRow-4,'dccoffee');
    if(dcT%6<3) dcPlace(grid,mg,["~"],bx+5,streetRow-6,'dcsmoke');
    if(key==='rating'&&f>0.6) dcText("*thumbs up*",bx+3,streetRow-9,'dctext',2);
    if(dcBug) dcPlace(grid,mg,[(dcT>>1)%2?"}{":"><"],dcBug.x,dcBug.y,'dcbug');
    if(dcNet>0){ const n=Math.round(dcNet); dcPlace(grid,mg,["-".repeat(n)+"Q"],bx+5,streetRow-5,'dcnet'); }
  }
  for(const p of dcParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of dcTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  if(beat && beat.dog && f<0.92) dcBubble(grid,mg,dcWiped?cx+3:dogX+2,dcWiped?streetRow-5:streetRow-3,beat.dog);
  if(beat && beat.coon && f<0.92) dcBubble(grid,mg,dogX+8,streetRow-3,beat.coon);
  scene.innerHTML=paint(grid,mg,'city');
}
function dcStepFx(){
  for(const p of dcParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx*=0.5; p.vy=0; } }
  dcParts=dcParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of dcTexts){ t.life--; if(t.life%3===0) t.y--; }
  dcTexts=dcTexts.filter(t=>t.life>0);
}
function dcFling(D){
  // a demon, sent flying
  for(const ch of "^(o)/#\\") dcParts.push({x:D.x+1,y:streetRow-3,vx:(Math.random()-0.5)*2,vy:-0.6-Math.random()*0.8,g:0.06,ch,mode:'dcimp',life:30});
  dcTally++;
}

function __m89_loop(){
  if(phase==='dc_run'){
    if(!dcStarted) dcInit();
    const beat=DC_BEATS[dcIdx], dur=dcDur(beat.cap), f=dcT/Math.max(1,dur-1), key=beat.key, g=dcG;

    if(key==='tannoy' && dcT%16===2) dcText("ding dong ding",g.tent,2,'dctext',14);
    if(key==='plane'){
      if(!dcPlane) dcPlane={x:-10,y:2};
      dcPlane.x=-10+(g.dock+1+10)*Math.min(1,f/0.8); dcPlane.y=2+(streetRow-3-2)*Math.min(1,f/0.8);
      if(f>0.8 && dcT%6===0) dcParts.push({x:dcPlane.x+8,y:streetRow,vx:0.3,vy:-0.2,g:0.02,ch:"~",mode:'water',life:10});
    }
    if(key==='arrival'){
      if(!dcGuy) dcGuy={x:g.dock+1, hold:'plant'};
      dcGuy.x=Math.min(g.tent+5,dcGuy.x+0.25);
      if(f>0.6 && dcPlane){ dcPlane.x-=0.8; dcPlane.y=Math.max(1,dcPlane.y-0.4); if(dcPlane.x<-12) dcPlane=null; }
    }
    if(key==='tip'){ dcPlane=null; if(dcT===Math.round(dur*0.2)) dcText("*tips helmet*",dcGuy.x+2,streetRow-8,'dctext',24); if(dcT===Math.round(dur*0.55)) dcText("*waves*",g.tent,streetRow-6,'dctext',24); }
    if(key==='tasks'){ dcGuy.x+=(g.myTent+4-dcGuy.x)*0.06; }
    if(key==='nod'){ if(dcT===Math.round(dur*0.75)) dcText("*nods*",dcGuy.x+2,streetRow-8,'dctext',20); }
    if(key==='night'){ if(!dcNight){ dcNight=true; document.body.style.background="#101830"; } dcCrack=Math.min(12,dcCrack+0.4); if(dcT%10===0) dcText("KRRRK",g.portal-1,streetRow-3,'dclava',10); dcGuy.hold='rod'; dcShake=1.5; }
    if(key==='portal'){
      dcPortal=Math.min(2,dcPortal+0.04);
      document.body.style.background="#301018";
      if(dcT%8===0 && dcDemons.length<12) dcDemons.push({x:g.portal,vx:(Math.random()<0.6?-1:1)*(0.3+Math.random()*0.3),hop:0});
    }
    for(const D of dcDemons){ D.x+=D.vx; D.hop=Math.abs(Math.sin((dcT+D.x)*0.3)); if(D.x<g.seaL||D.x>g.seaR-3) D.vx=-D.vx; }
    if(key==='rod'){ dcGuy.hold=f<0.5?'rod':'saw'; if(dcT===Math.round(dur*0.5)) dcText("VRRRRMMM",dcGuy.x+6,streetRow-7,'dcsaw',24); }
    if(key==='rip'||key==='trees'){
      // the blur: he charges back and forth, and anything near the chainsaw goes flying
      dcGuy.hold=key==='trees'&&f>0.6?'club':'saw';
      const tx=dcDemons.length?dcDemons[0].x-6:g.portal-8;
      dcGuy.x+=(tx-dcGuy.x)*0.25;
      dcDemons=dcDemons.filter(D=>{ if(Math.abs(D.x-(dcGuy.x+7))<4){ dcFling(D); return false; } return true; });
      if(dcT%4===0 && dcDemons.length<10) dcDemons.push({x:g.portal,vx:(Math.random()<0.5?-1:1)*0.4,hop:0});
      if(dcT%10===0) dcText(["\\m/","RIP AND TEAR","\\m/ \\m/","BRRRAAAAP"][(dcT/10|0)%4],(Math.random()*COLS)|0,4+Math.random()*4,'dcmetal',12);
      if(key==='trees') for(const T of dcTrees) if(!T.cut && Math.abs(T.x-(dcGuy.x+7))<5){ T.cut=true; dcText("SKRRT",T.x,streetRow-6,'dcsaw',12); for(let k=0;k<4;k++) dcParts.push({x:T.x,y:streetRow-4,vx:(Math.random()-0.5)*1.2,vy:-0.5,g:0.07,ch:"@",mode:'dctree',life:24}); }
      dcShake=1.5;
    }
    if(key==='friend'){
      if(dcT%5===0) dcParts.push({x:g.tent,y:streetRow-3,vx:(dcGuy.x-g.tent)/16,vy:-0.6,g:0.05,ch:"[",mode:'dcammo',life:16});
      if(dcT%3===0) dcParts.push({x:g.flowers[0]+((Math.random()*6)|0),y:streetRow-3,vx:0,vy:0.3,g:0,ch:"'",mode:'water',life:6});
      dcDemons=dcDemons.filter(D=>{ if(Math.random()<0.05){ dcFling(D); dcText("BOOM",D.x,streetRow-5,'dcmetal',10); return false; } return true; });
      if(dcT%8===0 && dcDemons.length<8) dcDemons.push({x:g.portal,vx:-0.4,hop:0});
    }
    if(key==='tally'){
      if(dcT%3===0) dcTally++;
      if(dcT===Math.round(dur*0.6)){ dcText("*HIGH FIVE*",(dcGuy.x+g.tent)/2,streetRow-8,'dctext',24); dcDemons=[]; }
      dcGuy.x+=(g.tent+6-dcGuy.x)*0.1; dcGuy.hold='saw';
    }
    if(key==='loan'){ if(!dcCoon) dcCoon={}; }
    if(key==='turnips'){
      if(f>0.35 && dcT%2===0 && f<0.8) dcParts.push({x:dcGuy.x+5,y:streetRow-5,vx:0.4+Math.random()*0.4,vy:-0.3,g:0.08,ch:"v",mode:'dcturnip',life:40});
      if(dcT===Math.round(dur*0.85)) dcText("...",g.tent+8,streetRow-5,'dctext',20);
    }
    if(key==='king'){
      if(dcT===0) dcCoon=null;
      const S=Math.max(2,Math.min(5,Math.floor((streetRow-2)*0.75/dcKingArt.length)));
      if(!dcKing) dcKing={s:1, lift:-6};
      dcKing.s=Math.max(1,Math.round(1+(S-1)*Math.min(1,f/0.7))); dcKing.lift=0;
      dcShake=2+f*2;
      if(dcT%12===0) dcText("ROOOAAAR",g.portal,4,'dclava',12);
    }
    if(key==='bfg'){
      dcGuy.hold='bfg';
      if(f>0.5 && !dcOrb) dcOrb={x:dcGuy.x+12,y:streetRow-5};
      if(dcOrb){ dcOrb.x+=Math.max(1.5,(g.portal-dcOrb.x)/Math.max(1,dur*0.95-dcT)); }
      document.body.style.background=f>0.5?"#103018":"#301018";
    }
    if(key==='wipe' && !dcWiped){
      dcWiped=true; dcOrb=null; dcKing=null; dcDemons=[]; dcPortal=0; dcMuseum=false; dcTrees=[]; dcHouses=[];
      flash.style.transition="opacity 0.03s"; flash.style.opacity=1; setTimeout(()=>{ flash.style.transition="opacity 1.4s"; flash.style.opacity=0; },120);
      dcShake=14; document.body.style.background="#2a2a20";
    }
    if(key==='wipe'||key==='silence'){ if(dcT%2===0) dcParts.push({x:Math.random()*COLS,y:streetRow-1,vx:0.15,vy:-0.15,g:0,ch:Math.random()<0.5?"~":".",mode:'dcsmoke',life:40}); }
    if(key==='bench'){ document.body.style.background="#3a4a6a"; }
    if(key==='bug'){
      if(!dcBug) dcBug={x:cx+12,y:streetRow-9};
      dcBug.x=cx+10+Math.sin(dcT*0.15)*4; dcBug.y=streetRow-9+Math.sin(dcT*0.3)*1.5;
      if(f>0.4) dcNet=Math.min(5,dcNet+0.08);
    }

    if(dcShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*dcShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*dcShake).toFixed(1)+"px)"; dcShake*=0.9; }
    else { stage.style.transform=""; dcShake=0; }
    dcStepFx();
    dcRender(beat,f);
    sub.textContent=beat.cap; sub.style.color=dcNight&&!dcWiped?"#ff5030":"#ffe08a"; sub.style.textShadow="0 0 8px #3a7a3a";
    dcT++;
    if(dcT>=dur){ dcT=0; dcIdx++; if(dcIdx>=DC_BEATS.length){ phase='dc_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='dc_hold'){
    stage.style.transform="";
    dcStepFx(); dcT++;
    if(dcBug){ dcBug.x=cx+10+Math.sin(dcT*0.15)*4; dcBug.y=streetRow-9+Math.sin(dcT*0.3)*1.5; }
    dcRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=DC_HOLD; sub.style.color="#ffe08a"; sub.style.textShadow="0 0 8px #3a7a3a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m89_start(){
  attackMode='dc_run';
  cmd.style.color="#8ad040"; cmd.style.textShadow="0 0 20px #ff3010";
  dcStarted=false; phase='dc_run';
}

function __m89_reset(){
  dcStarted=false; dcT=0; dcIdx=0; dcG=null; dcPlane=null; dcGuy=null; dcDemons=[]; dcKing=null; dcParts=[]; dcTexts=[];
  dcTally=0; dcNight=false; dcPortal=0; dcTrees=[]; dcMuseum=true; dcHouses=[]; dcCrack=0; dcWiped=false; dcCoon=null; dcOrb=null; dcBug=null; dcNet=0; dcShake=0;
  stage.style.transform="";
}

registerMethod(89, { start: __m89_start, resetFn: __m89_reset, loopFn: __m89_loop, phaseNames: ['dc_run','dc_hold'] });
