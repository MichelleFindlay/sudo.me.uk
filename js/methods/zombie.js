let zStarted=false, zT=0, zombies=[], zDmg=0;


// ---- zombie horde: undead pour in and overrun the city ----
// A single zombie is 2 rows tall: head + shambling body. They crowd the street, several deep.
const zHeads=["O","o","@","x"];
const zBodies=["/|\\","<|>","\\|/","/|>"];
const zLegs=["/ \\","/\\ "," /\\","^ ^"];
function zombieInit(){
  zombies=[]; zDmg=0;
  // seed a few walkers coming from both edges
  const n=6+((Math.random()*6)|0);
  for(let i=0;i<n;i++){
    const fromLeft=Math.random()<0.5;
    zombies.push({
      x: fromLeft ? -((Math.random()*20)|0) : COLS+((Math.random()*20)|0),
      dir: fromLeft?1:-1,
      spd: 0.4+Math.random()*0.7,
      lane: (Math.random()*3)|0,            // depth 0..2 => vertical offset at street
      head: zHeads[(Math.random()*zHeads.length)|0],
      body: zBodies[(Math.random()*zBodies.length)|0],
      phase: Math.random()*6
    });
  }
}
function zombieStep(t){
  // advance shamblers; horde thickens over time
  for(const z of zombies){ z.x += z.spd*z.dir; z.phase+=0.4; }
  // spawn more from the edges as the outbreak grows
  if(t%3===0 && zombies.length < COLS*0.9){
    const fromLeft=Math.random()<0.5;
    zombies.push({ x: fromLeft?-2:COLS+2, dir:fromLeft?1:-1, spd:0.4+Math.random()*0.7,
      lane:(Math.random()*3)|0, head:zHeads[(Math.random()*zHeads.length)|0],
      body:zBodies[(Math.random()*zBodies.length)|0], phase:Math.random()*6 });
  }
  // infection front: how far in from each side the city is overrun (buildings fall)
  zDmg=Math.min(cx+2, zDmg + (t%2===0?1:0));
}
function zombieRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // overrun zone: near both edges up to zDmg, buildings crumble + blood splatter
  const leftEdge=zDmg, rightEdge=COLS-1-zDmg;
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      const overrun = (c<=leftEdge || c>=rightEdge);
      if(overrun && line[c]!==" " && Math.random()<0.4){ line[c]=" "; }         // building torn down
    }
    grid[r]=line.join("");
  }
  // blood on the street in overrun areas
  {
    let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){
      if((c<=leftEdge||c>=rightEdge) && Math.random()<0.25){ g[c]=(Math.random()<0.5?"x":","); setMode(mg,streetRow,c,'blood'); }
    }
    grid[streetRow]=g.join("");
  }

  // draw the horde: each zombie head just above street, body/legs on street rows
  const baseRow=streetRow-1;
  for(const z of zombies){
    const xi=Math.round(z.x);
    const bob=(Math.sin(z.phase)>0)?0:1;                 // shamble bob
    const hr=baseRow-2-z.lane+bob;                       // head row (lane gives depth stacking)
    const br=hr+1;                                       // body row
    const lr=hr+2;                                       // legs row
    // head
    if(xi>=0&&xi<COLS){ setCh(grid,hr,xi,z.head); setMode(mg,hr,xi,'zombie'); }
    // body (3 wide, centred)
    for(let j=-1;j<=1;j++){ const c=xi+j; if(c>=0&&c<COLS){ setCh(grid,br,c,z.body[j+1]); setMode(mg,br,c,'zombie'); } }
    // legs
    const legs=zLegs[((Math.floor(z.phase)%zLegs.length)+zLegs.length)%zLegs.length];
    for(let j=-1;j<=1;j++){ const c=xi+j; if(c>=0&&c<COLS && lr>=0 && lr<ROWS && legs[j+1]!==" "){ setCh(grid,lr,c,legs[j+1]); setMode(mg,lr,c,'zombie'); } }
  }

  // occasional "BRAINS…" groan floating up
  if(t%14<2){
    const msg="BRAINS...";
    const startC=cx-Math.floor(msg.length/2);
    for(let j=0;j<msg.length;j++){ const c=startC+j; if(c>=0&&c<COLS){ setCh(grid,3,c,msg[j]); setMode(mg,3,c,'zombie'); } }
  }
  return {grid,mg};
}


function __m7_loop(){
if(phase==='zombie'){
    scene.style.textShadow="0 0 8px #7a8c2a";
    if(!zStarted){ zStarted=true; zT=0; zombieInit(); document.body.style.background="#0a0c05"; }
    stepRain();
    zombieStep(zT);
    const {grid,mg}=zombieRender(zT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(zDmg>cx*0.5) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = zDmg<cx*0.5 ? "THE DEAD ARE RISING…" : "THE HORDE OVERRUNS THE CITY";
    sub.style.color="#9caf3a"; sub.style.textShadow="0 0 8px #4a5a14";
    zT++;
    if(!(zDmg>=cx+2 && zT>40)){ timer=setTimeout(loop,80); }
    else { phase='zombie_hold'; loop(); }
  }else if(phase==='zombie_hold'){
    stage.classList.remove('shake');
    zombieStep(zT);
    const {grid,mg}=zombieRender(zT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city belongs to the dead. — press RESET"; sub.style.color="#9caf3a"; sub.className="";
    zT++;
    timer=setTimeout(loop,140);
  }
}


function __m7_start(){
       // ZOMBIE GREEN -> the horde
    attackMode='zombie';
    cmd.style.color="#7a8c2a"; cmd.style.textShadow="0 0 20px #4a5a14";
    zStarted=false; phase='zombie';
  
}


function __m7_reset(){
  zStarted=false; zT=0; zombies=[]; zDmg=0;
}


registerMethod(7, { start: __m7_start, resetFn: __m7_reset, loopFn: __m7_loop, phaseNames: ['zombie', 'zombie_hold'] });
