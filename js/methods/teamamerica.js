let tmStarted=false, tmT=0, tmIdx=0, tmG=null, tmMG=null, tmHeroes=[], tmJet=null, tmParts=[], tmTexts=[], tmShake=0;
let tmBlown={}, tmMan=null, tmGran=null, tmDucks=[], tmRocket=null, tmEagle=false, tmCrater=false;

// ---- TEAM AMERICA ----
// three marionette heroes on visible strings, dropped from a flag-towing jet. Every landmark
// is stamped into the city with its own name, and each one is "liberated" in turn: cleared,
// a fireball, a shake, and (for the rockets) a slow-motion high five and a guitar riff
const TM_BEATS=[
  {key:'tip',       cap:"IT BEGINS WITH A TIP-OFF. SOMEWHERE IN THE CITY, SOMEONE MIGHT BE UP TO SOMETHING."},
  {key:'enough',    cap:"NOBODY'S SURE WHAT. THAT'S MORE THAN ENOUGH."},
  {key:'jet',       cap:"THE SKY SPLITS OPEN, AND A JET SCREAMS OVERHEAD, TRAILING A FLAG THE SIZE OF A FOOTBALL PITCH."},
  {key:'drop',      cap:"OUT DROP THE HEROES: SQUARE-JAWED, PERFECTLY COIFFED, AND VERY OBVIOUSLY PUPPETS."},
  {key:'strings',   cap:"THEIR STRINGS GLINT IN THE SUNLIGHT. NOBODY MENTIONS IT."},
  {key:'square',    cap:"THEY LAND IN THE TOWN SQUARE, AND IMMEDIATELY BLOW UP THE TOWN SQUARE."},
  {key:'clear',     cap:"\"CLEAR!\" SHOUTS THE LEADER, AS THE FOUNTAIN RAINS DOWN IN PIECES.", say:"CLEAR!"},
  {key:'sprint',    cap:"THEY SPRINT THROUGH THE STREETS, DIVING AND ROLLING FOR NO REASON AT ALL."},
  {key:'man',       cap:"A MAN ASKS FOR DIRECTIONS. HE IS TACKLED."},
  {key:'cafe',      cap:"A CAFE IS DECLARED A THREAT, ON ACCOUNT OF LOOKING SLIGHTLY FOREIGN. THE CAFE IS NO MORE."},
  {key:'croissant', cap:"THE CROISSANTS ARE LIBERATED."},
  {key:'gran',      cap:"THE SUSPICIOUS PERSON TURNS OUT TO BE A PENSIONER FEEDING DUCKS."},
  {key:'ducks',     cap:"THE DUCKS ARE ALSO SUSPICIOUS. EVERYTHING IS."},
  {key:'museum',    cap:"SOMEONE ACCIDENTALLY FIRES A ROCKET AT THE MUSEUM.", target:'museum'},
  {key:'library',   cap:"THEN THE LIBRARY.", target:'library'},
  {key:'cathedral', cap:"THEN THE CATHEDRAL. EACH ONE FOLLOWED BY A SLOW-MOTION HIGH FIVE, AND A GUITAR RIFF FROM NOWHERE.", target:'cathedral'},
  {key:'mayor',     cap:"THE MAYOR BEGS THEM TO STOP.", mayor:"PLEASE STOP!"},
  {key:'salute',    cap:"THEY SALUTE HIM, THANK HIM FOR HIS SERVICE, AND BLOW UP THE MAYOR'S OFFICE TO KEEP HIM SAFE.", say:"THANK YOU FOR YOUR SERVICE!"},
  {key:'speech',    cap:"A HEARTFELT SPEECH IS GIVEN ON THE RUBBLE OF WHAT WAS ONCE THE SHOPPING CENTRE.", say:"FREEDOM..."},
  {key:'eleven',    cap:"IT'S ABOUT FREEDOM. IT'S ABOUT COURAGE. IT GOES ON FOR ELEVEN MINUTES.", say:"...AND ANOTHER THING ABOUT FREEDOM..."},
  {key:'eagle',     cap:"SOMEWHERE, A BALD EAGLE SHEDS A SINGLE TEAR."},
  {key:'sunset',    cap:"BY SUNSET THE CITY IS A SMOKING CRATER. THE HEROES STAND ON THE EDGE, HAIR PERFECTLY UNTOUCHED."},
  {key:'saved',     cap:"\"ANOTHER CITY SAVED,\" SAYS THE LEADER.", say:"ANOTHER CITY SAVED."},
  {key:'rumble',    cap:"A DISTANT RUMBLE. THEIR JET IS CIRCLING BACK FOR THE NEXT ONE."}
];
const TM_HOLD="THE WORLD IS NOW COMPLETELY SAFE. THERE IS NOTHING LEFT TO THREATEN IT. — press RESET";

const tmHeroArts=[[" @ ","[#]","/ \\"],[" @ ","\\#/"," ^ "]];
const tmRollArt=["   ","(@)","   "];
const tmJetArt=["   __|\\  ","=<[_____]>"];
const tmLandmarks={
  cafe:{art:[" _____ ","|CAFE |","|o  o |","|_____|"]},
  square:{art:["  ~  ","\\___/","  |  "]},
  museum:{art:["  ___  "," /   \\ ","/MUSEUM\\","|| | ||","||_|_||"]},
  library:{art:[" _______ ","|LIBRARY|","|=|=|=|=|","|_______|"]},
  cathedral:{art:["   +   ","  /^\\  "," /   \\ ","|  o  |","|_|^|_|"]},
  mayor:{art:[" _____ ","|MAYOR|","|[] []|","|_____|"]},
  mall:{art:[" ________ ","| SHOPS  |","|[]    []|","|________|"]}
};

function tmDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function tmPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function tmText(s,x,y,mode,life){ tmTexts.push({s,x,y,mode:mode||'tmtext',life:life||20}); }
function tmBubble(grid,mg,x,top,text){ const len=text.length+4; mtDrawBubble(grid,mg,Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(x))),top,text); }
function tmColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function tmClear(c0,c1){ for(let r=0;r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){ setCh(cityGridArr,r,c," "); tmMG[r][c]=null; } }

function tmBoom(c0,c1,big){
  // a landmark (or whatever's there) is liberated
  const mid=(c0+c1)/2;
  for(let c=c0;c<=c1;c++) for(let r=0;r<streetRow;r++){ if(c<0||c>=COLS) continue; const ch=cityGridArr[r][c]; if(ch===" ") continue; if(Math.random()<0.15) tmParts.push({x:c,y:r,vx:(Math.random()-0.5)*1.6,vy:-0.4-Math.random()*0.6,g:0.06,ch,mode:'rubble',life:30}); }
  tmClear(c0,c1);
  for(let k=0;k<(big?40:24);k++){ const a=Math.random()*Math.PI; tmParts.push({x:mid,y:streetRow-2,vx:Math.cos(a)*(1+Math.random()),vy:-Math.sin(a)*(0.6+Math.random()*0.8),g:0.04,ch:"*#@%"[(Math.random()*4)|0],mode:'fire',life:22}); }
  tmText(big?"KA-BOOOM":"BOOM",mid,streetRow-10,'tmboom',22);
  tmShake=big?9:6;
  flash.style.transition="opacity 0.03s"; flash.style.opacity=0.35; setTimeout(()=>{ flash.style.transition="opacity 0.5s"; flash.style.opacity=0; },60);
}

function tmInit(){
  tmStarted=true; tmT=0; tmIdx=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  tmMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const at=f=>Math.round(COLS*f);
  const pos={cafe:0.12, square:0.3, museum:0.44, library:0.55, cathedral:0.66, mayor:0.78, mall:0.9};
  tmG={pond:at(0.21)};
  for(const k in pos){
    const L=tmLandmarks[k], w=L.art[0].length, x=Math.max(1,Math.min(COLS-w-1,at(pos[k])-Math.floor(w/2)));
    tmClear(x-2,x+w+1); const top=streetRow-L.art.length;
    for(let i=0;i<L.art.length;i++) for(let j=0;j<w;j++){ const ch=L.art[i][j]; if(ch!==" "){ setCh(cityGridArr,top+i,x+j,ch); tmMG[top+i][x+j]='tm'+k; } }
    tmG[k]={x,w,c:x+Math.floor(w/2)};
  }
  tmClear(tmG.pond-3,tmG.pond+4);
  tmHeroes=[0,1,2].map(i=>({x:tmG.square.c-4+i*4, y:-6, pose:0, roll:false}));
  tmJet=null; tmParts=[]; tmTexts=[]; tmShake=0; tmBlown={}; tmMan=null; tmGran=null; tmDucks=[]; tmRocket=null; tmEagle=false; tmCrater=false;
  document.body.style.background="#0a0e1c";
}

function tmRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!tmMG||tmMG.length!==ROWS||tmMG[0].length!==COLS) tmMG=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const g=tmG, key=beat?beat.key:'hold';
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<streetRow;r++){ const mr=tmMG[r]; for(let c=0;c<COLS;c++) if(mr[c] && grid[r][c]!==" ") mg[r][c]=mr[c]; }
  if(tmCrater){ for(let c=2;c<COLS-2;c++){ setCh(grid,streetRow,c," "); setCh(grid,streetRow+1,c,c<4||c>COLS-5?"\\":"_"); setMode(mg,streetRow+1,c,'rubble'); } }
  // the duck pond, the pensioner, the ducks
  if(!tmCrater){ for(let c=g.pond-3;c<=g.pond+3;c++){ setCh(grid,streetRow,c,"~"); setMode(mg,streetRow,c,'water'); } }
  if(tmGran) tmPlace(grid,mg,[" o ","/|\\","/_\\"],tmGran.x,streetRow-3,'tmgran');
  for(const D of tmDucks) tmPlace(grid,mg,[D.fly?"v":"(.>"],D.x,D.y,'tmduck');
  if(tmMan) tmPlace(grid,mg,tmMan.down?["   ","   ","o__"]:[" o ","/|\\","/ \\"],tmMan.x,streetRow-3,'body');
  // the jet and its flag
  if(tmJet){
    tmPlace(grid,mg,tmJetArt,tmJet.x,tmJet.y,'tmjet');
    const fw=Math.min(24,Math.round(COLS*0.18)), fl=Math.round(tmJet.x)-fw-1;
    for(let i=0;i<5;i++) for(let j=0;j<fw;j++){ const c=fl+j, r=Math.round(tmJet.y)+i-1; if(c<0||c>=COLS||r<0) continue; const canton=i<3&&j<Math.round(fw*0.4); setCh(grid,r,c,canton?((i+j)%2?"*":" "):"="); setMode(mg,r,c,canton?'tmstar':(i%2?'tmwhite':'tmred')); }
  }
  // the heroes, on their strings
  if(!['tip','enough','jet'].includes(key)) for(const H of tmHeroes){
    const art=H.roll?tmRollArt:tmHeroArts[H.pose], x=Math.round(H.x), y=Math.round(H.y);
    for(let r=0;r<y;r++){ setCh(grid,r,x+1,(r+tmT)%9===0?"*":"|"); setMode(mg,r,x+1,'tmstring'); }
    tmPlace(grid,mg,art,x,y,'tmhero');
  }
  if(tmRocket) tmPlace(grid,mg,[tmRocket.vx>0?"=>":"<="],tmRocket.x,tmRocket.y,'tmrocket');
  if(tmEagle) tmPlace(grid,mg,[" __ ","(o >","/||\\"],Math.max(0,COLS-10),3,'tmeagle');
  if(tmEagle && (tmT%20)<14) tmPlace(grid,mg,["."],Math.max(0,COLS-8),5+((tmT%20)>>2),'tmtear');
  for(const p of tmParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of tmTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  const lead=tmHeroes[0];
  if(beat && beat.say && f<0.92 && lead.y>0) tmBubble(grid,mg,lead.x+1,Math.round(lead.y),beat.say);
  if(beat && beat.mayor && f<0.92 && !tmBlown.mayor) tmBubble(grid,mg,g.mayor.c,streetRow-5,beat.mayor);
  scene.innerHTML=paint(grid,mg,'city');
}
function tmStepFx(){
  for(const p of tmParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx*=0.5; p.vy=0; } }
  tmParts=tmParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<ROWS);
  for(const t of tmTexts){ t.life--; if(t.life%3===0) t.y--; }
  tmTexts=tmTexts.filter(t=>t.life>0);
}
function tmWalk(to,speed){ tmHeroes.forEach((H,i)=>{ const tx=to-4+i*4; H.x+=Math.sign(tx-H.x)*Math.min(Math.abs(tx-H.x),speed); }); }

function __m93_loop(){
  if(phase==='tm_run'){
    if(!tmStarted) tmInit();
    const beat=TM_BEATS[tmIdx], dur=tmDur(beat.cap), f=tmT/Math.max(1,dur-1), key=beat.key, g=tmG;
    for(const H of tmHeroes){ if(H.y>=streetRow-3){ H.pose=(tmT>>3)%2; } }

    if(key==='tip' && tmT%14===4) tmText("?",(Math.random()*COLS)|0,streetRow*0.4,'tmtext',14);
    if(key==='jet'){ if(!tmJet) tmJet={x:-10,y:3}; tmJet.x+=Math.max(1.2,(COLS*0.6)/(dur*0.8)); if(tmT%10===0) tmText("NYEEEOWWW",tmJet.x,1,'tmtext',10); }
    if(key==='drop'||key==='strings'){
      if(tmJet){ tmJet.x+=1.5; if(tmJet.x>COLS+30) tmJet=null; }
      for(const H of tmHeroes) H.y=Math.min(streetRow-3,H.y+0.35);
      if(key==='strings' && tmT%10===0) tmText("*glint*",tmHeroes[(tmT/10|0)%3].x+1,4,'tmstar',10);
    }
    if(key==='square'){ for(const H of tmHeroes) H.y=streetRow-3; if(tmT===Math.round(dur*0.5) && !tmBlown.square){ tmBlown.square=true; tmBoom(g.square.x-1,g.square.x+g.square.w); } }
    if(key==='clear'){ if(tmT%2===0) tmParts.push({x:g.square.c+(Math.random()-0.5)*6,y:2,vx:(Math.random()-0.5)*0.4,vy:0.3,g:0.04,ch:Math.random()<0.5?"~":"#",mode:Math.random()<0.5?'water':'rubble',life:30}); }
    if(key==='sprint'){ const to=g.square.c+Math.round(Math.sin(f*Math.PI*2)*COLS*0.15); tmWalk(to,1.2); tmHeroes.forEach((H,i)=>H.roll=((tmT>>2)+i)%3===0); if(tmT%12===0) tmText("*dive*",tmHeroes[1].x+1,streetRow-5,'tmtext',10); }
    if(key==='man'){
      tmHeroes.forEach(H=>H.roll=false);
      if(!tmMan) tmMan={x:g.cafe.x+g.cafe.w+3, down:false};
      if(f<0.4 && tmT%14===2) tmText("excuse me, which way to--",tmMan.x+1,streetRow-5,'tmtext',14);
      tmWalk(tmMan.x+4,1); if(f>0.55 && !tmMan.down){ tmMan.down=true; tmText("HUT!",tmMan.x+1,streetRow-6,'tmboom',18); tmShake=2; }
    }
    if(key==='cafe'){ tmWalk(g.cafe.c+10,0.8); if(f<0.5 && tmT%12===2) tmText("SUSPICIOUSLY FOREIGN",g.cafe.c,streetRow-8,'tmred',12); if(f>0.5 && !tmBlown.cafe){ tmBlown.cafe=true; tmBoom(g.cafe.x-1,g.cafe.x+g.cafe.w); } }
    if(key==='croissant'){ if(tmT%3===0) tmParts.push({x:g.cafe.c,y:streetRow-6,vx:(Math.random()-0.5)*1.4,vy:-0.6,g:0.05,ch:"(",mode:'tmcroissant',life:30}); if(tmT===Math.round(dur*0.4)) tmText("FREEDOM CROISSANTS",g.cafe.c,streetRow-9,'tmwhite',24); }
    if(key==='gran'){ if(!tmGran){ tmGran={x:g.pond-6}; tmDucks=[0,1,2].map(k=>({x:g.pond-2+k*2,y:streetRow-1,fly:false})); } tmWalk(g.pond+8,0.8); if(tmT%8===0) tmParts.push({x:tmGran.x+3,y:streetRow-2,vx:0.4,vy:-0.1,g:0.05,ch:".",mode:'tmtext',life:10}); }
    if(key==='ducks'){ if(tmT%10===0) tmText(["QUACK?","SUSPICIOUS","FREEZE, DUCK"][(tmT/10|0)%3],g.pond,streetRow-6,'tmtext',12); if(f>0.6) tmDucks.forEach(D=>{ D.fly=true; D.y-=0.3; D.x+=0.4; }); }
    if(beat.target){
      // a rocket, then the landmark goes, then the high five and the riff
      const L=g[beat.target];
      if(tmT===0){ tmDucks=[]; tmGran=null; tmMan=null; const H=tmHeroes[1]; tmRocket={x:H.x+3,y:streetRow-2,vx:Math.sign(L.c-H.x)||1}; }
      if(tmRocket){ tmRocket.x+=tmRocket.vx*Math.max(1.5,Math.abs(L.c-tmRocket.x)/8); if(Math.abs(tmRocket.x-L.c)<2){ tmRocket=null; if(!tmBlown[beat.target]){ tmBlown[beat.target]=true; tmBoom(L.x-1,L.x+L.w,beat.target==='cathedral'); } } }
      if(!tmRocket && tmBlown[beat.target]){
        if(tmT%30===10) tmText("*HIGH FIVE*",tmHeroes[0].x+3,streetRow-6,'tmwhite',24);
        if(tmT%30===12) tmText("\u266a DUH-DUH-DUHHHN \u266b",tmHeroes[0].x+3,streetRow-9,'tmriff',22);
      }
      tmWalk(Math.max(8,L.c-14),0.8);
    }
    if(key==='mayor'){ tmWalk(g.mayor.c-12,0.8); }
    if(key==='salute'){ if(tmT%20===2) tmText("*salute*",tmHeroes[0].x+1,streetRow-6,'tmwhite',12); if(f>0.65 && !tmBlown.mayor){ tmBlown.mayor=true; tmBoom(g.mayor.x-1,g.mayor.x+g.mayor.w); } }
    if(key==='speech'){ if(!tmBlown.mall){ tmBlown.mall=true; tmBoom(g.mall.x-1,g.mall.x+g.mall.w); } tmWalk(g.mall.c,1); }
    if(key==='eleven'){ if(tmT%16===0) tmText(["...COURAGE...","...FREEDOM...","*sniff*","...FREEDOM..."][(tmT/16|0)%4],tmHeroes[0].x+2,streetRow-9,'tmtext',14); }
    if(key==='eagle') tmEagle=true;
    if(key==='sunset'){
      tmEagle=false;
      if(!tmCrater){
        // everything that's left goes, all at once
        tmCrater=true;
        for(let c=0;c<COLS;c+=6) tmBoom(c,Math.min(COLS-1,c+5),false);
        tmTexts=tmTexts.slice(-3); tmShake=12;
      }
      document.body.style.background="rgb("+[10,14,28].map((v,i)=>Math.round(v+([70,20,10][i]-v)*Math.min(1,f*1.4))).join(",")+")";
      tmHeroes.forEach((H,i)=>{ H.x+=((2+i*4)-H.x)*0.1; });
      if(tmT%3===0) tmParts.push({x:Math.random()*COLS,y:streetRow-1,vx:0.1,vy:-0.2,g:0,ch:"~",mode:'tmsmoke',life:40});
    }
    if(key==='saved'||key==='rumble'){ if(tmT%3===0) tmParts.push({x:Math.random()*COLS,y:streetRow-1,vx:0.1,vy:-0.2,g:0,ch:"~",mode:'tmsmoke',life:40}); }
    if(key==='rumble'){ if(!tmJet) tmJet={x:COLS+30,y:2}; tmJet.x-=0.5; tmJet.y=2; if(tmT%14===0) tmText("rumble",COLS-12,1,'tmtext',12); }

    if(tmShake>0.3){ stage.style.transform="translate("+((Math.random()-0.5)*2*tmShake).toFixed(1)+"px,"+((Math.random()-0.5)*2*tmShake).toFixed(1)+"px)"; tmShake*=0.88; }
    else { stage.style.transform=""; tmShake=0; }
    tmStepFx();
    tmRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffffff"; sub.style.textShadow="0 0 8px #c02020";
    tmT++;
    if(tmT>=dur){ tmT=0; tmIdx++; if(tmIdx>=TM_BEATS.length){ phase='tm_hold'; tmJet=null; } }
    timer=setTimeout(loop,80);
  }else if(phase==='tm_hold'){
    stage.style.transform="";
    if(tmT%4===0) tmParts.push({x:Math.random()*COLS,y:streetRow-1,vx:0.1,vy:-0.2,g:0,ch:"~",mode:'tmsmoke',life:40});
    tmStepFx(); tmT++;
    tmRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=TM_HOLD; sub.style.color="#ffffff"; sub.style.textShadow="0 0 8px #c02020";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m93_start(){
  attackMode='tm_run';
  cmd.style.color="#ffffff"; cmd.style.textShadow="0 0 20px #c02020";
  tmStarted=false; phase='tm_run';
}

function __m93_reset(){
  tmStarted=false; tmT=0; tmIdx=0; tmG=null; tmMG=null; tmHeroes=[]; tmJet=null; tmParts=[]; tmTexts=[]; tmShake=0;
  tmBlown={}; tmMan=null; tmGran=null; tmDucks=[]; tmRocket=null; tmEagle=false; tmCrater=false;
  stage.style.transform="";
}

registerMethod(93, { start: __m93_start, resetFn: __m93_reset, loopFn: __m93_loop, phaseNames: ['tm_run','tm_hold'] });
