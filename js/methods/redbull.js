let rdStarted=false, rdT=0, rdIdx=0, rdG=null, rdLorry=null, rdCans=[], rdPeople=[], rdParts=[], rdTexts=[], rdCam=0, rdNight=false;
let rdBin=null, rdBike=null, rdSky=[], rdCan=null, rdGone=false, rdShake=0;

// ---- RED BULL: it gives you wings ----
// one crate in the reservoir and the whole city gets wings. People are the only actors:
// walking, jogging, itching, fluttering, flying, then swarming upward while the camera
// follows them (rdCam pushes the city down the screen and the sky's traffic past them),
// before cutting back to the empty city and one dropped can
const RD_BEATS=[
  {key:'lorry',    cap:"IT STARTS WITH A DELIVERY LORRY TAKING A CORNER TOO FAST. A SINGLE CRATE TUMBLES OFF AND SPLITS OPEN."},
  {key:'cans',     cap:"THE CANS ROLL DOWN INTO THE CITY'S RESERVOIR."},
  {key:'sip',      cap:"BY BREAKFAST, EVERYONE HAS HAD A SIP."},
  {key:'great',    cap:"AT FIRST IT'S GREAT. COMMUTERS JOG TO WORK. EMAILS GET ANSWERED BEFORE THEY'RE SENT."},
  {key:'potholes', cap:"THE COUNCIL FIXES EVERY POTHOLE BY 8:15AM, AND THEN STARTS ON THE NEIGHBOURING TOWN'S."},
  {key:'itch',     cap:"BY LUNCHTIME, PEOPLE'S SHOULDER BLADES BEGIN TO ITCH."},
  {key:'wings',    cap:"BY MID-AFTERNOON, THEY HAVE WINGS. SMALL ONES AT FIRST: MORE FLUTTER THAN FLIGHT."},
  {key:'drift',    cap:"THEN BIGGER. OFFICE WORKERS DRIFT UP PAST THEIR OWN WINDOWS, STILL HOLDING MUGS."},
  {key:'spire',    cap:"A MAN IN A DRESSING GOWN CIRCLES THE CHURCH SPIRE, SHOUTING THAT HE HAS NEVER FELT MORE ALIVE.", gown:"I HAVE NEVER FELT MORE ALIVE!"},
  {key:'roofs',    cap:"NOBODY CAN SIT DOWN. THE PUBS ARE EMPTY, BECAUSE EVERYONE'S ON THE ROOF. THEN ABOVE THE ROOF."},
  {key:'jams',     cap:"TRAFFIC JAMS FORM IN THE CLOUDS. PIGEONS FILE A FORMAL COMPLAINT."},
  {key:'extreme',  cap:"SOMEBODY SUGGESTS A BACKFLIP OFF THE CATHEDRAL. WITHIN MINUTES, THE WHOLE CITY IS DOING EXTREME SPORTS."},
  {key:'vicar',    cap:"A VICAR ATTEMPTS THE WORLD'S FIRST TRIPLE LOOP IN A WHEELIE BIN. AND LANDS IT."},
  {key:'night',    cap:"NIGHT FALLS, BUT NOBODY SLEEPS. SLEEP IS FOR PEOPLE WITHOUT WINGS."},
  {key:'swarm',    cap:"THE SKY GLOWS WITH A SWARM OF BUZZING, TWITCHING, DELIGHTED HUMANS."},
  {key:'higher',   cap:"HIGHER AND HIGHER THEY GO. PAST THE PLANES. PAST THE SATELLITES."},
  {key:'iss',      cap:"SOMEONE WAVES AT THE INTERNATIONAL SPACE STATION ON THE WAY THROUGH."},
  {key:'empty',    cap:"DOWN ON THE GROUND, THE CITY STANDS EMPTY. DOORS OPEN. KETTLES STILL WARM."},
  {key:'can',      cap:"A SINGLE DROPPED CAN ROLLS ALONG THE PAVEMENT, AND CLINKS TO A STOP."},
  {key:'left',     cap:"FAR ABOVE, HUMANITY HAS LEFT THE PLANET ENTIRELY. STILL GIGGLING. STILL ACCELERATING."},
  {key:'rest',     cap:"EARTH IS QUIET NOW. IT DOESN'T MISS THEM. IT'S JUST GLAD TO FINALLY GET SOME REST."}
];
const RD_HOLD="IT'S JUST GLAD TO FINALLY GET SOME REST. — press RESET";
const rdLorryArt=["  ________  ","_[########]_","|o--------o|"];
const rdChurchArt=["  +  ","  ^  "," /^\\ "," | | ","/___\\","|[ ]|","|_n_|"];
const rdHallArt=[" ______ ","|COUNCIL","|[] []|","|______|"];
const rdPubArt=[" ____ ","|PUB |","|[]  |","|____|"];

function rdDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function rdPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function rdText(s,x,y,mode,life){ rdTexts.push({s,x,y,mode:mode||'rdtext',life:life||20}); }
function rdBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function rdColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function rdStamp(art,left){ const top=streetRow-art.length; for(let i=0;i<art.length;i++) for(let j=0;j<art[i].length;j++){ const ch=art[i][j]; if(ch!==" "&&left+j>=0&&left+j<COLS) setCh(cityGridArr,top+i,left+j,ch); } return top; }
function rdClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++) setCh(cityGridArr,r,c," "); }

function rdInit(){
  rdStarted=true; rdT=0; rdIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const at=f=>Math.round(COLS*f);
  const g={hall:at(0.3), pub:at(0.44), church:at(0.58), resL:at(0.82)};
  rdClear(g.hall-1,g.hall+8); rdClear(g.pub-1,g.pub+6); rdClear(g.church-2,g.church+6); rdClear(g.resL-1,COLS-1);
  g.hallTop=rdStamp(rdHallArt,g.hall); rdStamp(rdPubArt,g.pub); g.spireTop=rdStamp(rdChurchArt,g.church); g.spireC=g.church+2;
  rdG=g;
  rdLorry=null; rdCans=[]; rdParts=[]; rdTexts=[]; rdCam=0; rdNight=false; rdBin=null; rdBike=null; rdSky=[]; rdCan=null; rdGone=false; rdShake=0;
  rdPeople=[]; const n=Math.max(8,Math.round(COLS/9));
  for(let i=0;i<n;i++) rdPeople.push({x:2+Math.random()*(g.resL-6), y:streetRow-3, vx:(Math.random()<0.5?-1:1)*0.25, state:'walk', ph:Math.random()*6, mug:i%3===0, gran:i%5===2});
  rdPeople[0].gown=true;
  document.body.style.background="#0e1a30";
}

function rdRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=rdG, key=beat?beat.key:'hold', cam=Math.round(rdCam);
  const grid=Array.from({length:ROWS},()=>" ".repeat(COLS)), mg=modeGridFill(ROWS,COLS,'city');
  // the city, pushed down the screen as the camera follows the flyers up
  for(let r=0;r<ROWS;r++){ const sr=r-cam; if(sr<0||sr>=ROWS) continue; grid[r]=cityGridArr[sr]; }
  if(rdNight && cam===0) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if((ch==="."||ch===":")&&!rdGone&&(r*7+c*3)%4) setCh(grid,r,c," "); }
  const S=streetRow+cam;
  if(S<ROWS){
    // the reservoir
    for(let c=g.resL;c<COLS;c++) for(const r of [S-1,S]){ if(r>=0&&r<ROWS){ setCh(grid,r,c,((c+rdT)%4<2)?"~":"\u2248"); setMode(mg,r,c,'water'); } }
    if(['lorry','cans','sip'].includes(key)) rdPlace(grid,mg,["[RESERVOIR]"],g.resL+1,S-3,'rdsign');
    for(const C of rdCans) rdPlace(grid,mg,["u"],C.x,S-1+(C.sunk?1:0),'rdcan');
    if(rdLorry) rdPlace(grid,mg,rdLorryArt,rdLorry.x,S-3,'rdlorry');
    if(rdCan) rdPlace(grid,mg,["u"],rdCan.x,S-1,'rdcan');
    if(key==='empty') for(let k=0;k<3;k++){ const c=Math.round(COLS*(0.15+k*0.3)); rdPlace(grid,mg,[(rdT+k*3)%8<4?"~":" ","u"],c,S-2,'rdkettle'); }
  }
  // the people: walking, jogging, itching, fluttering, flying
  for(const P of rdPeople){
    const wings=P.state==='flutter'||P.state==='fly', flap=((rdT>>1)+(P.ph|0))%2;
    let art;
    if(P.state==='bike') art=["\\o ","o-o"];
    else if(P.state==='flip') art=[(rdT>>1)%2?" o ":" | "," | ",(rdT>>1)%2?" ^ ":" o "];
    else if(wings) art=[flap?"\\o/":"-o-"," | "," ^ "];
    else if(P.state==='jog') art=[" o ","/|\\",(rdT>>2)%2?"/ \\":" | "];
    else art=[" o ","/|\\","/ \\"];
    const top=Math.round(P.y), mode=P.gown?'rdgown':(P.gran?'rdgran':'body');
    rdPlace(grid,mg,art,P.x,top,mode);
    if(wings) for(const dx of [-1,3]){ const c=Math.round(P.x)+dx; if(c>=0&&c<COLS&&top>=0&&top<ROWS){ setCh(grid,top,c,flap?(dx<0?"\\":"/"):(dx<0?"<":">")); setMode(mg,top,c,rdNight?'rdglow':'rdwing'); } }
    if(P.mug && wings) rdPlace(grid,mg,["u"],P.x+3,top+1,'rdmug');
    if(P.state==='itch' && (rdT>>2)%2) rdPlace(grid,mg,["*"],P.x+(rdT%2?0:2),top,'rdtext');
  }
  if(rdBin) rdPlace(grid,mg,[rdBin.flip?"#|]":"[|#"],rdBin.x,rdBin.y+cam,'rdbin');
  // sky traffic the swarm passes on the way up
  for(const O of rdSky) rdPlace(grid,mg,O.art,O.x,O.y,O.mode);
  for(const p of rdParts){ const r=Math.round(p.y)+(p.world?cam:0), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of rdTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  if(beat && beat.gown && f<0.92){ const P=rdPeople[0]; rdBubble(grid,mg,P.x+1,Math.round(P.y)+cam,beat.gown); }
  scene.innerHTML=paint(grid,mg,'city');
}
function rdStepFx(){
  for(const p of rdParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  rdParts=rdParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=-2 && p.y<ROWS);
  for(const t of rdTexts){ t.life--; if(t.life%3===0) t.y--; }
  rdTexts=rdTexts.filter(t=>t.life>0);
}

function __m95_loop(){
  if(phase==='rd_run'){
    if(!rdStarted) rdInit();
    const beat=RD_BEATS[rdIdx], dur=rdDur(beat.cap), f=rdT/Math.max(1,dur-1), key=beat.key, g=rdG;
    const top=Math.max(3,Math.round(streetRow*0.12));

    if(key==='lorry'){
      if(!rdLorry) rdLorry={x:-14};
      rdLorry.x+=Math.max(1.2,(g.resL-14+14)/(dur*0.6));
      if(rdLorry.x>g.resL-28 && !rdLorry.spilled){ rdLorry.spilled=true; rdShake=3; rdText("SKREEEE",rdLorry.x+6,streetRow-6,'rdtext',16); rdText("CRASH",rdLorry.x+2,streetRow-4,'rdtext',16); for(let k=0;k<8;k++) rdCans.push({x:rdLorry.x+2+k, v:0.4+Math.random()*0.5}); }
    }
    if(key==='cans'){ if(rdLorry){ rdLorry.x+=1.4; if(rdLorry.x>COLS) rdLorry=null; } for(const C of rdCans){ if(!C.sunk){ C.x+=C.v; if(C.x>=g.resL+1){ C.sunk=true; rdParts.push({x:C.x,y:streetRow-2,vx:0,vy:-0.3,g:0.06,ch:"o",mode:'water',life:8,world:true}); } } } }
    if(key==='sip'){ rdCans=rdCans.filter(C=>!C.sunk); if(rdT%9===0) rdText("*slurp*",3+Math.random()*(g.resL-6),streetRow-5,'rdtext',12); }
    for(const P of rdPeople) if(['walk','jog','itch'].includes(P.state)){ P.x+=P.vx*(P.state==='jog'?3:1); if(P.x<1||P.x>g.resL-5) P.vx=-P.vx; }
    if(key==='great'){ rdPeople.forEach(P=>P.state='jog'); if(rdT%10===0) rdText("SENT",Math.random()*COLS,top+2+Math.random()*4,'rdtext',10); }
    if(key==='potholes'){ if(rdT%3===0) rdParts.push({x:Math.random()*COLS,y:streetRow,vx:0,vy:0,g:0,ch:"=",mode:'rdtar',life:20,world:true}); if(rdT===Math.round(dur*0.2)) rdText("8:15AM",g.hall+4,g.hallTop-2,'rdtext',30); if(rdT===Math.round(dur*0.6)) rdText("NEXT TOWN \u2192",COLS-12,streetRow-6,'rdtext',30); }
    if(key==='itch'){ rdPeople.forEach(P=>{ P.state='itch'; P.vx=Math.sign(P.vx)*0.15; }); if(rdT%12===0) rdText("*itch*",Math.random()*g.resL,streetRow-5,'rdtext',10); }
    if(key==='wings'){ rdPeople.forEach(P=>{ P.state='flutter'; P.y=streetRow-3-Math.abs(Math.sin(rdT*0.3+P.ph))*1.5; }); }
    if(key==='drift'||key==='spire'||key==='roofs'||key==='jams'){
      // everyone drifts up; the dressing-gown man loops the spire; the gran hovers low
      const ceil=key==='drift'?streetRow*0.5:(key==='roofs'?streetRow*0.25:top+2);
      rdPeople.forEach((P,i)=>{
        if(P.gown && (key==='spire')){ const a=rdT*0.12; P.x=g.spireC-1+Math.cos(a)*7; P.y=g.spireTop-3+Math.sin(a)*2; P.state='fly'; return; }
        P.state='fly'; const tgt=P.gran?streetRow-6:ceil+((i*7)%6); P.y+=(tgt-P.y)*0.04+Math.sin(rdT*0.2+P.ph)*0.15; P.x+=Math.sin(rdT*0.05+P.ph)*0.3;
      });
      if(key==='roofs' && rdT===Math.round(dur*0.3)) rdText("(empty)",g.pub+3,streetRow-6,'rdtext',30);
      if(key==='jams'){ if(rdT%8===0) rdText(["BEEP","MOVE IT","HONK"][(rdT/8|0)%3],Math.random()*COLS,top,'rdtext',10); if(rdT===Math.round(dur*0.55)) rdText("FORMAL COMPLAINT",Math.round(COLS*0.2),top+6,'rdpigeon',30); }
    }
    if(key==='extreme'){
      const P1=rdPeople[1], P2=rdPeople[2], P3=rdPeople[3];
      P1.state='flip'; P1.x=g.spireC-1; P1.y=g.spireTop-2+(f*f)*8; if(rdT===Math.round(dur*0.5)) rdText("BACKFLIP!",g.spireC,g.spireTop-4,'rdtext',20);
      P2.state='bike'; P2.x=g.hall+8; P2.y=g.hallTop-1+(rdT%Math.round(dur/2))/(dur/2)*(streetRow-g.hallTop-1);
      P3.state='flip'; P3.y=top+((rdT*0.4)%(streetRow-top-4)); if(rdT%12===0) rdText("WOOOO",P3.x+1,P3.y-1,'rdtext',10);
    }
    if(key==='vicar'){
      if(!rdBin) rdBin={x:Math.round(COLS*0.2), y:streetRow-2, flip:false};
      const a=Math.min(1,f/0.75)*Math.PI*6, R=Math.min(6,streetRow*0.2);
      rdBin.x=Math.round(COLS*0.2+Math.sin(a)*R); rdBin.y=Math.round(streetRow-2-R-Math.cos(a)*R+R); rdBin.flip=Math.cos(a)<0;
      if(f>0.78 && !rdBin.landed){ rdBin.landed=true; rdBin.y=streetRow-2; rdText("LANDED IT!",rdBin.x+1,streetRow-6,'rdtext',30); rdShake=2; }
      if(rdBin.landed) rdBin.y=streetRow-2;
      rdPeople.forEach(P=>{ if(P.state==='flip'||P.state==='bike') P.state='fly'; });
    }
    if(key==='night'){ rdBin=null; if(!rdNight){ rdNight=true; document.body.style.background="#05060d"; } }
    if(key==='swarm'||key==='night'){ rdPeople.forEach(P=>{ P.y+=Math.sin(rdT*0.6+P.ph)*0.4; P.x+=(Math.random()-0.5)*0.6; }); if(rdT%10===0) rdText("bzzzzz",Math.random()*COLS,top+Math.random()*6,'rdglow',10); }
    if(key==='higher'||key==='iss'){
      // the camera follows them up; the city drops away and the sky's traffic streams past
      rdCam=Math.min(ROWS+2,rdCam+Math.max(0.3,ROWS/(dur*0.8)));
      rdPeople.forEach(P=>{ P.y+=(ROWS*0.4-P.y)*0.05+Math.sin(rdT*0.5+P.ph)*0.3; });
      if(rdT%14===0) rdSky.push(key==='iss'&&!rdSky.some(o=>o.iss)?{art:["-[#]-","=[##]="],x:Math.round(COLS*0.6),y:-2,mode:'rdiss',iss:true}:{art:[Math.random()<0.5?"-=>":"<=-"],x:Math.random()*COLS,y:-1,mode:key==='higher'&&rdT<dur/2?'rdplane':'rdsat'});
      for(const O of rdSky) O.y+=0.6;
      rdSky=rdSky.filter(O=>O.y<ROWS);
      if(key==='iss'){ const O=rdSky.find(o=>o.iss); if(O && O.y>ROWS*0.3 && !O.waved){ O.waved=true; rdText("*wave*",O.x+3,O.y-2,'rdtext',24); } }
      if(rdT%6===0) rdParts.push({x:Math.random()*COLS,y:0,vx:0,vy:0.6,g:0,ch:".",mode:'rdstar',life:60});
    }
    if(key==='empty'){ rdCam=0; rdSky=[]; rdGone=true; rdPeople=[]; rdParts=[]; }
    if(key==='can'){ if(!rdCan) rdCan={x:2}; if(rdCan.x<Math.round(COLS*0.45)) rdCan.x+=Math.max(0.3,(COLS*0.45)/(dur*0.7)); else if(!rdCan.stop){ rdCan.stop=true; rdText("clink.",rdCan.x,streetRow-3,'rdtext',30); } }
    if(key==='left'){ if(rdT%4===0) rdParts.push({x:Math.random()*COLS,y:top+2+Math.random()*4,vx:0,vy:-0.4,g:0,ch:"\u00b7",mode:'rdglow',life:12}); if(rdT%14===0) rdText("hehehe",Math.random()*COLS,top+1,'rdglow',10); }
    if(key==='rest'){ if(rdT%20===10) rdText("z",COLS/2+Math.sin(rdT)*10,streetRow*0.4,'rdtext',20); }

    if(rdShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*rdShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*rdShake).toFixed(1)+"px)"; rdShake*=0.88; }
    else { stage.style.transform=""; rdShake=0; }
    rdStepFx();
    rdRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffcc33"; sub.style.textShadow="0 0 8px #c81e3c";
    rdT++;
    if(rdT>=dur){ rdT=0; rdIdx++; if(rdIdx>=RD_BEATS.length){ phase='rd_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='rd_hold'){
    stage.style.transform="";
    if(rdT%30===10) rdText("z",COLS/2+Math.sin(rdT)*10,streetRow*0.4,'rdtext',20);
    rdStepFx(); rdT++;
    rdRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=RD_HOLD; sub.style.color="#ffcc33"; sub.style.textShadow="0 0 8px #c81e3c";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m95_start(){
  attackMode='rd_run';
  cmd.style.color="#ffcc33"; cmd.style.textShadow="0 0 20px #c81e3c";
  rdStarted=false; phase='rd_run';
}

function __m95_reset(){
  rdStarted=false; rdT=0; rdIdx=0; rdG=null; rdLorry=null; rdCans=[]; rdPeople=[]; rdParts=[]; rdTexts=[]; rdCam=0; rdNight=false;
  rdBin=null; rdBike=null; rdSky=[]; rdCan=null; rdGone=false; rdShake=0;
  stage.style.transform="";
}

registerMethod(95, { start: __m95_start, resetFn: __m95_reset, loopFn: __m95_loop, phaseNames: ['rd_run','rd_hold'] });
