# sudo.me.uk

A stupid little ASCII terminal simulator that destroys a procedurally generated city 64 different ways. Pick your poison, watch the chaos animate in glorious green-on-black monospace, then hit reset and do it again.

🔗 **Live:** [sudo.me.uk](https://sudo.me.uk)

## What it is

You land on a fake terminal running `sudo rm -rf /*`, pick a "method" from a grid of scenarios (or hit the 🎱 RANDOM button to let it choose for you), and watch a fully animated, character-grid rendering of a city get wiped out in that style — screen shake, rain, fire, smoke, the works — ending on a "the city is gone — press RESET" hold screen.

No backend logic, no database, no point. Just a single self-contained page that renders everything as plain text.

## Methods

Classic disasters — Nuclear Bomb, Tsunami, Asteroid, Napalm, Locusts, Tornado, Earthquake, Volcano, Riots, Air Crash, Toxic Waste, ISS Crash, Landslide

Kaiju & sci-fi — Godzilla, The Sun, Aliens, Zombies, Sharknado, AI Takeover, EMP, War, Gray Goo, Ion Cannon

Movies & game homages — Sauron, Snowpiercer, Thanos, Inception, Dragons, Back to the Future, Man of Steel, Jurassic Park, Satan, Titanic, Jumanji, Baldur's Gate (nautiloid), Ghostbusters, Frozen, Alien vs Predator, Mortal Engines, The Simpsons, Triffids, Death Star, The Joker, Suicide Squad, Suicide Squad 2, 12 Monkeys, GTA, Sim City, Duke Nukem 3D, Tim Curry, Wicked, LTT, Melon Tusk, Rubber (a telepathic tire with no further explanation offered), and Tomatoes (Attack of the Killer Tomatoes)

Whimsical extras — the Great Emu War (the army loses), Neil the Seal (bashes every building down, then leans on a cone), Kool-Aid Man (bursts through half the city, then shatters into glass and punch), Mine Turtle (a mass rooftop flop that ends on a friendly-looking turtle), Little Tikes (a kid's monster-truck Cozy Coupe chase and flip), LGBT Agenda (no destruction — just a very fabulous repaint), Dolly (a non-destructive 9-to-5 tribute), Fart (a sound wave that shatters every window in earshot), and Cocaine Bear (a smuggler's plane, some duffel bags, one very motivated bear)

## How it works

Everything is rendered as monospace text — a shared procedural city generator builds a skyline, a character-grid painter colors each cell per "mode," and a state machine of animation phases drives each scenario frame by frame. No canvas, no images, no sprites — just strings and `setTimeout`.

Every method also has a real, shareable URL (`?m=<id>`) that launches it directly, and a share button in the bottom-right corner lets you share either the current destruction or the bare site link.

The page is served as PHP (`index.php`) purely so it can do a lightweight server-side check against this repo's [GitHub releases](https://github.com/MichelleFindlay/sudo.me.uk/releases) — the version badge in the top bar turns red with a tooltip if the live build doesn't match a published release.

## Running locally

It's a single PHP file with no dependencies.

```bash
php -S localhost:8000
```

Then open `http://localhost:8000`.

## License

[GPL-3.0](LICENSE)
