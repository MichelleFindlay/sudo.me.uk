# Changelog

## v1.5.0

### Changed
- Each of the 64 destruction methods now lives in its own file under a new `js/methods/` directory, fetched on demand only the first time that method is actually launched — a plain page load, or browsing the method picker, no longer downloads any of them. `index.php`'s inline script shrank from roughly 9,400 lines to about 2,300, keeping only the shared engine (city generation, colour palette, UI wiring) and a small loader/registry.

### Fixed
- Along the way, fixed a handful of latent cross-method dependencies this refactor surfaced: a few small helpers (a demolition helper, a speech-bubble helper, an ion-cannon-style blast helper, a tank sprite, a helicopter-rotor sprite, and a bystander sprite) were each defined inside one method's code but quietly reused by several others — these now live in the shared core so no method needs another method's file loaded just to borrow one function.

## v1.4.6

### Added
- A 🎱 RANDOM button next to RESET, in the top bar — resets the city and immediately launches a randomly-picked destruction method, matching RESET's styling.

## v1.4.5

### Added
- Four new destruction methods: **Fart** (a performer clears their throat, turns around, and a sound wave shatters windows across the city), **Rubber** (Robert, a telepathic car tire, rolls through town making heads explode with no further explanation offered), **Tomatoes** (Attack of the Killer Tomatoes — soldiers open fire, and it does absolutely nothing), and **Cocaine Bear** (a smuggler's plane drops its cargo, and whatever finds it first goes on a rampage).
- Every destruction method now has a real, directly-linkable URL (`?m=<id>`) — visiting the site with a method's URL launches that method immediately, skipping the picker. Clicking a method tile updates the address bar to match, and RESET clears it back to the bare site URL.
- A new floating share button in the bottom-right corner, offering to share either the currently-shown/running destruction or the bare site link, via the Web Share API with a clipboard-copy and prompt-dialog fallback.

### Fixed
- Cocaine Bear's dropped duffel bags could sail past their trigger point without ever falling, because the trigger only fired inside a narrow window the plane could skip over on wide screens — it now triggers as soon as the plane reaches or passes the bag.
- Cocaine Bear's rampage phase could oscillate forever hunting for a bag, because its approach step wasn't clamped to the remaining distance — the classic overshoot-and-reverse loop. The step is now clamped so it can't overshoot.

### Changed
- The Cocaine Bear menu tile's glow changed from a grey/cream text-shadow to a red one, for better contrast against its brown text.

## v1.4.4

### Added
- Four new destruction methods: **Tim Curry** (a victory lap through six of his best-known roles — Frank-N-Furter, Pennywise, the Lord of Darkness, Wadsworth, LeChuck, and the Concierge — ending in a building-toppling Time Warp), **Wicked** (the city sweeps to Emerald City green as flying monkeys chase the Wicked Witch across the sky, with Glinda watching serenely from her bubble), **LTT** (a routine GPU review goes wrong — the prototype drops from the WAN Show Tower, triggers a watercooling flood and a DATA LOSS meltdown, and gets spun into "a huge win" by a sponsor read that visibly holds the city together), and **Melon Tusk** (an Optimus-piloted Roadster self-deorbits into downtown, and a tech titan spins the resulting inferno as "nominal" from beside a Cybertruck that appeared from nowhere).

### Fixed
- Wicked's flying-monkey chase sequence could take an impractically long time to reach its damage threshold, because damage was only applied to a single column per frame — widened to a damage radius around each actor and lowered the completion threshold.
- Melon Tusk's dialogue sequences could hang indefinitely on the last line, because the line-advance timer kept resetting to zero even after the final line was reached — the reset is now gated on there being a next line to advance to.

### Changed
- The Wicked menu tile now renders in a split green/pink gradient instead of a solid colour.

## v1.4.1

### Added
- Two new destruction methods: **Duke Nukem 3D** (an intro flight sequence, an alien shoot-down and crash landing, then a rampage through the wreckage) and **Dolly** (a non-destructive tribute — workers arrive at 9AM, clock in for a shift, and head home at 5PM, ending on "RIP Dolly Parton").

### Fixed
- Duke Nukem 3D's crash/impact sequence could throw mid-animation and silently freeze the page, because a fractional blast radius was used directly as a grid-loop bound. The loop bound is now rounded while the blast shape itself stays smooth.

### Changed
- The destruction statistics panel now lays out in two columns on desktop/tablet so the full method list fits without excess scrolling, and collapses back to a single column on phones.

## v1.4.0

### Added
- A new **GTA** destruction method: a rampage that racks up a GTA-style 1-5 star wanted level over time. Escalates from a couple of slow patrol cars at 1 star, through roadblocking patrols at 2, ramming SWAT vans at 3, a circling helicopter with a spike strip at 4, up to rolling tanks and a pulsing citywide alert at 5, where it holds indefinitely.
- A star-rating HUD badge next to the Statistics button, flashing while wanted and glowing red once pursuit is active — stays empty for every other method, since the wanted system only runs during GTA.

## v1.3.0

### Added
- Four new destruction methods: **The Joker** (a parade of laughing-gas canisters, with Batman arriving too late), **Suicide Squad** (the Enchantress's sky machine, Task Force X fighting through, El Diablo's fire), **Suicide Squad 2** (a decoy team lost on the beach, Jotunheim demolished, Starro's rampage and defeat), and **12 Monkeys** (the zoo raid red herring, Dr. Peters spreading the real virus, the emptied city, and the airport loop closing).
- Server-side destruction statistics now also track **unique visitors**, alongside the existing total-destructions and per-method counts. Visitors are identified by a salted SHA-256 hash of their IP address — the raw IP is never stored or exposed to the client.
- A **"Popular"** filter pill in the method picker, which ranks the 20 most-used destruction methods (by server-recorded counts) and shows only those. It's the default filter shown on page load, falling back to showing every method until real usage data has loaded (e.g. on a fresh deploy with no stats yet).
- New `#topBarLeft` control bar in the top-left corner of the page, separate from the existing top-right bar.

### Changed
- The **Statistics** button moved from the top-right bar to its own new bar in the top-left corner.

### Removed
- The "Reset Stats" button from the Statistics panel. (The main game's RESET button, in the top-right bar, is unaffected.)

## v1.2.0

### Added
- Four new destruction methods: **Kool-Aid** (Man bursts through the city, then shatters into glass and spilled punch), **Gray Goo** (self-replicating nanites consuming everything outward from an epicentre), **Mine Turtle** (a mass rooftop flop that ends on a friendly-looking turtle), and **Triffids** (a blinding green comet followed by walking, stinging stalks).
- Four more destruction methods: **Little Tikes** (a child's monster-truck Cozy Coupe, a chase, and an end-over-end flip), **Ion Cannon** (satellite target lock, beam, and blast), **Death Star** (hover, charge, superlaser), and **LGBT Agenda** (no destruction — a parade and a very fabulous repaint).
- Fixes to Neil the Seal's leg animation and seal-body shape.

## v1.1.0

### Added
- Converted the site from a static `index.html` to `index.php`, adding a server-side version check against this repo's GitHub releases — the version badge in the top bar turns red with a tooltip if the live build doesn't match a published release (or shows **DEV** if it's ahead of the latest release).
- Four new destruction methods: **Mortal Engines** (cranes dismantle the skyline, which then drives off as a mobile Traction City), **The Simpsons** (a glass dome drops over the city and repaints it Springfield-yellow), **Emu War** (the army opens fire; the emus win), and **Neil the Seal** (bashes every building flat, then leans contentedly on a traffic cone).
- Project README documenting the site, the full method list, how the rendering engine works, and local run instructions.

## Initial release (pre-v1.1.0)

### Added
- The original ASCII city-destruction simulator, with 35 methods spanning classic disasters (Nuclear Bomb, Tsunami, Asteroid, Earthquake, Volcano, Tornado, Riots, Air Crash, Toxic Waste, ISS Crash, Landslide, Locusts), kaiju & sci-fi (Godzilla, Aliens, Zombies, Sharknado, Sauron, AI Takeover, EMP, War, Thanos, Dragons), and movie/game homages (The Sun, Snowpiercer, Inception, Back to the Future, Man of Steel, Jurassic Park, Satan, Titanic, Jumanji, Baldur's Gate, Ghostbusters, Frozen, Alien vs Predator, Napalm).
- The core rendering engine: a procedural city generator, a character-grid painter with per-scene color palettes, and a phase-based animation state machine driving each method frame by frame.
- Refinements to the Alien/UFO invasion sequence and the Titanic sequence.
