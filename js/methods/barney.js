let barnStarted=false, barnT=0, barnScale=0, barnCX=0, barnBaseRow=0;
let barnCars=[], barnLamppostBent=false, barnShopHit=false;
let barnSandwichY=0, barnCowsSpawned=false, barnCows=[], barnHelpersIn=false, barnArmyDown=false;
let barnChildIn=false;

// ---- BARNEY: a purple plush comes to life and loves everyone far too hard ----
// same fixed-template block-scale approach as blobby.js — recognisable face/belly at
// any size, rather than a shapeless growing mass
const barnArt=[
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
const barnArtW=9, barnArtH=barnArt.length;
const barnRoundaboutArt=[" .===. ","|     |"," '===' "];
const barnLamppostArt=["o","|","|","|","|"];
const barnLamppostBentArt=["  __o","_/   "];
const barnShopArt=["_________","|SHOPPING|","|________|"];
const barnSandwichArt=["________________","|v v v v v v v v|","|oooooooooooooo|","|______________|"];
const barnCowArt=[" ^  ^ ","( @@ )"," \"\"\"\" "];
const barnBabyBopArt=[" .-. ","(o o)"," \\_/ "];
const barnBJArt=[" .-. ","(O O)"," \\_/ "];

function barnPlace(grid,mg,art,left,top,mode){
  for(let i=0;i<art.length;i++){
    const row=art[i], r=top+i;
    for(let j=0;j<row.length;j++){
      const ch=row[j]; if(ch===" ") continue;
      const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS) continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,mode);
    }
  }
}
function barnCharHeight(scale){ return barnArtH*Math.max(1,Math.round(scale)); }
function barnCharWidth(scale){ return barnArtW*Math.max(1,Math.round(scale)); }
function barnDrawCharacter(grid,mg,cxPos,baseRow,scale,mode){
  scale=Math.max(1,Math.round(scale));
  const totalH=barnArtH*scale, totalW=barnArtW*scale;
  const topRow=baseRow-totalH+1, leftCol=cxPos-Math.floor(totalW/2);
  for(let i=0;i<barnArtH;i++){
    const row=barnArt[i];
    for(let j=0;j<barnArtW;j++){
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
function barnFlatten(centerCol,halfWidth){
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
function barnCustardRain(grid,mg){
  for(let k=0;k<COLS*0.5;k++){
    const c=(Math.random()*COLS)|0, r=(Math.random()*streetRow)|0;
    if(grid[r] && grid[r][c]===" "){ setCh(grid,r,c, Math.random()<0.5?"'":"."); setMode(mg,r,c,'custard'); }
  }
}
function barnDrawConga(grid,mg,t){
  const n=10;
  for(let i=0;i<n;i++){
    const cxi = cx - Math.floor(n/2)*4 + i*4;
    const bob = Math.sin(t*0.3+i)>0 ? 0 : 1;
    barnPlace(grid,mg,rubberPersonSprite, cxi-1, streetRow-rubberPersonSprite.length+bob, 'body');
  }
}
function barnDrawArmyCircle(grid,mg){
  const n=7;
  for(let i=0;i<n;i++){
    const cxi = cx - Math.floor(n/2)*3 + i*3;
    barnPlace(grid,mg,rubberPersonSprite, cxi-1, streetRow-rubberPersonSprite.length, 'war');
  }
}
function barnRenderBase(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  return {grid,mg};
}

function __m74_loop(){
  if(phase==='barn_wake'){
    if(!barnStarted){ barnStarted=true; barnT=0; barnScale=1; barnCX=cx; barnBaseRow=streetRow; document.body.style.background="#0a0612"; }
    const {grid,mg}=barnRenderBase();
    barnDrawCharacter(grid,mg,barnCX,barnBaseRow,barnScale,'barney');
    if(barnT<16){
      mtDrawBubble(grid,mg,barnCX,barnBaseRow-barnCharHeight(barnScale),"HI THERE, FRIEND!");
      sub.textContent="A CHILD FINDS AN OLD PURPLE PLUSH DINOSAUR AT A CAR BOOT SALE";
    } else if(barnT<32){
      sub.textContent="SHE WISHES ON IT. IT GROWS TO EIGHT FEET AND BEAMS AT HER.";
    } else {
      sub.textContent="THEN HE SPOTS THE SKYLINE. SO MANY FRIENDS TO HUG.";
    }
    sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050";
    scene.innerHTML=paint(grid,mg,'city');
    barnT++;
    if(barnT<48){ timer=setTimeout(loop,90); }
    else { phase='barn_hugs'; barnT=0; loop(); }
  }else if(phase==='barn_hugs'){
    const roundX=cx-Math.floor(COLS*0.22), lampX=cx, shopX=cx+Math.floor(COLS*0.24);
    const {grid,mg}=barnRenderBase();
    barnPlace(grid,mg,barnRoundaboutArt,roundX-3,streetRow-barnRoundaboutArt.length,'roundabout');
    if(!barnLamppostBent) barnPlace(grid,mg,barnLamppostArt,lampX,streetRow-barnLamppostArt.length,'roundabout');
    else barnPlace(grid,mg,barnLamppostBentArt,lampX-2,streetRow-barnLamppostBentArt.length,'roundabout');
    if(!barnShopHit) barnPlace(grid,mg,barnShopArt,shopX-4,streetRow-barnShopArt.length,'roundabout');
    for(const car of barnCars){ setCh(grid,Math.round(car.y),Math.round(car.x),'='); setMode(mg,Math.round(car.y),Math.round(car.x),'car'); }
    if(barnT<20){
      barnCX=Math.round(cx + (roundX-cx)*Math.min(1,barnT/18));
      sub.textContent="HE FINDS A CITY MADE ENTIRELY OF ROUNDABOUTS, AND HE LOVES THEM";
    } else if(barnT<45){
      if(barnT%3===0) barnCars.push({x:roundX,y:streetRow-1,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*2});
      for(const car of barnCars){ car.x+=car.vx; car.y+=car.vy; }
      barnCars=barnCars.filter(c=>c.x>=0&&c.x<COLS&&c.y>=0&&c.y<ROWS);
      stage.classList.toggle('shake', barnT%2===0);
      sub.textContent="HE SPINS ON EACH ONE LIKE A PLAYGROUND MERRY-GO-ROUND";
    } else if(barnT<62){
      stage.classList.remove('shake');
      barnCX=Math.round(roundX + (lampX-roundX)*Math.min(1,(barnT-45)/15));
      if(barnT>58) barnLamppostBent=true;
      sub.textContent="HE HUGS A LAMPPOST TOO HARD AND IT FOLDS IN HALF";
    } else {
      barnCX=Math.round(lampX + (shopX-lampX)*Math.min(1,(barnT-62)/18));
      if(barnT>82 && !barnShopHit){ barnShopHit=true; barnFlatten(shopX,5); }
      sub.textContent="HE HUGS A SHOPPING CENTRE AND IT COLLAPSES INWARD WITH A SAD CRUNCH";
    }
    barnDrawCharacter(grid,mg,barnCX,barnBaseRow,barnScale,'barney');
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050";
    barnT++;
    if(!(barnShopHit && barnT>95)){ timer=setTimeout(loop,85); }
    else { phase='barn_imagine'; barnT=0; barnSandwichY=1; loop(); }
  }else if(phase==='barn_imagine'){
    const {grid,mg}=barnRenderBase();
    barnDrawCharacter(grid,mg,barnCX,barnBaseRow,barnScale,'barney');
    if(barnT<30){
      barnCustardRain(grid,mg);
      sub.textContent="HE IMAGINES A FUN RAINY DAY. IT RAINS CUSTARD FOR SIX HOURS.";
    } else if(barnT<58){
      barnSandwichY=Math.min(streetRow-barnSandwichArt.length, barnSandwichY+2);
      barnPlace(grid,mg,barnSandwichArt,cx+Math.floor(COLS*0.15)-8,barnSandwichY,'sandwich');
      sub.textContent="HE IMAGINES A BIG PICNIC. A STADIUM-SIZED SANDWICH LANDS ON THE STATION.";
    } else {
      barnPlace(grid,mg,barnSandwichArt,cx+Math.floor(COLS*0.15)-8,streetRow-barnSandwichArt.length,'sandwich');
      barnDrawConga(grid,mg,barnT);
      sub.textContent="HE IMAGINES EVERYONE DANCING. BUCKINGHAMSHIRE CANNOT STOP CONGA-ING.";
    }
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050";
    barnT++;
    if(barnT<95){ timer=setTimeout(loop,85); }
    else { phase='barn_chaos'; barnT=0; loop(); }
  }else if(phase==='barn_chaos'){
    const {grid,mg}=barnRenderBase();
    if(barnT<40){
      barnScale=Math.min(2, barnScale+0.05);
      if(barnT%12===11) barnFlatten(barnCX+((Math.random()*40)|0)-20, 4);
      sub.textContent="HE GROWS TO SKYSCRAPER SIZE. \"IMAGINATION MAKES US BIG AND STRONG!\"";
    } else if(barnT<80){
      if(!barnCowsSpawned){ barnCowsSpawned=true; barnCows=[0,1,2,3].map(i=>({x:cx-24+i*10})); }
      for(const c of barnCows) c.x+=1.4;
      for(const c of barnCows) barnPlace(grid,mg,barnCowArt,Math.round(c.x)-3,streetRow-barnCowArt.length,'concretecow');
      sub.textContent="THE CONCRETE COWS COME ALIVE AND STAMPEDE TOWARD LONDON";
    } else if(barnT<110){
      for(const c of barnCows) c.x+=1.4;
      for(const c of barnCows) barnPlace(grid,mg,barnCowArt,Math.round(c.x)-3,streetRow-barnCowArt.length,'concretecow');
      barnHelpersIn=true;
      barnPlace(grid,mg,barnBabyBopArt,barnCX-Math.floor(barnCharWidth(barnScale)/2)-8,streetRow-barnBabyBopArt.length,'babybop');
      barnPlace(grid,mg,barnBJArt,barnCX+Math.floor(barnCharWidth(barnScale)/2)+3,streetRow-barnBJArt.length,'bj');
      sub.textContent="BABY BOP AND BJ TURN UP TO \"HELP\" AND MAKE EVERYTHING WORSE";
    } else {
      if(barnHelpersIn){
        barnPlace(grid,mg,barnBabyBopArt,barnCX-Math.floor(barnCharWidth(barnScale)/2)-8,streetRow-barnBabyBopArt.length,'babybop');
        barnPlace(grid,mg,barnBJArt,barnCX+Math.floor(barnCharWidth(barnScale)/2)+3,streetRow-barnBJArt.length,'bj');
      }
      barnArmyDown=true;
      barnDrawArmyCircle(grid,mg);
      sub.textContent="THE ARMY'S SONIC WEAPONS BECOME, TO BARNEY, A SINGALONG. MORALE COLLAPSES.";
    }
    barnDrawCharacter(grid,mg,barnCX,barnBaseRow,barnScale,'barney');
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.toggle('shake', barnT<40);
    sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050";
    barnT++;
    if(barnT<150){ timer=setTimeout(loop,85); }
    else { phase='barn_twist'; barnT=0; loop(); }
  }else if(phase==='barn_twist'){
    stage.classList.remove('shake');
    const {grid,mg}=barnRenderBase();
    const signX=cx-Math.floor(COLS*0.1);
    barnPlace(grid,mg,barnRoundaboutArt,signX-3,streetRow-barnRoundaboutArt.length,'roundabout');
    if(barnT<30){
      barnChildIn=true;
      barnPlace(grid,mg,rubberPersonSprite,signX-1,streetRow-barnRoundaboutArt.length-rubberPersonSprite.length,'body');
      mtDrawBubble(grid,mg,signX,streetRow-barnRoundaboutArt.length-rubberPersonSprite.length,"SOMETIMES FRIENDS NEED PERSONAL SPACE");
      barnDrawCharacter(grid,mg,barnCX,barnBaseRow,barnScale,'barney');
      sub.textContent="SHE CLIMBS THE ONE SURVIVING ROUNDABOUT SIGN AND TELLS HIM, GENTLY";
    } else {
      barnScale=Math.max(1, barnScale-0.06);
      barnDrawCharacter(grid,mg,barnCX,barnBaseRow,barnScale,'barney');
      sub.textContent="HIS LIP WOBBLES. HE SHRINKS WITH A SAD DEFLATING SQUEAK.";
    }
    scene.innerHTML=paint(grid,mg,'city');
    sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050";
    barnT++;
    if(!(barnT>30 && barnScale<=1)){ timer=setTimeout(loop,90); }
    else { phase='barn_hold'; barnT=0; cityGridArr=buildCity(); loop(); }
  }else if(phase==='barn_hold'){
    const {grid,mg}=barnRenderBase();
    barnDrawCharacter(grid,mg,cx,streetRow,1,'barney');
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    if(barnT<55){ sub.textContent="MILTON KEYNES IS REBUILT. IT LOOKS ABOUT THE SAME AS BEFORE."; sub.style.color="#9aa2ac"; sub.style.textShadow="0 0 8px #3a3a3a"; }
    else if(barnT<100){ sub.textContent="THE PLUSH IS SEALED IN A VAULT BENEATH GCHQ"; sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050"; }
    else if(barnT<140){ sub.textContent="ON THE NIGHT SHIFT, A GUARD SWEARS HE HEARS FAINT HUMMING..."; sub.style.color="#c060b0"; sub.style.textShadow="0 0 8px #3aa050"; }
    else { sub.textContent="THE STITCHED SMILE SEEMS SLIGHTLY WIDER THAN BEFORE... — press RESET"; sub.style.color="#a0308a"; sub.style.textShadow="0 0 8px #3aa050"; }
    sub.className="";
    barnT++;
    timer=setTimeout(loop, 140);
  }
}

function __m74_start(){
  attackMode='barn_wake';
  cmd.style.color="#a0308a"; cmd.style.textShadow="0 0 20px #3aa050";
  barnStarted=false; phase='barn_wake';
}

function __m74_reset(){
  barnStarted=false; barnT=0; barnScale=0; barnCX=0; barnBaseRow=0;
  barnCars=[]; barnLamppostBent=false; barnShopHit=false;
  barnSandwichY=0; barnCowsSpawned=false; barnCows=[]; barnHelpersIn=false; barnArmyDown=false;
  barnChildIn=false;
}

registerMethod(74, { start: __m74_start, resetFn: __m74_reset, loopFn: __m74_loop, phaseNames: ['barn_wake','barn_hugs','barn_imagine','barn_chaos','barn_twist','barn_hold'] });
