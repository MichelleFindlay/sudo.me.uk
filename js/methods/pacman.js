let pmStarted=false, pmT=0, pmIdx=0, pmP=0, pmDir=1, pmSpeed=1, pmScore=0, pmLanes=[], pmEaten=[];
let pmGhosts=[], pmPellet=null, pmScared=0, pmReverse=false, pmParts=[], pmTexts=[], pmDone=false, pmWaka=0;

// ---- PAC-MAN: the city, eaten in chunks ----
// the skyline is cut into horizontal lanes one Pac-Man tall; he sweeps them boustrophedon
// style, top lane first, along a single path parameter (pmP). Each lane is split into
// mouth-sized chunks that vanish whole as his mouth reaches them. The ghosts ride the same
// path a little way behind him, which is also how the power pellet lets him turn and eat them
const PM_BEATS=[
  {key:'ready',  cap:"INSERT COIN."},
  {key:'go',     cap:"WAKA WAKA."},
  {key:'go',     cap:"HE EATS THE CITY ONE CHUNK AT A TIME"},
  {key:'ghosts', cap:"THE GHOSTS GIVE CHASE: BLINKY, PINKY, INKY AND CLYDE"},
  {key:'pellet', cap:"HE EATS A POWER PELLET."},
  {key:'hunt',   cap:"THE GHOSTS ARE NOT HAVING A GOOD NIGHT"},
  {key:'finish', cap:"HE KEEPS GOING UNTIL THERE'S NOTHING LEFT"},
  {key:'clear',  cap:"LEVEL COMPLETE."}
];
const PM_HOLD="HIGH SCORE: ONE ENTIRE CITY. — press RESET";
const PM_GHOSTS=[{name:'BLINKY',mode:'pmblinky'},{name:'PINKY',mode:'pmpinky'},{name:'INKY',mode:'pminky'},{name:'CLYDE',mode:'pmclyde'}];

// right-facing frames: open, half, closed (left-facing frames are mirrored)
const pmFrames=[
  ["  ####  "," #####  ","####    "," #####  ","  ####  "],
  ["  ####  "," ###### ","######  "," ###### ","  ####  "],
  ["  ####  "," ###### ","########"," ###### ","  ####  "]
];
const pmGhostArts=[["  ###  "," #o#o# ","#######","#######","#^#^#^#"],["  ###  "," #o#o# ","#######","#######","^#^#^#^"]];
const pmEyesArt=[" o o "];

function pmDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function pmScaleArt(art,s){
  if(s<=1) return art;
  const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out;
}
function pmMirror(art){ return art.map(r=>r.split("").reverse().join("")); }
function pmPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function pmColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function pmText(s,x,y,mode,life){ pmTexts.push({s,x,y,mode:mode||'pmtext',life:life||16}); }

function pmGeom(){
  const s=pmLanes.s, w=8*s, h=5*s;
  return {s,w,h,span:COLS+2*w};
}
// where a point on the path is: which lane, which way it's heading, and its centre column
function pmAt(p){
  const G=pmGeom(), i=Math.max(0,Math.min(pmLanes.tops.length-1,Math.floor(p/G.span))), u=p-i*G.span;
  const dir=i%2===0?1:-1;
  return {i, dir, cx:dir>0?u-G.w/2:COLS-u+G.w/2, top:pmLanes.tops[i]};
}

function pmInit(){
  pmStarted=true; pmT=0; pmIdx=0; pmP=0; pmDir=1; pmScore=0; pmScared=0; pmReverse=false; pmDone=false; pmWaka=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  // lanes from the top of the tallest building down to the pavement, at least two of them
  let top=streetRow; for(let c=0;c<COLS;c++) top=Math.min(top,pmColTop(c));
  const avail=streetRow-top;
  const s=Math.max(1,Math.min(3,Math.floor(avail/10)));
  const h=5*s, n=Math.max(1,Math.ceil(avail/h));
  const tops=[]; for(let i=0;i<n;i++) tops.push(Math.min(top+i*h,streetRow-h));
  pmLanes={s,tops};
  const G=pmGeom(), cw=Math.max(2,Math.round(G.w/2));
  pmEaten=tops.map(()=>({next:0,cw}));
  // speed so the whole route fits in the beats where he's eating, with a little slack
  let frames=0; for(let i=1;i<PM_BEATS.length-1;i++) frames+=pmDur(PM_BEATS[i].cap);
  const extra=G.w*12;                                                   // the detour back for the ghosts, there and back again
  pmSpeed=(n*G.span+extra)/(frames*0.92);
  pmGhosts=PM_GHOSTS.map((g,k)=>({...g, k, p:-1e9, state:'off', ex:0, ey:0}));
  pmPellet=null; pmParts=[]; pmTexts=[];
  document.body.style.background="#000000";
}

function pmEat(){
  // eat every chunk the mouth has reached in the current lane
  const a=pmAt(pmP), G=pmGeom(), E=pmEaten[a.i], front=a.cx+a.dir*G.w/2;
  while(true){
    const j=E.next, c0=a.dir>0?j*E.cw:COLS-(j+1)*E.cw, c1=c0+E.cw-1;
    if(c0>COLS-1 || c1<0) break;
    const reached=a.dir>0?front>=c0:front<=c1;
    if(!reached) break;
    let n=0;
    for(let r=a.top;r<a.top+G.h&&r<streetRow;r++) for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){
      const ch=cityGridArr[r][c]; if(ch===" ") continue;
      n++; setCh(cityGridArr,r,c," ");
      if(Math.random()<0.08) pmParts.push({x:c,y:r,vx:-a.dir*Math.random()*0.6,vy:(Math.random()-0.5)*0.4,ch:".",mode:'pmcrumb',life:10});
    }
    if(n){ pmScore+=n*10; if(++pmWaka%3===0) pmText(pmWaka%6===0?"WAKA":"waka",(c0+c1)/2,a.top-1,'pmtext',12); }
    E.next++;
  }
}

function pmRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  const key=beat?beat.key:'hold', G=pmGeom();
  // windows double as pellets
  for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++){ const ch=grid[r][c]; if(ch==="."||ch===":") setMode(mg,r,c,'pmdot'); }
  // the level-clear flash on the street, the way the maze flashes in the arcade
  if(key==='clear'||key==='hold'){
    const on=key==='clear' && (pmT>>2)%2===0;
    for(let r=streetRow;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==" ") setMode(mg,r,c,on?'pmflashw':'pmflashb');
  }
  if(pmPellet && (pmT>>2)%2===0){
    const a=pmAt(pmPellet.p);
    pmPlace(grid,mg,pmScaleArt(["O"],Math.max(1,G.s-1)),a.cx,a.top+Math.floor(G.h/2)-1,'pmpellet');
  }
  // ghosts, ghosts' eyes on the way home
  for(const g of pmGhosts){
    if(g.state==='off') continue;
    if(g.state==='eyes'){ pmPlace(grid,mg,pmScaleArt(pmEyesArt,G.s),g.ex,g.ey,'pmeyes'); continue; }
    if(g.p<0) continue;
    const a=pmAt(g.p), art=pmScaleArt(pmGhostArts[(pmT>>2)%2],G.s), gw=art[0].length;
    const flicker=pmScared>0 && pmScared<20 && (pmT>>1)%2;
    pmPlace(grid,mg,art,a.cx-gw/2,a.top,pmScared>0?(flicker?'pmghostwhite':'pmscared'):g.mode);
  }
  // Pac-Man himself, chomping (not drawn once he's done)
  if(key!=='clear' && key!=='hold' && key!=='ready'){
    const a=pmAt(pmP), facing=pmReverse?-a.dir:a.dir;
    let art=pmFrames[[0,1,2,1][(pmT>>1)%4]]; if(facing<0) art=pmMirror(art);
    art=pmScaleArt(art,G.s);
    pmPlace(grid,mg,art,a.cx-G.w/2,a.top,'pacman');
  }
  if(key==='ready'){ const s="READY!"; pmPlace(grid,mg,[s],Math.round(cx-s.length/2),Math.round(streetRow*0.4),'pmready'); }
  for(const p of pmParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of pmTexts){ const r=Math.round(t.y); if(r<0||r>=ROWS) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,t.mode); } }
  // the score along the top, arcade style
  const sc="1UP  "+String(pmScore).padStart(6,"0")+(key==='hold'?"   HIGH SCORE":"");
  pmPlace(grid,mg,[sc],Math.round(cx-sc.length/2),0,'pmscore');     // centred, clear of the corner buttons
  scene.innerHTML=paint(grid,mg,'city');
}
function pmStepFx(){
  for(const p of pmParts){ p.x+=p.vx; p.y+=p.vy; p.life--; }
  pmParts=pmParts.filter(p=>p.life>0);
  for(const t of pmTexts){ t.life--; if(t.life%3===0) t.y--; }
  pmTexts=pmTexts.filter(t=>t.life>0);
}

function __m81_loop(){
  if(phase==='pm_run'){
    if(!pmStarted) pmInit();
    const beat=PM_BEATS[pmIdx], dur=pmDur(beat.cap), f=pmT/Math.max(1,dur-1), key=beat.key, G=pmGeom();
    const total=pmLanes.tops.length*G.span;
    let hold=false;

    if(key!=='ready' && key!=='clear' && !pmDone){
      // the ghosts join in a little way behind him
      if(key==='ghosts' && pmT===0) pmGhosts.forEach((g,k)=>{ g.state='chase'; g.p=pmP-(k+1)*G.w*1.2; });
      if(key==='pellet' && pmT===0 && !pmPellet) pmPellet={p:Math.min(total-G.w,pmP+G.w*1.5)};
      if(pmPellet && pmP>=pmPellet.p){
        pmPellet=null; pmScared=Math.round(pmDur(PM_BEATS[pmIdx+1].cap)*1.2); pmReverse=true;
        pmText("POWER!",pmAt(pmP).cx,pmAt(pmP).top-1,'pmpellet',20);
      }
      // move: forwards normally, backwards while hunting frightened ghosts
      if(pmReverse){
        pmP-=pmSpeed*1.6;
        for(const g of pmGhosts) if(g.state==='chase') g.p-=pmSpeed*0.3;
        const live=pmGhosts.filter(g=>g.state==='chase');
        for(const g of live) if(g.p>=pmP-G.w*0.3){
          // got one: 200, 400, 800, 1600
          const eatenSoFar=pmGhosts.filter(x=>x.state==='eyes').length, pts=200*Math.pow(2,eatenSoFar);
          pmScore+=pts; const a=pmAt(g.p);
          pmText(String(pts),a.cx,a.top-1,'pmpoints',24);
          g.state='eyes'; g.ex=a.cx-G.w/4; g.ey=a.top+1;
        }
        if(!pmGhosts.some(g=>g.state==='chase') || pmP<=0){ pmReverse=false; pmP=Math.max(0,pmP); }
      } else {
        pmP=Math.min(total,pmP+pmSpeed);
        pmEat();
        for(const g of pmGhosts) if(g.state==='chase') g.p=Math.min(pmP-(g.k+1)*G.w*1.2,g.p+pmSpeed*(pmScared>0?0.4:1));
      }
      for(const g of pmGhosts) if(g.state==='eyes'){ g.ey-=0.8; if(g.ey<-4) g.state='off'; }
      if(pmScared>0) pmScared--;
      if(pmP>=total){
        pmDone=true;
        // anything a lane happened to miss goes too
        for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++) if(cityGridArr[r][c]!==" "){ setCh(cityGridArr,r,c," "); pmScore+=10; }
      }
    }
    if(key==='finish' && !pmDone) hold=true;                            // the caption waits for him

    pmStepFx();
    pmRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffe600"; sub.style.textShadow="0 0 8px #2121de";
    pmT++;
    if(pmT>=dur && !hold){ pmT=0; pmIdx++; if(pmIdx>=PM_BEATS.length){ phase='pm_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='pm_hold'){
    pmStepFx();
    pmRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=PM_HOLD; sub.style.color="#ffe600"; sub.style.textShadow="0 0 8px #2121de";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m81_start(){
  attackMode='pm_run';
  cmd.style.color="#ffe600"; cmd.style.textShadow="0 0 20px #2121de";
  pmStarted=false; phase='pm_run';
}

function __m81_reset(){
  pmStarted=false; pmT=0; pmIdx=0; pmP=0; pmDir=1; pmSpeed=1; pmScore=0; pmLanes=[]; pmEaten=[];
  pmGhosts=[]; pmPellet=null; pmScared=0; pmReverse=false; pmParts=[]; pmTexts=[]; pmDone=false; pmWaka=0;
}

registerMethod(81, { start: __m81_start, resetFn: __m81_reset, loopFn: __m81_loop, phaseNames: ['pm_run','pm_hold'] });
