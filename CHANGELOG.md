# Changelog

## v1.4.0

### Added
- A new **GTA** destruction method: a rampage that racks up a GTA-style 1-5 star wanted level over time. Escalates from a couple of slow patrol cars at 1 star, through roadblocking patrols at 2, ramming SWAT vans at 3, a circling helicopter with a spike strip at 4, up to rolling tanks and a pulsing citywide alert at 5, where it holds indefinitely.
- A star-rating HUD badge next to the Statistics button, flashing while wanted and glowing red once pursuit is active — stays empty for every other method, since the wanted system only runs during GTA.
- `WantedSystem` module with a small public API (`onDestruction`, `getWantedLevel`, `setWantedLevel`, `clearWanted`) and a `wantedLevelChanged` event so other code can react to star changes; the whole feature can be switched off with one flag.

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
