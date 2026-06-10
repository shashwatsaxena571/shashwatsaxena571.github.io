/* ============================================================
   MAIN — interactions, reveals, HUD, nav
   ============================================================ */
(function () {
  const fine = matchMedia('(pointer:fine)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* ---------- custom cursor ---------- */
  if (fine && !OS.reduce) {
    document.body.classList.add('has-cursor');
    const dot = document.createElement('div'); dot.className = 'cur-dot';
    const ring = document.createElement('div'); ring.className = 'cur-ring';
    document.body.append(dot, ring);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    });
    OS.onTick(() => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
    });
    const hot = 'a,button,.btn,.card,.chip,.soc,.navlink,[data-tilt]';
    document.addEventListener('mouseover', e => { if (e.target.closest(hot)) document.body.classList.add('cur-hot'); });
    document.addEventListener('mouseout', e => { if (e.target.closest(hot)) document.body.classList.remove('cur-hot'); });
  }

  /* ---------- magnetic ---------- */
  if (fine && !OS.reduce) {
    $$('[data-mag]').forEach(el => {
      const strength = parseFloat(el.dataset.mag) || 0.3;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px,${(e.clientY - r.top - r.height / 2) * strength}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- tilt ---------- */
  if (fine && !OS.reduce) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
        const sh = card.querySelector('.card-sheen');
        if (sh) sh.style.setProperty('--mx', `${(px + 0.5) * 100}%`), sh.style.setProperty('--my', `${(py + 0.5) * 100}%`);
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- reveal + scramble + counters on scroll ---------- */
  const queue = $$('.reveal').map(el => ({ el, kind: 'reveal' }))
    .concat($$('[data-scramble]').map(el => ({ el, kind: 'scramble' })))
    .concat($$('[data-count]').map(el => ({ el, kind: 'count' })));

  function delayFor(el) {
    return el.classList.contains('d4') ? 320 :
           el.classList.contains('d3') ? 240 :
           el.classList.contains('d2') ? 160 :
           el.classList.contains('d1') ? 80 : 0;
  }
  function fmt(v, el) {
    const dec = parseInt(el.dataset.dec || '0', 10);
    return (el.dataset.prefix || '') + v.toFixed(dec) + (el.dataset.suffix || '');
  }

  function scan() {
    const vh = innerHeight || document.documentElement.clientHeight;
    for (let i = queue.length - 1; i >= 0; i--) {
      const { el, kind } = queue[i];
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        if (kind === 'reveal') OS.reveal(el, delayFor(el));
        else if (kind === 'scramble') OS.scramble(el, { delay: delayFor(el), dur: 900 });
        else if (kind === 'count') {
          const to = parseFloat(el.dataset.count);
          OS.count(0, to, 1300, v => { el.textContent = fmt(v, el); }, { delay: delayFor(el) });
        }
        queue.splice(i, 1);
      }
    }
  }
  scan();
  addEventListener('scroll', scan, { passive: true });
  addEventListener('resize', scan);
  setTimeout(scan, 140);
  addEventListener('load', scan);
  // safety net: never leave on-screen content hidden
  setTimeout(() => {
    const vh = innerHeight;
    $$('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) { el.style.opacity = ''; el.style.transform = ''; el.classList.add('in'); }
    });
  }, 2000);

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 20);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const toggle = $('#navToggle'), links = $('#navLinks');
  toggle && toggle.addEventListener('click', () => links.classList.toggle('open'));
  links && $$('#navLinks a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* active section + rail progress */
  const rail = $('#rail');
  const ids = ['hero', 'about', 'work', 'impact', 'stack', 'journey', 'writing', 'research', 'contact'];
  function active() {
    const mid = scrollY + innerHeight * 0.4;
    let cur = ids[0];
    for (const id of ids) { const s = document.getElementById(id); if (s && s.offsetTop <= mid) cur = id; }
    $$('#navLinks a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    if (rail) $$('#rail .rail-item').forEach(it => it.classList.toggle('on', it.dataset.id === cur));
    const doc = document.documentElement;
    const p = scrollY / (doc.scrollHeight - innerHeight || 1);
    const fill = $('#railfill'); if (fill) fill.style.height = (p * 100).toFixed(1) + '%';
    const pct = $('#scrollpct'); if (pct) pct.textContent = String(Math.round(p * 100)).padStart(3, '0');
  }
  active(); addEventListener('scroll', active, { passive: true }); addEventListener('resize', active);

  /* ---------- live HUD ---------- */
  const recEl = $('#hud-records');
  if (recEl) {
    let rec = 4820374;
    OS.onTick((now, dt) => { rec += dt * 6.2 * (0.6 + Math.random()); recEl.textContent = Math.floor(rec).toLocaleString('en-US'); });
  }
  const clockEl = $('#hud-clock');
  if (clockEl) OS.onTick(() => {
    const d = new Date();
    clockEl.textContent = d.toLocaleTimeString('en-GB', { hour12: false }) + ' IST';
  });

  /* ---------- hero start (after boot) ---------- */
  window.__startSite = function () {
    document.body.classList.add('booted');
    $$('#hero .reveal').forEach(el => OS.reveal(el, delayFor(el)));
    $$('#hero [data-scramble]').forEach(el => OS.scramble(el, { delay: delayFor(el) + 120, dur: 1000 }));
    // hero HUD counters
    $$('#hero [data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count);
      OS.count(0, to, 1500, v => { el.textContent = fmt(v, el); }, { delay: 300 });
    });
    typeRoles();
  };

  /* ---------- typed role line ---------- */
  function typeRoles() {
    const t = $('#typed'); if (!t) return;
    const roles = ['DATA ENGINEER', 'ETL & BIG-DATA PIPELINES', 'AWS · AZURE · DATABRICKS', 'GENAI / RAG SYSTEMS', 'PH.D · EXPLAINABLE AI'];
    if (OS.reduce) { t.textContent = roles[0]; return; }
    let r = 0, c = 0, del = false, lastT = performance.now(), wait = 0;
    OS.onTick(now => {
      if (now - lastT < (del ? 36 : 70) + wait) return;
      lastT = now; wait = 0;
      const word = roles[r];
      c += del ? -1 : 1;
      t.textContent = word.slice(0, c);
      if (!del && c >= word.length) { del = true; wait = 1400; }
      else if (del && c <= 0) { del = false; r = (r + 1) % roles.length; wait = 260; }
    });
  }

  /* if boot.js missing, start anyway */
  if (!document.getElementById('boot')) window.__startSite();
})();
