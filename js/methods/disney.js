let dzStarted=false, dzT=0, dzIdx=0, dzG=null, dzParts=[], dzTexts=[], dzBoatX=0, dzSpread=0, dzFire=null, dzPlanes=false;
let dzBattery=-1, dzLastSing=false, dzHands=false, dzKick=false, dzTap=false, dzShrink=1, dzGlobe=false, dzRm=0, dzPanic=false, dzLog=[];

// ---- DISNEY: the ride never ends ----
// told as a kernel boot log: each log line is a beat, typed into a terminal panel at the top
// while the city below acts it out. The singing forks through every window; the world syncs
// up, holds hands and kicks; then reality is downsampled into a snow globe and rm'd
const DZ_BEATS=[
  {key:'mount',      log:"[  0.001] Mounting /dev/magic_kingdom... OK"},
  {key:'pixie',      log:"[  0.004] Loading pixie_dust.so... OK"},
  {key:'dolls',      log:"[  0.009] WARNING: animatronic children detected in /usr/share/boats"},
  {key:'ride',       log:"[  0.012] Starting ride: \"It's a Small World\"... OK"},
  {key:'boat',       log:"[  0.015] Boat 1 departed. Passengers: 12. Smiling: 12. Consent: unverified."},
  {key:'sing',       log:"[  1.200] Process `sing` spawned (PID 1964)"},
  {key:'fork',       log:"[  1.201] sing: forking to nearby listeners..."},
  {key:'spread',     log:"[  1.450] sing: 48 \u2192 2,304 \u2192 110,592 processes"},
  {key:'earworm',    log:"[  2.000] ERROR: earworm.ko cannot be unloaded (module in use)"},
  {key:'fire',       log:"[  2.010] Fire department responding. Fire department is now singing."},
  {key:'planes',     log:"[  2.330] Air traffic control now singing. Planes circling in 3/4 time."},
  {key:'council',    log:"[  3.100] City council emergency session opened. Minutes recorded: one song title, 4,000 times."},
  {key:'basement',   log:"[  3.900] Last known silent human located in basement with headphones."},
  {key:'bat2',       log:"[  3.901] Battery: 2%."},
  {key:'bat0',       log:"[  3.950] Battery: 0%."},
  {key:'lastsing',   log:"[  3.951] Last known silent human now singing."},
  {key:'harmonised', log:"[  4.500] Population: 100% harmonised"},
  {key:'hands',      log:"[  4.600] Hands joined across all borders. Grip strength: unbreakable."},
  {key:'kick',       log:"[  5.000] Global kick line achieved. Earth's rotation now synced to the chorus."},
  {key:'tap',        log:"[  5.800] Seismic sensors report the planet is tapping its foot."},
  {key:'shrink1',    log:"[  6.666] Reality shrinking to match the lyrics. World is now 3m wide."},
  {key:'shrink2',    log:"[  7.000] World is now 30cm wide."},
  {key:'globe',      log:"[  7.500] World fits inside a souvenir snow globe. Gift shop exit only."},
  {key:'rm1',        log:"[  8.000] Removing /home... the ride never ends"},
  {key:'rm2',        log:"[  8.001] Removing /etc... the ride never ends"},
  {key:'rm3',        log:"[  8.002] Removing /usr... the ride never ends"},
  {key:'panic',      log:"[  9.999] Kernel panic - not syncing: everyone is syncing"},
  {key:'thanks',     log:">> Thank you for riding. Please keep your hands and soul inside the vehicle."},
  {key:'forever',    log:">> Next boat departs: forever."}
];
const DZ_HOLD=">> Next boat departs: forever. — press RESET";
const dzBoatArt=[" oooooooooooo ","\\____________/"];
const dzDollArts=[[" ^ ","\\o/"," A "],[" ^ ","/o\\"," A "]];
const dzFireArt=["  __[]__  ","[==FIRE==]>"," (o)  (o) "];

function dzDur(text){ return Math.max(34, Math.ceil(text.length*0.85)); }
function dzPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function dzText(s,x,y,mode,life){ dzTexts.push({s,x,y,mode:mode||'dztext',life:life||20}); }
function dzColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function dzNote(x,y){ dzParts.push({x,y,vx:(Math.random()-0.5)*0.3,vy:-0.25,g:0,ch:Math.random()<0.5?"\u266a":"\u266b",mode:'dznote',life:22}); }
function dzLogMode(s){ return /ERROR|panic/.test(s)?'dzlogerr':(/WARNING/.test(s)?'dzlogwarn':(s.startsWith(">>")?'dzlogend':'dzlog')); }

function dzInit(){
  dzStarted=true; dzT=0; dzIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const at=f=>Math.round(COLS*f);
  dzG={council:at(0.82), basement:Math.max(2,at(0.12)), dolls:[]};
  for(let r=0;r<streetRow;r++) for(let c=dzG.council-1;c<=dzG.council+9;c++) setCh(cityGridArr,r,c," ");
  for(let i=0;i<Math.max(4,Math.round(COLS/22));i++){ const c=4+((Math.random()*(COLS-10))|0); if(Math.abs(c-dzG.council-4)>8) dzG.dolls.push({c, ph:i}); }
  dzParts=[]; dzTexts=[]; dzBoatX=-16; dzSpread=0; dzFire=null; dzPlanes=false;
  dzBattery=-1; dzLastSing=false; dzHands=false; dzKick=false; dzTap=false; dzShrink=1; dzGlobe=false; dzRm=0; dzPanic=false; dzLog=[];
  document.body.style.background="#1a2050";
}

function dzRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=dzG, key=beat?beat.key:'hold';
  let grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  if(!dzPanic){
    // windows fill with singing faces as the process forks through the city
    if(dzSpread>0) for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if((ch==="."||ch===":") && ((r*13+c*7)%100)<dzSpread*100){ setCh(grid,r,c,(dzT>>2)%2?"o":"O"); setMode(mg,r,c,'dzface'); } }
    // the council chamber, where the minutes are one song title
    dzPlace(grid,mg,[" _______ ","|COUNCIL|","|o o o o|","|_______|"],g.council,streetRow-4,'dzcouncil');
    // animatronic children on the rooftops
    if(DZ_BEATS.findIndex(b=>b.key==='dolls')<=dzIdx || !beat) for(const D of g.dolls){ const t=dzColTop(D.c); dzPlace(grid,mg,dzDollArts[((dzT>>3)+D.ph)%2],D.c-1,t-3,'dzdoll'+(D.ph%4)); }
    // the canal and the boat that never stops
    if(DZ_BEATS.findIndex(b=>b.key==='ride')<=dzIdx || !beat){
      for(let c=0;c<COLS;c++){ setCh(grid,streetRow,c,((c+dzT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
      dzPlace(grid,mg,dzBoatArt,dzBoatX,streetRow-1,'dzboat');
    }
    // the last silent human, down in the basement
    if(['basement','bat2','bat0','lastsing'].includes(key)){
      const bx=g.basement, by=streetRow+2;
      dzPlace(grid,mg,["[          ]"],bx-1,by,'dzbasement');
      dzPlace(grid,mg,["d(o)b"],bx,by,'dzhuman');
      if(dzBattery>=0) dzPlace(grid,mg,["["+dzBattery+"%]"],bx+6,by,dzBattery>0?'dzbattery':'dzlogerr');
    }
    if(dzFire) dzPlace(grid,mg,dzFireArt,dzFire.x,streetRow-4,'dzfire');
    if(dzPlanes) for(let k=0;k<3;k++){ const a=dzT*0.06+k*2.094, x=Math.round(cx+Math.cos(a)*COLS*0.3), y=Math.round(streetRow*0.28+Math.sin(a)*3); dzPlace(grid,mg,[Math.sin(a)>0?"<=-":"-=>"],x,y,'dzplane'); }
    // everybody, holding hands along the canal bank, then kicking in a line
    if(dzHands){
      const kickUp=dzKick && (dzT>>2)%2;
      for(let c=0;c<COLS-2;c+=3){
        setCh(grid,streetRow-4,c+1,"o"); setMode(mg,streetRow-4,c+1,'dzface');
        dzPlace(grid,mg,["_|_"],c,streetRow-3,'dzpeople');
        dzPlace(grid,mg,[kickUp&&(c/3)%2?"| \\":"/ \\"],c,streetRow-2,'dzpeople');
      }
    }
    for(const p of dzParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
    for(const t of dzTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
    // reality shrinking: downsample the whole world into the middle of the screen
    if(dzShrink>1){
      const k=dzShrink, w=Math.max(3,Math.floor(COLS/k)), h=Math.max(2,Math.floor(ROWS/k));
      const L=Math.round(cx-w/2), T=Math.round(streetRow-h+1);
      const g2=Array.from({length:ROWS},()=>" ".repeat(COLS)), m2=modeGridFill(ROWS,COLS,'city');
      for(let r=0;r<h;r++) for(let c=0;c<w;c++){
        const sr=Math.min(ROWS-1,Math.round(r*k)), sc=Math.min(COLS-1,Math.round(c*k)), ch=grid[sr][sc];
        // and, later, rm -rf on whatever's left of it
        if(ch===" " || ((sr*31+sc*17)%100)<dzRm*100) continue;
        setCh(g2,T+r,L+c,ch); setMode(m2,T+r,L+c,mg[sr][sc]);
      }
      if(dzGlobe){
        // the snow globe around it, and the gift shop underneath
        const rx=w/2+3, ry=h/2+2, gcx=cx, gcy=T+h/2-0.5;
        for(let a=0;a<360;a+=3){ const t=a*Math.PI/180, c=Math.round(gcx+rx*Math.cos(t)), r=Math.round(gcy+ry*Math.sin(t)); if(r>=0&&r<ROWS&&c>=0&&c<COLS&&((r*7+c*3)%100)>=dzRm*100){ setCh(g2,r,c,Math.abs(Math.cos(t))>0.7?(Math.cos(t)<0?"(":")"):(Math.sin(t)<0?"_":"-")); setMode(m2,r,c,'dzglass'); } }
        if(dzRm<0.8) dzPlace(g2,m2,["[ GIFT SHOP ]"],gcx-6,Math.min(ROWS-1,Math.round(gcy+ry+1)),'dzsign');
        for(let s=0;s<6;s++){ const c=Math.round(gcx+(Math.random()-0.5)*rx*1.4), r=Math.round(gcy+(Math.random()-0.5)*ry*1.4); if(r>=0&&r<ROWS&&g2[r][c]===" "){ setCh(g2,r,c,"*"); setMode(m2,r,c,'dzsnow'); } }
      }
      grid=g2; mg=m2;
    }
  } else {
    grid=Array.from({length:ROWS},()=>" ".repeat(COLS)); mg=modeGridFill(ROWS,COLS,'city');
    if(['thanks','forever','hold'].includes(key)){
      // the next boat, departing forever
      for(let c=0;c<COLS;c++){ setCh(grid,streetRow,c,((c+dzT)%4<2)?"~":"\u2248"); setMode(mg,streetRow,c,'water'); }
      dzPlace(grid,mg,dzBoatArt,dzBoatX,streetRow-1,'dzboat');
    }
  }
  // the boot log, typed into its own panel over the sky
  const W=Math.min(COLS-2,80), N=Math.max(3,Math.min(9,Math.floor(streetRow*0.35))), top=Math.max(5,Math.round(streetRow*0.12));   // clear of the corner buttons
  const lines=dzLog.slice(-N);
  for(let i=0;i<lines.length;i++){
    let s=lines[i].s; const shown=lines[i].n!==undefined?s.slice(0,lines[i].n):s;
    let txt=shown.length>W?shown.slice(0,W-1)+"\u2026":shown;
    const r=top+i; if(r>=ROWS) break;
    grid[r]=" ".repeat(COLS); for(let c=0;c<COLS;c++) setMode(mg,r,c,'city');
    for(let j=0;j<txt.length;j++){ setCh(grid,r,1+j,txt[j]); setMode(mg,r,1+j,dzLogMode(s)); }
    if(i===lines.length-1 && (dzT>>2)%2){ const c=1+txt.length; if(c<COLS){ setCh(grid,r,c,"_"); setMode(mg,r,c,'dzlog'); } }
  }
  scene.innerHTML=paint(grid,mg,'city');
}
function dzStepFx(){
  for(const p of dzParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  dzParts=dzParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of dzTexts){ t.life--; if(t.life%3===0) t.y--; }
  dzTexts=dzTexts.filter(t=>t.life>0);
}

function __m91_loop(){
  if(phase==='dz_run'){
    if(!dzStarted) dzInit();
    const beat=DZ_BEATS[dzIdx], dur=dzDur(beat.log), f=dzT/Math.max(1,dur-1), key=beat.key, g=dzG;
    // the log line types itself out over the first part of the beat
    if(dzT===0) dzLog.push({s:beat.log, n:0});
    const cur=dzLog[dzLog.length-1]; cur.n=Math.min(beat.log.length,Math.ceil(beat.log.length*Math.min(1,f/0.45)));
    dzBoatX+=0.35; if(dzBoatX>COLS) dzBoatX=-16;

    if(key==='pixie'){ for(let k=0;k<3;k++) dzParts.push({x:Math.random()*COLS,y:4+Math.random()*4,vx:(Math.random()-0.5)*0.2,vy:0.15,g:0,ch:Math.random()<0.5?"*":".",mode:'dzpixie',life:40}); }
    if(key==='boat' && dzT%10===0) dzText("\u263a",dzBoatX+7,streetRow-3,'dzdoll2',12);
    if(key==='sing'){ if(dzT%4===0) dzNote(dzBoatX+7,streetRow-2); }
    if(key==='fork'){ dzSpread=Math.min(0.08,f*0.08); if(dzT%3===0) dzNote(dzBoatX+3+Math.random()*10,streetRow-2); }
    if(key==='spread'){ dzSpread=0.08+f*0.6; }
    if(dzSpread>0 && !dzPanic && dzShrink===1){ for(let k=0;k<Math.round(dzSpread*6);k++) if(Math.random()<0.5) dzNote(Math.random()*COLS,Math.random()*streetRow); }
    if(key==='earworm' && dzT===2){ flash.style.transition="opacity 0.03s"; flash.style.opacity=0.35; setTimeout(()=>{ flash.style.transition="opacity 0.5s"; flash.style.opacity=0; },60); }
    if(key==='fire'){ if(!dzFire) dzFire={x:-12}; dzFire.x+=0.7; if(dzT%5===0) dzNote(dzFire.x+5,streetRow-6); if(dzT%10===0) dzText("wee-oo \u266a",dzFire.x+5,streetRow-7,'dztext',10); }
    if(key==='planes'){ dzPlanes=true; if(dzFire&&dzFire.x>COLS) dzFire=null; else if(dzFire) dzFire.x+=0.7; if(dzT%8===0) dzText(["1","2","3"][(dzT/8|0)%3],cx,Math.round(streetRow*0.28)-5,'dztext',8); }
    if(key==='council'){ dzFire=null; if(dzT%4===0) dzParts.push({x:g.council+4,y:streetRow-5,vx:(Math.random()-0.5)*0.6,vy:-0.3,g:0.01,ch:"\u266a",mode:'dzsign',life:30}); }
    if(key==='bat2') dzBattery=2;
    if(key==='bat0') dzBattery=0;
    if(key==='lastsing'){ dzLastSing=true; if(dzT%4===0) dzNote(g.basement+2,streetRow+1); }
    if(key==='harmonised'){ dzSpread=1; document.body.style.background="#3a2a6a"; }
    if(key==='hands'){ dzHands=true; }
    if(key==='kick'){ dzKick=true; stage.style.transform="rotate("+(Math.sin(dzT*0.35)*1.2).toFixed(2)+"deg)"; }
    if(key==='tap'){ dzTap=true; stage.style.transform="translateY("+((dzT%8)<2?6:0)+"px)"; if(dzT%8===0) dzText("tap",cx,streetRow-6,'dztext',6); }
    if(key==='shrink1'){ stage.style.transform=""; dzShrink=1+2*Math.min(1,f/0.7); }
    if(key==='shrink2'){ dzShrink=3+5*Math.min(1,f/0.7); }
    if(key==='globe'){ dzShrink=8+2*Math.min(1,f/0.5); dzGlobe=true; }
    if(key==='rm1') dzRm=0.33*f;
    if(key==='rm2') dzRm=0.33+0.33*f;
    if(key==='rm3') dzRm=0.66+0.34*f;
    if(key==='panic'){ dzPanic=true; document.body.style.background="#000000"; stage.style.transform=""; }

    dzStepFx();
    dzRender(beat,f);
    sub.textContent=beat.log; sub.style.color=dzLogMode(beat.log)==='dzlogerr'?"#ff4040":"#7fff7f"; sub.style.textShadow="0 0 8px #1a4a1a";
    dzT++;
    if(dzT>=dur){ cur.n=undefined; dzT=0; dzIdx++; if(dzIdx>=DZ_BEATS.length){ phase='dz_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='dz_hold'){
    stage.style.transform="";
    dzBoatX+=0.35; if(dzBoatX>COLS) dzBoatX=-16;
    dzStepFx(); dzT++;
    dzRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=DZ_HOLD; sub.style.color="#7fff7f"; sub.style.textShadow="0 0 8px #1a4a1a";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m91_start(){
  attackMode='dz_run';
  cmd.style.color="#7fff7f"; cmd.style.textShadow="0 0 20px #3a6aff";
  dzStarted=false; phase='dz_run';
}

function __m91_reset(){
  dzStarted=false; dzT=0; dzIdx=0; dzG=null; dzParts=[]; dzTexts=[]; dzBoatX=0; dzSpread=0; dzFire=null; dzPlanes=false;
  dzBattery=-1; dzLastSing=false; dzHands=false; dzKick=false; dzTap=false; dzShrink=1; dzGlobe=false; dzRm=0; dzPanic=false; dzLog=[];
  stage.style.transform="";
}

registerMethod(91, { start: __m91_start, resetFn: __m91_reset, loopFn: __m91_loop, phaseNames: ['dz_run','dz_hold'] });
