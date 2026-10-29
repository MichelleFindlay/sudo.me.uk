let ooStarted=false, ooT=0, ooIdx=0, ooG=null, ooDark=[], ooCars=[], ooLights=[], ooParts=[], ooTexts=[];
let ooRubble=[], ooRubbleCh=[], ooSag=0, ooSegs=[], ooKettles=[], ooHouse=null, ooSmoke=null, ooFlashT=0;
let ooHand=null, ooPlug=null, ooSpark=null;

// ---- OOPS: the whole city runs off one wall socket, and someone needs to charge a phone ----
// one beat list drives a giant hand, the city's plug, and the state of the grid
// (lit -> dark -> unwound -> surged -> popped); geometry (mountain, socket, cable,
// river, bridge) is laid out once at the start from the screen size
const OO_BEATS=[
  {key:'dusk',     cap:"A PEACEFUL CITY AT DUSK. LIGHTS TWINKLING, TRAFFIC HUMMING."},
  {key:'socket',   cap:"THE WHOLE SKYLINE RUNS OFF ONE ENORMOUS WALL SOCKET, BOLTED TO THE SIDE OF A MOUNTAIN."},
  {key:'hand',     cap:"A GIANT HAND DRIFTS INTO FRAME, LOOKING FOR SOMEWHERE TO PLUG IN A PHONE CHARGER."},
  {key:'pause',    cap:"IT PAUSES AT THE SOCKET. IT'S THE ONLY ONE IN SIGHT."},
  {key:'yank',     cap:"THE HAND GRABS THE CITY'S PLUG AND PULLS."},
  {key:'oops',     cap:"\"oops.\"", bubble:"oops."},
  {key:'dark',     cap:"THE CITY GOES DARK, DISTRICT BY DISTRICT."},
  {key:'amber',    cap:"THE TRAFFIC LIGHTS GO LAST, FLICKERING AMBER IN CONFUSION."},
  {key:'sag',      cap:"WITHOUT POWER, THE CITY STOPS RUNNING. BUILDINGS SAG LIKE DEFLATING BOUNCY CASTLES."},
  {key:'droop',    cap:"THE BRIDGE DROOPS LIKE WET SPAGHETTI. THE RIVER STOPS FLOWING AND HANGS THERE, BUFFERING."},
  {key:'replug',   cap:"THE HAND TRIES TO SHOVE THE PLUG BACK IN. UPSIDE DOWN."},
  {key:'replug2',  cap:"IT TRIES AGAIN. STILL UPSIDE DOWN. SOMEHOW IT'S UPSIDE DOWN BOTH WAYS."},
  {key:'surge',    cap:"IT FINALLY JAMS IT IN AT AN ANGLE. A MASSIVE BLUE SPARK RACES UP THE CABLE."},
  {key:'kettles',  cap:"EVERY APPLIANCE TURNS ON AT ONCE. KETTLES LAUNCH LIKE ROCKETS. TOASTERS FIRE TOAST INTO ORBIT."},
  {key:'dryer',    cap:"A LONE HAIRDRYER SPINS LIKE A PROPELLER AND CARRIES A HOUSE OFF."},
  {key:'pop',      cap:"THE SURGE OVERLOADS THE GRID. THE BUILDINGS POP, ONE BY ONE, LIKE CHEAP CHRISTMAS LIGHTS."},
  {key:'segv',     cap:"SMOKE SPELLS OUT A MESSAGE OVER THE RUINS."},
  {key:'silence',  cap:"SILENCE."},
  {key:'charger',  cap:"THE PHONE CHARGER IS NOW PLUGGED INTO THE SOCKET."},
  {key:'thumbs',   cap:"THE HAND GIVES A THUMBS UP."}
];
const OO_HOLD="CHARGING, 1%. — press RESET";
const OO_SEGV="Segmentation fault (core dumped)";
const OO_SKY_DUSK="#2a1838", OO_SKY_DARK="#0a0810";

const ooSocketArt=["+-------+","|   |   |","| |   | |","+-------+"];
const ooPlugInArt=["[#####]","[#####]"];
const ooPlugOutArt=["[#####]"," |   | ","   |   "];
const ooPlugUpsideArt=["   |   "," |   | ","[#####]"];
const ooPlugSidewaysArt=["-[#####]-"];
const ooPlugAngledArt=[" /[####]","/[####]/"];
const ooHandOpen=["  |      |  "," [========] "," |        | "," |        | "," ||  ||  || "," ||  ||  || "," ''  ''  '' "];
const ooHandGrip=["  |      |  "," [========] "," |        | "," |        | "," |\\/\\/\\/\\/| "," '--------' ","            "];
const ooHandThumb=["    __      ","   (  )     ","   |  |___  "," [=|  |___) "," |  ____ _) "," | (_____)  "," '-------'  "];
const ooChargerArt=["[##]"];
const ooPhoneArt=["[  ]","[__]"];
const ooKettleArt=["(_)>"];
const ooHouseArt=["  /\\  "," /  \\ ","|[]  |","|__n_|"];
const ooDryerFrames=["-=+=-","\\ + /"," |+| ","/ + \\"];

function ooDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function ooLerpHex(a,b,f){
  const pa=[1,3,5].map(i=>parseInt(a.substr(i,2),16)), pb=[1,3,5].map(i=>parseInt(b.substr(i,2),16));
  return "rgb("+pa.map((v,i)=>Math.round(v+(pb[i]-v)*f)).join(",")+")";
}
function ooPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function ooColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function ooText(s,x,y,mode,life,vy){ ooTexts.push({s,x,y,mode:mode||'ootext',life:life||22,vy:vy===undefined?-1/3:vy}); }
function ooClearCol(c){ for(let r=0;r<streetRow;r++) setCh(cityGridArr,r,c," "); }
function ooDistrict(c){ const g=ooG; return Math.min(3,Math.max(0,Math.floor((c-g.cityL)/((COLS-g.cityL)/4)))); }
function ooShiftDown(c0,c1){
  for(let r=streetRow-1;r>=0;r--){
    const ln=cityGridArr[r].split("");
    for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++) ln[c]=r>0?cityGridArr[r-1][c]:" ";
    cityGridArr[r]=ln.join("");
  }
}
function ooSetRubble(c){ ooRubble[c]=Math.random()<0.5?1:2; ooRubbleCh[c]=[0,1].map(()=>".,_#%"[(Math.random()*5)|0]).join(""); }

function ooInit(){
  ooStarted=true; ooT=0; ooIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  // the mountain on the left, with the socket on its face and the cable down into town
  const Wm=Math.max(16,Math.round(COLS*0.18)), pk=Math.round(Wm*0.45), pr=Math.max(2,Math.round(streetRow*0.3));
  const sx=Math.max(1,pk-4), sr=Math.max(pr+2,Math.round((pr+streetRow)/2)-2);
  const cityL=Wm+3;
  const rv0=Math.round(COLS*0.62), rv1=rv0+Math.max(8,Math.round(COLS*0.08));
  ooG={Wm,pk,pr,sx,sr,cityL,rv0,rv1, jx:Wm+1, jy:streetRow-2};
  for(let c=0;c<cityL;c++) ooClearCol(c);
  for(let c=rv0-1;c<=rv1+1;c++) ooClearCol(c);
  // traffic lights stand in narrow gaps of their own
  ooLights=[0.3,0.5,0.85].map(f=>Math.round(cityL+(COLS-cityL)*f)).filter(c=>c<rv0-2||c>rv1+2).map(c=>{ ooClearCol(c); return {c}; });
  ooDark=[false,false,false,false]; ooSag=0;
  ooCars=[]; for(let i=0;i<Math.max(3,Math.round(COLS/25));i++) ooCars.push({x:cityL+Math.random()*(COLS-cityL), v:(Math.random()<0.5?-1:1)*(0.3+Math.random()*0.4)});
  ooParts=[]; ooTexts=[]; ooRubble=Array(COLS).fill(0); ooRubbleCh=Array(COLS).fill("");
  ooSegs=[]; ooKettles=[]; ooHouse=null; ooSmoke=null; ooFlashT=0;
  ooHand=null; ooPlug={state:'in'}; ooSpark=null;
  document.body.style.background=OO_SKY_DUSK;
}

// ---- geometry helpers ----
function ooMountainTop(c){
  const g=ooG; if(c<0||c>g.Wm) return streetRow;
  if(c<=g.pk) return Math.round(streetRow-1-(streetRow-1-g.pr)*(g.pk?c/g.pk:1));
  return Math.round(g.pr+(streetRow-1-g.pr)*((c-g.pk)/Math.max(1,g.Wm-g.pk)));
}
function ooCablePts(x0,y0,x1,y1,sag){
  const pts=[]; if(x0>x1){ [x0,x1]=[x1,x0]; [y0,y1]=[y1,y0]; }
  for(let c=Math.round(x0);c<=Math.round(x1);c++){ const t=(c-x0)/Math.max(1,x1-x0); pts.push({c, r:Math.round(y0+(y1-y0)*t+sag*Math.sin(Math.PI*t))}); }
  return pts;
}
function ooPlugAnchor(){
  // where the cable leaves the plug, wherever the plug currently is
  const g=ooG, p=ooPlug;
  if(p.state==='in'||p.state==='angled') return {x:g.sx+8, y:g.sr+2};
  if(p.state==='ground') return {x:p.x+7, y:streetRow-1};
  return {x:p.x+7, y:p.y+1};
}
function ooFindSegments(){
  const out=[]; let c=ooG.cityL;
  while(c<COLS){
    if(ooColTop(c)>=streetRow){ c++; continue; }
    let e=c; while(e+1<COLS && ooColTop(e+1)<streetRow) e++;
    const n=Math.max(1,Math.round((e-c+1)/7)), w=(e-c+1)/n;
    for(let k=0;k<n;k++) out.push({c0:Math.round(c+k*w), c1:Math.round(c+(k+1)*w)-1, popped:false});
    c=e+1;
  }
  return out;
}

// ---- drawing ----
function ooRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=ooG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  const surged=['kettles','dryer'].includes(key);
  // the city's lights: twinkling, dark by district, or overloaded after the surge
  for(let r=0;r<streetRow;r++) for(let c=g.cityL;c<COLS;c++){
    const ch=grid[r][c]; if(ch===" ") continue;
    if(ooDark[ooDistrict(c)]){
      if(ch==="."||ch===":") setCh(grid,r,c," "); else setMode(mg,r,c,'oodark');
    } else if(ch==="."||ch===":"){
      if(surged) setMode(mg,r,c,'oobright');
      else if(Math.random()<0.03) setCh(grid,r,c," ");
    }
  }
  // the mountain
  for(let c=0;c<=g.Wm;c++){
    const top=ooMountainTop(c);
    for(let r=top;r<streetRow;r++){
      const ch=r===top?(c===g.pk?"^":(c<g.pk?"/":"\\")):(((r*7+c*3)%5)?" ":".");
      if(ch!==" "){ setCh(grid,r,c,ch); setMode(mg,r,c,'oomount'); }
    }
  }
  ooPlace(grid,mg,ooSocketArt,g.sx,g.sr,'oosocket');
  // the river and the bridge over it
  const flowing=!ooDark[ooDistrict(g.rv0)] || ['surge','kettles','dryer'].includes(key);
  const bufferNow=['droop','replug','replug2'].includes(key);
  const phase=(flowing && !bufferNow)?ooT:0;
  for(let c=g.rv0;c<=g.rv1;c++) for(const r of [streetRow-1,streetRow]){ setCh(grid,r,c,((c+phase)%4<2)?"~":"≈"); setMode(mg,r,c,'water'); }
  if(!ooRubble.some((h,c)=>h && c>=g.rv0-1 && c<=g.rv1+1)){
    const droop=key==='droop'?3*Math.min(1,f/0.6):(['replug','replug2','surge','kettles','dryer'].includes(key)?3:0);
    for(let c=g.rv0-1;c<=g.rv1+1;c++){
      const t=(c-(g.rv0-1))/Math.max(1,g.rv1-g.rv0+2), r=Math.round(streetRow-4+droop*Math.sin(Math.PI*t));
      setCh(grid,r,c,"="); setMode(mg,r,c,'oobridge');
    }
    for(const c of [g.rv0-1,g.rv1+1]) for(let r=streetRow-3;r<streetRow;r++){ setCh(grid,r,c,"|"); setMode(mg,r,c,'oobridge'); }
  }
  if(bufferNow){
    const spin="|/-\\"[(ooT>>1)%4], s="( buffering "+spin+" )", c0=Math.round((g.rv0+g.rv1)/2-s.length/2);
    ooPlace(grid,mg,[s],c0,streetRow-7,'speech');
  }
  // traffic lights and traffic
  for(const L of ooLights){
    for(let r=streetRow-3;r<streetRow;r++){ setCh(grid,r,L.c,"|"); setMode(mg,r,L.c,'oopost'); }
    let m='oolightoff';
    if(key==='amber') m=Math.random()<0.5?'oolightamber':'oolightoff';
    else if(!ooDark[ooDistrict(L.c)] || surged) m=['oolightred','oolightamber','oolightgreen'][((ooT>>4)+L.c)%3];
    setCh(grid,streetRow-4,L.c,"o"); setMode(mg,streetRow-4,L.c,m);
  }
  for(const car of ooCars){
    const c=Math.round(car.x); if(c<g.cityL||c+2>=COLS||(c+2>=g.rv0-1&&c<=g.rv1+1)) continue;
    ooPlace(grid,mg,[car.v>0?"o=>":"<=o"],c,streetRow-1,'car');
  }
  for(let c=0;c<COLS;c++){ const h=ooRubble[c]||0; for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,ooRubbleCh[c][k]); setMode(mg,streetRow-1-k,c,'rubble'); } }
  // the cable, the plug, the junction box at the bottom of the mountain
  const a=ooPlugAnchor(), sag=ooPlug.state==='in'||ooPlug.state==='angled'?3:2;
  const pts=ooCablePts(a.x,a.y,g.jx,g.jy,sag);
  pts.forEach((p,i)=>{
    setCh(grid,p.r,p.c,"="); setMode(mg,p.r,p.c,'oocable');
    setCh(grid,p.r+1,p.c,"-"); setMode(mg,p.r+1,p.c,'oocable');
  });
  ooPlace(grid,mg,["[#]"],g.jx-1,g.jy,'oosocket');
  if(ooSpark){
    const i=Math.min(pts.length-1,Math.floor(ooSpark.t*pts.length)), ord=a.x<=g.jx?pts:pts.slice().reverse();
    const p=ord[i]; if(p){ ooPlace(grid,mg,["*#*"],p.c-1,p.r-1,'oospark'); ooPlace(grid,mg,["#"],p.c,p.r,'oospark'); }
  }
  const P=ooPlug;
  if(P.state==='in') ooPlace(grid,mg,ooPlugInArt,g.sx+1,g.sr+1,'ooplug');
  else if(P.state==='angled') ooPlace(grid,mg,ooPlugAngledArt,g.sx+1,g.sr+1,'ooplug');
  else if(P.state==='ground') ooPlace(grid,mg,["[#####]"],P.x,streetRow-1,'ooplug');
  else ooPlace(grid,mg,P.art||ooPlugOutArt,P.x,P.y,'ooplug');
  if(['charger','thumbs','hold'].includes(key) && ooPlug.state==='ground'){
    ooPlace(grid,mg,ooChargerArt,g.sx+2,g.sr+1,'oocharger');
    const px=g.sx+3, py=streetRow-2;
    for(let r=g.sr+2;r<py;r++){ setCh(grid,r,g.sx+3,"."); setMode(mg,r,g.sx+3,'oocharger'); }
    ooPlace(grid,mg,ooPhoneArt,px-1,py,'oophone');
    if(key!=='charger' || f>0.6) mtDrawBubble(grid,mg,Math.max(10,px),g.sr-1,"Charging, 1%");
  }
  // kettles, the flying house, popping buildings, the smoke message
  for(const k of ooKettles) ooPlace(grid,mg,[k.toast?"[]":ooKettleArt[0]],k.x,k.y,k.toast?'ootoast':'ookettle');
  if(ooHouse){
    ooPlace(grid,mg,[ooDryerFrames[(ooT>>0)%4]],ooHouse.x,ooHouse.y-1,'oodryer');
    ooPlace(grid,mg,ooHouseArt,ooHouse.x-1,ooHouse.y,'oohouse');
  }
  for(const s of ooSegs) if(s.flash>0) for(let r=0;r<streetRow;r++) for(let c=s.c0;c<=s.c1;c++) if(grid[r][c]!==" "){ setMode(mg,r,c,'oopop'); }
  if(ooSmoke){
    const row=Math.max(1,Math.round(streetRow*0.35)), c0=Math.round(COLS/2-OO_SEGV.length/2);
    for(let j=0;j<OO_SEGV.length;j++){
      if(!ooSmoke.on[j] || OO_SEGV[j]===" ") continue;
      setCh(grid,row,c0+j,OO_SEGV[j]); setMode(mg,row,c0+j,'oosmoke');
    }
  }
  // the hand, sleeve trailing up off the top of the screen
  if(ooHand){
    const H=ooHand, art=H.art;
    for(let r=0;r<Math.round(H.y);r++) for(const dc of [2,9]){ setCh(grid,r,Math.round(H.x)+dc,"|"); setMode(mg,r,Math.round(H.x)+dc,'oohand'); }
    ooPlace(grid,mg,art,H.x,H.y,'oohand');
    if(H.charger) ooPlace(grid,mg,ooChargerArt,H.x+4,H.y+art.length-1,'oocharger');
  }
  if(beat && beat.bubble && f<0.9 && ooHand) mtDrawBubble(grid,mg,Math.max(5,Math.round(ooHand.x+6)),Math.max(2,Math.round(ooHand.y)),beat.bubble);
  for(const p of ooParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of ooTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function ooStepFx(){
  for(const p of ooParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  ooParts=ooParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of ooTexts){ t.life--; t.y+=t.vy; }
  ooTexts=ooTexts.filter(t=>t.life>0);
  for(const s of ooSegs) if(s.flash>0) s.flash--;
}

// the hand's resting spot over the socket, fingers just above the plug
function ooHandHome(){ const g=ooG; return {x:g.sx+4-6, y:g.sr-6}; }

function __m80_loop(){
  if(phase==='oo_run'){
    if(!ooStarted) ooInit();
    const beat=OO_BEATS[ooIdx], dur=ooDur(beat.cap), f=ooT/Math.max(1,dur-1), key=beat.key, g=ooG;
    const home=ooHandHome();
    let hold=false;
    const traffic=!ooDark.every(d=>d);
    if(traffic) for(const car of ooCars){ car.x+=car.v; if(car.x<g.cityL) car.x=COLS-3; if(car.x>COLS-3) car.x=g.cityL; }

    if(key==='socket'){
      if(ooT%6===0) ooParts.push({x:g.sx+4+(Math.random()-0.5)*8,y:g.sr+Math.random()*4,vx:0,vy:-0.1,g:0,ch:"*",mode:'oosparkle',life:8});
    }else if(key==='hand'){
      const ex=home.x, ey=home.y, sx0=Math.round(COLS*0.55);
      ooHand={x:sx0+(ex-sx0)*f+Math.sin(f*Math.PI*3)*4*(1-f), y:-8+(ey+8)*Math.min(1,f*1.3), art:ooHandOpen, charger:true};
    }else if(key==='pause'){
      ooHand={x:home.x, y:home.y+Math.sin(ooT*0.15)*0.6, art:ooHandOpen, charger:true};
    }else if(key==='yank'){
      // grip, then a long slow suction-pop as the plug comes away
      const pull=Math.max(0,(f-0.3)/0.7);
      ooHand={x:home.x+pull*6, y:home.y-pull*5, art:ooHandGrip, charger:false};
      if(f<0.3) ooPlug={state:'in'};
      else ooPlug={state:'hand', x:Math.round(ooHand.x)+3, y:Math.round(ooHand.y)+6, art:ooPlugOutArt};
      if(ooT===Math.round(dur*0.35)) ooText("sssshhhhllooooo...",g.sx+4,g.sr-2,'ootext',40,-0.1);
      if(ooT===Math.round(dur*0.85)) ooText("POP",g.sx+4,g.sr,'ootext',20);
    }else if(['oops','dark','amber','sag','droop'].includes(key)){
      ooHand={x:home.x+6+Math.sin(ooT*0.1)*0.5, y:home.y-5, art:ooHandGrip, charger:false};
      ooPlug={state:'hand', x:Math.round(ooHand.x)+3+Math.round(Math.sin(ooT*0.2)), y:Math.round(ooHand.y)+6, art:ooPlugOutArt};
      if(Math.random()<0.25) ooParts.push({x:ooPlug.x+3+(Math.random()-0.5)*4,y:ooPlug.y+3,vx:(Math.random()-0.5)*0.6,vy:0.2,g:0.05,ch:"*",mode:'oospark',life:8});
      if(key==='dark'){
        const d=Math.min(3,Math.floor(f*4.4));
        for(let k=0;k<=d;k++) if(!ooDark[k]){ ooDark[k]=true; const mid=g.cityL+(COLS-g.cityL)*(k+0.5)/4; ooText("bwoooom",mid,streetRow*0.4,'ootext',30,0.15); }
        document.body.style.background=ooLerpHex(OO_SKY_DUSK,OO_SKY_DARK,f);
      }
      if(key==='sag'){
        // buildings deflate: a third of their height goes, a row at a time
        const avg=Math.round((streetRow-2)*0.3), want=Math.round(avg*Math.min(1,f/0.8));
        while(ooSag<want){ ooShiftDown(g.cityL,COLS-1); ooSag++; }
        if(ooT%12===0) ooText("pfffff",g.cityL+Math.random()*(COLS-g.cityL),streetRow*0.5,'ootext',24,-0.1);
      }
    }else if(key==='replug' || key==='replug2'){
      // jab, scrape, try again; the plug manages to be wrong whichever way round it goes
      const jab=Math.abs(Math.sin(ooT*0.3));
      ooHand={x:home.x, y:home.y-2+jab*2, art:ooHandGrip, charger:false};
      const attempt=Math.floor(ooT/12)%2;
      const art=key==='replug'?ooPlugUpsideArt:(attempt?ooPlugSidewaysArt:ooPlugUpsideArt);
      ooPlug={state:'hand', x:Math.round(ooHand.x)+(art[0].length>7?2:3), y:Math.round(ooHand.y)+6, art};
      if(jab>0.97 && ooT%6===0) ooText("SCRRK",g.sx+4+(Math.random()-0.5)*6,g.sr-1,'ootext',14);
    }else if(key==='surge'){
      if(ooT===0){ ooPlug={state:'angled'}; ooText("CLUNK",g.sx+4,g.sr-1,'ootext',20); }
      ooHand={x:home.x+Math.min(1,f*3)*8, y:home.y-Math.min(1,f*3)*8, art:ooHandOpen, charger:false};
      const t=Math.min(1,f/0.6);
      ooSpark=t<1?{t}:null;
      if(t<1 && ooT%2===0) ooParts.push({x:g.jx,y:g.jy-1,vx:0,vy:0,g:0,ch:"*",mode:'oospark',life:3});
      if(t>=1 && ooFlashT===0){
        ooFlashT=1; ooDark=[false,false,false,false];
        flash.style.transition="opacity 0.03s"; flash.style.opacity=0.6;
        setTimeout(()=>{ flash.style.transition="opacity 0.6s"; flash.style.opacity=0; },60);
        document.body.style.background=OO_SKY_DUSK;
      }
    }else if(key==='kettles'){
      ooHand={x:home.x+8, y:-9, art:ooHandOpen, charger:false};
      if(ooT%3===0){
        const c=g.cityL+((Math.random()*(COLS-g.cityL))|0), top=ooColTop(c);
        if(top<streetRow) ooKettles.push({x:c, y:top-1, vy:-0.2, toast:Math.random()<0.5});
      }
      for(const k of ooKettles){ k.vy-=k.toast?0.25:0.12; k.y+=k.vy; if(!k.toast) ooParts.push({x:k.x+1,y:k.y+1,vx:(Math.random()-0.5)*0.3,vy:0.3,g:0,ch:"*",mode:'fire',life:5}); }
      ooKettles=ooKettles.filter(k=>k.y>-2);
    }else if(key==='dryer'){
      for(const k of ooKettles){ k.vy-=0.2; k.y+=k.vy; } ooKettles=ooKettles.filter(k=>k.y>-2);
      if(!ooHouse){
        const hx=Math.round(g.cityL+(COLS-g.cityL)*0.7);
        for(let c=hx-1;c<=hx+5;c++){ ooClearCol(c); }
        ooHouse={x:hx, y:streetRow-ooHouseArt.length};
      }
      if(f>0.2){ ooHouse.y-=0.45; ooHouse.x+=0.35; }
      if(ooHouse.y<-6) ooHouse=null;
    }else if(key==='pop'){
      ooKettles=[]; ooHouse=null;
      if(ooT===0) ooSegs=ooFindSegments();
      const n=ooSegs.length, due=Math.floor(Math.min(1,f/0.9)*n);
      for(let i=0;i<due;i++){
        const s=ooSegs[i]; if(s.popped) continue;
        s.popped=true; s.flash=0;
        for(let c=s.c0;c<=s.c1;c++){ const had=ooColTop(c)<streetRow; ooClearCol(c); if(had) ooSetRubble(c); }
        ooText("POP",(s.c0+s.c1)/2,streetRow*0.6,'ootext',16);
        for(let k=0;k<5;k++) ooParts.push({x:(s.c0+s.c1)/2,y:streetRow-4,vx:(Math.random()-0.5)*1.6,vy:-Math.random(),g:0.06,ch:"*",mode:'oospark',life:12});
      }
      if(due<n) ooSegs[due].flash=2;                                    // the next one, about to go
      if(ooT===dur-1){
        for(let c=g.cityL;c<COLS;c++){ if(c>=g.rv0-1&&c<=g.rv1+1) continue; if(ooColTop(c)<streetRow){ ooClearCol(c); ooSetRubble(c); } }
        for(const L of ooLights) ooSetRubble(L.c);
        ooLights=[]; ooCars=[];
        for(let c=g.rv0-1;c<=g.rv1+1;c++) ooSetRubble(c);              // the bridge goes too
      }
      ooDark=[true,true,true,true];
      document.body.style.background=OO_SKY_DARK;
    }else if(key==='segv'){
      if(!ooSmoke) ooSmoke={on:Array(OO_SEGV.length).fill(false), at:OO_SEGV.split("").map(()=>Math.random()*0.7)};
      ooSmoke.on=ooSmoke.at.map(a=>f>=a);
      if(ooT%2===0) ooParts.push({x:g.cityL+Math.random()*(COLS-g.cityL),y:streetRow-2,vx:(Math.random()-0.5)*0.2,vy:-0.3,g:0,ch:"'",mode:'oosmoke',life:30});
    }else if(key==='silence'){
      // nothing at all
    }else if(key==='charger'){
      if(ooSmoke) ooSmoke.on=ooSmoke.on.map(o=>o && Math.random()>0.05);
      // the hand comes back, puts the city's plug down, plugs the charger in
      const d=Math.min(1,f/0.35);
      ooHand={x:home.x, y:-9+(home.y+9)*d, art:ooHandOpen, charger:f<0.4};
      if(f>=0.4 && ooPlug.state!=='ground'){ ooPlug={state:'ground', x:g.jx-10}; ooText("click",g.sx+4,g.sr-1,'ootext',20); }
      if(f>0.5) ooHand.y=home.y-Math.min(1,(f-0.5)/0.3)*4;
    }else if(key==='thumbs'){
      if(ooSmoke && ooSmoke.on.every(o=>!o)) ooSmoke=null; else if(ooSmoke) ooSmoke.on=ooSmoke.on.map(o=>o && Math.random()>0.1);
      // off to the right of the "Charging, 1%" notification, so the two never overlap
      const bubbleC=Math.max(10,g.sx+3);
      ooHand={x:Math.min(COLS-13,bubbleC+11), y:Math.max(0,g.sr-8), art:ooHandThumb, charger:false};
    }
    if(ooSpark && key!=='surge') ooSpark=null;

    ooStepFx();
    ooRender(beat,f);
    sub.textContent=beat.cap; sub.style.color=key==='oops'?"#ffffff":"#ffd890"; sub.style.textShadow="0 0 8px #5a3a8a";
    ooT++;
    if(ooT>=dur && !hold){ ooT=0; ooIdx++; if(ooIdx>=OO_BEATS.length){ phase='oo_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='oo_hold'){
    ooStepFx();
    ooRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=OO_HOLD; sub.style.color="#ffd890"; sub.style.textShadow="0 0 8px #5a3a8a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m80_start(){
  attackMode='oo_run';
  cmd.style.color="#ffd890"; cmd.style.textShadow="0 0 20px #5a3a8a";
  ooStarted=false; phase='oo_run';
}

function __m80_reset(){
  ooStarted=false; ooT=0; ooIdx=0; ooG=null; ooDark=[]; ooCars=[]; ooLights=[]; ooParts=[]; ooTexts=[];
  ooRubble=[]; ooRubbleCh=[]; ooSag=0; ooSegs=[]; ooKettles=[]; ooHouse=null; ooSmoke=null; ooFlashT=0;
  ooHand=null; ooPlug=null; ooSpark=null;
}

registerMethod(80, { start: __m80_start, resetFn: __m80_reset, loopFn: __m80_loop, phaseNames: ['oo_run','oo_hold'] });
