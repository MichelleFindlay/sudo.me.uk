<?php
// ---- version & update check ----
$VERSION = '1.5.0';
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

function getLatestVersion($repo, $cacheFile, $ttl, $currentVersion) {
    $cached = null;
    if (is_readable($cacheFile)) {
        $cached = json_decode((string)@file_get_contents($cacheFile), true);
        // a cache entry recorded under a different $VERSION predates this deploy — its
        // "latest release" snapshot may be from before this version was even released,
        // so don't trust it just because it's within the TTL
        $sameDeploy = is_array($cached) && isset($cached['checked_version']) && $cached['checked_version'] === $currentVersion;
        if ($sameDeploy && isset($cached['fetched_at'], $cached['version']) && (time() - $cached['fetched_at']) < $ttl) {
            return $cached['version'];
        }
    }
    $latest = fetchLatestGithubVersion($repo);
    if ($latest !== null) {
        @file_put_contents($cacheFile, json_encode(['version' => $latest, 'fetched_at' => time(), 'checked_version' => $currentVersion]));
        return $latest;
    }
    // GitHub unreachable — fall back to a stale cache rather than showing nothing
    return (is_array($cached) && isset($cached['version'])) ? $cached['version'] : null;
}

$latestVersion = getLatestVersion($GITHUB_REPO, $CACHE_FILE, $CACHE_TTL, $VERSION);
// red whenever we can't positively confirm this build matches a published release —
// either a newer one exists, or there's no release published at all yet
$updateAvailable = $latestVersion === null || version_compare($latestVersion, $VERSION, '>');
$updateTitle = $latestVersion === null
    ? 'No published release found on GitHub — unable to verify this is up to date.'
    : "A newer version (v{$latestVersion}) is available on GitHub — go update!";
// this build is ahead of the latest published release — label it DEV rather than a version number
$isDevBuild = $latestVersion !== null && version_compare($VERSION, $latestVersion, '>');
$displayVersion = $isDevBuild ? 'DEV' : $VERSION;

// ---- server-side destruction statistics (shared across every visitor) ----
// stored as a small JSON file under a dot-directory next to this script; a .htaccess
// alongside it denies direct HTTP access on Apache. Not a database — this is a one-file
// joke site, so a flock()-guarded JSON file is the right amount of infrastructure.
$STATS_DIR = __DIR__ . '/.data';
$STATS_FILE = $STATS_DIR . '/stats.json';
// salted hash of the visitor's IP, never the raw address, so we can count unique
// visitors without actually storing anyone's IP on disk.
const IP_HASH_SALT = 'sudo.me.uk-stats-v1';

function clientIpHash() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    return hash('sha256', $ip . IP_HASH_SALT);
}

function statsRead($path) {
    if (!is_readable($path)) return ['total' => 0, 'methods' => new stdClass(), 'uniqueVisitors' => 0];
    $raw = @file_get_contents($path);
    $data = json_decode((string)$raw, true);
    if (!is_array($data)) return ['total' => 0, 'methods' => new stdClass(), 'uniqueVisitors' => 0];
    $ips = (isset($data['ips']) && is_array($data['ips'])) ? $data['ips'] : [];
    return [
        'total'          => isset($data['total']) ? (int)$data['total'] : 0,
        'methods'        => (isset($data['methods']) && is_array($data['methods'])) ? $data['methods'] : new stdClass(),
        'uniqueVisitors' => count($ips),
    ];
}

// atomically increments the total + one method's count + the visitor's IP hash,
// guarded by a file lock so concurrent requests from different visitors can't
// clobber each other's writes
function statsRecord($dir, $path, $methodId, $ipHash) {
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $fp = @fopen($path, 'c+');
    if (!$fp) return ['total' => 0, 'methods' => new stdClass(), 'uniqueVisitors' => 0];
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $data = json_decode((string)$raw, true);
    if (!is_array($data)) $data = [];
    $total = isset($data['total']) ? (int)$data['total'] : 0;
    $methods = (isset($data['methods']) && is_array($data['methods'])) ? $data['methods'] : [];
    $ips = (isset($data['ips']) && is_array($data['ips'])) ? $data['ips'] : [];
    $total += 1;
    $methods[$methodId] = (isset($methods[$methodId]) ? (int)$methods[$methodId] : 0) + 1;
    $ips[$ipHash] = true;
    $out = ['total' => $total, 'methods' => $methods, 'ips' => $ips];
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($out));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return ['total' => $total, 'methods' => $methods, 'uniqueVisitors' => count($ips)];
}

function statsReset($dir, $path) {
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $out = ['total' => 0, 'methods' => new stdClass(), 'ips' => new stdClass()];
    @file_put_contents($path, json_encode($out), LOCK_EX);
    return ['total' => 0, 'methods' => new stdClass(), 'uniqueVisitors' => 0];
}

if (isset($_GET['stats'])) {
    header('Content-Type: application/json');
    header('Cache-Control: no-store');
    $action = $_GET['stats'];
    if ($action === 'get') {
        echo json_encode(statsRead($STATS_FILE));
        exit;
    }
    if ($action === 'record' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true);
        $methodId = isset($body['method']) ? preg_replace('/[^0-9]/', '', (string)$body['method']) : '';
        if ($methodId === '') {
            http_response_code(400);
            echo json_encode(['error' => 'invalid method']);
            exit;
        }
        echo json_encode(statsRecord($STATS_DIR, $STATS_FILE, $methodId, clientIpHash()));
        exit;
    }
    if ($action === 'reset' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo json_encode(statsReset($STATS_DIR, $STATS_FILE));
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'unknown stats action']);
    exit;
}
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
<title>sudo rm -rf /* <?= $isDevBuild ? 'DEV' : 'v'.htmlspecialchars($VERSION) ?></title>
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
  #methodBox .mbFilters { display:flex; flex-wrap:wrap; justify-content:center; gap:6px;
    margin-bottom:10px; }
  #methodBox .filterBtn { font-family:"Courier New", monospace; font-size:clamp(10px,1.8vw,13px);
    letter-spacing:0.5px; font-weight:bold; color:#8a97ac; background:rgba(255,255,255,0.04);
    border:1px solid #3a4658; border-radius:14px; padding:5px 12px; cursor:pointer;
    transition:transform .1s, background .15s, color .15s, border-color .15s; }
  #methodBox .filterBtn:hover { color:#dfe6f0; border-color:#5a6a86; transform:scale(1.05); }
  #methodBox .filterBtn.active { color:#0f0; border-color:#0f0; background:rgba(0,255,0,0.08);
    text-shadow:0 0 6px #0f0; }
  #methodBox .mbList { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:6px 10px;
    font-size:clamp(12px,2.2vw,18px); letter-spacing:0.5px; font-weight:bold; justify-items:stretch; }
  #methodBox .pick.mHidden { display:none; }
  #methodBox .pick { cursor:pointer; padding:7px 6px; border-radius:5px; transition:transform .1s;
    white-space:nowrap; text-align:center; overflow:hidden; text-overflow:ellipsis;
    border:1px solid rgba(255,255,255,0.06); text-decoration:none; }
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
  #methodBox .m-tikes { color:#ff4a30; text-shadow:0 0 8px #8a1010; }
  #methodBox .m-ion   { color:#7ad4ff; text-shadow:0 0 8px #2a5a8a; }
  #methodBox .m-ds    { color:#7affa0; text-shadow:0 0 8px #1a6a2a; }
  #methodBox .m-pride { background:linear-gradient(90deg,#e40303,#ff8c00,#ffed00,#008026,#004dff,#750787);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
    color:#ff9ad6; text-shadow:0 0 8px #a0308a; }
  #methodBox .m-joker { color:#7a2a9a; text-shadow:0 0 8px #3a1a4a; }
  #methodBox .m-squad { color:#e0c000; text-shadow:0 0 8px #4a1a6a; }
  #methodBox .m-squad2 { color:#4080ff; text-shadow:0 0 8px #1a2a6a; }
  #methodBox .m-monkeys { color:#8a6a3a; text-shadow:0 0 8px #4a2a10; }
  #methodBox .m-gta { color:#ffcc00; text-shadow:0 0 8px #ff3030; }
  #methodBox .m-sim { color:#7aca5a; text-shadow:0 0 8px #2a5a1a; }
  #methodBox .m-duke { color:#ff8000; text-shadow:0 0 8px #ff3000; }
  #methodBox .m-dolly { color:#ff8fc0; text-shadow:0 0 8px #a0308a; }
  #methodBox .m-curry { color:#e0203a; text-shadow:0 0 8px #ffd700; }
  #methodBox .m-wicked { background:linear-gradient(90deg,#1fae5a 50%,#ff6ec7 50%);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
    color:#1fae5a; text-shadow:0 0 8px #0a5a2a; }
  #methodBox .m-ltt { color:#ff7b00; text-shadow:0 0 8px #cc5c00; }
  #methodBox .m-tusk { color:#d0d4d8; text-shadow:0 0 8px #2a6a9a; }
  #methodBox .m-fart { color:#a0d040; text-shadow:0 0 8px #5a7a1a; }
  #methodBox .m-rubber { color:#3a3a3a; text-shadow:0 0 8px #8a2ab0; }
  #methodBox .m-tomato { color:#e0201a; text-shadow:0 0 8px #2a6a1a; }
  #methodBox .m-cocainebear { color:#a85a2a; text-shadow:0 0 8px #c81810; }
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
  /* wanted-system citywide alert: a pulsing red vignette at max heat, never intercepts clicks */
  #wantedAlert { position:absolute; inset:0; z-index:5; pointer-events:none; opacity:0; transition:opacity .3s;
    background:radial-gradient(ellipse at center, rgba(255,0,0,0) 55%, rgba(255,0,0,.35) 100%); }
  #wantedAlert.on { opacity:1; animation: wantedPulse 1s ease-in-out infinite; }
  @keyframes wantedPulse { 0%,100% { opacity:.55; } 50% { opacity:1; } }
  #topBar { position:absolute; top:max(10px, env(safe-area-inset-top)); right:max(10px, env(safe-area-inset-right)); z-index:10;
    display:flex; align-items:center; gap:8px; }
  #topBarLeft { position:absolute; top:max(10px, env(safe-area-inset-top)); left:max(10px, env(safe-area-inset-left)); z-index:10;
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
  #statsBtn { background:#111; color:#0f0; border:1px solid #0f0;
    min-height:40px; min-width:40px; padding:8px; display:flex; align-items:center; justify-content:center;
    box-shadow:0 0 10px rgba(0,255,0,.3); border-radius:5px; touch-action:manipulation; cursor:pointer; }
  #statsBtn svg { width:20px; height:20px; fill:currentColor; filter:drop-shadow(0 0 4px #0f0); }
  #statsBtn:hover { background:#0f0; color:#000; }
  #statsBtn:active { background:#0f0; color:#000; transform:scale(0.94); }
  /* share button: bottom-right corner, opens a small menu that pops upward */
  #shareBox { position:absolute; bottom:max(10px, env(safe-area-inset-bottom)); right:max(10px, env(safe-area-inset-right)); z-index:15;
    display:flex; flex-direction:column-reverse; align-items:flex-end; gap:8px; }
  #shareBtn { background:#111; color:#0f0; border:1px solid #0f0;
    min-height:44px; min-width:44px; padding:10px; display:flex; align-items:center; justify-content:center;
    box-shadow:0 0 10px rgba(0,255,0,.3); border-radius:50%; touch-action:manipulation; cursor:pointer; }
  #shareBtn svg { width:20px; height:20px; fill:currentColor; filter:drop-shadow(0 0 4px #0f0); }
  #shareBtn:hover { background:#0f0; color:#000; }
  #shareBtn:active { background:#0f0; color:#000; transform:scale(0.94); }
  #shareMenu { display:flex; flex-direction:column; gap:6px; background:rgba(10,14,22,0.92); border:1px solid #0f0;
    border-radius:8px; padding:8px; box-shadow:0 0 14px rgba(0,255,0,.25); }
  #shareMenu.hidden { display:none; }
  #shareMenu button { font-family:"Courier New", monospace; background:#111; color:#0f0; border:1px solid #0f0;
    border-radius:5px; padding:8px 12px; cursor:pointer; font-size:12px; white-space:nowrap; touch-action:manipulation; }
  #shareMenu button:hover { background:#0f0; color:#000; }
  #shareToast { position:absolute; bottom:56px; right:0; background:#0f0; color:#000; font-size:11px; font-weight:bold;
    padding:6px 10px; border-radius:5px; opacity:0; pointer-events:none; transition:opacity .25s; white-space:nowrap; }
  #shareToast.show { opacity:1; }
  /* wanted-system star HUD: only shown during the GTA method; glows yellow and flashes while pursued */
  #wantedBox { background:#111; color:#444; border:1px solid #333; font-family:"Courier New",monospace;
    font-size:16px; letter-spacing:3px; padding:9px 12px; min-height:40px; display:none; align-items:center;
    border-radius:5px; box-shadow:0 0 10px rgba(0,0,0,.3); opacity:0.85; transition:opacity .2s, color .2s, border-color .2s; }
  #wantedBox.wanted-active { color:#ffd400; border-color:#ffd400; text-shadow:0 0 8px #ffd400;
    box-shadow:0 0 14px rgba(255,212,0,.5); opacity:1; }
  #wantedBox.wanted-pursuit { animation: blink 0.5s steps(1) infinite; }
  #statsOverlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:50;
    display:none; align-items:center; justify-content:center; padding:20px; }
  #statsOverlay.open { display:flex; }
  #statsPanel { background:#0a0e14; border:1px solid #0f0; border-radius:8px; padding:18px 20px;
    max-width:760px; width:100%; max-height:80vh; overflow-y:auto; box-shadow:0 0 24px rgba(0,255,0,.25);
    font-family:"Courier New", monospace; color:#c7d2e0; }
  #statsPanel h2 { margin:0 0 4px; font-size:16px; color:#0f0; text-shadow:0 0 8px #0f0; letter-spacing:1px; }
  #statsPanel .statsTotal { font-size:13px; color:#9ad; margin-bottom:12px; }
  #statsList { column-count:2; column-gap:20px; }
  #statsList .statsRow { display:flex; justify-content:space-between; gap:10px; padding:4px 0;
    border-bottom:1px solid rgba(255,255,255,0.06); font-size:13px; break-inside:avoid; -webkit-column-break-inside:avoid; }
  #statsList .statsRow .cnt { color:#0f0; font-weight:bold; min-width:2.5em; text-align:right; }
  #statsPanel .statsFooter { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
  #statsPanel button { font-family:inherit; background:#111; color:#0f0; border:1px solid #0f0;
    border-radius:5px; padding:6px 12px; cursor:pointer; font-size:12px; touch-action:manipulation; }
  #statsPanel button:hover { background:#0f0; color:#000; }
  #resetBtn, #randomBtn {
    background:#111; color:#0f0; border:1px solid #0f0; font-family:"Courier New",monospace;
    font-size:14px; padding:10px 16px; min-height:40px; cursor:pointer; text-shadow:0 0 6px #0f0;
    box-shadow:0 0 10px rgba(0,255,0,.3); border-radius:5px; touch-action:manipulation; }
  #resetBtn:hover, #randomBtn:hover { background:#0f0; color:#000; }
  #resetBtn:active, #randomBtn:active { background:#0f0; color:#000; transform:scale(0.94); }
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
    #resetBtn, #randomBtn { font-size:12px; padding:8px 11px; min-height:36px; }
    #versionBox { font-size:12px; padding:8px 10px; min-height:36px; }
    #githubBtn { min-height:36px; min-width:36px; padding:6px; }
    #githubBtn svg { width:18px; height:18px; }
    #statsBtn { min-height:36px; min-width:36px; padding:6px; }
    #statsBtn svg { width:18px; height:18px; }
    #wantedBox { font-size:13px; letter-spacing:2px; padding:7px 9px; min-height:36px; }
    #topBar { gap:6px; }
    #topBarLeft { gap:6px; }
    #statsPanel { padding:14px 12px; max-height:86vh; }
    #statsPanel h2 { font-size:13px; }
    #statsPanel .statsTotal { font-size:12px; }
    #statsList { column-count:1; }
    #statsList .statsRow { font-size:12px; }
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
<div id="topBarLeft">
  <button id="statsBtn" aria-label="View destruction statistics" title="Statistics">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16v2H2V2h2v18zm3-2h2V9H7v9zm5 0h2V4h-2v14zm5 0h2v-6h-2v6z"/></svg>
  </button>
  <div id="wantedBox" title="Wanted level">&#9734;&#9734;&#9734;&#9734;&#9734;</div>
</div>
<div id="topBar">
  <a id="githubBtn" href="https://github.com/MichelleFindlay/sudo.me.uk" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
  </a>
  <div id="versionBox"<?php if ($updateAvailable): ?> class="update-needed" title="<?= htmlspecialchars($updateTitle) ?>"<?php endif; ?>><?= $isDevBuild ? 'DEV' : 'v'.htmlspecialchars($VERSION) ?></div>
  <button id="randomBtn" aria-label="Random destruction" title="Random destruction">&#127921; RANDOM</button>
  <button id="resetBtn">&#8635; RESET</button>
</div>
<div id="stage">
  <pre id="scene"></pre>
  <div id="methodBox">
    <div class="mbTitle">PICK YOUR METHOD</div>
    <div class="mbFilters">
      <button class="filterBtn" data-cat="all">All</button>
      <button class="filterBtn active" data-cat="popular">Popular</button>
      <button class="filterBtn" data-cat="classic">Classic Disasters</button>
      <button class="filterBtn" data-cat="scifi">Kaiju &amp; Sci-Fi</button>
      <button class="filterBtn" data-cat="movie">Movies &amp; Games</button>
      <button class="filterBtn" data-cat="fun">Whimsical</button>
    </div>
    <div class="mbList">
      <a href="?m=0" class="m-nuke pick" data-method="0" data-cat="classic">Nuclear Bomb</a>
      <a href="?m=1" class="m-wave pick" data-method="1" data-cat="classic">Tsunami</a>
      <a href="?m=2" class="m-ast pick" data-method="2" data-cat="classic">Asteroid</a>
      <a href="?m=3" class="m-gz pick" data-method="3" data-cat="scifi">Godzilla</a>
      <a href="?m=4" class="m-nap pick" data-method="4" data-cat="classic">Napalm</a>
      <a href="?m=5" class="m-sun pick" data-method="5" data-cat="scifi">The Sun</a>
      <a href="?m=6" class="m-alien pick" data-method="6" data-cat="scifi">Aliens</a>
      <a href="?m=7" class="m-zombie pick" data-method="7" data-cat="scifi">Zombies</a>
      <a href="?m=8" class="m-locust pick" data-method="8" data-cat="classic">Locusts</a>
      <a href="?m=9" class="m-torn pick" data-method="9" data-cat="classic">Tornado</a>
      <a href="?m=10" class="m-quake pick" data-method="10" data-cat="classic">Earthquake</a>
      <a href="?m=11" class="m-volc pick" data-method="11" data-cat="classic">Volcano</a>
      <a href="?m=12" class="m-riot pick" data-method="12" data-cat="classic">Riots</a>
      <a href="?m=13" class="m-crash pick" data-method="13" data-cat="classic">Air Crash</a>
      <a href="?m=14" class="m-toxic pick" data-method="14" data-cat="classic">Toxic Waste</a>
      <a href="?m=15" class="m-iss pick" data-method="15" data-cat="classic">ISS Crash</a>
      <a href="?m=16" class="m-shark pick" data-method="16" data-cat="scifi">Sharknado</a>
      <a href="?m=17" class="m-sauron pick" data-method="17" data-cat="movie">Sauron</a>
      <a href="?m=18" class="m-freeze pick" data-method="18" data-cat="movie">Snowpiercer</a>
      <a href="?m=19" class="m-thanos pick" data-method="19" data-cat="movie">Thanos</a>
      <a href="?m=20" class="m-inc pick" data-method="20" data-cat="movie">Inception</a>
      <a href="?m=21" class="m-drag pick" data-method="21" data-cat="movie">Dragons</a>
      <a href="?m=22" class="m-ai pick" data-method="22" data-cat="scifi">AI Takeover</a>
      <a href="?m=23" class="m-bttf pick" data-method="23" data-cat="movie">Back to Future</a>
      <a href="?m=24" class="m-steel pick" data-method="24" data-cat="movie">Man of Steel</a>
      <a href="?m=25" class="m-dino pick" data-method="25" data-cat="movie">Jurassic Park</a>
      <a href="?m=26" class="m-satan pick" data-method="26" data-cat="movie">Satan</a>
      <a href="?m=27" class="m-titanic pick" data-method="27" data-cat="movie">Titanic</a>
      <a href="?m=31" class="m-jum pick" data-method="31" data-cat="movie">Jumanji</a>
      <a href="?m=28" class="m-naut pick" data-method="28" data-cat="movie">Baldur's Gate</a>
      <a href="?m=29" class="m-emp pick" data-method="29" data-cat="scifi">EMP</a>
      <a href="?m=30" class="m-war pick" data-method="30" data-cat="scifi">War</a>
      <a href="?m=32" class="m-ghost pick" data-method="32" data-cat="movie">Ghostbusters</a>
      <a href="?m=33" class="m-frozen pick" data-method="33" data-cat="movie">Frozen</a>
      <a href="?m=34" class="m-land pick" data-method="34" data-cat="classic">Landslide</a>
      <a href="?m=35" class="m-avp pick" data-method="35" data-cat="movie">Alien vs Pred</a>
      <a href="?m=36" class="m-mortal pick" data-method="36" data-cat="movie">Mortal Engines</a>
      <a href="?m=37" class="m-simp pick" data-method="37" data-cat="movie">Simpsons</a>
      <a href="?m=38" class="m-emu pick" data-method="38" data-cat="fun">Emu War</a>
      <a href="?m=39" class="m-neil pick" data-method="39" data-cat="fun">Neil the Seal</a>
      <a href="?m=40" class="m-kool pick" data-method="40" data-cat="fun">Kool-Aid</a>
      <a href="?m=41" class="m-goo pick" data-method="41" data-cat="scifi">Gray Goo</a>
      <a href="?m=42" class="m-mine pick" data-method="42" data-cat="fun">Mine Turtle</a>
      <a href="?m=43" class="m-triff pick" data-method="43" data-cat="movie">Triffids</a>
      <a href="?m=44" class="m-tikes pick" data-method="44" data-cat="fun">Little Tikes</a>
      <a href="?m=45" class="m-ion pick" data-method="45" data-cat="scifi">Ion Cannon</a>
      <a href="?m=46" class="m-ds pick" data-method="46" data-cat="movie">Death Star</a>
      <a href="?m=47" class="m-pride pick" data-method="47" data-cat="fun">LGBT Agenda</a>
      <a href="?m=48" class="m-joker pick" data-method="48" data-cat="movie">The Joker</a>
      <a href="?m=49" class="m-squad pick" data-method="49" data-cat="movie">Suicide Squad</a>
      <a href="?m=51" class="m-squad2 pick" data-method="51" data-cat="movie">Suicide Squad 2</a>
      <a href="?m=50" class="m-monkeys pick" data-method="50" data-cat="movie">12 Monkeys</a>
      <a href="?m=52" class="m-gta pick" data-method="52" data-cat="movie">GTA</a>
      <a href="?m=53" class="m-sim pick" data-method="53" data-cat="movie">Sim City</a>
      <a href="?m=54" class="m-duke pick" data-method="54" data-cat="movie">Duke Nukem 3D</a>
      <a href="?m=55" class="m-dolly pick" data-method="55" data-cat="fun">Dolly</a>
      <a href="?m=56" class="m-curry pick" data-method="56" data-cat="movie">Tim Curry</a>
      <a href="?m=57" class="m-wicked pick" data-method="57" data-cat="movie">Wicked</a>
      <a href="?m=58" class="m-ltt pick" data-method="58" data-cat="movie">LTT</a>
      <a href="?m=59" class="m-tusk pick" data-method="59" data-cat="movie">Melon Tusk</a>
      <a href="?m=60" class="m-fart pick" data-method="60" data-cat="fun">Fart</a>
      <a href="?m=61" class="m-rubber pick" data-method="61" data-cat="movie">Rubber</a>
      <a href="?m=62" class="m-tomato pick" data-method="62" data-cat="movie">Tomatoes</a>
      <a href="?m=63" class="m-cocainebear pick" data-method="63" data-cat="movie">Cocaine Bear</a>
    </div>
  </div>
  <div id="cmd">sudo rm -rf /*</div>
  <div id="sub" class="blink">INCOMING...</div>
</div>
<div id="flash"></div>
<div id="wantedAlert"></div>
<div id="shareBox">
  <button id="shareBtn" aria-label="Share" title="Share">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
  </button>
  <div id="shareMenu" class="hidden">
    <button id="shareCurrentBtn">Share this destruction</button>
    <button id="shareSiteBtn">Share the site</button>
  </div>
  <div id="shareToast"></div>
</div>
<div id="statsOverlay">
  <div id="statsPanel">
    <h2>DESTRUCTION STATISTICS</h2>
    <div class="statsTotal" id="statsTotal">Total city destructions: 0</div>
    <div class="statsTotal" id="statsUnique">Unique visitors: 0</div>
    <div id="statsList"></div>
    <div class="statsFooter">
      <button id="statsCloseBtn">Close</button>
    </div>
  </div>
</div>

<script>
const scene=document.getElementById('scene'),cmd=document.getElementById('cmd'),
      sub=document.getElementById('sub'),flash=document.getElementById('flash'),
      stage=document.getElementById('stage'),root=document.documentElement,
      methodBox=document.getElementById('methodBox'),
      wantedBox=document.getElementById('wantedBox'),wantedAlert=document.getElementById('wantedAlert');

// ---- destruction statistics: total runs + per-method counts, stored server-side (shared across every visitor) ----
const statsBtn=document.getElementById('statsBtn'), statsOverlay=document.getElementById('statsOverlay'),
      statsTotal=document.getElementById('statsTotal'), statsUnique=document.getElementById('statsUnique'),
      statsList=document.getElementById('statsList'), statsCloseBtn=document.getElementById('statsCloseBtn');
const methodNames={};
methodBox.querySelectorAll('.pick').forEach(el=>{ methodNames[el.getAttribute('data-method')]=el.textContent; });
// direct-call links: ?m=<method id> launches that method immediately on load, skipping the picker
let pendingLaunchMethod=null;
(function(){
  try{
    const params=new URLSearchParams(location.search);
    const m=params.get('m');
    if(m!==null && methodNames.hasOwnProperty(m)) pendingLaunchMethod=parseInt(m,10);
  }catch(e){}
})();
function getShareableURL(methodId){
  const base=location.origin+location.pathname;
  return (methodId!==undefined && methodId!==null) ? base+'?m='+methodId : base;
}
let stats={total:0, methods:{}, uniqueVisitors:0};
const POPULAR_COUNT=12;   // how many top methods "Popular" shows
function normalizeStats(d){ return (d && typeof d==='object') ? { total:d.total||0, methods:d.methods||{}, uniqueVisitors:d.uniqueVisitors||0 } : {total:0, methods:{}, uniqueVisitors:0}; }
function fetchStats(){
  return fetch(location.pathname+'?stats=get', {cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .then(d=>{ stats=normalizeStats(d); })
    .catch(()=>{});
}
function recordDestruction(methodId){
  // optimistic local bump so the number feels instant; the server response is the source of truth
  stats.total=(stats.total||0)+1;
  stats.methods=stats.methods||{};
  stats.methods[methodId]=(stats.methods[methodId]||0)+1;
  fetch(location.pathname+'?stats=record', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({method:methodId})
  }).then(r=>r.ok?r.json():null).then(d=>{ if(d) stats=normalizeStats(d); }).catch(()=>{});
}
function renderStats(){
  statsTotal.textContent="Total city destructions: "+(stats.total||0);
  statsUnique.textContent="Unique visitors: "+(stats.uniqueVisitors||0);
  const entries=Object.keys(methodNames).map(id=>({ name:methodNames[id], count:(stats.methods&&stats.methods[id])||0 }));
  entries.sort((a,b)=> b.count-a.count || a.name.localeCompare(b.name));
  statsList.innerHTML=entries.map(e=>{
    const safe=e.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="statsRow"><span>${safe}</span><span class="cnt">${e.count}</span></div>`;
  }).join('');
}
statsBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  renderStats();                       // show cached numbers immediately
  statsOverlay.classList.add('open');
  fetchStats().then(renderStats);      // then refresh with the latest server totals
});
statsCloseBtn.addEventListener('click', (e)=>{ e.stopPropagation(); statsOverlay.classList.remove('open'); });
statsOverlay.addEventListener('click', (e)=>{ if(e.target===statsOverlay) statsOverlay.classList.remove('open'); });
// "Popular" is the default filter — apply it immediately (falls back to showing everything
// until real numbers arrive), then re-apply once the server's counts have loaded
applyPopularFilter();
fetchStats().then(()=>{
  const activeBtn=methodBox.querySelector('.filterBtn.active');
  if(activeBtn && activeBtn.getAttribute('data-cat')==='popular') applyPopularFilter();
});

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
  if(mode==='tikes'){                                             // the Little Tikes monster truck
    if(ch==="o")return "#ffffff";                                // round headlight eyes
    if(ch==="@")return "#1a1a1a";                                // monster-truck tire tread
    if(ch==="("||ch===")")return "#f0c800";                      // yellow wheel-well trim
    return "#e0201a";                                            // Cozy Coupe red body
  }
  if(mode==='mom'){                                               // one furious, doomed mother
    if(ch==="o")return "#ff6a4a";                                 // red-faced with rage
    return "#8a3a8a";                                             // cardigan
  }
  if(mode==='ion'){                                               // the Ion Cannon
    const ri=Math.random();
    if(ri<0.4) return "#eaffff";
    if(ri<0.7) return "#7ad4ff";
    return "#2a8ad0";
  }
  if(mode==='deathstar'){                                         // the Death Star's hull
    if(ch==="("||ch===")")return "#14161a";                      // the dish crater, dark
    if(ch==="."||ch==="'")return "#4a4e54";                       // panel seams
    return "#8a9098";                                             // grey hull plating
  }
  if(mode==='superlaser'){                                        // the superlaser beam & blast
    const rs=Math.random();
    if(rs<0.4) return "#eaffea";
    if(rs<0.7) return "#4aff6a";
    return "#0ac02a";
  }
  if(mode==='pride'){                                             // buildings + flags, freshly repainted
    if(ch==="."||ch===":")return "#ffffff";                      // festive window sparkle
    if(ch==="|")return "#8a8f99";                                 // flagpoles stay neutral
    return prideColors[((c%prideColors.length)+prideColors.length)%prideColors.length];
  }
  if(mode==='pridevenue'){                                        // the community centre, fabulous as ever
    if(/[A-Za-z&]/.test(ch)) return prideColors[(Math.random()*prideColors.length)|0];
    if(ch==="["||ch==="]")return "#ffe680";
    return "#7a7a82";
  }
  if(mode==='parade'){                                            // the marchers
    if(ch==="o")return "#e8c090";
    return prideColors[(Math.random()*prideColors.length)|0];
  }
  if(mode==='joker'){                                             // the clown gang
    if(ch==="o")return "#eafce0";                                 // white grease-paint face
    return (Math.random()<0.5)?"#8a1ab0":"#1a9a4a";              // purple suit / green hair
  }
  if(mode==='jokergas'){                                          // the laughing gas
    const rj=Math.random();
    if(rj<0.4) return "#aaffb0";
    if(rj<0.7) return "#5ad06a";
    return "#8a2ab0";
  }
  if(mode==='batman'){                                            // the Batmobile, and Batman himself
    if(ch==="o")return "#e0c000";                                 // headlamp / emblem glow
    return "#1a1a20";                                             // matte black
  }
  if(mode==='enchantress'){                                       // the sky machine
    const re=Math.random();
    if(re<0.4) return "#40ffb0";
    if(re<0.7) return "#a040e0";
    return "#20c080";
  }
  if(mode==='creature'){                                          // the faceless, blackened army
    return (Math.random()<0.5)?"#1a1a1a":"#2a0a30";
  }
  if(mode==='squad'){                                             // Task Force X
    if(ch==="D")return "#e0c000";                                 // Deadshot
    if(ch==="H")return "#ff40a0";                                 // Harley Quinn
    if(ch==="B")return "#4080ff";                                 // Captain Boomerang
    if(ch==="C")return "#40a040";                                 // Killer Croc
    if(ch==="E")return "#ff6020";                                 // El Diablo
    if(ch==="W")return "#c0c0c0";                                 // Amanda Waller
    return "#d0d0d0";
  }
  if(mode==='jotunheim'){                                         // the Nazi-era lab tower
    if(/[A-Z]/.test(ch)) return "#8aff40";
    return "#5a6068";
  }
  if(mode==='starro'){                                            // the giant alien starfish
    if(ch==="O") return "#ff2020";
    return "#c060e0";
  }
  if(mode==='spore'){                                             // mind-control spores
    return "#e080ff";
  }
  if(mode==='thrall'){                                            // Starro's mind-controlled army
    return "#a040c0";
  }
  if(mode==='ratswarm'){                                          // Ratcatcher 2's swarm
    return "#8a6a4a";
  }
  if(mode==='squad2'){                                            // Bloodsport, Peacemaker, King Shark, Ratcatcher 2, Polka-Dot Man
    if(ch==="B")return "#4080ff";
    if(ch==="P")return "#e0c000";
    if(ch==="K")return "#40a0a0";
    if(ch==="R")return "#a06040";
    if(ch==="D")return "#ff60c0";
    return "#d0d0d0";
  }
  if(mode==='decoy'){                                             // the doomed decoy team
    if(ch==="x")return "#800000";
    return "#ff4040";
  }
  if(mode==='peters'){                                            // Dr. Peters, patient zero
    if(ch==="o")return "#c0a080";                                 // face
    return "#4a3a2a";                                             // trench coat
  }
  if(mode==='virus'){                                             // the vials, and what pours from them
    const rv=Math.random();
    if(rv<0.4) return "#8a2ab0";
    if(rv<0.7) return "#4a1a6a";
    return "#c060e0";
  }
  if(mode==='quarantine'){                                        // hazard tape, biohazard placards, the empty cage
    if(ch==="%")return "#ffcc00";
    return "#5a5a5a";
  }
  if(mode==='cole'){                                               // James Cole, both of him
    if(ch==="o")return "#c0a080";
    return "#5a5a5a";
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
  if(mode==='wanted'){                                            // wanted-system pursuers (cop cars, SWAT, heli, tanks)
    if(ch==="*")return (Math.random()<0.5)?"#ff3030":"#3a7bff";   // light-bar flash, alternating red/blue
    if(ch==="^")return "#e8e8e8";                                 // spike strip
    if(ch===":")return "#ffe066";                                 // helicopter spotlight beam
    if(ch==="P"||ch==="D"||ch==="S"||ch==="W"||ch==="A"||ch==="T"||ch==="L")return "#dfe6f0"; // lettering
    if(ch==="o")return "#111318";                                 // wheels
    return "#9aa4b2";                                              // hull / frame
  }
  if(mode==='baddie'){                                            // the GTA baddie, staying just ahead of the law
    if(ch==="o")return "#ffcf9a";                                 // face
    if(ch==="$")return "#ffd400";                                 // stolen cash
    return "#202226";                                             // dark hoodie
  }
  if(mode==='grass'){                                             // the empty field, before the city rises
    return (Math.random()<0.5)?"#4a9a3a":"#3a7a2a";
  }
  if(mode==='duke'){                                              // Duke Nukem himself (and his mirror reflection)
    if(ch==="o")return "#f0c060";                                 // blonde hair
    if(ch==="#")return "#c02020";                                 // gun
    if(ch==="<"||ch===">")return "#8a8a8a";                       // gun barrel
    if(ch==="|")return "#3a3a3a";                                 // mirror frame
    return "#e8d8c0";                                             // skin / tank top
  }
  if(mode==='pigalien'){                                          // Pig Cops & Octabrains
    if(ch==="o"||ch==="@")return "#ff5050";                       // eyes/glow
    return "#4a9a3a";                                             // green alien hide
  }
  if(mode==='dolly'){                                             // the 9 to 5 crowd, and the big clock
    if(ch==="o")return "#f0c060";                                 // blonde head
    if(/[0-9:APM]/.test(ch))return "#ffd700";                     // the clock face, rhinestone gold
    return "#ff8fc0";                                             // denim-pink workwear
  }
  if(mode==='curryfrank'){                                        // Frank-N-Furter: sequins and fishnets
    if(ch==="o")return "#f0c8a0";                                 // face
    if(ch==="="||ch==="~")return "#000000";                       // fishnets
    return "#e0203a";                                             // corset red
  }
  if(mode==='currypenny'){                                        // the clown with the red balloon
    if(ch==="o")return "#fff0f0";                                 // greasepaint white face
    if(ch==="^"||ch==="V")return "#ff2020";                       // painted grin
    if(ch==="@")return "#ff2020";                                 // the balloon
    return "#e8a800";                                             // ruff / pompoms, sickly gold
  }
  if(mode==='currydark'){                                         // the horned Lord of Darkness, looming
    if(ch==="o"||ch==="O")return "#ff3010";                       // burning eyes
    if(ch==="Y"||ch==="V"||ch==="\\"||ch==="/")return "#8a1010";  // horns
    return "#1a0808";                                             // charcoal hide
  }
  if(mode==='currywads'){                                         // Wadsworth, and the wrench
    if(ch==="o")return "#e8d0b0";                                 // face
    if(ch==="T"||ch==="/")return "#909090";                       // the wrench
    return "#1a1a1e";                                             // butler's tails
  }
  if(mode==='currylechuck'){                                      // LeChuck, ghost pirate
    if(ch==="o"||ch==="O")return "#c0ffd0";                       // hollow eyes
    return "#2aa060";                                             // spectral green
  }
  if(mode==='curryconcierge'){                                    // the suspicious hotel concierge
    if(ch==="o")return "#e8d0b0";                                 // face
    if(ch==="$")return "#ffd700";                                 // bellhop gold trim
    return "#7a1a2a";                                             // hotel-maroon uniform
  }
  if(mode==='currywarp'){                                         // the dance floor gives way
    const rcw=Math.random();
    if(rcw<0.34) return "#ff2050";
    if(rcw<0.67) return "#ffd700";
    return "#40e0ff";
  }
  if(mode==='emerald'){                                           // the Emerald City
    if(ch==="."||ch===":")return "#eaffea";                       // sparkling windows
    if(ch==="|")return "#0a5a2a";                                 // deep emerald walls
    return "#1fae5a";                                             // emerald green
  }
  if(mode==='witch'){                                             // the Wicked Witch of the West
    if(ch==="O"||ch==="o")return "#7ad020";                       // green skin
    if(ch==="/"||ch==="\\")return "#1a1a1a";                      // pointed hat
    if(ch==="="||ch==="#"||ch===">")return "#5a3a1a";             // broomstick
    if(ch==="~")return "#8a6a2a";                                 // broom bristles
    return "#1a1a1a";                                             // black robes
  }
  if(mode==='flyingmonkey'){                                      // the flying monkeys, in pursuit
    if(ch==="o")return "#c0a060";                                 // face
    if(ch==="^"||ch==="-")return "#8a6a3a";                       // wings
    return "#6a4a2a";                                             // fur
  }
  if(mode==='glindabubble'){                                      // Glinda, watching from her bubble
    if(ch==="o")return "#f0c060";                                 // golden hair
    if(ch==="."||ch==="'"||ch==="-")return "#ffc0e8";             // the pink bubble
    return "#ffe0f4";
  }
  if(mode==='ltttower'){                                          // the Linus Media Group skyline
    if(/[A-Za-z]/.test(ch)) return "#fff2e0";                     // tower signage
    if(ch==="."||ch===":") return "#ffb347";                      // lit windows, LTT orange
    return "#8a5a20";                                             // steel & orange trim
  }
  if(mode==='lttgpu'){                                            // the priceless prototype GPU
    if(ch==="=") return "#ffae42";
    return "#3a2a10";
  }
  if(mode==='lttflood'){                                          // the watercooling leak
    return (Math.random()<0.5)?"#2a9ad0":"#5ad0e0";
  }
  if(mode==='lttdata'){                                           // DATA LOSS, spreading through the racks
    if(/[A-Z ]/.test(ch)) return "#ff3030";
    return "#4a4a4a";
  }
  if(mode==='lttperson'){                                         // Linus, Anthony, Jake
    if(ch==="o") return "#e8c090";
    return "#ff7b00";                                             // LTT orange
  }
  if(mode==='lttsponsor'){                                        // the ad-read save: rubble frozen in golden light
    return (Math.random()<0.5)?"#ffd700":"#ff9a2a";
  }
  if(mode==='tuskstar'){                                          // the star field in orbit
    return (Math.random()<0.5)?"#ffffff":"#a0c0ff";
  }
  if(mode==='tuskearth'){                                         // the curve of the Earth below
    return (Math.random()<0.5)?"#2a6a9a":"#3a9a6a";
  }
  if(mode==='tuskroadster'){                                      // the Roadster, Optimus strapped in
    if(ch==="Y")return "#d0e0ff";                                 // the frozen waving arm
    if(ch==="o")return "#1a1a1a";                                 // wheels
    return "#c81020";                                             // cherry-red chassis
  }
  if(mode==='tuskflame'){                                         // reentry / impact flame
    const rf=Math.random();
    return rf<0.4?"#ffe040":(rf<0.7?"#ff8000":"#ff3000");
  }
  if(mode==='tuskoptimus'){                                       // Optimus, undamaged and unbothered
    if(ch==="O"||ch==="o")return "#40c0ff";                       // glowing blue eyes
    return "#c0c4c8";                                             // brushed steel
  }
  if(mode==='tuskcyber'){                                         // the Cybertruck, appeared from nowhere
    if(ch==="o")return "#1a1a1a";
    return "#b8bcc0";                                             // stainless steel
  }
  if(mode==='tuskperson'){                                        // Melon Tusk: hard hat, hi-vis, mug
    if(ch==="^")return "#ffd400";                                 // hard hat
    if(ch==="o")return "#e8c090";                                 // face
    return "#ff7a1a";                                             // hi-vis vest
  }
  if(mode==='tuskreporter'){                                      // the shell-shocked reporter
    if(ch==="o")return "#e8c090";
    return "#7a8290";
  }
  if(mode==='tuskember'){                                         // embers drifting over the ruins
    return (Math.random()<0.5)?"#ff9a3a":"#ffd070";
  }
  if(mode==='fartperson'){                                        // the performer, mic in hand
    if(ch==="o")return "#e8c090";                                 // face
    if(ch==="q")return "#1a1a1a";                                 // the microphone
    if(ch==="*")return "#eaffea";                                 // the cough
    return "#7a5aa0";                                             // stage outfit
  }
  if(mode==='fartstage'){                                         // the stage and the two big speakers
    if(ch==="#")return "#1a1a1a";                                 // speaker cones
    return "#5a5a62";                                             // rig, grey steel
  }
  if(mode==='fartcrowd'){                                         // the crowd, watching (then recoiling)
    return "#8a9ab0";
  }
  if(mode==='fartwave'){                                          // the sound wave rolling outward
    return (Math.random()<0.5)?"#c8f050":"#a0d040";
  }
  if(mode==='fartbroken'){                                        // shattered glass, everywhere
    return (Math.random()<0.5)?"#eaf6ff":"#a8c8d8";
  }
  if(mode==='rubbertire'){                                        // Robert, a telepathic car tire
    if(ch==="o"||ch==="O")return "#1a1a1a";                       // hubcap
    return "#2a2a2a";                                             // black rubber
  }
  if(mode==='rubberperson'){                                      // an unsuspecting bystander
    if(ch==="o")return "#e8c090";                                 // face
    return "#5a6a8a";                                             // clothes
  }
  if(mode==='rubberbeam'){                                        // the telepathic focus
    return (Math.random()<0.5)?"#c060ff":"#8a2ab0";
  }
  if(mode==='rubberburst'){                                       // heads exploding — no further explanation
    const rr=Math.random();
    if(rr<0.4) return "#ff3030";
    if(rr<0.7) return "#e8c090";
    return "#8a1010";
  }
  if(mode==='tomato'){                                            // a giant killer tomato
    if(ch===","||ch==="^"||ch===".")return "#2a6a1a";             // stem & leaf
    return (Math.random()<0.5)?"#e0201a":"#ff3020";               // glossy red skin
  }
  if(mode==='tomatosplat'){                                       // squashed — nothing left but pulp
    return (Math.random()<0.5)?"#c81810":"#8a1010";
  }
  if(mode==='cocainebear'){                                       // a very large, extremely motivated bear
    if(ch==="*")return (Math.random()<0.5)?"#ff2020":"#ffffff";  // manic, dilated eyes
    if(ch==="^"||ch==="o")return "#1a1008";                       // ears / normal eyes
    return "#5a3a1a";                                             // brown fur
  }
  if(mode==='cocainebag'){                                        // the duffel bags, mid-air or landed
    return "#3a3a30";
  }
  if(mode==='cocainegore'){                                       // mauled — the bear does not share
    return (Math.random()<0.5)?"#8a1010":"#c81810";
  }
  if(mode==='dukefire'){                                          // muzzle flashes & explosions
    const rdk=Math.random();
    if(rdk<0.4) return "#ffe040";
    if(rdk<0.7) return "#ff8000";
    return "#ff3000";
  }
  return "#cccccc";
}

// Build an HTML string from a char grid + a same-shape "mode grid".
// modeGrid[r][c] gives the palette mode for that cell; falls back to base.
function paint(grid, modeGrid, base){
  WantedSystem.render(grid, modeGrid);
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
const maxDmg=()=>Math.floor(COLS/2)+2;

// ---- lazy method loading: each destruction method lives in its own file under
// js/methods/, fetched only the first time it's actually launched. ----
let WantedSystem = { render(){}, step(){}, reset(){}, getWantedLevel(){return 0;}, setWantedLevel(){}, clearWanted(){} };
const methodDefs = {};
const phaseHandlers = {};
const loadedMethodFiles = new Set();
const METHOD_FILES = {
  0: 'nuke.js',
  1: 'tsunami.js',
  2: 'asteroid.js',
  3: 'godzilla.js',
  4: 'napalm.js',
  5: 'sun.js',
  6: 'alien.js',
  7: 'zombie.js',
  8: 'locust.js',
  9: 'tornado.js',
  10: 'earthquake.js',
  11: 'volcano.js',
  12: 'riots.js',
  13: 'aircrash.js',
  14: 'toxicwaste.js',
  15: 'isscrash.js',
  16: 'sharknado.js',
  17: 'sauron.js',
  18: 'freeze.js',
  19: 'thanos.js',
  20: 'inception.js',
  21: 'dragons.js',
  22: 'aitakeover.js',
  23: 'bttf.js',
  24: 'manofsteel.js',
  25: 'jurassicpark.js',
  26: 'satan.js',
  27: 'titanic.js',
  28: 'nautiloid.js',
  29: 'emp.js',
  30: 'war.js',
  31: 'jumanji.js',
  32: 'ghostbusters.js',
  33: 'frozen.js',
  34: 'landslide.js',
  35: 'avp.js',
  36: 'mortalengines.js',
  37: 'simpsons.js',
  38: 'emuwar.js',
  39: 'neiltheseal.js',
  40: 'koolaid.js',
  41: 'graygoo.js',
  42: 'mineturtle.js',
  43: 'triffids.js',
  44: 'littletikes.js',
  45: 'ioncannon.js',
  46: 'deathstar.js',
  47: 'lgbtagenda.js',
  48: 'joker.js',
  49: 'suicidesquad.js',
  50: 'monkeys.js',
  51: 'suicidesquad2.js',
  52: 'gta.js',
  53: 'simcity.js',
  54: 'duke.js',
  55: 'dolly.js',
  56: 'timcurry.js',
  57: 'wicked.js',
  58: 'ltt.js',
  59: 'melontusk.js',
  60: 'fart.js',
  61: 'rubber.js',
  62: 'tomatoes.js',
  63: 'cocainebear.js'
};
function registerMethod(id, def){
  methodDefs[id] = def;
  for(const pname of def.phaseNames) phaseHandlers[pname] = def.loopFn;
}
function loadMethodScript(file, cb){
  if(loadedMethodFiles.has(file)){ cb(); return; }
  const s = document.createElement('script');
  s.src = 'js/methods/' + file;
  s.onload = () => { loadedMethodFiles.add(file); cb(); };
  document.head.appendChild(s);
}

// ---- helpers shared by more than one method (kept in core so no method file
// needs another method's file loaded just to call one of these) ----
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
function mtDrawBubble(grid, mg, c0, r0, text){
  const bubble="( "+text+" )";
  const br=r0-2;
  if(br<0) return;
  const bc=c0-Math.floor(bubble.length/2);
  for(let j=0;j<bubble.length;j++){ const c=bc+j; if(c>=0&&c<COLS){ setCh(grid,br,c,bubble[j]); setMode(mg,br,c,'speech'); } }
  const tr=r0-1;
  if(tr>=0&&c0>=0&&c0<COLS){ setCh(grid,tr,c0,"v"); setMode(mg,tr,c0,'speech'); }
}
function ionDemolish(tx, r){
  if(cityGridArr.length!==ROWS) return;
  for(let row=0; row<streetRow; row++){ if(!cityGridArr[row]) continue; let ln=cityGridArr[row].split("");
    for(let c=tx-r;c<=tx+r;c++){ if(c<0||c>=COLS)continue; if(ln[c]!==" " && Math.random()<0.55) ln[c]=" "; }
    cityGridArr[row]=ln.join(""); }
  if(cityGridArr[streetRow]){ let g=cityGridArr[streetRow].split("");
    for(let c=tx-r;c<=tx+r;c++){ if(c>=0&&c<COLS&&Math.random()<0.5) g[c]=["#","%","."][(Math.random()*3)|0]; }
    cityGridArr[streetRow]=g.join(""); }
}
const tankSprite=["  __   ","_|##|__=","(O)(O)(O"];   // turret + hull + barrel + treads
const heliRotorFrames=["-+-","\\+/"];
const rubberPersonSprite=[" o ","/|\\","/ \\"];

function reset(){
  clearTimeout(timer); clearInterval(cycleTimer); resize();
  try{ history.replaceState(null,'',location.pathname); }catch(e){}
  cityGridArr=buildCity(); spawnPlanes(); spawnRain(); spawnTrain();
  WantedSystem.reset();
  bombRow=0; mt=0; dmg=0; phase='intro'; introT=ROWS; groundRow=6;
  waveX=0; attackMode='nuke'; waveStarted=false;
  Object.values(methodDefs).forEach(d => { if(d.resetFn) d.resetFn(); });
  wantedBox.style.display='none';   // wanted HUD only shows for the GTA method
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
  else if(cmdColor===44){ cmd.style.color="#e0201a"; cmd.style.textShadow="0 0 18px #8a1010";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — MONSTER TRUUUUUUCK"; sub.style.color="#ff5a40"; sub.style.textShadow="0 0 8px #8a1010"; } }
  else if(cmdColor===45){ cmd.style.color="#7ad4ff"; cmd.style.textShadow="0 0 18px #2a5a8a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — FIRE THE ION CANNON"; sub.style.color="#aae8ff"; sub.style.textShadow="0 0 8px #2a5a8a"; } }
  else if(cmdColor===46){ cmd.style.color="#7affa0"; cmd.style.textShadow="0 0 18px #1a6a2a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — THAT'S NO MOON"; sub.style.color="#c0ffd0"; sub.style.textShadow="0 0 8px #1a6a2a"; } }
  else if(cmdColor===47){ cmd.style.color="#ff66cc"; cmd.style.textShadow="0 0 18px #a0308a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — START THE PARADE"; sub.style.color="#ffb0e6"; sub.style.textShadow="0 0 8px #a0308a"; } }
  else if(cmdColor===48){ cmd.style.color="#8a2ab0"; cmd.style.textShadow="0 0 18px #3a1a4a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — WHY SO SERIOUS?"; sub.style.color="#c090e0"; sub.style.textShadow="0 0 8px #3a1a4a"; } }
  else if(cmdColor===49){ cmd.style.color="#e0c000"; cmd.style.textShadow="0 0 18px #4a1a6a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — ASSEMBLE TASK FORCE X"; sub.style.color="#ffe060"; sub.style.textShadow="0 0 8px #4a1a6a"; } }
  else if(cmdColor===50){ cmd.style.color="#8a6a3a"; cmd.style.textShadow="0 0 18px #4a2a10";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RELEASE THE VIRUS"; sub.style.color="#c0a060"; sub.style.textShadow="0 0 8px #4a2a10"; } }
  else if(cmdColor===51){ cmd.style.color="#4080ff"; cmd.style.textShadow="0 0 18px #1a2a6a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — UNLEASH STARRO"; sub.style.color="#80a0ff"; sub.style.textShadow="0 0 8px #1a2a6a"; } }
  else if(cmdColor===52){ cmd.style.color="#ff3030"; cmd.style.textShadow="0 0 18px #ff3030";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — GO ON THE RUN"; sub.style.color="#ff3030"; sub.style.textShadow="0 0 8px #ff3030"; } }
  else if(cmdColor===53){ cmd.style.color="#4a9a3a"; cmd.style.textShadow="0 0 18px #2a5a1a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — GROW A CITY"; sub.style.color="#7aca5a"; sub.style.textShadow="0 0 8px #2a5a1a"; } }
  else if(cmdColor===54){ cmd.style.color="#ff8000"; cmd.style.textShadow="0 0 18px #ff3000";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — COME GET SOME"; sub.style.color="#ff8000"; sub.style.textShadow="0 0 8px #ff3000"; } }
  else if(cmdColor===55){ cmd.style.color="#ff8fc0"; cmd.style.textShadow="0 0 18px #a0308a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — WORK 9 TO 5"; sub.style.color="#ff8fc0"; sub.style.textShadow="0 0 8px #a0308a"; } }
  else if(cmdColor===56){ cmd.style.color="#e0203a"; cmd.style.textShadow="0 0 18px #ffd700";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DO THE TIME WARP"; sub.style.color="#e0203a"; sub.style.textShadow="0 0 8px #ffd700"; } }
  else if(cmdColor===57){ cmd.style.color="#1fae5a"; cmd.style.textShadow="0 0 18px #0a5a2a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — SEND OUT THE FLYING MONKEYS"; sub.style.color="#1fae5a"; sub.style.textShadow="0 0 8px #0a5a2a"; } }
  else if(cmdColor===58){ cmd.style.color="#ff7b00"; cmd.style.textShadow="0 0 18px #cc5c00";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DROP THE GPU"; sub.style.color="#ff7b00"; sub.style.textShadow="0 0 8px #cc5c00"; } }
  else if(cmdColor===59){ cmd.style.color="#d0d4d8"; cmd.style.textShadow="0 0 18px #2a6a9a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DEORBIT THE ROADSTER"; sub.style.color="#d0d4d8"; sub.style.textShadow="0 0 8px #2a6a9a"; } }
  else if(cmdColor===60){ cmd.style.color="#a0d040"; cmd.style.textShadow="0 0 18px #5a7a1a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — TAKE THE STAGE"; sub.style.color="#a0d040"; sub.style.textShadow="0 0 8px #5a7a1a"; } }
  else if(cmdColor===61){ cmd.style.color="#3a3a3a"; cmd.style.textShadow="0 0 18px #8a2ab0";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — ROLL OUT ROBERT"; sub.style.color="#3a3a3a"; sub.style.textShadow="0 0 8px #8a2ab0"; } }
  else if(cmdColor===62){ cmd.style.color="#e0201a"; cmd.style.textShadow="0 0 18px #2a6a1a";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — RUN FROM THE TOMATOES"; sub.style.color="#e0201a"; sub.style.textShadow="0 0 8px #2a6a1a"; } }
  else if(cmdColor===63){ cmd.style.color="#6a4a2a"; cmd.style.textShadow="0 0 18px #e8d8c0";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — FEED THE BEAR"; sub.style.color="#6a4a2a"; sub.style.textShadow="0 0 8px #e8d8c0"; } }
  else{ cmd.style.color="#f00"; cmd.style.textShadow="0 0 18px #f00";
    if(phase==='intro'){ sub.textContent="CLICK / PRESS ANY KEY — DROP THE BOMB"; sub.style.color="#ff5030"; sub.style.textShadow="0 0 8px #f00"; } }
}
function startCycle(){
  cmdColor=0; paintCmd2();
  cycleTimer=setInterval(()=>{ if(phase!=='intro')return; cmdColor=(cmdColor+1)%64; paintCmd2(); }, 2500);
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
  WantedSystem.step();
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
  if(phaseHandlers[phase]){ phaseHandlers[phase](); return; }
}


function armDrop(){

  if(phase!=='intro')return;
  clearInterval(cycleTimer);
  clearTimeout(timer);            // cancel the pending intro frame; we restart the chain cleanly
  recordDestruction(cmdColor);
  // deliberately leave the address bar alone here — any in-page launch (tile click,
  // tap-anywhere, keypress, RANDOM) is not "arriving at a link," so refreshing
  // afterward should land back on the picker, same as a fresh visit. The Share
  // button still builds a real ?m=<id> link on demand, from cmdColor, not from this.
  methodBox.style.display="none";
  const file = METHOD_FILES[cmdColor];
  loadMethodScript(file, () => { methodDefs[cmdColor].start(); loop(); });
}

window.addEventListener('keydown',armDrop);
// filter pills: narrow the method grid down to one category at a time
function applyPopularFilter(){
  const counts=stats.methods||{};
  const ranked=Object.keys(methodNames)
    .map(id=>({id, count:(counts[id])||0}))
    .filter(e=>e.count>0)
    .sort((a,b)=> b.count-a.count)
    .slice(0,POPULAR_COUNT)
    .map(e=>e.id);
  // no usage data yet (fresh deploy) — fall back to showing everything rather than an empty grid
  if(ranked.length===0){
    methodBox.querySelectorAll('.pick').forEach(el=>el.classList.remove('mHidden'));
    return;
  }
  const popularSet=new Set(ranked);
  methodBox.querySelectorAll('.pick').forEach(el=>{
    el.classList.toggle('mHidden', !popularSet.has(el.getAttribute('data-method')));
  });
}
methodBox.querySelectorAll('.filterBtn').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const cat=btn.getAttribute('data-cat');
    methodBox.querySelectorAll('.filterBtn').forEach(b=>b.classList.toggle('active', b===btn));
    if(cat==='popular'){
      // refresh with the latest server counts, then apply — falls back to whatever's cached meanwhile
      applyPopularFilter();
      fetchStats().then(()=>{ if(btn.classList.contains('active')) applyPopularFilter(); });
      return;
    }
    methodBox.querySelectorAll('.pick').forEach(el=>{
      const show = (cat==='all') || (el.getAttribute('data-cat')===cat);
      el.classList.toggle('mHidden', !show);
    });
  });
});
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
  if(e.target && e.target.closest && e.target.closest('#topBarLeft'))return; // stats button
  if(e.target && e.target.closest && e.target.closest('#methodBox'))return;   // handled above
  if(e.target && e.target.closest && e.target.closest('#statsOverlay'))return; // stats panel
  if(e.target && e.target.closest && e.target.closest('#shareBox'))return;   // share button/menu
  armDrop();
}
document.body.addEventListener('click', stageTap);
// prevent double-tap-zoom / scroll on the scene, keep taps responsive
scene.addEventListener('touchend', (e)=>{ e.preventDefault(); stageTap(e); }, {passive:false});
const rb=document.getElementById('resetBtn');
rb.addEventListener('click', reset);
const randomBtn=document.getElementById('randomBtn');
randomBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  reset();
  const ids=Object.keys(methodNames);
  cmdColor=parseInt(ids[(Math.random()*ids.length)|0],10);
  paintCmd2();
  armDrop();
});

// ---- share button: share the currently-shown/running method, or the bare site ----
const shareBtn=document.getElementById('shareBtn'), shareMenu=document.getElementById('shareMenu'),
      shareCurrentBtn=document.getElementById('shareCurrentBtn'), shareSiteBtn=document.getElementById('shareSiteBtn'),
      shareToast=document.getElementById('shareToast');
function showShareToast(msg){
  shareToast.textContent=msg; shareToast.classList.add('show');
  clearTimeout(showShareToast._t);
  showShareToast._t=setTimeout(()=>shareToast.classList.remove('show'), 1800);
}
function doShare(url, title){
  if(navigator.share){
    navigator.share({title, url}).catch(()=>{});
  } else if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(()=>showShareToast('Link copied!')).catch(()=>{ window.prompt('Copy this link:', url); });
  } else {
    window.prompt('Copy this link:', url);
  }
}
shareBtn.addEventListener('click', (e)=>{ e.stopPropagation(); shareMenu.classList.toggle('hidden'); });
shareCurrentBtn.addEventListener('click', (e)=>{
  e.stopPropagation(); shareMenu.classList.add('hidden');
  const name=methodNames[cmdColor]||'this destruction';
  doShare(getShareableURL(cmdColor), 'sudo.me.uk — '+name);
});
shareSiteBtn.addEventListener('click', (e)=>{
  e.stopPropagation(); shareMenu.classList.add('hidden');
  doShare(getShareableURL(), 'sudo.me.uk');
});
document.body.addEventListener('click', ()=>{ shareMenu.classList.add('hidden'); });
reset();
if(pendingLaunchMethod!==null){
  cmdColor=pendingLaunchMethod;
  paintCmd2();
  armDrop();
}
</script>
</body>
</html>
