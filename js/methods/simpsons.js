let simpStarted=false, simpT=0, domeR=0, dropOffset=0, heliFly=0;


// ---- SIMPSONS: a giant glass dome drops over the city, cutting into the ground and sealing it in ----
// the water tower and nuclear plant from the title-sequence skyline, planted in among the buildings
const springfieldTower=[
  "   ___   ",
  "  /   \\  ",
  " |     | ",
  "  \\___/  ",
  "   | |   ",
  "  /   \\  ",
];
const springfieldPlant=[
  "    )   (    ",
  "     \\ /     ",
  "      |      ",
  "     / \\     ",
  "  __(___)__  ",
  " |NUCLEAR  | ",
  " |_PLANT___| ",
];
function drawSpringfieldSkyline(grid,mg){
  const land=[[springfieldPlant,Math.floor(COLS*0.22)],[springfieldTower,Math.floor(COLS*0.68)]];
  for(const [spr,leftWanted] of land){
    const w=spr[0].length, h=spr.length;
    const left=Math.max(0,Math.min(COLS-w,leftWanted)), top=streetRow-h+1;
    for(let i=0;i<h;i++){ const art=spr[i], r=top+i;
      for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue; const c=left+j;
        if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'landmark'); } }
  }
}
// heavy-lift choppers carry the (already full-size) dome down by cable; dropOffset counts the
// rows it still has to fall (0 once seated). Once seated they cut loose and peel away, and only
// then does the rim bite into the earth and the city flash over to Springfield colours.

function drawHelicopter(grid,mg,hr,hc){
  const rotor=heliRotorFrames[simpT%2];
  for(let j=0;j<rotor.length;j++){ const c=hc-1+j; setCh(grid,hr,c,rotor[j]); setMode(mg,hr,c,'crane'); }
  const body="(###)";
  for(let j=0;j<body.length;j++){ const c=hc-2+j; setCh(grid,hr+1,c,body[j]); setMode(mg,hr+1,c,'crane'); }
}
function simpsonsRender(domeR, dropOffset, heliFly, sealed){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS, sealed?'simpsons':'city');
  drawSpringfieldSkyline(grid,mg);
  const seated=dropOffset<=0;
  const ground=streetRow-Math.max(0,dropOffset), dig=seated?2:0;   // still airborne = no ground contact yet
  const domeV=Math.min(streetRow+2, Math.round(domeR*0.9));        // fixed dome shape, only its altitude changes
  for(let r=ground+dig; r>=ground-domeV; r--){
    const frac=(ground-r)/Math.max(1,domeV);
    const cf=Math.max(-1,Math.min(1,frac));
    const w=Math.round(Math.sqrt(Math.max(0,1-cf*cf))*domeR);
    for(const s of [-1,1]){
      for(let k=0;k<2;k++){                          // a couple of characters thick, so the glass reads solid
        const c=cx+s*(w-k); if(c<0||c>=COLS)continue;
        setCh(grid,r,c,(s<0?"\\":"/")); setMode(mg,r,c,'domeglass');
      }
    }
    // once seated, the rim bites into the earth — crumble the dirt right at the seam
    if(dig>0 && r>ground){ for(const c of [cx-w-1,cx-w,cx+w,cx+w+1]){ if(c>=0&&c<COLS&&Math.random()<0.6){ setCh(grid,r,c,["#",".","\u00b7"][(Math.random()*3)|0]); setMode(mg,r,c,'rubble'); } } }
  }
  // a curved cap of glass at the very apex, closing the dome off once it's fully seated
  if(sealed){ const top=ground-domeV; for(let c=cx-2;c<=cx+2;c++){ setCh(grid,top,c,"="); setMode(mg,top,c,'domeglass'); } }
  // the helicopter crew lowering (or, once seated, casting off from) the dome
  const apexRow=ground-domeV;
  if(!seated || heliFly<=14){
    for(const dx of [-0.5,0,0.5]){
      let hc=Math.round(cx+dx*domeR), hr=apexRow-3;
      if(seated){ hr-=Math.round(heliFly*0.7); hc+=Math.round(dx*heliFly*2.2); }        // peel away up and outward
      else { for(let r=hr+2;r<apexRow;r++){ setCh(grid,r,hc,":"); setMode(mg,r,hc,'crane'); } }  // cable, still attached
      drawHelicopter(grid,mg,hr,hc);
    }
  }
  return {grid,mg};
}


function __m37_loop(){
if(phase==='simpsons'){
    scene.style.textShadow="0 0 8px #ffd90f";
    const maxR=Math.floor(COLS/2)-1;
    if(!simpStarted){ simpStarted=true; simpT=0; domeR=maxR; dropOffset=ROWS+Math.round(maxR*0.9)+8; heliFly=0; document.body.style.background="#0a0a02"; }
    const seated=dropOffset<=0;
    if(!seated){ dropOffset=Math.max(0, dropOffset-Math.max(1,Math.floor(ROWS/16))); }
    else { heliFly++; }
    const sealed=seated && heliFly>14;
    const {grid,mg}=simpsonsRender(domeR, dropOffset, heliFly, sealed);
    scene.innerHTML=paint(grid,mg,'city');
    if(!seated) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= !seated ? "HELICOPTERS LOWER THE DOME INTO PLACE"
                    : (!sealed ? "THE DOME IS SEATED — CHOPPERS PEEL AWAY" : "SPRINGFIELDIFIED — EVERYTHING IS YELLOW NOW");
    sub.style.color="#ffd90f"; sub.style.textShadow="0 0 8px #c89a00";
    simpT++;
    if(!(seated && heliFly>34)){ timer=setTimeout(loop,70); }
    else { phase='simpsons_hold'; loop(); }
  }else if(phase==='simpsons_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=simpsonsRender(domeR, 0, 999, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Springfield, sealed under glass and painted yellow. — press RESET"; sub.style.color="#ffd90f"; sub.className="";
    simpT++;
    timer=setTimeout(loop,150);
  }
}


function __m37_start(){
      // SPRINGFIELD YELLOW -> Simpsons
    attackMode='simpsons';
    cmd.style.color="#ffd90f"; cmd.style.textShadow="0 0 20px #c89a00";
    simpStarted=false; phase='simpsons';
  
}


function __m37_reset(){
  simpStarted=false; simpT=0; domeR=0; dropOffset=0; heliFly=0;
}


registerMethod(37, { start: __m37_start, resetFn: __m37_reset, loopFn: __m37_loop, phaseNames: ['simpsons', 'simpsons_hold'] });
