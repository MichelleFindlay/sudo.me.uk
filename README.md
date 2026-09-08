# sudo.me.uk

A stupid little ASCII terminal simulator that destroys a procedurally generated city 40 different ways. Pick your poison, watch the chaos animate in glorious green-on-black monospace, then hit reset and do it again.

🔗 **Live:** [sudo.me.uk](https://sudo.me.uk)

## What it is

You land on a fake terminal running `sudo rm -rf /*`, pick a "method" from a grid of scenarios, and watch a fully animated, character-grid rendering of a city get wiped out in that style — screen shake, rain, fire, smoke, the works — ending on a "the city is gone — press RESET" hold screen.

No backend logic, no database, no point. Just a single self-contained page that renders everything as plain text.

## Methods

Classic disasters — Nuclear Bomb, Tsunami, Asteroid, Earthquake, Volcano, Tornado, Toxic Waste, Riots, Air Crash, ISS Crash, Landslide

Kaiju & sci-fi — Godzilla, Aliens, Sauron, Thanos, AI Takeover, EMP, War, Sharknado, Locusts, Zombies

Movie & game homages — Jurassic Park, Titanic, Back to the Future, Man of Steel, Baldur's Gate (nautiloid), Ghostbusters, Jumanji, Frozen, Snowpiercer, Alien vs Predator, Satan, Dragons, Inception, The Sun

Whimsical extras — Mortal Engines (cranes dismantle the skyline into a mobile Traction City), The Simpsons (a glass dome drops over the city and paints it yellow), the Great Emu War (the army loses), and Neil the Seal (bashes every building down, then leans on a cone)

## How it works

Everything is rendered as monospace text — a shared procedural city generator builds a skyline, a character-grid painter colors each cell per "mode," and a state machine of animation phases drives each scenario frame by frame. No canvas, no images, no sprites — just strings and `setTimeout`.

The page is served as PHP (`index.php`) purely so it can do a lightweight server-side check against this repo's [GitHub releases](https://github.com/MichelleFindlay/sudo.me.uk/releases) — the version badge in the top bar turns red with a tooltip if the live build doesn't match a published release.

## Running locally

It's a single PHP file with no dependencies.

```bash
php -S localhost:8000
```

Then open `http://localhost:8000`.

## License

[GPL-3.0](LICENSE)
