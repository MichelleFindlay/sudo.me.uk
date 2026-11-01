let gmStarted=false, gmT=0, gmIdx=0, gmG=null, gmX=-20, gmS=1, gmPeople=[], gmParts=[], gmTexts=[], gmPurp=-1, gmGutter=0;
let gmSci=[], gmClip=0, gmPlanet=0, gmSitting=false, gmShake=0;

// ---- GRIMACE ----
// a limited-time purple shake. People flop down in dramatic poses; then a round purple
// friend wobbles into town, and everything within gmPurp columns of him turns purple until
// the whole city is; finally the city is replaced by a wobbling purple planet, with him
// sitting on top of it, sipping
const GM_BEATS=[
  {key:'menu',      cap:"IT STARTS WITH A NEW ITEM ON THE MENU. A PURPLE MILKSHAKE. LIMITED TIME ONLY. NOBODY READS THE SMALL PRINT."},
  {key:'lunch',     cap:"BY LUNCHTIME EVERYONE HAS TRIED ONE. IT TASTES LIKE BIRTHDAY CAKE, BLUEBERRIES, AND A FAINT SENSE OF FOREBODING."},
  {key:'first',     cap:"THE FIRST PERSON TO FINISH IT SAYS \"MMM\", THEN LIES DOWN VERY STILL ON THE PAVEMENT IN AN ODDLY DRAMATIC POSE."},
  {key:'film',      cap:"PEOPLE STEP AROUND HIM. THEN THEY FILM HIM. THEN THEY FINISH THEIR OWN SHAKES."},
  {key:'teatime',   cap:"BY TEATIME THE STREETS ARE LITTERED WITH MOTIONLESS PEOPLE: ON BENCHES, IN TROLLEYS, UPSIDE DOWN IN HEDGES."},
  {key:'fine',      cap:"THEY'RE ALL FINE, TECHNICALLY. THEY JUST CAN'T STOP BEING PURPLE."},
  {key:'arrives',   cap:"THEN HE ARRIVES."},
  {key:'wobble',    cap:"A SOFT, ROUND, PURPLE BLOB, WOBBLING DOWN THE HIGH STREET WITH A BEAMING SMILE AND NO ARMS WORTH MENTIONING. HE WAVES ANYWAY."},
  {key:'what',      cap:"NOBODY KNOWS WHAT HE IS. HE DOESN'T EXPLAIN. HE JUST WANTS TO WISH EVERYONE A HAPPY BIRTHDAY.", say:"HAPPY BIRTHDAY!"},
  {key:'nobody',    cap:"IT IS NOBODY'S BIRTHDAY."},
  {key:'purple',    cap:"WHEREVER HE GOES, THINGS TURN PURPLE. THE POSTBOX. THE RIVER. THE PRIME MINISTER'S FRONT DOOR."},
  {key:'sky',       cap:"THE SKY BLUSHES VIOLET, AND STAYS THAT WAY."},
  {key:'machines',  cap:"THE SHAKE MACHINES REFUSE TO SWITCH OFF. THEY POUR INTO THE GUTTERS, THEN THE DRAINS, THEN THE SEA."},
  {key:'fish',      cap:"SHIPPING LANES BECOME A THICK LILAC SLUSH. FISH START POSING DRAMATICALLY ON THE WAVES."},
  {key:'clipboard', cap:"SCIENTISTS GATHER TO STUDY HIM. THEY HAND HIM A CLIPBOARD. HE EATS IT. THEY HAND HIM ANOTHER. HE EATS THAT TOO."},
  {key:'hug',       cap:"THEN HE GIVES THEM A LITTLE HUG. THE SCIENTISTS ARE FOUND AN HOUR LATER, PURPLE AND SERENE, ARRANGED NEATLY IN A FOUNTAIN."},
  {key:'midnight',  cap:"BY MIDNIGHT, THE ENTIRE PLANET IS A GENTLY WOBBLING PURPLE SPHERE, HUMMING SOFTLY AND SMELLING FAINTLY OF BERRIES."},
  {key:'sits',      cap:"HE SITS ON TOP OF IT, PERFECTLY CONTENT, SIPPING ONE LAST SHAKE."},
  {key:'bday',      cap:"HAPPY BIRTHDAY, EARTH."}
];
const GM_HOLD="HAPPY BIRTHDAY, EARTH. — press RESET";
const gmArt=["  .---.  "," /#^#^#\\ ","|##\\_/##|","|#######|"," \\#####/ "];
const gmShopArt=[" __________ ","|NEW! SHAKE|","|  (U) (U) |","|__________|"];

function gmDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function gmScale(art,s){ if(s<=1) return art; const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out; }
function gmPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function gmText(s,x,y,mode,life){ gmTexts.push({s,x,y,mode:mode||'gmtext',life:life||20}); }
function gmBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function gmColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function gmClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++) setCh(cityGridArr,r,c," "); }
function gmIsPurple(c){ return gmPurp>=COLS*2 || (gmPurp>=0 && Math.abs(c-(gmX+gmArt[0].length*gmS/2))<=gmPurp); }

function gmInit(){
  gmStarted=true; gmT=0; gmIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const at=f=>Math.round(COLS*f);
  gmG={shop:at(0.06), post:at(0.32), door:at(0.5), fountain:at(0.66), rv0:at(0.82), rv1:at(0.82)+Math.max(6,at(0.07))};
  gmClear(gmG.shop-1,gmG.shop+12); gmClear(gmG.post-1,gmG.post+3); gmClear(gmG.door-1,gmG.door+5); gmClear(gmG.fountain-3,gmG.fountain+8); gmClear(gmG.rv0-1,gmG.rv1+1);
  const top=streetRow-gmShopArt.length; for(let i=0;i<gmShopArt.length;i++) for(let j=0;j<gmShopArt[i].length;j++){ const ch=gmShopArt[i][j]; if(ch!==" ") setCh(cityGridArr,top+i,gmG.shop+j,ch); }
  gmX=-20; gmS=1; gmParts=[]; gmTexts=[]; gmPurp=-1; gmGutter=0; gmSci=[]; gmClip=0; gmPlanet=0; gmSitting=false; gmShake=0;
  gmPeople=[]; const n=Math.max(6,Math.round(COLS/14));
  for(let i=0;i<n;i++) gmPeople.push({x:gmG.shop+14+Math.random()*(gmG.rv0-gmG.shop-20), vx:(Math.random()<0.5?-1:1)*0.25, down:false, pose:i%4, cup:false});
  document.body.style.background="#0c1428";
}

function gmRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=gmG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  if(gmPlanet>0){
    // the planet: a wobbling purple sphere, humming, with him sitting on top
    for(let r=0;r<ROWS;r++) grid[r]=" ".repeat(COLS);
    const R=gmPlanet, ccy=Math.round(ROWS*0.62), rx=R*2;
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const ux=(c-cx)/(rx*(1+0.03*Math.sin(gmT*0.3))), uy=(r-ccy)/(R*(1+0.03*Math.cos(gmT*0.3))), d=ux*ux+uy*uy;
      if(d>1) continue; setCh(grid,r,c,d>0.85?"o":((r*3+c*7+gmT)%11===0?"*":"~")); setMode(mg,r,c,d>0.85?'gmrim':'gmplanet');
    }
    if(gmSitting){ const art=gmScale(gmArt,Math.max(1,gmS-1)), w=art[0].length; gmPlace(grid,mg,art,cx-w/2,ccy-R-art.length+1,'gmblob'); gmPlace(grid,mg,["|","U"],cx+w/2+1,ccy-R-3,'gmcup'); }
    for(const p of gmParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
    for(const t of gmTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
    scene.innerHTML=paint(grid,mg,'city'); return;
  }
  // purple spreading out from him through every building
  if(gmPurp>=0) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==" " && gmIsPurple(c)) setMode(mg,r,c,(r+c)%5?'gmpurple':'gmpurple2');
  for(let r=streetRow-gmShopArt.length;r<streetRow;r++) for(let c=g.shop;c<g.shop+gmShopArt[0].length;c++) if(grid[r][c]!==" "&&!gmIsPurple(c)) setMode(mg,r,c,'gmshop');
  if(key==='menu') gmPlace(grid,mg,["*LIMITED TIME* (t&c apply)"],g.shop,streetRow-gmShopArt.length-2,'gmsmall');
  // postbox, the door, the river and fountain
  gmPlace(grid,mg,["[=]","| |"],g.post,streetRow-2,gmIsPurple(g.post)?'gmpurple':'gmred');
  gmPlace(grid,mg,["[10]","[  ]"],g.door,streetRow-2,gmIsPurple(g.door)?'gmpurple':'gmdoor');
  const riverP=gmIsPurple(g.rv0)||gmGutter>0;
  for(let c=g.rv0;c<=g.rv1;c++){ setCh(grid,streetRow,c,((c+gmT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,riverP?'gmslush':'water'); }
  gmPlace(grid,mg,["\\_____/"],g.fountain-1,streetRow-1,'gmfount');
  // the purple pouring along the gutter
  for(let c=g.shop+12;c<Math.min(COLS,g.shop+12+gmGutter);c++){ setCh(grid,streetRow,c,(c+gmT)%3?"~":"-"); setMode(mg,streetRow,c,'gmslush'); }
  // people: with shakes, then in dramatic poses
  for(const P of gmPeople){
    if(P.down){
      const art=[["o_____/"],["  \\o/ ","  _|_ "],["_||_","  o "],["(ou)"]][P.pose%4];
      gmPlace(grid,mg,art,P.x,streetRow-art.length,'gmdown');
      gmPlace(grid,mg,[","],P.x+2,streetRow-1,'gmpurple');
    } else { gmPlace(grid,mg,[" o ","/|"+(P.cup?"U":"\\"),"/ \\"],P.x,streetRow-3,'body'); if(P.cup) gmPlace(grid,mg,["U"],P.x+2,streetRow-2,'gmcup'); }
  }
  if(key==='film') for(const P of gmPeople) if(!P.down) gmPlace(grid,mg,["[]"],P.x+2,streetRow-3,'gmphone');
  // scientists, and the fountain they end up in
  for(const S of gmSci) gmPlace(grid,mg,S.inFount?[" o "]:[" o ","[#]","| |"],S.x,S.inFount?streetRow-2:streetRow-3,S.inFount?'gmpurple':'gmsci');
  if(gmClip>0) gmPlace(grid,mg,["[=]"],gmX+gmArt[0].length*gmS,streetRow-3,'gmclip');
  // him
  if(gmX>-30){
    const art=gmScale(gmArt,gmS), w=art[0].length, h=art.length, bob=(gmT>>2)%2;
    gmPlace(grid,mg,art,gmX,streetRow-h-bob,'gmblob');
    if(['wobble','what','purple'].includes(key)) gmPlace(grid,mg,[(gmT>>2)%2?"~":"-"],gmX-1,streetRow-Math.round(h/2)-bob,'gmblob');
    if(beat && beat.say && f<0.92) gmBubble(grid,mg,gmX+w/2,streetRow-h-bob,beat.say);
  }
  for(const p of gmParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of gmTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function gmStepFx(){
  for(const p of gmParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  gmParts=gmParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of gmTexts){ t.life--; if(t.life%3===0) t.y--; }
  gmTexts=gmTexts.filter(t=>t.life>0);
}
function gmWalkTo(x,speed){ gmX+=Math.sign(x-gmX)*Math.min(Math.abs(x-gmX),speed); }

function __m98_loop(){
  if(phase==='gm_run'){
    if(!gmStarted) gmInit();
    const beat=GM_BEATS[gmIdx], dur=gmDur(beat.cap), f=gmT/Math.max(1,dur-1), key=beat.key, g=gmG;
    const Smax=Math.max(1,Math.min(3,Math.floor((streetRow-2)*0.4/gmArt.length),Math.floor(COLS*0.18/gmArt[0].length)));
    for(const P of gmPeople) if(!P.down){ P.x+=P.vx; if(P.x<g.shop+13||P.x>g.rv0-5) P.vx=-P.vx; }

    if(key==='lunch'){ gmPeople.forEach((P,i)=>{ if(f>i/gmPeople.length) P.cup=true; }); if(gmT%10===0) gmText("*slurp*",Math.random()*COLS,streetRow-5,'gmtext',10); }
    if(key==='first'){ const P=gmPeople[0]; if(gmT===Math.round(dur*0.3)) gmText("mmm",P.x+1,streetRow-5,'gmtext',20); if(f>0.55 && !P.down){ P.down=true; P.pose=0; for(let k=0;k<8;k++) gmParts.push({x:P.x+3,y:streetRow-2,vx:(Math.random()-0.5)*1.4,vy:-0.5,g:0.08,ch:"*",mode:'gmpurple',life:14}); } }
    if(key==='film' && gmT%14===4) gmText("*click*",gmPeople[1].x+2,streetRow-5,'gmtext',10);
    if(key==='teatime') gmPeople.forEach((P,i)=>{ if(f>i/gmPeople.length && !P.down){ P.down=true; P.pose=i%4; } });
    if(key==='fine' && gmT%16===4) gmText("i'm fine",gmPeople[(gmT/16|0)%gmPeople.length].x+2,streetRow-4,'gmsmall',14);
    if(key==='arrives'){ gmS=Smax; if(gmT%12===0) gmText("wobble",8,streetRow-gmArt.length*gmS-2,'gmtext',10); gmShake=1; }
    if(key==='wobble'||key==='what'||key==='nobody'){ gmS=Smax; gmWalkTo(Math.round(COLS*0.22),0.35); }
    if(key==='nobody' && gmT===Math.round(dur*0.4)) gmText("...",gmX+gmArt[0].length*gmS/2,streetRow-gmArt.length*gmS-3,'gmtext',30);
    if(key==='purple'){ gmWalkTo(g.door+8,Math.max(0.3,(g.door+8-gmX)/Math.max(1,dur*0.8-gmT))); gmPurp=Math.max(gmPurp,Math.round(4+f*COLS*0.25)); }
    if(key==='sky'){ gmPurp=Math.round(COLS*0.25+f*COLS); document.body.style.background="rgb("+Math.round(12+60*f)+","+Math.round(20+10*f)+","+Math.round(40+70*f)+")"; }
    if(key==='machines'){ gmPurp=COLS*2; gmGutter=Math.round((g.rv0-g.shop-12)*Math.min(1,f/0.8)); if(gmT%3===0) gmParts.push({x:g.shop+6,y:streetRow-gmShopArt.length,vx:0.5,vy:0.1,g:0.04,ch:"~",mode:'gmslush',life:16}); }
    if(key==='fish'){ if(gmT%8===0) gmParts.push({x:g.rv0+Math.random()*(g.rv1-g.rv0),y:streetRow-1,vx:0,vy:-0.5,g:0.05,ch:"><>",mode:'gmfish',life:20}); if(gmT%16===8) gmText("*pose*",g.rv0+4,streetRow-4,'gmtext',12); }
    if(key==='clipboard'){
      if(!gmSci.length) gmSci=[0,1,2].map(k=>({x:gmX+gmArt[0].length*gmS+3+k*4, inFount:false}));
      gmClip=(gmT%30)<18?1:0; if(gmT%30===18) gmText("*munch*",gmX+gmArt[0].length*gmS/2,streetRow-gmArt.length*gmS-2,'gmtext',12);
    }
    if(key==='hug'){
      gmClip=0;
      if(gmT===Math.round(dur*0.25)) gmText("*hug*",gmX+gmArt[0].length*gmS,streetRow-gmArt.length*gmS-2,'gmtext',24);
      if(f>0.5) gmSci.forEach((S,k)=>{ S.inFount=true; S.x=g.fountain+k*2; });
    }
    if(key==='midnight'){
      if(gmT===0){ gmParts=[]; gmTexts=[]; }
      gmPlanet=Math.max(3,Math.round(Math.min(ROWS*0.3,COLS*0.18)*Math.min(1,f/0.6)));
      document.body.style.background="#1a0a2a";
      if(gmT%12===0) gmText("hmmmmm",cx+(Math.random()-0.5)*20,ROWS*0.62,'gmsmall',14);
      if(gmT%10===5) gmText("~berries~",cx+(Math.random()-0.5)*30,ROWS*0.3,'gmsmall',14);
    }
    if(key==='sits'){ gmSitting=true; if(gmT%14===4) gmText("*sip*",cx+gmArt[0].length,ROWS*0.62-gmPlanet-6,'gmtext',12); }
    if(key==='bday'){ if(gmT%6===0) gmParts.push({x:Math.random()*COLS,y:2,vx:(Math.random()-0.5)*0.3,vy:0.25,g:0,ch:"*",mode:Math.random()<0.5?'gmconf':'gmpurple2',life:50}); }

    if(gmShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*gmShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*gmShake).toFixed(1)+"px)"; gmShake*=0.9; }
    else { stage.style.transform=""; gmShake=0; }
    gmStepFx();
    gmRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#c890ff"; sub.style.textShadow="0 0 8px #6a2aa0";
    gmT++;
    if(gmT>=dur){ gmT=0; gmIdx++; if(gmIdx>=GM_BEATS.length){ phase='gm_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='gm_hold'){
    stage.style.transform="";
    if(gmT%8===0) gmParts.push({x:Math.random()*COLS,y:2,vx:(Math.random()-0.5)*0.3,vy:0.25,g:0,ch:"*",mode:Math.random()<0.5?'gmconf':'gmpurple2',life:50});
    gmStepFx(); gmT++;
    gmRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=GM_HOLD; sub.style.color="#c890ff"; sub.style.textShadow="0 0 8px #6a2aa0";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m98_start(){
  attackMode='gm_run';
  cmd.style.color="#a050e0"; cmd.style.textShadow="0 0 20px #ff70d0";
  gmStarted=false; phase='gm_run';
}

function __m98_reset(){
  gmStarted=false; gmT=0; gmIdx=0; gmG=null; gmX=-20; gmS=1; gmPeople=[]; gmParts=[]; gmTexts=[]; gmPurp=-1; gmGutter=0;
  gmSci=[]; gmClip=0; gmPlanet=0; gmSitting=false; gmShake=0;
  stage.style.transform="";
}

registerMethod(98, { start: __m98_start, resetFn: __m98_reset, loopFn: __m98_loop, phaseNames: ['gm_run','gm_hold'] });
