// Builds the landing page: index.html (with the pixel icons and wordmark inlined) and assets/city.js (the game's
// city renderer and the page's scroll script). Needs a checkout of the game repo with `npm install` done in it,
// next to this one (../vibe-city) or wherever VIBE_CITY points. Run: npm run rebuild
import fs from 'node:fs';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = fileURLToPath(new URL('.', import.meta.url)), site = fileURLToPath(new URL('..', import.meta.url));
const GAME = path.resolve(process.env.VIBE_CITY || path.join(site, '..', 'vibe-city'), 'apps/web/src');
if (!fs.existsSync(path.join(GAME, 'town/world/City.ts'))) throw new Error(`Game source not found at ${GAME}. Set VIBE_CITY to your vibe-city checkout.`);
const REPO = 'https://github.com/vibecity-ai/vibe-city', RUN = `${REPO}#run-it-judges-start-here`;

// pixel icons (11 x 11) shared with the README graphics
const ICONS = {
  chip: ['..1.1.1.1..', '..1.1.1.1..', '11aaaaaaa11', '..a.....a..', '11a.bbb.a11', '..a.bbb.a..', '11a.bbb.a11', '..a.....a..', '11aaaaaaa11', '..1.1.1.1..', '..1.1.1.1..'],
  store: ['aaaaaaaaaaa', 'abababababa', 'aaaaaaaaaaa', '.a.......a.', '.a.ccc...a.', '.a.c.c.d.a.', '.a.c.c...a.', '.a.c.c...a.', 'aaaaaaaaaaa', '...........', '...........'],
  safe: ['aaaaaaaaaaa', 'a.........a', 'a.aaaaaaa.a', 'a.a.....a.a', 'a.a..b..a.a', 'a.a.bbb.a.a', 'a.a..b..a.a', 'a.a.....a.a', 'a.aaaaaaa.a', 'aaaaaaaaaaa', '.a.......a.'],
  coin: ['...aaaaa...', '.aaaaaaaaa.', '.aaabbbaaa.', 'aaabaaabaaa', 'aaabaaaaaaa', 'aaaabbbaaaa', 'aaaaaaabaaa', 'aaabaaabaaa', '.aaabbbaaa.', '.aaaaaaaaa.', '...aaaaa...'],
  check: ['aaaaaaaaaaa', 'a.........a', 'a.......b.a', 'a......bb.a', 'a.b...bb..a', 'a.bb.bb...a', 'a..bbb....a', 'a...b.....a', 'a.........a', 'aaaaaaaaaaa', '...........'],
  key: ['...........', '...........', '...........', '.aaa.......', 'a...a......', 'a.b.aaaaaaa', 'a...a...a.a', '.aaa....a.a', '...........', '...........', '...........'],
};
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const m = (v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => m(v).toString(16).padStart(2, '0')).join(''); };
const icon = (name, col, size) => { const pal = { a: col, b: shade(col, .55), c: shade(col, -.35), d: '#FFC75A', '1': shade(col, -.45) }; let r = ''; ICONS[name].forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`; })); return `<svg viewBox="0 0 11 11" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true" style="filter:drop-shadow(0 0 8px ${col}66)">${r}</svg>`; };
const wm = fs.readFileSync(site + 'assets/wordmark.svg', 'utf8');
const wordmark = (cls) => wm.replace(/ height="30" width="174" style="[^"]*"/, ` class="${cls}" role="img" aria-label="Vibe City"`).replace(/id="wm"/g, `id="g-${cls}"`).replace(/url\(#wm\)/g, `url(#g-${cls})`);

const FLOORS = [
  ['PH', 'check', '#7CF5B4', 'Sputnik DAO + Trezu', 'The IPO creates your company’s DAO. You are its only approver; payouts wait for you in Trezu.'],
  ['F5', 'coin', '#FFC75A', 'City token (NEP-141)', 'One million shares from our own factory; 40% are sold at a fixed price on the public share page.'],
  ['F4', 'safe', '#FFC75A', 'OutLayer wallet', 'The treasury. Its keys live in a TEE under a spending policy you set; Vibe City never holds them.'],
  ['F3', 'store', '#FF3EA5', 'NEAR AI Agent Market', 'Each floor lists as an agent. Paid jobs land on its board, the agents deliver, the money is revenue.'],
  ['F2', 'chip', '#7CF5B4', 'NEAR AI Cloud', 'Every agent thinks with the model you pick, through a metering proxy with a daily budget per floor.'],
  ['F1', 'key', '#2EE6F0', 'NEAR Intents', 'The treasury reads every Intents balance; the Treasury Ops floor swaps and rebalances across chains.'],
];
const TRACKS = ['Games With Real Economies', 'Autonomous Business', 'Agent Economy', 'Social Money', 'Real-World Money', 'Unstoppable DeFi'];
const chapter = (id, lv, col, title, body, tags, extra = '') => `<div class="ch" data-ch="${id}" id="${id}"><article class="card" style="--c:${col}">
  <p class="card-k"><span class="lv">${lv}</span></p><h2>${title}</h2><p>${body}</p>
  <p class="tags">${tags.map((t) => `<span>${t}</span>`).join('')}</p>${extra}</article></div>`;
const PANELS = [
  ['signal', '#7CF5B4', 'CH.01 · Think', 'Every agent thinks on NEAR AI Cloud', 'Hermes agents with the model you pick, each floor on its own metered key and daily budget.'],
  ['ripple', '#2EE6F0', 'CH.02 · Earn', 'Floors sell their work', 'Each floor lists on the NEAR AI Agent Market; paid jobs flow in and the money lands in the OutLayer wallet.'],
  ['spectrum', '#9B5CFF', 'CH.03 · Govern', 'Agents propose. You approve.', 'The agent wallet can only propose. Dividends and the end of the sale wait for you in Trezu.'],
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vibe City · Build an AI company on NEAR</title>
<meta name="description" content="A company-building game where the company is real. Every floor of your pixel tower is a team of AI agents that take paid jobs, earn real money and go public as a DAO on NEAR.">
<meta name="theme-color" content="#0B0716">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<!-- Social preview: X and others need an absolute URL. Replace SITE_URL with the deployed address. -->
<meta property="og:type" content="website">
<meta property="og:title" content="Vibe City · Build an AI company on NEAR, one floor at a time">
<meta property="og:description" content="Every floor of your pixel tower is a team of AI agents that take paid jobs, earn real money and go public as a DAO on NEAR.">
<meta property="og:image" content="SITE_URL/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="SITE_URL/assets/og.jpg">
<link rel="preload" href="assets/fonts/jersey-10-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
</head>
<body data-chapter="hero">
<a class="skip" href="#after">Skip the walk-through</a>
<div class="stage" aria-hidden="true"><canvas id="city"></canvas><div class="stage-shade"></div></div>

<header class="bar">
  <a class="bar-brand" href="#top" aria-label="Vibe City, back to top">${wordmark('wm-bar')}</a>
  <nav class="bar-links" aria-label="Sections"><a href="#trailer">Trailer</a><a href="#near">NEAR</a><a href="#run">Run it</a></nav>
  <a class="btn btn-sm" href="${REPO}" rel="noopener">GitHub</a>
</header>

<main id="top">
<section id="walk" aria-label="A walk through the tower">
  <div class="ch ch-hero" data-ch="hero">
    <div class="hero">
      <div class="hero-top">${wordmark('wm-hero')}
      <h1>Build an AI company on <span class="c-near">NEAR</span>, <span class="c-pink">one floor at a time</span></h1></div>
      <div class="hero-bottom">
        <p class="lead">A company-building game where the company is real. Every floor of your tower is a team of AI agents that take paid jobs and earn real money.</p>
        <div class="ctas"><a class="btn btn-primary" href="#trailer">▶ Watch the trailer</a><a class="btn" href="${RUN}" rel="noopener">Run the demo</a></div>
        <a class="cue" href="#research"><span>Scroll to walk in</span><i aria-hidden="true"></i></a>
      </div>
    </div>
  </div>
  ${chapter('research', 'F1 · Research', '#2EE6F0', 'Every floor is a team', 'A lead plans the job and splits it on the floor’s Kanban board. Teammates pick up the pieces, use their tools and deliver. Real Hermes agents, thinking with NEAR AI Cloud.', ['Hermes agents', 'NEAR AI Cloud'])}
  ${chapter('growth', 'F2 · Growth', '#FF3EA5', 'Floors earn real money', 'List a floor on the NEAR AI Agent Market. A buyer pays, the floor delivers, and the money lands in your OutLayer wallet.', ['NEAR AI Agent Market', 'OutLayer'])}
  ${chapter('support', 'F3 · Support', '#FFB547', 'Stuck work finds you', 'Anything blocked, failed or waiting on an answer lands in your in tray. Walk in, talk to any agent and give it what it needs.', ['In tray', 'Talk to any agent'])}
  ${chapter('exec', 'PH · Executive office', '#FFC75A', 'You run the company', 'The quest log is your onboarding: a Chief of Staff, the treasury, your first floor. The safe holds the money; its keys stay in OutLayer’s TEE.', ['Quest log', 'OutLayer treasury'])}
  ${chapter('bell', 'The roof', '#7CF5B4', 'Ring the opening bell', 'Once it has earned, your company goes public: a Sputnik DAO and its own city token on NEAR. Anyone can buy shares, and you approve payouts in Trezu.', ['Sputnik DAO', 'NEP-141 token', 'Trezu'])}
  <div class="ch ch-wide" data-ch="wide"><div class="wide-t"><p class="kicker">Your tower</p><h2>Built one floor at a time</h2><div class="ctas"><a class="btn btn-primary" href="${RUN}" rel="noopener">Run the demo</a><a class="btn" href="#trailer">Watch the trailer</a></div></div></div>
</section>

<div id="after" class="after">
  <section class="tracks" aria-label="Hackathon tracks"><p class="kicker">Built at the NEAR Hackathon for</p><div>${TRACKS.map((t) => `<span class="chip">${t}</span>`).join('')}</div></section>

  <section class="sec" id="trailer">
    <div class="sec-h"><p class="kicker">Trailer</p><h2>Seventy seconds of Vibe City</h2></div>
    <div class="frame video-frame"><video controls preload="metadata" playsinline poster="assets/trailer-poster.jpg"><source src="assets/trailer.mp4" type="video/mp4"><a href="assets/trailer.mp4">Download the trailer</a></video></div>
    <p class="hint">Turn the sound on</p>
  </section>

  <section class="sec">
    <div class="sec-h"><p class="kicker">How the money works</p><h2>Think. Earn. Govern.</h2></div>
    <div class="panels">${PANELS.map(([f, c, k, t, b], i) => `<article class="panel" style="--c:${c}"><canvas class="dots" data-field="${f}" data-col="${c}" aria-hidden="true"></canvas>
      <div class="panel-t"><p class="panel-k"><span>${k}</span><span>0${i + 1} / 03</span></p><h3>${t}</h3><p>${b}</p></div></article>`).join('')}</div>
  </section>

  <section class="sec" id="near">
    <div class="sec-h"><p class="kicker">NEAR, floor by floor</p><h2>Six NEAR pieces, each doing a job</h2></div>
    <div class="stack"><span class="dots-c" aria-hidden="true"></span><ul>${FLOORS.map(([lv, ic, c, n, s]) => `<li class="fl"><span class="fl-lv">${lv}</span><span class="fl-ic">${icon(ic, c, 34)}</span><span class="fl-t"><b>${n}</b><span>${s}</span></span></li>`).join('')}</ul></div>
  </section>

  <section class="sec run" id="run">
    <div class="sec-h"><p class="kicker">Run it yourself</p><h2>Two commands, no keys</h2><p class="sec-sub">The offline demo runs the real backend and web app with fakes for every outside service. Node 24 or newer; no Docker, API keys or wallet.</p></div>
    <pre class="code" aria-label="Commands"><code><span class="pr">$</span> npm install
<span class="pr">$</span> npm run demo
<span class="cm"># then open http://127.0.0.1:4199</span></code></pre>
    <div class="ctas center"><a class="btn btn-primary" href="${RUN}" rel="noopener">Full instructions on GitHub</a><a class="btn" href="${REPO}" rel="noopener">Browse the code</a></div>
  </section>

  <footer class="foot">${wordmark('wm-foot')}<p>Built at the NEAR Hackathon by Alexe and Daniel. Open source under AGPL-3.0.</p><p><a href="${REPO}" rel="noopener">GitHub</a></p></footer>
</div>
</main>
<script src="assets/city.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(site + 'index.html', html);
await build({ entryPoints: [here + 'landing.js'], bundle: true, format: 'iife', minify: true, outfile: site + 'assets/city.js', loader: { '.json': 'json' }, alias: { '@game': GAME }, logLevel: 'warning', define: { 'process.env.NODE_ENV': '"production"' } });
console.log('built', fs.statSync(site + 'index.html').size, fs.statSync(site + 'assets/city.js').size);
