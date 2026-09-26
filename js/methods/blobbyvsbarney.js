let cvbStarted=false, cvbT=0, cvbScale=1, cvbBarneyX=0, cvbBlobbyX=0, cvbBaseRow=0;
let cvbInterchangeDown=false, cvbTowerSquished=false, cvbStadiumSat=false, cvbBlanketTop=0, cvbHighFived=false;

// ---- CLASH OF THE WOBBLY TITANS: Blobby vs Barney ----
// local copies of both characters' templates, uniquely named so this file never collides
// with blobby.js/barney.js if a browser happens to have loaded them earlier in the session
const cvbBlobbyArt=[
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
const cvbBarneyArt=[
  "  .---.  ",
  " /O   O\\ ",
  "|   m   |",
  " \\_____/ ",
  " /  #  \\ ",
  "| # g # |",
  "| # g # |",
  " \\ #g# / ",
  "   | |   ",
  "  _| |_  "
];
const cvbInterchangeArt=[" .-=====-. ","(  .---.  )"," '-|   |-' ","   '---'   ","==========="];
const cvbInterchangeFlatArt=["\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248\u2248"];
const cvbTowerArt=[" .-. ","(   )","(   )","(   )"," '-' "];
const cvbTowerOvalArt=[" .-------. ","(         )"," '-------' "];
const cvbStadiumArt=[" .-------. ","/ STADIUM \\","'---------'"];
const cvbShelterArt=[" ______ ","|      |","|______|"];
const cvbHouseArt=["  /\\  "," /  \\ ","|____|"];
const cvbBalloonArt=["o","|"];

function cvbPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const row=art[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function cvbCharDims(art,scale){
  scale=Math.max(1,Math.round(scale));
  const h=art.length, w=Math.max(...art.map(r=>r.length));
  return {h:h*scale, w:w*scale};
}
function cvbDrawChar(art,grid,mg,cxPos,baseRow,scale,mode){
  scale=Math.max(1,Math.round(scale));
  const {h:totalH,w:totalW}=cvbCharDims(art,scale);
  const topRow=baseRow-totalH+1, leftCol=cxPos-Math.floor(totalW/2);
  for(let i=0;i<art.length;i++){
    const row=art[i];
    for(let j=0;j<row.length;j++){
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
function cvbRenderBase(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  return {grid,mg};
}
function cvbBlanketOverlay(grid,mg,topRow){
  for(let r=Math.max(0,topRow); r<streetRow; r++){
    for(let c=0;c<COLS;c++){
      if(Math.random()<0.85){ setCh(grid,r,c,(Math.random()<0.5?"#":"+")); setMode(mg,r,c,'blanket'); }
    }
  }
}

function __m75_loop(){
  const interchangeX=cx-Math.floor(COLS*0.28), towerX=cx-Math.floor(COLS*0.06), stadiumX=cx+Math.floor(COLS*0.2);
  if(phase==='cvb_intro'){
    if(!cvbStarted){ cvbStarted=true; cvbT=0; cvbScale=1; cvbBaseRow=streetRow; cvbBarneyX=-10; cvbBlobbyX=-999; document.body.style.background="#3a1a2a"; }
    const {grid,mg}=cvbRenderBase();
    if(!cvbInterchangeDown) cvbPlace(grid,mg,cvbInterchangeArt,interchangeX-5,streetRow-cvbInterchangeArt.length,'interchange');
    else cvbPlace(grid,mg,cvbInterchangeFlatArt,interchangeX-5,streetRow,'interchange');
    if(cvbT<20){
      cvbBarneyX=Math.round(-10+(interchangeX-(-10))*Math.min(1,cvbT/18));
      sub.textContent="AT SUNSET, BARNEY BOUNCES INTO THE CITY";
    } else {
      cvbBarneyX=interchangeX;
      if(cvbT>28) cvbInterchangeDown=true;
      sub.textContent="HE SITS ON A MOTORWAY INTERCHANGE, SQUASHING IT FLAT";
    }
    cvbDrawChar(cvbBarneyArt,grid,mg,cvbBarneyX,cvbBaseRow,cvbScale,'barney');
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#ff9ad0"; sub.style.textShadow="0 0 8px #a0308a";
    cvbT++;
    if(!(cvbInterchangeDown && cvbT>40)){ timer=setTimeout(loop,90); }
    else { phase='cvb_charge'; cvbT=0; cvbBlobbyX=COLS+10; loop(); }
  }else if(phase==='cvb_charge'){
    const {grid,mg}=cvbRenderBase();
    cvbPlace(grid,mg,cvbInterchangeFlatArt,interchangeX-5,streetRow,'interchange');
    if(cvbT<28){
      cvbBlobbyX=Math.round((COLS+10)+(interchangeX+8-(COLS+10))*Math.min(1,cvbT/26));
      sub.textContent="BLOBBY SPOTS HIM AND CHARGES IN FOR A HUG";
    } else {
      cvbBlobbyX=interchangeX+6;
      stage.classList.toggle('shake', cvbT%2===0);
      sub.textContent="THE HUG-FIGHT BEGINS";
    }
    cvbDrawChar(cvbBarneyArt,grid,mg,cvbBarneyX,cvbBaseRow,cvbScale,'barney');
    cvbDrawChar(cvbBlobbyArt,grid,mg,cvbBlobbyX,cvbBaseRow,cvbScale,'blobby');
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#ff9ad0"; sub.style.textShadow="0 0 8px #a0308a";
    cvbT++;
    if(cvbT<50){ timer=setTimeout(loop,85); }
    else { phase='cvb_escalate'; cvbT=0; loop(); }
  }else if(phase==='cvb_escalate'){
    const {grid,mg}=cvbRenderBase();
    cvbPlace(grid,mg,cvbInterchangeFlatArt,interchangeX-5,streetRow,'interchange');
    if(cvbT<25){
      if(!cvbTowerSquished) cvbPlace(grid,mg,cvbTowerArt,towerX-2,streetRow-cvbTowerArt.length,'towerclash');
      else cvbPlace(grid,mg,cvbTowerOvalArt,towerX-5,streetRow-cvbTowerOvalArt.length,'towerclash');
      if(cvbT>14) cvbTowerSquished=true;
      stage.classList.add('shake');
      sub.textContent="BUILDINGS WOBBLE. A ROUND TOWER GETS SQUEEZED OVAL.";
    } else if(cvbT<50){
      if(cvbTowerSquished) cvbPlace(grid,mg,cvbTowerOvalArt,towerX-5,streetRow-cvbTowerOvalArt.length,'towerclash');
      if(!cvbStadiumSat) cvbPlace(grid,mg,cvbStadiumArt,stadiumX-6,streetRow-cvbStadiumArt.length,'stadiumclash');
      if(cvbT>42) cvbStadiumSat=true;
      sub.textContent="A STADIUM GETS SAT ON";
    } else {
      if(cvbTowerSquished) cvbPlace(grid,mg,cvbTowerOvalArt,towerX-5,streetRow-cvbTowerOvalArt.length,'towerclash');
      cvbBlanketTop=Math.max(0, streetRow-2-(cvbT-50)*3);
      cvbBlanketOverlay(grid,mg,cvbBlanketTop);
      sub.textContent="A GIANT BLANKET FALLS OVER THE WHOLE CITY";
    }
    cvbDrawChar(cvbBarneyArt,grid,mg,cvbBarneyX,cvbBaseRow,cvbScale,'barney');
    cvbDrawChar(cvbBlobbyArt,grid,mg,cvbBlobbyX,cvbBaseRow,cvbScale,'blobby');
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#ff9ad0"; sub.style.textShadow="0 0 8px #a0308a";
    cvbT++;
    if(cvbT<80){ timer=setTimeout(loop,85); }
    else { phase='cvb_calm'; cvbT=0; stage.classList.remove('shake'); loop(); }
  }else if(phase==='cvb_calm'){
    const {grid,mg}=cvbRenderBase();
    cvbPlace(grid,mg,cvbInterchangeFlatArt,interchangeX-5,streetRow,'interchange');
    if(cvbTowerSquished) cvbPlace(grid,mg,cvbTowerOvalArt,towerX-5,streetRow-cvbTowerOvalArt.length,'towerclash');
    const shelterX=cx+Math.floor(COLS*0.35);
    cvbPlace(grid,mg,cvbShelterArt,shelterX-4,streetRow-cvbShelterArt.length,'busshelter');
    cvbPlace(grid,mg,rubberPersonSprite,shelterX-1,streetRow-cvbShelterArt.length-rubberPersonSprite.length,'body');
    if(cvbT<22){
      mtDrawBubble(grid,mg,shelterX,streetRow-cvbShelterArt.length-rubberPersonSprite.length,"GENTLE HUG?");
      sub.textContent="A TINY SCIENTIST ON A BUS SHELTER MIMES A \"GENTLE HUG\" THROUGH A MEGAPHONE";
    } else if(cvbT<45){
      sub.textContent="THE TITANS CALM DOWN";
    } else {
      cvbHighFived=true;
      cvbScale=Math.max(1, cvbScale-0.03);
      sub.textContent="THEY HIGH-FIVE AND SHRINK";
    }
    cvbDrawChar(cvbBarneyArt,grid,mg,cvbBarneyX,cvbBaseRow,cvbScale,'barney');
    cvbDrawChar(cvbBlobbyArt,grid,mg,cvbBlobbyX,cvbBaseRow,cvbScale,'blobby');
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#ff9ad0"; sub.style.textShadow="0 0 8px #a0308a";
    cvbT++;
    if(!(cvbHighFived && cvbScale<=1 && cvbT>60)){ timer=setTimeout(loop,90); }
    else { phase='cvb_hold'; cvbT=0; cityGridArr=buildCity(); loop(); }
  }else if(phase==='cvb_hold'){
    const {grid,mg}=cvbRenderBase();
    const houseX=cx-6;
    cvbPlace(grid,mg,cvbHouseArt,houseX,streetRow-cvbHouseArt.length,'clashhouse');
    cvbDrawChar(cvbBarneyArt,grid,mg,houseX+8,streetRow,1,'barney');
    cvbDrawChar(cvbBlobbyArt,grid,mg,houseX+16,streetRow,1,'blobby');
    if(cvbT>50){
      const balloonY=Math.min(streetRow-2, Math.floor((cvbT-50)/2));
      cvbPlace(grid,mg,cvbBalloonArt,COLS-8,balloonY,'balloon');
    }
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    if(cvbT<50){ sub.textContent="THE TWO OF THEM LIVE TOGETHER IN A SMALL HOUSE"; sub.style.color="#c8a458"; sub.style.textShadow="0 0 8px #6a3a1a"; }
    else if(cvbT<100){ sub.textContent="A LONELY, DEFLATING BALLOON APPEARS ON THE HORIZON..."; sub.style.color="#e05a9a"; sub.style.textShadow="0 0 8px #a0308a"; }
    else { sub.textContent="THE END? — press RESET"; sub.style.color="#ff5ac0"; sub.style.textShadow="0 0 8px #a0308a"; }
    sub.className="";
    cvbT++;
    timer=setTimeout(loop, 140);
  }
}

function __m75_start(){
  attackMode='cvb_intro';
  cmd.style.color="#ff5ac0"; cmd.style.textShadow="0 0 20px #a0308a";
  cvbStarted=false; phase='cvb_intro';
}

function __m75_reset(){
  cvbStarted=false; cvbT=0; cvbScale=1; cvbBarneyX=0; cvbBlobbyX=0; cvbBaseRow=0;
  cvbInterchangeDown=false; cvbTowerSquished=false; cvbStadiumSat=false; cvbBlanketTop=0; cvbHighFived=false;
}

registerMethod(75, { start: __m75_start, resetFn: __m75_reset, loopFn: __m75_loop, phaseNames: ['cvb_intro','cvb_charge','cvb_escalate','cvb_calm','cvb_hold'] });
