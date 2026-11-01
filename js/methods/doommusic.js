let dmStarted=false, dmT=0, dmIdx=0, dmG=null, dmBeatP=8, dmBeatN=0, dmBang=0, dmParts=[], dmTexts=[], dmCrowd=[], dmDemons=[], dmBeast=null;
let dmDropped=false, dmCrack=false, dmCathedral=true, dmMoon=null, dmSilent=false, dmGrin=false, dmEnds=0, dmShake=0, dmRed=0, dmPit=null, dmGran=null;

// ---- DOOM MUSIC ----
// everything runs off one beat clock (dmBeatP frames per beat, faster once the double kicks
// come in). The street headbangs on the beat, the buildings shed a storey on each breakdown,
// demons mosh with the crowd, and the stage itself slams on every snare by the final chorus
const DM_BEATS=[
  {key:'note',      cap:"IT STARTS WITH A SINGLE LOW NOTE, SOMEWHERE UNDERGROUND."},
  {key:'tube',      cap:"AT FIRST PEOPLE THINK IT'S THE TUBE. THEN THE PAVEMENT STARTS TO VIBRATE."},
  {key:'headbang',  cap:"THEN THE PAVEMENT STARTS TO HEADBANG."},
  {key:'riff',      cap:"A RIFF ERUPTS FROM EVERY SPEAKER IN THE CITY AT ONCE: PHONES, CAR RADIOS, SMART FRIDGES, A CHILD'S BIRTHDAY CARD."},
  {key:'knob',      cap:"THE VOLUME KNOB HAS BEEN REMOVED. THERE IS NO OFF SWITCH. THERE NEVER WAS."},
  {key:'drop',      cap:"THE BASS DROPS. SO DOES THE HIGH STREET, THREE FEET STRAIGHT DOWN."},
  {key:'kicks',     cap:"DOUBLE KICK DRUMS KICK IN AT A TEMPO THAT SHOULD NOT BE POSSIBLE. PACEMAKERS QUIETLY SWITCH TO THE BEAT."},
  {key:'bells',     cap:"CHURCH BELLS START PLAYING IN DROP TUNING."},
  {key:'quartet',   cap:"A STRING QUARTET IN THE PARK LOOKS AT EACH OTHER, NODS ONCE, AND PICKS UP CHAINSAWS."},
  {key:'demons',    cap:"THE GROUND CRACKS OPEN, AND THE DEMONS CLIMB OUT, DRAWN BY THE NOISE LIKE MOTHS TO A LAMP."},
  {key:'mosh',      cap:"THEY LOOK AROUND, READY TO BRING HELL TO THE CITY... AND IMMEDIATELY START MOSHING INSTEAD."},
  {key:'surf',      cap:"A HORNED BEAST THE SIZE OF A BUS CROWD-SURFS DOWN THE HIGH STREET. NOBODY DROPS HIM."},
  {key:'ties',      cap:"OFFICE WORKERS RIP OFF THEIR TIES. A PENSIONER RIPS AND TEARS THROUGH A SKIP OF OLD FURNITURE, PURELY FOR THE VIBES."},
  {key:'wall',      cap:"ACCOUNTANTS FORM A WALL OF DEATH IN THE CAR PARK."},
  {key:'heavier',   cap:"THE RIFF GETS HEAVIER. EACH BREAKDOWN KNOCKS ANOTHER STOREY OFF THE SKYLINE."},
  {key:'cathedral', cap:"THE CATHEDRAL COMES DOWN PERFECTLY IN TIME, ON THE ONE."},
  {key:'solo',      cap:"A GUITAR SOLO BEGINS. IT DOES NOT END. THE SKY TURNS RED TO MATCH."},
  {key:'planet',    cap:"BY THE FINAL CHORUS THE PLANET ITSELF IS HEADBANGING. THE MOON STAGE-DIVES INTO THE PACIFIC."},
  {key:'stop',      cap:"THEN, AT THE VERY PEAK, THE MUSIC STOPS."},
  {key:'silence',   cap:"TOTAL SILENCE."},
  {key:'grin',      cap:"EVERYONE, HUMAN AND DEMON ALIKE, STANDS IN THE RUBBLE, BREATHING HARD, EARS RINGING, SLOWLY GRINNING."},
  {key:'again',     cap:"THEN SOMEONE AT THE BACK YELLS \"AGAIN!\""},
  {key:'twice',     cap:"AND THE WORLD ENDS TWICE."}
];
const DM_HOLD="AND THE WORLD ENDS TWICE. — press RESET";
const dmImpArts=[["^ ^","(o)","/#\\"],["^ ^","(O)","\\#/"]];
const dmBeastArt=["\\^         ^/"," (  O   O  ) ","/|=========|\\"," \\_________/ "];
const dmCathArt=["   +   ","  /^\\  "," /   \\ ","|  o  |","| | | |","|_|^|_|"];

function dmDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function dmPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function dmText(s,x,y,mode,life){ dmTexts.push({s,x,y,mode:mode||'dmtext',life:life||16}); }
function dmBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function dmColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function dmShiftDown(n){ for(let k=0;k<n;k++){ for(let r=streetRow-1;r>0;r--) cityGridArr[r]=cityGridArr[r-1]; cityGridArr[0]=" ".repeat(COLS); } }
function dmStorey(n){
  // a breakdown: every building loses its top few rows, in time
  for(let c=0;c<COLS;c++){ if(Math.abs(c-dmG.cath-3)<=4 && dmCathedral) continue; for(let k=0;k<n;k++){ const t=dmColTop(c); if(t>=streetRow) break; if(Math.random()<0.25) dmParts.push({x:c,y:t,vx:(Math.random()-0.5)*1.2,vy:-0.3,g:0.06,ch:cityGridArr[t][c],mode:'rubble',life:24}); setCh(cityGridArr,t,c," "); } }
}

function dmInit(){
  dmStarted=true; dmT=0; dmIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const at=f=>Math.round(COLS*f);
  dmG={cath:at(0.7), park:at(0.12), pit:at(0.42)};
  for(let r=0;r<streetRow;r++) for(let c=dmG.cath-2;c<=dmG.cath+8;c++) setCh(cityGridArr,r,c," ");
  for(let r=0;r<streetRow;r++) for(let c=dmG.park-2;c<=dmG.park+10;c++) setCh(cityGridArr,r,c," ");
  const top=streetRow-dmCathArt.length;
  for(let i=0;i<dmCathArt.length;i++) for(let j=0;j<dmCathArt[i].length;j++){ const ch=dmCathArt[i][j]; if(ch!==" ") setCh(cityGridArr,top+i,dmG.cath+j,ch); }
  dmBeatP=8; dmBeatN=0; dmBang=0; dmParts=[]; dmTexts=[]; dmDemons=[]; dmBeast=null;
  dmCrowd=[]; for(let c=2;c<COLS-3;c+=Math.max(3,Math.round(COLS/40))) if(Math.abs(c-dmG.park-4)>7) dmCrowd.push({x:c, ph:(c*7)%2, tie:true, kind:'person'});
  dmDropped=false; dmCrack=false; dmCathedral=true; dmMoon={x:at(0.78), y:Math.max(5,Math.round(streetRow*0.12))}; dmSilent=false; dmGrin=false; dmEnds=0; dmShake=0; dmRed=0; dmPit=null; dmGran=null;
  document.body.style.background="#0a0a12";
}

function dmRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const g=dmG, key=beat?beat.key:'hold', live=!dmSilent && !['note','tube'].includes(key);
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  if(dmMoon) dmPlace(grid,mg,["(  )"],dmMoon.x,dmMoon.y,'dmmoon');
  if(dmCathedral) for(let i=0;i<dmCathArt.length;i++) for(let j=0;j<dmCathArt[i].length;j++){ const r=streetRow-dmCathArt.length+i, c=g.cath+j; if(grid[r]&&grid[r][c]!==" ") setMode(mg,r,c,'dmcath'); }
  // the low note, pulsing through the underground
  if(['note','tube','headbang'].includes(key)) for(let c=0;c<COLS;c++){ const r=streetRow+2+((c+dmT)>>3)%3; if(grid[r]&&(c+dmT)%6<2){ setCh(grid,r,c,"~"); setMode(mg,r,c,'dmlow'); } }
  // the crack in the street the demons climb out of
  if(dmCrack) for(let c=g.pit-8;c<=g.pit+8;c++){ setCh(grid,streetRow,c,c%2?"/":"\\"); setMode(mg,streetRow,c,'dmlava'); }
  // the string quartet in the park, then the chainsaws
  const sawing=DM_BEATS.findIndex(b=>b.key==='quartet')<dmIdx || (key==='quartet'&&f>0.5) || !beat;
  for(let k=0;k<4;k++) dmPlace(grid,mg,[" o ",sawing?"[#=":"/|)"," ^ "],g.park+k*3-1,streetRow-3,sawing?'dmsaw':'body');
  // the crowd: heads bang on the beat; ties come off; grins at the end
  for(const P of dmCrowd){
    const down=live && ((dmBeatN+P.ph)%2===0);
    const head=dmGrin?"^":(down?"o":"O"), y=streetRow-3+(down?1:0);
    dmPlace(grid,mg,[" "+head+" ",P.tie&&!down?"/V\\":"/|\\"],P.x,y,P.tie?'dmoffice':'body');
  }
  // the wall of death: accountants running in a ring in the car park
  if(dmPit){ for(let k=0;k<8;k++){ const a=dmT*0.25+k*Math.PI/4, c=Math.round(g.pit+Math.cos(a)*9), r=streetRow-2+Math.round(Math.sin(a)*1); dmPlace(grid,mg,["o"],c,r,'dmoffice'); } }
  // demons moshing, the beast on top of the crowd
  for(const D of dmDemons) dmPlace(grid,mg,dmImpArts[(dmBeatN+D.ph)%2],D.x,streetRow-4-(live&&(dmBeatN+D.ph)%2?1:0),'dmimp');
  if(dmBeast){ dmPlace(grid,mg,dmBeastArt,dmBeast.x,streetRow-8-(live&&dmBeatN%2?1:0),'dmimp'); for(let k=0;k<4;k++) dmPlace(grid,mg,["\\o/"],dmBeast.x+k*3,streetRow-4,'body'); }
  if(dmGran) dmPlace(grid,mg,[" o ","/%\\","[_____]"].map(s=>s),dmGran.x,streetRow-3,'dmgran');
  for(const p of dmParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of dmTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  if(key==='knob') dmPlace(grid,mg,["VOL [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588] ( knob removed )"],2,Math.max(5,Math.round(streetRow*0.15)),'dmvol');
  if(key==='again' && f<0.92) dmBubble(grid,mg,COLS-8,streetRow-3,"AGAIN!");
  scene.innerHTML=paint(grid,mg,'city');
}
function dmStepFx(){
  for(const p of dmParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx*=0.5; p.vy=0; } }
  dmParts=dmParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of dmTexts){ t.life--; if(t.life%3===0) t.y--; }
  dmTexts=dmTexts.filter(t=>t.life>0);
}
function dmNote(x,y,mode){ dmParts.push({x,y,vx:(Math.random()-0.5)*0.4,vy:-0.3,g:0,ch:Math.random()<0.5?"\u266a":"\u266b",mode:mode||'dmnote',life:18}); }
function dmFlash(a){ flash.style.transition="opacity 0.03s"; flash.style.opacity=a; setTimeout(()=>{ flash.style.transition="opacity 0.5s"; flash.style.opacity=0; },60); }

function __m96_loop(){
  if(phase==='dm_run'){
    if(!dmStarted) dmInit();
    const beat=DM_BEATS[dmIdx], dur=dmDur(beat.cap), f=dmT/Math.max(1,dur-1), key=beat.key, g=dmG;
    const music=!dmSilent && !['note','tube'].includes(key);
    const onBeat=dmT%dmBeatP===0; if(onBeat && (music||key==='tube')) dmBeatN++;
    let bang=0;

    if(key==='note'){ if(dmT%16===0) dmText("hmmmmmmm",cx,streetRow+1,'dmlow',14); }
    if(key==='tube'){ dmShake=1; }
    if(key==='headbang'){ bang=onBeat?2:0; }
    if(key==='riff'){
      bang=onBeat?3:0;
      if(dmT%2===0) dmNote(Math.random()*COLS,Math.random()*streetRow);
      if(dmT%10===0) dmText(["[PHONE]","[CAR RADIO]","[SMART FRIDGE]","[BIRTHDAY CARD]"][(dmT/10|0)%4],Math.random()*COLS,streetRow-6,'dmvol',12);
    }
    if(key==='knob'){ bang=onBeat?3:0; if(dmT%2===0) dmNote(Math.random()*COLS,Math.random()*streetRow); }
    if(key==='drop'){ bang=onBeat?3:0; if(!dmDropped && dmT===Math.round(dur*0.3)){ dmDropped=true; dmShiftDown(3); dmText("BWOOOOM",cx,streetRow-8,'dmbig',24); dmShake=10; dmFlash(0.3); } }
    if(key==='kicks'){ dmBeatP=3; bang=onBeat?3:0; if(dmT%6===0) dmText("\u2665",Math.random()*COLS,streetRow-5,'dmheart',8); if(dmT%12===0) dmText("DUGDUGDUGDUG",cx,streetRow-10,'dmtext',8); }
    if(key==='bells'){ bang=onBeat?3:0; if(dmT%8===0) dmText("DONNNNG (drop D)",g.cath+3,streetRow-dmCathArt.length-2,'dmtext',12); }
    if(key==='quartet'){ bang=onBeat?3:0; if(f>0.5 && dmT%6===0) dmText("VRRRM",g.park+5,streetRow-6,'dmsaw',8); }
    if(key==='demons'){
      bang=onBeat?3:0; dmCrack=true; dmShake=Math.max(dmShake,2);
      if(dmT%5===0 && dmDemons.length<Math.max(6,Math.round(COLS/16))) dmDemons.push({x:g.pit-6+Math.random()*12, ph:dmDemons.length%2, vx:(Math.random()<0.5?-1:1)*0.4});
      document.body.style.background="#1a0808";
    }
    for(const D of dmDemons){ D.x+=D.vx; if(D.x<1||D.x>COLS-4) D.vx=-D.vx; }
    if(key==='mosh'){ bang=onBeat?3:0; if(dmT%10===0) dmText(["MOSH","\\m/","PIT!"][(dmT/10|0)%3],dmDemons.length?dmDemons[0].x:cx,streetRow-7,'dmbig',10); }
    if(key==='surf'){ bang=onBeat?3:0; if(!dmBeast) dmBeast={x:-14}; dmBeast.x+=Math.max(0.6,(COLS+14)/(dur*0.9)); if(dmT%12===0) dmText("WOOOO",dmBeast.x+6,streetRow-10,'dmtext',10); }
    if(key==='ties'){
      bang=onBeat?3:0; dmBeast=null;
      dmCrowd.forEach((P,i)=>{ if(f>i/dmCrowd.length && P.tie){ P.tie=false; dmParts.push({x:P.x+1,y:streetRow-2,vx:(Math.random()-0.5)*1.4,vy:-0.8,g:0.05,ch:"V",mode:'dmoffice',life:24}); } });
      if(!dmGran) dmGran={x:Math.round(COLS*0.86)};
      if(dmT%3===0) dmParts.push({x:dmGran.x+3,y:streetRow-2,vx:(Math.random()-0.5)*1.6,vy:-0.7,g:0.06,ch:"#=|"[(Math.random()*3)|0],mode:'rubble',life:22});
      if(dmT%14===0) dmText("RIP AND TEAR",dmGran.x+3,streetRow-6,'dmbig',12);
    }
    if(key==='wall'){ bang=onBeat?3:0; dmPit=true; if(dmT%14===0) dmText("WALL OF DEATH",g.pit,streetRow-6,'dmbig',12); }
    if(key==='heavier'){ bang=onBeat?4:0; if(onBeat && dmBeatN%4===0){ dmStorey(Math.max(2,Math.round(streetRow*0.07))); dmText("BREAKDOWN",cx,4+Math.random()*3,'dmbig',10); dmShake=Math.max(dmShake,4); } }
    if(key==='cathedral'){
      bang=onBeat?4:0;
      if(dmCathedral && onBeat && dmBeatN%4===0 && f>0.3){
        dmCathedral=false; dmText("ON THE ONE",g.cath+3,streetRow-12,'dmbig',30); dmShake=10; dmFlash(0.35);
        for(let r=0;r<streetRow;r++) for(let c=g.cath-1;c<=g.cath+8;c++) if(cityGridArr[r][c]!==" "){ if(Math.random()<0.4) dmParts.push({x:c,y:r,vx:(Math.random()-0.5)*1.6,vy:-0.5,g:0.06,ch:cityGridArr[r][c],mode:'dmcath',life:30}); setCh(cityGridArr,r,c," "); }
      }
    }
    if(key==='solo'){
      bang=onBeat?4:0; dmRed=Math.min(1,f*1.3);
      document.body.style.background="rgb("+Math.round(26+54*dmRed)+",8,8)";
      for(let k=0;k<3;k++) dmNote(cx+Math.sin(dmT*0.2+k)*COLS*0.4,4+Math.random()*6,'dmsolo');
      if(dmT%12===0) dmText("WEEDLY-WEEDLY-WEEEE",cx,3,'dmsolo',10);
      if(onBeat && dmBeatN%8===0) dmStorey(1);
    }
    if(key==='planet'){
      bang=onBeat?7:0;
      if(onBeat && dmBeatN%4===0) dmStorey(2);
      if(dmMoon){ if(f>0.3){ dmMoon.y+=0.6; dmMoon.x+=0.3; } if(dmMoon.y>streetRow){ dmMoon=null; dmText("SPLASH",Math.round(COLS*0.9),streetRow-4,'dmtext',30); } }
    }
    if(key==='stop'){ if(dmT===Math.round(dur*0.5)){ dmSilent=true; dmShake=0; } else if(!dmSilent) bang=onBeat?7:0; }
    if(key==='silence'){ dmSilent=true; }
    if(key==='grin'){ dmGrin=f>0.4; if(dmT%10===0) dmText("*huff*",Math.random()*COLS,streetRow-5,'dmtext',10); }
    if(key==='twice'){
      // the world ends: once, then again
      const one=Math.round(dur*0.2), two=Math.round(dur*0.55);
      if(dmT===one||dmT===two){
        dmEnds++; dmFlash(1); dmShake=16;
        dmText(dmEnds===1?"BOOOOOM":"BOOOOOM (x2)",cx,streetRow*0.4,'dmbig',30);
        for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++) if(cityGridArr[r][c]!==" "){ if(Math.random()<0.05) dmParts.push({x:c,y:r,vx:(Math.random()-0.5)*2,vy:-0.8,g:0.05,ch:cityGridArr[r][c],mode:'rubble',life:30}); setCh(cityGridArr,r,c," "); }
        if(dmEnds===2){ dmCrowd=[]; dmDemons=[]; dmGran=null; dmPit=null; }
        dmSilent=false;
      }
      if(dmT>one && dmT<two) bang=onBeat?7:0;
      if(dmT>two) dmSilent=true;
    }

    dmBang=Math.max(bang,dmBang*0.6);
    if(dmShake>0.3||dmBang>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*dmShake).toFixed(1)+"px,"+(dmBang+(Math.random()-0.5)*2*dmShake).toFixed(1)+"px)"; dmShake*=0.88; }
    else { stage.style.transform=""; dmShake=0; }
    dmStepFx();
    dmRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #ffa020";
    dmT++;
    if(dmT>=dur){ dmT=0; dmIdx++; if(dmIdx>=DM_BEATS.length){ phase='dm_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='dm_hold'){
    stage.style.transform="";
    dmStepFx(); dmT++;
    dmRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=DM_HOLD; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #ffa020";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m96_start(){
  attackMode='dm_run';
  cmd.style.color="#ff4020"; cmd.style.textShadow="0 0 20px #ffa020";
  dmStarted=false; phase='dm_run';
}

function __m96_reset(){
  dmStarted=false; dmT=0; dmIdx=0; dmG=null; dmBeatP=8; dmBeatN=0; dmBang=0; dmParts=[]; dmTexts=[]; dmCrowd=[]; dmDemons=[]; dmBeast=null;
  dmDropped=false; dmCrack=false; dmCathedral=true; dmMoon=null; dmSilent=false; dmGrin=false; dmEnds=0; dmShake=0; dmRed=0; dmPit=null; dmGran=null;
  stage.style.transform="";
}

registerMethod(96, { start: __m96_start, resetFn: __m96_reset, loopFn: __m96_loop, phaseNames: ['dm_run','dm_hold'] });
