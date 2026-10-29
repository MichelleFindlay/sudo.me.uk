let tbStarted=false, tbT=0, tbIdx=0, tbG=null, tbTubs=[], tbRabbits=[], tbSunY=0, tbCustard=0, tbSpread=0, tbFloat=[];
let tbNoo=null, tbLamp=true, tbBus=true, tbParts=[], tbTexts=[], tbHug=null, tbBigHill=0, tbTrumpet=0, tbLit=false, tbShake=0, tbPopBus=null;

// ---- TELETUBBIES ----
// a hill turns up in the main square. Four tubbies, a sun baby, a custard machine, a vacuum
// cleaner, tummy screens that put the city on a loop, and finally a hug that crumples every
// building inward, leaving one big smooth hill where the city used to be
const TB_BEATS=[
  {key:'est',     cap:"THE PEACEFUL CITY ON A BRIGHT MORNING. EXCEPT A GENTLY ROLLING GREEN HILL HAS APPEARED IN THE MAIN SQUARE OVERNIGHT."},
  {key:'rabbits', cap:"RABBITS ARE HOPPING AROUND ON IT. NOBODY REMEMBERS IT BEING THERE."},
  {key:'sun',     cap:"THE SUN COMES UP, WITH A GIANT GIGGLING BABY'S FACE IN IT."},
  {key:'giggle',  cap:"IT GIGGLES. AND KEEPS GIGGLING. NOBODY CAN TELL WHERE THE SOUND IS COMING FROM."},
  {key:'arrive',  cap:"FOUR COLOURFUL, ROUND, ANTENNA-HEADED CREATURES POP OUT OF THE HILL, ONE AT A TIME."},
  {key:'ehoh',    cap:"EACH ONE WAVES AT THE CITY AND SAYS \"EH-OH!\" THE CITY DOES NOT WAVE BACK."},
  {key:'trumpet', cap:"A PERISCOPE-LIKE VOICE TRUMPET RISES OUT OF THE GRASS..."},
  {key:'custard', cap:"...AND ANNOUNCES THAT IT'S TIME FOR TUBBY CUSTARD. THE TUBBIES CHEER.", say:"TIME FOR TUBBY CUSTARD!"},
  {key:'machine', cap:"THE CUSTARD MACHINE STARTS UP, AND PINK CUSTARD BEGINS POURING OUT."},
  {key:'flood',   cap:"THE CUSTARD DOESN'T STOP. IT FLOODS OVER THE HILL AND OUT INTO THE STREETS."},
  {key:'float',   cap:"CARS FLOAT AWAY ON A SLOW PINK TIDE. SOON THE CITY IS WAIST-DEEP IN IT."},
  {key:'noonoo',  cap:"THE LITTLE BLUE VACUUM CLEANER TRUNDLES OUT TO TIDY UP. IT SUCKS UP THE CUSTARD..."},
  {key:'slurp',   cap:"...THEN A LAMPPOST. THEN A BUS. THEN A WHOLE BLOCK OF OFFICES. IT GETS BIGGER WITH EVERY SLURP."},
  {key:'tummies', cap:"THE TUBBIES' TUMMIES LIGHT UP."},
  {key:'screens', cap:"ON EVERY SCREEN IN THE CITY, THE SAME VIDEO APPEARS: CHILDREN PLAYING IN A FIELD. THEN IT PLAYS AGAIN. AND AGAIN."},
  {key:'again',   cap:"\"AGAIN, AGAIN!\" THE TUBBIES CHEER. AND IT DOES. THE CITY STARTS LOOPING."},
  {key:'loops',   cap:"THE SAME BUS CRASHES INTO THE SAME BIN. A MAN DROPS HIS COFFEE FOREVER. PIGEONS FLY BACKWARDS, THEN FORWARDS."},
  {key:'grow',    cap:"THE TUBBIES DECIDE THE CITY NEEDS A BIG HUG, AND GROW TO SKYSCRAPER SIZE."},
  {key:'hug',     cap:"THEY SQUEEZE THE WHOLE CITY TOGETHER IN ONE ENORMOUS, LOVING HUG. EVERY BUILDING CRUMPLES INWARD."},
  {key:'set',     cap:"THE SUN BABY GIGGLES ONE LAST TIME, AND SETS."},
  {key:'hill',    cap:"WHERE THE CITY STOOD IS ONE SMOOTH GREEN HILL, WITH RABBITS HOPPING ACROSS IT."},
  {key:'byebye',  cap:"FAINTLY, FROM UNDERGROUND, A VOICE SAYS: \"TIME FOR TUBBY BYE-BYE.\""},
  {key:'bus',     cap:"A SINGLE BUS POPS OUT OF THE HILL, WAVES, AND GOES BACK IN."}
];
const TB_HOLD="TUBBY BYE-BYE. — press RESET";
const TB_TUBS=[{ant:"^"},{ant:"|"},{ant:"@"},{ant:"o"}];
const tbSunArts=[[" \\  |  / ","--(^v^)--"," /  |  \\ "],[" \\  |  / ","--(^o^)--"," /  |  \\ "]];
const tbNooArt=[" .--.  ","=(oo)=>"," '--'  "];
const tbMachineArt=["[@@]","|  |","|__|"];
const tbBusArt=[" _______ ","|[][][]|]","'o-----o'"];

function tbDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function tbScale(art,s){ if(s<=1) return art; const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out; }
function tbPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function tbText(s,x,y,mode,life){ tbTexts.push({s,x,y,mode:mode||'tbtext',life:life||20}); }
function tbColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function tbTubbyArt(ant,lit){ return ["  "+ant+"  "," .-. ","(o.o)","|"+(lit?"###":"[ ]")+"|"," | | "]; }
// the little hill in the square, and later the big one where the city was
function tbHillTop(c){
  const g=tbG; let top=streetRow;
  if(Math.abs(c-cx)<=g.hw) top=Math.min(top,Math.round(streetRow-1-g.hh*Math.cos((c-cx)/g.hw*Math.PI/2)));
  if(tbBigHill>0) top=Math.min(top,Math.round(streetRow-1-tbBigHill*Math.sin(Math.PI*(c+0.5)/COLS)));
  return top;
}
function tbBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }

function tbInit(){
  tbStarted=true; tbT=0; tbIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const hw=Math.max(12,Math.round(COLS*0.14)), hh=Math.max(4,Math.min(7,Math.round(streetRow*0.15)));
  tbG={hw, hh, lamp:Math.round(COLS*0.22), bus:Math.round(COLS*0.68), bin:Math.round(COLS*0.18), man:Math.round(COLS*0.8)};
  for(let r=0;r<streetRow;r++) for(let c=cx-hw-1;c<=cx+hw+1;c++) setCh(cityGridArr,r,c," ");
  for(const c of [tbG.lamp]) for(let r=0;r<streetRow;r++) for(let k=-1;k<=1;k++) setCh(cityGridArr,r,c+k," ");
  for(let r=0;r<streetRow;r++) for(let c=tbG.bus-1;c<=tbG.bus+9;c++) setCh(cityGridArr,r,c," ");
  // each tubby has a home spot on the hilltop, popping up out of the grass
  tbTubs=TB_TUBS.map((t,i)=>({...t, i, x:cx-11+i*6, rise:0, s:1, lit:false}));
  tbRabbits=[]; for(let i=0;i<3;i++) tbRabbits.push({x:cx-hw+3+i*Math.round(hw*0.7), ph:i*2});
  tbSunY=streetRow-2; tbCustard=0; tbSpread=0; tbFloat=[];
  tbNoo=null; tbLamp=true; tbBus=true; tbParts=[]; tbTexts=[]; tbHug=null; tbBigHill=0; tbTrumpet=0; tbLit=false; tbShake=0; tbPopBus=null;
  document.body.style.background="#3a7ad0";
}

function tbRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=tbG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  // every screen in the city plays the same video, frame for frame
  if(['screens','again','loops'].includes(key)){
    const fr=(tbT>>2)%4;
    for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if(ch==="."||ch===":"){ setCh(grid,r,c,"#"); setMode(mg,r,c,'tbvideo'+fr); } }
  }
  // the sun baby
  if(tbSunY<streetRow){ const art=tbSunArts[(tbT>>3)%2]; tbPlace(grid,mg,art,COLS-12,tbSunY,'tbsun'); tbPlace(grid,mg,[art[1].slice(2,7)],COLS-10,tbSunY+1,'tbbaby'); }
  // hills (grass), flowers, rabbits
  for(let c=0;c<COLS;c++){
    const top=tbHillTop(c); if(top>=streetRow) continue;
    for(let r=top;r<streetRow;r++){ setCh(grid,r,c,r===top?"^":((r*7+c*3)%11===0?"*":"\"")); setMode(mg,r,c,r===top?'tbgrasstop':((r*7+c*3)%11===0?'tbflower':'tbgrass')); }
  }
  for(const R of tbRabbits){ const top=tbHillTop(Math.round(R.x)); tbPlace(grid,mg,["(\\/)"],R.x-1,top-1-((tbT+R.ph*4)%10<4?1:0),'tbrabbit'); }
  // street props: lamppost, parked bus, the bin and the man with his coffee
  if(tbLamp) tbPlace(grid,mg,["o","|","|","|"],g.lamp,streetRow-4,'tblamp');
  if(tbBus && !['again','loops'].includes(key)) tbPlace(grid,mg,tbBusArt,g.bus,streetRow-3,'tbbus');
  if(['again','loops'].includes(key)){
    // the city on a loop: same crash, same spilt coffee, same pigeons, over and over
    const cyc=tbT%20, bx=Math.round(g.bin-12+Math.min(1,cyc/12)*9);
    tbPlace(grid,mg,["[_]","|#|"],g.bin,streetRow-2,'tbbin');
    tbPlace(grid,mg,tbBusArt,bx,streetRow-3,'tbbus');
    if(cyc===12) tbText("CRASH",g.bin+1,streetRow-5,'tbtext',8);
    const cup=Math.min(3,(tbT%16)/3);
    tbPlace(grid,mg,[" o ","/|\\","/ \\"],g.man,streetRow-3,'body');
    tbPlace(grid,mg,["u"],g.man+3,streetRow-3+Math.round(cup),'tbcoffee');
    if(tbT%16===10) tbText("splash",g.man+3,streetRow-4,'tbtext',6);
    for(let k=0;k<3;k++){ const ph=Math.sin(tbT*0.15+k*2), x=Math.round(COLS*(0.25+k*0.25)+ph*8); tbPlace(grid,mg,[Math.cos(tbT*0.15+k*2)>0?"v>":"<v"],x,3+k,'tbpigeon'); }
  }
  // custard: a pink tide up to waist height, spreading out from the hill
  for(let k=0;k<Math.round(tbCustard);k++){
    const r=streetRow-1-k;
    for(let c=0;c<COLS;c++){ if(Math.abs(c-cx)>tbSpread) continue; setCh(grid,r,c,k===Math.round(tbCustard)-1?((c+tbT)%5<2?"~":"-"):"≈"); setMode(mg,r,c,'tbcustard'); }
  }
  for(const F of tbFloat) tbPlace(grid,mg,["o=o"],F.x,streetRow-2-Math.round(tbCustard)+Math.round(Math.sin(tbT*0.2+F.x)),'car');
  // the machine and the voice trumpet
  if(!tbHug) tbPlace(grid,mg,tbMachineArt,cx+g.hw-6,tbHillTop(cx+g.hw-5)-3,'tbmachine');
  if(tbTrumpet>0 && !tbHug){
    const tx=cx-g.hw+4, base=tbHillTop(tx);
    for(let k=1;k<=Math.round(tbTrumpet);k++){ setCh(grid,base-k,tx,"|"); setMode(mg,base-k,tx,'tbtrumpet'); }
    tbPlace(grid,mg,["=O"],tx-1,base-Math.round(tbTrumpet)-1,'tbtrumpet');
  }
  // the tubbies
  for(const T of tbTubs){
    if(T.rise<=0 && !tbHug) continue;
    const art=tbScale(tbTubbyArt(T.ant,T.lit),Math.round(T.s)), h=art.length, w=art[0].length;
    const base=tbHug?streetRow-1:tbHillTop(Math.round(T.x+2))-1;
    const top=base-h+1+Math.round((1-Math.min(1,T.rise))*h);
    // only the risen part shows above the grass
    for(let i=0;i<h;i++){ const r=top+i; if(!tbHug && r>base) break;
      for(let j=0;j<w;j++){ const ch=art[i][j]; if(ch===" ") continue; const c=Math.round(T.x-(w-5)/2)+j; if(c<0||c>=COLS||r<0) continue; setCh(grid,r,c,ch); setMode(mg,r,c,'tbt'+T.i); } }
    T.top=top; T.w=w;
  }
  if(tbNoo){ const art=tbScale(tbNooArt,Math.round(tbNoo.s)); tbPlace(grid,mg,art,tbNoo.x,streetRow-art.length,'tbnoonoo'); tbNoo.w=art[0].length; tbNoo.h=art.length; }
  if(tbPopBus) tbPlace(grid,mg,tbBusArt,tbPopBus.x,Math.round(tbPopBus.y),'tbbus');
  for(const p of tbParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of tbTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  // speech
  if(key==='ehoh'){ const i=Math.min(3,Math.floor(f*4)), T=tbTubs[i]; if(T.top!==undefined) tbBubble(grid,mg,T.x+2,T.top,"Eh-oh!"); }
  if(beat && beat.say && f<0.9 && tbTrumpet>0){ const tx=cx-g.hw+4; tbBubble(grid,mg,tx,tbHillTop(tx)-Math.round(tbTrumpet)-1,beat.say); }
  if(key==='again' && f<0.9 && tbTubs[1].top!==undefined) tbBubble(grid,mg,cx,tbTubs[1].top,"AGAIN! AGAIN!");
  if(key==='byebye' && f<0.95) tbBubble(grid,mg,cx,tbHillTop(cx)+2,"Time for Tubby bye-bye.");
  scene.innerHTML=paint(grid,mg,'city');
}
function tbStepFx(){
  for(const p of tbParts){ if(p.to){ p.x+=(p.to.x-p.x)*0.2; p.y+=(p.to.y-p.y)*0.2; } else { p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; } p.life--; }
  tbParts=tbParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of tbTexts){ t.life--; if(t.life%3===0) t.y--; }
  tbTexts=tbTexts.filter(t=>t.life>0);
  for(const R of tbRabbits){ R.x+=0.08*(R.ph%2?1:-1); if(tbBigHill>0){ if(R.x<2||R.x>COLS-4) R.ph++; } else if(Math.abs(R.x-cx)>tbG.hw-3) R.ph++; }
}
function tbSuck(c0,c1,r0,mode){
  // whatever's in this box goes up the nozzle
  const N=tbNoo, to={x:N.x+N.w, y:streetRow-Math.ceil(N.h/2)};
  for(let r=Math.max(0,r0);r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){
    const ch=cityGridArr[r][c]; if(ch===" ") continue;
    if(Math.random()<0.4) tbParts.push({x:c,y:r,to,ch,mode:mode||'city',life:14});
    setCh(cityGridArr,r,c," ");
  }
}

function __m87_loop(){
  if(phase==='tb_run'){
    if(!tbStarted) tbInit();
    const beat=TB_BEATS[tbIdx], dur=tbDur(beat.cap), f=tbT/Math.max(1,dur-1), key=beat.key, g=tbG;

    if(key==='sun'){ tbSunY=Math.round((streetRow-2)-(streetRow-3)*Math.min(1,f/0.8)); }
    else if(key==='giggle'||key==='set'&&f<0.3){ if(tbT%9===0) tbText(["hehehe","giggle","heehee"][(Math.random()*3)|0],COLS-8,tbSunY+4,'tbtext',14); }
    if(key==='arrive') tbTubs.forEach((T,i)=>{ const s=i/4; if(f>s) T.rise=Math.min(1,T.rise+0.08); if(f>s && T.rise<1 && T.rise>0.9) tbText("pop!",T.x+2,streetRow-12,'tbtext',10); });
    if(key==='ehoh') tbTubs.forEach(T=>T.rise=1);
    if(key==='trumpet') tbTrumpet=Math.min(5,tbTrumpet+0.15);
    if(key==='custard' && tbT%10===0 && f>0.5) tbText("YAAAY!",cx,streetRow-14,'tbtext',12);
    if(key==='machine'){ if(tbT%2===0) tbParts.push({x:cx+g.hw-3,y:tbHillTop(cx+g.hw-3)-3,vx:0.4,vy:0.2,g:0.05,ch:"~",mode:'tbcustard',life:14}); if(tbT%8===0) tbText("glorp",cx+g.hw-3,streetRow-10,'tbtext',10); tbCustard=Math.min(1,f); tbSpread=Math.round(g.hw*f); }
    if(key==='flood'){ tbCustard=1+f*2; tbSpread=g.hw+Math.round((COLS/2)*f); }
    if(key==='float'){
      tbCustard=3+f; tbSpread=COLS;
      if(!tbFloat.length) tbFloat=[0.1,0.35,0.55,0.9].map(x=>({x:Math.round(COLS*x)}));
      for(const F of tbFloat){ F.x+=0.15; if(F.x>COLS) F.x=-3; }
    }
    if(key==='noonoo'){
      if(!tbNoo) tbNoo={x:-8, s:1, w:7, h:3};
      tbNoo.x=Math.min(Math.round(COLS*0.12),tbNoo.x+0.6);
      tbCustard=Math.max(0,4*(1-f)); for(const F of tbFloat) F.x+=0.1;
      if(f>0.6) tbFloat=[];
      if(tbT%2===0 && tbCustard>0) tbParts.push({x:tbNoo.x+tbNoo.w+2+Math.random()*6,y:streetRow-1,to:{x:tbNoo.x+tbNoo.w,y:streetRow-2},ch:"~",mode:'tbcustard',life:10});
      if(tbT%12===0) tbText("slurrp",tbNoo.x+4,streetRow-6,'tbtext',12);
    }
    if(key==='slurp'){
      // the lamppost, then the bus, then a block of offices; it grows after each one
      const N=tbNoo, targets=[g.lamp, g.bus, Math.min(COLS-6,g.bus+14)];
      const stage=Math.min(2,Math.floor(f*3)), want=targets[stage]-N.w-2;
      N.x+=(want-N.x)*0.12;
      if(stage>=0 && f>0.15 && tbLamp){ tbLamp=false; tbText("SHLOOP",g.lamp,streetRow-6,'tbtext',14); N.s=1.6; for(let k=0;k<4;k++) tbParts.push({x:g.lamp,y:streetRow-1-k,to:{x:N.x+N.w,y:streetRow-2},ch:"|",mode:'tblamp',life:12}); }
      if(stage>=1 && f>0.48 && tbBus){ tbBus=false; tbText("SHLOOOP",g.bus+4,streetRow-6,'tbtext',14); N.s=2.3; for(let k=0;k<8;k++) tbParts.push({x:g.bus+k,y:streetRow-2,to:{x:N.x+N.w,y:streetRow-2},ch:"#",mode:'tbbus',life:12}); }
      if(stage>=2 && f>0.8 && !N.ate){ N.ate=true; tbSuck(targets[2]-3,targets[2]+8,0,'city'); tbText("SHLOOOOOOP",targets[2]+2,streetRow-12,'tbtext',16); N.s=3; }
    }
    if(key==='tummies'){ if(tbNoo){ tbNoo.x-=1.2; if(tbNoo.x<-25) tbNoo=null; } tbTubs.forEach(T=>T.lit=(tbT>>1)%2===0||f>0.5); }
    if(key==='screens'||key==='again'||key==='loops'){ tbNoo=null; tbTubs.forEach(T=>T.lit=true); }
    if(key==='grow'){
      // skyscraper size, spread out around the edges of the city
      const S=Math.max(2,Math.min(6,Math.floor((streetRow-2)*0.75/5)));
      const spots=[0.1,0.28,0.72,0.9];
      if(!tbHug) tbHug={L:0, R:COLS-1};
      tbTubs.forEach((T,i)=>{ T.lit=false; T.s=1+(S-1)*Math.min(1,f/0.7); T.x+=(COLS*spots[i]-2-T.x)*0.1; });
      tbShake=1.5;
    }
    if(key==='hug'){
      // they walk inwards; everything outside their arms is squished toward the middle
      const e=Math.min(1,f/0.8), H=tbHug;
      const nl=Math.round(cx*e), nr=Math.round(COLS-1-(COLS-1-cx)*e);
      for(let c=H.L;c<nl;c++){ for(let r=0;r<streetRow;r++){ const ch=cityGridArr[r][c]; if(ch!==" "){ if(Math.random()<0.1) tbParts.push({x:c,y:r,vx:0.8,vy:-0.1,g:0.04,ch,mode:'city',life:14}); setCh(cityGridArr,r,c," "); } } }
      for(let c=H.R;c>nr;c--){ for(let r=0;r<streetRow;r++){ const ch=cityGridArr[r][c]; if(ch!==" "){ if(Math.random()<0.1) tbParts.push({x:c,y:r,vx:-0.8,vy:-0.1,g:0.04,ch,mode:'city',life:14}); setCh(cityGridArr,r,c," "); } } }
      H.L=nl; H.R=nr;
      const w=tbTubs[0].w||10;
      tbTubs[0].x=nl-w*2; tbTubs[1].x=nl-w; tbTubs[2].x=nr; tbTubs[3].x=nr+w;
      if(tbT%10===0) tbText("squish",cx+(Math.random()-0.5)*COLS*0.4,streetRow*0.5,'tbtext',14);
      tbShake=2.5;
      if(f>0.95){ for(let r=0;r<streetRow;r++) cityGridArr[r]=" ".repeat(COLS); }
    }
    if(key==='set'){
      if(tbT===0){ tbHug=null; tbTubs.forEach(T=>T.rise=0); tbG.hh=0; tbG.hw=-1; tbShake=0; }
      tbBigHill=Math.max(tbBigHill,Math.round(streetRow*0.35*Math.min(1,f/0.6)));
      tbSunY=Math.round(1+(streetRow+2)*Math.max(0,(f-0.3)/0.7));
      document.body.style.background=f<0.5?"#e08a4a":"#5a3a7a";
      if(f>0.5 && tbRabbits.length<6){ for(let i=0;i<5;i++) tbRabbits.push({x:COLS*(0.1+i*0.2), ph:i}); }
    }
    if(key==='bus'){
      if(!tbPopBus) tbPopBus={x:cx-4, y:tbHillTop(cx)};
      const top=tbHillTop(cx)-3;
      tbPopBus.y=f<0.25?tbHillTop(cx)-(f/0.25)*3:(f<0.75?top:top+((f-0.75)/0.25)*3);
      if(tbT===Math.round(dur*0.4)) tbText("*wave*",cx+6,top-2,'tbtext',20);
      if(f>0.97) tbPopBus=null;
    }

    if(tbShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*tbShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*tbShake).toFixed(1)+"px)"; tbShake*=0.95; }
    else { stage.style.transform=""; tbShake=0; }
    tbStepFx();
    tbRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffe066"; sub.style.textShadow="0 0 8px #9a4ad0";
    tbT++;
    if(tbT>=dur){ tbT=0; tbIdx++; if(tbIdx>=TB_BEATS.length){ phase='tb_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='tb_hold'){
    stage.style.transform="";
    tbStepFx(); tbT++;
    tbRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=TB_HOLD; sub.style.color="#ffe066"; sub.style.textShadow="0 0 8px #9a4ad0";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m87_start(){
  attackMode='tb_run';
  cmd.style.color="#ffe066"; cmd.style.textShadow="0 0 20px #9a4ad0";
  tbStarted=false; phase='tb_run';
}

function __m87_reset(){
  tbStarted=false; tbT=0; tbIdx=0; tbG=null; tbTubs=[]; tbRabbits=[]; tbSunY=0; tbCustard=0; tbSpread=0; tbFloat=[];
  tbNoo=null; tbLamp=true; tbBus=true; tbParts=[]; tbTexts=[]; tbHug=null; tbBigHill=0; tbTrumpet=0; tbLit=false; tbShake=0; tbPopBus=null;
  stage.style.transform="";
}

registerMethod(87, { start: __m87_start, resetFn: __m87_reset, loopFn: __m87_loop, phaseNames: ['tb_run','tb_hold'] });
