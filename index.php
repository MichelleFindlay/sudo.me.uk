<?php
// ---- version & update check ----
$VERSION = '1.2.0';
$GITHUB_REPO = 'MichelleFindlay/sudo.me.uk';
$CACHE_FILE = sys_get_temp_dir() . '/sudo_me_uk_version_cache.json';
$CACHE_TTL = 3600; // seconds — don't hammer the GitHub API on every page load

function fetchLatestGithubVersion($repo) {
    $url = "https://api.github.com/repos/{$repo}/releases/latest";
    $context = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'header'  => "User-Agent: sudo.me.uk-version-check\r\nAccept: application/vnd.github+json\r\n",
            'timeout' => 3,
        ],
    ]);
    $response = @file_get_contents($url, false, $context);
    if ($response === false) return null;
    $data = json_decode($response, true);
    if (!isset($data['tag_name'])) return null;
    return ltrim($data['tag_name'], 'vV');
}

function getLatestVersion($repo, $cacheFile, $ttl) {
    $cached = null;
    if (is_readable($cacheFile)) {
        $cached = json_decode((string)@file_get_contents($cacheFile), true);
        if (is_array($cached) && isset($cached['fetched_at'], $cached['version']) && (time() - $cached['fetched_at']) < $ttl) {
            return $cached['version'];
        }
    }
    $latest = fetchLatestGithubVersion($repo);
    if ($latest !== null) {
        @file_put_contents($cacheFile, json_encode(['version' => $latest, 'fetched_at' => time()]));
        return $latest;
    }
    // GitHub unreachable — fall back to a stale cache rather than showing nothing
    return (is_array($cached) && isset($cached['version'])) ? $cached['version'] : null;
}

$latestVersion = getLatestVersion($GITHUB_REPO, $CACHE_FILE, $CACHE_TTL);
// red whenever we can't positively confirm this build matches a published release —
// either a newer one exists, or there's no release published at all yet
$updateAvailable = $latestVersion === null || version_compare($latestVersion, $VERSION, '>');
$updateTitle = $latestVersion === null
    ? 'No published release found on GitHub — unable to verify this is up to date.'
    : "A newer version (v{$latestVersion}) is available on GitHub — go update!";
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>sudo rm -rf /* v<?= htmlspecialchars($VERSION) ?></title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; padding: 0; background: #000;
    height: 100%; height: 100dvh; width: 100%;
    overflow: hidden; font-family: "Courier New", monospace;
    -webkit-user-select: none; user-select: none;
    touch-action: manipulation; overscroll-behavior: none;
  }
  #stage { position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: flex-end; }
  #scene { margin: 0; line-height: 1; white-space: pre; font-size: var(--fs, 12px);
    color: #9ad; text-shadow: none; width: 100%; text-align: center;
    flex: 1 1 auto; display: block; overflow: hidden; }
  #cmd { font-size: clamp(28px,7vw,84px); color:#f00; text-shadow:0 0 18px #f00;
    letter-spacing:4px; padding:12px 0; font-weight:bold; }
  #methodBox { border:1px solid #4a5568; border-radius:8px; padding:8px 14px;
    margin:0 6px 6px; background:rgba(10,14,22,0.72); text-align:center;
    box-shadow:0 0 14px rgba(0,0,0,.5); max-width:min(960px, 96vw);
    max-height:52vh; overflow-y:auto; -webkit-overflow-scrolling:touch;
    scrollbar-width:thin; scrollbar-color:#3a4658 transparent; }
  #methodBox::-webkit-scrollbar { width:6px; }
  #methodBox::-webkit-scrollbar-track { background:transparent; }
  #methodBox::-webkit-scrollbar-thumb { background:#3a4658; border-radius:3px; }
  #methodBox::-webkit-scrollbar-thumb:hover { background:#556680; }
  #methodBox .mbTitle { font-size:clamp(10px,2.4vw,16px); letter-spacing:2px;
    color:#c7d2e0; text-shadow:0 0 6px #38507a; margin-bottom:6px; }
  #methodBox .mbList { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:6px 10px;
    font-size:clamp(12px,2.2vw,18px); letter-spacing:0.5px; font-weight:bold; justify-items:stretch; }
  #methodBox .pick { cursor:pointer; padding:7px 6px; border-radius:5px; transition:transform .1s;
    white-space:nowrap; text-align:center; overflow:hidden; text-overflow:ellipsis;
    border:1px solid rgba(255,255,255,0.06); }
  #methodBox .pick:hover { transform:scale(1.08); filter:brightness(1.4); text-decoration:underline; }
  #methodBox .pick:active { transform:scale(0.94); filter:brightness(1.6); }
  #methodBox .m-sep { color:#5a6472; margin:0 6px; }
  #methodBox .m-nuke { color:#ff5030; text-shadow:0 0 8px #f00; }
  #methodBox .m-wave { color:#22aaff; text-shadow:0 0 8px #22aaff; }
  #methodBox .m-ast  { color:#ffffff; text-shadow:0 0 8px #fff; }
  #methodBox .m-gz   { color:#a86a30; text-shadow:0 0 8px #7a4a1a; }
  #methodBox .m-nap  { color:#ff8c1a; text-shadow:0 0 8px #ff6a00; }
  #methodBox .m-sun  { background:linear-gradient(0deg,#ff2a00,#ff8c00,#ffd000,#fff6a0);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
    color:#ffd000; text-shadow:0 0 10px #ff6a00; }
  #methodBox .m-alien { color:#39ff14; text-shadow:0 0 8px #39ff14; }
  #methodBox .m-zombie { color:#9caf3a; text-shadow:0 0 8px #4a5a14; }
  #methodBox .m-locust { color:#d9b45a; text-shadow:0 0 8px #8a6a1a; }
  #methodBox .m-torn  { color:#cdd6e0; text-shadow:0 0 8px #7a8694; }
  #methodBox .m-quake { color:#c68a4a; text-shadow:0 0 8px #6a3a10; }
  #methodBox .m-volc  { color:#ff7a2a; text-shadow:0 0 8px #ff2a00; }
  #methodBox .m-riot  { color:#ff9a3a; text-shadow:0 0 8px #b04010; }
  #methodBox .m-crash { color:#e0e6ee; text-shadow:0 0 8px #99a; }
  #methodBox .m-toxic { color:#7fff4a; text-shadow:0 0 8px #2a8a10; }
  #methodBox .m-iss   { color:#8ad0ff; text-shadow:0 0 8px #2a6a9a; }
  #methodBox .m-shark { color:#5ae0d0; text-shadow:0 0 8px #1a7a6a; }
  #methodBox .m-sauron { color:#ff6a3a; text-shadow:0 0 8px #b01000; }
  #methodBox .m-freeze { color:#dff2ff; text-shadow:0 0 8px #6ab0e0; }
  #methodBox .m-thanos { color:#d090ff; text-shadow:0 0 8px #6a20a0; }
  #methodBox .m-inc   { color:#aa9aee; text-shadow:0 0 8px #4a3a8a; }
  #methodBox .m-drag  { color:#ffb050; text-shadow:0 0 8px #c04000; }
  #methodBox .m-ai    { color:#33ff88; text-shadow:0 0 8px #00aa44; }
  #methodBox .m-bttf  { color:#80e0ff; text-shadow:0 0 8px #a040ff; }
  #methodBox .m-steel { color:#7a9aff; text-shadow:0 0 8px #c02020; }
  #methodBox .m-dino  { color:#aae050; text-shadow:0 0 8px #3a6a10; }
  #methodBox .m-satan { color:#ff4020; text-shadow:0 0 8px #800000; }
  #methodBox .m-titanic { color:#8ac0e0; text-shadow:0 0 8px #103a5a; }
  #methodBox .m-jum   { color:#7ad04a; text-shadow:0 0 8px #6a4a10; }
  #methodBox .m-naut  { color:#c090ff; text-shadow:0 0 8px #2a8a7a; }
  #methodBox .m-emp   { color:#a0f0ff; text-shadow:0 0 8px #2080c0; }
  #methodBox .m-war   { color:#b0b060; text-shadow:0 0 8px #4a4a20; }
  #methodBox .m-ghost { color:#fafaf0; text-shadow:0 0 8px #e02020; }
  #methodBox .m-frozen { color:#c0f0ff; text-shadow:0 0 8px #4a90c0; }
  #methodBox .m-land  { color:#c08a50; text-shadow:0 0 8px #4a2a10; }
  #methodBox .m-avp   { color:#8aff40; text-shadow:0 0 8px #a02020; }
  #methodBox .m-mortal { color:#e0b030; text-shadow:0 0 8px #8a6a20; }
  #methodBox .m-simp  { color:#ffd90f; text-shadow:0 0 8px #c89a00; }
  #methodBox .m-emu   { color:#c89050; text-shadow:0 0 8px #6a4020; }
  #methodBox .m-neil  { color:#c8ccd0; text-shadow:0 0 8px #4a4e54; }
  #methodBox .m-kool  { color:#ff2a40; text-shadow:0 0 8px #a00010; }
  #methodBox .m-goo   { color:#b8c4cc; text-shadow:0 0 8px #5a6068; }
  #methodBox .m-mine  { color:#6a8ad0; text-shadow:0 0 8px #203050; }
  #methodBox .m-triff { color:#7ad07a; text-shadow:0 0 8px #2a5a2a; }
  /* animated flame gradient text (for the SUN command) */
  .flametext { background:linear-gradient(0deg,#c81400,#ff2a00,#ff8c00,#ffd000,#fff6a0);
    background-size:100% 300%; -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent; color:#ffb000;
    filter:drop-shadow(0 0 16px #ff5a00); animation:flameShift 0.8s linear infinite; }
  @keyframes flameShift { 0%{background-position:50% 0%;} 100%{background-position:50% 300%;} }
  #sub { font-size: clamp(11px,2.5vw,22px); color:#ff0; text-shadow:0 0 8px #ff0; padding-bottom:14px; }
  .blink { animation: blink 0.55s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .shake { animation: shake 0.08s infinite; }
  @keyframes shake {
    0%{transform:translate(2px,1px)} 25%{transform:translate(-2px,-1px)}
    50%{transform:translate(1px,-2px)} 75%{transform:translate(-1px,2px)}
    100%{transform:translate(2px,-1px)} }
  #flash { position:absolute; inset:0; background:#fff; opacity:0; pointer-events:none; }
  #topBar { position:absolute; top:max(10px, env(safe-area-inset-top)); right:max(10px, env(safe-area-inset-right)); z-index:10;
    display:flex; align-items:center; gap:8px; }
  #versionBox { background:#111; color:#0f0; border:1px solid #0f0; font-family:"Courier New",monospace;
    font-size:14px; padding:10px 12px; min-height:40px; display:flex; align-items:center;
    text-shadow:0 0 6px #0f0; box-shadow:0 0 10px rgba(0,255,0,.3); border-radius:5px; opacity:0.85; }
  #versionBox.update-needed { background:#2a0505; color:#ff4040; border-color:#ff4040;
    text-shadow:0 0 8px #ff4040; box-shadow:0 0 12px rgba(255,0,0,.5); opacity:1; cursor:help; }
  #githubBtn { background:#111; color:#0f0; border:1px solid #0f0;
    min-height:40px; min-width:40px; padding:8px; display:flex; align-items:center; justify-content:center;
    box-shadow:0 0 10px rgba(0,255,0,.3); border-radius:5px; touch-action:manipulation; }
  #githubBtn svg { width:20px; height:20px; fill:currentColor; filter:drop-shadow(0 0 4px #0f0); }
  #githubBtn:hover { background:#0f0; color:#000; }
  #githubBtn:active { background:#0f0; color:#000; transform:scale(0.94); }
  #resetBtn {
    background:#111; color:#0f0; border:1px solid #0f0; font-family:"Courier New",monospace;
    font-size:14px; padding:10px 16px; min-height:40px; cursor:pointer; text-shadow:0 0 6px #0f0;
    box-shadow:0 0 10px rgba(0,255,0,.3); border-radius:5px; touch-action:manipulation; }
  #resetBtn:hover { background:#0f0; color:#000; }
  #resetBtn:active { background:#0f0; color:#000; transform:scale(0.94); }
  #cmd, #sub { text-align:center; padding-left:8px; padding-right:8px; word-break:break-word; }
  #stage { padding-bottom:env(safe-area-inset-bottom); }

  /* ---- tablets / small landscape ---- */
  @media (max-width: 720px){
    #methodBox .mbList { grid-template-columns:repeat(3, minmax(0,1fr)); }
    #cmd { letter-spacing:2px; padding:8px 0; }
  }
  /* ---- phones (portrait) ---- */
  @media (max-width: 480px){
    #methodBox { padding:6px 6px; margin:0 4px 4px; max-height:58vh; }
    #methodBox .mbList { grid-template-columns:repeat(3, minmax(0,1fr)); gap:4px 4px; font-size:11px; }
    #methodBox .pick { padding:6px 2px; border-radius:4px; white-space:normal; line-height:1.15; }
    #methodBox .mbTitle { font-size:10px; letter-spacing:1px; margin-bottom:4px; }
    #cmd { font-size:clamp(20px,6.5vw,34px); letter-spacing:1px; padding:5px 0; }
    #sub { font-size:11px; padding-bottom:6px; }
    #resetBtn { font-size:12px; padding:8px 11px; min-height:36px; }
    #versionBox { font-size:12px; padding:8px 10px; min-height:36px; }
    #githubBtn { min-height:36px; min-width:36px; padding:6px; }
    #githubBtn svg { width:18px; height:18px; }
    #topBar { gap:6px; }
  }
  /* very narrow phones: shrink tile text a touch more */
  @media (max-width: 380px){
    #methodBox .mbList { font-size:10px; gap:3px 3px; }
    #methodBox .pick { padding:5px 1px; }
  }
  /* ---- very short landscape (keep picker from eating the scene) ---- */
  @media (max-height: 430px){
    #methodBox { max-height:56vh; padding:5px 8px; }
    #methodBox .mbList { grid-template-columns:repeat(6, minmax(0,1fr)); gap:3px 5px; font-size:11px; }
    #methodBox .pick { padding:5px 3px; }
    #cmd { padding:4px 0; }
  }
</style>
</head>
<body>
<div id="topBar">
  <a id="githubBtn" href="https://github.com/MichelleFindlay/sudo.me.uk" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
  </a>
  <div id="versionBox"<?php if ($updateAvailable): ?> class="update-needed" title="<?= htmlspecialchars($updateTitle) ?>"<?php endif; ?>>v<?= htmlspecialchars($VERSION) ?></div>
  <button id="resetBtn">&#8635; RESET</button>
</div>
<div id="stage">
  <pre id="scene"></pre>
  <div id="methodBox">
    <div class="mbTitle">PICK YOUR METHOD</div>
    <div class="mbList">
      <span class="m-nuke pick" data-method="0">Nuclear Bomb</span>
      <span class="m-wave pick" data-method="1">Tsunami</span>
      <span class="m-ast pick" data-method="2">Asteroid</span>
      <span class="m-gz pick" data-method="3">Godzilla</span>
      <span class="m-nap pick" data-method="4">Napalm</span>
      <span class="m-sun pick" data-method="5">The Sun</span>
      <span class="m-alien pick" data-method="6">Aliens</span>
      <span class="m-zombie pick" data-method="7">Zombies</span>
      <span class="m-locust pick" data-method="8">Locusts</span>
      <span class="m-torn pick" data-method="9">Tornado</span>
      <span class="m-quake pick" data-method="10">Earthquake</span>
      <span class="m-volc pick" data-method="11">Volcano</span>
      <span class="m-riot pick" data-method="12">Riots</span>
      <span class="m-crash pick" data-method="13">Air Crash</span>
      <span class="m-toxic pick" data-method="14">Toxic Waste</span>
      <span class="m-iss pick" data-method="15">ISS Crash</span>
      <span class="m-shark pick" data-method="16">Sharknado</span>
      <span class="m-sauron pick" data-method="17">Sauron</span>
      <span class="m-freeze pick" data-method="18">Snowpiercer</span>
      <span class="m-thanos pick" data-method="19">Thanos</span>
      <span class="m-inc pick" data-method="20">Inception</span>
      <span class="m-drag pick" data-method="21">Dragons</span>
      <span class="m-ai pick" data-method="22">AI Takeover</span>
      <span class="m-bttf pick" data-method="23">Back to Future</span>
      <span class="m-steel pick" data-method="24">Man of Steel</span>
      <span class="m-dino pick" data-method="25">Jurassic Park</span>
      <span class="m-satan pick" data-method="26">Satan</span>
      <span class="m-titanic pick" data-method="27">Titanic</span>
      <span class="m-jum pick" data-method="31">Jumanji</span>
      <span class="m-naut pick" data-method="28">Baldur's Gate</span>
      <span class="m-emp pick" data-method="29">EMP</span>
      <span class="m-war pick" data-method="30">War</span>
      <span class="m-ghost pick" data-method="32">Ghostbusters</span>
      <span class="m-frozen pick" data-method="33">Frozen</span>
      <span class="m-land pick" data-method="34">Landslide</span>
      <span class="m-avp pick" data-method="35">Alien vs Pred</span>
      <span class="m-mortal pick" data-method="36">Mortal Engines</span>
      <span class="m-simp pick" data-method="37">Simpsons</span>
      <span class="m-emu pick" data-method="38">Emu War</span>
      <span class="m-neil pick" data-method="39">Neil the Seal</span>
      <span class="m-kool pick" data-method="40">Kool-Aid</span>
      <span class="m-goo pick" data-method="41">Gray Goo</span>
      <span class="m-mine pick" data-method="42">Mine Turtle</span>
      <span class="m-triff pick" data-method="43">Triffids</span>
    </div>
  </div>
  <div id="cmd">sudo rm -rf /*</div>
  <div id="sub" class="blink">INCOMING...</div>
</div>
<div id="flash"></div>

<script>
const scene=document.getElementById('scene'),cmd=document.getElementById('cmd'),
      sub=document.getElementById('sub'),flash=document.getElementById('flash'),
      stage=document.getElementById('stage'),root=document.documentElement,
      methodBox=document.getElementById('methodBox');

let COLS,ROWS,cx;
function vpW(){ return (window.visualViewport && window.visualViewport.width) || window.innerWidth; }
function vpH(){ return (window.visualViewport && window.visualViewport.height) || window.innerHeight; }
function resize(){
  const W=vpW(), H=vpH();
  // aim for a char cell ~7-9px wide; more columns on wide screens, fewer (but not too few) on phones
  const cell = W < 480 ? 6.2 : (W < 900 ? 7.5 : 8.5);
  COLS = Math.max(64, Math.min(240, Math.floor(W / cell)));
  const fs = Math.max(5, (W / COLS) / 0.6);
  root.style.setProperty('--fs', fs+'px');
  // leave room for the picker + command line: less scene height on short/portrait screens
  const sceneFrac = (H < 560 || H < W*0.9) ? 0.62 : 0.72;
  ROWS = Math.max(22, Math.floor((H * sceneFrac) / fs));
  cx = Math.floor(COLS/2);
}
function doResize(){ resize(); }
window.addEventListener('resize', doResize);
window.addEventListener('orientationchange', ()=>{ setTimeout(doResize, 150); });
if(window.visualViewport){ window.visualViewport.addEventListener('resize', doResize); }
resize();


function blankGrid(rows){return Array.from({length:rows},()=>" ".repeat(COLS));}
function setCh(grid,r,c,ch){if(r>=0&&r<grid.length&&c>=0&&c<COLS)grid[r]=grid[r].substring(0,c)+ch+grid[r].substring(c+1);}

// ---- color mapping: char -> hex, depending on mode ----
function colorFor(ch,r,c,mode){
  if(ch===" ")return null;
  if(mode==='city'){
    // ---- underground elements (earthy / utility tones) ----
    if(ch==="\u00b7")return "#4a3a2a";                             // soil dots ·
    if(ch==="`")return "#5c4630";                                  // soil clumps
    if(ch==="\u2588")return "#2a2018";                             // bedrock █
    if(ch==="+")return "#8a8f99";                                  // rail ties
    if(ch==="o")return "#b8c0cc";                                  // pipe joints / train wheels
    if(ch==="H")return "#7a7f88";                                  // manhole shaft
    if(ch==="\u2248")return "#2e8b8b";                             // sewer water ≈
    // building lights & materials
    if(ch==="."||ch===":")return (r+c)%3===0?"#ffdd55":"#ffee88";  // lit windows (warm)
    if(ch==="|")return "#6b7fa3";                                   // walls (steel blue-grey)
    if(ch==="_")return "#55627a";                                   // floors/roofs
    if(ch==="/"||ch==="\\")return "#8fa5c8";                        // spires
    if(ch==="[" || ch==="]")return "#7d8fb0";
    if(ch==="=" )return "#89b0d0";
    if(ch==="-")return "#9aa0aa";                                   // pipe body
    if(ch==="#")return "#9fb3d6";
    if(ch==="^")return "#5a6472";                                   // street/pavement line
    if(ch==="~")return "#2e8b8b";                                   // sewer water flow
    return "#8090b0";
  }
  if(mode==='rain')return (c%2===0)?"#4da6ff":"#2f6fd0";            // blue rain
  if(mode==='plane')return "#e8eefc";                              // bright planes
  if(mode==='train')return (ch==="o")?"#ffcc33":"#ffd24a";        // lit train (amber windows/body)
  if(mode==='bomb')return "#ff3030";
  if(mode==='fire'){
    if(ch==="|")return "#c9c9d0";                                   // stem (smoke-grey)
    return (Math.random()<0.5)?"#ff9500":"#ff5722";                // cloud fire
  }
  if(mode==='rubble')return "#6b5540";
  if(mode==='xeno'){                                              // Xenomorph
    if(ch==="V"||ch==="v"||ch==="^"||ch==="/"||ch==="\\")return "#3a4a3a"; // ridged limbs/tail
    if(ch==="=")return "#c0c0c0";                              // metallic teeth
    if(ch==="#"||ch==="H")return "#101418";                    // elongated head
    return "#1a221e";                                          // black carapace
  }
  if(mode==='predator'){                                         // Predator
    if(ch==="o"||ch==="O")return "#c02020";                    // targeting laser / mask lights
    if(ch==="|"||ch==="/"||ch==="\\"||ch==="S")return "#6a5a3a"; // dreadlocks
    if(ch==="#"||ch==="M"||ch==="=")return "#7a6a4a";          // armor / mask
    return "#8a7a58";                                          // tan skin
  }
  if(mode==='plasma'){                                          // plasma caster bolts
    const rpl=Math.random();
    return rpl<0.4?"#e0f0ff":(rpl<0.7?"#40c0ff":"#a040ff");
  }
  if(mode==='acid'){                                            // Xenomorph acid blood
    const ra=Math.random();
    if(ch==="~"||ch==="S")return ra<0.5?"#aaff20":"#7ad010";   // dripping acid
    return (ra<0.5)?"#8aff30":"#5ad020";                       // acid green glow
  }
  if(mode==='landslide'){                                         // rock, mud, boulders
    const rl=Math.random();
    if(ch==="O"||ch==="0"||ch==="@")return rl<0.5?"#5a4028":"#6a4a2e"; // boulders
    if(ch==="#"||ch==="%")return "#7a5638";                     // rock mass
    if(ch==="~"||ch===".")return "#8a6a48";                     // mud/dust
    if(ch==="'"||ch==="*")return "#a88860";                     // debris spray
    return rl<0.5?"#6a4c30":"#7a5838";                          // earthy brown
  }
  if(mode==='frost'){                                             // ice encasing the city
    if(ch==="#"||ch==="=")return "#bfe8ff";
    if(ch==="/"||ch==="\\"||ch==="^"||ch==="V"||ch==="v")return "#9cd4f0";
    if(ch==="*"||ch==="+"||ch===".")return "#eafaff";           // frost sparkle
    return "#cfeeff";
  }
  if(mode==='castle'){                                            // Elsa's ice palace
    if(ch==="*"||ch==="+"||ch===".")return "#eafaff";           // glinting spires
    if(ch==="/"||ch==="\\"||ch==="^"||ch==="V")return "#a0dcf8";
    if(ch==="#"||ch==="|"||ch==="=")return "#7ec4ec";           // translucent ice walls
    return "#bfe8ff";
  }
  if(mode==='olaf'){                                              // Olaf the snowman
    if(ch==="o"||ch==="O")return "#2a2018";                     // coal eyes/buttons
    if(ch===">")return "#e08020";                              // carrot nose
    if(ch==="/"||ch==="\\"||ch==="Y")return "#6a4a2a";          // twig arms/hair
    return "#fbffff";                                          // snowy white
  }
  if(mode==='puft'){                                              // Stay Puft Marshmallow Man
    if(ch==="o"||ch==="O"||ch==="_")return "#3a3020";           // eyes/mouth
    if(ch==="^"||ch==="v"||ch==="=")return "#c02020";          // sailor hat/collar (red)
    if(ch==="~")return "#40a0e0";                              // sailor scarf (blue)
    return "#f4f0e4";                                          // marshmallow white
  }
  if(mode==='ghost'){                                            // ghosts & ectoplasm
    const rg2=Math.random();
    if(ch==="o"||ch==="O"||ch==="@")return "#e0f0d0";          // ghost eyes
    if(ch==="~"||ch==="S"||ch==="%")return rg2<0.5?"#8aff6a":"#40d060"; // slime/ectoplasm
    return (rg2<0.5)?"#c0f0ff":"#a0e0d0";                      // spectral glow
  }
  if(mode==='proton'){                                           // proton pack beams
    const rp2=Math.random();
    return rp2<0.4?"#ffe040":(rp2<0.7?"#ff4020":"#40e0ff");
  }
  if(mode==='slimer'){                                           // Slimer the green blob
    if(ch==="o"||ch==="O")return "#203010";                     // eyes
    if(ch==="V"||ch==="v")return "#c02020";                     // gaping red mouth
    if(ch==="@"||ch==="~")return "#6aff30";                     // slimy green blobs
    return "#8aff40";                                           // bright ghost green
  }
  if(mode==='ecto'){                                             // Ecto-1 car
    if(ch==="*"||ch==="!")return (Math.random()<0.5)?"#ff2020":"#40a0ff"; // roof light bar
    if(ch==="O"||ch==="o")return "#181818";                     // wheels
    if(ch==="=")return "#c0c0c8";                               // chrome
    return "#f0f0f4";                                           // white ambulance body
  }
  if(mode==='firehouse'){                                        // Ghostbusters HQ firehouse
    if(ch==="!")return "#ff2020";                              // NO-GHOST sign red
    if(ch==="#"||ch==="=")return "#8a4a3a";                     // brick
    if(ch==="H"||ch==="|")return "#6a3a2a";                     // arch / trim
    if(ch==="O"||ch==="o")return "#e0e0e0";                     // ghost logo / garage
    return "#7a4436";                                          // firehouse brick
  }
  if(mode==='jungle'){                                            // Jumanji overgrowth
    if(ch==="Y"||ch==="^"||ch==="V"||ch==="v"||ch==="*")return "#3a8a2a"; // leaves/fronds
    if(ch==="@"||ch==="O"||ch==="o")return "#c05030";           // jungle fruit/flowers
    if(ch==="|"||ch==="/"||ch==="\\"||ch==="S"||ch==="j"||ch==="(")return "#4a7a20"; // vines
    if(ch==="#"||ch==="H")return "#5a3a1a";                     // tree trunks
    return "#3a7a24";                                           // green foliage
  }
  if(mode==='beast'){                                             // stampeding animals
    if(ch==="O"||ch==="o"||ch==="@")return "#e0d0a0";           // eyes/tusks
    if(ch==="^"||ch==="Y"||ch==="v")return "#6a4a2a";           // ears/manes
    return "#7a5a38";                                           // hide
  }
  if(mode==='board'){                                            // the glowing game board
    if(ch==="J")return "#e0b020";                              // JUMANJI gold
    if(ch==="#"||ch==="=")return "#6a4a2a";                    // wooden board
    if(ch==="*"||ch==="+")return "#40e0a0";                    // magic glow
    return "#8a6a3a";
  }
  if(mode==='war'){                                               // military hardware
    if(ch==="O"||ch==="o"||ch==="@")return "#3a3a20";           // wheels/treads
    if(ch==="="||ch==="-"||ch==="#"||ch==="[" || ch==="]")return "#6a6a3a"; // hull/barrel
    if(ch==="^"||ch==="/"||ch==="\\"||ch==="<"||ch===">")return "#8a8a4a"; // jets
    return "#7a7a44";                                           // olive drab
  }
  if(mode==='warfire'){                                           // shells, tracers, explosions
    const rw2=Math.random();
    if(ch==="#"||ch==="@"||ch==="%")return rw2<0.4?"#ffe040":(rw2<0.7?"#ff8000":"#ff3000"); // blasts
    if(ch==="|"||ch==="."||ch===":"||ch==="*")return "#ffd060"; // tracer fire
    if(ch==="'"||ch===",")return "#5a5a52";                     // smoke
    return "#ff6a10";
  }
  if(mode==='emp'){                                               // electromagnetic pulse
    const re2=Math.random();
    if(ch==="*"||ch==="+"||ch==="x"||ch==="X")return re2<0.5?"#e0ffff":"#a0f0ff"; // sparks
    if(ch==="/"||ch==="\\"||ch==="|"||ch==="~"||ch==="z")return re2<0.5?"#80e0ff":"#40b0ff"; // lightning arcs
    if(ch===")"||ch==="("||ch===">"||ch==="<")return "#d0faff";  // pulse ring
    return "#a0f0ff";
  }
  if(mode==='dead'){                                              // powered-down dark city
    if(ch==="|"||ch==="_"||ch==="[" || ch==="]" || ch==="#")return "#2a3038"; // dark silhouettes
    return "#1e242c";
  }
  if(mode==='nautiloid'){                                         // the mind flayer ship
    if(ch==="@"||ch==="O"||ch==="o")return "#c0a0d0";           // fleshy nodules
    if(ch===")"||ch==="("||ch==="~"||ch==="S"||ch==="J")return "#8a5aa0"; // curling tentacles
    if(ch==="#"||ch==="=")return "#5a3a6a";                     // chitinous hull
    if(ch==="*"||ch==="."||ch==="+")return "#40e0c0";           // psionic glow
    return "#7a4a9a";                                           // purple-grey flesh
  }
  if(mode==='illithid'){                                          // portal / psionics / tadpoles
    const ri=Math.random();
    if(ch==="@"||ch==="O")return "#40ffd0";                    // portal core
    if(ch==="~"||ch==="S"||ch==="e")return ri<0.5?"#c060ff":"#40e0c0"; // tadpoles
    if(ch==="#"||ch==="%")return "#ff4a20";                    // hellfire (planar breach)
    return (ri<0.5)?"#a040e0":"#30d0b0";
  }
  if(mode==='ship'){                                              // the RMS Titanic
    if(ch==="|"||ch==="H")return "#2a2a2a";                     // black funnels
    if(ch==="=")return "#d0b040";                               // funnel bands (buff)
    if(ch===".")return "#ffe080";                               // portholes lit
    if(ch==="#"||ch==="_"||ch==="/"||ch==="\\")return "#1a1a22"; // black hull
    if(ch==="o"||ch==="O")return "#c0c8d0";                     // rivets / lifeboats
    return "#e8e8e8";                                           // white superstructure
  }
  if(mode==='steam'){                                            // funnel smoke
    return (Math.random()<0.5)?"#5a5a60":"#8a8a92";
  }
  if(mode==='domeglass'){                                         // the giant glass dome
    return (Math.random()<0.5)?"#bfe8ff":"#eaf8ff";
  }
  if(mode==='landmark'){                                          // the water tower & nuclear plant
    if(/[A-Za-z]/.test(ch))return "#8aff40";                     // glowing signage
    return "#9aa2ac";                                             // steel-grey structure
  }
  if(mode==='emu'){                                               // the unstoppable emu horde
    if(ch==="o")return "#8a9aa0";                                // small blue-grey head
    if(ch===">"||ch==="<")return "#2a2018";                      // beak
    if(ch==="("||ch===")"||ch==="_")return "#8a6a3a";            // fluffy feathered body
    return "#c89858";                                             // neck & legs
  }
  if(mode==='neil'){                                              // Neil the Seal
    if(ch==="o")return "#101214";                                // eye
    if(ch==="z"||ch==="Z")return "#9ad0ff";                       // contented little zzz
    return "#9aa2a8";                                             // grey seal body
  }
  if(mode==='cone'){                                              // the traffic cone
    if(ch==="-")return "#ffffff";                                 // reflective band
    return "#ff7a1a";                                             // safety orange
  }
  if(mode==='koolaid'){                                           // the Kool-Aid Man
    if(ch==="o"||ch==="^")return "#ffffff";                       // eyes
    if(ch===">"||ch==="-")return "#5a0808";                       // face features
    return "#e0102a";                                             // red pitcher body
  }
  if(mode==='koolaidburst'){                                      // OH YEAH! — shattered glass & spilled punch
    const rk=Math.random();
    if(rk<0.45) return "#e0102a";                                 // red punch
    if(rk<0.75) return "#ff5a70";                                 // splash highlight
    return "#eafcff";                                             // glass glint
  }
  if(mode==='goo'){                                               // settled grey-goo nanite mass
    return (Math.random()<0.5)?"#8a9098":"#5a6068";
  }
  if(mode==='goofront'){                                          // the consuming wavefront — brighter, more agitated
    const rg=Math.random();
    return rg<0.4?"#e8f0f4":(rg<0.7?"#b8c4cc":"#7a8890");
  }
  if(mode==='mine'){                                              // the mine turtle
    if(ch==="^")return "#2a2a2a";                                 // spikes
    if(ch==="o")return "#3a2a10";                                 // head & feet
    return "#3a7a30";                                             // shell
  }
  if(mode==='body'){                                              // do the flop
    if(ch==="o")return "#e8c090";                                 // head
    return (Math.random()<0.5)?"#4a6ab0":"#b04a4a";              // shirt, varied
  }
  if(mode==='speech'){                                            // speech bubble text
    return "#f0f0f0";
  }
  if(mode==='triffid'){                                           // the triffid stalks
    if(ch==="@")return "#a030a0";                                 // venomous bulb head
    return "#2a6a2a";                                             // sickly green stalk
  }
  if(mode==='triffidwhip'){                                       // the stinger lash
    return "#d0208a";
  }
  if(mode==='comet'){                                             // the blinding green meteor shower
    return (Math.random()<0.5)?"#c0ffa0":"#e8ffd0";
  }
  if(mode==='simpsons'){                                          // Springfield, sealed and painted up
    if(ch==="."||ch===":")return "#ffffff";                      // bright TV-glow windows
    if(ch==="|")return "#3a8fd9";                                 // Marge-blue walls
    if(ch==="_")return "#e4000f";                                 // red floors/roofs
    if(ch==="/"||ch==="\\")return "#ff8c19";                      // Bart/Lisa-orange spires
    if(ch==="="||ch==="#")return "#ffffff";                       // white trim
    return "#ffd90f";                                             // Simpsons yellow (everything else)
  }
  if(mode==='crane'){                                             // demolition cranes
    if(ch==="O"||ch==="o")return "#ffcc33";                     // hook / cab light
    return "#d0a020";                                           // yellow crane steelwork
  }
  if(mode==='traction'){                                          // the Traction City rig
    if(ch==="O"||ch==="o")return "#1a1a1a";                     // wheels/treads
    if(ch==="[" || ch==="]")return "#e0c060";                   // lit windows
    if(ch==="#"||ch==="_"||ch==="/"||ch==="\\"||ch==="|")return "#5a6068"; // steel hull
    return "#848c96";                                           // grey superstructure
  }
  if(mode==='hellfire'){                                          // the chasm & flames
    const rh2=Math.random();
    if(ch==="#"||ch==="@"||ch==="%")return rh2<0.4?"#ffd000":(rh2<0.7?"#ff6a00":"#ff2000");
    if(ch==="V"||ch==="\\"||ch==="/"||ch==="|")return "#8a0a00"; // chasm walls
    if(ch==="~"||ch==="\u2248")return (rh2<0.5)?"#ff3000":"#c01000"; // lava
    if(ch==="'"||ch==="."||ch==="*")return "#ff8040";           // embers
    return "#ff4010";
  }
  if(mode==='demon'){                                             // Satan's army
    if(ch==="O"||ch==="o"||ch==="@")return "#ff3020";           // burning eyes
    if(ch==="V"||ch==="v"||ch==="Y"||ch==="^")return "#5a0a0a"; // horns/wings
    if(ch==="/"||ch==="\\"||ch==="|"||ch==="T")return "#7a1010"; // spears/limbs
    return "#3a0808";                                           // dark demon bodies
  }
  if(mode==='satan'){                                             // the devil himself
    if(ch==="O"||ch==="o"||ch==="@")return "#ff4020";           // eyes
    if(ch==="V"||ch==="Y"||ch==="^"||ch==="W")return "#c00000"; // horns/wings
    if(ch==="#"||ch==="="||ch==="H")return "#2a0606";          // throne
    if(ch==="*"||ch==="+")return "#ffb020";                    // hellglow
    return "#8a0000";                                          // crimson body
  }
  if(mode==='dino'){                                              // roaming dinosaurs
    if(ch==="O"||ch==="o"||ch==="@")return "#ffd000";           // eye
    if(ch==="V"||ch==="v"||ch==="w"||ch==="W")return "#e8e0d0";  // teeth
    if(ch==="/"||ch==="\\"||ch==="^")return "#5a7a2a";          // spines/claws
    return "#6a9a3a";                                           // scaly green body
  }
  if(mode==='jpsign'){                                            // Jurassic Park / amphitheater
    if(ch==="J"||ch==="P")return "#e0b020";                     // JP logo gold
    if(ch==="#"||ch==="=")return "#c04020";                     // red banner
    if(ch==="|"||ch==="/"||ch==="\\")return "#8a6a4a";          // amphitheater timber
    return "#b09060";
  }
  if(mode==='worldengine'){                                       // Kryptonian terraforming rig
    const rw=Math.random();
    if(ch==="#"||ch==="H"||ch==="M"||ch==="W")return "#3a4a6a";  // black-alien machinery
    if(ch==="|"||ch==="="||ch==="/"||ch==="\\")return "#5a6a8a";
    if(ch==="@"||ch==="O"||ch==="o")return rw<0.5?"#80c0ff":"#c0e0ff"; // pulse core
    if(ch==="*"||ch==="."||ch===":")return "#a0d0ff";           // gravity particles
    return "#4a5a7a";
  }
  if(mode==='gravbeam'){                                          // the world-engine gravity beam
    const rb=Math.random();
    return rb<0.4?"#e0f0ff":(rb<0.7?"#80c0ff":"#4060d0");
  }
  if(mode==='krypton'){                                           // the super-brawlers
    if(ch==="S")return "#e02020";                               // the "S" / cape red
    if(ch==="O"||ch==="o")return "#f0e0d0";                     // heads
    if(ch==="#"||ch==="X"||ch==="x")return "#8090b0";
    return "#c0d0e0";
  }
  if(mode==='heatvision'){                                        // heat-vision beams
    return (Math.random()<0.5)?"#ff2000":"#ff8020";
  }
  if(mode==='era50s'){                                            // 1955 pastel town
    if(ch==="o"||ch==="O")return "#ff6a9a";                     // diner neon
    if(ch==="#"||ch==="=")return "#5aa0c0";                     // teal storefronts
    if(ch===".")return "#ffe080";                               // lit windows
    if(ch==="~")return "#b0a080";
    return "#8ab0c0";
  }
  if(mode==='era2015'){                                          // 2015 neon future
    const re=Math.random();
    if(ch==="=")return re<0.5?"#ff30d0":"#30d0ff";             // neon signage
    if(ch==="#"||ch==="|")return "#4a5a8a";                     // chrome towers
    if(ch==="o"||ch==="O"||ch==="@")return "#ffe030";          // hover glow
    if(ch==="^"||ch==="v"||ch==="<"||ch===">")return "#40ffd0"; // flying cars
    if(ch===".")return "#c0f0ff";
    return "#7a90d0";
  }
  if(mode==='hell'){                                            // 1985-A Hell Valley
    const rh=Math.random();
    if(ch==="#"||ch==="@"||ch==="%")return rh<0.5?"#ff3000":"#ff8000"; // fires
    if(ch==="="||ch==="|"||ch==="H")return "#3a2a2a";          // grimy towers
    if(ch==="$"||ch==="o"||ch==="O")return "#ffd000";          // BIFFCO casino gold
    if(ch==="'"||ch===".")return "#8a6a6a";                    // smoke
    return "#5a3a3a";
  }
  if(mode==='delorean'){                                          // the time machine
    if(ch==="o"||ch==="O")return "#1a1a20";                     // wheels
    if(ch==="="||ch==="#"||ch==="_"||ch==="\\"||ch==="/")return "#c8d0d8"; // stainless body
    return "#aab4be";
  }
  if(mode==='fluxfire'){                                          // the flaming time-travel trail
    const rf=Math.random();
    if(ch==="O"||ch==="o"||ch==="0")return rf<0.5?"#40d0ff":"#a040ff"; // flux blue/purple
    return (rf<0.4)?"#ffe040":(rf<0.7?"#ff8000":"#ff3000");     // fire trail
  }
  if(mode==='west'){                                             // old west town
    if(ch==="=")return "#4a3a2a";                               // rail ties / track
    if(ch===":")return "#6a5238";                               // rail spacing
    if(ch==="|"||ch==="H")return "#7a5a3a";                     // wood posts
    if(ch==="#"||ch==="/"||ch==="\\"||ch==="_")return "#8a6a4a"; // timber buildings
    if(ch==="["||ch==="]")return "#6a4a30";                     // window frames / shutters
    if(ch===".")return "#c8a860";                               // lit windows (lamplight)
    if(ch==="o"||ch==="O")return "#c04030";                     // saloon lamp / sign dot
    if(ch==="^")return "#3a6a3a";                               // cactus / brush
    if(ch==="Y"||ch==="T")return "#2a5a2a";                     // cactus arms / trees
    if(ch==="*"||ch==="+")return "#e8d090";                     // stars / sign sparkle
    if(ch==="~")return "#b89860";                               // dust / sand
    if(ch==="m"||ch==="n")return "#5a3a20";                     // horses/livestock
    return "#9a7a5a";                                           // dusty wood
  }
  if(mode==='fold'){                                              // Inception folding city
    if(ch==="#"||ch==="|"||ch==="=")return "#7a6ac0";
    if(ch==="/"||ch==="\\")return "#9a8ae0";
    if(ch==="."||ch==="*")return "#b0a0f0";
    return "#8a7ad0";
  }
  if(mode==='dragon'){                                            // dragon body
    if(ch==="V"||ch==="v"||ch==="<"||ch===">"||ch==="^")return "#3a2a1a"; // wings
    if(ch==="O"||ch==="o"||ch==="@")return "#ff3000";           // eye
    return "#2a1a10";                                           // dark scaly body
  }
  if(mode==='dragonfire'){                                        // dragon breath
    const rd=Math.random();
    if(ch==="#"||ch==="@"||ch==="%")return rd<0.4?"#ffe040":(rd<0.7?"#ff8000":"#ff3000");
    return (rd<0.5)?"#ff6000":"#ffaa20";
  }
  if(mode==='matrix'){                                            // AI takeover code rain
    if(ch==="_"||ch==="=")return "#00ff66";
    return (Math.random()<0.2)?"#aaffcc":"#00cc44";             // digital green
  }
  if(mode==='thanos'){                                            // the mad titan
    if(ch==="O"||ch==="o"||ch==="@")return "#a060d0";           // head
    if(ch==="M"||ch==="W"||ch==="#")return "#7a3aa0";           // armor
    return "#9050c0";                                           // purple body
  }
  if(mode==='gauntlet'){                                          // infinity gauntlet
    const rg=Math.random();
    return rg<0.2?"#ff3020":(rg<0.4?"#ffd000":(rg<0.6?"#40a0ff":(rg<0.8?"#a040ff":"#ff8000"))); // 6 stones glinting
  }
  if(mode==='hero'){                                              // the avengers
    if(ch==="o"||ch==="O")return "#e0e6ee";                     // heads
    if(ch==="/"||ch==="\\"||ch==="|"||ch==="+"||ch==="X")return "#c04030"; // gear
    return "#4a6a9a";
  }
  if(mode==='dust'){                                              // disintegration ash
    return (Math.random()<0.5)?"#8a6a9a":"#6a4a7a";
  }
  if(mode==='stark'){                                            // Stark Tower / Avengers HQ
    if(ch==="A")return "#e0e6ee";                               // the big "A"
    if(ch==="#"||ch==="H"||ch==="|")return "#5a6a80";           // glass tower
    if(ch==="=")return "#8090a8";
    return "#6a7a90";
  }
  if(mode==='tower'){                                             // Barad-dûr dark tower
    if(ch==="#"||ch==="|"||ch==="H"||ch==="/"||ch==="\\")return "#2a2028"; // black stone
    if(ch==="^"||ch==="V"||ch==="M")return "#1a1420";
    return "#2a2230";
  }
  if(mode==='eye'){                                               // the flaming Eye of Sauron
    const r9=Math.random();
    if(ch==="(" || ch===")")return "#ff2a00";                    // fiery lid
    if(ch==="@"||ch==="0"||ch==="O")return r9<0.5?"#ffd000":"#ff6a00"; // burning iris
    if(ch==="|"||ch==="I")return "#1a0a00";                      // slit pupil
    return "#ff4a00";
  }
  if(mode==='orc'){                                               // orc horde
    if(ch==="o"||ch==="O"||ch==="@")return "#4a5a3a";           // heads
    if(ch==="/"||ch==="\\"||ch==="|"||ch==="Y"||ch==="T")return "#6a5a2a"; // weapons/spears
    return "#3a4a2e";                                           // dark green-brown bodies
  }
  if(mode==='ice'){                                               // ice sheets over the city
    if(ch==="#"||ch==="=")return "#bfe6ff";
    if(ch==="/"||ch==="\\"||ch==="^"||ch==="V")return "#9ccef0";
    if(ch==="*"||ch==="+"||ch===".")return "#eaf6ff";           // frost sparkle
    return "#cfeaff";
  }
  if(mode==='snow'){                                              // falling snow / blizzard
    return (Math.random()<0.5)?"#ffffff":"#cfe8ff";
  }
  if(mode==='sptrain'){                                           // the Snowpiercer
    if(ch==="=")return "#3a4a5a";                               // track
    if(ch==="o"||ch==="O")return "#1a2430";                     // wheels
    if(ch==="["||ch==="]"||ch==="#")return "#8a95a4";           // cars
    if(ch==="@"||ch==="D")return "#d04030";                     // engine nose / lights
    return "#6a7686";
  }
  if(mode==='waterspout'){                                        // watery storm funnel
    if(ch==="~"||ch==="\u2248")return (Math.random()<0.5)?"#2a9aca":"#3ad0c0";
    if(ch==="/"||ch==="\\"||ch==="("||ch==="|")return (Math.random()<0.5)?"#4ad0d8":"#2a8ab0";
    if(ch==="@"||ch==="#"||ch==="0")return "#8aa0a8";            // debris
    return "#3ad0c0";
  }
  if(mode==='shark'){                                             // flying sharks
    if(ch==="v"||ch==="V"||ch==="^"||ch==="<"||ch===">")return "#5a7a88"; // fins/tail
    if(ch==="o"||ch==="O"||ch===".")return "#e8f0f4";           // eye
    if(ch==="w"||ch==="W"||ch==="x")return "#c0ccd0";           // teeth
    return "#7a95a0";                                           // grey body
  }
  if(mode==='riot'){                                              // rioting crowd
    if(ch==="o"||ch==="O"||ch==="@")return "#d0d8e0";           // heads
    if(ch==="/"||ch==="\\"||ch==="|"||ch==="!"||ch==="I")return "#c0863a"; // raised arms/signs/torches
    if(ch==="#"||ch==="@"||ch==="^")return (Math.random()<0.5)?"#ff6a00":"#ff9a3a"; // fires
    return "#b8bcc4";                                            // bodies
  }
  if(mode==='crashfire'){                                         // airliner + wreck fire
    if(ch==="=")return "#c8ced8";                               // fuselage
    if(ch==="<"||ch===">"||ch==="+"||ch==="X")return "#aab2be"; // wings/tail
    if(ch==="#"||ch==="@"||ch==="%")return (Math.random()<0.5)?"#ff3000":"#ff8000"; // fireball
    if(ch==="*"||ch==="'"||ch===".")return "#ffd070";
    return "#d0d6de";
  }
  if(mode==='toxic'){                                             // toxic waste sludge
    const r8=Math.random();
    if(ch==="O"||ch==="o"||ch==="\u00b0")return r8<0.5?"#aaff5a":"#7fff4a"; // bubbles
    if(ch==="~"||ch==="\u2248")return (r8<0.5)?"#5aae1a":"#7fdf2a";          // sludge surface
    if(ch==="\u2620"||ch==="x")return "#caff8a";
    return (r8<0.5)?"#6fcf2a":"#8fdf3a";
  }
  if(mode==='iss'){                                              // space station
    if(ch==="#"||ch==="@"||ch==="H"||ch==="=")return "#d0dae6";  // modules/hull
    if(ch==="["||ch==="]"||ch==="|")return "#4a6a9a";           // solar panels
    if(ch==="*"||ch==="'"||ch===".")return "#ff9a3a";           // reentry sparks
    return "#aeb8c6";
  }
  if(mode==='tornado'){                                           // funnel + flying debris
    if(ch==="@"||ch==="#"||ch==="0")return "#8a94a0";            // debris chunks
    if(ch==="/"||ch==="\\"||ch==="|"||ch==="(")return (Math.random()<0.5)?"#c0c8d4":"#98a2b0";
    return "#aab4c0";
  }
  if(mode==='quake'){                                             // cracks + collapse
    if(ch==="\\"||ch==="/"||ch==="V"||ch==="Y"||ch==="Z")return "#3a2412"; // fissures (dark)
    if(ch==="#"||ch==="@"||ch==="=")return "#8a5a2a";            // toppling rubble
    return "#a9743a";
  }
  if(mode==='lava'){                                              // volcanic
    const r7=Math.random();
    if(ch==="#"||ch==="@"||ch==="%")return r7<0.4?"#ffd000":(r7<0.7?"#ff6a00":"#ff2a00");
    if(ch==="*"||ch==="\u00b0"||ch==="'"||ch===".")return "#ffb060"; // sparks/ash
    if(ch==="~"||ch==="\u2248")return (r7<0.5)?"#ff4a00":"#ff7a10"; // flowing lava
    if(ch==="\u2588")return "#2a1408";                            // cooled crust
    return "#ff5a1a";
  }
  if(mode==='locust'){                                            // swarming insects
    const r6=Math.random();
    if(ch==="}"||ch==="{"||ch==="x"||ch==="X")return r6<0.5?"#d9b45a":"#b8862a"; // bodies
    if(ch==="`"||ch==="'"||ch===".")return "#8a6a1a";            // dust/frass
    return (r6<0.5)?"#c99a3a":"#a67c22";
  }
  if(mode==='zombie'){                                            // shambling undead
    if(ch==="O"||ch==="o"||ch==="@"||ch==="x"||ch==="X")return "#c0d040"; // heads (sickly)
    if(ch==="V"||ch==="v"||ch==="/"||ch==="\\"||ch==="|")return "#5a6a1e"; // limbs
    return "#7a8c2a";                                            // rotten green body
  }
  if(mode==='blood'){                                             // gore / infection spread
    return (Math.random()<0.5)?"#8a1010":"#5a0808";
  }
  if(mode==='ufo'){                                               // mothership hull
    if(ch==="o"||ch==="O"||ch==="0"||ch==="@")return (Math.random()<0.5)?"#39ff14":"#7fffa0"; // glowing lights
    if(ch==="="||ch==="-")return "#aab4c0";                       // hull rim
    return "#6a7580";                                             // metallic body
  }
  if(mode==='beam'){                                              // abduction / death ray
    const r5=Math.random();
    if(ch==="#"||ch==="@")return r5<0.5?"#39ff14":"#9dff5a";
    if(ch==="*"||ch==="\u00b0"||ch===".")return "#ccffb0";
    return (r5<0.5)?"#2ecc0f":"#39ff14";
  }
  if(mode==='sun'){                                               // swelling star surface
    const r4=Math.random();
    if(ch==="@"||ch==="#")return r4<0.4?"#fff2b0":(r4<0.7?"#ffd000":"#ff8c00");
    if(ch==="%"||ch==="&")return "#ff6a00";
    if(ch==="*"||ch==="\u00b0"||ch===".")return "#ffe8a0";       // flares/prominences
    return "#ffb000";
  }
  if(mode==='scorch'){                                            // charred, glowing earth
    if(ch==="\u2588")return "#1a0d06";
    if(ch==="^"||ch==="~")return (Math.random()<0.5)?"#5a1a00":"#8a2a00";
    if(ch==="#"||ch==="@")return (Math.random()<0.5)?"#ff3000":"#ff7a00";
    return "#3a1400";
  }
  if(mode==='napalm'){                                            // falling incendiary blobs
    return (Math.random()<0.5)?"#ff6a00":"#ffb020";
  }
  if(mode==='flames'){                                            // spreading ground fire
    const r3=Math.random();
    if(ch==="#"||ch==="@")return r3<0.5?"#ff3000":"#ff7a00";
    if(ch==="^"||ch==="A"||ch==="/"||ch==="\\")return r3<0.5?"#ff8c1a":"#ffc040";
    if(ch==="'"||ch==="\u00b0"||ch===".")return "#ffe08a";       // smoke/embers
    return "#ff5a00";
  }
  if(mode==='godzilla'){                                          // the big lizard
    if(ch==="V"||ch==="v"||ch==="^"||ch==="/"||ch==="\\")return "#3a5a2a"; // spines/claws
    if(ch==="O"||ch==="o"||ch==="@")return "#e33";               // eye / glow
    return "#2f4a24";                                            // scaly green-brown body
  }
  if(mode==='breath'){                                            // atomic breath ray
    return (Math.random()<0.5)?"#7fffd4":"#33e0ff";
  }
  if(mode==='asteroid'){                                          // flaming space rock
    if(ch==="@"||ch==="0"||ch==="O")return "#5a4a42";            // rocky body
    if(ch==="#"||ch==="%")return "#8a6a4a";
    return "#c9b8a8";
  }
  if(mode==='trail'){                                             // fiery tail
    return (Math.random()<0.5)?"#ffb020":"#ff5010";
  }
  if(mode==='impact'){                                            // blast / crater fire
    if(ch==="#"||ch==="@"||ch==="%")return (Math.random()<0.5)?"#ffdd55":"#ff7a1a";
    if(ch==="*"||ch==="\u00b0"||ch==="'")return "#ffcf7a";
    if(ch==="\u2588")return "#3a2a1a";                            // scorched crater floor
    return "#ff9030";
  }
  if(mode==='water'){                                             // tidal wave / flood
    if(ch==="#"||ch==="@")return "#dff3ff";                       // white foam crest
    if(ch==="*"||ch==="\u00b0")return "#bfe6ff";                  // spray
    if(ch==="~"||ch==="\u2248")return (Math.random()<0.5)?"#1e78d0":"#2e9bd8";
    return "#2b8fd6";
  }
  return "#cccccc";
}

// Build an HTML string from a char grid + a same-shape "mode grid".
// modeGrid[r][c] gives the palette mode for that cell; falls back to base.
function paint(grid, modeGrid, base){
  let out="";
  for(let r=0;r<grid.length;r++){
    const row=grid[r]||"", mrow=modeGrid?modeGrid[r]:null;
    let curColor=null, buf="";
    for(let c=0;c<row.length;c++){
      let ch=row[c];
      const mode=(mrow&&mrow[c])?mrow[c]:base;
      let col=colorFor(ch,r,c,mode);
      // escape html-sensitive chars
      if(ch==="<")ch="&lt;"; else if(ch===">")ch="&gt;"; else if(ch==="&")ch="&amp;";
      if(col!==curColor){
        if(buf) out+= curColor?`<span style="color:${curColor}">${buf}</span>`:buf;
        buf=ch; curColor=col;
      } else buf+=ch;
    }
    if(buf) out+= curColor?`<span style="color:${curColor}">${buf}</span>`:buf;
    out+="\n";
  }
  return out;
}
// helper: make a mode grid of the same size filled with a default, so callers can overlay
function modeGridFill(rows,cols,val){return Array.from({length:rows},()=>Array(cols).fill(val));}
function setMode(mg,r,c,v){if(mg&&r>=0&&r<mg.length&&mg[r]&&c>=0&&c<mg[r].length)mg[r][c]=v;}

// ---- varied skyline (NYC/London style) : returns full-height grid ----
let cityGridArr=[];      // the base city, full ROWS height
let streetRow=0;         // street level row (city above, underground below)
let rSubwayRow=0;        // subway rail row (for the moving train)
function buildCity(){
  const kinds=[
    {top:" /\\ ", w:4, min:14, max:26, ch:"[]"}, // spire skyscraper
    {top:" __ ", w:6, min:10, max:22, ch:"::"}, // tower block
    {top:"____", w:8, min:6,  max:16, ch:"[]"}, // wide office
    {top:" || ", w:5, min:12, max:24, ch:".."}, // antenna tower
    {top:".--.", w:6, min:5,  max:12, ch:"=="}, // stubby
    {top:"_/\\_",w:6, min:18, max:32, ch:"##"}, // super-tall
    {top:"____", w:4, min:3,  max:8,  ch:"[]"}, // low rise
  ];
  const H=ROWS;
  const UG=6;                       // underground rows reserved at the bottom
  streetRow=H-1-UG;                 // ground/street level line (module-level)
  const maxBuild=Math.min(streetRow-2, 30);
  const grid=blankGrid(H);
  let x=0;
  while(x<COLS){
    const k=kinds[(Math.random()*kinds.length)|0];
    const w=k.w, h=Math.min(maxBuild, k.min+((Math.random()*(k.max-k.min))|0));
    const topRow=streetRow-h;
    const roof=k.top.slice(0,w).padEnd(w,"_");
    for(let j=0;j<w;j++){const c=x+j; if(c>=COLS)break; if(roof[j]!==" ")setCh(grid,topRow,c,roof[j]);}
    for(let r=topRow+1;r<streetRow;r++){
      for(let j=0;j<w;j++){
        const c=x+j; if(c>=COLS)break;
        let ch;
        if(j===0||j===w-1)ch="|";
        else if((r+j)%2===0)ch=k.ch[0];
        else ch=" ";
        if(ch===k.ch[0]&&Math.random()<0.5)ch=Math.random()<0.5?".":":";
        if(ch!==" ")setCh(grid,r,c,ch);
      }
    }
    x+=w+((Math.random()<0.3)?1:0);
  }

  // ---- STREET LEVEL ----
  grid[streetRow]="^".repeat(COLS);                       // pavement / ground line
  // add a few street lamps & road markings just under street? keep simple

  // ---- UNDERGROUND LAYERS ----
  // layer offsets below street
  const rSubway = streetRow+2;   // subway tunnel
  const rPipes  = streetRow+4;   // utility pipes
  const rSewer  = streetRow+5;   // sewer channel
  rSubwayRow = rSubway;          // expose for the moving train sprite

  // soil fill between layers with dirt speckle
  for(let r=streetRow+1;r<H;r++){
    let line=grid[r].split("");
    for(let c=0;c<COLS;c++){
      if(line[c]===" ") line[c]= Math.random()<0.12 ? "`" : "\u00b7"; // soil clumps ` and dots ·
    }
    grid[r]=line.join("");
  }

  // subway tunnel: ceiling + rails (the train is drawn as a moving sprite per-frame)
  (function(){
    const top="_".repeat(COLS);
    let tube=new Array(COLS).fill("=");                    // rails
    setRow(grid,rSubway-1, top);                           // tunnel ceiling
    for(let c=0;c<COLS;c++){ if(tube[c]==="=" && c%3===0) tube[c]="+"; }  // ties
    grid[rSubway]=mergeRow(grid[rSubway],tube.join(""));
  })();

  // pipes: horizontal utility lines with joints, plus a couple of vertical drops
  (function(){
    let pipe=grid[rPipes].split("");
    for(let c=0;c<COLS;c++){
      pipe[c] = (c%8===0) ? "o" : (c%4===0 ? "=" : "-");   // pipe with joints (o) and flanges (=)
    }
    grid[rPipes]=pipe.join("");
    // vertical connectors from street down to pipes at a few spots
    for(let n=0;n<Math.max(2,Math.floor(COLS/40));n++){
      const c=6+((Math.random()*(COLS-12))|0);
      for(let r=streetRow+1;r<rPipes;r++) setCh(grid,r,c,"|");
    }
  })();

  // sewer: a water channel with flowing water and brick lining
  (function(){
    let sew=grid[rSewer].split("");
    for(let c=0;c<COLS;c++){
      sew[c] = (Math.random()<0.5) ? "~" : "\u2248";       // flowing water (~ ≈)
    }
    // brick edges
    sew[0]="]"; sew[COLS-1]="[";
    grid[rSewer]=sew.join("");
    // manhole shafts from street down into sewer occasionally
    for(let n=0;n<Math.max(1,Math.floor(COLS/60));n++){
      const c=10+((Math.random()*(COLS-20))|0);
      for(let r=streetRow+1;r<rSewer;r++) setCh(grid,r,c,"H");
    }
  })();

  grid[H-1]=mergeRow(grid[H-1], "\u2588".repeat(COLS));    // bedrock floor (solid ▓/█ base)
  return grid;
}

// write a full row (padded/truncated to COLS)
function setRow(grid,r,str){ if(r>=0&&r<grid.length) grid[r]=str.padEnd(COLS," ").slice(0,COLS); }
// overlay non-space chars of src onto base row
function mergeRow(base,src){
  base=(base||"").padEnd(COLS," "); src=(src||"").padEnd(COLS," ");
  let o=""; for(let c=0;c<COLS;c++){ o += (src[c]!==" ")?src[c]:base[c]; } return o;
}

function flickerLights(){
  if(cityGridArr.length!==ROWS)return;
  for(let n=0;n<COLS*0.6;n++){
    const c=(Math.random()*COLS)|0;
    const r=((Math.random()*Math.max(1,streetRow))|0);   // only above street
    if(!cityGridArr[r])continue;
    const ch=cityGridArr[r][c];
    if(ch==="."||ch===":"){ if(Math.random()<0.4) cityGridArr[r]=cityGridArr[r].substring(0,c)+" "+cityGridArr[r].substring(c+1); }
    else if(ch===" "){ // relight only if inside a building (neighbors are walls/floors)
      const left=cityGridArr[r][c-1]||" ", right=cityGridArr[r][c+1]||" ";
      const inBldg=(left==="|"||left==="."||left===":"||right==="|"||right==="."||right===":");
      if(inBldg&&Math.random()<0.25) cityGridArr[r]=cityGridArr[r].substring(0,c)+(Math.random()<0.5?".":":")+cityGridArr[r].substring(c+1);
    }
  }
}
const bomb=["_","(_)","/|\\","'|'"," V "];
function placeCentered(grid,art,topRow){
  const start=cx-1;
  for(let i=0;i<art.length;i++){const row=topRow+i; if(row<0||row>=grid.length)continue;
    for(let j=0;j<art[i].length;j++){if(art[i][j]!==" ")setCh(grid,row,start+j,art[i][j]);}}
}

// ---- planes drifting across the sky ----
const planeR=["___/\\___o>","_-=\\__o>","--o=>","<o>~~"];   // right-facing
const planeL=["<o___/\\___","<o__/=-_","<=o--","~~<o>"];    // left-facing
let planes=[];
function spawnPlanes(){
  planes=[];
  const n=2+((Math.random()*3)|0);
  for(let i=0;i<n;i++){
    const dir=Math.random()<0.5?1:-1;
    const art=(dir>0?planeR:planeL)[(Math.random()*planeR.length)|0];
    planes.push({
      x: dir>0 ? -art.length-((Math.random()*COLS)|0) : COLS+((Math.random()*COLS)|0),
      y: 1+((Math.random()*Math.max(2,Math.floor(ROWS*0.35)))|0),
      dir, art,
      spd: (0.6+Math.random()*1.6)*dir
    });
  }
}
function stepPlanes(){
  for(const p of planes){
    p.x+=p.spd;
    if(p.dir>0 && p.x>COLS+2){ p.x=-p.art.length-((Math.random()*40)|0); p.y=1+((Math.random()*Math.max(2,Math.floor(ROWS*0.35)))|0); }
    if(p.dir<0 && p.x<-p.art.length-2){ p.x=COLS+((Math.random()*40)|0); p.y=1+((Math.random()*Math.max(2,Math.floor(ROWS*0.35)))|0); }
  }
}
function drawPlanes(grid){
  for(const p of planes){
    const xi=Math.round(p.x);
    for(let j=0;j<p.art.length;j++){
      if(p.art[j]!==" ") setCh(grid,p.y,xi+j,p.art[j]);
    }
  }
}

// ---- blue rain (intro only) ----
let drops=[];
function spawnRain(){
  drops=[];
  const n=Math.floor(COLS*0.5);
  for(let i=0;i<n;i++){
    drops.push({x:(Math.random()*COLS)|0, y:(Math.random()*ROWS)|0, len:1+((Math.random()*3)|0), spd:1+((Math.random()*2)|0)});
  }
}
function stepRain(){
  for(const d of drops){
    d.y+=d.spd;
    if(d.y>ROWS+d.len){ d.y=-((Math.random()*4)|0); d.x=(Math.random()*COLS)|0; }
  }
}
// draw rain into char+mode grids, but don't overwrite solid city cells
function drawRain(grid,mg){
  for(const d of drops){
    for(let k=0;k<d.len;k++){
      const r=Math.round(d.y)-k, c=d.x;
      if(r<0||r>=ROWS||c<0||c>=COLS)continue;
      if(!grid[r]||grid[r][c]!==" ")continue;         // rain falls behind buildings/planes
      setCh(grid,r,c, k===0?"'":"|");
      setMode(mg,r,c,'rain');
    }
  }
}

// ---- moving subway train ----
const trainR="[o-o]=[o-o]=[o-o]==>";     // heading right
const trainL="<==[o-o]=[o-o]=[o-o]";     // heading left
let train={};
function spawnTrain(){
  const dir=Math.random()<0.5?1:-1;
  const art=dir>0?trainR:trainL;
  train={ dir, art, spd:(0.8+Math.random()*0.8)*dir,
    x: dir>0 ? -art.length : COLS };
}
function stepTrain(){
  if(train.x===undefined)return;
  train.x+=train.spd;
  if(train.dir>0 && train.x>COLS+2){ // respawn from left after a gap
    train.dir= Math.random()<0.5?1:-1; train.art=train.dir>0?trainR:trainL;
    train.spd=(0.8+Math.random()*0.8)*train.dir;
    train.x= train.dir>0 ? -train.art.length-10 : COLS+10;
  }
  if(train.dir<0 && train.x<-train.art.length-2){
    train.dir= Math.random()<0.5?1:-1; train.art=train.dir>0?trainR:trainL;
    train.spd=(0.8+Math.random()*0.8)*train.dir;
    train.x= train.dir>0 ? -train.art.length-10 : COLS+10;
  }
}
function drawTrain(grid,mg){
  if(train.x===undefined || !rSubwayRow)return;
  const r=rSubwayRow, xi=Math.round(train.x);
  for(let j=0;j<train.art.length;j++){
    const c=xi+j; const ch=train.art[j];
    if(ch===" ")continue;
    if(c<0||c>=COLS)continue;
    setCh(grid,r,c,ch);
    setMode(mg,r,c,'train');
  }
}

// ---- structural collapse: unsupported building chunks fall / crumble ----
// Gravity-settles each column of the *base* city so buildings that had their
// lower floors destroyed topple down instead of floating. Mutates cityGridArr.
// `rate` (0..1) controls how much settles per call (partial = a crumbling animation).
function collapseCity(rate){
  if(cityGridArr.length!==ROWS) return;
  const R = rate===undefined ? 1 : rate;
  for(let c=0;c<COLS;c++){
    // gather the solid building chars in this column (above the street), top→bottom
    const solids=[];
    for(let r=0;r<streetRow;r++){ const ch=cityGridArr[r] && cityGridArr[r][c]; if(ch && ch!==" ") solids.push(ch); }
    if(!solids.length) continue;
    // count the gaps below the topmost solid (holes blown in the structure)
    let firstSolid=-1, holes=0;
    for(let r=0;r<streetRow;r++){ const ch=cityGridArr[r] && cityGridArr[r][c];
      if(ch && ch!==" "){ if(firstSolid<0) firstSolid=r; }
      else if(firstSolid>=0 && r<streetRow) holes++;
    }
    if(holes===0) continue;                 // fully supported — nothing to do
    // only settle a fraction this frame (crumbling), and only if it's actually top-heavy
    if(Math.random() > R*0.6) continue;
    // rebuild the column: drop all solids to rest just above the street, leaving sky above
    const n=solids.length;
    for(let r=0;r<streetRow;r++){
      const ch = (r >= streetRow-n) ? solids[r-(streetRow-n)] : " ";
      if(cityGridArr[r]){ let ln=cityGridArr[r].split(""); ln[c]=ch; cityGridArr[r]=ln.join(""); }
    }
    // toppling debris: sometimes a chunk falls sideways into the neighbouring gap
    if(Math.random()<0.15){ const nc=c+(Math.random()<0.5?-1:1); if(nc>=0&&nc<COLS && cityGridArr[streetRow-1] && cityGridArr[streetRow-1][nc]===" "){ let ln=cityGridArr[streetRow-1].split(""); ln[nc]="#"; cityGridArr[streetRow-1]=ln.join(""); } }
  }
}

// ---- render city with damage radius dmg (columns from center flattened) ----
function renderCity(bombRow,dmg){
  // rebuild-safe: ensure city grid matches current ROWS/COLS
  if(cityGridArr.length!==ROWS || (cityGridArr[0]||"").length!==COLS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();        // copy row refs (strings immutable)
  if(dmg>0){
    for(let r=0;r<ROWS-1;r++){
      let line=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=cx-dmg;c<=cx+dmg;c++){
        if(c<0||c>=COLS)continue;
        if(r<streetRow) line[c]=" ";                                  // buildings obliterated
        else if(r<=streetRow+1) line[c]=(Math.random()<0.5?".":"_");  // street cratered to rubble
        // deeper than street+1: leave subway/pipes/sewer partly intact for effect
        else if(Math.random()<0.35) line[c]=(Math.random()<0.5?"\u00b7":".");
      }
      grid[r]=line.join("");
    }
  }
  if(bombRow!==null)placeCentered(grid,bomb,bombRow);
  return grid;
}

// ---- tidal wave: a curling water front sweeping left->right ----
// wx = leading edge column. Returns {grid, mg}. Everything left of the front is flooded.
function tsunami(wx){
  // start from a copy of the city so the wave crashes over the actual skyline
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const waterTop=Math.max(1, streetRow - Math.floor(ROWS*0.55));  // how high the flood rises
  const crestH=Math.min(streetRow-waterTop, Math.floor(ROWS*0.5));// height of the curling face

  for(let r=0;r<ROWS;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      if(c<wx-2){
        // ---- FLOODED zone (behind the front): fill with water up to waterTop ----
        if(r>=waterTop){
          const surface=(r===waterTop);
          if(surface){ line[c]= (Math.random()<0.3?"~":"\u2248"); }
          else { line[c]= (Math.random()<0.15?"\u2248":"~"); }
          setMode(mg,r,c,'water');
        }
        // above waterTop: leave sky/rain (buildings poking out get submerged look) -> clear tops
        else if(r<waterTop && line[c]!==" " && r<streetRow){
          // partially demolish building tops that the wave has passed
          if(Math.random()<0.5){ line[c]=" "; }
        }
      } else if(c>=wx-2 && c<=wx+1){
        // ---- THE CURLING WAVE FACE (tall crest) ----
        const faceTop=streetRow-crestH;
        if(r>=faceTop && r<=streetRow){
          const atCrest=(r<=faceTop+2);
          let ch;
          if(atCrest) ch=(Math.random()<0.5?"#":"@");   // foaming crest
          else ch=(Math.random()<0.6?"~":"\u2248");
          line[c]=ch; setMode(mg,r,c,'water');
        }
        // spray/foam thrown ahead & above the crest
        if(r>=faceTop-3 && r<faceTop && Math.random()<0.35){
          line[c]=(Math.random()<0.5?"*":"\u00b0"); setMode(mg,r,c,'water');
        }
      }
      // ahead of the wave (c>wx+1): city stands untouched (leave as-is)
    }
    grid[r]=line.join("");
  }
  return {grid,mg};
}

// ---- asteroid: a flaming rock streaking down from upper-left to city centre ----
const astArt=[" @@@ ","@@0@@","@%@@0"," @@@ "];   // chunky rock
function asteroidStreak(ax,ay){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // fiery trail behind (up-left of the rock), fading
  for(let t=1;t<=14;t++){
    const tx=Math.round(ax - t*1.6), ty=Math.round(ay - t*1.2);
    if(ty<0||ty>=ROWS||tx<0||tx>=COLS)continue;
    const spread=Math.max(0,3-Math.floor(t/4));
    for(let dj=-spread;dj<=spread;dj++){
      const c=tx+dj; if(c<0||c>=COLS)continue;
      if(Math.random()<0.75){ setCh(grid,ty,c, (t<5)?["#","*","@"][(Math.random()*3)|0]:[".","'","*"][(Math.random()*3)|0]); setMode(mg,ty,c,'trail'); }
    }
  }
  // the rock itself
  for(let i=0;i<astArt.length;i++){
    for(let j=0;j<astArt[i].length;j++){
      const ch=astArt[i][j]; if(ch===" ")continue;
      const r=Math.round(ay)+i-2, c=Math.round(ax)+j-2;
      setCh(grid,r,c,ch); setMode(mg,r,c,'asteroid');
    }
  }
  return {grid,mg};
}
// expanding fireball + growing crater that eats the whole map
function asteroidImpact(t){
  const grid=blankGrid(ROWS), mg=modeGridFill(ROWS,COLS,'impact');
  const ground=ROWS-1;
  const R=t;                                     // blast radius in columns
  const fbChars=["#","@","%","&","*"];
  // ground-hugging fireball dome centred at cx
  const domeH=Math.min(ground, Math.floor(R*0.7));
  for(let r=ground;r>=ground-domeH;r--){
    const frac=(ground-r)/Math.max(1,domeH);
    const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.15);
    for(let j=-w;j<=w;j++){
      if(Math.abs(j)>w-2&&Math.random()<0.4)continue;
      if(Math.random()<0.12)continue;
      const c=cx+j; if(c<0||c>=COLS)continue;
      setCh(grid,r,c,fbChars[(Math.random()*fbChars.length)|0]);
    }
  }
  // scorched crater line + ejecta
  for(let c=0;c<COLS;c++){
    const d=Math.abs(c-cx);
    if(d<=R){ setCh(grid,ground,c,"\u2588"); }               // charred crater floor
    else if(Math.random()<0.3){ setCh(grid,ground,c,[".",",","_"][(Math.random()*3)|0]); }
  }
  // flung debris / sparks in the sky
  for(let k=0;k<COLS*0.35;k++){
    const c=(Math.random()*COLS)|0, r=1+((Math.random()*(ROWS-4))|0);
    if(Math.abs(c-cx) < R*1.3 && Math.random()<0.5){ setCh(grid,r,c,["'",".","*","\u00b0"][(Math.random()*4)|0]); }
  }
  return {grid,mg};
}

// ---- Godzilla: a giant kaiju stomping in from the right, flattening the city ----
// Big ASCII lizard sprite (drawn bottom-anchored at street level). ~14 wide, ~10 tall.
const gzSprite=[
  "        /\\    ",
  "     /\\/  \\   ",
  "  __/ () o \\_ ",   // head w/ eye
  " /   \\____/  \\",
  "/  /\\        |",   // arm
  "|__|  \\  /\\  |",
  "   |   \\/  \\ |",
  "   |___/\\  /\\|",
  "   /   |  |  \\",   // legs
  "  /_/  |__|  \\",
];
const gzBreath=["=","~","*","-","\u2248"];
function godzilla(gx, breathOn, dmgL, dmgR, tick){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // flatten everything he's already trampled: columns to the RIGHT of gx (he walks right->left)
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=Math.floor(gx)+8;c<COLS;c++){                 // trampled zone behind him
      if(Math.random()<0.85) line[c]=" ";
      else line[c]=[".","'"][(Math.random()*2)|0];
    }
    grid[r]=line.join("");
  }
  // leave smoking rubble on the street where he's walked
  {
    let line=grid[streetRow].split("");
    for(let c=Math.floor(gx)+8;c<COLS;c++){ if(Math.random()<0.5) line[c]=[".",",","_"][(Math.random()*3)|0]; }
    grid[streetRow]=line.join("");
  }
  // rising smoke plumes from the destruction behind him
  for(let k=0;k<COLS*0.15;k++){
    const c=Math.floor(gx)+10+((Math.random()*Math.max(1,COLS-gx-10))|0);
    const r=streetRow-1-((Math.random()*6)|0);
    if(c>=0&&c<COLS&&r>0){ setCh(grid,r,c,["'",".","o"][(Math.random()*3)|0]); }
  }

  // draw Godzilla, bottom-anchored so his feet sit on the street
  const gh=gzSprite.length;
  const topRow=streetRow-gh+1;
  // little walk bob
  const bob=(tick%2===0)?0:0;
  for(let i=0;i<gh;i++){
    const row=topRow+i+bob;
    const art=gzSprite[i];
    for(let j=0;j<art.length;j++){
      const ch=art[j]; if(ch===" ")continue;
      const c=Math.floor(gx)+j;
      if(c<0||c>=COLS||row<0||row>=ROWS)continue;
      setCh(grid,row,c,ch); setMode(mg,row,c,'godzilla');
    }
  }

  // atomic breath: a beam firing left from his mouth, incinerating a column swath
  if(breathOn){
    const mouthR=topRow+2, mouthC=Math.floor(gx);      // mouth at left edge of head
    for(let c=mouthC-1;c>=0;c--){
      const spread=1+Math.floor((mouthC-c)/14);
      for(let dr=-spread;dr<=spread;dr++){
        const r=mouthR+dr;
        if(r<0||r>=ROWS)continue;
        if(Math.random()<0.85){ setCh(grid,r,c,gzBreath[(Math.random()*gzBreath.length)|0]); setMode(mg,r,c,'breath'); }
      }
    }
  }
  return {grid,mg};
}

// ---- napalm: incendiary blobs rain down, igniting spreading flames that consume the city ----
// npDrops: falling blobs {x,y,spd}; npFire: {c, h} columns of fire with a height that grows.
function napalmInit(){
  npDrops=[]; npFire=[];
  const n=Math.max(10,Math.floor(COLS*0.5));
  for(let i=0;i<n;i++){
    npDrops.push({ x:(Math.random()*COLS)|0, y:-((Math.random()*ROWS)|0), spd:1+Math.random()*2 });
  }
}
function napalmStep(t){
  // advance blobs; when one reaches street (or a building top), start/boost a fire column
  for(const d of npDrops){
    d.y+=d.spd;
    // ignite when it passes street level
    if(d.y>=streetRow){
      igniteFire(d.x|0);
      d.y=-((Math.random()*8)|0); d.x=(Math.random()*COLS)|0; d.spd=1+Math.random()*2;
    }
  }
  // fires grow taller over time and spread to neighbours
  for(const f of npFire){ if(f.h < f.max) f.h+=0.5; }
  if(t%2===0){
    const spread=[];
    for(const f of npFire){
      if(f.h>3 && Math.random()<0.5){ spread.push(f.c-1); spread.push(f.c+1); }
    }
    for(const c of spread) igniteFire(c);
  }
}
function igniteFire(c){
  if(c<0||c>=COLS)return;
  let f=npFire.find(x=>x.c===c);
  if(!f){ npFire.push({c, h:1, max:streetRow*(0.5+Math.random()*0.45)}); }
  else { f.h=Math.min(f.max, f.h+1); }
}
function napalmRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const fireChars=["#","@","A","^","/","\\"];
  const emberChars=["'","\u00b0","."];

  // draw fire columns rising from the street, burning away the buildings behind them
  for(const f of npFire){
    const h=Math.floor(f.h);
    for(let k=0;k<h;k++){
      const r=streetRow-k;
      if(r<0)break;
      // flame body denser at base, flickery at top
      const near=k<h*0.6;
      const ch= near ? fireChars[(Math.random()*fireChars.length)|0]
                     : (Math.random()<0.5?emberChars[(Math.random()*emberChars.length)|0]:fireChars[(Math.random()*2)|0]);
      // little horizontal flicker
      const jitter=(Math.random()<0.3)?(Math.random()<0.5?-1:1):0;
      const c=f.c+jitter;
      if(c<0||c>=COLS)continue;
      if(Math.random()<0.1)continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,'flames');
    }
    // scorch the street under the fire
    setCh(grid,streetRow,f.c,"^"); setMode(mg,streetRow,f.c,'flames');
  }
  // clear building material that fire has reached (burn them down)
  for(const f of npFire){
    const h=Math.floor(f.h);
    for(let r=streetRow-1;r>streetRow-h;r--){
      // above the visible flame, leave charred gaps
      if(Math.random()<0.5 && grid[r] && grid[r][f.c] && grid[r][f.c]!==" " && mg[r][f.c]!=='flames'){
        setCh(grid,r,f.c," ");
      }
    }
  }

  // falling napalm blobs
  for(const d of npDrops){
    const r=Math.round(d.y), c=d.x|0;
    if(r<0||r>=ROWS||c<0||c>=COLS)continue;
    if(!grid[r]||grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"*":"o")); setMode(mg,r,c,'napalm'); }
    // little tail
    if(r-1>=0 && (!grid[r-1]||grid[r-1][c]===" ")){ setCh(grid,r-1,c,"'"); setMode(mg,r-1,c,'napalm'); }
  }

  // drifting smoke high above the inferno
  for(let k=0;k<COLS*0.2;k++){
    const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.max(1,streetRow-8))|0);
    if(npFire.length>COLS*0.3 && Math.random()<0.3){ setCh(grid,r,c,["'",".","\u00b0"][(Math.random()*3)|0]); setMode(mg,r,c,'flames'); }
  }
  return {grid,mg};
}

// ---- the Sun: red giant swells over the horizon and scorches Earth to nothing ----
// t grows 0..1 (approx). The sun is a filled disc rising from bottom, radius growing to engulf all.
function sunRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const sunCh=["@","#","%","&"];

  // sun disc: centre below the horizon early, rising and swelling
  const maxR=Math.hypot(COLS, ROWS);                 // enough to cover screen
  const R=Math.max(3, t*maxR*1.05);
  const scy=streetRow + Math.floor(ROWS*0.9) - Math.floor(t*ROWS*1.4); // centre rises over time
  const scx=cx;
  const aspect=0.55;                                  // chars are taller than wide -> squash vertically

  // heat haze: as the sun grows, scorch the city (progressively clear + char the ground)
  const scorchFrac=Math.min(1, t*1.6);
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      if(line[c]!==" " && Math.random()<scorchFrac*0.6){ line[c]=" "; }  // buildings burn away
    }
    grid[r]=line.join("");
  }
  if(scorchFrac>0.2){
    let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){ g[c]=(Math.random()<0.5?"^":"~"); setMode(mg,streetRow,c,'scorch'); }
    grid[streetRow]=g.join("");
    for(let r=streetRow+1;r<ROWS;r++){ // underground bakes to charred rock
      let gl=grid[r].split("");
      for(let c=0;c<COLS;c++){ if(Math.random()<scorchFrac*0.5) gl[c]="\u2588"; }
      grid[r]=gl.join(""); for(let c=0;c<COLS;c++) if(grid[r][c]==="\u2588") setMode(mg,r,c,'scorch');
    }
  }

  // draw the sun disc (filled, roiling)
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const dx=(c-scx), dy=(r-scy)/aspect;
      const dist=Math.hypot(dx,dy);
      if(dist<=R){
        // surface texture: brighter core, mottled edge
        let ch;
        const edge=(dist>R-3);
        if(edge && Math.random()<0.5) continue;        // fuzzy limb
        ch = sunCh[(Math.random()*sunCh.length)|0];
        setCh(grid,r,c,ch); setMode(mg,r,c,'sun');
      }
    }
  }
  // solar flares / prominences licking off the limb
  for(let k=0;k<COLS*0.4;k++){
    const ang=Math.random()*Math.PI*2;
    const rr=R+ (Math.random()*4);
    const c=Math.round(scx+Math.cos(ang)*rr);
    const r=Math.round(scy+Math.sin(ang)*rr*aspect);
    if(r>=0&&r<ROWS&&c>=0&&c<COLS && (grid[r][c]===" ")){
      setCh(grid,r,c,["*","\u00b0",".","'"][(Math.random()*4)|0]); setMode(mg,r,c,'sun');
    }
  }
  return {grid,mg};
}

// ---- alien invasion: a mothership descends and blasts the city with green beams ----
// Saucer sprite (wide). Drawn centred at (ufoCX, hullTop).
const ufoSprite=[
  "        ______________        ",
  "     __/  o  o  o  o   \\__     ",   // dome lights
  "  __/_____________________\\__  ",
  " /  o   O   o   O   o   O   o \\",   // hull lights
  " \\___========================/",
];
function alien(hullTop, beamCols, dmgCols, tick, beamHalf, shipX){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const ufoCX=(shipX!==undefined)?shipX:cx;
  const sw=ufoSprite[0].length;
  const startC=ufoCX-Math.floor(sw/2);

  // ---- beams: wide green energy columns punching down to the street ----
  const beamChars=["#","@","|",":"];
  for(const bc of beamCols){
    const half=beamHalf!==undefined ? beamHalf : Math.max(2,Math.floor(COLS*0.045));
    for(let dc=-half;dc<=half;dc++){
      const c=bc+dc; if(c<0||c>=COLS)continue;
      const edge=Math.abs(dc)>=half-1;
      for(let r=hullTop+5;r<=streetRow;r++){
        if(edge && Math.random()<0.5) continue;
        if(Math.random()<0.12) continue;
        const ch = edge ? ":" : beamChars[(Math.random()*beamChars.length)|0];
        setCh(grid,r,c,ch); setMode(mg,r,c,'beam');
      }
      // scorch/impact splash at the street
      setCh(grid,streetRow,c,(Math.random()<0.5?"#":"@")); setMode(mg,streetRow,c,'beam');
    }
  }
  // ---- disintegrate buildings inside the damaged columns ----
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(const dc of dmgCols){
      const half=(beamHalf!==undefined?beamHalf:Math.max(3,Math.floor(COLS*0.05)))+1;
      for(let c=dc-half;c<=dc+half;c++){
        if(c<0||c>=COLS)continue;
        if(line[c]!==" " && mg[r][c]!=='beam' && Math.random()<0.85) line[c]=" ";
      }
    }
    grid[r]=line.join("");
  }

  // ---- draw the mothership over the top ----
  for(let i=0;i<ufoSprite.length;i++){
    const row=hullTop+i;
    const art=ufoSprite[i];
    for(let j=0;j<art.length;j++){
      const ch=art[j]; if(ch===" ")continue;
      const c=startC+j;
      if(c<0||c>=COLS||row<0||row>=ROWS)continue;
      // blink the lights
      let out=ch;
      if((ch==="o"||ch==="O") && (tick+j)%4===0) out=(ch==="o"?"O":"o");
      setCh(grid,row,c,out); setMode(mg,row,c,'ufo');
    }
  }
  // hovering glow / small scout saucers drifting
  for(let k=0;k<3;k++){
    const sx=((tick*(k+2))%(COLS+20))-10;
    const sy=2+k*2;
    const scout="<oO o>";
    for(let j=0;j<scout.length;j++){ const c=Math.round(sx)+j; if(c>=0&&c<COLS && scout[j]!==" "){ setCh(grid,sy,c,scout[j]); setMode(mg,sy,c,'ufo'); } }
  }
  return {grid,mg};
}

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

// ---- locust swarm: a plague of insects blots the sky and devours the city ----
const locChars=["}","{","x","X",")","("];
function locustInit(){
  locusts=[]; locEaten=0;
  const n=Math.floor(COLS*1.2);
  for(let i=0;i<n;i++){
    locusts.push({ x:-((Math.random()*COLS)|0)-2, y:(Math.random()*(streetRow))|0,
      spd:0.8+Math.random()*1.8, bob:Math.random()*6, amp:0.4+Math.random()*1.2 });
  }
}
function locustStep(t){
  for(const l of locusts){
    l.x+=l.spd; l.bob+=0.5;
    if(l.x>COLS+2){ l.x=-2-((Math.random()*10)|0); l.y=(Math.random()*streetRow)|0; }
  }
  // the swarm eats inward from the left as it passes over the city
  locEaten=Math.min(COLS, locEaten + Math.max(1,Math.floor(COLS/44)));
}
function locustRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // devour buildings in the eaten zone (left..locEaten): nibble away, leaving sparse husks
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<locEaten && c<COLS;c++){
      if(line[c]!==" "){
        // closer to the leading edge = more thoroughly stripped
        const depth=(locEaten-c)/Math.max(1,locEaten);
        if(Math.random()<0.3+depth*0.6) line[c]=" ";
      }
    }
    grid[r]=line.join("");
  }
  // frass/dust on the street where they've fed
  { let g=grid[streetRow].split("");
    for(let c=0;c<locEaten && c<COLS;c++){ if(Math.random()<0.3) g[c]=(Math.random()<0.5?"`":"."); }
    grid[streetRow]=g.join(""); }

  // draw the flying swarm (dense cloud of insects)
  for(const l of locusts){
    const xi=Math.round(l.x), yi=Math.round(l.y+Math.sin(l.bob)*l.amp);
    if(xi<0||xi>=COLS||yi<0||yi>=ROWS)continue;
    setCh(grid,yi,xi, locChars[(Math.random()*locChars.length)|0]);
    setMode(mg,yi,xi,'locust');
  }
  return {grid,mg};
}

// ---- TORNADO: a funnel crosses the city, sucking buildings into flying debris ----
function tornadoRender(tx, t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const cxi=Math.round(tx);

  // destroy buildings within the funnel's reach (a band around tx that widens near ground)
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    const reach=2+Math.floor((r/streetRow)*Math.floor(COLS*0.10));   // wider lower down
    for(let c=cxi-reach;c<=cxi+reach;c++){ if(c>=0&&c<COLS && Math.random()<0.7) line[c]=" "; }
    grid[r]=line.join("");
  }

  // draw the funnel: narrow at top, flaring to the ground, made of spinning slashes
  for(let r=0;r<=streetRow;r++){
    const frac=r/streetRow;
    const w=1+Math.floor(frac*Math.floor(COLS*0.09));
    const swirl=Math.sin((r*0.7)+t*0.9);
    for(let j=-w;j<=w;j++){
      if(Math.random()<0.35)continue;
      const c=cxi+j+Math.round(swirl*1.5);
      if(c<0||c>=COLS)continue;
      const ch = (j%2===0) ? ((swirl>0)?"/":"\\") : (Math.random()<0.5?"(":"|");
      setCh(grid,r,c,ch); setMode(mg,r,c,'tornado');
    }
  }
  // flying debris flung around the funnel
  for(let k=0;k<COLS*0.25;k++){
    const ang=Math.random()*Math.PI*2, rad=2+Math.random()*Math.floor(COLS*0.14);
    const c=Math.round(cxi+Math.cos(ang)*rad);
    const r=Math.round((streetRow*0.5)+Math.sin(ang)*rad*0.5 - (t%6));
    if(c>=0&&c<COLS&&r>=0&&r<streetRow){ setCh(grid,r,c,["@","#","0","*"][(Math.random()*4)|0]); setMode(mg,r,c,'tornado'); }
  }
  // debris/rubble on the street where it's passed
  { let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){ if(c<cxi && Math.random()<0.25) g[c]=[".",",","_"][(Math.random()*3)|0]; }
    grid[streetRow]=g.join(""); }
  return {grid,mg};
}

// ---- EARTHQUAKE: the ground splits and buildings topple into the fissures ----
function quakeRender(t, fall){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // progressively collapse buildings: taller portions crumble first as `fall` grows
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    const height=streetRow-r;                 // higher rows = taller
    for(let c=0;c<COLS;c++){
      if(line[c]!==" " && line[c]!=="|"){
        // collapse chance scales with how high it is and how far the quake has progressed
        if(Math.random() < fall*(0.3+height/streetRow*0.7)) line[c]=(Math.random()<0.4?"#":" ");
      }
    }
    grid[r]=line.join("");
  }

  // jagged fissures splitting the street + underground
  if(qCracks.length===0){
    const n=3+((Math.random()*4)|0);
    for(let i=0;i<n;i++) qCracks.push({ c:((i+0.5)/n*COLS)|0 + (((Math.random()*10)|0)-5), w:1+((Math.random()*2)|0) });
  }
  for(const cr of qCracks){
    let cc=cr.c;
    for(let r=streetRow;r<ROWS;r++){
      cc += (Math.random()<0.5?0:(Math.random()<0.5?-1:1));   // jagged wander
      for(let w=0;w<cr.w;w++){
        const c=cc+w; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["\\","/","V","Y","Z"][(Math.random()*5)|0]); setMode(mg,r,c,'quake');
      }
    }
    // crack opening at the street itself
    if(cr.c>=0&&cr.c<COLS){ setCh(grid,streetRow,cr.c,"V"); setMode(mg,streetRow,cr.c,'quake'); }
  }
  // toppled rubble mounds on the street
  { let g=grid[streetRow].split("");
    for(let c=0;c<COLS;c++){ if(Math.random()<fall*0.4) g[c]=(Math.random()<0.5?"#":"="); if(g[c]==="#"||g[c]==="=") setMode(mg,streetRow,c,'quake'); }
    grid[streetRow]=g.join(""); }
  return {grid,mg};
}

// ---- VOLCANO: a mountain erupts, raining lava bombs and flooding the city with lava ----
function volcanoRender(t, lavaLevel, bombs, rise){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const vcx=cx;
  if(rise===undefined) rise=1;

  // the volcano cone RISES up out of the ground: current height scales with `rise`
  const coneCx=Math.floor(COLS*0.78);
  const fullH=Math.floor(streetRow*0.7);
  const coneH=Math.max(1, Math.floor(fullH*rise));
  const coneBase=streetRow;
  // push up debris/ground shudder as it emerges
  for(let i=0;i<coneH;i++){
    const r=coneBase-i;
    // width uses the FULL cone profile so the mountain keeps its shape as it grows taller
    const halfW=2+Math.floor((fullH-i)*0.5);
    for(let j=-halfW;j<=halfW;j++){
      const c=coneCx+j; if(c<0||c>=COLS)continue;
      if(i===coneH-1){ setCh(grid,r,c,(Math.random()<0.5?"~":"#")); setMode(mg,r,c,'lava'); } // glowing crater rim at current summit
      else { setCh(grid,r,c,"\u2588"); setMode(mg,r,c,'lava'); }
    }
  }
  // rock/ash kicked up around the base while it's still rising
  if(rise<1){
    for(let k=0;k<COLS*0.15;k++){
      const c=coneCx+(((Math.random()*30)|0)-15), r=streetRow-((Math.random()*3)|0);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["\u00b0",".","'","*"][(Math.random()*4)|0]); setMode(mg,r,c,'lava'); }
    }
  }
  const craterR=coneBase-coneH+1, craterC=coneCx;

  // eruption plume + lava bombs only once the cone has fully risen
  if(rise>=1){
    for(let k=0;k<COLS*0.2;k++){
      const r=Math.max(0,craterR-((Math.random()*10)|0)), c=craterC+(((Math.random()*14)|0)-7);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["#","@","*","\u00b0"][(Math.random()*4)|0]); setMode(mg,r,c,'lava'); }
    }
    for(const b of bombs){
      const r=Math.round(b.y), c=Math.round(b.x);
      if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,"@"); setMode(mg,r,c,'lava'); }
    }
    // lava flooding the streets from the right, rising & spreading left
    const floodRight=COLS-1, floodLeft=Math.max(0, COLS-1-lavaLevel);
    for(let c=floodLeft;c<=floodRight;c++){
      for(let r=0;r<streetRow;r++){ if(grid[r] && grid[r][c] && grid[r][c]!==" " && mg[r][c]!=='lava' && Math.random()<0.5){ let ln=grid[r].split(""); ln[c]=" "; grid[r]=ln.join(""); } }
      const surface=streetRow;
      setCh(grid,surface,c,(Math.random()<0.5?"~":"\u2248")); setMode(mg,surface,c,'lava');
      if(Math.random()<0.4){ setCh(grid,surface-1,c,(Math.random()<0.5?"~":"*")); setMode(mg,surface-1,c,'lava'); }
    }
  }
  return {grid,mg};
}

// ---- RIOTS: an angry mob floods the streets, torching buildings ----
const riotBodies=["/o\\","<o>","\\o/","|o|","/O\\"];
function riotInit(){
  rioters=[]; riotFires=[]; riotDmg=0;
  const n=Math.floor(COLS*0.6);
  for(let i=0;i<n;i++){
    rioters.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5,
      body:riotBodies[(Math.random()*riotBodies.length)|0], arm:Math.random()<0.5, ph:Math.random()*6 });
  }
}
function riotStep(t){
  for(const r of rioters){ r.x+=r.spd*r.dir; r.ph+=0.5; if(r.x<0)r.x=COLS; if(r.x>COLS)r.x=0; if(Math.random()<0.02)r.dir*=-1; }
  // more join the mob; fires spread
  if(t%3===0 && rioters.length<COLS*1.1){ rioters.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5, body:riotBodies[(Math.random()*riotBodies.length)|0], arm:Math.random()<0.5, ph:Math.random()*6 }); }
  if(t%4===0 && riotFires.length<COLS*0.4){ riotFires.push({ c:(Math.random()*COLS)|0, h:1, max:2+Math.random()*Math.floor(streetRow*0.6) }); }
  for(const f of riotFires){ if(f.h<f.max) f.h+=0.4; }
  riotDmg=Math.min(COLS, riotDmg+ (t%2===0?1:0));
}
function riotRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const fireCh=["#","@","^"];
  // fires burning up the buildings
  for(const f of riotFires){
    const h=Math.floor(f.h);
    for(let k=0;k<h;k++){ const r=streetRow-k; if(r<0)break; if(Math.random()<0.2)continue;
      setCh(grid,r,f.c,fireCh[(Math.random()*fireCh.length)|0]); setMode(mg,r,f.c,'riot'); }
    // burn away building behind fire
    for(let r=streetRow-1;r>streetRow-h;r--){ if(grid[r]&&grid[r][f.c]&&grid[r][f.c]!==" "&&mg[r][f.c]!=='riot'&&Math.random()<0.5){ let ln=grid[r].split(""); ln[f.c]=" "; grid[r]=ln.join(""); } }
  }
  // broken glass / debris on street
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.15) g[c]=[".",",","x"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }
  // the mob (2 rows: body + legs) massed along the street
  const br=streetRow-1;
  for(const p of rioters){
    const xi=Math.round(p.x); if(xi<1||xi>=COLS-1)continue;
    const bob=(Math.sin(p.ph)>0)?0:1;
    for(let j=-1;j<=1;j++) { const c=xi+j; setCh(grid,br-bob,c,p.body[j+1]); setMode(mg,br-bob,c,'riot'); }
    // raised arm / torch / sign
    if(p.arm){ setCh(grid,br-1-bob,xi,(Math.random()<0.5?"!":"I")); setMode(mg,br-1-bob,xi,'riot'); }
    setCh(grid,br+1-bob,xi,(Math.random()<0.5?"/":"\\")); setMode(mg,br+1-bob,xi,'riot');
  }
  return {grid,mg};
}

// ---- AIR CRASH: an airliner streaks in and slams into the city in a fireball ----
const planeSprite="___/\\___[===]==<>";
function crashRender(px,py,hit,fire){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(!hit){
    // trailing smoke behind the diving plane
    for(let k=1;k<=12;k++){ const tx=Math.round(px-k*1.4), ty=Math.round(py-k*0.7);
      if(ty>=0&&ty<ROWS&&tx>=0&&tx<COLS && Math.random()<0.6){ setCh(grid,ty,tx,(k<5?["#","@","*"]:[".","'"," "])[(Math.random()*(k<5?3:2))|0]||"'"); setMode(mg,ty,tx,'crashfire'); } }
    // the airliner
    for(let j=0;j<planeSprite.length;j++){ const c=Math.round(px)+j, r=Math.round(py);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS&&planeSprite[j]!==" "){ setCh(grid,r,c,planeSprite[j]); setMode(mg,r,c,'crashfire'); } }
  } else {
    // impact fireball at crash site (centre), growing with `fire`
    const ix=cx, R=fire;
    // MIDDLE: fully obliterated within R
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=ix-R;c<=ix+R;c++){ if(c<0||c>=COLS)continue; if(Math.random()<0.7) ln[c]=" "; } grid[r]=ln.join(""); }
    // OUTSKIRTS: blast/shrapnel damage thinning out with distance beyond R
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){
        const d=Math.abs(c-ix);
        if(d>R){ const dmg=Math.max(0, 0.55*(1-(d-R)/(COLS*0.6)));   // fades toward edges
          if(ln[c]!==" " && Math.random()<dmg) ln[c]=(Math.random()<0.4?"#":" "); }
      }
      grid[r]=ln.join(""); }
    const dome=Math.min(streetRow, Math.floor(R*0.9));
    for(let rr=streetRow;rr>=streetRow-dome;rr--){ const frac=(streetRow-rr)/Math.max(1,dome);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
      for(let j=-w;j<=w;j++){ if(Math.abs(j)>w-2&&Math.random()<0.4)continue; if(Math.random()<0.12)continue;
        const c=ix+j; if(c<0||c>=COLS)continue; setCh(grid,rr,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,rr,c,'crashfire'); } }
    // scattered burning debris across the wider blast zone
    for(let k=0;k<COLS*0.25;k++){ const c=ix+(((Math.random()*R*3)|0)-Math.floor(R*1.5)), r=streetRow-((Math.random()*3)|0);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["*","'","."][(Math.random()*3)|0]); setMode(mg,r,c,'crashfire'); } }
  }
  return {grid,mg};
}

// ---- TOXIC WASTE: glowing green sludge floods and dissolves the city ----
function toxicRender(t, dissolve){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // sludge sits at a fixed ~1-storey depth on the street (never climbs the buildings)
  const storey=Math.max(2, Math.floor(streetRow*0.12));   // ~one storey tall
  const top=Math.max(1, streetRow-storey+1);
  // dissolve the buildings from the ground UP as `dissolve` (0..1) grows:
  // the sludge is eating the city away — lower floors go first, then higher.
  const eatRow=Math.floor(streetRow - dissolve*(streetRow-1));   // everything below this is gone
  for(let r=streetRow-1;r>=0;r--){
    if(r>=eatRow){
      let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){ if(ln[c]!==" " && Math.random()<0.7) ln[c]=" "; }   // dissolved away
      grid[r]=ln.join("");
    }
  }
  // draw the pooled sludge (1 storey) sitting on the street
  for(let r=streetRow;r>=top;r--){
    for(let c=0;c<COLS;c++){
      const surface=(r===top);
      if(surface){ setCh(grid,r,c,(Math.random()<0.5?"~":"\u2248")); setMode(mg,r,c,'toxic'); }
      else if(Math.random()<0.8){ setCh(grid,r,c,(Math.random()<0.85?"~":"\u2248")); setMode(mg,r,c,'toxic'); }
    }
  }
  // bubbles rising off the surface
  for(let k=0;k<COLS*0.25;k++){ const c=(Math.random()*COLS)|0, r=top-((Math.random()*3)|0);
    if(r>=0){ setCh(grid,r,c,["O","o","\u00b0"][(Math.random()*3)|0]); setMode(mg,r,c,'toxic'); } }
  if(t%10<3){ const msg="\u2620 TOXIC \u2620"; const sC=cx-Math.floor(msg.length/2);
    for(let j=0;j<msg.length;j++){ const c=sC+j; if(c>=0&&c<COLS){ setCh(grid,Math.max(0,top-4),c,msg[j]); setMode(mg,Math.max(0,top-4),c,'toxic'); } } }
  return {grid,mg};
}

// ---- ISS CRASH: the space station deorbits, burns through the sky, and impacts ----
const issSprite=[
  "  [|]        [|]  ",
  "  [|]==#==H==#==[|]  ",
  "  [|]   =====   [|]  ",
  "  [|]        [|]  ",
];
function issRender(ix,iy,hit,boom){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  if(!hit){
    // fiery reentry trail
    for(let k=1;k<=16;k++){ const tx=Math.round(ix-k*1.5), ty=Math.round(iy-k*0.8);
      if(ty>=0&&ty<ROWS&&tx>=0&&tx<COLS && Math.random()<0.7){ setCh(grid,ty,tx,["*","'",".","#"][(Math.random()*4)|0]); setMode(mg,ty,tx,'iss'); } }
    // tumbling station
    for(let i=0;i<issSprite.length;i++){ const art=issSprite[i];
      for(let j=0;j<art.length;j++){ const c=Math.round(ix)+j, r=Math.round(iy)+i;
        if(c>=0&&c<COLS&&r>=0&&r<ROWS&&art[j]!==" "){ setCh(grid,r,c,art[j]); setMode(mg,r,c,'iss'); } } }
  } else {
    // impact blast + debris field
    const R=boom;
    // MIDDLE: fully obliterated within R
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=cx-R;c<=cx+R;c++){ if(c<0||c>=COLS)continue; if(Math.random()<0.7) ln[c]=" "; } grid[r]=ln.join(""); }
    // OUTSKIRTS: shrapnel damage thinning out with distance
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){ const d=Math.abs(c-cx);
        if(d>R){ const dmg=Math.max(0, 0.5*(1-(d-R)/(COLS*0.6)));
          if(ln[c]!==" " && Math.random()<dmg) ln[c]=(Math.random()<0.4?"#":" "); } }
      grid[r]=ln.join(""); }
    const dome=Math.min(streetRow, Math.floor(R*0.8));
    for(let rr=streetRow;rr>=streetRow-dome;rr--){ const frac=(streetRow-rr)/Math.max(1,dome);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.2)continue; const c=cx+j; if(c<0||c>=COLS)continue;
        setCh(grid,rr,c,["#","@","*"][(Math.random()*3)|0]); setMode(mg,rr,c,'iss'); } }
    // scattered station debris + panels across the wider blast zone
    for(let k=0;k<COLS*0.3;k++){ const c=cx+(((Math.random()*R*3)|0)-Math.floor(R*1.5)), r=streetRow-((Math.random()*4)|0);
      if(c>=0&&c<COLS){ setCh(grid,r,c,["[","]","=","H","*"][(Math.random()*5)|0]); setMode(mg,r,c,'iss'); } }
  }
  return {grid,mg};
}

// ---- SHARKNADO: a watery funnel full of flying, chomping sharks ----
const sharkR=["<((((\u00ba>","<===xWx","<\\vvv/O>"];    // right-facing sharks
const sharkL=["<\u00ba))))>","xWx===>","<O\\vvv/>"];     // left-facing sharks
function sharknadoInit(){
  sharks=[];
  const n=7+((Math.random()*6)|0);
  for(let i=0;i<n;i++){
    const face=Math.random()<0.5?1:-1;
    sharks.push({ ang:Math.random()*Math.PI*2, rad:3+Math.random()*Math.floor(COLS*0.13),
      spin:0.15+Math.random()*0.2, yoff:(Math.random()*streetRow*0.7)|0,
      face, art:(face>0?sharkR:sharkL)[(Math.random()*sharkR.length)|0] });
  }
}
function sharknadoStep(){
  for(const s of sharks){ s.ang+=s.spin; }
}
function sharknadoRender(fx, t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const cxi=Math.round(fx);

  // destroy buildings within the spout's reach (widening toward the ground)
  for(let r=0;r<streetRow;r++){
    let line=(grid[r]||" ".repeat(COLS)).split("");
    const reach=2+Math.floor((r/streetRow)*Math.floor(COLS*0.11));
    for(let c=cxi-reach;c<=cxi+reach;c++){ if(c>=0&&c<COLS && Math.random()<0.7) line[c]=" "; }
    grid[r]=line.join("");
  }

  // the watery waterspout funnel: swirling ~ and slashes
  for(let r=0;r<=streetRow;r++){
    const frac=r/streetRow;
    const w=1+Math.floor(frac*Math.floor(COLS*0.10));
    const swirl=Math.sin((r*0.6)+t*0.9);
    for(let j=-w;j<=w;j++){
      if(Math.random()<0.4)continue;
      const c=cxi+j+Math.round(swirl*1.5);
      if(c<0||c>=COLS)continue;
      const ch = (Math.random()<0.5) ? ((swirl>0)?"/":"\\") : (Math.random()<0.5?"~":"\u2248");
      setCh(grid,r,c,ch); setMode(mg,r,c,'waterspout');
    }
  }

  // flying sharks orbiting the funnel
  for(const s of sharks){
    const px=Math.round(cxi + Math.cos(s.ang)*s.rad);
    const py=Math.round((streetRow*0.5 - s.yoff*0.3) + Math.sin(s.ang)*s.rad*0.45);
    // point the shark the way it's moving
    const goingRight=Math.cos(s.ang+Math.PI/2)>0;
    const art=goingRight?s.art.replace(/</g,'>'):s.art;   // rough flip cue (kept simple)
    for(let j=0;j<s.art.length;j++){
      const c=px+j-Math.floor(s.art.length/2), r=py;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue;
      if(s.art[j]===" ")continue;
      setCh(grid,r,c,s.art[j]); setMode(mg,r,c,'shark');
    }
  }
  // splashy debris flung around
  for(let k=0;k<COLS*0.18;k++){
    const ang=Math.random()*Math.PI*2, rad=2+Math.random()*Math.floor(COLS*0.15);
    const c=Math.round(cxi+Math.cos(ang)*rad), r=Math.round((streetRow*0.5)+Math.sin(ang)*rad*0.5-(t%5));
    if(c>=0&&c<COLS&&r>=0&&r<streetRow){ setCh(grid,r,c,(Math.random()<0.5?"~":"@")); setMode(mg,r,c,'waterspout'); }
  }
  // wet wreckage on the street behind the spout
  { let g=grid[streetRow].split("");
    for(let c=0;c<cxi&&c<COLS;c++){ if(Math.random()<0.3) g[c]=(Math.random()<0.5?"~":"."); }
    grid[streetRow]=g.join(""); }
  return {grid,mg};
}

// ---- SAURON: a great dark tower rises with the flaming Eye atop, orcs overrun the city ----
const orcBodies=["oYo","\\o/","oTo","|o|","oV o".slice(0,3)];
function sauronInit(){
  orcs=[]; saurDmg=0;
  const n=Math.floor(COLS*0.5);
  for(let i=0;i<n;i++){
    orcs.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5,
      body:orcBodies[(Math.random()*orcBodies.length)|0], ph:Math.random()*6 });
  }
}
function sauronStep(t){
  for(const o of orcs){ o.x+=o.spd*o.dir; o.ph+=0.5; if(o.x<0)o.x=COLS; if(o.x>COLS)o.x=0; if(Math.random()<0.02)o.dir*=-1; }
  if(t%3===0 && orcs.length<COLS*0.9){ orcs.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5, body:orcBodies[(Math.random()*orcBodies.length)|0], ph:Math.random()*6 }); }
  saurDmg=Math.min(COLS, saurDmg+(t%2===0?1:0));
}
function sauronRender(t, rise){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const towerCx=Math.floor(COLS*0.5);

  // the dark tower RISES from the ground, centred, growing to near full height
  const fullH=Math.floor(streetRow*0.95);
  const towerH=Math.max(1, Math.floor(fullH*rise));
  const eyeReserve=3;                                    // top rows for the Eye
  for(let i=0;i<towerH;i++){
    const r=streetRow-i;
    // tapering spire: wide base, narrow top
    const frac=i/fullH;
    const halfW=Math.max(1, Math.floor((1-frac)*Math.floor(COLS*0.06))+1);
    for(let j=-halfW;j<=halfW;j++){
      const c=towerCx+j; if(c<0||c>=COLS)continue;
      const ch = (Math.abs(j)===halfW) ? (j<0?"/":"\\") : (i%3===0?"H":"#");
      setCh(grid,r,c,ch); setMode(mg,r,c,'tower');
    }
    // jagged crown battlements near the top
    if(i>=towerH-2){ setCh(grid,r,towerCx-halfW-1,"V"); setCh(grid,r,towerCx+halfW+1,"V"); setMode(mg,r,towerCx-halfW-1,'tower'); setMode(mg,r,towerCx+halfW+1,'tower'); }
  }

  // the flaming Eye atop the fully-risen tower
  if(rise>=1){
    const er=streetRow-towerH-1;
    const eye=["( @ )","(@0@)","( I )"];
    // flicker: iris chars vary
    for(let i=0;i<eye.length;i++){
      const r=er+i; if(r<0)continue;
      const art=eye[i], sc=towerCx-2;
      for(let j=0;j<art.length;j++){ const c=sc+j; if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'eye'); }
    }
    // searchlight glow flickering off the eye
    for(let k=0;k<COLS*0.08;k++){ const c=towerCx+(((Math.random()*20)|0)-10), r=Math.max(0,er-((Math.random()*3)|0)); if(c>=0&&c<COLS){ setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]); setMode(mg,r,c,'eye'); } }
  }

  // orcs swarm the streets, tearing down buildings as they spread (once tower is up)
  if(rise>=1){
    // overrun buildings across the swarm's spread
    for(let r=0;r<streetRow;r++){
      let line=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){
        if(Math.abs(c-towerCx) > COLS/2 - saurDmg && line[c]!==" " && mg[r][c]!=='tower' && Math.random()<0.3) line[c]=" ";
      }
      grid[r]=line.join("");
    }
    const br=streetRow-1;
    for(const o of orcs){
      const xi=Math.round(o.x); if(xi<1||xi>=COLS-1)continue;
      const bob=(Math.sin(o.ph)>0)?0:1;
      for(let j=-1;j<=1;j++){ const c=xi+j; setCh(grid,br-bob,c,o.body[j+1]); setMode(mg,br-bob,c,'orc'); }
      // raised spear
      setCh(grid,br-1-bob,xi,(Math.random()<0.5?"|":"Y")); setMode(mg,br-1-bob,xi,'orc');
      setCh(grid,br+1-bob,xi,(Math.random()<0.5?"/":"\\")); setMode(mg,br+1-bob,xi,'orc');
    }
  } else {
    // ground rumbles as the tower emerges
    for(let k=0;k<COLS*0.12;k++){ const c=towerCx+(((Math.random()*30)|0)-15), r=streetRow-((Math.random()*3)|0); if(c>=0&&c<COLS){ setCh(grid,r,c,["'",".","^"][(Math.random()*3)|0]); setMode(mg,r,c,'tower'); } }
  }
  return {grid,mg};
}

// ---- WORLDWIDE FREEZE: a Snowpiercer deep-freeze locks the city in ice ----
function freezeInit(){
  snowflakes=[];
  const n=Math.floor(COLS*0.7);
  for(let i=0;i<n;i++){ snowflakes.push({ x:(Math.random()*COLS)|0, y:(Math.random()*ROWS)|0, spd:0.5+Math.random()*1.2, drift:(Math.random()*2-1)*0.6, ch:["*","+",".","\u2744"][(Math.random()*4)|0] }); }
}
function freezeStep(){
  for(const f of snowflakes){ f.y+=f.spd; f.x+=f.drift; if(f.y>ROWS){ f.y=-1; f.x=(Math.random()*COLS)|0; } if(f.x<0)f.x=COLS-1; if(f.x>=COLS)f.x=0; }
}
function freezeRender(t, level){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ice creeps UP the buildings from the ground as `level` (0..1) grows,
  // encasing them: building chars get frosted/replaced with ice.
  const iceTop=Math.floor(streetRow - level*streetRow);
  for(let r=streetRow;r>=iceTop;r--){
    for(let c=0;c<COLS;c++){
      if(grid[r] && grid[r][c] && grid[r][c]!==" "){
        // frost over existing structure
        if(Math.random()<0.5){ setCh(grid,r,c,(Math.random()<0.4?"#":grid[r][c])); setMode(mg,r,c,'ice'); }
      } else if(r>=streetRow-1 && Math.random()<0.4){
        // ice/snow drifts piling at street level
        setCh(grid,r,c,(Math.random()<0.5?"=":"#")); setMode(mg,r,c,'ice');
      }
    }
  }
  // icicles hanging + frost sparkle on the frozen zone
  for(let k=0;k<COLS*0.2;k++){ const c=(Math.random()*COLS)|0, r=iceTop+((Math.random()*Math.max(1,streetRow-iceTop))|0);
    if(r>=0&&r<streetRow && grid[r] && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"V":".")); setMode(mg,r,c,'ice'); } }
  // thick snowpack on the street
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.3+level*0.5) g[c]="#"; if(g[c]==="#") setMode(mg,streetRow,c,'ice'); } grid[streetRow]=g.join(""); }

  // driving blizzard snow over everything
  for(const f of snowflakes){ const r=Math.round(f.y), c=Math.round(f.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,f.ch); setMode(mg,r,c,'snow'); } }

  // ---- SNOWPIERCER: an elevated track ringing the city with a train looping around it ----
  const trackRow=streetRow-1;
  // lay the track across the full width (train circles the frozen world endlessly)
  { let g=grid[trackRow].split(""); for(let c=0;c<COLS;c++){ g[c]="="; setMode(mg,trackRow,c,'sptrain'); } grid[trackRow]=g.join(""); }
  // trestle supports under the track
  for(let c=0;c<COLS;c+=6){ setCh(grid,streetRow,c,"|"); setMode(mg,streetRow,c,'sptrain'); }
  // the train itself: an engine + a long chain of cars, continuously circling (looping)
  const car="[#oo#]";                       // one carriage
  const engine="@DD==>";                    // engine at the front
  const trainStr=engine + car.repeat(7);    // long Snowpiercer
  const L=trainStr.length;
  const head=((spTrainX % COLS)+COLS)%COLS;  // head column, wraps 0..COLS-1
  for(let j=0;j<L;j++){
    const c=((head - (L-1-j)) % COLS + COLS) % COLS;   // cars trail behind the head, wrapping
    const ch=trainStr[j]; if(ch===" ")continue;
    setCh(grid,trackRow,c,ch); setMode(mg,trackRow,c,'sptrain');
  }

  return {grid,mg};
}

// ---- THANOS: the Avengers fail, he snaps, and half of everything turns to dust ----
// Stark Tower on the left, Thanos striding from the right, heroes lined up between.
const thanosSprite=[
  "   ___   ",
  "  /@ @\\  ",
  "  \\_-_/  ",
  " /|MWM|\\=*",   // right hand ends in the glowing gauntlet (=*)
  "  |###|  ",
  "  /###\\  ",
  "  |  |  ",
  " _|  |_ ",
];
const starkTower=[
  "   _____   ",
  "  |  A  |  ",
  "  | STARK| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  "  |#####| ",
  "  |#H#H#| ",
  " _|#####|_ ",
];
const heroSprites=["o/|","o|\\","\\o/","o+|","|o|"];   // little avengers
function thanosDraw(px, snapped, fade){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // Stark Tower stands tall and central over the skyline
  const twW=starkTower[0].length;
  const stCx=cx, stTop=streetRow-starkTower.length+1;
  for(let i=0;i<starkTower.length;i++){ const r=stTop+i, art=starkTower[i];
    for(let j=0;j<art.length;j++){ const c=stCx+j-Math.floor(twW/2); if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'stark'); } }

  // after the snap: half the buildings crumble to dust (every other column)
  if(snapped){
    for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
      for(let c=0;c<COLS;c++){ if((c%2===0) && ln[c]!==" " && mg[r][c]!=='stark' && Math.random()<fade){ ln[c]=(Math.random()<0.4?".":" "); if(ln[c]===".") setMode(mg,r,c,'dust'); } }
      grid[r]=ln.join(""); }
  }

  // the Avengers lined up defending in front of the tower, disintegrating after the snap
  const heroRow=streetRow-1, heroStart=Math.floor(COLS*0.18);
  const heroN=6;
  for(let h=0;h<heroN;h++){
    const hx=heroStart+h*3;
    // half the heroes vanish after the snap
    if(snapped && h%2===0 && Math.random()<fade) continue;   // dusted
    const spr=heroSprites[h%heroSprites.length];
    for(let j=0;j<spr.length;j++){ const c=hx+j; if(c<0||c>=COLS)continue; setCh(grid,heroRow,c,spr[j]); setMode(mg,heroRow,c,'hero'); }
    setCh(grid,heroRow-1,hx+1,"o"); setMode(mg,heroRow-1,hx+1,'hero');  // head
  }

  // Thanos striding in from the right
  const tTop=streetRow-thanosSprite.length+1;
  for(let i=0;i<thanosSprite.length;i++){ const r=tTop+i, art=thanosSprite[i];
    for(let j=0;j<art.length;j++){ const c=Math.round(px)+j; if(c<0||c>=COLS)continue; if(art[j]===" ")continue;
      const isGaunt=(art[j]==="*"||art[j]==="=");
      setCh(grid,r,c,art[j]); setMode(mg,r,c,isGaunt?'gauntlet':'thanos'); } }

  // drifting dust motes after the snap
  if(snapped){
    for(const m of dustMotes){ const r=Math.round(m.y), c=Math.round(m.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,["."," ","'","*"][(Math.random()*4)|0]||"."); setMode(mg,r,c,'dust'); } }
  }
  return {grid,mg};
}

// ---- INCEPTION: the city folds up and over onto itself ----
function inceptionRender(t, fold){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const base=cityGridArr.slice();
  const grid=blankGrid(ROWS);
  const mg=modeGridFill(ROWS,COLS,'city');
  // copy base city first
  for(let r=0;r<ROWS;r++) grid[r]=base[r]||" ".repeat(COLS);

  // the right half of the city lifts and folds up over the left as `fold` (0..1) grows,
  // hinging at the centre: mirrored buildings arc up and overhead.
  const hinge=cx;
  const ang=fold*Math.PI*0.9;                    // 0 = flat, ~PI = folded fully over
  for(let r=0;r<streetRow;r++){
    for(let c=hinge;c<COLS;c++){
      const src=base[r] && base[r][c];
      if(!src || src===" ") continue;
      const d=c-hinge;                            // distance from hinge along the folding flap
      const hgt=streetRow-r;                      // building height at this point
      // rotate the point up and back toward the hinge
      const nc=Math.round(hinge + d*Math.cos(ang));
      const nr=Math.round(r - d*Math.sin(ang));
      if(nc>=0&&nc<COLS&&nr>=0&&nr<ROWS){
        setCh(grid,nr,nc, (Math.random()<0.3?"/":src)); setMode(mg,nr,nc,'fold');
      }
      // clear the original as it lifts away
      if(fold>0.2){ let ln=grid[r].split(""); if(ln[c]===src) ln[c]=" "; grid[r]=ln.join(""); }
    }
  }
  // dreamy debris drifting in the folded space
  for(let k=0;k<COLS*0.2*fold;k++){ const c=(Math.random()*COLS)|0, r=(Math.random()*streetRow)|0;
    if(grid[r] && grid[r][c]===" "){ setCh(grid,r,c,["*",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'fold'); } }
  return {grid,mg};
}

// ---- DRAGONS: Drogon & co. wheel over the city and burn it to ash ----
const dragonSprite=["<vvVOvv>", "  ^^^^  "];    // wings + body with eye
function dragonsInit(){
  dragons=[]; dragDmg=0; dragBurn=null;
  for(let i=0;i<3;i++){ dragons.push({ x:-((Math.random()*COLS)|0), y:2+((Math.random()*Math.floor(streetRow*0.4))|0), spd:1+Math.random()*1.5, dir:1, burn:Math.random()<0.5, burnCool:((Math.random()*20)|0) }); }
}
function dragonsStep(t){
  if(!dragBurn) dragBurn=new Array(COLS).fill(0);   // per-column burn intensity (0..1)
  for(const d of dragons){ d.x+=d.spd*d.dir; d.y+=Math.sin(t*0.2+d.x*0.05)*0.4;
    // dragons toggle their fire breath on and off as they fly
    d.burnCool--; if(d.burnCool<=0){ d.burn=!d.burn; d.burnCool=8+((Math.random()*16)|0); }
    if(d.dir>0 && d.x>COLS+8){ d.x=-8; d.y=2+((Math.random()*Math.floor(streetRow*0.4))|0); }
    if(d.dir<0 && d.x<-8){ d.x=COLS+8; }
    // where a breathing dragon is, ignite the columns beneath it
    if(d.burn){ const xi=Math.round(d.x); for(let dj=-3;dj<=3;dj++){ const c=xi+dj; if(c>=0&&c<COLS) dragBurn[c]=Math.min(1, dragBurn[c]+0.15); } }
  }
  // track how far the fire has spread (for the completion check) = burned column count
  let burned=0; for(let c=0;c<COLS;c++) if(dragBurn[c]>0.3) burned++;
  dragDmg=burned;
}
function dragonsRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(!dragBurn) dragBurn=new Array(COLS).fill(0);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // permanently burn away buildings ONLY in columns that have actually been torched
  for(let c=0;c<COLS;c++){ if(dragBurn[c]>0.4 && cityGridArr[0]!==undefined){
    for(let r=0;r<streetRow;r++){ if(cityGridArr[r] && cityGridArr[r][c] && cityGridArr[r][c]!==" " && Math.random()<dragBurn[c]*0.25){ let ln=cityGridArr[r].split(""); ln[c]=" "; cityGridArr[r]=ln.join(""); } } } }
  collapseCity(0.35);   // burnt-out buildings collapse
  for(let r=0;r<ROWS;r++) grid[r]=cityGridArr[r];
  // ground fires + ash only where actually burned (small licks at street level)
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(dragBurn[c]>0.35 && Math.random()<dragBurn[c]*0.35){ g[c]=(Math.random()<0.5?"#":"^"); setMode(mg,streetRow,c,'dragonfire'); } } grid[streetRow]=g.join(""); }
  // flames flickering ON the burning buildings — recolour building cells as fire, plus a lick just above the rooftop
  for(let c=0;c<COLS;c++){ if(dragBurn[c]<=0.35) continue;
    let topSolid=-1;
    for(let r=0;r<streetRow;r++){
      if(grid[r] && grid[r][c] && grid[r][c]!==" "){
        if(topSolid<0) topSolid=r;                 // remember the rooftop
        // set the building surface alight (some of its own material turns to flame)
        if(Math.random()<dragBurn[c]*0.4){ setCh(grid,r,c,["#","@","^"][(Math.random()*3)|0]); setMode(mg,r,c,'dragonfire'); }
      }
    }
    // a small flame flickering just above the rooftop of the burning building
    if(topSolid>0 && Math.random()<dragBurn[c]*0.6){ setCh(grid,topSolid-1,c,(Math.random()<0.5?"^":"*")); setMode(mg,topSolid-1,c,'dragonfire'); }
  }
  // the dragons wheeling overhead, breathing fire down
  for(const d of dragons){
    const xi=Math.round(d.x), yi=Math.round(d.y);
    for(let i=0;i<dragonSprite.length;i++){ const art=dragonSprite[i];
      for(let j=0;j<art.length;j++){ const c=xi+j-4, r=yi+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'dragon'); } }
    // breath cone down to the ground (only when actively breathing)
    if(d.burn){ const mc=xi; for(let r=yi+2;r<streetRow;r++){ const spread=1+Math.floor((r-yi)/6);
      for(let dj=-spread;dj<=spread;dj++){ const c=mc+dj; if(c<0||c>=COLS)continue; if(Math.random()<0.6){ setCh(grid,r,c,["#","@","%"][(Math.random()*3)|0]); setMode(mg,r,c,'dragonfire'); } } } }
  }
  return {grid,mg};
}

// ---- AI TAKEOVER: the machines convert the city into cascading code ----
function aiInit(){
  aiCols=[]; aiTakeover=0;
  for(let c=0;c<COLS;c++){ aiCols.push({ y:-((Math.random()*ROWS)|0), spd:0.5+Math.random()*1.5, active:false }); }
}
function aiStep(t){
  aiTakeover=Math.min(COLS, aiTakeover+Math.max(1,Math.floor(COLS/50)));
  for(let c=0;c<COLS;c++){ const a=aiCols[c]; if(Math.abs(c-cx)<aiTakeover) a.active=true; if(a.active){ a.y+=a.spd; if(a.y>ROWS+ (Math.random()*10)) a.y=-((Math.random()*6)|0); } }
}
function aiRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const glyphs="01<>[]{}/\\|=+*#";
  // dissolve the city into code in the taken-over zone
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){ if(Math.abs(c-cx)<aiTakeover){ if(ln[c]!==" " && Math.random()<0.5){ ln[c]=glyphs[(Math.random()*glyphs.length)|0]; setMode(mg,r,c,'matrix'); } else if(ln[c]!==" "&&Math.random()<0.2){ ln[c]=" "; } } }
    grid[r]=ln.join(""); }
  // cascading code rain columns (Matrix-style) in the active zone
  for(let c=0;c<COLS;c++){ const a=aiCols[c]; if(!a.active)continue;
    const head=Math.round(a.y);
    for(let k=0;k<6;k++){ const r=head-k; if(r<0||r>=ROWS)continue; if(Math.random()<0.3)continue;
      const ch=glyphs[(Math.random()*glyphs.length)|0]; setCh(grid,r,c,ch); setMode(mg,r,c,'matrix'); } }
  // a takeover banner
  if(t%12<4){ const msg=">> SYSTEM UNDER NEW MANAGEMENT <<"; const sC=cx-Math.floor(msg.length/2);
    for(let j=0;j<msg.length;j++){ const c=sC+j; if(c>=0&&c<COLS){ setCh(grid,2,c,msg[j]==" "?" ":msg[j]); if(msg[j]!==" ")setMode(mg,2,c,'matrix'); } } }
  return {grid,mg};
}

// ---- MAN OF STEEL: the Kryptonian World Engine terraforms + super-beings brawl ----
function steelInit(){
  weDmg=0; shockRings=[]; fighters=[];
  // two super-beings that streak around and collide
  for(let i=0;i<2;i++){ fighters.push({ x:cx+(i?20:-20), y:Math.floor(streetRow*0.4), tx:cx, ty:Math.floor(streetRow*0.4), team:i, trail:[] }); }
}
function steelStep(t){
  weDmg=Math.min(cx+2, weDmg+Math.max(1,Math.floor(COLS/44)));   // gravity pulse spreads
  // periodically emit a shock ring from ground zero
  if(t%6===0) shockRings.push({r:1});
  for(const s of shockRings){ s.r+=2; }
  while(shockRings.length && shockRings[0].r>COLS) shockRings.shift();
  // fighters dart to new positions (the brawl), occasionally slamming together at centre
  for(const f of fighters){
    if(Math.random()<0.2){ f.tx=cx+(((Math.random()*COLS*0.7)|0)-Math.floor(COLS*0.35)); f.ty=1+((Math.random()*Math.floor(streetRow*0.7))|0); }
    f.x+=(f.tx-f.x)*0.35; f.y+=(f.ty-f.y)*0.35;
    f.trail.push({x:Math.round(f.x),y:Math.round(f.y)}); if(f.trail.length>6) f.trail.shift();
  }
}
function steelRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // flatten the centre where the gravity beam pounds the ground
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cx-weDmg;c<=cx+weDmg;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.5) ln[c]=" "; } grid[r]=ln.join(""); }
  // rubble + dust at ground zero
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.abs(c-cx)<weDmg){ if(Math.random()<0.4) g[c]=[".",",","_","#"][(Math.random()*4)|0]; } } grid[streetRow]=g.join(""); }

  // expanding shock rings along the ground (gravity pulses)
  for(const s of shockRings){ for(const dir of [-1,1]){ const c=cx+dir*s.r; if(c>=0&&c<COLS){ setCh(grid,streetRow-0,c,dir>0?">":"<"); setMode(mg,streetRow,c,'gravbeam'); setCh(grid,streetRow-1,c,dir>0?")":"("); setMode(mg,streetRow-1,c,'gravbeam'); } } }

  // the World Engine: a huge black Kryptonian rig hovering at top, tripod legs
  const weCx=cx, weTop=1;
  const engine=[
    "    __/####\\__    ",
    "  /##  ()()  ##\\  ",
    " |###  WORLD  ###| ",
    " |### ENGINE  ###| ",
    "  \\##_@@@@@@_##/  ",
    "    \\/ |||| \\/    ",
  ];
  for(let i=0;i<engine.length;i++){ const art=engine[i], r=weTop+i;
    for(let j=0;j<art.length;j++){ const c=weCx+j-Math.floor(art.length/2); if(c<0||c>=COLS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'worldengine'); } }
  // the wide gravity beam punching down from the engine to the ground
  const beamTop=weTop+engine.length, half=Math.max(3,Math.floor(COLS*0.06));
  for(let r=beamTop;r<=streetRow;r++){ for(let dc=-half;dc<=half;dc++){ const c=cx+dc; if(c<0||c>=COLS)continue;
    const edge=Math.abs(dc)>=half-1; if(edge && Math.random()<0.5)continue; if(Math.random()<0.2)continue;
    setCh(grid,r,c, (Math.random()<0.5?"|":":")); setMode(mg,r,c,'gravbeam'); } }
  // gravity debris floating upward in the beam
  for(let k=0;k<COLS*0.15;k++){ const c=cx+(((Math.random()*half*2)|0)-half), r=beamTop+((Math.random()*(streetRow-beamTop))|0);
    if(c>=0&&c<COLS){ setCh(grid,r,c,["*",".",":","o"][(Math.random()*4)|0]); setMode(mg,r,c,'worldengine'); } }

  // the two brawling super-beings streaking around with motion trails
  for(const f of fighters){
    for(const tr of f.trail){ if(tr.x>=0&&tr.x<COLS&&tr.y>=0&&tr.y<ROWS){ setCh(grid,tr.y,tr.x,(Math.random()<0.5?"*":"'")); setMode(mg,tr.y,tr.x,f.team?'heatvision':'gravbeam'); } }
    const xi=Math.round(f.x), yi=Math.round(f.y);
    if(xi>=0&&xi<COLS&&yi>=0&&yi<ROWS){
      setCh(grid,yi,xi,"O"); setMode(mg,yi,xi,'krypton');
      if(yi+1<ROWS){ setCh(grid,yi+1,xi, f.team?"X":"S"); setMode(mg,yi+1,xi,'krypton'); }  // one wears the S
    }
  }
  // heat-vision clash where they're close
  if(fighters.length===2){ const a=fighters[0],b=fighters[1]; const dist=Math.hypot(a.x-b.x,a.y-b.y);
    if(dist<14){ const steps=Math.max(2,Math.round(dist)); for(let s=0;s<=steps;s++){ const c=Math.round(a.x+(b.x-a.x)*s/steps), r=Math.round(a.y+(b.y-a.y)*s/steps);
      if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.7){ setCh(grid,r,c,(Math.random()<0.5?"=":"~")); setMode(mg,r,c,'heatvision'); } } } }
  return {grid,mg};
}

// ---- JURASSIC PARK SAN DIEGO: a T. rex rampages downtown, raptors roam the streets ----
// big T. rex sprite (drawn bottom-anchored, feet on the street)
const rexSprite=[
  "            __ ",
  "          _/ o\\_ ",
  "         / VVVV \\ ",
  "     ___/'------ ",
  "   _/   \\        ",
  "  / /|    \\___   ",
  " |_/ |   /|   \\  ",
  "     |  / |    | ",
  "    _|  \\ |   /| ",
  "   /_|   \\|__/ | ",
  "  (__)   /  \\  | ",
  "        (_)  (_)  ",
];
const raptorSprite=["<^== O>","  / \\ \\"];   // small raptor
function dinoInit(){
  dinoDmg=0;
  rex={ x:COLS+6, dir:-1, spd:0.7, step:0 };     // T. rex enters from the right, walks left
  raptors=[];
  for(let i=0;i<4;i++){ raptors.push({ x:(Math.random()*COLS)|0, dir:Math.random()<0.5?1:-1, spd:0.6+Math.random()*1.0, ph:Math.random()*6 }); }
}
function dinoStep(t){
  rex.x+=rex.spd*rex.dir; rex.step+=0.3;
  if(rex.x<-14){ rex.x=COLS+6; }                 // loop the rex across town
  for(const r of raptors){ r.x+=r.spd*r.dir; r.ph+=0.4; if(r.x<0)r.x=COLS; if(r.x>COLS)r.x=0; if(Math.random()<0.02)r.dir*=-1; }
  // the rex flattens buildings it walks through; damage spreads behind it
  dinoDmg=Math.min(COLS, dinoDmg+ (t%2===0?1:0));
}
function dinoRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ---- JURASSIC PARK SAN DIEGO amphitheater/banner in the background (left) ----
  const banner="JURASSIC PARK  -  SAN DIEGO";
  const bC=2;
  for(let j=0;j<banner.length;j++){ const c=bC+j; if(c>=0&&c<COLS && banner[j]!==" "){ setCh(grid,1,c, banner[j]); setMode(mg,1,c,'jpsign'); } }
  // amphitheater arch under the banner
  const arch=[" /=========\\ ","/  GATE 1   \\","|===========|"];
  for(let i=0;i<arch.length;i++){ for(let j=0;j<arch[i].length;j++){ const c=bC+j; const r=2+i; if(c<COLS && arch[i][j]!==" "){ setCh(grid,r,c,arch[i][j]); setMode(mg,r,c,'jpsign'); } } }

  // ---- the rex smashes a swath of buildings around its position ----
  const rexC=Math.round(rex.x)+5;
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=rexC;c<COLS;c++){ if(Math.abs(c-rexC)<3 && ln[c]!==" " && Math.random()<0.6) ln[c]=" "; }  // right where it steps
    // trailing wreckage across everywhere it's already walked (to the right of it)
    for(let c=rexC+6;c<COLS;c++){ if(ln[c]!==" " && Math.random()<0.25) ln[c]=" "; }
    grid[r]=ln.join(""); }
  // rubble + cracked road under the rampage
  { let g=grid[streetRow].split(""); for(let c=rexC;c<COLS;c++){ if(Math.random()<0.3) g[c]=[".",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }

  // ---- draw the T. rex, bottom-anchored ----
  const rexTop=streetRow-rexSprite.length+1;
  const bob=(Math.sin(rex.step)>0)?0:1;
  for(let i=0;i<rexSprite.length;i++){ const art=rexSprite[i], r=rexTop+i-bob;
    for(let j=0;j<art.length;j++){ const c=Math.round(rex.x)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'dino'); } }
  // ROAR! near its head
  if(t%12<3){ const roar="ROAAAR!"; const hc=Math.round(rex.x)+14; for(let j=0;j<roar.length;j++){ const c=hc+j; if(c>=0&&c<COLS){ setCh(grid,Math.max(0,rexTop-1),c,roar[j]); setMode(mg,Math.max(0,rexTop-1),c,'dino'); } } }

  // ---- raptors darting along the street ----
  const rr=streetRow-1;
  for(const rp of raptors){
    const xi=Math.round(rp.x), bob2=(Math.sin(rp.ph)>0)?0:1;
    const spr = rp.dir>0 ? "<^==Oo>" : "<oO==^>";
    for(let j=0;j<spr.length;j++){ const c=xi+j-3; if(c<0||c>=COLS)continue; if(spr[j]===" ")continue; setCh(grid,rr-bob2,c,spr[j]); setMode(mg,rr-bob2,c,'dino'); }
    // legs
    setCh(grid,rr+1-bob2 < ROWS ? rr : rr, xi, "^");
  }
  // fleeing people (tiny) scattering from the dinos
  for(let k=0;k<Math.max(2,Math.floor(COLS*0.04));k++){ const c=((t*2+k*13)%COLS); if(Math.abs(c-rexC)>8){ setCh(grid,streetRow-1,c,"!"); } }
  return {grid,mg};
}

// ---- SATAN: the ground splits open, Hell's army rises, and the Devil claims his throne ----
function satanInit(){
  riftW=0; demons=[]; satanRise=0;
}
function spawnDemon(){
  // demons climb out of the rift near the centre and spread outward
  demons.push({ x:cx+(((Math.random()*riftW*2)|0)-riftW), y:streetRow-1, dir:Math.random()<0.5?1:-1, spd:0.2+Math.random()*0.5, ph:Math.random()*6, climb:6+((Math.random()*6)|0) });
}
// the fiery chasm + lava at the bottom
function drawRift(grid, mg, w){
  const half=w;
  for(let r=streetRow;r>=Math.max(1,streetRow-2);r--){}   // (street handled below)
  // carve the chasm: everything within half of centre becomes the pit
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cx-half;c<=cx+half;c++){ if(c<0||c>=COLS)continue; ln[c]=" "; } grid[r]=ln.join(""); }
  // jagged glowing chasm walls
  for(let r=streetRow;r>streetRow-Math.min(streetRow, Math.floor(w*0.8));r--){
    const wob=Math.floor(Math.sin(r*0.7)*1.5);
    setCh(grid,r,cx-half+wob,"\\"); setMode(mg,r,cx-half+wob,'hellfire');
    setCh(grid,r,cx+half-wob,"/"); setMode(mg,r,cx+half-wob,'hellfire');
  }
  // lava + flames roiling up from the pit
  for(let r=streetRow;r>streetRow-Math.min(streetRow, Math.floor(w*0.7));r--){
    for(let c=cx-half+1;c<cx+half;c++){ if(c<0||c>=COLS)continue;
      const deep=(streetRow-r);
      if(Math.random()< 0.35 - deep*0.02){ setCh(grid,r,c,["#","@","%","~","'"][(Math.random()*5)|0]); setMode(mg,r,c,'hellfire'); }
    }
  }
  // rubble lip at the street edges of the rift
  setCh(grid,streetRow,cx-half,"V"); setCh(grid,streetRow,cx+half,"V"); setMode(mg,streetRow,cx-half,'hellfire'); setMode(mg,streetRow,cx+half,'hellfire');
}
// a small demon sprite
function drawDemon(grid,mg,d){
  const xi=Math.round(d.x), yi=Math.round(d.y);
  const bob=(Math.sin(d.ph)>0)?0:1;
  // horns + head
  setCh(grid,yi-1-bob,xi,"V"); setMode(mg,yi-1-bob,xi,'demon');       // horns
  setCh(grid,yi-bob,xi,"o"); setMode(mg,yi-bob,xi,'demon');           // head/eye
  // body + wings + trident
  setCh(grid,yi+1-bob,xi-1,"/"); setCh(grid,yi+1-bob,xi,"T"); setCh(grid,yi+1-bob,xi+1,"\\");
  setMode(mg,yi+1-bob,xi-1,'demon'); setMode(mg,yi+1-bob,xi,'demon'); setMode(mg,yi+1-bob,xi+1,'demon');
}
function satanRender(t, mode, w, rise){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // the rift is open in all phases once started
  drawRift(grid, mg, w);

  // demons overrunning the city (army phase onward)
  if(mode!=='rift'){
    for(const d of demons){ drawDemon(grid,mg,d);
      // demons trample buildings where they roam
      const xi=Math.round(d.x); for(let r=0;r<streetRow;r++){ if(grid[r]&&grid[r][xi]&&grid[r][xi]!==" "&&mg[r][xi]!=='demon'&&Math.random()<0.2){ let ln=grid[r].split(""); ln[xi]=" "; grid[r]=ln.join(""); } }
    }
    // red hellish sky embers
    for(let k=0;k<COLS*0.12;k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.floor(streetRow*0.4))|0); setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]); setMode(mg,r,c,'hellfire'); }
  }

  // SATAN himself rises from the pit and takes his throne (throne phase)
  if(mode==='throne'){
    const satan=[
      "  \\W/   \\W/  ",
      "   \\Y/^Y^\\Y/   ",
      "    ( O  O )    ",
      "   / \\ VV / \\   ",
      "  /   \\__/   \\  ",
      "  |   #==#   |  ",
      "  |  #====#  |  ",
      " _|__#====#__|_ ",
    ];
    const sh=satan.length;
    // rise from below the street up to sit on a throne over the rift
    const seat=streetRow - Math.floor(rise*(sh+2));
    const top=seat - sh + 1;
    for(let i=0;i<sh;i++){ const art=satan[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=cx+j-Math.floor(art.length/2); if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'satan'); } }
    // throne back / hellglow behind him once fully risen
    if(rise>=1){
      for(let r=top-2;r<=seat;r++){ setCh(grid,r,cx-9,"H"); setCh(grid,r,cx+9,"H"); setMode(mg,r,cx-9,'satan'); setMode(mg,r,cx+9,'satan'); }
      for(let k=0;k<COLS*0.1;k++){ const c=cx+(((Math.random()*20)|0)-10), r=Math.max(0,top-((Math.random()*3)|0)); setCh(grid,r,c,["*","+"][(Math.random()*2)|0]); setMode(mg,r,c,'satan'); }
    }
  }
  return {grid,mg};
}

// ---- TITANIC: the great liner never stopped and ploughs straight through the city ----
// The ship is tall (funnels + superstructure + hull). Drawn with its bow at shipX (moving right).
function titanicSprite(){
  // built relative to a hull length; funnels sit atop the superstructure
  return [
    "        |    |    |    |            ",   // funnel tops
    "       .|.  .|.  .|.  .|.           ",
    "      _|H|__|H|__|H|__|H|__         ",   // funnels (banded)
    "   __/=====================\\___     ",   // boat deck
    "  /  o  o  o  o  o  o  o  o   \\__    ",   // lifeboats / superstructure
    " / R.M.S.  T I T A N I C  ..... \\_  ",   // name + portholes
    "/_______________________________ \\ ",   // hull top
    "\\  . . . . . . . . . . . . . . .  =>",   // hull w/ bow point (=>)
    " \\_____________________________/    ",   // hull bottom / keel
  ];
}
// permanently demolishes the base city up to column bx — mutates cityGridArr so the
// wreckage sticks around instead of flickering back to intact buildings next frame.
function titanicDemolish(bx){
  if(cityGridArr.length!==ROWS) return;
  const bxi=Math.round(bx);
  for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
    // ahead of the bow: crumple a few columns on impact
    for(let c=bxi;c<Math.min(COLS,bxi+4);c++){ if(ln[c]!==" " && Math.random()<0.7) ln[c]=" "; }
    // under & behind the ship: flattened for good
    for(let c=0;c<bxi;c++){ if(ln[c]!==" " && Math.random()<0.6) ln[c]=" "; }
    cityGridArr[r]=ln.join(""); }
  // debris / wake of rubble behind the ship
  if(cityGridArr[streetRow]){ let g=cityGridArr[streetRow].split(""); for(let c=0;c<bxi;c++){ if(Math.random()<0.3) g[c]=[".",",","_","#"][(Math.random()*4)|0]; } cityGridArr[streetRow]=g.join(""); }
}
function titanicRender(bx){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(bx);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=titanicSprite();
  const sh=spr.length, sw=spr[0].length;
  const shipLeft=Math.round(bx)-sw;               // bx = bow (right edge) column
  const keelRow=streetRow;                        // keel rides along the street
  const top=keelRow-sh+1;

  // funnel smoke billowing back over the city
  if(titanicT%2===0){ for(let f=0;f<4;f++){ const fc=shipLeft+7+f*7; titanicSmoke.push({x:fc, y:top-1, vx:-(0.3+Math.random()*0.5), vy:-(0.2+Math.random()*0.4), life:20}); } }
  for(const s of titanicSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,(s.life>10?"@":".")); setMode(mg,r,c,'steam'); } }
  titanicSmoke=titanicSmoke.filter(s=>s.life>0);

  // draw the ship
  for(let i=0;i<sh;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=shipLeft+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'ship'); } }

  // crumpling buildings toppling at the bow (impact splinters)
  for(let k=0;k<COLS*0.12;k++){ const c=Math.round(bx)+((Math.random()*5)|0), r=streetRow-((Math.random()*Math.floor(streetRow*0.7))|0);
    if(c>=0&&c<COLS){ setCh(grid,r,c,["#","/","\\","*"][(Math.random()*4)|0]); setMode(mg,r,c,'rubble'); } }
  return {grid,mg};
}

// ---- TITANIC WRECK: once wedged to a stop it keels over, listing hard onto its side ----
// angleDeg: 0 upright .. ~26, how far it has rolled over. The hull stays intact as one rigid
// piece, pivoting around the bow where it's jammed into the ruins.
function titanicWreckRender(bx, angleDeg){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(COLS);                          // the whole plough path stays permanently wrecked
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=titanicSprite();
  const sh=spr.length, sw=spr[0].length;
  const aspect=2;                                 // terminal cells are roughly twice as tall as wide

  // thinning funnel smoke, still drifting off the capsized hull
  if(titanicT%3===0){ const fc=Math.round(bx)-sw*0.4-Math.random()*sw*0.3; titanicSmoke.push({x:fc, y:streetRow-sh*0.6, vx:-(0.2+Math.random()*0.4), vy:-(0.2+Math.random()*0.3), life:16}); }
  for(const s of titanicSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,(s.life>8?"@":".")); setMode(mg,r,c,'steam'); } }
  titanicSmoke=titanicSmoke.filter(s=>s.life>0);

  // rotate the whole hull as one rigid piece around where the bow is wedged into the ruins
  const pr=sh-1, pc=sw-3;
  const pivotRow=streetRow, pivotCol=Math.round(bx)-3;
  const phi=angleDeg*Math.PI/180, cosP=Math.cos(phi), sinP=Math.sin(phi);
  for(let i=0;i<sh;i++){ const art=spr[i];
    for(let j=0;j<art.length;j++){ const ch=art[j]; if(ch===" ")continue;
      const X=j-pc, Y=-(i-pr)*aspect;
      const Xr=X*cosP-Y*sinP, Yr=X*sinP+Y*cosP;
      const c=Math.round(pivotCol+Xr), r=Math.round(pivotRow-Yr/aspect);
      if(c<0||c>=COLS||r<0||r>=ROWS)continue;
      setCh(grid,r,c,ch); setMode(mg,r,c,'ship'); } }

  return {grid,mg};
}

// ---- MORTAL ENGINES: cranes strip the city for parts, which drives off as a Traction City ----
// tower cranes are taller than anything they're demolishing: the jib sits above the whole
// skyline and the mast runs almost all the way down to street level, alongside the buildings.
function craneCols(){ const n=Math.max(3,Math.min(6,Math.floor(COLS/26))); return Array.from({length:n},(_,i)=>Math.round((i+0.5)*COLS/n)); }
function craneReach(){ const n=craneCols().length; return Math.max(9,Math.ceil(COLS/n/2)+3); }   // wide enough that neighbouring cranes' reach overlaps — no gaps left standing
// permanently strips buildings within reach of every crane — mutates cityGridArr so the demolition sticks
function mortalCraneDemolish(rate){
  if(cityGridArr.length!==ROWS) return;
  const reach=craneReach();
  for(const cc of craneCols()){
    for(let r=0;r<streetRow;r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
      for(let c=cc-reach;c<=cc+reach;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<rate) ln[c]=" "; }
      cityGridArr[r]=ln.join(""); }
  }
}
function craneRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  mortalCraneDemolish(0.18);
  const jibRow=1, mastBottom=Math.max(jibRow,streetRow-1), reach=craneReach();
  // work out each crane's hook position first, and rip an extra chunk out right where it grips —
  // ties the visible demolition to the hook actually reaching down into the buildings
  const hooks=craneCols().map(cc=>{
    const swing=Math.round(Math.sin(t*0.1+cc)*reach*0.8);
    const hookCol=cc+swing;
    const cyc=16, ph=(t+Math.round(cc))%cyc;
    const depth=ph<cyc/2 ? ph/(cyc/2) : (cyc-ph)/(cyc/2);          // 0 raised .. 1 lowered .. 0 raised
    const hookRow=Math.round(jibRow+2+depth*Math.max(1,mastBottom-jibRow-2));
    if(depth>0.7){
      for(let dr=-1;dr<=1;dr++){ for(let dc=-2;dc<=2;dc++){ const r=hookRow+dr,c=hookCol+dc;
        if(r>=0&&r<streetRow&&c>=0&&c<COLS&&cityGridArr[r]&&cityGridArr[r][c]!==" "&&Math.random()<0.6){
          let ln=cityGridArr[r].split(""); ln[c]=" "; cityGridArr[r]=ln.join(""); } } }
    }
    return {cc,hookCol,hookRow};
  });
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const cc of craneCols()){
    for(let r=jibRow;r<=mastBottom;r++){ setCh(grid,r,cc,"|"); setMode(mg,r,cc,'crane'); }         // mast, down alongside the buildings
    for(let dc=-reach;dc<=reach;dc++){ const c=cc+dc; if(c<0||c>=COLS)continue; setCh(grid,jibRow,c,(dc===0?"+":"=")); setMode(mg,jibRow,c,'crane'); } // jib, above the skyline
  }
  for(const h of hooks){
    for(let r=jibRow+1;r<h.hookRow;r++){ if(h.hookCol>=0&&h.hookCol<COLS&&r>=0&&r<ROWS){ setCh(grid,r,h.hookCol,":"); setMode(mg,r,h.hookCol,'crane'); } }
    if(h.hookCol>=0&&h.hookCol<COLS&&h.hookRow>=0&&h.hookRow<ROWS){ setCh(grid,h.hookRow,h.hookCol,"O"); setMode(mg,h.hookRow,h.hookCol,'crane'); }
  }
  return {grid,mg};
}
// the Traction City: a mobile fortress on tracks, salvaged from the demolished skyline
const tractionCitySprite=[
  "        |    |    |          ",   // exhaust stacks
  "     ___|____|____|________  ",
  "    /   []   []   []      \\ ",
  "   /______________________  \\",
  "  |  T R A C T I O N  C I T Y |",
  "  |_____________________ ____|",
  "   (O)(O)   (O)(O)   (O)(O)(O)",
];
function tractionRender(tx){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(tx);                            // whatever's still standing gets flattened as it drives through
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=tractionCitySprite;
  const sh=spr.length, sw=spr[0].length;
  const left=Math.round(tx)-sw;                   // tx = leading (right) edge
  const keelRow=streetRow;
  const top=keelRow-sh+1;

  // exhaust plumes billowing back from the stacks as it drives off
  if(mortalT%2===0){ for(const sc of [8,13,18]){ mortalSmoke.push({x:left+sc, y:top-1, vx:-(0.4+Math.random()*0.6), vy:-(0.2+Math.random()*0.4), life:22}); } }
  for(const s of mortalSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,(s.life>12?"@":".")); setMode(mg,r,c,'steam'); } }
  mortalSmoke=mortalSmoke.filter(s=>s.life>0);

  for(let i=0;i<sh;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'traction'); } }

  return {grid,mg};
}

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
const heliRotorFrames=["-+-","\\+/"];
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

// ---- EMU WAR: the army opens fire, the emus don't care, the city loses ----
const emuSprite=[
  "      o>",
  "     /",
  "    /",
  " __/",
  "(   )___",
  " \\_____/",
  "   |  |",
  "   |  |",
  "   |  |",
];
const soldierSprite=[
  " @",
  "/|\\",
  "/ \\",
];
function emuInit(){
  emus=[]; emuBullets=[]; soldiers=[];
  const n=Math.max(3,Math.floor(COLS/22));
  for(let i=0;i<n;i++){ soldiers.push({x:(i+0.5)/n*COLS, fleeing:false}); }
}
function emuStep(t){
  if(t%10===0 && emus.length<12){ const fromLeft=Math.random()<0.5;
    emus.push({x: fromLeft?-8:COLS+8, dir: fromLeft?1:-1, spd:0.8+Math.random()*1.4, ph:Math.random()*6}); }
  for(const e of emus){
    e.x+=e.spd*e.dir; e.ph+=0.5;
    // it tramples whatever it runs through — mutates cityGridArr so the wreckage sticks
    if(cityGridArr.length===ROWS){ const col=Math.round(e.x);
      for(let r=0;r<streetRow;r++){ if(!cityGridArr[r])continue; let ln=cityGridArr[r].split("");
        for(let c=col-2;c<=col+2;c++){ if(c>=0&&c<COLS&&ln[c]!==" "&&Math.random()<0.12) ln[c]=" "; }
        cityGridArr[r]=ln.join(""); }
    }
  }
  emus=emus.filter(e=>e.x>-14 && e.x<COLS+14);
  // the army opens fire for a while, then — as history records — gives up and retreats
  if(t>50){ for(const s of soldiers) s.fleeing=true; }
  for(const s of soldiers){
    if(s.fleeing){ s.x += (s.x<COLS/2 ? -1.6 : 1.6); }
    else if(t%6===0 && emus.length){
      let nearest=emus[0]; for(const e of emus){ if(Math.abs(e.x-s.x)<Math.abs(nearest.x-s.x)) nearest=e; }
      emuBullets.push({x:s.x, dir: nearest.x>s.x?1:-1});
    }
  }
  soldiers=soldiers.filter(s=>s.x>-4 && s.x<COLS+4);
  for(const b of emuBullets) b.x+=b.dir*3;
  emuBullets=emuBullets.filter(b=>b.x>-2 && b.x<COLS+2);
}
function emuRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // tracer fire that never actually connects with anything
  const fireRow=streetRow-2;
  for(const b of emuBullets){ const c=Math.round(b.x); if(c>=0&&c<COLS){ setCh(grid,fireRow,c,"-"); setMode(mg,fireRow,c,'warfire'); } }
  // the doomed defenders
  for(const s of soldiers){ const xi=Math.round(s.x), top=streetRow-soldierSprite.length+1;
    for(let i=0;i<soldierSprite.length;i++){ const art=soldierSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'war'); } } }
  // the unstoppable emus
  for(const e of emus){ const xi=Math.round(e.x); const bob=(Math.sin(e.ph)>0)?0:1; const top=streetRow-emuSprite.length+1-bob;
    for(let i=0;i<emuSprite.length;i++){ let art=emuSprite[i]; if(e.dir<0) art=art.split("").reverse().join("");
      for(let j=0;j<art.length;j++){ const c=xi+j, r=top+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'emu'); } } }
  return {grid,mg};
}

// ---- NEIL THE SEAL: he waddles up to each building, bashes it flat, then moves to the next ----
const neilSprite=[
  "   __",
  "  /  \\__",
  " (  o    )",
  "  \\______/",
  "   ()  ()",
];
const neilLeanSprite=[
  "   __",
  "  /  \\__",
  " (  o    )",
  "  \\______/",
  "     ()",
];
const coneSprite=[
  " /\\",
  "/--\\",
  "/____\\",
];
// true while something solid still stands in the few columns right in front of him
function neilBlocked(col){
  if(cityGridArr.length!==ROWS) return false;
  for(let r=0;r<streetRow;r++){ const ln=cityGridArr[r]; if(!ln) continue;
    for(let c=col;c<=col+2;c++){ if(c>=0&&c<COLS&&ln[c]!==" ") return true; }
  }
  return false;
}
// headbutts whatever's at this column — punches a hole in its base so the rest crashes down
function neilBash(col){
  if(cityGridArr.length!==ROWS) return;
  for(let r=Math.max(0,streetRow-3); r<streetRow; r++){ if(!cityGridArr[r])continue; let ln=cityGridArr[r].split("");
    for(let c=col-1;c<=col+3;c++){ if(c>=0&&c<COLS) ln[c]=" "; }
    cityGridArr[r]=ln.join(""); }
  collapseCity(1);
}
function neilRender(x, leaning, bashing){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the cone, waiting patiently at the end of the city
  const coneLeft=COLS-8, coneTop=streetRow-coneSprite.length+1;
  for(let i=0;i<coneSprite.length;i++){ const art=coneSprite[i], r=coneTop+i;
    for(let j=0;j<art.length;j++){ const c=coneLeft+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'cone'); } }
  // Neil himself
  const spr=leaning?neilLeanSprite:neilSprite;
  const jitter=bashing?(Math.random()<0.5?-1:0):0;         // a little recoil while he's headbutting
  const left=Math.round(x)+jitter, top=streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'neil'); } }
  if(bashing){ const nc=left+spr[0].length+1; for(let k=0;k<3;k++){ const c=nc+k, r=top+1+((Math.random()*2)|0);
    if(c>=0&&c<COLS&&r>=0&&r<ROWS&&Math.random()<0.7){ setCh(grid,r,c,["*","#","'"][(Math.random()*3)|0]); setMode(mg,r,c,'rubble'); } } }
  if(leaning){ const c=left+spr[0].length, r=top-1; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,"z"); setMode(mg,r,c,'neil'); } }
  return {grid,mg};
}

// ---- KOOL-AID: he bursts through half the city, then shatters into glass and punch ----
const koolaidSprite=[
  "   ___",
  "  /   \\",
  " | o o |)",
  " |  >  |",
  " | --- |",
  " \\_____/",
  "  |   |",
];
function koolaidRender(x, ohYeah){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  titanicDemolish(x);
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const spr=koolaidSprite;
  const left=Math.round(x)-spr[0].length, top=streetRow-spr.length+1;
  for(let i=0;i<spr.length;i++){ const art=spr[i], r=top+i;
    for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'koolaid'); } }
  if(ohYeah){ const txt="OH YEAH!", tc=left+Math.floor(spr[0].length/2)-Math.floor(txt.length/2), tr=top-1;
    for(let j=0;j<txt.length;j++){ const c=tc+j; if(c>=0&&c<COLS&&tr>=0&&tr<ROWS){ setCh(grid,tr,c,txt[j]); setMode(mg,tr,c,'koolaid'); } } }
  return {grid,mg};
}
// he explodes into glass shards + spilled punch, which arc outward then settle on the street
function koolaidShatterInit(x){
  koolaidShards=[];
  const ox=Math.round(x)-Math.floor(koolaidSprite[0].length/2), oy=streetRow-Math.floor(koolaidSprite.length/2);
  for(let i=0;i<40;i++){ const ang=Math.random()*Math.PI*2, spd=0.5+Math.random()*2.5;
    koolaidShards.push({x:ox, y:oy, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd*0.6-0.3, glass:Math.random()<0.4}); }
}
function koolaidShatterStep(){
  for(const s of koolaidShards){ s.x+=s.vx; s.y+=s.vy; s.vy+=0.15;
    if(s.y>=streetRow){ s.y=streetRow; s.vy=0; s.vx*=0.7; } }
}
function koolaidShatterRender(){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  for(const s of koolaidShards){ const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){
    setCh(grid,r,c, s.glass?["/","\\","*"][(Math.random()*3)|0]:["~",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'koolaidburst'); } }
  return {grid,mg};
}

// ---- GRAY GOO: self-replicating nanomachines consume everything, spreading outward ----
// r grows from the epicenter until it swallows the farthest corner of the screen — no
// mutation needed, since the same geometric test just keeps re-covering the same ground.
const gooGlyphs="%@o0*+.,";
function gooRender(r){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const gy=Math.floor(streetRow*0.6);             // epicenter roughly mid-skyline
  const aspect=2;                                 // terminal cells are ~2x taller than wide
  for(let row=0; row<ROWS; row++){ let ln=(grid[row]||" ".repeat(COLS)).split("");
    for(let c=0;c<COLS;c++){
      const dx=c-cx, dy=(row-gy)*aspect;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>r) continue;
      const front=dist>r-3;                       // the actively-consuming wavefront
      if(ln[c]!==" " || Math.random()<0.15){       // devour structures; only lightly haze empty space
        ln[c]=gooGlyphs[(Math.random()*gooGlyphs.length)|0];
        setMode(mg,row,c, front?'goofront':'goo');
      }
    }
    grid[row]=ln.join(""); }
  return {grid,mg};
}

// ---- TOMSKA: everybody does the flop off the rooftops, right onto the mine turtle ----
const mineTurtleSprite=[
  " ^ ^ ^",
  "(=====)",
  "o|   |o",
];
// drops a new flopper off a random rooftop; `doomed` marks the one fated to land on the turtle
function mtSpawnFaller(mtCol, doomed){
  if(cityGridArr.length!==ROWS) return;
  const c=doomed?mtCol:((Math.random()*COLS)|0);
  let roofRow=streetRow;
  for(let r=0;r<streetRow;r++){ if(cityGridArr[r] && cityGridArr[r][c]!==" "){ roofRow=r; break; } }
  mtFallers.push({x:c, y:Math.max(0,roofRow-1), vy:0.3+Math.random()*0.3, doomed:!!doomed, speaks:true});
}
// advances fallers + settled bodies; landed fallers become bodies (returns true if the doomed one just landed)
function mtStep(spawnRandom){
  if(spawnRandom && Math.random()<0.35 && mtFallers.length<8) mtSpawnFaller();
  let doomedLanded=false;
  for(const f of mtFallers){ f.y+=f.vy; f.vy+=0.15;
    if(f.y>=streetRow){ f.y=streetRow; f.landed=true; mtBodies.push({x:f.x, y:streetRow, vx:0, vy:0, flying:false}); if(f.doomed) doomedLanded=true; } }
  mtFallers=mtFallers.filter(f=>!f.landed);
  for(const b of mtBodies){ if(!b.flying) continue;
    b.x+=b.vx; b.y+=b.vy; b.vy+=0.2;
    if(b.y>=streetRow){ b.y=streetRow; b.flying=false; b.vx=0; b.vy=0; } }
  return doomedLanded;
}
// the blast flings anyone standing nearby up and outward
function mtTriggerBlast(mtCol){
  for(const b of mtBodies){ const d=b.x-mtCol;
    if(Math.abs(d)<20){ const dir=d===0?(Math.random()<0.5?-1:1):Math.sign(d);
      b.vx=dir*(1+Math.random()*2.5); b.vy=-(1+Math.random()*1.5); b.flying=true; } }
}
// permanently craters the city around the blast — mutates cityGridArr so the wreckage sticks
function mtBlastDemolish(mtCol, r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=mtCol-r;c<=mtCol+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.5) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
  if(cityGridArr[streetRow]){ let g=cityGridArr[streetRow].split("");
    for(let c=mtCol-r;c<=mtCol+r;c++){ if(c>=0&&c<COLS&&Math.random()<0.5) g[c]=["#","%","."][(Math.random()*3)|0]; }
    cityGridArr[streetRow]=g.join(""); }
}
// a little speech bubble with a tail, drawn above a given point if there's room
function mtDrawBubble(grid, mg, c0, r0, text){
  const bubble="( "+text+" )";
  const br=r0-2;
  if(br<0) return;
  const bc=c0-Math.floor(bubble.length/2);
  for(let j=0;j<bubble.length;j++){ const c=bc+j; if(c>=0&&c<COLS){ setCh(grid,br,c,bubble[j]); setMode(mg,br,c,'speech'); } }
  const tr=r0-1;
  if(tr>=0&&c0>=0&&c0<COLS){ setCh(grid,tr,c0,"v"); setMode(mg,tr,c0,'speech'); }
}
function mtRender(t, mtCol, showTurtle, blastR){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  if(blastR>0) mtBlastDemolish(mtCol, Math.round(blastR));
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // settled bodies littering the street
  for(const b of mtBodies){ const c=Math.round(b.x), r=Math.round(b.y); const art=(t+c)%2===0?"-o-":"~o~";
    for(let j=0;j<art.length;j++){ const cc=c-1+j; if(cc>=0&&cc<COLS&&r>=0&&r<ROWS){ setCh(grid,r,cc,art[j]); setMode(mg,r,cc,'body'); } } }
  // mid-air flops, tumbling down — shouting the mantra on the way
  for(const f of mtFallers){ const r=Math.round(f.y), c=Math.round(f.x); const art=(t%2===0)?"\\o/":"/o\\";
    for(let j=0;j<art.length;j++){ const cc=c-1+j; if(cc>=0&&cc<COLS&&r>=0&&r<ROWS){ setCh(grid,r,cc,art[j]); setMode(mg,r,cc,'body'); } }
    if(f.speaks) mtDrawBubble(grid,mg,c,r,"EVERYBODY DO THE FLOP!"); }
  // the mine turtle, patiently waiting (and friendly, right up until it isn't)
  if(showTurtle){ const left=mtCol-3, top=streetRow-mineTurtleSprite.length+1;
    for(let i=0;i<mineTurtleSprite.length;i++){ const art=mineTurtleSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=left+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'mine'); } }
    mtDrawBubble(grid,mg,mtCol,top,"Hello!"); }
  // the blast itself
  if(blastR>0){ const R=blastR, ground=streetRow, domeH=Math.min(ground,Math.floor(R*0.7));
    for(let r=ground;r>=ground-domeH;r--){ const frac=(ground-r)/Math.max(1,domeH);
      const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.1);
      for(let j=-w;j<=w;j++){ if(Math.random()<0.15) continue; const c=mtCol+j; if(c<0||c>=COLS)continue;
        setCh(grid,r,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,r,c,'impact'); } } }
  return {grid,mg};
}

// ---- THE DAY OF THE TRIFFIDS: a green comet blinds everyone, then the triffids walk ----
function triffidInit(){
  triffStalks=[];
  const n=Math.max(4,Math.floor(COLS/16));
  for(let i=0;i<n;i++){ triffStalks.push({
    x: Math.round((i+0.5)*COLS/n), h:0, maxH: 6+((Math.random()*4)|0),
    lash:0, lashDir: Math.random()<0.5?-1:1 }); }
}
// each stalk grows, then periodically lashes its stinger out and stings whatever it hits
function triffidStep(){
  for(const s of triffStalks){
    if(s.h<s.maxH){ s.h+=0.15; continue; }
    if(s.lash>0){ s.lash--; }
    else if(Math.random()<0.05){ s.lash=6; triffidLash(s.x+s.lashDir*8); s.lashDir=Math.random()<0.5?-1:1; }
  }
}
// the sting permanently damages whatever it connects with — mutates cityGridArr
function triffidLash(col){
  if(cityGridArr.length!==ROWS) return;
  for(let r=Math.max(0,streetRow-3); r<streetRow; r++){ if(!cityGridArr[r]) continue; let ln=cityGridArr[r].split("");
    for(let c=col-1;c<=col+1;c++){ if(c>=0&&c<COLS && ln[c]!==" " && Math.random()<0.6) ln[c]=" "; }
    cityGridArr[r]=ln.join(""); }
  collapseCity(1);
}
function triffidRender(t, cometFlash){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // the strange green comet, streaking overhead and blinding everyone who watches it
  if(cometFlash>0){ for(let c=0;c<COLS;c++){ if(Math.random()<0.4){ const r=1+((Math.random()*3)|0);
    setCh(grid,r,c,["*",".","'"][(Math.random()*3)|0]); setMode(mg,r,c,'comet'); } } }
  // the stalks: grown height, a bulb head once mature, and an occasional stinger lash
  for(const s of triffStalks){ const h=Math.floor(s.h);
    for(let k=0;k<h;k++){ const r=streetRow-1-k; if(r<0) break; setCh(grid,r,s.x,"|"); setMode(mg,r,s.x,'triffid'); }
    if(s.h>=s.maxH){ const topR=streetRow-1-h; if(topR>=0){ setCh(grid,topR,s.x,"@"); setMode(mg,topR,s.x,'triffid');
      if(s.lash>0){ const len=6-s.lash+1; for(let k=1;k<=len;k++){ const c=s.x+s.lashDir*k; if(c>=0&&c<COLS){ setCh(grid,topR,c,"~"); setMode(mg,topR,c,'triffidwhip'); } } } } }
  }
  return {grid,mg};
}

// ---- BALDUR'S GATE: a mind flayer nautiloid crashes through the city ----
// the squid-ship: bulbous fleshy body up top, curling tentacles trailing beneath
const nautSprite=[
  "        _.-~@@@~-._        ",
  "     .-~ @@#####@@ ~-.     ",
  "   /  @#############@  \\   ",
  "  | @###############@  |  ",
  "   \\ @#####( O )#####@ /   ",
  "    '~-.@#########@.-~'    ",
  "    (  )~)~( | )~(~(  )    ",   // tentacle roots
  "   ) ( ~) ( ~ ) ( ~) ( )   ",   // dangling tentacles
  "  ~ ) ~( )~ ~ ~( )~ )~ ( ~ ",
];
function nautInit(){
  nautDmg=0; brainPods=[];
  nautX=-16; nautY=-4;   // enters from upper-left, out of a portal
}
function nautRender(t, mode, nx, ny){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const sw=nautSprite[0].length, sh=nautSprite.length;
  const sx=Math.round(nx), sy=Math.round(ny);

  // fiery planar portal it emerged from (upper-left), swirling
  if(mode!=='crashed'){
    const pc=Math.floor(COLS*0.12), pr=Math.floor(streetRow*0.18);
    for(let dr=-3;dr<=3;dr++)for(let dc=-5;dc<=5;dc++){ if(dr*dr+dc*dc*0.3<12){ const c=pc+dc,r=pr+dr; if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.6){ setCh(grid,r,c,["#","%","@","~","*"][(Math.random()*5)|0]); setMode(mg,r,c,'illithid'); } } }
  }

  // the ship smashes buildings around and beneath it as it careens through
  const reach=8;
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=sx-2;c<sx+sw+2;c++){ if(c<0||c>=COLS)continue;
      // only destroy where the ship overlaps this row (roughly)
      if(r>=sy && r<=sy+sh+2 && ln[c]!==" " && Math.random()<0.6) ln[c]=" ";
    }
    // trailing wreckage behind it (to the left, where it's been)
    if(mode!=='descend'){ for(let c=0;c<sx;c++){ if(ln[c]!==" " && Math.random()<0.2) ln[c]=" "; } }
    grid[r]=ln.join(""); }

  // psionic tadpoles / debris raining from the underside
  for(let k=0;k<COLS*0.1;k++){ const c=sx+((Math.random()*sw)|0), r=sy+sh+((Math.random()*4)|0); if(c>=0&&c<COLS&&r>=0&&r<streetRow){ setCh(grid,r,c,["S","e","~","."][(Math.random()*4)|0]); setMode(mg,r,c,'illithid'); } }

  // draw the nautiloid
  for(let i=0;i<sh;i++){ const art=nautSprite[i], r=sy+i;
    for(let j=0;j<art.length;j++){ const c=sx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'nautiloid'); } }
  // the central psionic eye glow
  const eyeC=sx+Math.floor(sw/2), eyeR=sy+4;
  if(eyeR>=0&&eyeR<ROWS){ setCh(grid,eyeR,eyeC,"O"); setMode(mg,eyeR,eyeC,'illithid'); }

  // once crashed, wedged in the ruins with lingering portal glow + rubble mound
  if(mode==='crashed'){
    { let g=grid[streetRow].split(""); for(let c=Math.max(0,sx-4);c<Math.min(COLS,sx+sw+4);c++){ if(Math.random()<0.5) g[c]=[".",",","_","#"][(Math.random()*4)|0]; } grid[streetRow]=g.join(""); }
    for(let k=0;k<COLS*0.08;k++){ const c=sx+((Math.random()*sw)|0), r=sy+((Math.random()*sh)|0); if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,(Math.random()<0.5?"*":".")); setMode(mg,r,c,'illithid'); } }
  }
  return {grid,mg};
}
// the violent impact: expanding shockwave that blows the city outward from ground zero
function nautImpact(R, cxi){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  // obliterate everything within the blast radius
  for(let r=0;r<streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cxi-R;c<=cxi+R;c++){ if(c<0||c>=COLS)continue; if(Math.random()<0.75) ln[c]=" "; }
    // fainter damage rippling past the blast front
    for(let c=0;c<COLS;c++){ const d=Math.abs(c-cxi); if(d>R && d<R+8 && ln[c]!==" " && Math.random()<0.4) ln[c]=(Math.random()<0.4?"#":" "); }
    grid[r]=ln.join(""); }
  // psionic fireball dome at ground zero
  const dome=Math.min(streetRow, Math.floor(R*0.9));
  for(let rr=streetRow;rr>=streetRow-dome;rr--){ const frac=(streetRow-rr)/Math.max(1,dome);
    const w=Math.floor(Math.sqrt(Math.max(0,1-frac*frac))*R*1.05);
    for(let j=-w;j<=w;j++){ if(Math.abs(j)>w-2&&Math.random()<0.4)continue; if(Math.random()<0.12)continue;
      const c=cxi+j; if(c<0||c>=COLS)continue; setCh(grid,rr,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,rr,c, Math.random()<0.5?'illithid':'nautiloid'); } }
  // shockwave ring markers along the ground
  for(const dir of [-1,1]){ const c=cxi+dir*R; if(c>=0&&c<COLS){ setCh(grid,streetRow,c,dir>0?">":"<"); setMode(mg,streetRow,c,'illithid'); setCh(grid,streetRow-1,c,dir>0?")":"("); setMode(mg,streetRow-1,c,'illithid'); } }
  // flung debris + tadpoles
  for(let k=0;k<COLS*0.3;k++){ const c=cxi+(((Math.random()*R*2)|0)-R), r=streetRow-((Math.random()*Math.floor(streetRow*0.7))|0);
    if(c>=0&&c<COLS){ setCh(grid,r,c,["*","'",".","S","e"][(Math.random()*5)|0]); setMode(mg,r,c,'illithid'); } }
  return {grid,mg};
}

// ---- EMP: an electromagnetic pulse blacks out the city (buildings stand, lights die) ----
// darken the city: strip lit windows in the pulse's reach, dim the rest to silhouettes.
function empRender(t, R, mode){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const half=R;

  // everything within the pulse radius loses power: windows go dark, buildings become silhouettes
  for(let r=0;r<=streetRow;r++){ let ln=(grid[r]||" ".repeat(COLS)).split("");
    for(let c=cx-half;c<=cx+half;c++){ if(c<0||c>=COLS)continue;
      if(ln[c]==="."||ln[c]===":"){ ln[c]=" "; }        // lit windows switch OFF
      else if(ln[c]!==" "){ setMode(mg,r,c,'dead'); }   // structure dims to a dark silhouette
    }
    grid[r]=ln.join(""); }

  // the pulse: a bright expanding ring sweeping outward from ground zero
  if(mode==='pulse'){
    for(const dir of [-1,1]){ const c=cx+dir*R;
      for(let r=Math.max(0,streetRow-Math.floor(R*0.6));r<=streetRow;r++){ const cc=c; if(cc>=0&&cc<COLS){ setCh(grid,r,cc, dir>0?")":"("); setMode(mg,r,cc,'emp'); } }
    }
    // crackling arcs along the ring edge and radiating from centre
    for(let k=0;k<COLS*0.25;k++){ const ang=Math.random()*Math.PI - Math.PI; const rad=R*(0.7+Math.random()*0.4);
      const c=Math.round(cx+Math.cos(ang)*rad), rr=Math.round(streetRow+Math.sin(ang)*rad*0.5);
      if(c>=0&&c<COLS&&rr>=0&&rr<ROWS){ setCh(grid,rr,c,["z","/","\\","~","x"][(Math.random()*5)|0]); setMode(mg,rr,c,'emp'); } }
    // central burst
    for(let k=0;k<COLS*0.15;k++){ const c=cx+(((Math.random()*R)|0)-Math.floor(R/2)), rr=1+((Math.random()*streetRow)|0);
      if(c>=0&&c<COLS){ setCh(grid,rr,c,["*","+","x"][(Math.random()*3)|0]); setMode(mg,rr,c,'emp'); } }
  }
  // dead planes/sparks falling once powered down
  if(mode==='dead' || R>=COLS){
    for(let k=0;k<COLS*0.05;k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.floor(streetRow*0.5))|0); setCh(grid,r,c,(Math.random()<0.5?"'":".")); setMode(mg,r,c,'dead'); }
  }
  return {grid,mg};
}

// ---- WAR: tanks roll in, jets strafe, artillery shells level the city ----
const tankSprite=["  __   ","_|##|__=","(O)(O)(O"];   // turret + hull + barrel + treads
function warInit(){
  tanks=[]; jets=[]; shells=[]; warBlasts=[]; warDmg=0;
  for(let i=0;i<3;i++){ tanks.push({ x:-((Math.random()*30)|0)-i*12, spd:0.5+Math.random()*0.4, cool:((Math.random()*20)|0) }); }
  for(let i=0;i<2;i++){ jets.push({ x:COLS+((Math.random()*40)|0), y:2+((Math.random()*4)|0), spd:2+Math.random()*1.5 }); }
}
function warStep(t){
  // tanks advance, firing shells periodically
  for(const tk of tanks){ tk.x+=tk.spd; tk.cool--; if(tk.cool<=0 && tk.x>2){ tk.cool=18+((Math.random()*20)|0);
    shells.push({x:tk.x+7, y:streetRow-2, vx:1.2+Math.random(), vy:-(1.6+Math.random()*0.8), g:0.14}); }
    if(tk.x>COLS+12) tk.x=-((Math.random()*20)|0)-10; }
  // jets streak left, dropping bombs
  for(const j of jets){ j.x-=j.spd; if(Math.random()<0.15){ shells.push({x:j.x, y:j.y+1, vx:-0.4, vy:0.6, g:0.16}); } if(j.x<-6){ j.x=COLS+((Math.random()*30)|0); j.y=2+((Math.random()*4)|0); } }
  // artillery from off-screen: arcing shells
  if(t%5===0){ shells.push({x:(Math.random()*COLS)|0, y:0, vx:(Math.random()*1.5-0.75), vy:0.8+Math.random()*0.6, g:0.12}); }
  // advance shells; detonate on the ground
  for(const s of shells){ s.x+=s.vx; s.y+=s.vy; s.vy+=s.g;
    if(s.y>=streetRow-1){ const bx=Math.round(s.x), max=3+((Math.random()*4)|0);
      warBlasts.push({x:bx, r:0, max});
      // permanently gouge the buildings out of the city where the shell landed
      const br=max+1;
      for(let r=0;r<streetRow;r++){ if(cityGridArr[r]){ let ln=cityGridArr[r].split("");
        for(let c=bx-br;c<=bx+br;c++){ if(c>=0&&c<COLS && ln[c]!==" " && Math.random()<0.75) ln[c]=" "; }
        cityGridArr[r]=ln.join(""); } }
      s.dead=true; } }
  shells=shells.filter(s=>!s.dead && s.x>-2 && s.x<COLS+2);
  // grow + expire blasts
  for(const b of warBlasts){ b.r+=1; } warBlasts=warBlasts.filter(b=>b.r<=b.max+2);
  warDmg=Math.min(COLS, warDmg+ (t%2===0?1:0));
  collapseCity(0.5);   // damaged, unsupported buildings topple
}
function warRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // (building destruction is permanent — baked into cityGridArr by warStep)

  // craters + rubble on the street
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<warDmg/COLS*0.3) g[c]=[".",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }

  // explosions (fireballs)
  for(const b of warBlasts){ for(let dr=0;dr<=b.r;dr++){ const w=b.r-dr; for(let dc=-w;dc<=w;dc++){ const c=b.x+dc, rr=streetRow-1-dr; if(c<0||c>=COLS||rr<0)continue; if(Math.random()<0.25)continue; setCh(grid,rr,c,["#","@","%","*"][(Math.random()*4)|0]); setMode(mg,rr,c,'warfire'); } } }

  // flying shells / tracers
  for(const s of shells){ const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS){ setCh(grid,r,c,"*"); setMode(mg,r,c,'warfire'); if(r-1>=0){ setCh(grid,r-1,c,":"); setMode(mg,r-1,c,'warfire'); } } }

  // jets streaking overhead
  for(const j of jets){ const xi=Math.round(j.x), r=Math.round(j.y); const spr="<^==>"; for(let k=0;k<spr.length;k++){ const c=xi+k; if(c>=0&&c<COLS && r>=0&&r<ROWS){ setCh(grid,r,c,spr[k]); setMode(mg,r,c,'war'); } } }

  // tanks rolling along the street
  const tankTop=streetRow-tankSprite.length+1;
  for(const tk of tanks){ const xi=Math.round(tk.x);
    for(let i=0;i<tankSprite.length;i++){ const art=tankSprite[i], r=tankTop+i;
      for(let k=0;k<art.length;k++){ const c=xi+k; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[k]===" ")continue; setCh(grid,r,c,art[k]); setMode(mg,r,c,'war'); } } }

  // drifting smoke over the battlefield
  for(let k=0;k<COLS*0.15;k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*Math.floor(streetRow*0.6))|0); if(Math.random()<warDmg/COLS){ setCh(grid,r,c,["'",",","."][(Math.random()*3)|0]); setMode(mg,r,c,'warfire'); } }
  return {grid,mg};
}

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

// ---- GHOSTBUSTERS: ghosts swarm, then the Stay Puft Marshmallow Man stomps the city ----
const puftSprite=[
  "        .-\"\"\"\"\"-.        ",
  "       / ^^^^^^^ \\       ",   // sailor hat brim
  "      | (o)   (o) |      ",   // eyes
  "      |    ___    |      ",   // smile
  "       \\  \\___/  /       ",
  "     ~~~=========~~~     ",   // blue scarf / red collar
  "    /  M A R S H  \\      ",
  "   |  ###########  |     ",
  "   |  ###########  |     ",
  "   |  ###########  |     ",
  "   / /|         |\\ \\     ",
  "  |_/ |         | \\_|    ",
  "      |__|   |__|        ",
];
const ghostSprite=["(oo)","/~~\\"];
// the Ghostbusters HQ firehouse (stands on the left of the street)
const firehouseSprite=[
  " _____________ ",
  "|  FIREHOUSE  |",
  "| [!NO GHOST!]|",
  "|=============|",
  "| ___________ |",
  "||  GARAGE   ||",
  "||   (O)     ||",
  "||___________||",
];
// Ecto-1 — the converted ambulance with roof light bar & fins
const ectoSprite=[
  "   *!*    ",
  " __=====__",
  "/ECTO-1   \\_",
  "|_[]___[]__|",
  " (O)===(O) ",
];
function ghostInit(){
  ghosts=[]; protonBeams=[]; puftDmg=0; puftX=cx-11;
  ectoX=-14;   // Ecto-1 starts off-screen left, races in
  slimer={ x:cx*0.5, y:6, ph:0, trail:[] };   // Slimer buzzes around the scene
  for(let i=0;i<10;i++){ ghosts.push({ x:(Math.random()*COLS)|0, y:1+((Math.random()*Math.floor(streetRow*0.6))|0), vx:(Math.random()*2-1)*0.6, vy:(Math.random()*2-1)*0.3, ph:Math.random()*6 }); }
}
function ghostStep(t){
  for(const g of ghosts){ g.x+=g.vx; g.y+=Math.sin(t*0.2+g.ph)*0.3; g.ph+=0.3; if(g.x<0)g.x=COLS; if(g.x>COLS)g.x=0; }
  if(t%4===0 && ghosts.length<COLS*0.3){ ghosts.push({ x:(Math.random()*COLS)|0, y:1+((Math.random()*Math.floor(streetRow*0.5))|0), vx:(Math.random()*2-1)*0.6, vy:0, ph:Math.random()*6 }); }
  // Ecto-1 races across, then parks near the firehouse
  ectoX += (ectoX < Math.floor(COLS*0.30)) ? Math.max(1,Math.floor(COLS/26)) : 0;
  // Slimer buzzes around in a wandering loop, leaving a slime trail
  if(slimer){ slimer.ph+=0.18;
    slimer.x = cx + Math.cos(slimer.ph)*COLS*0.28 + Math.sin(slimer.ph*2.3)*6;
    slimer.y = Math.floor(streetRow*0.35) + Math.sin(slimer.ph*1.5)*Math.floor(streetRow*0.22);
    slimer.trail.push({x:Math.round(slimer.x),y:Math.round(slimer.y)}); if(slimer.trail.length>7) slimer.trail.shift();
  }
}
function ghostRender(t, mode){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ectoplasm slime dripping down the buildings
  for(let k=0;k<COLS*0.15;k++){ const c=(Math.random()*COLS)|0, r=(Math.random()*streetRow)|0; if(grid[r] && grid[r][c]===" " && Math.random()<0.4){ setCh(grid,r,c,["~","S","%"][(Math.random()*3)|0]); setMode(mg,r,c,'ghost'); } }

  // the Ghostbusters firehouse HQ standing on the left
  { const fw=firehouseSprite[0].length, fh=firehouseSprite.length, fx=2, ftop=streetRow-fh+1;
    for(let i=0;i<fh;i++){ const art=firehouseSprite[i], r=ftop+i;
      for(let j=0;j<art.length;j++){ const c=fx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'firehouse'); } } }

  // the Stay Puft Marshmallow Man (once he arrives) squashes buildings around him
  if(mode==='puft'){
    const pw=puftSprite[0].length, ph2=puftSprite.length;
    const px=Math.round(puftX), top=streetRow-ph2+1;
    // flatten buildings under/around him
    for(let r=0;r<streetRow;r++){ if(cityGridArr[r]){ let ln=cityGridArr[r].split("");
      for(let c=px;c<px+pw;c++){ if(c>=0&&c<COLS && ln[c]!==" " && Math.random()<0.3) ln[c]=" "; } cityGridArr[r]=ln.join(""); } }
    // re-copy after mutation
    for(let r=0;r<ROWS;r++) grid[r]=cityGridArr[r];
    // redraw firehouse (survives on the left)
    { const fw=firehouseSprite[0].length, fh=firehouseSprite.length, fx=2, ftop=streetRow-fh+1;
      for(let i=0;i<fh;i++){ const art=firehouseSprite[i], r=ftop+i;
        for(let j=0;j<art.length;j++){ const c=fx+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'firehouse'); } } }
    // draw Stay Puft
    for(let i=0;i<ph2;i++){ const art=puftSprite[i], r=top+i;
      for(let j=0;j<art.length;j++){ const c=px+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue;
        setCh(grid,r,c,art[j]); setMode(mg,r,c,'puft'); } }
    // proton beams zapping up at him from the lower corners (the Ghostbusters!)
    for(const bx of [4, COLS-6]){
      const rightSide=(bx>cx);
      // the ghostbuster: head, body with proton pack, arms holding a raygun aimed UP at Stay Puft
      const gr=streetRow-2;
      setCh(grid,gr-1,bx,"o"); setMode(mg,gr-1,bx,'proton');            // head
      setCh(grid,gr,bx,"#");  setMode(mg,gr,bx,'proton');              // body/pack
      setCh(grid,gr,bx+(rightSide?-1:1),"="); setMode(mg,gr,bx+(rightSide?-1:1),'proton'); // proton pack side
      // the raygun / wand, angled up toward the marshmallow man
      const gunTip = rightSide ? "\\" : "/";
      setCh(grid,gr-1,bx+(rightSide?-1:1),gunTip); setMode(mg,gr-1,bx+(rightSide?-1:1),'proton');
      setCh(grid,gr-2,bx+(rightSide?-2:2),">".replace(">",rightSide?"<":">")); setMode(mg,gr-2,bx+(rightSide?-2:2),'proton');
      // the crackling proton stream from the raygun tip up to Stay Puft
      let cx0=bx+(rightSide?-2:2), cy0=gr-2, tx=px+Math.floor(pw/2), ty=top+3;
      const steps=Math.max(4,Math.round(Math.hypot(tx-cx0,ty-cy0)));
      for(let s=0;s<=steps;s++){ const c=Math.round(cx0+(tx-cx0)*s/steps + Math.sin(s*0.8+t)*1.6), r=Math.round(cy0+(ty-cy0)*s/steps);
        if(c>=0&&c<COLS&&r>=0&&r<ROWS && Math.random()<0.8){ setCh(grid,r,c,["~","*","z","="][(Math.random()*4)|0]); setMode(mg,r,c,'proton'); } }
    }
    // trampled goo on the street
    { let g=grid[streetRow].split(""); for(let c=px;c<px+pw&&c<COLS;c++){ if(Math.random()<0.4) g[c]=["~",",","_"][(Math.random()*3)|0]; } grid[streetRow]=g.join(""); }
  }

  // Ecto-1 parked/racing along the street (light bar flashing)
  { const ew=ectoSprite.length, ex=Math.round(ectoX), etop=streetRow-ectoSprite.length+1;
    for(let i=0;i<ectoSprite.length;i++){ let art=ectoSprite[i]; const r=etop+i;
      // flash the light bar
      if(i===0 && (t%2===0)) art=art.replace(/\*!\*/,'!*!');
      for(let j=0;j<art.length;j++){ const c=ex+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'ecto'); } } }

  // the swarming ghosts (all phases)
  for(const g of ghosts){ const xi=Math.round(g.x), yi=Math.round(g.y);
    for(let i=0;i<ghostSprite.length;i++){ const art=ghostSprite[i], r=yi+i;
      for(let j=0;j<art.length;j++){ const c=xi+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'ghost'); } } }

  // Slimer — the green blob ghost — buzzing around with a slime trail
  if(slimer){
    for(const tr of slimer.trail){ if(tr.x>=0&&tr.x<COLS&&tr.y>=0&&tr.y<ROWS){ setCh(grid,tr.y,tr.x,(Math.random()<0.5?"~":".")); setMode(mg,tr.y,tr.x,'ghost'); } }
    const sx=Math.round(slimer.x), sy=Math.round(slimer.y);
    const slSpr=[" ~@@@~ ","(o\\_/o)","\\~VVV~/"," \\___/ "];   // blobby body, eyes, gaping grin, dribbles
    for(let i=0;i<slSpr.length;i++){ const art=slSpr[i], r=sy+i;
      for(let j=0;j<art.length;j++){ const c=sx+j-3; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'slimer'); } }
  }
  return {grid,mg};
}

// ---- FROZEN: Elsa's magic sweeps out, an ice castle rises, the world freezes ----
function frozenInit(){
  fznLevel=0; castleH=0; olafX=-6; snowFall=[];
  for(let i=0;i<Math.floor(COLS*0.5);i++){ snowFall.push({ x:(Math.random()*COLS)|0, y:(Math.random()*ROWS)|0, spd:0.4+Math.random()*0.8, drift:(Math.random()*2-1)*0.4 }); }
}
function frozenStep(t){
  fznLevel=Math.min(1, fznLevel+0.018);
  castleH=Math.min(Math.floor(streetRow*0.6), castleH + (fznLevel>0.25 ? 1 : 0));
  for(const s of snowFall){ s.y+=s.spd; s.x+=s.drift; if(s.y>ROWS){ s.y=-1; s.x=(Math.random()*COLS)|0; } if(s.x<0)s.x=COLS-1; if(s.x>=COLS)s.x=0; }
  // Olaf waddles along the street
  olafX += 0.4;
  if(olafX > COLS+6) olafX = -6;
}
function frozenRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');

  // ice climbs and encases the buildings from the ground up (proportion = fznLevel)
  const iceTop=Math.floor(streetRow - fznLevel*streetRow*0.9);
  for(let r=streetRow;r>=iceTop;r--){
    for(let c=0;c<COLS;c++){
      if(grid[r] && grid[r][c] && grid[r][c]!==" "){ if(Math.random()<0.4){ setCh(grid,r,c,(Math.random()<0.4?"#":grid[r][c])); setMode(mg,r,c,'frost'); } }
      else if(r>=streetRow-1 && Math.random()<0.3){ setCh(grid,r,c,(Math.random()<0.5?"=":"#")); setMode(mg,r,c,'frost'); }
    }
  }
  // icicles + frost sparkle hanging in the frozen zone
  for(let k=0;k<COLS*0.15;k++){ const c=(Math.random()*COLS)|0, r=iceTop+((Math.random()*Math.max(1,streetRow-iceTop))|0);
    if(r>=0&&r<streetRow && grid[r] && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"V":"*")); setMode(mg,r,c,'frost'); } }

  // ---- Elsa's ICE CASTLE rising in the centre (a proper castle silhouette) ----
  if(castleH>0){
    // castle sprite, drawn bottom-up so it "rises" as castleH grows
    const castle=[
      "        /\\        ",   // central spire
      "        ||        ",
      "       /##\\       ",   // spire base
      "  /\\   |##|   /\\  ",   // side turret tips
      " /##\\ _|##|_ /##\\ ",
      " |^^| |####| |^^| ",   // battlements
      " |##|=|####|=|##| ",
      " |[]| |[##]| |[]| ",   // windows
      " |##|=|####|=|##| ",
      " |##| |####| |##| ",
      " |##|_|_/\\_|_|##| ",   // gateway arch
      " |##| | || | |##| ",
      "_|##|_|_||_|_|##|_",   // base
    ];
    const cw=castle[0].length, chh=castle.length;
    const cx0=cx-Math.floor(cw/2);
    const maxCastleH=Math.floor(streetRow*0.6);
    const shown=Math.min(chh, Math.max(2, Math.round(castleH/maxCastleH * chh)));
    // reveal from the bottom (street) upward
    for(let i=0;i<shown;i++){
      const srcRow=chh-1-i;             // bottom-most rows first
      const r=streetRow-i;
      const art=castle[srcRow];
      for(let j=0;j<art.length;j++){ const c=cx0+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'castle'); }
    }
    // sparkle glints around the fully-risen castle
    if(shown>=chh){ for(let k=0;k<COLS*0.05;k++){ const c=cx+(((Math.random()*cw)|0)-Math.floor(cw/2)), r=(streetRow-chh)+((Math.random()*4)|0)-1; if(c>=0&&c<COLS&&r>=0){ setCh(grid,r,c,["*","+","."][(Math.random()*3)|0]); setMode(mg,r,c,'castle'); } } }
  }

  // ---- snow drifts piling on the street ----
  { let g=grid[streetRow].split(""); for(let c=0;c<COLS;c++){ if(Math.random()<0.3+fznLevel*0.5) g[c]="#"; if(g[c]==="#") setMode(mg,streetRow,c,'frost'); } grid[streetRow]=g.join(""); }

  // ---- Olaf the snowman waddling along ----
  { const ox=Math.round(olafX);
    // olaf: head (eyes + carrot nose), two snowball body segments
    const os=[ " o ", "(o>)", " O ", "(O)" ];
    const oy=streetRow-os.length+1;
    for(let i=0;i<os.length;i++){ const art=os[i]; for(let j=0;j<art.length;j++){ const c=ox+j-1; const r=oy+i; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'olaf'); } }
    // twig arms sticking out + tuft of hair
    setCh(grid,oy+2,ox-2,"\\"); setCh(grid,oy+2,ox+2,"/"); setMode(mg,oy+2,ox-2,'olaf'); setMode(mg,oy+2,ox+2,'olaf');
    setCh(grid,oy-1,ox,"Y"); setMode(mg,oy-1,ox,'olaf');
  }

  // ---- falling snow over everything ----
  for(const s of snowFall){ const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && grid[r][c]===" "){ setCh(grid,r,c,(Math.random()<0.5?"*":".")); setMode(mg,r,c,'frost'); } }
  return {grid,mg};
}

// ---- LANDSLIDE: a mass of earth and boulders slides down from the upper-left ----
function landslideInit(){
  lsFront=-6; boulders=[]; lsDebris=[];
}
function landslideStep(t){
  lsFront += Math.max(1, Math.floor(COLS/34));   // the leading edge advances rightward
  // spawn tumbling boulders rolling ahead of the slide front
  if(t%3===0){ boulders.push({ x:lsFront + (Math.random()*8), y:streetRow-1-((Math.random()*Math.floor(streetRow*0.3))|0), vx:1+Math.random()*1.5, vy:0.2+Math.random()*0.5, g:0.12, spin:0 }); }
  for(const b of boulders){ b.x+=b.vx; b.y+=b.vy; b.vy+=b.g; b.spin+=0.5; if(b.y>=streetRow-1){ b.y=streetRow-1; b.vy=-b.vy*0.3; b.vx*=0.8; } }
  boulders=boulders.filter(b=> b.x<COLS+4 && b.x < lsFront+Math.floor(COLS*0.3));  // buried once slide catches up
  // the slide permanently buries buildings behind the front — a sloped wedge (higher on the left)
  const front=Math.round(lsFront);
  for(let c=0;c<Math.min(COLS,front);c++){
    // slope: buries higher near the left (origin), tapering down toward the front edge
    const depthFrac=(front-c)/Math.max(1,front);          // 1 at left, 0 at front
    const buryTop=streetRow - Math.floor(depthFrac * streetRow*0.85);
    for(let r=streetRow;r>=buryTop;r--){ if(cityGridArr[r]){ let ln=cityGridArr[r].split(""); if(ln[c]!==" " && Math.random()<0.6) ln[c]=" "; cityGridArr[r]=ln.join(""); } }
  }
}
function landslideRender(t){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const front=Math.round(lsFront);

  // the earth mass itself: a sloped pile of rock/mud, thick on the left, tapering to the front
  for(let c=0;c<Math.min(COLS,front);c++){
    const depthFrac=(front-c)/Math.max(1,front);
    const pileTop=streetRow - Math.floor(depthFrac * streetRow*0.85);
    for(let r=streetRow;r>=pileTop;r--){
      // denser/rockier lower, dusty near the surface
      const surface=(r<=pileTop+1);
      let ch;
      if(surface) ch = (Math.random()<0.4)?"O":["~","#","."][(Math.random()*3)|0];
      else ch = (Math.random()<0.2)?"O":["#","%","~","@"][(Math.random()*4)|0];
      setCh(grid,r,c,ch); setMode(mg,r,c,'landslide');
    }
  }
  // dust cloud billowing up along the advancing front
  for(let k=0;k<COLS*0.3;k++){ const c=front - ((Math.random()*Math.floor(COLS*0.2))|0), r=1+((Math.random()*streetRow)|0);
    if(c>=0&&c<COLS && grid[r] && grid[r][c]===" " && Math.random()<0.5){ setCh(grid,r,c,["'","*",".","~"][(Math.random()*4)|0]); setMode(mg,r,c,'landslide'); } }

  // tumbling boulders rolling ahead of the slide
  for(const b of boulders){ const xi=Math.round(b.x), yi=Math.round(b.y);
    // a chunky 2x2-ish boulder
    for(let dr=0;dr<=1;dr++)for(let dc=0;dc<=1;dc++){ const c=xi+dc, r=yi+dr; if(c>=0&&c<COLS&&r>=0&&r<ROWS){ setCh(grid,r,c,(dr+dc)%2===0?"O":"@"); setMode(mg,r,c,'landslide'); } }
    // little debris trail
    if(xi-1>=0){ setCh(grid,yi,xi-1,"."); setMode(mg,yi,xi-1,'landslide'); }
  }
  return {grid,mg};
}

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

// ---- BACK TO THE FUTURE: a DeLorean hits 88mph, and the city becomes the Old West ----
const deloSprite=[
  "  ___________ ",
  " /_|__DeLorean\\_ ",
  "(o)==========(o)",
];
// ---- era scene builders for the time-travel tour ----
// each returns {grid, mode} — a full scene for one destination year.
function eraStreetBase(mode){
  const grid=blankGrid(ROWS);
  return grid;
}
// 1955 — pastel small town: diner, theater marquee, clock tower
function build1955(){
  const grid=blankGrid(ROWS);
  const shops=[
    [ "  ______________  ","  | LOU'S  CAFE |  ","  |==o=o=o=o=o==|  ","  | [] .  . [] |  ","  |__|_DINER_|__|  " ],
    [ "   _____________   ","  | TOWN THEATRE |  ","  |=marquee=====|  ","  | NOW PLAYING |  ","  |__[]___[]____|  " ],
    [ "   __________   ","  | HILL VALLEY|  ","  | HARDWARE  |  ","  | []  .  [] |  ","  |__|____|___|  " ],
    [ "  ___________  ","  | WESTERN  |  ","  | AUTO     |  ","  | [] . [] |  ","  |__|___|__|  " ],
    [ "   ________   ","  | TEXACO |  ","  |  (o)   |  ","  | _||_  |  ","  |_|__|__|  " ],
  ];
  let x=1;
  while(x<COLS-4){ const s=shops[(Math.random()*shops.length)|0]; const w=Math.max(...s.map(r=>r.length)), H=s.length, top=streetRow-H;
    for(let i=0;i<H;i++){ const a=s[i]; for(let j=0;j<a.length;j++){ const c=x+j; if(c<COLS && a[j]!==" ") setCh(grid,top+i,c,a[j]); } }
    x+=w+1+((Math.random()*2)|0); }
  // clock tower centre-back
  const ct=Math.floor(COLS*0.5), ctTop=streetRow-9;
  const tower=["  ___  "," |[o]| "," | : | "," |###| "," |###| "];
  for(let i=0;i<tower.length;i++){ for(let j=0;j<tower[i].length;j++){ const c=ct+j-3; if(c>=0&&c<COLS&&tower[i][j]!==" ")setCh(grid,ctTop+i,c,tower[i][j]); } }
  grid[streetRow]="~".repeat(COLS);
  // '50s cars parked along the kerb
  for(let n=0;n<Math.max(3,Math.floor(COLS/16));n++){ const c=4+((Math.random()*(COLS-8))|0); setCh(grid,streetRow-1,c,"o"); setCh(grid,streetRow-1,c+1,"="); setCh(grid,streetRow-1,c+2,"o"); }
  return {grid, mode:'era50s'};
}
// 1985 — the normal modern city (reuse the base skyline)
function build1985(){
  if(cityGridArr.length!==ROWS) cityGridArr=buildCity();
  return {grid: cityGridArr.slice(), mode:'city'};
}
// 2015 — the future: skyway, flying cars, hover-everything, holograms
function build2015(){
  if(cityGridArr.length!==ROWS) cityGridArr=buildCity();
  const grid=cityGridArr.slice();
  // neon-ify the skyline tops
  for(let r=0;r<streetRow;r++){ let ln=grid[r].split(""); for(let c=0;c<COLS;c++){ if(ln[c]==="."||ln[c]===":"){ if(Math.random()<0.5) ln[c]=(Math.random()<0.5?"=":"o"); } } grid[r]=ln.join(""); }
  // elevated skyway across the middle
  const skyRow=Math.floor(streetRow*0.45);
  for(let c=0;c<COLS;c++){ setCh(grid,skyRow,c,(c%4===0?"H":"=")); }
  // flying cars zipping along the skyway and above
  for(let n=0;n<Math.max(4,Math.floor(COLS/12));n++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*(skyRow))|0); const car=(Math.random()<0.5?"<oO>":"<@=>"); for(let j=0;j<car.length;j++){ const cc=c+j; if(cc<COLS) setCh(grid,r,cc,car[j]); } }
  // hologram sign
  const holo="HOLOMAX  JAWS 19", hc=Math.floor(COLS*0.5)-Math.floor(holo.length/2);
  for(let j=0;j<holo.length;j++){ const c=hc+j; if(c>=0&&c<COLS && holo[j]!==" ") setCh(grid,2,c,holo[j]); }
  grid[streetRow]="=".repeat(COLS);
  return {grid, mode:'era2015'};
}
// 1985-A — Biff's "Hell Valley": the Pleasure Paradise casino, fires, chaos
function buildHell(){
  if(cityGridArr.length!==ROWS) cityGridArr=buildCity();
  const grid=cityGridArr.slice();
  // torch half the skyline into grimy fiery ruin
  for(let r=0;r<streetRow;r++){ let ln=grid[r].split(""); for(let c=0;c<COLS;c++){ if(ln[c]!==" " && Math.random()<0.3) ln[c]=(Math.random()<0.4?"#":" "); } grid[r]=ln.join(""); }
  // the huge BIFF'S PLEASURE PARADISE casino tower, centre
  const bc=Math.floor(COLS*0.5), bh=Math.min(streetRow-2, 14);
  const casino=[
    "   ______________   ",
    "  |  BIFF'S  $$$  |  ",
    "  | PLEASURE PARA |  ",
    "  |  D I S E  ####|  ",
    "  |==o==o==o==o===|  ",
    "  |  [] $$ [] $$  |  ",
    "  |===============|  ",
    "  |  $$ [] $$ []  |  ",
    "  |===============|  ",
    "  |  [] $$ [] $$  |  ",
    "  |__|_|___|_|___|  " ];
  const top=streetRow-casino.length;
  for(let i=0;i<casino.length;i++){ for(let j=0;j<casino[i].length;j++){ const c=bc+j-10; if(c>=0&&c<COLS&&casino[i][j]!==" ")setCh(grid,top+i,c,casino[i][j]); } }
  // fires + smoke across the streets
  for(let k=0;k<COLS*0.4;k++){ const c=(Math.random()*COLS)|0, r=streetRow-((Math.random()*4)|0); setCh(grid,r,c,["#","@","%","'"][(Math.random()*4)|0]); }
  grid[streetRow]="#".repeat(COLS);
  return {grid, mode:'hell'};
}
function eraMode(grid, mode){
  const mg=modeGridFill(ROWS,COLS,mode);
  return mg;
}

// build a wooden Old-West town with railroad tracks (cached so it stays stable)
function buildWest(){
  const grid=blankGrid(ROWS);

  // ---- sky: sun/moon + a few stars ----
  for(let k=0;k<Math.floor(COLS*0.15);k++){ const c=(Math.random()*COLS)|0, r=1+((Math.random()*3)|0); setCh(grid,r,c,(Math.random()<0.5?"*":".")); }
  // big low sun on the right
  const sunC=Math.floor(COLS*0.85), sunR=3;
  for(let dr=-1;dr<=1;dr++)for(let dc=-2;dc<=2;dc++){ if(Math.abs(dr)+Math.abs(dc)<=2){ setCh(grid,sunR+dr,sunC+dc,"*"); } }

  // ---- detailed storefronts, varied width & height, with false fronts ----
  // each template: array of text rows (top→bottom), drawn bottom-anchored to the boardwalk
  const shops=[
    // SALOON — tall false front, swinging doors, lantern
    [ "   _______________   ",
      "  /  T H E  G O L D \\  ",
      "  |   N U G G E T    | ",
      "  |=================| ",
      "  | []   SALOON   []| ",
      "  |   .---------.   | ",
      "  |   | []   [] |   | ",
      "  |___|  ) | (  |___| ",
      "  |[]| o     o |[]| " ],
    // GENERAL STORE
    [ "   ________________  ",
      "  /  GENERAL  STORE\\  ",
      "  |################| ",
      "  | [].  [].  [].  | ",
      "  |----------------| ",
      "  | [] |FEED| | [] | ",
      "  |____|_##_|_|____| ",
      "  |  []   __   []  | " ],
    // BANK — stone-ish, columns
    [ "    ____________   ",
      "   /   B A N K   \\  ",
      "   | || || || || | ",
      "   | ||[$]|| ||  | ",
      "   |=============| ",
      "   |  [].    [].  | ",
      "   |__|__||__|__|_| " ],
    // SHERIFF's office + JAIL
    [ "   ____________  ",
      "  / SHERIFF O \\  ",
      "  |==========| ",
      "  | [#] JAIL | ",
      "  | |#| .--. | ",
      "  |_|#|_|[]|_| " ],
    // HOTEL — two storeys, balcony
    [ "   _________________  ",
      "  /   G R A N D   H \\  ",
      "  |    H O T E L     | ",
      "  |==== balcony =====| ",
      "  | [].  [].  [].  []| ",
      "  |------------------| ",
      "  | []   [DOOR]   [] | ",
      "  |__||__|    |__||__| " ],
    // BLACKSMITH / LIVERY
    [ "   ______________  ",
      "  / LIVERY & IRON\\  ",
      "  |##############| ",
      "  |  (anvil) /\\  | ",
      "  |  _____  |  | | ",
      "  |_|     |_|__|_| " ],
    // small assay office
    [ "   __________  ",
      "  / ASSAY O. \\  ",
      "  |==========| ",
      "  | [].  [] | ",
      "  |__|__|___| " ],
  ];

  let x=1;
  while(x<COLS-6){
    const s=shops[(Math.random()*shops.length)|0];
    const w=Math.max(...s.map(r=>r.length));
    const H=s.length;
    const top=streetRow-H;                        // sits on the boardwalk (row above street)
    for(let i=0;i<H;i++){ const art=s[i]; for(let j=0;j<art.length;j++){ const c=x+j; if(c>=COLS)break; if(art[j]!==" ") setCh(grid,top+i,c,art[j]); } }
    // hanging lantern glow beside some shops
    if(Math.random()<0.5){ setCh(grid,top+H-2,x-1,"o"); }
    x += w + 1 + ((Math.random()*3)|0);           // alley gap
  }

  // ---- water tower on the far side ----
  const wtC=Math.floor(COLS*0.06);
  const wt=[" .--. ","/====\\","|WATER|","|====|"," |||| "," |||| "];
  const wtTop=streetRow-6-4;
  for(let i=0;i<wt.length;i++){ const r=wtTop+i; if(r<0)continue; for(let j=0;j<wt[i].length;j++){ const c=wtC+j; if(c>=0&&c<COLS && wt[i][j]!==" ") setCh(grid,r,c,wt[i][j]); } }

  // ---- boardwalk (raised wooden sidewalk) just above the street ----
  const walkRow=streetRow-1;
  let wr=grid[walkRow].split("");
  for(let c=0;c<COLS;c++){ if(wr[c]===" ") wr[c]=(c%2===0?"_":"="); }
  grid[walkRow]=wr.join("");
  // support posts + hitching rail under the boardwalk
  for(let c=3;c<COLS;c+=9){ setCh(grid,walkRow,c,"|"); }

  // ---- the dusty main street ----
  grid[streetRow]="~".repeat(COLS);

  // ---- railroad tracks running down the street (rails + ties) ----
  const trackRow=streetRow;
  let g=grid[trackRow].split("");
  for(let c=0;c<COLS;c++){ g[c]= (c%3===0)?"H":"="; }           // ties (H) + rails (=)
  grid[trackRow]=g.join("");

  // ---- scenery: cacti, tumbleweeds, horses, barrels along the street ----
  const cactus=["Y","T"];
  for(let n=0;n<Math.max(3,Math.floor(COLS/22));n++){
    const c=4+((Math.random()*(COLS-8))|0);
    // saguaro cactus poking up from the street edge
    const h=1+((Math.random()*2)|0);
    for(let k=0;k<h;k++){ setCh(grid,streetRow-1-k,c,"^"); }
    setCh(grid,streetRow-1-h,c,cactus[(Math.random()*cactus.length)|0]);
  }
  // a couple of horses tied up (m = horse silhouette)
  for(let n=0;n<Math.max(2,Math.floor(COLS/30));n++){
    const c=8+((Math.random()*(COLS-16))|0);
    setCh(grid,streetRow-1,c,"m"); setCh(grid,streetRow-1,c+1,"n");
  }
  // tumbleweeds + barrels
  for(let n=0;n<Math.floor(COLS/16);n++){ const c=(Math.random()*COLS)|0; setCh(grid,streetRow-1,c,(Math.random()<0.5?"o":"*")); }

  return grid;
}
function westMode(grid){
  const mg=modeGridFill(ROWS,COLS,'city');
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r]&&grid[r][c]&&grid[r][c]!==" ") setMode(mg,r,c,'west'); }
  return mg;
}
function bttfDrive(dx, speed){
  if(cityGridArr.length!==ROWS){ cityGridArr=buildCity(); }
  const grid=cityGridArr.slice();
  const mg=modeGridFill(ROWS,COLS,'city');
  const carRow=streetRow-deloSprite.length+1;
  // flaming tyre-tracks trail left behind (two fiery lines on the road at 88mph)
  for(const f of fireTrail){ if(f.x<0||f.x>=COLS)continue;
    setCh(grid,streetRow,f.x, (Math.random()<0.5?"O":"o")); setMode(mg,streetRow,f.x,'fluxfire');
    if(carRow+2<ROWS){ setCh(grid,streetRow-1,f.x,(Math.random()<0.5?"~":"*")); setMode(mg,streetRow-1,f.x,'fluxfire'); } }
  // the DeLorean
  for(let i=0;i<deloSprite.length;i++){ const art=deloSprite[i], r=carRow+i;
    for(let j=0;j<art.length;j++){ const c=Math.round(dx)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'delorean'); } }
  // speedometer readout above the car
  const spd=Math.min(88,Math.round(speed));
  const label=spd+" MPH";
  const sC=Math.round(dx)+2;
  for(let j=0;j<label.length;j++){ const c=sC+j; if(c>=0&&c<COLS){ setCh(grid,carRow-2,c,label[j]===" "?" ":label[j]); if(label[j]!==" ")setMode(mg,carRow-2,c, spd>=88?'fluxfire':'delorean'); } }
  return {grid,mg};
}

// ---- proper mushroom cloud ----
function mushroom(t,waveR){
  const grid=blankGrid(ROWS), ground=ROWS-1;
  const cc=["#","%","@","&","O","*"];
  // reserve top rows for the cap so the whole mushroom always fits on screen
  const capReserve=Math.max(4,Math.floor(ROWS*0.42));
  const maxRise=ROWS-1-capReserve;                 // stem can't push cap off-screen
  const rise=Math.min(t,maxRise), stemTop=Math.max(capReserve,ground-rise);
  const stemHalf=Math.max(2,Math.floor(COLS*0.05));
  for(let r=ground-1;r>=stemTop+2;r--){
    const j2=Math.floor(Math.sin(r*0.6+t*0.3)*1.5);
    for(let j=-stemHalf;j<=stemHalf;j++){if(Math.abs(j)===stemHalf&&Math.random()<0.4)continue;setCh(grid,r,cx+j+j2,"|");}
  }
  const capBottom=stemTop+2;
  for(let r=capBottom;r<capBottom+2;r++){
    const w=stemHalf+(r-capBottom+1)*Math.floor(COLS*0.04);
    for(let j=-w;j<=w;j++)if(Math.random()>0.2)setCh(grid,r,cx+j,cc[(Math.random()*cc.length)|0]);
  }
  const capH=Math.min(stemTop, Math.max(3,Math.floor(rise*0.5))), capMaxW=Math.floor(COLS*0.46);
  for(let i=0;i<capH;i++){
    const r=stemTop-i; if(r<0)break;
    const frac=i/capH;
    let w=Math.floor(Math.sin((frac*0.85+0.15)*Math.PI)*capMaxW);
    if(i===0)w=Math.floor(capMaxW*0.35);
    for(let j=-w;j<=w;j++){
      if(Math.abs(j)>w-2&&Math.random()<0.5)continue;
      if(Math.random()<0.12)continue;
      setCh(grid,r,cx+j,cc[(Math.random()*cc.length)|0]);
    }
  }
  for(let c=0;c<COLS;c++)grid[ground]=grid[ground].substring(0,c)+(Math.random()<0.4?[".",",","_","~"][(Math.random()*4)|0]:"^")+grid[ground].substring(c+1);
  if(waveR!==undefined){setCh(grid,ground,cx+waveR,")");setCh(grid,ground,cx+waveR+1,">");setCh(grid,ground,cx-waveR,"(");setCh(grid,ground,cx-waveR-1,"<");}
  for(let k=0;k<COLS*0.25;k++){const c=(Math.random()*COLS)|0,r=ground-1-((Math.random()*3)|0);setCh(grid,r,c,["'",".","*"][(Math.random()*3)|0]);}
  return grid;
}

let phase,bombRow,mt,groundRow,dmg,introT,timer=null;
let waveX=0, attackMode='nuke', ft=0, waveStarted=false;   // attackMode: nuke/tsunami/asteroid
let astStarted=false, astX=0, astY=0, astPhase='streak', craterR=0, astT=0, astSteps=20;
let gzStarted=false, gzX=0, gzStomp=0, gzDmgL=0, gzDmgR=0, gzFrame=0;
let npStarted=false, npT=0, npDrops=[], npFire=[];
let sunStarted=false, sunT=0;
let ufoStarted=false, ufoY=0, ufoT=0, ufoBeams=[], ufoDmg=0, ufoX=0;
let zStarted=false, zT=0, zombies=[], zDmg=0;
let locStarted=false, locT=0, locusts=[], locEaten=0;
let tornStarted=false, tornT=0, tornX=0, tornDebris=[];
let qStarted=false, qT=0, qCracks=[], qFall=0;
let volStarted=false, volT=0, volBombs=[], volLava=0, volRise=0;
let riotStarted=false, riotT=0, rioters=[], riotFires=[], riotDmg=0;
let crashStarted=false, crashT=0, planeX=0, planeY=0, crashHit=false, crashFire=0;
let toxStarted=false, toxT=0, toxLevel=0, toxBubbles=[];
let issStarted=false, issT=0, issX=0, issY=0, issHit=false, issBoom=0;
let sharkStarted=false, sharkT=0, sharkX=0, sharks=[];
let saurStarted=false, saurT=0, saurRise=0, orcs=[], saurDmg=0;
let frzStarted=false, frzT=0, frzLevel=0, snowflakes=[], spTrainX=0;
let thanosStarted=false, thanosT=0, thanosPhase='assemble', dustMotes=[], snapFade=0, thanosX=0;
let incStarted=false, incT=0, incFold=0;
let dragStarted=false, dragT=0, dragons=[], dragDmg=0, dragBurn=null;
let aiStarted=false, aiT=0, aiCols=[], aiTakeover=0;
let bttfStarted=false, bttfT=0, bttfPhase='drive', deloX=0, deloSpeed=0, fireTrail=[], westCity=null;
let tourIdx=0, tourScene=null, tourHold=0, bttfTour=[];
let steelStarted=false, steelT=0, weBeamY=0, weDmg=0, fighters=[], shockRings=[];
let dinoStarted=false, dinoT=0, rex=null, raptors=[], dinoDmg=0;
let satanStarted=false, satanT=0, satanPhase='rift', riftW=0, demons=[], satanRise=0;
let titanicStarted=false, titanicT=0, shipX=0, titanicSmoke=[], titanicAngle=0;
let nautStarted=false, nautT=0, nautPhase='descend', nautX=0, nautY=0, nautDmg=0, brainPods=[], nautImpactR=0;
let nautDiveSteps=0, nautStartX=0, nautStartY=0, nautDiveT=0;
let empStarted=false, empT=0, empPhase='charge', empR=0, empArcs=[];
let warStarted=false, warT=0, tanks=[], jets=[], shells=[], warBlasts=[], warDmg=0;
let jumStarted=false, jumT=0, jumPhase='board', vineH=[], beasts=[], jumGrowth=0;
let ghostStarted=false, ghostT=0, ghostPhase='haunt', puftX=0, ghosts=[], protonBeams=[], puftDmg=0, ectoX=0, slimer=null;
let fznStarted=false, fznT=0, fznLevel=0, castleH=0, olafX=0, snowFall=[];
let lsStarted=false, lsT=0, lsFront=0, boulders=[], lsDebris=[];
let avpStarted=false, avpT=0, xenos=[], preds=[], plasma=[], acidPools=[], avpDmg=0;
let mortalStarted=false, mortalT=0, tcX=0, mortalSmoke=[];
let simpStarted=false, simpT=0, domeR=0, dropOffset=0, heliFly=0;
let emuStarted=false, emuT=0, emus=[], soldiers=[], emuBullets=[];
let neilStarted=false, neilT=0, neilX=0;
let koolStarted=false, koolT=0, koolX=0, koolaidShards=[];
let gooStarted=false, gooT=0, gooR=0;
let mtStartedFlag=false, mtT=0, mtCol=0, mtFallers=[], mtBodies=[], mtBlastR=0;
let triffStarted=false, triffT=0, triffStalks=[];
const maxDmg=()=>Math.floor(COLS/2)+2;

function reset(){
  clearTimeout(timer); clearInterval(cycleTimer); resize();
  cityGridArr=buildCity(); spawnPlanes(); spawnRain(); spawnTrain();
  bombRow=0; mt=0; dmg=0; phase='intro'; introT=ROWS; groundRow=6;
  waveX=0; attackMode='nuke'; waveStarted=false;
  astStarted=false; astPhase='streak'; craterR=0;
  gzStarted=false; gzX=0; gzDmgL=0; gzDmgR=0; gzFrame=0;
  npStarted=false; npT=0; npDrops=[]; npFire=[];
  sunStarted=false; sunT=0; cmd.classList.remove('flametext');
  ufoStarted=false; ufoY=0; ufoT=0; ufoBeams=[]; ufoDmg=0; ufoX=0;
  zStarted=false; zT=0; zombies=[]; zDmg=0;
  locStarted=false; locT=0; locusts=[]; locEaten=0;
  tornStarted=false; tornT=0; tornX=0; tornDebris=[];
  qStarted=false; qT=0; qCracks=[]; qFall=0;
  volStarted=false; volT=0; volBombs=[]; volLava=0; volRise=0;
  riotStarted=false; riotT=0; rioters=[]; riotFires=[]; riotDmg=0;
  crashStarted=false; crashT=0; planeX=0; planeY=0; crashHit=false; crashFire=0;
  toxStarted=false; toxT=0; toxLevel=0; toxBubbles=[];
  issStarted=false; issT=0; issX=0; issY=0; issHit=false; issBoom=0;
  sharkStarted=false; sharkT=0; sharkX=0; sharks=[];
  saurStarted=false; saurT=0; saurRise=0; orcs=[]; saurDmg=0;
  frzStarted=false; frzT=0; frzLevel=0; snowflakes=[]; spTrainX=0;
  thanosStarted=false; thanosT=0; thanosPhase='assemble'; dustMotes=[]; snapFade=0; thanosX=0;
  incStarted=false; incT=0; incFold=0;
  dragStarted=false; dragT=0; dragons=[]; dragDmg=0; dragBurn=null;
  aiStarted=false; aiT=0; aiCols=[]; aiTakeover=0;
  bttfStarted=false; bttfT=0; bttfPhase='drive'; deloX=0; deloSpeed=0; fireTrail=[]; westCity=null;
  tourIdx=0; tourScene=null; tourHold=0;
  steelStarted=false; steelT=0; weBeamY=0; weDmg=0; fighters=[]; shockRings=[];
  dinoStarted=false; dinoT=0; rex=null; raptors=[]; dinoDmg=0;
  satanStarted=false; satanT=0; satanPhase='rift'; riftW=0; demons=[]; satanRise=0;
  titanicStarted=false; titanicT=0; shipX=0; titanicSmoke=[]; titanicAngle=0;
  nautStarted=false; nautT=0; nautPhase='descend'; nautX=0; nautY=0; nautDmg=0; brainPods=[]; nautImpactR=0;
  nautDiveSteps=0; nautStartX=0; nautStartY=0; nautDiveT=0;
  empStarted=false; empT=0; empPhase='charge'; empR=0; empArcs=[];
  warStarted=false; warT=0; tanks=[]; jets=[]; shells=[]; warBlasts=[]; warDmg=0;
  jumStarted=false; jumT=0; jumPhase='board'; vineH=[]; beasts=[]; jumGrowth=0;
  ghostStarted=false; ghostT=0; ghostPhase='haunt'; puftX=0; ghosts=[]; protonBeams=[]; puftDmg=0; ectoX=0; slimer=null;
  fznStarted=false; fznT=0; fznLevel=0; castleH=0; olafX=0; snowFall=[];
  lsStarted=false; lsT=0; lsFront=0; boulders=[]; lsDebris=[];
  avpStarted=false; avpT=0; xenos=[]; preds=[]; plasma=[]; acidPools=[]; avpDmg=0;
  mortalStarted=false; mortalT=0; tcX=0; mortalSmoke=[];
  simpStarted=false; simpT=0; domeR=0; dropOffset=0; heliFly=0;
  emuStarted=false; emuT=0; emus=[]; soldiers=[]; emuBullets=[];
  neilStarted=false; neilT=0; neilX=0;
  koolStarted=false; koolT=0; koolX=0; koolaidShards=[];
  gooStarted=false; gooT=0; gooR=0;
  mtStartedFlag=false; mtT=0; mtCol=0; mtFallers=[]; mtBodies=[]; mtBlastR=0;
  triffStarted=false; triffT=0; triffStalks=[];
  scene.className=''; stage.className='';
  scene.style.textShadow="none";
  cmd.textContent="sudo rm -rf /*"; cmd.className="";
  methodBox.style.display="";
  sub.textContent="INCOMING..."; sub.style.color="#ff0"; sub.className="blink";
  flash.style.transition="opacity 0.05s"; flash.style.opacity=0;
  document.body.style.background="#05060d";
  startCycle();
  loop();
}

// the command line flashes RED (nuke) -> BLUE (tidal wave) -> WHITE (asteroid)
let cycleTimer=null, cmdColor=0;   // 0=red,1=blue,2=white
function paintCmd2(){
  cmd.classList.remove('flametext');   // default: solid colour unless Sun
  if(cmdColor===1){ cmd.style.color="#22aaff"; cmd.style.textShadow="0 0 18px #22aaff";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — UNLEASH THE TIDAL WAVE"; sub.style.color="#22aaff"; sub.style.textShadow="0 0 8px #22aaff"; } }
  else if(cmdColor===2){ cmd.style.color="#ffffff"; cmd.style.textShadow="0 0 22px #ffffff";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — CALL DOWN THE ASTEROID"; sub.style.color="#ffffff"; sub.style.textShadow="0 0 8px #ffffff"; } }
  else if(cmdColor===3){ cmd.style.color="#8a5a2b"; cmd.style.textShadow="0 0 18px #b5732f";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — SUMMON GODZILLA"; sub.style.color="#a86a30"; sub.style.textShadow="0 0 8px #7a4a1a"; } }
  else if(cmdColor===4){ cmd.style.color="#ff8c1a"; cmd.style.textShadow="0 0 20px #ff6a00";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RAIN DOWN NAPALM"; sub.style.color="#ff8c1a"; sub.style.textShadow="0 0 8px #ff6a00"; } }
  else if(cmdColor===5){ cmd.style.color=""; cmd.style.textShadow=""; cmd.classList.add('flametext');
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — BRING THE HEAT DEATH"; sub.style.color="#ffb000"; sub.style.textShadow="0 0 8px #ff5a00"; } }
  else if(cmdColor===6){ cmd.style.color="#39ff14"; cmd.style.textShadow="0 0 20px #39ff14";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — TRIGGER ALIEN INVASION"; sub.style.color="#39ff14"; sub.style.textShadow="0 0 8px #39ff14"; } }
  else if(cmdColor===7){ cmd.style.color="#7a8c2a"; cmd.style.textShadow="0 0 18px #4a5a14";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RELEASE THE HORDE"; sub.style.color="#9caf3a"; sub.style.textShadow="0 0 8px #4a5a14"; } }
  else if(cmdColor===8){ cmd.style.color="#c99a3a"; cmd.style.textShadow="0 0 18px #8a6a1a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — SUMMON THE SWARM"; sub.style.color="#d9b45a"; sub.style.textShadow="0 0 8px #8a6a1a"; } }
  else if(cmdColor===9){ cmd.style.color="#b8c0cc"; cmd.style.textShadow="0 0 18px #7a8694";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — SPIN UP THE TORNADO"; sub.style.color="#cdd6e0"; sub.style.textShadow="0 0 8px #7a8694"; } }
  else if(cmdColor===10){ cmd.style.color="#a9743a"; cmd.style.textShadow="0 0 18px #6a3a10";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RUPTURE THE EARTH"; sub.style.color="#c68a4a"; sub.style.textShadow="0 0 8px #6a3a10"; } }
  else if(cmdColor===11){ cmd.style.color="#ff5a1a"; cmd.style.textShadow="0 0 20px #ff2a00";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — ERUPT THE VOLCANO"; sub.style.color="#ff7a2a"; sub.style.textShadow="0 0 8px #ff2a00"; } }
  else if(cmdColor===12){ cmd.style.color="#ff9a3a"; cmd.style.textShadow="0 0 18px #b04010";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — INCITE THE RIOTS"; sub.style.color="#ffb05a"; sub.style.textShadow="0 0 8px #b04010"; } }
  else if(cmdColor===13){ cmd.style.color="#e0e6ee"; cmd.style.textShadow="0 0 18px #99a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — CRASH THE AIRLINER"; sub.style.color="#e0e6ee"; sub.style.textShadow="0 0 8px #99a"; } }
  else if(cmdColor===14){ cmd.style.color="#7fff4a"; cmd.style.textShadow="0 0 18px #2a8a10";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — SPILL THE TOXIC WASTE"; sub.style.color="#9dff6a"; sub.style.textShadow="0 0 8px #2a8a10"; } }
  else if(cmdColor===15){ cmd.style.color="#8ad0ff"; cmd.style.textShadow="0 0 18px #2a6a9a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DEORBIT THE ISS"; sub.style.color="#aae0ff"; sub.style.textShadow="0 0 8px #2a6a9a"; } }
  else if(cmdColor===16){ cmd.style.color="#3ad0c0"; cmd.style.textShadow="0 0 18px #1a7a6a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — UNLEASH THE SHARKNADO"; sub.style.color="#5ae0d0"; sub.style.textShadow="0 0 8px #1a7a6a"; } }
  else if(cmdColor===17){ cmd.style.color="#ff3a1a"; cmd.style.textShadow="0 0 20px #b01000";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RAISE THE EYE OF SAURON"; sub.style.color="#ff6a3a"; sub.style.textShadow="0 0 8px #b01000"; } }
  else if(cmdColor===18){ cmd.style.color="#bfe6ff"; cmd.style.textShadow="0 0 20px #6ab0e0";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — BOARD THE SNOWPIERCER"; sub.style.color="#dff2ff"; sub.style.textShadow="0 0 8px #6ab0e0"; } }
  else if(cmdColor===19){ cmd.style.color="#b060e0"; cmd.style.textShadow="0 0 20px #6a20a0";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — SNAP YOUR FINGERS"; sub.style.color="#d090ff"; sub.style.textShadow="0 0 8px #6a20a0"; } }
  else if(cmdColor===20){ cmd.style.color="#8a7ad0"; cmd.style.textShadow="0 0 20px #4a3a8a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — FOLD THE CITY (INCEPTION)"; sub.style.color="#aa9aee"; sub.style.textShadow="0 0 8px #4a3a8a"; } }
  else if(cmdColor===21){ cmd.style.color="#ff9020"; cmd.style.textShadow="0 0 20px #c04000";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RELEASE THE DRAGONS"; sub.style.color="#ffb050"; sub.style.textShadow="0 0 8px #c04000"; } }
  else if(cmdColor===22){ cmd.style.color="#00ff66"; cmd.style.textShadow="0 0 20px #00aa44";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — LET THE AI TAKE OVER"; sub.style.color="#33ff88"; sub.style.textShadow="0 0 8px #00aa44"; } }
  else if(cmdColor===23){ cmd.style.color="#40d0ff"; cmd.style.textShadow="0 0 20px #a040ff";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — HIT 88 MPH"; sub.style.color="#80e0ff"; sub.style.textShadow="0 0 8px #a040ff"; } }
  else if(cmdColor===24){ cmd.style.color="#4a6aff"; cmd.style.textShadow="0 0 20px #c02020";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — START THE WORLD ENGINE"; sub.style.color="#7a9aff"; sub.style.textShadow="0 0 8px #c02020"; } }
  else if(cmdColor===25){ cmd.style.color="#8ac030"; cmd.style.textShadow="0 0 20px #3a6a10";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — UNLEASH THE DINOSAURS"; sub.style.color="#aae050"; sub.style.textShadow="0 0 8px #3a6a10"; } }
  else if(cmdColor===26){ cmd.style.color="#c81810"; cmd.style.textShadow="0 0 22px #ff2000";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — OPEN THE GATES OF HELL"; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #800000"; } }
  else if(cmdColor===27){ cmd.style.color="#5aa0d0"; cmd.style.textShadow="0 0 20px #103a5a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — FULL STEAM AHEAD"; sub.style.color="#8ac0e0"; sub.style.textShadow="0 0 8px #103a5a"; } }
  else if(cmdColor===28){ cmd.style.color="#9a5ad0"; cmd.style.textShadow="0 0 20px #2a8a7a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — CRASH THE NAUTILOID"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #2a8a7a"; } }
  else if(cmdColor===29){ cmd.style.color="#a0f0ff"; cmd.style.textShadow="0 0 20px #2080c0";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DETONATE THE EMP"; sub.style.color="#d0faff"; sub.style.textShadow="0 0 8px #2080c0"; } }
  else if(cmdColor===30){ cmd.style.color="#8a8a4a"; cmd.style.textShadow="0 0 18px #4a4a20";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DECLARE WAR"; sub.style.color="#b0b060"; sub.style.textShadow="0 0 8px #4a4a20"; } }
  else if(cmdColor===31){ cmd.style.color="#4aa02a"; cmd.style.textShadow="0 0 18px #6a4a10";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — ROLL THE DICE (JUMANJI)"; sub.style.color="#7ad04a"; sub.style.textShadow="0 0 8px #6a4a10"; } }
  else if(cmdColor===32){ cmd.style.color="#f0f0e0"; cmd.style.textShadow="0 0 18px #e02020";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — WHO YA GONNA CALL?"; sub.style.color="#fafaf0"; sub.style.textShadow="0 0 8px #e02020"; } }
  else if(cmdColor===33){ cmd.style.color="#8ad8f0"; cmd.style.textShadow="0 0 18px #4a90c0";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — LET IT GO"; sub.style.color="#c0f0ff"; sub.style.textShadow="0 0 8px #4a90c0"; } }
  else if(cmdColor===34){ cmd.style.color="#9a6a3a"; cmd.style.textShadow="0 0 18px #4a2a10";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — TRIGGER A LANDSLIDE"; sub.style.color="#c08a50"; sub.style.textShadow="0 0 8px #4a2a10"; } }
  else if(cmdColor===35){ cmd.style.color="#5ad020"; cmd.style.textShadow="0 0 18px #a02020";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — ALIEN vs PREDATOR"; sub.style.color="#8aff40"; sub.style.textShadow="0 0 8px #a02020"; } }
  else if(cmdColor===36){ cmd.style.color="#e0b030"; cmd.style.textShadow="0 0 18px #8a6a20";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — BUILD THE TRACTION CITY"; sub.style.color="#f0c860"; sub.style.textShadow="0 0 8px #8a6a20"; } }
  else if(cmdColor===37){ cmd.style.color="#ffd90f"; cmd.style.textShadow="0 0 18px #c89a00";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DROP THE DOME ON SPRINGFIELD"; sub.style.color="#ffe860"; sub.style.textShadow="0 0 8px #c89a00"; } }
  else if(cmdColor===38){ cmd.style.color="#c89050"; cmd.style.textShadow="0 0 18px #6a4020";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DECLARE WAR ON THE EMUS"; sub.style.color="#e0b070"; sub.style.textShadow="0 0 8px #6a4020"; } }
  else if(cmdColor===39){ cmd.style.color="#c8ccd0"; cmd.style.textShadow="0 0 18px #4a4e54";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RELEASE NEIL THE SEAL"; sub.style.color="#e0e4e8"; sub.style.textShadow="0 0 8px #4a4e54"; } }
  else if(cmdColor===40){ cmd.style.color="#ff2a40"; cmd.style.textShadow="0 0 18px #a00010";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — OH YEAH!"; sub.style.color="#ff5a70"; sub.style.textShadow="0 0 8px #a00010"; } }
  else if(cmdColor===41){ cmd.style.color="#b8c4cc"; cmd.style.textShadow="0 0 18px #5a6068";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — UNLEASH THE GRAY GOO"; sub.style.color="#e0e8ec"; sub.style.textShadow="0 0 8px #5a6068"; } }
  else if(cmdColor===42){ cmd.style.color="#6a8ad0"; cmd.style.textShadow="0 0 18px #203050";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — MINE TURTLE!"; sub.style.color="#9ab0e8"; sub.style.textShadow="0 0 8px #203050"; } }
  else if(cmdColor===43){ cmd.style.color="#7ad07a"; cmd.style.textShadow="0 0 18px #2a5a2a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — LOOSE THE TRIFFIDS"; sub.style.color="#a0e8a0"; sub.style.textShadow="0 0 8px #2a5a2a"; } }
  else{ cmd.style.color="#f00"; cmd.style.textShadow="0 0 18px #f00";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DROP THE BOMB"; sub.style.color="#ff5030"; sub.style.textShadow="0 0 8px #f00"; } }
}
function startCycle(){
  cmdColor=0; paintCmd2();
  cycleTimer=setInterval(()=>{ if(phase!=='intro')return; cmdColor=(cmdColor+1)%44; paintCmd2(); }, 2500);
}

// build a mode grid for a city-based scene, tagging planes + optional bomb + rain
function cityModes(g,{withRain,bombRow}={}){
  const mg=modeGridFill(ROWS,COLS,'city');
  // tag planes (find them by scanning is hard; re-tag by redrawing positions)
  for(const p of planes){
    const xi=Math.round(p.x);
    for(let j=0;j<p.art.length;j++) if(p.art[j]!==" ") setMode(mg,p.y,xi+j,'plane');
  }
  if(typeof bombRow==='number'){
    for(let i=0;i<bomb.length;i++)for(let j=0;j<bomb[i].length;j++)
      if(bomb[i][j]!==" ") setMode(mg,bombRow+i,cx-1+j,'bomb');
  }
  return mg;
}

function loop(){
  if(phase==='hold'){
    scene.style.textShadow="0 0 12px #f80";
    const g=mushroom(mt);
    scene.innerHTML=paint(g,null,'fire');
    timer=setTimeout(loop,180);
    return;
  }
  if(phase==='intro'){
    scene.style.textShadow="0 0 6px #38f";
    flickerLights();
    const g=renderCity(null,0);
    stepRain();
    const mg=modeGridFill(ROWS,COLS,'city');
    drawRain(g,mg);                         // rain behind, tagged blue
    stepTrain(); drawTrain(g,mg);           // moving subway train
    stepPlanes(); drawPlanes(g);
    for(const p of planes){const xi=Math.round(p.x);for(let j=0;j<p.art.length;j++)if(p.art[j]!==" ")setMode(mg,p.y,xi+j,'plane');}
    scene.innerHTML=paint(g,mg,'city');
    // subtitle prompt is set by paintCmd2() to match the flashing colour
    timer=setTimeout(loop,110);
    return;
  }
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
  }else if(phase==='tsunami'){
    scene.style.textShadow="0 0 10px #2b8fd6";
    if(!waveStarted){ waveStarted=true; waveX=-Math.floor(COLS*0.15); stage.classList.add('shake'); document.body.style.background="#04121e"; }
    // advance the wave front; rain keeps falling ahead of it
    stepRain();
    const {grid,mg}=tsunami(waveX);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="~~~ TIDAL WAVE ~~~"; sub.style.color="#22aaff"; sub.style.textShadow="0 0 8px #22aaff";
    waveX+=Math.max(1,Math.floor(COLS/26));
    if(waveX<COLS+Math.floor(COLS*0.2)){ timer=setTimeout(loop,70); }
    else { phase='flooded'; ft=0; loop(); }
  }else if(phase==='flooded'){
    // city fully submerged: gentle rippling water sitting over the drowned city
    stage.classList.remove('shake');
    const {grid,mg}=tsunami(COLS+COLS);   // front past the far edge = everything flooded
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is gone. — press RESET"; sub.style.color="#22aaff"; sub.className="";
    ft++;
    timer=setTimeout(loop, 200);          // keep rippling in place
  }else if(phase==='asteroid'){
    scene.style.textShadow="0 0 12px #ff7a1a";
    if(!astStarted){ astStarted=true; astT=0; astSteps=Math.max(14,Math.floor(COLS/5)); document.body.style.background="#0a0604"; }
    stepRain();
    // linear path from upper-left to city centre at street level
    const sx=Math.floor(COLS*0.10), sy=1, ex=cx, ey=streetRow;
    const f=astT/astSteps;
    astX=Math.round(sx+(ex-sx)*f);
    astY=Math.round(sy+(ey-sy)*f);
    const {grid,mg}=asteroidStreak(astX,astY);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="!!! ASTEROID INBOUND !!!"; sub.style.color="#ff7a1a"; sub.style.textShadow="0 0 8px #ff7a1a";
    astT++;
    if(astT>astSteps){ phase='ast_flash'; loop(); }
    else timer=setTimeout(loop,55);
  }else if(phase==='ast_flash'){
    flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
    document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="";
    stage.classList.add('shake');
    timer=setTimeout(()=>{ flash.style.transition="opacity 1.8s"; flash.style.opacity=0;
      document.body.style.background="#1a0d06"; phase='ast_impact'; craterR=2; loop(); }, 220);
  }else if(phase==='ast_impact'){
    scene.style.textShadow="0 0 14px #ff7a1a";
    const {grid,mg}=asteroidImpact(craterR);
    scene.innerHTML=paint(grid,mg,'impact');
    sub.textContent="WIPED OFF THE MAP"; sub.style.color="#ff9030"; sub.style.textShadow="0 0 8px #ff7a1a";
    craterR+=Math.max(2,Math.floor(COLS/20));
    if(craterR < COLS){ timer=setTimeout(loop,60); }
    else { phase='ast_hold'; loop(); }
  }else if(phase==='ast_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=asteroidImpact(COLS);   // full-map smouldering crater
    scene.innerHTML=paint(grid,mg,'impact');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="nothing left. — press RESET"; sub.style.color="#ff9030"; sub.className="";
    timer=setTimeout(loop,220);
  }else if(phase==='godzilla'){
    scene.style.textShadow="0 0 10px #3a5a2a";
    if(!gzStarted){ gzStarted=true; gzX=COLS-14; gzFrame=0; document.body.style.background="#0d0a05"; }
    stepRain();
    const breathOn=(Math.floor(gzFrame/3)%3===0);   // fire breath in bursts
    const {grid,mg}=godzilla(gzX, breathOn, gzDmgL, gzDmgR, gzFrame);
    drawRain(grid,mg);
    if(breathOn) stage.classList.add('shake'); else stage.classList.remove('shake');
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= breathOn ? "RRRAAAWWWR!! ATOMIC BREATH!!" : "GODZILLA IS HERE"; 
    sub.style.color="#7fffd4"; sub.style.textShadow="0 0 8px #33e0ff";
    gzFrame++;
    gzX-=Math.max(1,Math.floor(COLS/40));
    if(gzX>-2){ timer=setTimeout(loop,90); }
    else { phase='gz_hold'; gzX=-14; loop(); }
  }else if(phase==='gz_hold'){
    stage.classList.remove('shake');
    // he's crossed the whole city — everything flattened, Godzilla standing at the left
    const {grid,mg}=godzilla(-14, false, 0, 0, gzFrame);   // sprite off-screen; only rubble shows
    // ensure whole skyline is flattened rubble
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is rubble. — press RESET"; sub.style.color="#7fffd4"; sub.className="";
    timer=setTimeout(loop,240);
  }else if(phase==='napalm'){
    scene.style.textShadow="0 0 12px #ff6a00";
    if(!npStarted){ npStarted=true; npT=0; napalmInit(); document.body.style.background="#160a04"; }
    stepRain();
    napalmStep(npT);
    const {grid,mg}=napalmRender(npT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    // shake harder as the firestorm builds
    if(npFire.length>COLS*0.25) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent="~ FIREBOMBING RUN ~ EVERYTHING BURNS"; sub.style.color="#ff8c1a"; sub.style.textShadow="0 0 8px #ff6a00";
    npT++;
    // done once fire covers most of the width and has burned a while
    const covered = npFire.length >= COLS*0.85;
    if(!(covered && npT>60)){ timer=setTimeout(loop,70); }
    else { phase='np_hold'; loop(); }
  }else if(phase==='np_hold'){
    stage.classList.remove('shake');
    napalmStep(npT);                 // keep flames flickering in place
    const {grid,mg}=napalmRender(npT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city is ash. — press RESET"; sub.style.color="#ff8c1a"; sub.className="";
    npT++;
    timer=setTimeout(loop,120);
  }else if(phase==='sun'){
    scene.style.textShadow="0 0 14px #ff6a00";
    if(!sunStarted){ sunStarted=true; sunT=0; document.body.style.background="#0a0400"; }
    const t=sunT/70;                                  // ~70 frames to fully engulf
    const {grid,mg}=sunRender(t);
    scene.innerHTML=paint(grid,mg,'city');
    // background reddens then whitens as the sun swells
    document.body.style.background = t<0.6 ? "#1a0600" : (t<0.9?"#3a1400":"#e8c060");
    if(t>0.4) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = t<0.5 ? "THE SUN IS DYING — IT SWELLS" : "HEAT DEATH — THE EARTH IS CONSUMED";
    sub.style.color="#ffd000"; sub.style.textShadow="0 0 10px #ff6a00";
    sunT++;
    if(t<1.05){ timer=setTimeout(loop,80); }
    else { phase='sun_hold'; loop(); }
  }else if(phase==='sun_hold'){
    stage.classList.remove('shake');
    // screen fully swallowed by the sun's surface, roiling
    const {grid,mg}=sunRender(1.15);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#e8c060";
    cmd.textContent="$ _"; cmd.style.color="#3a1400"; cmd.style.textShadow="0 0 14px #ff8c00"; cmd.classList.remove('flametext');
    sub.textContent="the Earth is gone. — press RESET"; sub.style.color="#5a1400"; sub.className="";
    timer=setTimeout(loop,140);
  }else if(phase==='alien'){
    scene.style.textShadow="0 0 10px #39ff14";
    if(!ufoStarted){ ufoStarted=true; ufoT=0; ufoY=-5; ufoX=-Math.floor(ufoSprite[0].length/2); document.body.style.background="#02100a"; }
    stepRain();
    const hoverTop=2;
    if(ufoY<hoverTop){ ufoY+=1; }
    const firing = ufoY>=hoverTop;
    const shipHalf=Math.floor(ufoSprite[0].length/2);   // beam is exactly ship-width
    let beams=[], dmg=[], beamHalf=0;
    if(firing){
      // ship flies left -> right; a ship-width beam under it vaporises everything it passes
      beamHalf=shipHalf;
      beams=[Math.round(ufoX)]; dmg=[Math.round(ufoX)];
      // permanently clear the city columns the beam is currently over (destruction stays behind)
      for(let r=0;r<streetRow;r++){
        let line=(cityGridArr[r]||" ".repeat(COLS)).split("");
        for(let c=Math.round(ufoX)-shipHalf;c<=Math.round(ufoX)+shipHalf;c++){
          if(c<0||c>=COLS)continue; line[c]=" ";
        }
        cityGridArr[r]=line.join("");
      }
      // leave scorched rubble on the street behind the beam
      { let g=cityGridArr[streetRow].split("");
        for(let c=0;c<=Math.round(ufoX)+shipHalf;c++){ if(c<COLS && Math.random()<0.4) g[c]=[".",",","_"][(Math.random()*3)|0]; }
        cityGridArr[streetRow]=g.join(""); }
    }
    const {grid,mg}=alien(Math.round(ufoY), beams, dmg, ufoT, beamHalf, Math.round(ufoX));
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(firing) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = firing ? "WE COME IN PEACE… PSYCH — DEATH RAY" : "A MOTHERSHIP DESCENDS…";
    sub.style.color="#39ff14"; sub.style.textShadow="0 0 8px #39ff14";
    ufoT++;
    if(firing) ufoX+=Math.max(1,Math.floor(COLS/34));   // advance after this frame's beam/ship are drawn in sync
    if(!(firing && ufoX>COLS+shipHalf)){ timer=setTimeout(loop,70); }
    else { phase='alien_hold'; loop(); }
  }else if(phase==='alien_hold'){
    stage.classList.remove('shake');
    // whole city gone; ship hovers off to the right over the wasteland, beam off
    const shipHalf=Math.floor(ufoSprite[0].length/2);
    const {grid,mg}=alien(2, [], [], ufoT, 0, COLS-shipHalf-2);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city was harvested. — press RESET"; sub.style.color="#39ff14"; sub.className="";
    ufoT++;
    timer=setTimeout(loop,160);
  }else if(phase==='zombie'){
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
  }else if(phase==='locust'){
    scene.style.textShadow="0 0 8px #c99a3a";
    if(!locStarted){ locStarted=true; locT=0; locustInit(); document.body.style.background="#0c0a04"; }
    stepRain();
    locustStep(locT);
    const {grid,mg}=locustRender(locT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent = locEaten<COLS*0.5 ? "A PLAGUE OF LOCUSTS DARKENS THE SKY" : "THE SWARM DEVOURS EVERYTHING";
    sub.style.color="#d9b45a"; sub.style.textShadow="0 0 8px #8a6a1a";
    locT++;
    if(!(locEaten>=COLS && locT>40)){ timer=setTimeout(loop,70); }
    else { phase='locust_hold'; loop(); }
  }else if(phase==='locust_hold'){
    stage.classList.remove('shake');
    locustStep(locT);
    const {grid,mg}=locustRender(locT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="nothing but bones and dust. — press RESET"; sub.style.color="#d9b45a"; sub.className="";
    locT++;
    timer=setTimeout(loop,140);
  }else if(phase==='tornado'){
    scene.style.textShadow="0 0 8px #b8c0cc";
    if(!tornStarted){ tornStarted=true; tornT=0; tornX=-4; document.body.style.background="#0a0c0e"; }
    stepRain();
    const {grid,mg}=tornadoRender(tornX, tornT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="A TORNADO TEARS THROUGH THE CITY"; sub.style.color="#cdd6e0"; sub.style.textShadow="0 0 8px #7a8694";
    tornX+=Math.max(1,Math.floor(COLS/40)); tornT++;
    if(tornX<COLS+4){ timer=setTimeout(loop,70); }
    else { phase='torn_hold'; loop(); }
  }else if(phase==='torn_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=tornadoRender(COLS+10, tornT);   // funnel gone off-screen; ruins remain
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="swept away. — press RESET"; sub.style.color="#cdd6e0"; sub.className="";
    tornT++;
    timer=setTimeout(loop,160);
  }else if(phase==='quake'){
    scene.style.textShadow="0 0 8px #a9743a";
    if(!qStarted){ qStarted=true; qT=0; qFall=0; qCracks=[]; document.body.style.background="#0c0805"; }
    stepRain();
    qFall=Math.min(1, qFall+0.03);
    const {grid,mg}=quakeRender(qT, qFall);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');                    // constant violent shaking
    sub.textContent= qFall<0.6 ? "THE GROUND HEAVES AND SPLITS" : "THE CITY CRUMBLES INTO THE EARTH";
    sub.style.color="#c68a4a"; sub.style.textShadow="0 0 8px #6a3a10";
    qT++;
    if(!(qFall>=1 && qT>45)){ timer=setTimeout(loop,75); }
    else { phase='quake_hold'; loop(); }
  }else if(phase==='quake_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=quakeRender(qT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="reduced to ruins. — press RESET"; sub.style.color="#c68a4a"; sub.className="";
    qT++;
    timer=setTimeout(loop,150);
  }else if(phase==='volcano'){
    scene.style.textShadow="0 0 10px #ff5a1a";
    if(!volStarted){ volStarted=true; volT=0; volRise=0; volLava=0; volBombs=[];
      for(let i=0;i<Math.max(6,Math.floor(COLS/10));i++){ volBombs.push({ x:Math.floor(COLS*0.78), y:Math.floor(streetRow*0.3), vx:(Math.random()*-3-0.5), vy:-(1+Math.random()*2), g:0.25 }); }
      document.body.style.background="#160604"; }
    stepRain();
    // PHASE 1: the mountain rises out of the ground; PHASE 2: it erupts & floods
    if(volRise<1){ volRise=Math.min(1, volRise+0.06); }
    const risen = volRise>=1;
    if(risen){
      for(const b of volBombs){ b.x+=b.vx; b.y+=b.vy; b.vy+=b.g; if(b.y>=streetRow || b.x<0){ b.x=Math.floor(COLS*0.78); b.y=Math.floor(streetRow*0.3); b.vx=(Math.random()*-3-0.5); b.vy=-(1+Math.random()*2); } }
      volLava=Math.min(COLS, volLava+Math.max(1,Math.floor(COLS/40)));
    }
    const {grid,mg}=volcanoRender(volT, volLava, volBombs, volRise);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');   // ground rumbles as it rises and erupts
    sub.textContent = !risen ? "A VOLCANO RISES FROM THE EARTH…" : (volLava<COLS*0.5 ? "THE VOLCANO ERUPTS!" : "LAVA CONSUMES THE CITY");
    sub.style.color="#ff7a2a"; sub.style.textShadow="0 0 8px #ff2a00";
    volT++;
    if(!(risen && volLava>=COLS && volT>40)){ timer=setTimeout(loop,70); }
    else { phase='volcano_hold'; loop(); }
  }else if(phase==='volcano_hold'){
    stage.classList.remove('shake');
    for(const b of volBombs){ b.x+=b.vx; b.y+=b.vy; b.vy+=b.g; if(b.y>=streetRow||b.x<0){ b.x=Math.floor(COLS*0.78); b.y=Math.floor(streetRow*0.3); b.vx=(Math.random()*-3-0.5); b.vy=-(1+Math.random()*2); } }
    const {grid,mg}=volcanoRender(volT, COLS, volBombs, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="buried in molten rock. — press RESET"; sub.style.color="#ff7a2a"; sub.className="";
    volT++;
    timer=setTimeout(loop,150);
  }else if(phase==='riot'){
    scene.style.textShadow="0 0 8px #ff9a3a";
    if(!riotStarted){ riotStarted=true; riotT=0; riotInit(); document.body.style.background="#0e0805"; }
    stepRain();
    riotStep(riotT);
    const {grid,mg}=riotRender(riotT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(riotFires.length>COLS*0.2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= riotFires.length<COLS*0.2 ? "THE STREETS ERUPT IN CHAOS" : "THE CITY BURNS IN THE RIOTS";
    sub.style.color="#ffb05a"; sub.style.textShadow="0 0 8px #b04010";
    riotT++;
    if(!(riotFires.length>=COLS*0.35 && riotT>55)){ timer=setTimeout(loop,80); }
    else { phase='riot_hold'; loop(); }
  }else if(phase==='riot_hold'){
    stage.classList.remove('shake');
    riotStep(riotT);
    const {grid,mg}=riotRender(riotT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="burned and looted. — press RESET"; sub.style.color="#ffb05a"; sub.className="";
    riotT++;
    timer=setTimeout(loop,140);
  }else if(phase==='crash'){
    scene.style.textShadow="0 0 8px #e0e6ee";
    if(!crashStarted){ crashStarted=true; crashT=0; planeX=-18; planeY=1; crashHit=false; crashFire=0; document.body.style.background="#080a0e"; }
    stepRain();
    if(!crashHit){
      planeX+=Math.max(2,Math.floor(COLS/20)); planeY+=Math.max(1,Math.floor(streetRow/16));
      if(planeX>=cx || planeY>=streetRow-2){ crashHit=true; }
    } else { crashFire=Math.min(Math.floor(COLS*0.3), crashFire+Math.max(2,Math.floor(COLS/22))); }
    const {grid,mg}=crashRender(planeX,planeY,crashHit,crashFire);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(crashHit) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = !crashHit ? "AN AIRLINER GOES DOWN…" : "IMPACT — THE CITY IS ABLAZE";
    sub.style.color="#e0e6ee"; sub.style.textShadow="0 0 8px #99a";
    crashT++;
    if(!(crashHit && crashFire>=Math.floor(COLS*0.3) && crashT>40)){ timer=setTimeout(loop,70); }
    else { phase='crash_hold'; loop(); }
  }else if(phase==='crash_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=crashRender(planeX,planeY,true,Math.floor(COLS*0.3));
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="wreckage and flames. — press RESET"; sub.style.color="#e0e6ee"; sub.className="";
    crashT++;
    timer=setTimeout(loop,150);
  }else if(phase==='toxic'){
    scene.style.textShadow="0 0 8px #7fff4a";
    if(!toxStarted){ toxStarted=true; toxT=0; toxLevel=0; document.body.style.background="#040a04"; }
    stepRain();
    // toxLevel now tracks dissolve progress 0..1: hold a beat as the pool forms, then eat the city
    const settle=14;                                  // frames for the storey-deep pool to settle
    const dissolve = toxT<settle ? 0 : Math.min(1, (toxT-settle)/50);
    const {grid,mg}=toxicRender(toxT, dissolve);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= dissolve<0.5 ? "TOXIC WASTE POOLS IN THE STREETS" : "THE BUILDINGS DISSOLVE INTO SLUDGE";
    sub.style.color="#9dff6a"; sub.style.textShadow="0 0 8px #2a8a10";
    toxT++;
    if(!(dissolve>=1 && toxT>settle+55)){ timer=setTimeout(loop,80); }
    else { phase='toxic_hold'; loop(); }
  }else if(phase==='toxic_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=toxicRender(toxT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="a poisoned wasteland. — press RESET"; sub.style.color="#9dff6a"; sub.className="";
    toxT++;
    timer=setTimeout(loop,150);
  }else if(phase==='iss'){
    scene.style.textShadow="0 0 8px #8ad0ff";
    if(!issStarted){ issStarted=true; issT=0; issX=-20; issY=0; issHit=false; issBoom=0; document.body.style.background="#03060c"; }
    stepRain();
    if(!issHit){
      issX+=Math.max(2,Math.floor(COLS/22)); issY+=Math.max(1,Math.floor(streetRow/18));
      if(issX>=cx || issY>=streetRow-3){ issHit=true; }
    } else { issBoom=Math.min(Math.floor(COLS*0.32), issBoom+Math.max(2,Math.floor(COLS/22))); }
    const {grid,mg}=issRender(issX,issY,issHit,issBoom);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(issHit) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = !issHit ? "THE ISS IS DEORBITING…" : "IT SLAMS INTO THE CITY";
    sub.style.color="#aae0ff"; sub.style.textShadow="0 0 8px #2a6a9a";
    issT++;
    if(!(issHit && issBoom>=Math.floor(COLS*0.32) && issT>40)){ timer=setTimeout(loop,70); }
    else { phase='iss_hold'; loop(); }
  }else if(phase==='iss_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=issRender(issX,issY,true,Math.floor(COLS*0.32));
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="flattened by falling debris. — press RESET"; sub.style.color="#aae0ff"; sub.className="";
    issT++;
    timer=setTimeout(loop,150);
  }else if(phase==='sharknado'){
    scene.style.textShadow="0 0 8px #3ad0c0";
    if(!sharkStarted){ sharkStarted=true; sharkT=0; sharkX=-4; sharknadoInit(); document.body.style.background="#050e10"; }
    stepRain();
    sharknadoStep();
    const {grid,mg}=sharknadoRender(sharkX, sharkT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="SHARKNADO! IT'S RAINING SHARKS"; sub.style.color="#5ae0d0"; sub.style.textShadow="0 0 8px #1a7a6a";
    sharkX+=Math.max(1,Math.floor(COLS/42)); sharkT++;
    if(sharkX<COLS+4){ timer=setTimeout(loop,70); }
    else { phase='shark_hold'; loop(); }
  }else if(phase==='shark_hold'){
    stage.classList.remove('shake');
    sharknadoStep();
    const {grid,mg}=sharknadoRender(COLS+10, sharkT);   // spout off-screen; sharks flop in the ruins
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="eaten and washed away. — press RESET"; sub.style.color="#5ae0d0"; sub.className="";
    sharkT++;
    timer=setTimeout(loop,150);
  }else if(phase==='sauron'){
    scene.style.textShadow="0 0 10px #ff3a1a";
    if(!saurStarted){ saurStarted=true; saurT=0; saurRise=0; sauronInit(); document.body.style.background="#0e0402"; }
    stepRain();
    // PHASE 1: the dark tower rises; PHASE 2: the Eye opens & orcs swarm
    if(saurRise<1){ saurRise=Math.min(1, saurRise+0.05); }
    const risen=saurRise>=1;
    if(risen) sauronStep(saurT);
    const {grid,mg}=sauronRender(saurT, saurRise);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent = !risen ? "A DARK TOWER RISES…" : (saurDmg<cx ? "THE EYE OPENS — ORCS POUR IN" : "THE CITY FALLS TO MORDOR");
    sub.style.color="#ff6a3a"; sub.style.textShadow="0 0 8px #b01000";
    saurT++;
    if(!(risen && saurDmg>=COLS*0.6 && saurT>55)){ timer=setTimeout(loop,80); }
    else { phase='sauron_hold'; loop(); }
  }else if(phase==='sauron_hold'){
    stage.classList.remove('shake');
    sauronStep(saurT);
    const {grid,mg}=sauronRender(saurT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="one does not simply survive. — press RESET"; sub.style.color="#ff6a3a"; sub.className="";
    saurT++;
    timer=setTimeout(loop,150);
  }else if(phase==='freeze'){
    scene.style.textShadow="0 0 10px #bfe6ff";
    if(!frzStarted){ frzStarted=true; frzT=0; frzLevel=0; freezeInit(); document.body.style.background="#060c14"; }
    freezeStep();
    spTrainX+=Math.max(1,Math.floor(COLS/44));   // the Snowpiercer circles
    frzLevel=Math.min(1, frzLevel+0.02);
    const {grid,mg}=freezeRender(frzT, frzLevel);
    scene.innerHTML=paint(grid,mg,'city');
    // background pales as the deep freeze sets in
    document.body.style.background = frzLevel<0.5 ? "#0a1420" : (frzLevel<0.9?"#16283a":"#3a5a72");
    sub.textContent = frzLevel<0.5 ? "A GLOBAL DEEP FREEZE DESCENDS" : "THE WORLD LOCKS IN ICE — THE TRAIN CIRCLES ON";
    sub.style.color="#dff2ff"; sub.style.textShadow="0 0 8px #6ab0e0";
    frzT++;
    if(!(frzLevel>=1 && frzT>50)){ timer=setTimeout(loop,80); }
    else { phase='freeze_hold'; loop(); }
  }else if(phase==='freeze_hold'){
    stage.classList.remove('shake');
    freezeStep();
    spTrainX+=Math.max(1,Math.floor(COLS/44));   // train keeps looping forever
    const {grid,mg}=freezeRender(frzT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#3a5a72";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="frozen solid — the train never stops. — press RESET"; sub.style.color="#dff2ff"; sub.className="";
    frzT++;
    timer=setTimeout(loop,140);
  }else if(phase==='thanos'){
    scene.style.textShadow="0 0 10px #b060e0";
    if(!thanosStarted){ thanosStarted=true; thanosT=0; thanosPhase='assemble'; thanosX=COLS-9; snapFade=0; document.body.style.background="#0a0410"; }
    stepRain();
    if(thanosPhase==='assemble'){
      // Thanos strides toward the Avengers line; they stand and fail to stop him
      thanosX-=Math.max(1,Math.floor(COLS/40));
      const {grid,mg}=thanosDraw(thanosX, false, 0);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE AVENGERS MAKE THEIR STAND…"; sub.style.color="#d090ff"; sub.style.textShadow="0 0 8px #6a20a0";
      thanosT++;
      if(thanosX>Math.floor(COLS*0.6)){ timer=setTimeout(loop,80); }
      else { thanosPhase='snapflash'; loop(); }
    }else if(thanosPhase==='snapflash'){
      flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
      document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="* SNAP *";
      stage.classList.add('shake');
      // seed dust motes rising from where things stood
      dustMotes=[]; for(let i=0;i<Math.floor(COLS*0.8);i++){ dustMotes.push({ x:(Math.random()*COLS)|0, y:streetRow-((Math.random()*streetRow)|0), vx:(Math.random()*2-1)*0.6, vy:-(0.3+Math.random()*0.8) }); }
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.6s"; flash.style.opacity=0; document.body.style.background="#160a1e"; thanosPhase='dusting'; snapFade=0; loop(); }, 240);
    }else if(thanosPhase==='dusting'){
      snapFade=Math.min(1, snapFade+0.05);
      for(const m of dustMotes){ m.x+=m.vx; m.y+=m.vy; m.vy+=0.01; if(m.y<0||m.x<0||m.x>=COLS){ m.y=streetRow-((Math.random()*4)|0); m.x=(Math.random()*COLS)|0; m.vy=-(0.3+Math.random()*0.8); } }
      const {grid,mg}=thanosDraw(thanosX, true, snapFade);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      sub.textContent = snapFade<0.7 ? "HALF OF EVERYTHING TURNS TO DUST" : "THEY LOST. — you should've gone for the head.";
      sub.style.color="#d090ff"; sub.style.textShadow="0 0 8px #6a20a0";
      thanosT++;
      if(!(snapFade>=1 && thanosT>50)){ timer=setTimeout(loop,90); }
      else { phase='thanos_hold'; loop(); }
    }
  }else if(phase==='thanos_hold'){
    stage.classList.remove('shake');
    for(const m of dustMotes){ m.x+=m.vx; m.y+=m.vy; m.vy+=0.01; if(m.y<0||m.x<0||m.x>=COLS){ m.y=streetRow-((Math.random()*4)|0); m.x=(Math.random()*COLS)|0; m.vy=-(0.3+Math.random()*0.8); } }
    const {grid,mg}=thanosDraw(thanosX, true, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="half the world is dust. — press RESET"; sub.style.color="#d090ff"; sub.className="";
    thanosT++;
    timer=setTimeout(loop,140);
  }else if(phase==='inception'){
    scene.style.textShadow="0 0 10px #8a7ad0";
    if(!incStarted){ incStarted=true; incT=0; incFold=0; document.body.style.background="#0a0818"; }
    stepRain();
    incFold=Math.min(1, incFold+0.02);
    const {grid,mg}=inceptionRender(incT, incFold);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= incFold<0.5 ? "THE CITY FOLDS IN ON ITSELF" : "REALITY COLLAPSES INTO THE DREAM";
    sub.style.color="#aa9aee"; sub.style.textShadow="0 0 8px #4a3a8a";
    incT++;
    if(!(incFold>=1 && incT>40)){ timer=setTimeout(loop,80); }
    else { phase='inception_hold'; loop(); }
  }else if(phase==='inception_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=inceptionRender(incT, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="lost in the dream. — press RESET"; sub.style.color="#aa9aee"; sub.className="";
    incT++;
    timer=setTimeout(loop,150);
  }else if(phase==='dragons'){
    scene.style.textShadow="0 0 10px #ff9020";
    if(!dragStarted){ dragStarted=true; dragT=0; dragonsInit(); document.body.style.background="#100604"; }
    stepRain();
    dragonsStep(dragT);
    const {grid,mg}=dragonsRender(dragT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(dragDmg>COLS*0.3) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= dragDmg<COLS*0.5 ? "DRAGONS CIRCLE OVERHEAD" : "DRACARYS — THE CITY BURNS";
    sub.style.color="#ffb050"; sub.style.textShadow="0 0 8px #c04000";
    dragT++;
    if(!(dragDmg>=Math.floor(COLS*0.75) && dragT>40)){ timer=setTimeout(loop,75); }
    else { phase='dragons_hold'; loop(); }
  }else if(phase==='dragons_hold'){
    stage.classList.remove('shake');
    dragonsStep(dragT);
    const {grid,mg}=dragonsRender(dragT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="burned to ash by dragonfire. — press RESET"; sub.style.color="#ffb050"; sub.className="";
    dragT++;
    timer=setTimeout(loop,150);
  }else if(phase==='ai'){
    scene.style.textShadow="0 0 10px #00ff66";
    if(!aiStarted){ aiStarted=true; aiT=0; aiInit(); document.body.style.background="#00120a"; }
    aiStep(aiT);
    const {grid,mg}=aiRender(aiT);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent= aiTakeover<COLS*0.5 ? "THE MACHINES ARE WAKING UP" : "THE AI HAS TAKEN CONTROL";
    sub.style.color="#33ff88"; sub.style.textShadow="0 0 8px #00aa44";
    aiT++;
    if(!(aiTakeover>=COLS && aiT>40)){ timer=setTimeout(loop,70); }
    else { phase='ai_hold'; loop(); }
  }else if(phase==='ai_hold'){
    stage.classList.remove('shake');
    aiStep(aiT);
    const {grid,mg}=aiRender(aiT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="humanity is obsolete. — press RESET"; sub.style.color="#33ff88"; sub.className="";
    aiT++;
    timer=setTimeout(loop,120);
  }else if(phase==='bttf'){
    scene.style.textShadow="0 0 10px #40d0ff";
    if(!bttfStarted){
      bttfStarted=true; bttfT=0; bttfPhase='drive'; deloX=-14; deloSpeed=0; fireTrail=[]; tourIdx=0;
      // the full trilogy itinerary — each stop is a destination year with its scene
      bttfTour=[
        {yr:"1955", cap:"BTTF (1985→1955) — Hill Valley, past", build:build1955, bg:"#141c22"},
        {yr:"1985", cap:"BTTF (1955→1985) — back home", build:build1985, bg:"#05060d"},
        {yr:"2015", cap:"BTTF II (1985→2015) — the future!", build:build2015, bg:"#0a0a1e"},
        {yr:"1985-A", cap:"BTTF II (2015→1985) — Biff's Hell Valley", build:buildHell, bg:"#1a0604"},
        {yr:"1955", cap:"BTTF II (1985-A→1955) — fix the timeline", build:build1955, bg:"#141c22"},
        {yr:"1985", cap:"BTTF II (1955→1985) — home… then lightning!", build:build1985, bg:"#05060d"},
        {yr:"1955", cap:"BTTF III (1985→1955) — Doc's letter", build:build1955, bg:"#141c22"},
        {yr:"1885", cap:"BTTF III (1955→1885) — the Old West", build:()=>({grid:(westCity=buildWest()) && westCity.slice(), mode:'west'}), bg:"#3a2a18"},
        {yr:"1985", cap:"BTTF III (1885→1985) — finally home!", build:build1985, bg:"#05060d"},
      ];
      document.body.style.background="#05060d";
    }
    if(bttfPhase==='drive'){
      stepRain();
      deloSpeed=Math.min(92, deloSpeed+5);
      deloX+=Math.max(2, Math.floor(deloSpeed/8));
      fireTrail.push({x:Math.round(deloX)}); if(fireTrail.length>COLS) fireTrail.shift();
      const {grid,mg}=bttfDrive(deloX, deloSpeed);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      if(deloSpeed>=88) stage.classList.add('shake'); else stage.classList.remove('shake');
      const dest=bttfTour[tourIdx];
      sub.textContent = deloSpeed<88 ? "TIME CIRCUITS ON — DESTINATION "+dest.yr+" ("+Math.round(deloSpeed)+" MPH)" : "88 MPH — GREAT SCOTT! →  "+dest.yr;
      sub.style.color="#80e0ff"; sub.style.textShadow="0 0 8px #a040ff";
      bttfT++;
      if(deloSpeed>=88 && deloX>cx){ bttfPhase='flux'; loop(); }
      else timer=setTimeout(loop,60);
    }else if(bttfPhase==='flux'){
      flash.style.transition="opacity 0.03s"; flash.style.opacity=1;
      document.body.style.background="#fff"; scene.innerHTML=""; sub.textContent="* "+bttfTour[tourIdx].yr+" *";
      stage.classList.add('shake');
      tourScene=bttfTour[tourIdx].build();      // build the destination-year scene during the flash
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.1s"; flash.style.opacity=0; document.body.style.background=bttfTour[tourIdx].bg; bttfPhase='arrive'; deloX=-14; tourHold=0; fireTrail=[]; loop(); }, 200);
    }else if(bttfPhase==='arrive'){
      // show the destination year, DeLorean rolling across it
      const dest=bttfTour[tourIdx];
      if(!tourScene) tourScene=dest.build();
      const grid=tourScene.grid.slice();
      const mg=modeGridFill(ROWS,COLS,tourScene.mode);
      // re-tag scene chars to the era palette (mode grid full-covers by mode already; keep 'city' default for 1985)
      // roll the DeLorean through
      deloX+=Math.max(2,Math.floor(COLS/24));
      const carRow=streetRow-deloSprite.length+1;
      for(let i=0;i<deloSprite.length;i++){ const art=deloSprite[i], r=carRow+i;
        for(let j=0;j<art.length;j++){ const c=Math.round(deloX)+j; if(c<0||c>=COLS||r<0||r>=ROWS)continue; if(art[j]===" ")continue; setCh(grid,r,c,art[j]); setMode(mg,r,c,'delorean'); } }
      scene.style.textShadow="0 0 8px "+(tourScene.mode==='era2015'?"#30d0ff":tourScene.mode==='hell'?"#ff4a20":"#9a7a5a");
      scene.innerHTML=paint(grid,mg, tourScene.mode==='city'?'city':tourScene.mode);
      stage.classList.remove('shake');
      sub.textContent=dest.yr+" — "+dest.cap; sub.style.color="#80e0ff"; sub.style.textShadow="0 0 8px #a040ff";
      tourHold++;
      // let the car cross AND linger a moment so the era is readable
      if(deloX<COLS+6 || tourHold<14){ timer=setTimeout(loop,90); }
      else {
        tourIdx++;
        if(tourIdx>=bttfTour.length){ phase='bttf_hold'; loop(); }
        else { bttfPhase='drive'; deloX=-14; deloSpeed=0; fireTrail=[]; tourScene=null; loop(); }
      }
    }
  }else if(phase==='bttf_hold'){
    stage.classList.remove('shake');
    // final stop: home in 1985, safe and sound
    const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    scene.style.textShadow="0 0 8px #40d0ff";
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#05060d";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the whole trilogy, done. back home in 1985. — press RESET"; sub.style.color="#80e0ff"; sub.className="";
    bttfT++;
    timer=setTimeout(loop,200);
  }else if(phase==='steel'){
    scene.style.textShadow="0 0 10px #4a6aff";
    if(!steelStarted){ steelStarted=true; steelT=0; steelInit(); document.body.style.background="#04060e"; }
    stepRain();
    steelStep(steelT);
    const {grid,mg}=steelRender(steelT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent= weDmg<cx*0.5 ? "THE WORLD ENGINE POUNDS METROPOLIS" : "SUPERMAN vs ZOD — THE CITY IS LEVELLED";
    sub.style.color="#7a9aff"; sub.style.textShadow="0 0 8px #c02020";
    steelT++;
    if(!(weDmg>=cx && steelT>55)){ timer=setTimeout(loop,70); }
    else { phase='steel_hold'; loop(); }
  }else if(phase==='steel_hold'){
    stage.classList.remove('shake');
    steelStep(steelT);
    const {grid,mg}=steelRender(steelT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="downtown is gone. — press RESET"; sub.style.color="#7a9aff"; sub.className="";
    steelT++;
    timer=setTimeout(loop,140);
  }else if(phase==='dino'){
    scene.style.textShadow="0 0 8px #8ac030";
    if(!dinoStarted){ dinoStarted=true; dinoT=0; dinoInit(); document.body.style.background="#060c04"; }
    stepRain();
    dinoStep(dinoT);
    const {grid,mg}=dinoRender(dinoT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(dinoDmg>COLS*0.3) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= dinoDmg<COLS*0.5 ? "A T. REX IS LOOSE IN SAN DIEGO" : "THE DINOSAURS RUN WILD IN THE CITY";
    sub.style.color="#aae050"; sub.style.textShadow="0 0 8px #3a6a10";
    dinoT++;
    if(!(dinoDmg>=COLS && dinoT>50)){ timer=setTimeout(loop,80); }
    else { phase='dino_hold'; loop(); }
  }else if(phase==='dino_hold'){
    stage.classList.remove('shake');
    dinoStep(dinoT);
    const {grid,mg}=dinoRender(dinoT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the dinosaurs have the city now. — press RESET"; sub.style.color="#aae050"; sub.className="";
    dinoT++;
    timer=setTimeout(loop,140);
  }else if(phase==='satan'){
    scene.style.textShadow="0 0 12px #ff2000";
    if(!satanStarted){ satanStarted=true; satanT=0; satanPhase='rift'; riftW=0; demons=[]; satanRise=0; document.body.style.background="#0e0202"; }
    stage.classList.add('shake');
    if(satanPhase==='rift'){
      // the ground tears open in the middle of the city, widening
      riftW=Math.min(Math.floor(COLS*0.16), riftW+Math.max(1,Math.floor(COLS/40)));
      const {grid,mg}=satanRender(satanT, 'rift', riftW, 0);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE GROUND SPLITS — HELL YAWNS OPEN"; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #800000";
      satanT++;
      if(riftW<Math.floor(COLS*0.16)){ timer=setTimeout(loop,80); }
      else { satanPhase='army'; loop(); }
    }else if(satanPhase==='army'){
      // Satan's army pours out and overruns the world above
      if(satanT%2===0 && demons.length<COLS*0.6) spawnDemon();
      for(const d of demons){ d.x+=d.spd*d.dir; d.ph+=0.4; if(d.x<1){d.x=1;d.dir=1;} if(d.x>COLS-2){d.x=COLS-2;d.dir=-1;} if(Math.random()<0.02)d.dir*=-1; }
      const {grid,mg}=satanRender(satanT, 'army', riftW, 0);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE ARMIES OF HELL TAKE THE WORLD ABOVE"; sub.style.color="#ff4020"; sub.style.textShadow="0 0 8px #800000";
      satanT++;
      if(!(demons.length>=COLS*0.5 && satanT>60)){ timer=setTimeout(loop,80); }
      else { satanPhase='throne'; satanRise=0; loop(); }
    }else if(satanPhase==='throne'){
      // Satan ascends and claims his throne
      satanRise=Math.min(1, satanRise+0.03);
      for(const d of demons){ d.x+=d.spd*d.dir; d.ph+=0.4; if(d.x<1){d.x=1;d.dir=1;} if(d.x>COLS-2){d.x=COLS-2;d.dir=-1;} }
      const {grid,mg}=satanRender(satanT, 'throne', riftW, satanRise);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent = satanRise<1 ? "SATAN RISES FROM THE PIT…" : "THE DEVIL CLAIMS HIS THRONE";
      sub.style.color="#ff4020"; sub.style.textShadow="0 0 10px #ff2000";
      satanT++;
      if(!(satanRise>=1 && satanT>70)){ timer=setTimeout(loop,80); }
      else { phase='satan_hold'; loop(); }
    }
  }else if(phase==='satan_hold'){
    stage.classList.remove('shake');
    for(const d of demons){ d.x+=d.spd*d.dir; d.ph+=0.4; if(d.x<1){d.x=1;d.dir=1;} if(d.x>COLS-2){d.x=COLS-2;d.dir=-1;} }
    const {grid,mg}=satanRender(satanT, 'throne', riftW, 1);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Hell reigns on Earth. — press RESET"; sub.style.color="#ff4020"; sub.className="";
    satanT++;
    timer=setTimeout(loop,150);
  }else if(phase==='titanic'){
    scene.style.textShadow="0 0 8px #5aa0d0";
    if(!titanicStarted){ titanicStarted=true; titanicT=0; shipX=-4; titanicSmoke=[]; document.body.style.background="#040a12"; }
    stepRain();
    const stopAt=COLS-3;                    // bow halts against the last building at the far edge
    shipX=Math.min(stopAt, shipX+Math.max(1,Math.floor(COLS/40)));
    const arrived=(shipX>=stopAt);
    const {grid,mg}=titanicRender(shipX);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(!arrived) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= arrived ? "…AND THEN IT STOPPED." : (shipX<cx ? "THE TITANIC NEVER STOPPED — FULL STEAM AHEAD" : "THE GREAT LINER PLOUGHS THROUGH THE CITY");
    sub.style.color="#8ac0e0"; sub.style.textShadow="0 0 8px #103a5a";
    titanicT++;
    if(!(arrived && titanicT>14)){ timer=setTimeout(loop,70); }     // pause ~1s once it stops
    else { phase='titanic_topple'; titanicT=0; loop(); }
  }else if(phase==='titanic_topple'){
    stage.classList.add('shake');
    titanicAngle=Math.min(26, titanicAngle+2.6);
    const {grid,mg}=titanicWreckRender(COLS-3, titanicAngle);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="IT KEELS OVER, LISTING HARD TO PORT";
    sub.style.color="#8ac0e0"; sub.style.textShadow="0 0 8px #103a5a";
    titanicT++;
    if(!(titanicAngle>=26 && titanicT>10)){ timer=setTimeout(loop,80); }
    else { phase='titanic_hold'; loop(); }
  }else if(phase==='titanic_hold'){
    stage.classList.remove('shake');
    // the wreck lies motionless, capsized in the ruins
    const {grid,mg}=titanicWreckRender(COLS-3, titanicAngle);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the wreck lies capsized in the ruins. — press RESET"; sub.style.color="#8ac0e0"; sub.className="";
    titanicT++;
    timer=setTimeout(loop,150);
  }else if(phase==='nautiloid'){
    scene.style.textShadow="0 0 10px #9a5ad0";
    if(!nautStarted){ nautStarted=true; nautT=0; nautPhase='descend'; nautInit(); document.body.style.background="#0a0616"; }
    const gzX=cx+Math.floor(COLS*0.12);                 // ground-zero column
    const endX=gzX-Math.floor(nautSprite[0].length/2), endY=streetRow-nautSprite.length+2;  // ship buried into the street
    if(nautPhase==='descend'){
      stepRain();
      // STEEP, FAST plunge along a straight line to the exact crash point
      if(nautDiveSteps===0){ nautDiveSteps = 1; nautStartX = nautX; nautStartY = nautY; }
      nautDiveT = (nautDiveT||0) + 1;
      const totalDive = Math.max(6, Math.floor(ROWS*0.5));
      const f = Math.min(1, nautDiveT/totalDive);
      const fe = f*f;                                     // ease-in = accelerating dive
      nautX = Math.round(nautStartX + (endX - nautStartX)*fe);
      nautY = Math.round(nautStartY + (endY - nautStartY)*fe);
      const {grid,mg}=nautRender(nautT,'descend',nautX,nautY);
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent="A NAUTILOID PLUMMETS OUT OF A PLANAR PORTAL"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #2a8a7a";
      nautT++;
      if(f<1){ timer=setTimeout(loop,40); }               // fast frames = fast dive
      else { nautPhase='impactflash'; nautX=endX; nautY=endY; loop(); }
    }else if(nautPhase==='impactflash'){
      // slammed into the ground — blinding psionic flash
      flash.style.transition="opacity 0.02s"; flash.style.opacity=1;
      document.body.style.background="#e0d0ff"; scene.innerHTML=""; sub.textContent="* IMPACT *";
      stage.classList.add('shake');
      nautImpactR=2;
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.5s"; flash.style.opacity=0; document.body.style.background="#160a1e"; nautPhase='impact'; loop(); }, 180);
    }else if(nautPhase==='impact'){
      // massive shockwave blows the city outward from ground zero
      const {grid,mg}=nautImpact(nautImpactR, gzX);
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent="THE CITY IS BLOWN APART BY THE CRASH"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 10px #40e0c0";
      nautImpactR+=Math.max(3,Math.floor(COLS/16));
      if(nautImpactR < Math.floor(COLS*0.6)){ timer=setTimeout(loop,55); }
      else { nautPhase='crashed'; nautT=0; loop(); }
    }else if(nautPhase==='crashed'){
      // the wreck settles, half-buried and smoking in the crater
      const {grid,mg}=nautRender(nautT,'crashed',endX,endY);
      scene.innerHTML=paint(grid,mg,'city');
      if(nautT<8) stage.classList.add('shake'); else stage.classList.remove('shake');
      sub.textContent="THE MIND FLAYER SHIP LIES SMOKING IN THE CRATER"; sub.style.color="#c090ff"; sub.style.textShadow="0 0 8px #2a8a7a";
      nautT++;
      if(nautT<40){ timer=setTimeout(loop,90); }
      else { phase='nautiloid_hold'; loop(); }
    }
  }else if(phase==='nautiloid_hold'){
    stage.classList.remove('shake');
    const gzX=cx+Math.floor(COLS*0.12);
    const endX=gzX-Math.floor(nautSprite[0].length/2), endY=streetRow-nautSprite.length+2;
    const {grid,mg}=nautRender(nautT,'crashed',endX,endY);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the wreck smoulders in the crater. roll for initiative. — press RESET"; sub.style.color="#c090ff"; sub.className="";
    nautT++;
    timer=setTimeout(loop,150);
  }else if(phase==='emp'){
    scene.style.textShadow="0 0 12px #a0f0ff";
    if(!empStarted){ empStarted=true; empT=0; empPhase='charge'; empR=0; document.body.style.background="#04080e"; }
    if(empPhase==='charge'){
      // a device crackles and charges — arcs gathering at the centre
      stepRain();
      const grid=(cityGridArr.length===ROWS?cityGridArr:buildCity()).slice();
      const mg=modeGridFill(ROWS,COLS,'city');
      for(let k=0;k<COLS*0.15;k++){ const c=cx+(((Math.random()*16)|0)-8), r=streetRow-((Math.random()*Math.floor(streetRow*0.4))|0); if(c>=0&&c<COLS){ setCh(grid,r,c,["z","*","x","~"][(Math.random()*4)|0]); setMode(mg,r,c,'emp'); } }
      drawRain(grid,mg);
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="EMP CHARGING… "+("|".repeat((empT%4)+1)); sub.style.color="#d0faff"; sub.style.textShadow="0 0 8px #2080c0";
      empT++;
      if(empT<16){ timer=setTimeout(loop,80); }
      else { empPhase='flash'; loop(); }
    }else if(empPhase==='flash'){
      flash.style.transition="opacity 0.02s"; flash.style.opacity=1;
      document.body.style.background="#e8feff"; scene.innerHTML=""; sub.textContent="* PULSE *";
      stage.classList.add('shake');
      timer=setTimeout(()=>{ flash.style.transition="opacity 1.2s"; flash.style.opacity=0; document.body.style.background="#02060a"; empPhase='pulse'; empR=2; loop(); }, 160);
    }else if(empPhase==='pulse'){
      // the pulse ring sweeps outward; lights die behind it
      const {grid,mg}=empRender(empT, empR, 'pulse');
      scene.innerHTML=paint(grid,mg,'city');
      if(empR<COLS*0.3) stage.classList.add('shake'); else stage.classList.remove('shake');
      sub.textContent="ELECTROMAGNETIC PULSE — THE GRID GOES DOWN"; sub.style.color="#d0faff"; sub.style.textShadow="0 0 8px #2080c0";
      empR+=Math.max(3,Math.floor(COLS/16));
      if(empR<cx+4){ timer=setTimeout(loop,55); }
      else { empPhase='dead'; empT=0; loop(); }
    }else if(empPhase==='dead'){
      // silent, dark, powerless city
      const {grid,mg}=empRender(empT, COLS, 'dead');
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.remove('shake');
      sub.textContent="EVERYTHING IS DARK AND SILENT"; sub.style.color="#6a90a0"; sub.style.textShadow="0 0 6px #204050";
      empT++;
      if(empT<24){ timer=setTimeout(loop,110); }
      else { phase='emp_hold'; loop(); }
    }
  }else if(phase==='emp_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=empRender(empT, COLS, 'dead');
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#02060a";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="no power, no lights, nothing works. — press RESET"; sub.style.color="#6a90a0"; sub.className="";
    empT++;
    timer=setTimeout(loop,160);
  }else if(phase==='war'){
    scene.style.textShadow="0 0 8px #8a8a4a";
    if(!warStarted){ warStarted=true; warT=0; warInit(); document.body.style.background="#0a0a06"; }
    stepRain();
    warStep(warT);
    const {grid,mg}=warRender(warT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    if(warBlasts.length>2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= warDmg<COLS*0.5 ? "WAR — TANKS AND JETS MOVE IN" : "THE CITY IS A WARZONE";
    sub.style.color="#b0b060"; sub.style.textShadow="0 0 8px #4a4a20";
    warT++;
    if(!(warDmg>=COLS && warT>55)){ timer=setTimeout(loop,70); }
    else { phase='war_hold'; loop(); }
  }else if(phase==='war_hold'){
    stage.classList.remove('shake');
    warStep(warT);
    const {grid,mg}=warRender(warT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="reduced to a smoking battlefield. — press RESET"; sub.style.color="#b0b060"; sub.className="";
    warT++;
    timer=setTimeout(loop,140);
  }else if(phase==='jumanji'){
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
  }else if(phase==='ghost'){
    scene.style.textShadow="0 0 8px #a0e0d0";
    if(!ghostStarted){ ghostStarted=true; ghostT=0; ghostPhase='haunt'; ghostInit(); document.body.style.background="#060a0c"; }
    stepRain();
    ghostStep(ghostT);
    if(ghostPhase==='haunt'){
      const {grid,mg}=ghostRender(ghostT,'haunt');
      scene.innerHTML=paint(grid,mg,'city');
      sub.textContent="THE CITY IS OVERRUN WITH GHOSTS"; sub.style.color="#c0f0ff"; sub.style.textShadow="0 0 8px #40a080";
      ghostT++;
      if(ghostT<24){ timer=setTimeout(loop,80); }
      else { ghostPhase='puft'; loop(); }
    }else if(ghostPhase==='puft'){
      // the Stay Puft Marshmallow Man arrives and stomps through town
      puftDmg=Math.min(1, puftDmg+0.02);
      const {grid,mg}=ghostRender(ghostT,'puft');
      scene.innerHTML=paint(grid,mg,'city');
      stage.classList.add('shake');
      sub.textContent= puftDmg<0.6 ? "STAY PUFT STOMPS THROUGH DOWNTOWN" : "NOBODY STEPS ON A CHURCH IN MY TOWN!";
      sub.style.color="#fafaf0"; sub.style.textShadow="0 0 8px #e02020";
      ghostT++;
      if(!(puftDmg>=1 && ghostT>70)){ timer=setTimeout(loop,80); }
      else { phase='ghost_hold'; loop(); }
    }
  }else if(phase==='ghost_hold'){
    stage.classList.remove('shake');
    ghostStep(ghostT);
    const {grid,mg}=ghostRender(ghostT,'puft');
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="toasted, and covered in marshmallow. — press RESET"; sub.style.color="#fafaf0"; sub.className="";
    ghostT++;
    timer=setTimeout(loop,140);
  }else if(phase==='frozen'){
    scene.style.textShadow="0 0 10px #8ad8f0";
    if(!fznStarted){ fznStarted=true; fznT=0; frozenInit(); document.body.style.background="#081420"; }
    frozenStep(fznT);
    const {grid,mg}=frozenRender(fznT);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background = fznLevel<0.5 ? "#0c1c2c" : (fznLevel<0.9?"#16324a":"#2a5578");
    sub.textContent = fznLevel<0.4 ? "LET IT GO — THE FROST SPREADS" : (castleH<streetRow*0.5 ? "AN ICE CASTLE RISES OVER THE CITY" : "AN ETERNAL WINTER GRIPS THE WORLD");
    sub.style.color="#c0f0ff"; sub.style.textShadow="0 0 8px #4a90c0";
    fznT++;
    if(!(fznLevel>=1 && fznT>60)){ timer=setTimeout(loop,80); }
    else { phase='frozen_hold'; loop(); }
  }else if(phase==='frozen_hold'){
    stage.classList.remove('shake');
    frozenStep(fznT);
    const {grid,mg}=frozenRender(fznT);
    scene.innerHTML=paint(grid,mg,'city');
    document.body.style.background="#2a5578";
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="frozen in eternal winter. and Olaf likes warm hugs. — press RESET"; sub.style.color="#c0f0ff"; sub.className="";
    fznT++;
    timer=setTimeout(loop,140);
  }else if(phase==='landslide'){
    scene.style.textShadow="0 0 8px #9a6a3a";
    if(!lsStarted){ lsStarted=true; lsT=0; landslideInit(); document.body.style.background="#0c0805"; }
    stepRain();
    landslideStep(lsT);
    const {grid,mg}=landslideRender(lsT);
    drawRain(grid,mg);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent= lsFront<cx ? "A LANDSLIDE ROARS DOWN FROM THE HILLS" : "THE CITY IS BURIED UNDER EARTH AND ROCK";
    sub.style.color="#c08a50"; sub.style.textShadow="0 0 8px #4a2a10";
    lsT++;
    if(!(lsFront>=COLS && lsT>40)){ timer=setTimeout(loop,70); }
    else { phase='landslide_hold'; loop(); }
  }else if(phase==='landslide_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=landslideRender(lsT);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="buried under a mountain of rubble. — press RESET"; sub.style.color="#c08a50"; sub.className="";
    lsT++;
    timer=setTimeout(loop,150);
  }else if(phase==='avp'){
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
  }else if(phase==='mortal'){
    scene.style.textShadow="0 0 8px #d0a020";
    if(!mortalStarted){ mortalStarted=true; mortalT=0; tcX=0; mortalSmoke=[]; document.body.style.background="#0a0805"; }
    const {grid,mg}=craneRender(mortalT);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.add('shake');
    sub.textContent="CRANES TEAR THE CITY DOWN, GIRDER BY GIRDER";
    sub.style.color="#d0a020"; sub.style.textShadow="0 0 8px #8a6a20";
    mortalT++;
    if(mortalT<40){ timer=setTimeout(loop,80); }
    else { phase='mortal_build'; mortalT=0; tcX=4+tractionCitySprite[0].length; loop(); }
  }else if(phase==='mortal_build'){
    stage.classList.remove('shake');
    const {grid,mg}=tractionRender(tcX);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="THE RUBBLE RISES AS A TRACTION CITY";
    sub.style.color="#d0a020"; sub.style.textShadow="0 0 8px #8a6a20";
    mortalT++;
    if(mortalT<16){ timer=setTimeout(loop,80); }
    else { phase='mortal_drive'; mortalT=0; loop(); }
  }else if(phase==='mortal_drive'){
    stage.classList.add('shake');
    const sw=tractionCitySprite[0].length;
    tcX=Math.min(COLS+sw, tcX+Math.max(1,Math.floor(COLS/45)));
    const {grid,mg}=tractionRender(tcX);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="MUNICIPAL DARWINISM — IT DRIVES OFF, DEVOURING THE HORIZON";
    sub.style.color="#d0a020"; sub.style.textShadow="0 0 8px #8a6a20";
    mortalT++;
    if(tcX<COLS+sw){ timer=setTimeout(loop,70); }
    else { phase='mortal_hold'; loop(); }
  }else if(phase==='mortal_hold'){
    stage.classList.remove('shake');
    titanicDemolish(COLS);                    // scrub whatever's left of the skyline
    const grid=cityGridArr.slice();
    const mg=modeGridFill(ROWS,COLS,'city');
    // drifting exhaust haze settling over the empty wasteland
    if(mortalT%4===0){ mortalSmoke.push({x:Math.random()*COLS, y:streetRow-2, vx:(Math.random()-0.5)*0.3, vy:-(0.1+Math.random()*0.2), life:30}); }
    for(const s of mortalSmoke){ s.x+=s.vx; s.y+=s.vy; s.life--; const r=Math.round(s.y), c=Math.round(s.x); if(r>=0&&r<ROWS&&c>=0&&c<COLS && s.life>0){ setCh(grid,r,c,"."); setMode(mg,r,c,'steam'); } }
    mortalSmoke=mortalSmoke.filter(s=>s.life>0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the city itself became the predator. — press RESET"; sub.style.color="#d0a020"; sub.className="";
    mortalT++;
    timer=setTimeout(loop,150);
  }else if(phase==='simpsons'){
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
  }else if(phase==='emu'){
    scene.style.textShadow="0 0 8px #c89050";
    if(!emuStarted){ emuStarted=true; emuT=0; emuInit(); document.body.style.background="#100c04"; }
    emuStep(emuT);
    const {grid,mg}=emuRender();
    scene.innerHTML=paint(grid,mg,'city');
    if(emus.length>2) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= emuT<50 ? "THE ARMY OPENS FIRE — THE EMUS DO NOT CARE" : "THE TROOPS RETREAT — THE EMUS HAVE WON";
    sub.style.color="#c89050"; sub.style.textShadow="0 0 8px #6a4020";
    emuT++;
    if(emuT<85){ timer=setTimeout(loop,70); }
    else { phase='emu_hold'; loop(); }
  }else if(phase==='emu_hold'){
    stage.classList.remove('shake');
    emuStep(emuT);
    const {grid,mg}=emuRender();
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Emus: 1, City: 0. — press RESET"; sub.style.color="#c89050"; sub.className="";
    emuT++;
    timer=setTimeout(loop,140);
  }else if(phase==='neil'){
    scene.style.textShadow="0 0 8px #c8ccd0";
    if(!neilStarted){ neilStarted=true; neilT=0; neilX=-6; document.body.style.background="#0a0c10"; }
    const coneLeft=COLS-8, stopX=coneLeft-neilSprite[0].length-1;
    const arrived=neilX>=stopX;
    const noseCol=Math.round(neilX)+neilSprite[0].length;
    let bashing=false;
    if(!arrived){
      if(neilBlocked(noseCol)){
        bashing=true;
        if(neilT%3===0) neilBash(noseCol);       // keep headbutting until it gives way
      } else {
        neilX+=Math.max(1,Math.floor(COLS/60));  // nothing in the way — waddle onward
      }
    }
    const {grid,mg}=neilRender(neilX, arrived, bashing);
    scene.innerHTML=paint(grid,mg,'city');
    if(bashing) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= arrived ? "…AND THEN HE FOUND A CONE."
                    : (bashing ? "NEIL HEADBUTTS THE BUILDING — IT DOESN'T STAND A CHANCE" : "NEIL WADDLES ON, LOOKING FOR SOMETHING TO BASH");
    sub.style.color="#c8ccd0"; sub.style.textShadow="0 0 8px #4a4e54";
    neilT++;
    if(!(arrived && neilT>30)){ timer=setTimeout(loop,80); }
    else { phase='neil_hold'; loop(); }
  }else if(phase==='neil_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=neilRender(neilX, true);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="Neil is having a lovely time. — press RESET"; sub.style.color="#c8ccd0"; sub.className="";
    neilT++;
    timer=setTimeout(loop,150);
  }else if(phase==='koolaid'){
    scene.style.textShadow="0 0 8px #ff2a40";
    if(!koolStarted){ koolStarted=true; koolT=0; koolX=-10; document.body.style.background="#0c0405"; }
    const stopAt=cx;                                        // he only bursts through half the city
    koolX=Math.min(stopAt, koolX+Math.max(1,Math.floor(COLS/45)));
    const arrived=koolX>=stopAt;
    const ohYeah=(koolT%10)<4;
    const {grid,mg}=koolaidRender(koolX, ohYeah);
    scene.innerHTML=paint(grid,mg,'city');
    if(!arrived) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= arrived ? "OH YEAH!" : "THE KOOL-AID MAN BURSTS THROUGH EVERYTHING";
    sub.style.color="#ff2a40"; sub.style.textShadow="0 0 8px #a00010";
    koolT++;
    if(!arrived){ timer=setTimeout(loop,70); }
    else { koolaidShatterInit(koolX); phase='koolaid_shatter'; koolT=0; loop(); }
  }else if(phase==='koolaid_shatter'){
    stage.classList.add('shake');
    koolaidShatterStep();
    const {grid,mg}=koolaidShatterRender();
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="…AND THEN HE JUST KIND OF FELL APART.";
    sub.style.color="#ff2a40"; sub.style.textShadow="0 0 8px #a00010";
    koolT++;
    if(koolT<24){ timer=setTimeout(loop,60); }
    else { phase='koolaid_hold'; loop(); }
  }else if(phase==='koolaid_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=koolaidShatterRender();
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="just a puddle of punch and broken glass now. — press RESET"; sub.style.color="#ff2a40"; sub.className="";
    koolT++;
    timer=setTimeout(loop,150);
  }else if(phase==='goo'){
    scene.style.textShadow="0 0 8px #b8c4cc";
    if(!gooStarted){ gooStarted=true; gooT=0; gooR=0; document.body.style.background="#0a0b0c"; }
    const maxR=Math.sqrt(Math.pow(Math.max(cx,COLS-cx),2)+Math.pow(streetRow*2,2))+4;
    gooR=Math.min(maxR, gooR+Math.max(1,COLS/70));
    const covered=gooR>=maxR;
    const {grid,mg}=gooRender(gooR);
    scene.innerHTML=paint(grid,mg,'city');
    if(!covered) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent= covered ? "ECOPHAGY COMPLETE." : "SELF-REPLICATING NANITES CONSUME EVERYTHING";
    sub.style.color="#b8c4cc"; sub.style.textShadow="0 0 8px #5a6068";
    gooT++;
    if(!(covered && gooT>30)){ timer=setTimeout(loop,70); }
    else { phase='goo_hold'; loop(); }
  }else if(phase==='goo_hold'){
    stage.classList.remove('shake');
    const {grid,mg}=gooRender(999999);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="all biomass. all matter. gray goo. — press RESET"; sub.style.color="#b8c4cc"; sub.className="";
    gooT++;
    timer=setTimeout(loop,150);
  }else if(phase==='mineturtle'){
    scene.style.textShadow="0 0 8px #4a6ab0";
    if(!mtStartedFlag){
      mtStartedFlag=true; mtT=0; mtCol=cx; mtFallers=[]; mtBodies=[]; mtBlastR=0;
      document.body.style.background="#0a0c10";
      // everybody jumps together — one of them is fated to land right on the turtle
      const n=Math.max(6,Math.floor(COLS/14));
      const doomedIdx=(Math.random()*n)|0;
      for(let i=0;i<n;i++){ mtSpawnFaller(mtCol, i===doomedIdx); }
    }
    const doomedLanded=mtStep(false);
    const {grid,mg}=mtRender(mtT, mtCol, true, 0);
    scene.innerHTML=paint(grid,mg,'city');
    stage.classList.remove('shake');
    sub.textContent="EVERYBODY DO THE FLOP";
    sub.style.color="#4a6ab0"; sub.style.textShadow="0 0 8px #203050";
    mtT++;
    if(!doomedLanded){ timer=setTimeout(loop,70); }
    else { mtTriggerBlast(mtCol); phase='mineturtle_blast'; mtT=0; mtBlastR=0; loop(); }
  }else if(phase==='mineturtle_blast'){
    stage.classList.add('shake');
    mtStep(false);
    mtBlastR=Math.min(14, mtBlastR+1.2);
    const {grid,mg}=mtRender(mtT, mtCol, false, mtBlastR);
    scene.innerHTML=paint(grid,mg,'city');
    sub.textContent="MINE TURTLE!";
    sub.style.color="#ff6a2a"; sub.style.textShadow="0 0 10px #ff2a00";
    mtT++;
    if(mtBlastR<14){ timer=setTimeout(loop,60); }
    else { phase='mineturtle_hold'; loop(); }
  }else if(phase==='mineturtle_hold'){
    stage.classList.remove('shake');
    mtStep(false);
    const {grid,mg}=mtRender(mtT, mtCol, false, 0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="mine turtle. — press RESET"; sub.style.color="#4a6ab0"; sub.className="";
    mtT++;
    timer=setTimeout(loop,150);
  }else if(phase==='triffid'){
    scene.style.textShadow="0 0 8px #3a8a3a";
    if(!triffStarted){ triffStarted=true; triffT=0; triffidInit(); document.body.style.background="#04100a"; }
    triffidStep();
    const cometFlash = triffT<20 ? (20-triffT) : 0;
    const {grid,mg}=triffidRender(triffT, cometFlash);
    scene.innerHTML=paint(grid,mg,'city');
    if(triffStalks.some(s=>s.lash>0)) stage.classList.add('shake'); else stage.classList.remove('shake');
    sub.textContent = cometFlash>0 ? "A STRANGE GREEN COMET LIGHTS THE SKY…" : "THE TRIFFIDS ARE LOOSE, AND EVERYONE IS BLIND";
    sub.style.color="#7ad07a"; sub.style.textShadow="0 0 8px #2a5a2a";
    triffT++;
    if(triffT<90){ timer=setTimeout(loop,80); }
    else { phase='triffid_hold'; loop(); }
  }else if(phase==='triffid_hold'){
    stage.classList.remove('shake');
    triffidStep();
    const {grid,mg}=triffidRender(triffT, 0);
    scene.innerHTML=paint(grid,mg,'city');
    cmd.textContent="$ _"; cmd.style.color="#0f0"; cmd.style.textShadow="0 0 14px #0f0";
    sub.textContent="the triffids have inherited the earth. — press RESET"; sub.style.color="#7ad07a"; sub.className="";
    triffT++;
    timer=setTimeout(loop,150);
  }
}

function armDrop(){
  if(phase!=='intro')return;
  clearInterval(cycleTimer);
  clearTimeout(timer);            // cancel the pending intro frame; we restart the chain cleanly
  methodBox.style.display="none";
  if(cmdColor===1){              // BLUE -> tidal wave
    attackMode='tsunami';
    cmd.style.color="#22aaff"; cmd.style.textShadow="0 0 20px #22aaff";
    waveStarted=false; waveX=-1; phase='tsunami';
  }else if(cmdColor===2){       // WHITE -> asteroid
    attackMode='asteroid';
    cmd.style.color="#ffffff"; cmd.style.textShadow="0 0 24px #ffffff";
    astStarted=false; phase='asteroid';
  }else if(cmdColor===3){       // BROWN -> Godzilla
    attackMode='godzilla';
    cmd.style.color="#8a5a2b"; cmd.style.textShadow="0 0 20px #b5732f";
    gzStarted=false; phase='godzilla';
  }else if(cmdColor===4){       // ORANGE -> napalm
    attackMode='napalm';
    cmd.style.color="#ff8c1a"; cmd.style.textShadow="0 0 22px #ff6a00";
    npStarted=false; phase='napalm';
  }else if(cmdColor===5){       // FLAME -> the Sun / heat death
    attackMode='sun';
    cmd.classList.add('flametext');
    sunStarted=false; phase='sun';
  }else if(cmdColor===6){       // NEON GREEN -> alien invasion
    attackMode='alien';
    cmd.style.color="#39ff14"; cmd.style.textShadow="0 0 22px #39ff14";
    ufoStarted=false; phase='alien';
  }else if(cmdColor===7){       // ZOMBIE GREEN -> the horde
    attackMode='zombie';
    cmd.style.color="#7a8c2a"; cmd.style.textShadow="0 0 20px #4a5a14";
    zStarted=false; phase='zombie';
  }else if(cmdColor===8){       // AMBER -> locust swarm
    attackMode='locust';
    cmd.style.color="#c99a3a"; cmd.style.textShadow="0 0 20px #8a6a1a";
    locStarted=false; phase='locust';
  }else if(cmdColor===9){       // GREY -> tornado
    attackMode='tornado';
    cmd.style.color="#b8c0cc"; cmd.style.textShadow="0 0 20px #7a8694";
    tornStarted=false; phase='tornado';
  }else if(cmdColor===10){      // BROWN -> earthquake
    attackMode='quake';
    cmd.style.color="#a9743a"; cmd.style.textShadow="0 0 20px #6a3a10";
    qStarted=false; phase='quake';
  }else if(cmdColor===11){      // RED-ORANGE -> volcano
    attackMode='volcano';
    cmd.style.color="#ff5a1a"; cmd.style.textShadow="0 0 22px #ff2a00";
    volStarted=false; phase='volcano';
  }else if(cmdColor===12){      // ORANGE -> riots
    attackMode='riot';
    cmd.style.color="#ff9a3a"; cmd.style.textShadow="0 0 20px #b04010";
    riotStarted=false; phase='riot';
  }else if(cmdColor===13){      // WHITE-GREY -> air crash
    attackMode='crash';
    cmd.style.color="#e0e6ee"; cmd.style.textShadow="0 0 20px #99a";
    crashStarted=false; phase='crash';
  }else if(cmdColor===14){      // TOXIC GREEN -> toxic waste
    attackMode='toxic';
    cmd.style.color="#7fff4a"; cmd.style.textShadow="0 0 20px #2a8a10";
    toxStarted=false; phase='toxic';
  }else if(cmdColor===15){      // BLUE -> ISS crash
    attackMode='iss';
    cmd.style.color="#8ad0ff"; cmd.style.textShadow="0 0 20px #2a6a9a";
    issStarted=false; phase='iss';
  }else if(cmdColor===16){      // TEAL -> sharknado
    attackMode='sharknado';
    cmd.style.color="#3ad0c0"; cmd.style.textShadow="0 0 20px #1a7a6a";
    sharkStarted=false; phase='sharknado';
  }else if(cmdColor===17){      // FIERY RED -> Sauron
    attackMode='sauron';
    cmd.style.color="#ff3a1a"; cmd.style.textShadow="0 0 22px #b01000";
    saurStarted=false; phase='sauron';
  }else if(cmdColor===18){      // ICE BLUE -> worldwide freeze
    attackMode='freeze';
    cmd.style.color="#bfe6ff"; cmd.style.textShadow="0 0 22px #6ab0e0";
    frzStarted=false; phase='freeze';
  }else if(cmdColor===19){      // PURPLE -> Thanos snap
    attackMode='thanos';
    cmd.style.color="#b060e0"; cmd.style.textShadow="0 0 22px #6a20a0";
    thanosStarted=false; phase='thanos';
  }else if(cmdColor===20){      // INDIGO -> Inception
    attackMode='inception';
    cmd.style.color="#8a7ad0"; cmd.style.textShadow="0 0 22px #4a3a8a";
    incStarted=false; phase='inception';
  }else if(cmdColor===21){      // GOLD -> dragons
    attackMode='dragons';
    cmd.style.color="#ff9020"; cmd.style.textShadow="0 0 22px #c04000";
    dragStarted=false; phase='dragons';
  }else if(cmdColor===22){      // MATRIX GREEN -> AI takeover
    attackMode='ai';
    cmd.style.color="#00ff66"; cmd.style.textShadow="0 0 22px #00aa44";
    aiStarted=false; phase='ai';
  }else if(cmdColor===23){      // FLUX BLUE -> Back to the Future
    attackMode='bttf';
    cmd.style.color="#40d0ff"; cmd.style.textShadow="0 0 22px #a040ff";
    bttfStarted=false; phase='bttf';
  }else if(cmdColor===24){      // KRYPTON BLUE -> Man of Steel
    attackMode='steel';
    cmd.style.color="#4a6aff"; cmd.style.textShadow="0 0 22px #c02020";
    steelStarted=false; phase='steel';
  }else if(cmdColor===25){      // JUNGLE GREEN -> Jurassic Park San Diego
    attackMode='dino';
    cmd.style.color="#8ac030"; cmd.style.textShadow="0 0 22px #3a6a10";
    dinoStarted=false; phase='dino';
  }else if(cmdColor===26){      // INFERNAL RED -> Satan / Hell rises
    attackMode='satan';
    cmd.style.color="#c81810"; cmd.style.textShadow="0 0 24px #ff2000";
    satanStarted=false; phase='satan';
  }else if(cmdColor===27){      // OCEAN BLUE -> Titanic
    attackMode='titanic';
    cmd.style.color="#5aa0d0"; cmd.style.textShadow="0 0 22px #103a5a";
    titanicStarted=false; phase='titanic';
  }else if(cmdColor===28){      // ILLITHID PURPLE -> Baldur's Gate nautiloid
    attackMode='nautiloid';
    cmd.style.color="#9a5ad0"; cmd.style.textShadow="0 0 22px #2a8a7a";
    nautStarted=false; phase='nautiloid';
  }else if(cmdColor===29){      // ELECTRIC CYAN -> EMP
    attackMode='emp';
    cmd.style.color="#a0f0ff"; cmd.style.textShadow="0 0 22px #2080c0";
    empStarted=false; phase='emp';
  }else if(cmdColor===30){      // OLIVE DRAB -> War
    attackMode='war';
    cmd.style.color="#8a8a4a"; cmd.style.textShadow="0 0 20px #4a4a20";
    warStarted=false; phase='war';
  }else if(cmdColor===31){      // JUNGLE -> Jumanji
    attackMode='jumanji';
    cmd.style.color="#4aa02a"; cmd.style.textShadow="0 0 20px #6a4a10";
    jumStarted=false; phase='jumanji';
  }else if(cmdColor===32){      // MARSHMALLOW WHITE -> Ghostbusters
    attackMode='ghost';
    cmd.style.color="#f0f0e0"; cmd.style.textShadow="0 0 20px #e02020";
    ghostStarted=false; phase='ghost';
  }else if(cmdColor===33){      // FROST BLUE -> Frozen
    attackMode='frozen';
    cmd.style.color="#8ad8f0"; cmd.style.textShadow="0 0 20px #4a90c0";
    fznStarted=false; phase='frozen';
  }else if(cmdColor===34){      // EARTH BROWN -> Landslide
    attackMode='landslide';
    cmd.style.color="#9a6a3a"; cmd.style.textShadow="0 0 20px #4a2a10";
    lsStarted=false; phase='landslide';
  }else if(cmdColor===35){      // ACID GREEN -> Alien vs Predator
    attackMode='avp';
    cmd.style.color="#5ad020"; cmd.style.textShadow="0 0 20px #a02020";
    avpStarted=false; phase='avp';
  }else if(cmdColor===36){      // CONSTRUCTION YELLOW -> Mortal Engines
    attackMode='mortal';
    cmd.style.color="#e0b030"; cmd.style.textShadow="0 0 20px #8a6a20";
    mortalStarted=false; phase='mortal';
  }else if(cmdColor===37){      // SPRINGFIELD YELLOW -> Simpsons
    attackMode='simpsons';
    cmd.style.color="#ffd90f"; cmd.style.textShadow="0 0 20px #c89a00";
    simpStarted=false; phase='simpsons';
  }else if(cmdColor===38){      // OUTBACK BROWN -> Emu War
    attackMode='emu';
    cmd.style.color="#c89050"; cmd.style.textShadow="0 0 20px #6a4020";
    emuStarted=false; phase='emu';
  }else if(cmdColor===39){      // SEAL GREY -> Neil the Seal
    attackMode='neil';
    cmd.style.color="#c8ccd0"; cmd.style.textShadow="0 0 20px #4a4e54";
    neilStarted=false; phase='neil';
  }else if(cmdColor===40){      // PUNCH RED -> Kool-Aid
    attackMode='koolaid';
    cmd.style.color="#ff2a40"; cmd.style.textShadow="0 0 20px #a00010";
    koolStarted=false; phase='koolaid';
  }else if(cmdColor===41){      // NANITE GREY -> Gray Goo
    attackMode='goo';
    cmd.style.color="#b8c4cc"; cmd.style.textShadow="0 0 20px #5a6068";
    gooStarted=false; phase='goo';
  }else if(cmdColor===42){      // FLOP BLUE -> Mine Turtle
    attackMode='mineturtle';
    cmd.style.color="#6a8ad0"; cmd.style.textShadow="0 0 20px #203050";
    mtStartedFlag=false; phase='mineturtle';
  }else if(cmdColor===43){      // TRIFFID GREEN -> Day of the Triffids
    attackMode='triffid';
    cmd.style.color="#7ad07a"; cmd.style.textShadow="0 0 20px #2a5a2a";
    triffStarted=false; phase='triffid';
  }else{                        // RED -> nuke
    attackMode='nuke';
    cmd.style.color="#f00"; cmd.style.textShadow="0 0 20px #f00";
    phase='fall';
  }
  loop();                        // single fresh chain for whichever attack
}
window.addEventListener('keydown',armDrop);
// clicking / tapping a method name selects that attack and fires it
methodBox.querySelectorAll('.pick').forEach(el=>{
  const fire=(e)=>{
    e.stopPropagation(); e.preventDefault();
    if(phase!=='intro')return;
    cmdColor=parseInt(el.getAttribute('data-method'),10);
    paintCmd2();
    armDrop();
  };
  el.addEventListener('click', fire);
});
// tapping / clicking anywhere else fires whatever colour is currently showing
function stageTap(e){
  if(e.target && e.target.closest && e.target.closest('#topBar'))return;     // reset button / version badge
  if(e.target && e.target.closest && e.target.closest('#methodBox'))return;   // handled above
  armDrop();
}
document.body.addEventListener('click', stageTap);
// prevent double-tap-zoom / scroll on the scene, keep taps responsive
scene.addEventListener('touchend', (e)=>{ e.preventDefault(); stageTap(e); }, {passive:false});
const rb=document.getElementById('resetBtn');
rb.addEventListener('click', reset);
reset();
</script>
</body>
</html>
