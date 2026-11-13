# Vibe City landing page

The landing page for [Vibe City](https://github.com/vibecity-ai/vibe-city). Plain static files: `index.html`,
`style.css`, `main.js` and `assets/`. No build step, no framework.

## Deploy

Serve this folder as it is. On Vercel: Framework Preset "Other", no build command, no output directory.

After the first deploy, replace `SITE_URL` in `index.html` with the deployed address so link previews show
`assets/og.jpg`.

## What is where

- `assets/media/hero.mp4`: the hero loop (the tower at night), also used behind the closing section.
- `assets/media/clip-*.mp4`: the five gameplay clips, recorded in the game's offline demo. Each has a `.jpg` poster.
- `assets/trailer.mp4`: the trailer. It loads only when someone presses play, so it plays with sound.

Videos play only while they are on screen, and the page animates nothing but `transform` and `opacity`, so it
stays smooth in Firefox and on phones.

## Licence

AGPL-3.0, like the game.
