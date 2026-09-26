let blobStarted=false, blobT=0, blobScale=0, blobCX=0, blobBaseRow=0;
let blobNelsonDown=false, blobBusX=null, blobBenLean=0, blobShocks=0;
let blobGreggsEaten=0, blobHelis=[], blobEyeOn=false, blobHatOn=false, blobO2Popped=false, blobBridgeDown=false, blobFlood=0;
let blobFriendX=null, blobCraters=[];

// ---- BLOBBY: a pink, spotted, extremely friendly kaiju who means well ----
// a fixed 9x11 template (face, bow tie, arms, legs) rather than a shapeless dome, so
// scaling him up for the growth spurt is a block-scale of a recognisable character
const blobArt=[
  "  .---.  ",
  " /o   O\\ ",
  "|   n   |",
  "| \\_m_/ |",
  " \\_____/ ",
  "  b-k-b  ",
  " /  |  \\ ",
  "|  # #  |",
  " \\ # # / ",
  "   | |   ",
  "  _| |_  "
];
const blobArtW=9, blobArtH=blobArt.length;
const blobNelsonArt=[" A "," | "," | "," | ","[_]"];
const blobBenArt=[" ^ ","|12|","|::|","|  |","|__|"];
const blobGherkinArt=[" ^ ","/=\\","|=|","|=|"];
const blobO2Art=["  .------.  "," /        \\ ","|__________|"];
const blobBridgeArt=["A      A","|======|","|      |","^      ^"];
const blobBusArt=["_________","|LONDON  |","o       o"];
const blobHeliFrames=[["  -+-  "," <#=#> ","   ||   "],["  \\+/  "," <#=#> ","   ||   "]];

function blobPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const row=art[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function blobCharHeight(scale){ return blobArtH*Math.max(1,Math.round(scale)); }
function blobCharWidth(scale){ return blobArtW*Math.max(1,Math.round(scale)); }
// block-scales the fixed template so growth just means bigger blocks per source
// character, same shape throughout — feet stay planted on baseRow, he grows upward
function blobDrawCharacter(grid,mg,cxPos,baseRow,scale,mode){
  scale=Math.max(1,Math.round(scale));
  const totalH=blobArtH*scale, totalW=blobArtW*scale;
  const topRow=baseRow-totalH+1, leftCol=cxPos-Math.floor(totalW/2);
  for(let i=0;i<blobArtH;i++){
    const row=blobArt[i];
    for(let j=0;j<blobArtW;j++){
      const ch=row[j]; if(ch===" ") continue;
      for(let sy=0;sy<scale;sy++){
        const r=topRow+i*scale+sy; if(r<0||r>=ROWS) continue;
        for(let sx=0;sx<scale;sx++){
          const c=leftCol+j*scale+sx; if(c<0||c>=COLS) continue;
          setCh(grid,r,c,ch); setMode(mg,r,c,mode);
        }
      }
    }
  }
}
function blobDrawEyeRing(grid,mg,cxPos,midRow,rx,ry){
  const steps=44;
  for(let i=0;i<steps;i++){
    const ang=(i/steps)*Math.PI*2 + blobT*0.06;
    const c=Math.round(cxPos+Math.cos(ang)*rx), r=Math.round(midRow+Math.sin(ang)*ry);
    if(r<0||r>=ROWS||c<0||c>=COLS) continue;
    setCh(grid,r,c,(i%6===0)?'o':'=');
    setMode(mg,r,c,'londoneye');
  }
}
function blobEatChunk(centerCol,halfWidth){
  if(cityGridArr.length!==ROWS) return;
  for(let r=0;r<streetRow;r++){
    if(!cityGridArr[r]) continue;
    let ln=cityGridArr[r].split("");
    for(let c=centerCol-halfWidth;c<=centerCol+halfWidth;c++){
      if(c<0||c>=COLS) continue;
      ln[c]=" ";
    }
    cityGridArr[r]=ln.join("");
  }
}
function blobFloodUnderground(grid,mg,level){
  for(let k=0;k<level;k++){
    const r=streetRow+1+k; if(r>=ROWS) break;
    let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){ if(Math.random()<0.9){ ln[c]=(Math.random()<0.5?"~":"\u2248"); setMode(mg,r,c,'water'); } }
    grid[r]=ln.join("");
  }
}
function blobDrawCraters(grid,mg){
  for(const cr of blobCraters){
    for(let dx=-3;dx<=3;dx++){
      const c=cr+dx; if(c<0||c>=COLS) continue;
      const ch = Math.abs(dx)===3 ? '#' : (Math.random()<0.5?'~':'\u2248');
      setCh(grid,streetRow,c,ch); setMode(mg,streetRow,c,'lido');
    }
  }
}

function blobRenderBase(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  return {grid,mg};
}

function __m72_loop(){
  if(phase==='blob_arrival'){
    if(!blobStarted){ blobStarted=true; blobT=0; blobScale=1; blobCX=cx; blobBaseRow=ROWS-2; document.body.style.background="#05060d"; }
    const {grid,mg}=blobRenderBase();
    blobDrawCharacter(grid,mg,cx,blobBaseRow,blobScale,'blobby');
    if(blobT<16){
      mtDrawBubble(grid,mg,cx,blobBaseRow-blobCharHeight(blobScale),"BLOBBY BLOBBY BLOBBY");
      sub.textContent="A PINK BLOB IS FOUND IN A THAMES SEWAGE OUTFLOW. SCIENTISTS INVESTIGATE.";
    } else if(blobT<30){
      stage.classList.toggle('shake', blobT%2===0);
      flash.style.transition="opacity 0.05s"; flash.style.opacity = blobT%3===0 ? 0.5 : 0;
      sub.textContent="EVERY INSTRUMENT POINTED AT HIM EXPLODES";
    } else {
      stage.classList.remove('shake'); flash.style.opacity=0;
      blobBaseRow=Math.max(streetRow, blobBaseRow-2);
      sub.textContent="HE BOUNCES THROUGH SIX CEILINGS AND LANDS IN TRAFALGAR SQUARE";
    }
    sub.style.color="#ff8fd6"; sub.style.textShadow="0 0 8px #a01a70";
    scene.innerHTML=paint(grid,mg,'city');
    blobT++;
    if(!(blobBaseRow<=streetRow && blobT>34)){ timer=setTimeout(loop,90); }
    else { phase='blob_wobble'; blobT=0; blobBaseRow=streetRow; blobScale=1; loop(); }
  }else if(phase==='blob_wobble'){
    const {grid,mg}=blobRenderBase();
    const nelsonX=cx-Math.floor(COLS*0.22);
    if(!blobNelsonDown) blobPlace(grid,mg,blobNelsonArt,nelsonX-1,streetRow-blobNelsonArt.length,'nelson');
    else for(let dx=-6;dx<=1;dx++){ const c=nelsonX+dx; if(c>=0&&c<COLS) { setCh(grid,streetRow,c,'#'); setMode(mg,streetRow,c,'rubble'); } }
    if(blobBusX!==null){
      blobPlace(grid,mg,blobBusArt,Math.round(blobBusX),streetRow-blobBusArt.length,'war');
    }
    const benX=cx+Math.floor(COLS*0.24);
    for(let i=0;i<blobBenArt.length;i++){
      const leanOffset=Math.round((i/blobBenArt.length)*blobBenLean);
      blobPlace(grid,mg,[blobBenArt[i]],benX-1+leanOffset,streetRow-blobBenArt.length+i,'bigben');
    }
    blobDrawCharacter(grid,mg,blobCX,blobBaseRow,blobScale,'blobby');
    stage.classList.toggle('shake', blobShocks>0 && blobT%2===0);
    scene.innerHTML=paint(grid,mg,'city');
    if(blobT<20){
      blobCX=Math.round(cx + (nelsonX-cx)*Math.min(1,blobT/18));
      sub.textContent="BLOBBY TRIES TO HUG NELSON'S COLUMN";
    } else if(blobT<26){
      blobNelsonDown=true; blobShocks=6;
      sub.textContent="IT GOES DOWN LIKE A FELLED TREE";
    } else if(blobT<48){
      blobShocks=Math.max(0,blobShocks-1);
      blobCX=Math.round(nelsonX + (cx-nelsonX)*Math.min(1,(blobT-26)/16));
      if(blobBusX===null) blobBusX=cx-10;
      blobBusX+=2+((blobT-26)*0.4);
      sub.textContent = blobBusX<COLS ? "HE TRIES TO HELP A BUS DRIVER BY PUSHING THE BUS" : "THE BUS ENDS UP IN HERTFORDSHIRE";
    } else {
      blobBusX=null;
      blobCX=Math.round(cx + (benX-cx)*Math.min(1,(blobT-48)/18));
      blobBenLean=Math.min(3,(blobT-48)*0.15);
      if(blobT%6===0) blobShocks=3;
      blobShocks=Math.max(0,blobShocks-1);
      sub.textContent="BIG BEN CHIMES. BLOBBY DANCES ALONG. THE TOWER STARTS TO LEAN.";
    }
    sub.style.color="#ff8fd6"; sub.style.textShadow="0 0 8px #a01a70";
    blobT++;
    if(!(blobT>72 && blobBenLean>=2.5)){ timer=setTimeout(loop,85); }
    else { phase='blob_growth'; blobT=0; blobShocks=0; loop(); }
  }else if(phase==='blob_growth'){
    const {grid,mg}=blobRenderBase();
    const greggsX=cx-Math.floor(COLS*0.15)+blobGreggsEaten*6;
    if(blobGreggsEaten<5 && blobT%22<10){
      blobPlace(grid,mg,["_______","|GREGGS|","|______|"],greggsX-3,streetRow-3,'greggs');
    }
    blobDrawCharacter(grid,mg,blobCX,blobBaseRow,blobScale,'blobby');
    for(const h of blobHelis){
      const frame=blobHeliFrames[Math.floor(blobT/3)%2];
      blobPlace(grid,mg,frame,Math.round(h.x),h.y,'war');
      if(h.ejected){ const c=Math.round(h.x)+3; if(c>=0&&c<COLS) { setCh(grid,h.y+3,c,'Y'); setMode(mg,h.y+3,c,'body'); } }
    }
    scene.innerHTML=paint(grid,mg,'city');
    if(blobT%22===19 && blobGreggsEaten<5){
      blobEatChunk(greggsX,3);
      blobGreggsEaten++;
      // capped well below what his full height would need — the hula hoop ring and the
      // Gherkin hat both get drawn ABOVE his head too, so there has to be headroom left
      // over even at max scale or the whole Act 4 payoff clips above row 0, unseen
      blobScale=Math.min(2, blobScale+0.2);
      stage.classList.add('shake');
    } else stage.classList.remove('shake');
    if(blobGreggsEaten<5){
      sub.textContent="GREGGS EATEN: "+blobGreggsEaten+"/5 — BLOBBY GROWS THREE STOREYS EACH TIME";
    } else {
      if(blobHelis.length===0 && blobT>110){
        blobHelis=[{x:-10,y:Math.max(1,blobBaseRow-blobCharHeight(blobScale)-4),ejected:false},{x:COLS+10,y:Math.max(1,blobBaseRow-blobCharHeight(blobScale)-6),ejected:false}];
      }
      for(const h of blobHelis){ h.x += (h.x<blobCX?1:-1)*2.2; if(!h.ejected && Math.abs(h.x-blobCX)<12) h.ejected=true; }
      sub.textContent = blobHelis.some(h=>h.ejected)
        ? "THE PILOTS EJECT, SHOUTING \"BLOBBY!\" IN HORROR. NOBODY IS HARMED."
        : "TALLER THAN THE SHARD. THE MILITARY SENDS HELICOPTERS. HE THINKS THEY'RE TOYS.";
    }
    sub.style.color="#ff8fd6"; sub.style.textShadow="0 0 8px #a01a70";
    blobT++;
    if(!(blobGreggsEaten>=5 && blobT>150)){ timer=setTimeout(loop,85); }
    else { phase='blob_chaos'; blobT=0; loop(); }
  }else if(phase==='blob_chaos'){
    const {grid,mg}=blobRenderBase();
    if(blobT>10) blobEyeOn=true;
    if(blobT>50) blobHatOn=true;
    if(blobT>90 && !blobO2Popped){
      const o2x=blobCX+Math.floor(COLS*0.2);
      blobPlace(grid,mg,blobO2Art,o2x-6,streetRow-blobO2Art.length,'o2dome');
    }
    if(blobT>150 && !blobBridgeDown){
      const bx=blobCX-Math.floor(COLS*0.28);
      blobPlace(grid,mg,blobBridgeArt,bx-4,streetRow-blobBridgeArt.length,'towerbridge');
    }
    if(blobFlood>0) blobFloodUnderground(grid,mg,blobFlood);
    if(blobEyeOn) blobDrawEyeRing(grid,mg,blobCX,blobBaseRow-Math.floor(blobCharHeight(blobScale)*0.6),Math.floor(blobCharWidth(blobScale)*0.7),Math.floor(blobCharHeight(blobScale)*0.09));
    blobDrawCharacter(grid,mg,blobCX,blobBaseRow,blobScale,'blobby');
    if(blobHatOn) blobPlace(grid,mg,blobGherkinArt,blobCX-1,blobBaseRow-blobCharHeight(blobScale)-blobGherkinArt.length+2,'gherkin');
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', blobT>170 && blobT<190);
    flash.style.opacity = (blobT>=138 && blobT<142) ? 0.6 : 0;
    if(blobT<50) sub.textContent="HE USES THE LONDON EYE AS A HULA HOOP";
    else if(blobT<90) sub.textContent="HE WEARS THE GHERKIN AS A HAT";
    else if(blobT<138) sub.textContent="HE SITS ON THE O2. IT POPS LIKE A WHOOPEE CUSHION.";
    else if(blobT<150) { blobO2Popped=true; sub.textContent="THE SOUND IS HEARD IN FRANCE"; }
    else if(blobT<190) sub.textContent="TRYING TO TIDY UP, HE DROPS TOWER BRIDGE INTO THE THAMES";
    else { blobBridgeDown=true; blobFlood=Math.min(4,blobFlood+1); sub.textContent="THE UNDERGROUND FLOODS. COMMUTERS AGREE THIS IS STILL BETTER THAN USUAL SERVICE."; }
    sub.style.color="#ff8fd6"; sub.style.textShadow="0 0 8px #a01a70";
    blobT++;
    if(blobT<230){ timer=setTimeout(loop,85); }
    else { phase='blob_twist'; blobT=0; loop(); }
  }else if(phase==='blob_twist'){
    const {grid,mg}=blobRenderBase();
    if(blobFlood>0) blobFloodUnderground(grid,mg,blobFlood);
    if(blobT<40){
      blobDrawCharacter(grid,mg,blobCX,blobBaseRow,blobScale,'blobby');
      const sciX=blobCX-Math.floor(blobCharWidth(blobScale)/2)-6;
      blobPlace(grid,mg,rubberPersonSprite,sciX,streetRow-rubberPersonSprite.length,'rubberperson');
      mtDrawBubble(grid,mg,sciX+1,streetRow-rubberPersonSprite.length,"HE'S JUST LONELY");
      sub.textContent="A LONE SCIENTIST WORKS OUT WHY HE'S RAMPAGING";
    } else {
      if(blobFriendX===null) blobFriendX=Math.max(4,blobCX-blobCharWidth(blobScale)-8);
      blobDrawCharacter(grid,mg,blobFriendX,blobBaseRow,Math.min(blobScale,blobScale*Math.min(1,(blobT-40)/20)),'blobbyfriend');
      blobDrawCharacter(grid,mg,blobCX,blobBaseRow,blobScale,'blobby');
      if(blobT>65){
        if(blobT%8===0) blobCraters.push(Math.round((blobCX+blobFriendX)/2));  // one crater per "bounce", not per frame
        blobCX=Math.max(-blobCharWidth(blobScale),blobCX-4);
        blobFriendX=Math.max(-blobCharWidth(blobScale),blobFriendX-4);
      }
      sub.textContent = blobT<65
        ? "A GIANT INFLATABLE FRIEND, BUILT FROM EVERY BOUNCY CASTLE IN THE SOUTH EAST"
        : "HAND IN HAND, THEY BOUNCE TOWARD THE ENGLISH CHANNEL";
    }
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.style.color="#ff8fd6"; sub.style.textShadow="0 0 8px #a01a70";
    blobT++;
    // blobCX is clamped to -blobCharWidth(blobScale) above, so it settles AT that floor
    // rather than ever going below it — the exit check has to match that or it never fires
    if(!(blobT>65 && blobCX<=-blobCharWidth(blobScale))){ timer=setTimeout(loop,85); }
    else { phase='blob_hold'; blobT=0; loop(); }
  }else if(phase==='blob_hold'){
    const {grid,mg}=blobRenderBase();
    if(blobFlood>0) blobFloodUnderground(grid,mg,blobFlood);
    blobDrawCraters(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    if(blobT<60){ sub.textContent="LONDON REBUILDS. THE CRATERS BECOME BELOVED PUBLIC LIDOS."; sub.style.color="#4db0e8"; sub.style.textShadow="0 0 8px #1a5a8a"; }
    else if(blobT<110){ sub.textContent="YEARS LATER, A MYSTERIOUS PINK TREMOR IS DETECTED IN PARIS"; sub.style.color="#ff8fd6"; sub.style.textShadow="0 0 8px #a01a70"; }
    else { sub.textContent="\"BLOBBY\" ECHOES ACROSS THE SEINE. THE EIFFEL TOWER BEGINS TO WOBBLE... — press RESET"; sub.style.color="#ff5ac0"; sub.style.textShadow="0 0 8px #a01a70"; }
    sub.className="";
    blobT++;
    timer=setTimeout(loop, 140);
  }
}

function __m72_start(){
  attackMode='blob_arrival';
  cmd.style.color="#ff5ac0"; cmd.style.textShadow="0 0 20px #a01a70";
  blobStarted=false; phase='blob_arrival';
}

function __m72_reset(){
  blobStarted=false; blobT=0; blobScale=0; blobCX=0; blobBaseRow=0;
  blobNelsonDown=false; blobBusX=null; blobBenLean=0; blobShocks=0;
  blobGreggsEaten=0; blobHelis=[]; blobEyeOn=false; blobHatOn=false; blobO2Popped=false; blobBridgeDown=false; blobFlood=0;
  blobFriendX=null; blobCraters=[];
}

registerMethod(72, { start: __m72_start, resetFn: __m72_reset, loopFn: __m72_loop, phaseNames: ['blob_arrival','blob_wobble','blob_growth','blob_chaos','blob_twist','blob_hold'] });
