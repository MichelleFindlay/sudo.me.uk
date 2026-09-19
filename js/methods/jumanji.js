let jumStarted=false, jumT=0, jumPhase='board', vineH=[], beasts=[], jumGrowth=0;


// ---- JUMANJI: the jungle bursts out of the board game and overruns the city ----
const beastTypes=[
  { name:'elephant', spr:["  __/‾‾‾\\_ "," /  O    o \\","<##########>","  ||    ||  "], mode:'beast' },
  { name:'rhino',    spr:[" ^_______ ","/> O  ###  \\","<##########>"," ||    ||  "], mode:'beast' },
  { name:'lion',     spr:["  (VVV)   "," ( O O )> ","  <####>  ","  ||  ||  "], mode:'beast' },
  { name:'monkey',   spr:["  @  ","<(o)>"," /|\\ "], mode:'beast' },
];
function jumInit(){
  jumGrowth=0; beasts=[];
  vineH=new Array(COLS).fill(0);         // vine height climbing each column
}
function jumStep(t){
  jumGrowth=Math.min(1, jumGrowth+0.02);
  const vineMax=Math.floor(streetRow*0.45);   // vines only climb ~halfway up — keep the skyline visible
  // vines climb the buildings over time (only where there IS a building to climb)
  for(let c=0;c<COLS;c++){ if(Math.random()<0.22*jumGrowth) vineH[c]=Math.min(vineMax, vineH[c]+1); }
  // spawn stampeding beasts from either side
  if(t%7===0 && beasts.length<10){ const bt=beastTypes[(Math.random()*beastTypes.length)|0]; const fromLeft=Math.random()<0.5;
    beasts.push({ x: fromLeft?-12:COLS+12, dir:fromLeft?1:-1, spd:0.6+Math.random()*1.2, spr:bt.spr, ph:Math.random()*6, y: bt.spr.length }); }
  for(const b of beasts){ b.x+=b.spd*b.dir; b.ph+=0.4; }
  beasts=beasts.filter(b=> b.x>-16 && b.x<COLS+16);
}
function jumRender(t, mode){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ---- the glowing Jumanji board sitting in the street ----
  if(mode==='board' || jumGrowth<0.3){
    const bd=["|=========|","| J U M A N|","|=A N J I=*|","|_=======_|"];
    const bc=cx-5, bt=streetRow-bd.length;
    for(let i=0;i<bd.length;i++){ for(let j=0;j<bd[i].length;j++){ const c=bc+j, r=bt+i; if(c>=0&&c<COLS && bd[i][j]!==" "){ setCh(grid,r,c, bd[i][j]==="A"||bd[i][j]==="J"||"UMANI".includes(bd[i][j])?"J":bd[i][j]); setMode(mg,r,c,'board'); } } }
    // magic swirl above the board
    for(let k=0;k<COLS*0.06;k++){ const c=cx+(((Math.random()*16)|0)-8), r=bt-((Math.random()*4)|0); if(c>=0&&c<COLS&&r>=0){ setCh(grid,r,c,["*","+","."][(Math.random()*3)|0]); setMode(mg,r,c,'board'); } }
  }

  // ---- vines & jungle climbing over the buildings (kept low so skyline shows) ----
  if(mode!=='board'){
    for(let c=0;c<COLS;c++){ const h=vineH[c]; for(let k=0;k<h;k++){ const r=streetRow-k; if(r<0)break;
      if(Math.random()<0.3){ setCh(grid,r,c, ["|","(","S","j"][(Math.random()*4)|0]); setMode(mg,r,c,'jungle'); }
      // occasional leaf sprig (sparse)
      if(Math.random()<0.12){ const lc=c+(Math.random()<0.5?-1:1); if(lc>=0&&lc<COLS && grid[lc]&&grid[lc][r]===" ") { setCh(grid,r,lc,["Y","^","v"][(Math.random()*3)|0]); setMode(mg,r,lc,'jungle'); } }
    } }
    // a few big trees erupting through the street — shorter, so towers still poke above
    const nTrees=Math.max(2,Math.floor(COLS/28));
    for(let n=0;n<nTrees;n++){ const tc=((n+0.5)/nTrees*COLS)|0;
      const th=Math.floor(jumGrowth*streetRow*0.4);
      for(let k=0;k<th;k++){ setCh(grid,streetRow-k,tc,"H"); setMode(mg,streetRow-k,tc,'jungle'); }
      // small canopy (thinner)
      for(let dr=-1;dr<=1;dr++)for(let dc=-2;dc<=2;dc++){ const c=tc+dc, r=streetRow-th+dr; if(c>=0&&c<COLS&&r>=0 && Math.random()<0.4){ setCh(grid,r,c,["Y","^","V"][(Math.random()*3)|0]); setMode(mg,r,c,'jungle'); } }
    }
    // light monsoon rain in the lower sky only (doesn't claim the whole sky)
    for(let k=0;k<COLS*0.12;k++){ const c=(Math.random()*COLS)|0, r=Math.floor(streetRow*0.4)+((Math.random()*Math.floor(streetRow*0.6))|0); if(grid[r] && grid[r][c]===" "){ setCh(grid,r,c,"/"); setMode(mg,r,c,'jungle'); } }
    // undergrowth on the street
    { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.25+jumGrowth*0.35) g[c]=["^","v","Y",","][(Math.random()*4)|0]; if("^vY,".includes(g[c])) setMode(mg,streetRow,c,'jungle'); } grid[streetRow]=g.join(""); }
  }

  // ---- stampeding animals ----
  for(const b of beasts){ const xi=Math.round(b.x); const bob=(Math.sin(b.ph)>0)?0:1; const top=streetRow-b.spr.length+1-bob;
    for(let i=0;i<b.spr.length;i++){ let art=b.spr[i]; if(b.dir<0) art=art.split("").reverse().join("").replace(/</g,'§').replace(/>/g,'<').replace(/§/g,'>');
      for(let j=0;j<art.length;j++){ const c=xi+j, r=top+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'beast'); } } }
  // a giant mosquito buzzing + pelican flying overhead
  { const mx=(t*3)%(COLS+10)-5; const mos="}{-o-}{"; for(let j=0;j<mos.length;j++){ const c=Math.round(mx)+j; if(c>=0&&c<COLS){ setCh(grid,3,c,mos[j]); setMode(mg,3,c,'beast'); } }
    const px=COLS-((t*2)%(COLS+10)); const pel="<\\=Q=/>"; for(let j=0;j<pel.length;j++){ const c=Math.round(px)+j; if(c>=0&&c<COLS){ setCh(grid,2,c,pel[j]); setMode(mg,2,c,'beast'); } } }
  return {grid,mg};
}


function __m31_loop(){
if(phase==='jumanji'){
    scene.style.textShadow="0 0 8px #4aa02a";
    if(!jumStarted){ jumStarted=true; jumT=0; jumPhase='board'; jumInit(); document.body.style.background="#0a0e04"; }
    stepRain();
    if(jumPhase==='board'){
      const {grid,mg}=jumRender(jumT,'board');
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="A GAME BOARD LIES IN THE STREET… THE DICE ARE ROLLED"; sub.style.color="#7ad04a"; sub.style.textShadow="0 0 8px #6a4a10";
      jumT++;
      if(jumT<14){ timer=setTimeout(loop,90); }
      else { jumPhase='jungle'; loop(); }
    }else if(jumPhase==='jungle'){
      jumStep(jumT);
      const {grid,mg}=jumRender(jumT,'jungle');
      scene.innerHTML=paint(grid,mg,'city');
      if(beasts.length>3) stage.classList.add('shake'); else stage.classList.remove('shake');
      sub.textContent= jumGrowth<0.6 ? "THE JUNGLE ESCAPES INTO THE CITY" : "A STAMPEDE TEARS THROUGH THE STREETS";
      sub.style.color="#7ad04a"; sub.style.textShadow="0 0 8px #6a4a10";
      jumT++;
      if(!(jumGrowth>=1 && jumT>60)){ timer=setTimeout(loop,80); }
      else { phase='jumanji_hold'; loop(); }
    }
  }else if(phase==='jumanji_hold'){
    stage.classList.remove('shake');
    jumStep(jumT);
    const {grid,mg}=jumRender(jumT,'jungle');
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is a jungle now. — press RESET"; sub.style.color="#7ad04a"; sub.className="";
    jumT++;
    timer=setTimeout(loop,140);
  }
}


function __m31_start(){
      // JUNGLE -> Jumanji
    attackMode='jumanji';
    cmd.style.color="#4aa02a"; cmd.style.textShadow="0 0 20px #6a4a10";
    jumStarted=false; phase='jumanji';
  
}


function __m31_reset(){
  jumStarted=false; jumT=0; jumPhase='board'; vineH=[]; beasts=[]; jumGrowth=0;
}


registerMethod(31, { start: __m31_start, resetFn: __m31_reset, loopFn: __m31_loop, phaseNames: ['jumanji', 'jumanji_hold'] });
