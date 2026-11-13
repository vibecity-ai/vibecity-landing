/* Vibe City landing: hero zoom on scroll, the pinned gameplay screen, lazy videos, the trailer modal.
   Everything animates transform and opacity only, and every video plays only while it is on screen. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = $('.nav'), hero = $('.hero'), heroMedia = $('.hero-media'), heroIn = $('.hero-in'), heroVid = $('.hero-video');
  const dim = document.createElement('div'); dim.className = 'hero-dim'; $('.hero-pin').insertBefore(dim, heroIn);
  const steps = $$('.step'), tabs = $$('.gp-tabs a'), clips = $$('.clip'), screen = $('.screen'), col = $('.gp-screen-col');
  const play = (v) => { if (!v) return; if (!v.src && v.dataset.src) v.src = v.dataset.src; const p = v.play(); if (p) p.catch(() => {}); };
  const pause = (v) => { if (v && !v.paused) v.pause(); };

  let active = -1;
  const setStep = (i) => {
    if (i === active) return; active = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    tabs.forEach((t, k) => t.classList.toggle('on', k === i));
    screen.style.setProperty('--glow', getComputedStyle(steps[i]).getPropertyValue('--c'));
    clips.forEach((v, k) => {
      v.classList.toggle('on', k === i);
      if (k === i) { if (v.src) v.currentTime = 0; play(v); }
      else { pause(v); if (k === i + 1 && !v.src) { v.src = v.dataset.src; v.preload = 'auto'; } }
    });
  };

  let gpVisible = false, heroVisible = true, queued = false;
  const update = () => {
    queued = false;
    const y = scrollY, vh = innerHeight;
    nav.classList.toggle('solid', y > vh * 0.5);
    const range = Math.max(1, hero.offsetHeight - vh), p = Math.min(1, Math.max(0, y / range));
    if (heroVisible) {
      if (!reduce) heroMedia.style.transform = `scale(${1 + p * 0.3})`;
      heroIn.style.opacity = String(Math.max(0, 1 - p * 2.4));
      heroIn.style.transform = `translateY(${-p * 70}px)`;
      heroIn.style.visibility = p > 0.45 ? 'hidden' : '';
      dim.style.opacity = String(p * 0.8);
    }
    if (gpVisible) {
      const phone = innerWidth <= 900, cb = phone ? col.getBoundingClientRect().bottom : 0;
      const line = phone ? cb + (vh - cb) * 0.35 : vh * 0.55;
      let i = 0; steps.forEach((s, k) => { if (s.getBoundingClientRect().top < line) i = k; });
      setStep(i);
    }
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const t = e.target;
    if (t === hero) { heroVisible = e.isIntersecting; e.isIntersecting ? play(heroVid) : pause(heroVid); }
    else if (t.classList.contains('gp')) {
      gpVisible = e.isIntersecting;
      if (gpVisible) { if (active < 0) setStep(0); else play(clips[active]); onScroll(); } else clips.forEach(pause);
    } else if (t.classList.contains('finale')) { e.isIntersecting ? play($('.finale-video')) : pause($('.finale-video')); }
  }), { rootMargin: '25% 0px' });
  [hero, $('.gp'), $('.finale')].forEach((el) => io.observe(el));

  // the screen loads its first clip a little before you reach it
  new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { const v = clips[0]; if (!v.src) { v.src = v.dataset.src; v.preload = 'auto'; } o.disconnect(); } }, { rootMargin: '120% 0px' }).observe($('.gp'));

  tabs.forEach((t) => t.addEventListener('click', (e) => {
    e.preventDefault();
    const s = steps[+t.dataset.i], phone = innerWidth <= 900;
    const off = phone ? col.getBoundingClientRect().height + 56 : (innerHeight - s.offsetHeight) / 2;
    scrollTo({ top: s.getBoundingClientRect().top + scrollY - (phone ? off : Math.max(0, off)), behavior: reduce ? 'auto' : 'smooth' });
  }));

  // reveal on scroll
  if (!reduce) {
    const rv = $$('.intro > *, .sec-h, .tr-poster, .stack, .finale-in > *, .foot > *');
    rv.forEach((el) => el.classList.add('rv'));
    const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    rv.forEach((el) => ro.observe(el));
  }

  // trailer: opened by a click, so it can play with sound
  const modal = $('#trailer-modal'), tv = $('#trailer-video');
  const open = () => { modal.hidden = false; document.body.style.overflow = 'hidden'; tv.muted = false; play(tv); $('.modal-x').focus(); };
  const close = () => { pause(tv); modal.hidden = true; document.body.style.overflow = ''; };
  $$('[data-trailer]').forEach((b) => b.addEventListener('click', open));
  $('.modal-x').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  update();
})();
