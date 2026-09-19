// ---- NUKE: the classic red-button mushroom cloud ----



function __m0_loop(){
if(phase==='fall'){
    const g=renderCity(bombRow,0);
    stepRain();
    const mg=modeGridFill(ROWS,COLS,'city');
    drawRain(g,mg);
    stepTrain(); drawTrain(g,mg);           // moving subway train
    stepPlanes(); drawPlanes(g);
    for(const p of planes){const xi=Math.round(p.x);for(let j=0;j<p.art.length;j++)if(p.art[j]!==" ")setMode(mg,p.y,xi+j,'plane');}
    for(let i=0;i<bomb.length;i++)for(let j=0;j<bomb[i].length;j++)if(bomb[i][j]!==" ")setMode(mg,bombRow+i,cx-1+j,'bomb');
    scene.innerHTML=paint(g,mg,'city');
    sub.textContent="INCOMING"+".".repeat((bombRow%3)+1);
    bombRow+=Math.max(1,Math.floor(ROWS/14));
    if(bombRow>=ROWS-6)phase='flash';
    timer=setTimeout(loop,110);
  }else if(phase==='flash'){
    flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
    document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="";
    stage.classList.add('shake');
    timer=setTimeout(()=>{flash.style.transition="opacity 2s"; flash.style.opacity=0;
      document.body.style.background="#140806"; phase='wave'; loop();},200);
  }else if(phase==='wave'){
    scene.style.textShadow="0 0 12px #f80";
    dmg=Math.min(maxDmg(),dmg+Math.max(3,Math.floor(COLS/14)));
    const cg=renderCity(null,dmg);
    const mc=mushroom(Math.floor(dmg/4),dmg);
    const merged=[]; const mg=modeGridFill(ROWS,COLS,'city');
    for(let i=0;i<ROWS;i++){
      const a=cg[i]||"", b=mc[i]||""; let o="";
      for(let c=0;c<COLS;c++){
        const bc=b[c]||" ";
        if(bc!==" "){o+=bc; setMode(mg,i,c,'fire');}
        else o+=(a[c]||" ");
      }
      merged.push(o);
    }
    scene.innerHTML=paint(merged,mg,'city');
    sub.textContent="SHOCKWAVE EXPANDING >>>";
    if(dmg>=maxDmg()){phase='blast'; mt=Math.floor(dmg/4);}
    timer=setTimeout(loop,65);
  }else if(phase==='blast'){
    scene.style.textShadow="0 0 12px #f80";
    const g=mushroom(mt);
    scene.innerHTML=paint(g,null,'fire');
    sub.textContent="TASK FAILED SUCCESSFULLY"; mt++;
    if(mt<ROWS+6){timer=setTimeout(loop,90);}
    else{stage.classList.remove('shake');
      cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
      sub.textContent="everything is gone. — press RESET"; sub.style.color="#0f0"; sub.className="";
      phase='hold'; mt=ROWS+6; loop();}
  }
}


function __m0_start(){
                        // RED -> nuke
    attackMode='nuke';
    cmd.style.color="#f00"; cmd.style.textShadow="0 0 20px #f00";
    phase='fall';
  
}


function __m0_reset(){

}


registerMethod(0, { start: __m0_start, resetFn: __m0_reset, loopFn: __m0_loop, phaseNames: ['fall', 'flash', 'wave', 'blast'] });
