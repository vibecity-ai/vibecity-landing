/* The landing page runs the game's own city renderer on a saved snapshot of the demo company.
   Scrolling moves the camera through the tower: the hero, three floors, the executive office, the opening bell. */
import { useStore } from '@game/town/store';
import { City } from '@game/town/world/City';
import snapshot from './snapshot.json';

class LandingCity extends City {
  heroZoom = 1;
  heroLift = 0;
  camTarget(s) {
    const t = super.camTarget(s);
    const ringing = this.bell && this.t - this.bell.at < 7;
    const wide = this.W > 900;
    if ((s.ui.view === 'floor' || s.ui.execRoom) && !ringing) {
      // inside: the room sits to the right on wide screens, leaving the left for the chapter card; above it on phones
      if (wide) { t.sx = this.W * 0.64; t.z *= 0.8; } else { t.sy = this.H * 0.27; t.z *= 0.86; }
      return t;
    }
    if (s.ui.view === 'tower' && !s.ui.execRoom && !ringing) {
      // centred, with no room kept for the game's floor labels, and pushed in by the scroll
      t.sx = this.W / 2; t.sy = this.H * (this.W < 700 ? 0.48 : 0.56);
      t.z *= this.heroZoom * (this.W < 700 ? 0.72 : 0.72); t.y += this.heroLift;
    }
    return t;
  }
}

const store = useStore;
store.setState({ ...snapshot, ui: { ...store.getState().ui, view: 'tower', floorId: null, execRoom: false, panel: null, questLog: false, talk: null } });
const depts = snapshot.depts;
const byName = (n) => depts.find((d) => d.name === n) ?? depts[0];

const canvas = document.getElementById('city');
const city = new LandingCity(canvas);
city.resize(); city.start();
addEventListener('resize', () => city.resize());

const ui = (p) => store.setState((s) => ({ ui: { ...s.ui, ...p } }));
const emit = (fx) => store.getState().emit(fx);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const TASKS = ['Compare vendor pricing', 'Draft the pricing brief', 'Summarise the interviews', 'Check the competitor launch', 'Write the weekly report', 'Sort the support queue'];
const VIA = ['web', 'terminal', 'file', 'board', 'skill'];

// what each chapter shows: the camera state, and the events that keep that place alive
const CH = {
  hero: { enter: () => ui({ view: 'tower', floorId: null, execRoom: false }) },
  research: { dept: () => byName('Research') },
  growth: { dept: () => byName('Growth') },
  support: { dept: () => byName('Support') },
  exec: { enter: () => ui({ view: 'tower', floorId: null, execRoom: true }) },
  bell: { enter: () => { ui({ view: 'tower', floorId: null, execRoom: false }); emit({ k: 'ipo', symbol: 'MYCO' }); } },
  wide: { enter: () => ui({ view: 'tower', floorId: null, execRoom: false }) },
};
let current = null, lifeTimer = 0;
function setChapter(id) {
  if (id === current) return; current = id;
  const ch = CH[id]; if (!ch) return;
  document.body.dataset.chapter = id;
  if (ch.dept) { const d = ch.dept(); ui({ view: 'floor', floorId: d.id, execRoom: false }); life(d, true); }
  else ch.enter();
}
// a floor at work: the lead hands out tasks and tools light up, every few seconds
function life(d, now) {
  clearTimeout(lifeTimer);
  const go = () => {
    if (store.getState().ui.floorId !== d.id) return;
    const ws = (d.workers ?? []).map((w) => w.id ?? w.key ?? w).filter(Boolean);
    if (ws.length && Math.random() < 0.6) emit({ k: 'delegate', dept: d.id, to: pick(ws), title: pick(TASKS) });
    else emit({ k: 'toolUse', dept: d.id, agent: ws.length ? pick(ws) : 'chief', via: pick(VIA) });
    lifeTimer = setTimeout(go, 3800 + Math.random() * 2200);
  };
  lifeTimer = setTimeout(go, now ? 1200 : 3000);
}
// the tower view between chapters: jobs arriving and work hopping between floors
setInterval(() => {
  const s = store.getState(); if (s.ui.view !== 'tower' || s.ui.execRoom || document.hidden) return;
  const d = pick(depts), o = pick(depts);
  if (o.id !== d.id && Math.random() < 0.5) emit({ k: 'questRequest', dept: d.id, from: o.id });
  else emit({ k: 'questStarted', dept: d.id, title: pick(TASKS) });
}, 4200);

// scroll: the chapter whose marker crosses the middle of the screen is on; the hero zooms in as you leave it
const marks = [...document.querySelectorAll('[data-ch]')];
const walk = document.getElementById('walk');
function onScroll() {
  const mid = innerHeight * 0.5; let on = 'hero';
  for (const m of marks) if (m.getBoundingClientRect().top < mid) on = m.dataset.ch;
  setChapter(on);
  const r = walk.getBoundingClientRect();
  const heroP = Math.min(1, Math.max(0, -r.top / innerHeight));
  city.heroZoom = 1 + 0.35 * heroP; city.heroLift = -40 * heroP;
  if (on === 'wide') { city.heroZoom = 0.92; city.heroLift = 0; }
  // the lower sections cover the city: stop drawing it while it is out of sight
  const covered = r.bottom < 0;
  if (covered && !city._stopped) { city.stop(); city._stopped = true; } else if (!covered && city._stopped) { city.start(); city._stopped = false; }
  document.body.classList.toggle('scrolled', scrollY > 40);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
document.addEventListener('visibilitychange', () => { if (document.hidden) { city.stop(); city._stopped = true; } else onScroll(); });

/* Pixel-dot panels: a grid of soft squares lit by a field that moves with time and follows the pointer. */
const FIELDS = {
  // NEAR AI Cloud: a signal sweeping out from the centre
  signal: (x, y, t, w, h) => { const d = Math.hypot(x - w / 2, y - h / 2); return 0.5 + 0.5 * Math.sin(d * 0.55 - t * 2.4) * Math.exp(-d / (w * 0.6)); },
  // Agent Market: jobs arriving as bars that rise and settle
  ripple: (x, y, t, w, h) => { const c = Math.floor(x); const lvl = (0.5 + 0.45 * Math.sin(t * 1.3 + c * 0.7) * Math.sin(t * 0.7 + c * 0.31)) * h; return h - y < lvl ? 0.35 + 0.65 * ((h - y) / Math.max(1, lvl)) : 0.05; },
  // Sputnik DAO: proposals as a spectrum that rises when approved
  spectrum: (x, y, t, w, h) => { const v = Math.abs(Math.sin(x * 0.45 + t * 0.9) + Math.sin(x * 0.17 - t * 1.7)) / 2; return (h - y) / h < v ? 0.25 + 0.75 * v : 0.04; },
};
const panels = [...document.querySelectorAll('canvas.dots')].map((cv) => ({ cv, g: cv.getContext('2d'), f: FIELDS[cv.dataset.field], col: cv.dataset.col, px: -99, py: -99, on: false }));
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { const p = panels.find((q) => q.cv === e.target); if (p) p.on = e.isIntersecting; })) : null;
panels.forEach((p) => {
  io ? io.observe(p.cv) : (p.on = true);
  p.cv.addEventListener('pointermove', (e) => { const r = p.cv.getBoundingClientRect(); p.px = (e.clientX - r.left) / r.width; p.py = (e.clientY - r.top) / r.height; });
  p.cv.addEventListener('pointerleave', () => { p.px = p.py = -99; });
});
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
function drawDots(now) {
  const t = still ? 2 : now / 1000;
  for (const p of panels) {
    if (!p.on) continue;
    const { cv, g } = p, dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cell = W < 360 ? 11 : 13, cols = Math.floor(W / cell), rows = Math.floor(H / cell), ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2;
    const [r, gg, b] = hex(p.col);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      let v = Math.max(0, Math.min(1, p.f(i, j, t, cols, rows)));
      const dx = i / cols - p.px, dy = j / rows - p.py, near = Math.exp(-(dx * dx + dy * dy) * 60); v = Math.min(1, v + near * 0.8);
      g.fillStyle = v < 0.12 ? 'rgba(255,255,255,0.05)' : `rgba(${r},${gg},${b},${(0.15 + 0.85 * v).toFixed(3)})`;
      const s = cell - 3; g.beginPath(); g.roundRect ? g.roundRect(ox + i * cell, oy + j * cell, s, s, 2) : g.rect(ox + i * cell, oy + j * cell, s, s); g.fill();
    }
  }
  if (!still) requestAnimationFrame(drawDots);
}
requestAnimationFrame(drawDots);
