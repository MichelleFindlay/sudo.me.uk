let avpStarted=false, avpT=0, xenos=[], preds=[], plasma=[], acidPools=[], avpDmg=0;


// ---- ALIEN vs PREDATOR: Xenomorphs and Predators battle through the city ----
const xenoSprite=["<##==>","/VvvV\\"];       // elongated head + ridged body/tail
const predSprite=[" SMS "," (O) ","/|#|\\"];  // dreadlocks, masked head, armored body
function avpInit(){
  xenos=[]; preds=[]; plasma=[]; acidPools=[]; avpDmg=0;
  for(let i=0;i<6;i++){ xenos.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.7+Math.random()*1.0, ph:Math.random()*6, bleed:0 }); }
  for(let i=0;i<3;i++){ preds.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.35+Math.random()*0.4, cool:((Math.random()*20)|0), cloak:Math.random()<0.4 }); }
}
function avpStep(t){
  for(const x of xenos){ x.x+=x.spd*x.dir; x.ph+=0.5; if(x.bleed>0)x.bleed--; if(x.x<0)x.x=COLS; if(x.x>COLS)x.x=0; if(Math.random()<0.03)x.dir*=-1; }
  for(const p of preds){ p.x+=p.spd*p.dir; p.cool--; if(Math.random()<0.03){p.cloak=!p.cloak;} if(p.x<0)p.x=COLS; if(p.x>COLS)p.x=0;
    if(p.cool<=0){ p.cool=14+((Math.random()*20)|0);
      // fire a plasma bolt at the nearest xeno
      let tgt=xenos[(Math.random()*xenos.length)|0];
      if(tgt){ plasma.push({ x:p.x, y:streetRow-3, tx:tgt.x, ty:streetRow-1, s:0 }); }
    }
  }
  // advance plasma bolts; on hit, splatter acid (xeno bleeds) + scorch building
  for(const b of plasma){ b.s+=0.14; if(b.s>=1){ b.hit=true; acidPools.push({x:Math.round(b.tx), r:0, max:3+((Math.random()*3)|0)}); 
    for(const x of xenos){ if(Math.abs(x.x-b.tx)<3){ x.bleed=6; } } } }
  plasma=plasma.filter(b=>!b.hit);
  for(const a of acidPools){ a.r+=1; } acidPools=acidPools.filter(a=>a.r<=a.max+2);
  avpDmg=Math.min(COLS, avpDmg+ (t%3===0?1:0));
}
function avpRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // acid eats holes through the buildings + plasma scorches (permanent)
  for(const a of acidPools){ for(let r=streetRow;r>streetRow-a.r-2;r--){ for(let c=a.x-1;c<=a.x+1;c++){ if(c>=0&&c<COLS&&r>=0&&cityGridArr[r] && cityGridArr[r][c]!==" " && Math.random()<0.5){ let ln=cityGridArr[r].split(""); ln[c]=" "; cityGridArr[r]=ln.join(""); } } } }
  collapseCity(0.5);   // acid-eaten buildings collapse
  for(let r=0;r<ROWS;r++) grid[r]=cityGridArr[r];

  // dripping acid pools glowing on the ground
  for(const a of acidPools){ for(let dc=-a.r;dc<=a.r;dc++){ const c=a.x+dc; if(c<0||c>=COLS)continue; if(Math.random()<0.6){ setCh(grid,streetRow,c,(Math.random()<0.5?"~":"S")); setMode(mg,streetRow,c,'acid'); } if(Math.random()<0.3){ setCh(grid,streetRow-1,c,"~"); setMode(mg,streetRow-1,c,'acid'); } } }

  // plasma bolts streaking toward targets
  for(const b of plasma){ const c=Math.round(b.x+(b.tx-b.x)*b.s), r=Math.round(b.y+(b.ty-b.y)*b.s);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,(Math.random()<0.5?"*":"o")); setMode(mg,r,c,'plasma'); if(r-1>=0){ setCh(grid,r-1,c,"."); setMode(mg,r-1,c,'plasma'); } } }

  // Xenomorphs skittering along the street (bleeding acid when hit)
  const xr=streetRow-1;
  for(const x of xenos){ const xi=Math.round(x.x), bob=(Math.sin(x.ph)>0)?0:1;
    let spr = x.dir>0 ? xenoSprite : xenoSprite.map(s=>s.split("").reverse().join("").replace(/</g,'§').replace(/>/g,'<').replace(/§/g,'>'));
    for(let i=0;i<spr.length;i++){ const art=spr[i]; for(let j=0;j<art.length;j++){ const c=xi+j-2; if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,xr-bob+i-1,c,art[j]); setMode(mg,xr-bob+i-1,c,'xeno'); } }
    if(x.bleed>0){ setCh(grid,xr,xi,"S"); setMode(mg,xr,xi,'acid'); }   // acid blood spray
  }

  // Predators stalking — draw as translucent shimmer when cloaked, solid when firing
  for(const p of preds){ const pi=Math.round(p.x), ptop=streetRow-predSprite.length+1;
    if(p.cloak){ // cloak shimmer
      for(let i=0;i<predSprite.length;i++){ for(let j=0;j<predSprite[i].length;j++){ if(Math.random()<0.25){ const c=pi+j-2, r=ptop+i; if(c>=0&&c<COLS&&r>=0){ setCh(grid,r,c,(Math.random()<0.5?".":":")); setMode(mg,r,c,'predator'); } } } }
    } else {
      for(let i=0;i<predSprite.length;i++){ const art=predSprite[i]; for(let j=0;j<art.length;j++){ const c=pi+j-2, r=ptop+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'predator'); } }
      // shoulder cannon targeting laser (three red dots) toward a xeno
      setCh(grid,ptop,pi,"o"); setMode(mg,ptop,pi,'predator');
    }
  }
  return {grid,mg};
}


function __m35_loop(){
if(phase==='avp'){
    scene.style.textShadow="0 0 8px #5ad020";
    if(!avpStarted){ avpStarted=true; avpT=0; avpInit(); document.body.style.background="#060a06"; }
    stepRain();
    avpStep(avpT);
    const {grid,mg}=avpRender(avpT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(plasma.length>0||acidPools.length>2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= avpDmg<COLS*0.4 ? "XENOMORPHS SWARM — THE HUNTERS ARRIVE" : "WHOEVER WINS… THE CITY LOSES";
    sub.style.color="#8aff40"; sub.style.textShadow="0 0 8px #a02020";
    avpT++;
    if(!(avpDmg>=COLS && avpT>55)){ timer=setTimeout(loop,75); }
    else { phase='avp_hold'; loop(); }
  }else if(phase==='avp_hold'){
    stage.classList.remove('shake');
    avpStep(avpT);
    const {grid,mg}=avpRender(avpT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="melted by acid, hunted to ruins. — press RESET"; sub.style.color="#8aff40"; sub.className="";
    avpT++;
    timer=setTimeout(loop,140);
  }
}


function __m35_start(){
      // ACID GREEN -> Alien vs Predator
    attackMode='avp';
    cmd.style.color="#5ad020"; cmd.style.textShadow="0 0 20px #a02020";
    avpStarted=false; phase='avp';
  
}


function __m35_reset(){
  avpStarted=false; avpT=0; xenos=[]; preds=[]; plasma=[]; acidPools=[]; avpDmg=0;
}


registerMethod(35, { start: __m35_start, resetFn: __m35_reset, loopFn: __m35_loop, phaseNames: ['avp', 'avp_hold'] });
