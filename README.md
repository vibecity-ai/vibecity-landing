# Vibe City landing page

The landing page for [Vibe City](https://github.com/vibecity-ai/vibe-city): a scroll walk-through of the tower that
runs the game's own city renderer from a snapshot of the offline demo.

## Deploy

The page is static and already built. Serve this folder as it is (on Vercel: Framework Preset "Other", no build
command, no output directory).

After the first deploy, replace `SITE_URL` in `index.html` (and in `src/build.mjs`) with the deployed address so link
previews show `assets/og.jpg`.

## Rebuild

`assets/city.js` bundles the city renderer from the game repo, so rebuilding needs a checkout of
[vibe-city](https://github.com/vibecity-ai/vibe-city) with `npm install` done in it.

```
npm install
npm run rebuild                          # looks for ../vibe-city
VIBE_CITY=/path/to/vibe-city npm run rebuild
```

- `src/build.mjs` writes `index.html` (copy, links, inlined icons) and bundles `assets/city.js`.
- `src/landing.js` is the scroll script: chapters, camera moves, the pixel-dot panels.
- `src/snapshot.json` is the demo company the city shows.

## Licence

AGPL-3.0, like the game.
