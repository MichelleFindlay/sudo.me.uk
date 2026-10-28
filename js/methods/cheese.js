let chStarted=false, chT=0, chIdx=0, chLampX=0, chLampBent=false, chLampGone=false, chCube=null, chDrops=[], chParts=[], chTexts=[];
let chPile=[], chCracks=null, chRubble=[], chRubbleCh=[], chWheel=null, chTide=0, chMoon=null, chHoles=[], chSquished=false;
let chMouse=null, chCrumb=null, chShakeAmp=0, chClouds=[];

// ---- CHEESE: the sky over the city turns out to be mostly cheese ----
// six stages on one beat list: calm, cheese rain, the rolling wheel, fondue flood,
// the Cheesening (a moon that lands), and one mouse who does very well out of all this
const CH_BEATS=[
  {key:'calm',    cap:"A SUNNY DAY IN THE CITY."},
  {key:'cube',    cap:"A SINGLE CUBE OF CHEESE FALLS FROM THE SKY..."},
  {key:'bonk',    cap:"...AND BONKS A LAMPPOST."},
  {key:'clouds',  cap:"THE CLOUDS TURN YELLOW."},
  {key:'rain',    cap:"AND THEN IT STARTS RAINING CHEESE."},
  {key:'crack',   cap:"IT PILES UP ON THE ROOFTOPS. THE WINDOWS CRACK UNDER THE WEIGHT."},
  {key:'wheel',   cap:"A GIANT CHEESE WHEEL ROLLS IN FROM THE HILLS ON THE LEFT"},
  {key:'wheel',   cap:"IT FLATTENS BUILDINGS IN A STRAIGHT LINE, BOUNCING OVER THE RUBBLE"},
  {key:'hot',     cap:"THE SUN GETS HOT."},
  {key:'melt',    cap:"ALL THE PILED-UP CHEESE MELTS..."},
  {key:'tide',    cap:"...AND A YELLOW TIDE OF FONDUE RISES UP THE SCREEN, SWALLOWING WHAT'S LEFT"},
  {key:'moon',    cap:"THEN: THE CHEESENING."},
  {key:'moon',    cap:"A COLOSSAL CHEESE MOON DESCENDS AND BLOCKS OUT THE SKY"},
  {key:'squish',  cap:"IT LANDS ON THE CITY WITH A BIG SQUISH."},
  {key:'silence', cap:"SILENCE."},
  {key:'mouse',   cap:"THEN ONE SMALL MOUSE RUNS OUT OF THE RUBBLE..."},
  {key:'grab',    cap:"...GRABS A CRUMB, AND RUNS OFF."}
];
const CH_HOLD="THE CITY HAS BEEN CHEESED. — press RESET";
const CH_SKY_SUNNY="#174a8a", CH_SKY_HOT="#7a4a10", CH_SKY_DARK="#0c0904";

const chSunArt=[" \\|/ ","--O--"," /|\\ "];
const chCloudArt=["  .--.  ",".(    ).","(______)"];
const chLampArt=["o","|","|","|","|"];
const chLampBentArt=["o  "," \\ ","  |","  |","  |"];
const chWheelArts=[
  ["  .--.  "," /:o::\\ ","|:o::o:|"," \\::o:/ ","  '--'  "],
  ["  .--.  "," /::o:\\ ","|o::o::|"," \\:o::/ ","  '--'  "]
];
const chMouseArt=["~(__^'>"];

function chDur(text){ return Math.max(40, Math.ceil(text.length*0.85)); }
function chLerpHex(a,b,f){
  const pa=[1,3,5].map(i=>parseInt(a.substr(i,2),16)), pb=[1,3,5].map(i=>parseInt(b.substr(i,2),16));
  return "rgb("+pa.map((v,i)=>Math.round(v+(pb[i]-v)*f)).join(",")+")";
}
function chScaleArt(art,s){
  if(s<=1) return art;
  const out=[]; for(const row of art){ const w=row.split("").map(ch=>ch.repeat(s)).join(""); for(let k=0;k<s;k++) out.push(w); } return out;
}
function chPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const r=Math.round(top)+i; if(r<0||r>=ROWS) continue;
    for(let j=0;j<art[i].length;j++){
      const ch=art[i][j], c=Math.round(left)+j; if(ch===" "||c<0||c>=COLS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function chColTop(c){ for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" ") return r; return streetRow; }
function chText(s,x,y){ chTexts.push({s,x,y,life:22}); }
function chFlatten(c){
  // a column goes to rubble, along with any cheese piled on it
  if(c<0||c>=COLS) return 0;
  let n=0;
  for(let r=0;r<streetRow;r++) if(cityGridArr[r][c]!==" "){ n++; setCh(cityGridArr,r,c," "); }
  if(chCracks) for(let r=0;r<streetRow;r++) chCracks[r][c]=false;
  if(n||chPile[c]){ chRubble[c]=Math.random()<0.5?1:2; chRubbleCh[c]=[0,1].map(()=>".,_#%"[(Math.random()*5)|0]).join(""); }
  chPile[c]=0;
  return n;
}
function chShake(){
  if(chShakeAmp>0.3){
    stage.style.transform="translate("+((Math.random()-0.5)*2*chShakeAmp).toFixed(1)+"px,"+((Math.random()-0.5)*2*chShakeAmp).toFixed(1)+"px)";
    chShakeAmp*=0.85;
  } else { stage.style.transform=""; chShakeAmp=0; }
}

function chInit(){
  chStarted=true; chT=0; chIdx=0; chLampBent=false; chLampGone=false; chCube=null; chDrops=[]; chParts=[]; chTexts=[];
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  chLampX=Math.round(COLS*0.4);
  for(let r=0;r<streetRow;r++) for(let c=chLampX-2;c<=chLampX+2;c++) setCh(cityGridArr,r,c," ");
  chPile=Array(COLS).fill(0); chRubble=Array(COLS).fill(0); chRubbleCh=Array(COLS).fill("");
  chCracks=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  chWheel=null; chTide=0; chMoon=null; chSquished=false; chMouse=null; chCrumb=null; chShakeAmp=0;
  chClouds=[]; for(let i=0;i<4;i++) chClouds.push({x:Math.random()*COLS, y:1+(i%2)*2, v:0.05+Math.random()*0.08});
  // fixed hole pattern for the moon, in unit-circle coordinates
  chHoles=[]; for(let i=0;i<14;i++){ const a=Math.random()*Math.PI*2, d=Math.sqrt(Math.random())*0.8; chHoles.push({x:Math.cos(a)*d, y:Math.sin(a)*d, r:0.06+Math.random()*0.08}); }
  document.body.style.background=CH_SKY_SUNNY;
}

function chRender(beat,f){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice(), mg=modeGridFill(ROWS,COLS,'city');
  const key=beat?beat.key:'hold';
  // the sun, which gets bigger and angrier once things get hot
  const hot=['hot','melt','tide'].includes(key);
  if(!chSquished && (!chMoon || chMoon.cy<0)){
    const sun=chScaleArt(chSunArt,hot?2:1);
    const sl=COLS-sun[0].length-3;
    for(let i=0;i<sun.length;i++) for(let j=0;j<sun[i].length;j++){
      const ch=sun[i][j], r=1+i, c=sl+j; if(ch!==" " && grid[r] && grid[r][c]===" "){ setCh(grid,r,c,ch); setMode(mg,r,c,hot?'chsunhot':'chsun'); }
    }
  }
  // clouds, dithering over to yellow from the clouds beat on
  const yellow=key==='clouds'?f:(CH_BEATS.findIndex(b=>b.key==='clouds')<chIdx||!beat?1:0);
  for(const cl of chClouds){
    if(key==='moon'||key==='squish'||chSquished) continue;
    cl.x+=cl.v; if(cl.x>COLS) cl.x=-8;
    for(let i=0;i<chCloudArt.length;i++) for(let j=0;j<chCloudArt[i].length;j++){
      const ch=chCloudArt[i][j], r=Math.round(cl.y)+i, c=Math.round(cl.x)+j;
      if(ch===" "||c<0||c>=COLS||!grid[r]||grid[r][c]!==" ") continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,Math.random()<yellow?'chcloudy':'chcloud');
    }
  }
  // cracked windows
  for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++) if(chCracks[r][c] && grid[r][c]!==" "){ setCh(grid,r,c,"x"); setMode(mg,r,c,'chcrack'); }
  // cheese piled on the rooftops
  for(let c=0;c<COLS;c++){ const top=chColTop(c); for(let k=0;k<chPile[c];k++){ const r=top-1-k; if(r>=0){ setCh(grid,r,c,(r+c)%3?"#":"o"); setMode(mg,r,c,'cheese'); } } }
  for(let c=0;c<COLS;c++){ const h=chRubble[c]||0; for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,chRubbleCh[c][k]); setMode(mg,streetRow-1-k,c,'rubble'); } }
  if(!chLampGone) chPlace(grid,mg,chLampBent?chLampBentArt:chLampArt,chLampX-(chLampBent?2:0),streetRow-chLampArt.length,'chlamp');
  if(chCube) chPlace(grid,mg,["#"],chCube.x,chCube.y,'cheese');
  for(const d of chDrops) chPlace(grid,mg,["#"],d.x,d.y,'cheese');
  if(chWheel){
    const art=chScaleArt(chWheelArts[(Math.round(chWheel.x)>>1)&1],chWheel.s);
    chPlace(grid,mg,art,chWheel.x-art[0].length/2,streetRow-art.length-Math.round(chWheel.y),'chwheel');
  }
  // the fondue tide
  for(let k=0;k<Math.round(chTide);k++){
    const r=streetRow-1-k;
    for(let c=0;c<COLS;c++){
      const surf=k===Math.round(chTide)-1;
      setCh(grid,r,c,surf?((c+chT)%4<2?"~":"-"):"\u2248"); setMode(mg,r,c,'chfondue');
    }
  }
  // the moon
  if(chMoon){
    const m=chMoon;
    for(let r=Math.max(0,Math.floor(m.cy-m.ry));r<=Math.min(streetRow-1,Math.ceil(m.cy+m.ry));r++){
      for(let c=Math.max(0,Math.floor(cx-m.rx));c<=Math.min(COLS-1,Math.ceil(cx+m.rx));c++){
        const ux=(c-cx)/m.rx, uy=(r-m.cy)/m.ry, d=ux*ux+uy*uy;
        if(d>1) continue;
        let ch=d>0.85?(ux<0?"(":")"):":";
        for(const h of chHoles) if((ux-h.x)*(ux-h.x)+(uy-h.y)*(uy-h.y)<h.r*h.r){ ch="O"; break; }
        setCh(grid,r,c,ch); setMode(mg,r,c,'chmoon');
      }
    }
  }
  if(chSquished){
    for(let c=0;c<COLS;c++) for(let k=0;k<2;k++){ const r=streetRow-1-k; setCh(grid,r,c,k?((c*7)%5?":":"o"):"#"); setMode(mg,r,c,'cheese'); }
  }
  if(chCrumb) chPlace(grid,mg,["."],chCrumb.x,streetRow-3,'cheese');
  if(chMouse) chPlace(grid,mg,chMouseArt,chMouse.x,streetRow-3,'chmouse');
  for(const p of chParts){ const r=Math.round(p.y), c=Math.round(p.x); setCh(grid,r,c,p.ch); setMode(mg,r,c,p.mode); }
  for(const t of chTexts){ const r=Math.round(t.y); if(r<0) continue; const l=Math.max(0,Math.min(COLS-t.s.length,Math.round(t.x-t.s.length/2))); for(let j=0;j<t.s.length;j++){ setCh(grid,r,l+j,t.s[j]); setMode(mg,r,l+j,'chtext'); } }
  scene.innerHTML=paint(grid,mg,'city');
}
function chStepParts(){
  for(const p of chParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life--; if(p.g>0 && p.y>=streetRow-1){ p.y=streetRow-1; p.vx=0; p.vy=0; p.g=0; } }
  chParts=chParts.filter(p=>p.life>0 && p.x>=0 && p.x<COLS && p.y>=0 && p.y<streetRow);
  for(const t of chTexts){ t.life--; if(t.life%3===0) t.y--; }
  chTexts=chTexts.filter(t=>t.life>0);
}

function __m79_loop(){
  if(phase==='ch_run'){
    if(!chStarted) chInit();
    const beat=CH_BEATS[chIdx], dur=chDur(beat.cap), f=chT/Math.max(1,dur-1), key=beat.key;
    let hold=false;

    if(key==='cube'){
      if(!chCube) chCube={x:chLampX, y:0};
      chCube.y=Math.min(streetRow-chLampArt.length-1,f/0.9*(streetRow-chLampArt.length-1));
    }else if(key==='bonk'){
      if(chT===0){ chLampBent=true; chText("BONK",chLampX,streetRow-chLampArt.length-2); chShakeAmp=3; }
      if(chCube){ chCube.x=chLampX+2+chT*0.3; chCube.y=Math.min(streetRow-1,chCube.y+0.6); }
    }else if(key==='clouds'){
      // clouds dither to yellow in chRender
    }else if(key==='rain' || key==='crack'){
      for(let k=0;k<Math.max(2,COLS/30);k++) chDrops.push({x:(Math.random()*COLS)|0, y:3+Math.random()*2, v:0.8+Math.random()*0.6});
      for(const d of chDrops){
        d.y+=d.v;
        const land=chColTop(d.x)-1-chPile[d.x];
        if(d.y>=land){ if(chPile[d.x]<5) chPile[d.x]++; d.done=true; }
      }
      chDrops=chDrops.filter(d=>!d.done);
      if(key==='crack'){
        // windows under a heavy pile crack, a few at a time
        for(let c=0;c<COLS;c++) if(chPile[c]>=2) for(let r=chColTop(c);r<streetRow;r++){
          const ch=cityGridArr[r][c]; if((ch==="."||ch===":") && Math.random()<0.04) chCracks[r][c]=true;
        }
        if(chT%9===0) chText("CRACK",(Math.random()*COLS)|0,4+Math.random()*4);
      }
    }else if(key==='wheel'){
      chDrops=[];
      // giant, but never so wide on a narrow screen that it flattens everything in one pass
      const s=Math.max(1,Math.min(4,Math.floor(streetRow*0.45/5),Math.floor(COLS/24))), w=8*s;
      if(!chWheel){
        const total=dur+chDur(CH_BEATS[chIdx+1].cap);
        chWheel={x:-w, y:0, vy:0, s, sp:(COLS+2*w)/(total*0.9), crushed:0};
      }
      const wl=chWheel;
      wl.x+=wl.sp; wl.y+=wl.vy; wl.vy-=0.25*s;
      if(wl.y<=0){
        wl.y=0;
        if(wl.crushed>w*3){ wl.vy=s*(1.6+Math.random()); wl.crushed=0; chShakeAmp=Math.max(chShakeAmp,2+s); }
        else wl.vy=0;
      }
      const L=Math.round(wl.x-w/2), R=Math.round(wl.x+w/2)-1, bottom=streetRow-1-Math.round(wl.y), top=bottom-5*s+1;
      if(wl.y<0.5 && chLampX>=L && chLampX<=R) chLampGone=true;
      if(chCube && chCube.x>=L && chCube.x<=R) chCube=null;
      for(let c=L;c<=R;c++){
        if(c<0||c>=COLS) continue;
        if(wl.y<0.5) wl.crushed+=chFlatten(c);
        else for(let r=Math.max(0,top);r<=Math.min(streetRow-1,bottom);r++) if(cityGridArr[r][c]!==" "){ setCh(cityGridArr,r,c," "); chPart(c,r); }
      }
    }else if(key==='hot'){
      chWheel=null;
      document.body.style.background=chLerpHex(CH_SKY_SUNNY,CH_SKY_HOT,f);
    }else if(key==='melt'){
      if(chT%3===0) for(let c=0;c<COLS;c++) if(chPile[c]>0 && Math.random()<0.5){
        chPile[c]--; chParts.push({x:c,y:chColTop(c)-1,vx:0,vy:0.3,g:0.05,ch:"'",mode:'chfondue',life:30});
      }
    }else if(key==='tide'){
      const Lmax=Math.round(streetRow*0.55);
      chTide=Lmax*Math.min(1,f/0.85);
      for(let k=0;k<Math.round(chTide);k++){ const r=streetRow-1-k; for(let c=0;c<COLS;c++) if(cityGridArr[r][c]!==" ") setCh(cityGridArr,r,c," "); }
      for(let c=0;c<COLS;c++){ chPile[c]=0; chRubble[c]=0; }
    }else if(key==='moon'){
      const first=CH_BEATS.findIndex(b=>b.key==='moon');
      const total=chDur(CH_BEATS[first].cap)+chDur(CH_BEATS[first+1].cap);
      const tt=(chIdx===first?0:chDur(CH_BEATS[first].cap))+chT, g=tt/total;
      const rx=Math.round(COLS*0.42), ry=Math.max(4,Math.round(rx*0.42));
      const endCy=streetRow-Math.round(chTide)-1-ry;
      chMoon={rx, ry, cy:-ry+(endCy+ry)*g};
      document.body.style.background=chLerpHex(CH_SKY_HOT,CH_SKY_DARK,Math.min(1,g*1.3));
    }else if(key==='squish'){
      const m=chMoon, ry0=Math.max(4,Math.round(COLS*0.42*0.42)), rx0=Math.round(COLS*0.42);
      const g=Math.min(1,f/0.4);
      m.ry=Math.max(1,ry0*(1-g)+1*g); m.rx=rx0+(COLS*0.7-rx0)*g;
      m.cy=streetRow-1-m.ry;
      if(chT===Math.round(dur*0.1)){
        chText("SQUISH",cx,streetRow-ry0*2); chShakeAmp=16;
        for(let r=0;r<streetRow;r++) for(let c=0;c<COLS;c++) if(cityGridArr[r][c]!==" ") setCh(cityGridArr,r,c," ");
        chTide=0; chLampGone=true; chCube=null; chDrops=[]; chParts=[];
      }
      if(chT===dur-1){ chMoon=null; chSquished=true; for(let c=0;c<COLS;c++){ chRubble[c]=0; chPile[c]=0; } }
      document.body.style.background=chLerpHex(CH_SKY_DARK,"#141018",f);
    }else if(key==='silence'){
      // nothing at all happens
    }else if(key==='mouse'){
      if(!chMouse){ chMouse={x:Math.round(COLS*0.25)}; chCrumb={x:Math.round(COLS*0.6)}; }
      chMouse.x=Math.min(chCrumb.x-chMouseArt[0].length,chMouse.x+0.6);
    }else if(key==='grab'){
      if(chCrumb && chMouse.x+chMouseArt[0].length>=chCrumb.x) chCrumb=null;
      chMouse.x+=Math.max(1,COLS/(dur*0.6));
      if(chMouse.x<COLS) hold=true;                                     // don't end until he's gone
    }

    chShake();
    chStepParts();
    chRender(beat,f);
    sub.textContent=beat.cap; sub.style.color="#ffd23a"; sub.style.textShadow="0 0 8px #c08a10";
    chT++;
    if(chT>=dur && !hold){ chT=0; chIdx++; if(chIdx>=CH_BEATS.length){ phase='ch_hold'; chMouse=null; } }
    timer=setTimeout(loop,80);
  }else if(phase==='ch_hold'){
    stage.style.transform="";
    chStepParts();
    chRender(null,0);
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent=CH_HOLD; sub.style.color="#ffd23a"; sub.style.textShadow="0 0 8px #c08a10";
    sub.className="";
    timer=setTimeout(loop,140);
  }
}
function chPart(c,r){ if(Math.random()<0.3) chParts.push({x:c,y:r,vx:(Math.random()-0.2)*1.2,vy:-0.3,g:0.06,ch:"'",mode:'rubble',life:20}); }

function __m79_start(){
  attackMode='ch_run';
  cmd.style.color="#ffd23a"; cmd.style.textShadow="0 0 20px #c08a10";
  chStarted=false; phase='ch_run';
}

function __m79_reset(){
  chStarted=false; chT=0; chIdx=0; chLampBent=false; chLampGone=false; chCube=null; chDrops=[]; chParts=[]; chTexts=[];
  chPile=[]; chCracks=null; chRubble=[]; chRubbleCh=[]; chWheel=null; chTide=0; chMoon=null; chHoles=[]; chSquished=false;
  chMouse=null; chCrumb=null; chShakeAmp=0; chClouds=[];
  stage.style.transform="";
}

registerMethod(79, { start: __m79_start, resetFn: __m79_reset, loopFn: __m79_loop, phaseNames: ['ch_run','ch_hold'] });
