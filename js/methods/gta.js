let gtaStarted=false, gtaT=0, gtaFiveT=0;


// ---- WANTED SYSTEM: GTA-style 1-5 star heat/pursuit escalation ----
// Self-contained: flip WANTED_ENABLED to false to disable heat tracking, pursuer
// spawning/rendering and the HUD without touching anything else in the sim.
// Public API: WantedSystem.onDestruction(amount), .getWantedLevel(), .setWantedLevel(n),
// .clearWanted(). Emits a 'wantedLevelChanged' CustomEvent on window whenever the star
// count changes, detail: {level, heat}, so UI/audio can react independently of this module.
const WANTED_ENABLED = true;
const WANTED_MAX_STARS = 5;
const WANTED_HEAT_PER_STAR = 100;
const WANTED_MAX_HEAT = WANTED_HEAT_PER_STAR * WANTED_MAX_STARS;
const WANTED_HEAT_PER_DESTRUCTION = 100;   // one full star per attack launched
const WANTED_DECAY_GRACE_MS = 5000;        // no decay for this long after the last destruction
const WANTED_DECAY_PER_SEC = 12;           // heat/sec lost once the grace period elapses

// how many of each pursuer type should be on-screen at each star level (index = level)
const WANTED_TIERS = [
  {patrol:0, swat:0, heli:0, tank:0},                        // 0 - clean
  {patrol:2, swat:0, heli:0, tank:0},                        // 1 - a couple of slow patrol cars
  {patrol:4, swat:0, heli:0, tank:0},                        // 2 - more units, faster, roadblocks
  {patrol:2, swat:3, heli:0, tank:0},                        // 3 - SWAT vans ram in
  {patrol:2, swat:3, heli:1, tank:0},                        // 4 - air support + spike strips
  {patrol:2, swat:3, heli:1, tank:2},                        // 5 - tanks roll in, citywide alert
];
// cruise speed in columns/sec, before any escalation multiplier
const WANTED_SPEED = {patrol:6, swat:10, heli:7, tank:3};

const patrolCarSprite=[
  " ___*___ ",
  "/_[PD]__\\",
  " (o)  (o)",
];
const swatVanSprite=[
  " _______ ",
  "|__SWAT*|",
  " (o)  (o)",
];
// tankSprite (5-star heavy response) and heliRotorFrames (4-star air support) are reused
// from the WAR method's assets, defined earlier in this file.

// the baddie: the reason all of the above is happening, dodging through the street
const baddieSprite=[
  " o ",
  "/|\\",
  "/ \\",
];
// reacts to the current star level (index 0..5), drawn above their head while on the run
const baddieLines=[
  "JUST GOTTA KEEP MOVING...",
  "THEY SPOTTED ME!",
  "ROADBLOCK AHEAD!",
  "SWAT?! REALLY?!",
  "IS THAT A HELICOPTER?!",
  "NOT TODAY, COPPERS!",
];
// once pinned at 5 stars, cycles through these instead
const gtaHoldLines=[
  "THIS IS FINE.",
  "I REGRET EVERYTHING.",
  "SOMEBODY CALL MY LAWYER!",
  "IS THAT A TANK?!",
];
function drawBaddie(grid, mg, t, text){
  const bx=cx+Math.round(Math.sin(t*0.25)*8), bTop=streetRow-baddieSprite.length+1, bBob=(Math.sin(t*0.5)>0)?0:1;
  for(let i=0;i<baddieSprite.length;i++){ const art=baddieSprite[i], r=bTop+i-bBob;
    for(let j=0;j<art.length;j++){ const c=bx+j-1; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'baddie'); } }
  const bagR=bTop-bBob, bagC=bx+2;
  if(bagR>=0&&bagR<ROWS&&bagC>=0&&bagC<COLS){ setCh(grid,bagR,bagC,"$"); setMode(mg,bagR,bagC,'baddie'); }
  if(text) mtDrawBubble(grid, mg, bx, bTop-bBob, text);
}

WantedSystem = {
  enabled: WANTED_ENABLED,
  heat: 0, level: 0,
  lastDestructionAt: 0, lastStepAt: 0, frame: 0, ramCooldown: 0, spikeStripX: -1,
  pursuers: { patrol:[], swat:[], heli:[], tank:[] },

  spawnUnit(type){
    const fromLeft = Math.random()<0.5;
    return { x: fromLeft ? -8-((Math.random()*20)|0) : COLS+8+((Math.random()*20)|0),
             spd: WANTED_SPEED[type] * (fromLeft?1:-1),
             y: type==='heli' ? 2+((Math.random()*3)|0) : 0,
             stopped:false };
  },
  syncToTier(){
    const tier=WANTED_TIERS[this.level];
    for(const type of ['patrol','swat','heli','tank']){
      const want=tier[type], have=this.pursuers[type];
      while(have.length<want) have.push(this.spawnUnit(type));
      if(have.length>want) this.pursuers[type]=have.slice(0,want);
    }
    if(this.level<4) this.spikeStripX=-1;
    else if(this.spikeStripX<0) this.spikeStripX=Math.max(4, Math.min(COLS-10, (Math.random()*COLS)|0));
  },
  updateHUD(){
    if(!wantedBox) return;
    wantedBox.textContent="★".repeat(this.level) + "☆".repeat(WANTED_MAX_STARS-this.level);
    wantedBox.classList.toggle('wanted-active', this.level>0);
    wantedBox.classList.toggle('wanted-pursuit', this.level>0);
    if(wantedAlert) wantedAlert.classList.toggle('on', this.level>=WANTED_MAX_STARS);
  },
  setLevel(n){
    const clamped=Math.max(0, Math.min(WANTED_MAX_STARS, n));
    if(clamped===this.level) return;
    this.level=clamped;
    this.syncToTier();
    this.updateHUD();
    window.dispatchEvent(new CustomEvent('wantedLevelChanged', {detail:{level:this.level, heat:this.heat}}));
  },
  recomputeLevel(){
    this.setLevel(Math.min(WANTED_MAX_STARS, Math.floor(this.heat/WANTED_HEAT_PER_STAR)));
  },

  // ---- public API ----
  onDestruction(amount){
    if(!this.enabled) return;
    const add=(typeof amount==='number' && amount>0) ? amount : WANTED_HEAT_PER_DESTRUCTION;
    this.lastDestructionAt=Date.now();
    this.heat=Math.min(WANTED_MAX_HEAT, this.heat+add);
    this.recomputeLevel();
  },
  getWantedLevel(){ return this.level; },
  setWantedLevel(n){
    const clamped=Math.max(0, Math.min(WANTED_MAX_STARS, n|0));
    this.heat=clamped*WANTED_HEAT_PER_STAR;
    this.lastDestructionAt=clamped>0 ? Date.now() : 0;
    this.recomputeLevel();
  },
  clearWanted(){
    const was=this.level;
    this.heat=0; this.lastDestructionAt=0; this.ramCooldown=0;
    this.pursuers={ patrol:[], swat:[], heli:[], tank:[] }; this.spikeStripX=-1;
    this.level=0;
    this.updateHUD();
    if(was!==0) window.dispatchEvent(new CustomEvent('wantedLevelChanged', {detail:{level:0, heat:0}}));
  },

  // ---- lifecycle hooks, called from reset()/loop()/paint() ----
  reset(){ this.clearWanted(); this.lastStepAt=0; this.frame=0; },
  step(){
    if(!this.enabled) return;
    const now=Date.now();
    const dt=this.lastStepAt ? Math.min(0.25,(now-this.lastStepAt)/1000) : 0.05;
    this.lastStepAt=now; this.frame++;
    if(this.heat>0 && (now-this.lastDestructionAt)>WANTED_DECAY_GRACE_MS){
      this.heat=Math.max(0, this.heat-WANTED_DECAY_PER_SEC*dt);
      this.recomputeLevel();
    }
    if(this.level===0) return;
    for(const car of this.pursuers.patrol){
      if(!car.stopped){ car.x+=car.spd*dt; if(Math.abs(car.x-cx)<5) car.stopped=true; }
    }
    for(const van of this.pursuers.swat){
      if(!van.stopped){ van.x+=van.spd*dt; if(Math.abs(van.x-cx)<6) van.stopped=true; }
      else if(this.ramCooldown<=0 && Math.random()<0.03){                 // aggressive ramming AI
        stage.classList.add('shake'); this.ramCooldown=1.2;
        setTimeout(()=>stage.classList.remove('shake'), 160);
      }
    }
    this.ramCooldown=Math.max(0, this.ramCooldown-dt);
    for(const h of this.pursuers.heli){                                  // sweeps back and forth overhead
      h.x+=h.spd*dt;
      if(h.x<-10){ h.x=-10; h.spd=Math.abs(h.spd); }
      else if(h.x>COLS+10){ h.x=COLS+10; h.spd=-Math.abs(h.spd); }
    }
    for(const tk of this.pursuers.tank){
      if(!tk.stopped){ tk.x+=tk.spd*dt; if(Math.abs(tk.x-cx)<10) tk.stopped=true; }
    }
  },
  render(grid, mg){
    if(!this.enabled || this.level===0 || typeof streetRow!=='number') return;
    const drawSprite=(spr,xi,topR)=>{
      for(let i=0;i<spr.length;i++){ const art=spr[i], r=topR+i;
        for(let k=0;k<art.length;k++){ const ch=art[k]; if(ch===" ")continue; const c=Math.round(xi)+k;
          if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,ch); setMode(mg,r,c,'wanted'); } }
    };
    const carTop=streetRow-patrolCarSprite.length+1;
    for(const car of this.pursuers.patrol) drawSprite(patrolCarSprite, car.x, carTop);
    const vanTop=streetRow-swatVanSprite.length+1;
    for(const van of this.pursuers.swat) drawSprite(swatVanSprite, van.x, vanTop);
    const tankTop=streetRow-tankSprite.length+1;
    for(const tk of this.pursuers.tank) drawSprite(tankSprite, tk.x, tankTop);
    for(const h of this.pursuers.heli){
      const xi=Math.round(h.x), r=h.y;
      const rotor=heliRotorFrames[this.frame%2];
      for(let j=0;j<rotor.length;j++){ const c=xi-1+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; setCh(grid,r,c,rotor[j]); setMode(mg,r,c,'wanted'); }
      const body="(POL)";
      for(let j=0;j<body.length;j++){ const c=xi-2+j; if(c<0||c>=COLS||r+1<0||r+1>=ROWS)continue; setCh(grid,r+1,c,body[j]); setMode(mg,r+1,c,'wanted'); }
      for(let rr=r+2; rr<streetRow; rr+=2){ if(rr<0||rr>=ROWS||xi<0||xi>=COLS)continue; setCh(grid,rr,xi,":"); setMode(mg,rr,xi,'wanted'); }
    }
    if(this.spikeStripX>=0 && grid[streetRow]){
      for(let k=0;k<6;k++){ const c=this.spikeStripX+k; if(c<0||c>=COLS)continue; setCh(grid,streetRow,c,"^"); setMode(mg,streetRow,c,'wanted'); }
    }
  },
};


function __m52_loop(){
if(phase==='gta'){
    // the only method that drives the wanted system — heat/pursuers stay dormant everywhere else
    scene.style.textShadow="0 0 10px #ff3030";
    if(!gtaStarted){ gtaStarted=true; gtaT=0; gtaFiveT=0; WantedSystem.reset(); document.body.style.background="#05060d"; }
    if(gtaT%30===0 && WantedSystem.getWantedLevel()<5) WantedSystem.onDestruction();   // another crime committed — slower burn than before
    const lvl=WantedSystem.getWantedLevel();
    stepRain();
    const g=renderCity(null,0);
    const mg=modeGridFill(ROWS,COLS,'city');
    drawRain(g,mg);
    stepTrain(); drawTrain(g,mg);
    stepPlanes(); drawPlanes(g);
    for(const p of planes){const xi=Math.round(p.x);for(let j=0;j<p.art.length;j++)if(p.art[j]!==" ")setMode(mg,p.y,xi+j,'plane');}
    drawBaddie(g, mg, gtaT, baddieLines[lvl]);
    scene.innerHTML=paint(g,mg,'city');
    sub.textContent=["THE RAMPAGE BEGINS…","1 STAR — PATROL CARS RESPOND","2 STARS — ROADBLOCKS GOING UP","3 STARS — SWAT MOVES IN","4 STARS — AIR SUPPORT INBOUND","5 STARS — CITYWIDE ALERT"][lvl];
    sub.style.color="#ff3030"; sub.style.textShadow="0 0 8px #ff3030";
    if(lvl>=3) stage.classList.add('shake'); else stage.classList.remove('shake');
    gtaT++;
    if(lvl>=5) gtaFiveT++; else gtaFiveT=0;
    if(gtaFiveT<40){ timer=setTimeout(loop,90); }
    else { phase='gta_hold'; gtaT=0; gtaFiveT=0; loop(); }
  }else if(phase==='gta_hold'){
    stage.classList.add('shake');
    WantedSystem.setWantedLevel(5);   // pinned at max — the chase never lets up
    stepRain();
    const g=renderCity(null,0);
    const mg=modeGridFill(ROWS,COLS,'city');
    drawRain(g,mg);
    stepTrain(); drawTrain(g,mg);
    drawBaddie(g, mg, gtaT, gtaHoldLines[Math.floor(gtaT/20)%gtaHoldLines.length]);
    scene.innerHTML=paint(g,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="five stars and climbing. good luck. — press RESET"; sub.style.color="#ff3030"; sub.className="";
    gtaT++;
    timer=setTimeout(loop,110);
  }
}


function __m52_start(){
      // POLICE RED -> GTA (the only method that drives the wanted system)
    attackMode='gta';
    cmd.style.color="#ff3030"; cmd.style.textShadow="0 0 20px #ff3030";
    gtaStarted=false; phase='gta';
    wantedBox.style.display='flex';
  
}


function __m52_reset(){
  gtaStarted=false; gtaT=0; gtaFiveT=0;
}


registerMethod(52, { start: __m52_start, resetFn: __m52_reset, loopFn: __m52_loop, phaseNames: ['gta', 'gta_hold'] });
