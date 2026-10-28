let elmStarted=false, elmT=0, elmIdx=0, elmX=0, elmDir=1, elmMad=false, elmHop=0;
let elmBlds=[], elmShots=[], elmParts=[], elmToast=null, elmRubble=[], elmRubbleCh=[];

// ---- ELMO: someone gives Elmo a toaster. The toast burns. ----
// five stages on one beat list (calm / snap / rampage / peak / end); buildings are split
// into segments that go ok -> fire -> collapse (shrinking downwards) -> rubble when toast hits
const ELM_BEATS=[
  {stage:'calm',    cap:"IT'S A LOVELY MORNING. SOMEONE HAS GIVEN ELMO A TOASTER."},
  {stage:'calm',    cap:"ELMO LOVES TOAST! ELMO PUSHES THE LEVER DOWN.", bubble:"ELMO LOVES TOAST!"},
  {stage:'snap',    cap:"THE TOAST POPS UP. IT IS BURNT BLACK."},
  {stage:'snap',    cap:"ELMO'S EYES TURN RED. THE SKY TURNS ORANGE.", bubble:"..."},
  {stage:'rampage', cap:"ELMO BOUNCES ACROSS TOWN, FIRING BURNT TOAST AT EVERYTHING"},
  {stage:'rampage', cap:"EVERY BUILDING THE TOAST HITS CATCHES FIRE, THEN COLLAPSES"},
  {stage:'rampage', cap:"ELMO HAS A LOT OF TOAST. ELMO HAS BEEN SAVING IT."},
  {stage:'peak',    cap:"EVERYTHING IS ON FIRE.", bubble:"ELMO IS DONE BEING NICE."},
  {stage:'peak',    cap:"ELMO IS DONE BEING NICE.", bubble:"ELMO IS DONE BEING NICE."},
  {stage:'end',     cap:"ONE LAST PIECE OF TOAST POPS UP. IT IS PERFECTLY GOLDEN."},
  {stage:'end',     cap:"ELMO CALMS DOWN.", bubble:"OOOH! TOAST!"}
];
const ELM_HOLD="THE TOWN IS RUBBLE. SMALL FIRES FLICKER. ELMO IS HAVING A LOVELY BREAKFAST. — press RESET";

const elmArt=["  .%%%%.  "," %%%%%%%% ","%%(O)(O)%%","%%%%@@%%%%","%%\\____/%%"," %%%%%%%% ","  %%%%%%  ","  %%  %%  "];
const elmMadArt=["  .%%%%.  "," %%%%%%%% ","%%(O)(O)%%","%%%%@@%%%%","%%/''''\\%%"," %%%%%%%% ","  %%%%%%  ","  %%  %%  "];
const elmToasterArt=[" ____ ","|=  =|","|____|"];
const ELM_SKY_CALM="#0b2a55", ELM_SKY_MAD="#7a2c00", ELM_SKY_AFTER="#24161a";

function elmDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function elmScale(){ return streetRow>30?2:1; }
function elmLerpHex(a,b,f){
  const pa=[1,3,5].map(i=>parseInt(a.substr(i,2),16)), pb=[1,3,5].map(i=>parseInt(b.substr(i,2),16));
  return "rgb("+pa.map((v,i)=>Math.round(v+(pb[i]-v)*f)).join(",")+")";
}
function elmScaleArt(art,s){
  if(s<=1) return art;
  const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out;
}
function elmPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function elmColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function elmShrink(c0,c1){
  // shift these columns down a row: the building gets shorter, roof and all
  for(let r=streetRow-1;r>=0;r--){
    const ln=cityGridArr[r].split("");
    for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++) ln[c]=r>0?cityGridArr[r-1][c]:" ";
    cityGridArr[r]=ln.join("");
  }
}
function elmFindBuildings(){
  // runs of occupied columns, with long runs split into building-sized chunks
  const out=[]; let c=0;
  while(c<COLS){
    if(elmColTop(c)>=streetRow){ c++; continue; }
    let e=c; while(e+1<COLS && elmColTop(e+1)<streetRow) e++;
    const n=Math.max(1,Math.round((e-c+1)/8)), w=(e-c+1)/n;
    for(let k=0;k<n;k++) out.push({c0:Math.round(c+k*w), c1:Math.round(c+(k+1)*w)-1, state:'ok', t:0});
    c=e+1;
  }
  return out;
}
function elmSetRubble(b){
  for(let c=b.c0;c<=b.c1;c++){ elmRubble[c]=Math.random()<0.5?1:2; elmRubbleCh[c]=[0,1].map(()=>".,_#%"[(Math.random()*5)|0]).join(""); }
}

function elmInit(){
  elmStarted=true; elmT=0; elmIdx=0; elmX=cx; elmDir=1; elmMad=false; elmHop=0;
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  // clear a patch of pavement in the middle for Elmo and the toaster
  const w=elmArt[0].length*elmScale();
  for(let r=0;r<streetRow;r++) for(let c=cx-Math.ceil(w/2)-2;c<=cx+Math.ceil(w/2)+8;c++) setCh(cityGridArr,r,c," ");
  elmBlds=elmFindBuildings(); elmShots=[]; elmParts=[];
  elmRubble=Array(COLS).fill(0); elmRubbleCh=Array(COLS).fill("");
  elmToast=null;
  document.body.style.background=ELM_SKY_CALM;
}

function elmFire(b){ if(b.state==='ok'){ b.state='fire'; b.t=0; } }
function elmStepBuildings(){
  for(const b of elmBlds){
    if(b.state==='fire'){ if(++b.t>18){ b.state='collapse'; b.t=0; } }
    else if(b.state==='collapse'){
      b.t++;
      if(b.t%2===0){
        elmShrink(b.c0,b.c1);
        for(let k=0;k<2;k++) elmParts.push({x:b.c0+Math.random()*(b.c1-b.c0+1), y:streetRow-1, vx:(Math.random()-0.5)*0.6, vy:-0.2-Math.random()*0.2, g:0, ch:".", mode:'elmsmoke', life:18});
      }
      let any=false; for(let c=b.c0;c<=b.c1;c++) if(elmColTop(c)<streetRow){ any=true; break; }
      if(!any){ b.state='gone'; elmSetRubble(b); }
    }
  }
}
function elmDrawFlames(grid,mg){
  for(const b of elmBlds){
    if(b.state!=='fire' && b.state!=='collapse') continue;
    for(let c=b.c0;c<=b.c1;c++){
      const top=elmColTop(c); if(top>=streetRow) continue;
      for(let k=0;k<3;k++){
        if(Math.random()<0.35+k*0.2) continue;
        const r=top-1-k; if(r<0) break;
        setCh(grid,r,c,"^*'"[k]); setMode(mg,r,c,'flames');
      }
    }
  }
}
function elmDrawRubble(grid,mg,flicker){
  for(let c=0;c<COLS;c++){
    const h=elmRubble[c]||0;
    for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,elmRubbleCh[c][k]); setMode(mg,streetRow-1-k,c,'rubble'); }
    if(flicker && h && Math.random()<0.06){ setCh(grid,streetRow-1-h,c,Math.random()<0.5?"^":"'"); setMode(mg,streetRow-1-h,c,'flames'); }
  }
}
function elmFireShot(){
  const live=elmBlds.filter(b=>b.state==='ok'); if(!live.length) return;
  // aim at one of the nearer standing buildings, so the toast visibly flies from Elmo
  live.sort((a,b)=>Math.abs((a.c0+a.c1)/2-elmX)-Math.abs((b.c0+b.c1)/2-elmX));
  const b=live[(Math.random()*Math.min(4,live.length))|0], tx=(b.c0+b.c1)/2;
  const tr=Math.min(streetRow-2,elmColTop(Math.round(tx))+1);
  const sx=elmX, sy=streetRow-elmArt.length*elmScale()-elmHop;
  const d=Math.max(1,Math.hypot(tx-sx,tr-sy)), sp=2.6;
  elmShots.push({x:sx,y:sy,vx:(tx-sx)/d*sp,vy:(tr-sy)/d*sp,n:Math.ceil(d/sp),b});
}
function elmStepShots(){
  for(const s of elmShots){ s.x+=s.vx; s.y+=s.vy; if(--s.n<=0){ elmFire(s.b); s.done=true;
    for(let k=0;k<6;k++) elmParts.push({x:s.x,y:s.y,vx:(Math.random()-0.5)*1.4,vy:-Math.random()*0.8,g:0.06,ch:"*",mode:'flames',life:10}); } }
  elmShots=elmShots.filter(s=>!s.done);
}
function elmStepParts(){
  for(const p of elmParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; }
  elmParts=elmParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<streetRow);
}

function elmDrawElmo(grid,mg,bubble){
  const art=elmScaleArt(elmMad?elmMadArt:elmArt,elmScale()), w=art[0].length, h=art.length;
  const left=Math.round(elmX-w/2), top=streetRow-h-Math.round(elmHop);
  elmPlace(grid,mg,art,left,top,elmMad?'elmomad':'elmo');
  // the toaster, carried at his side
  const tl=left+w+1, tt=streetRow-elmToasterArt.length-Math.round(elmHop);
  elmPlace(grid,mg,elmToasterArt,tl,tt,'elmtoaster');
  if(elmToast) elmPlace(grid,mg,["[==]"],tl+1,tt-1-Math.round(elmToast.up),elmToast.gold?'elmgold':'elmtoast');
  if(bubble){
    const len=bubble.length+4, c0=Math.max(Math.ceil(len/2),Math.min(COLS-1-Math.ceil(len/2),Math.round(elmX)));
    mtDrawBubble(grid,mg,c0,top,bubble);
  }
}

function __m77_loop(){
  if(phase==='elm_run'){
    if(!elmStarted) elmInit();
    const beat=ELM_BEATS[elmIdx], dur=elmDur(beat.cap), f=elmT/Math.max(1,dur-1);
    const S=elmScale(), halfW=Math.ceil(elmArt[0].length*S/2);

    if(beat.stage==='calm'){
      if(elmIdx===1) elmToast=f<0.5?{up:0,gold:false}:null;            // in it goes
    }else if(beat.stage==='snap'){
      if(elmIdx===2){
        const pop=Math.min(1,f/0.25); elmToast={up:Math.sin(pop*Math.PI)*3, gold:false};
        if(elmT%3===0) elmParts.push({x:elmX+halfW+3+Math.random()*2, y:streetRow-6, vx:(Math.random()-0.5)*0.2, vy:-0.25, g:0, ch:"o", mode:'elmsmoke', life:22});
      } else {
        elmMad=true;
        document.body.style.background=elmLerpHex(ELM_SKY_CALM,ELM_SKY_MAD,Math.min(1,f/0.7));
      }
    }else if(beat.stage==='rampage' || beat.stage==='peak'){
      const peak=beat.stage==='peak';
      elmToast=null;
      elmX+=elmDir*(peak?1.8:1.2);
      if(elmX<halfW+1){ elmX=halfW+1; elmDir=1; }
      if(elmX>COLS-halfW-9){ elmX=COLS-halfW-9; elmDir=-1; }
      elmHop=Math.abs(Math.sin(elmT*0.35))*3;
      if(elmT%(peak?4:7)===0) elmFireShot();
      if(peak && elmIdx===7 && elmT===0){
        // everything goes up at once, staggered so it doesn't all fall in step
        for(const b of elmBlds) if(b.state==='ok'){ b.state='fire'; b.t=-((Math.random()*20)|0); }
      }
      stage.classList.toggle('shake', peak && elmT%2===0);
    }else if(beat.stage==='end'){
      stage.classList.remove('shake');
      elmHop=Math.max(0,elmHop-0.5);
      elmX+=(cx-elmX)*0.12;
      if(elmIdx===9){
        const pop=Math.min(1,f/0.3); elmToast={up:Math.sin(pop*Math.PI)*3, gold:true};
        if(elmT===dur-1){                                               // anything still standing gives up
          for(const b of elmBlds) if(b.state!=='gone'){
            for(let r=0;r<streetRow;r++) for(let c=b.c0;c<=b.c1;c++) setCh(cityGridArr,r,c," ");
            b.state='gone'; elmSetRubble(b);
          }
        }
      } else {
        elmMad=false;
        document.body.style.background=elmLerpHex(ELM_SKY_MAD,ELM_SKY_AFTER,Math.min(1,f));
      }
    }

    elmStepBuildings(); elmStepShots(); elmStepParts();
    if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
    const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
    elmDrawRubble(grid,mg,beat.stage==='end');
    elmDrawFlames(grid,mg);
    for(const s of elmShots){ elmPlace(grid,mg,[elmT%2?"[]":"=="],s.x,s.y,'elmtoast'); }
    elmDrawElmo(grid,mg,beat.bubble && f<0.85 ? beat.bubble : null);
    for(const p of elmParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent=beat.cap;
    sub.style.color=elmMad?"#ff3a20":"#ff5a5a"; sub.style.textShadow="0 0 8px "+(elmMad?"#ff8a00":"#a01010");
    elmT++;
    if(elmT>=dur){ elmT=0; elmIdx++; if(elmIdx>=ELM_BEATS.length){ phase='elm_hold'; } }
    timer=setTimeout(loop,80);
  }else if(phase==='elm_hold'){
    elmStepParts();
    const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
    elmDrawRubble(grid,mg,true);
    elmToast={up:0,gold:true};
    elmDrawElmo(grid,mg,null);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=ELM_HOLD; sub.style.color="#ff5a5a"; sub.style.textShadow="0 0 8px #a01010";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}

function __m77_start(){
  attackMode='elm_run';
  cmd.style.color="#e8262a"; cmd.style.textShadow="0 0 20px #ff8a1a";
  elmStarted=false; phase='elm_run';
}

function __m77_reset(){
  elmStarted=false; elmT=0; elmIdx=0; elmX=0; elmDir=1; elmMad=false; elmHop=0;
  elmBlds=[]; elmShots=[]; elmParts=[]; elmToast=null; elmRubble=[]; elmRubbleCh=[];
}

registerMethod(77, { start: __m77_start, resetFn: __m77_reset, loopFn: __m77_loop, phaseNames: ['elm_run','elm_hold'] });
