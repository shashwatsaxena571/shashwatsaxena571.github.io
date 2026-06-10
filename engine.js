/* ============================================================
   OS ENGINE — setTimeout-driven animation core
   (the preview freezes rAF/CSS timelines; this does not)
   ============================================================ */
window.OS = (function () {
  const subs = new Set();
  let last = performance.now();
  function frame() {
    const now = performance.now();
    const dt = Math.min(60, now - last);
    last = now;
    subs.forEach(fn => { try { fn(now, dt); } catch (e) {} });
    setTimeout(frame, 16);
  }
  frame();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  return {
    reduce,
    easeOut, easeInOut,
    now: () => performance.now(),
    onTick(fn) { subs.add(fn); return () => subs.delete(fn); },

    /* one-shot timed animation; cb(progress 0..1), returns canceller */
    animate(dur, cb, { delay = 0, ease = easeOut, onDone } = {}) {
      const start = performance.now() + delay;
      const off = this.onTick(now => {
        let t = (now - start) / dur;
        if (t < 0) { cb(0); return; }
        t = Math.min(1, t);
        cb(ease(t));
        if (t >= 1) { off(); onDone && onDone(); }
      });
      return off;
    },

    /* reveal an element from hidden -> shown */
    reveal(el, delay = 0) {
      if (this.reduce) { el.style.opacity = ''; el.style.transform = ''; el.classList.add('in'); return; }
      this.animate(760, e => {
        el.style.opacity = e;
        el.style.transform = `translateY(${(1 - e) * 30}px)`;
      }, { delay, onDone: () => { el.style.opacity = ''; el.style.transform = ''; el.classList.add('in'); } });
    },

    /* text decode/scramble into el (uses el.dataset.text or current text) */
    scramble(el, { dur = 1100, delay = 0, chars = '01<>-_\\/[]{}=+*^?#%ABCDEF' } = {}) {
      const finalText = (el.dataset.text != null ? el.dataset.text : el.textContent);
      el.dataset.text = finalText;
      if (this.reduce) { el.textContent = finalText; return; }
      const start = performance.now() + delay;
      el.textContent = '';
      const off = this.onTick(now => {
        const t = now - start;
        if (t < 0) return;
        const p = Math.min(1, t / dur);
        const lock = Math.floor(p * finalText.length);
        let out = '';
        for (let i = 0; i < finalText.length; i++) {
          const c = finalText[i];
          if (i < lock || c === ' ' || c === '\n') out += c;
          else out += chars[(Math.random() * chars.length) | 0];
        }
        el.textContent = out;
        if (p >= 1) { el.textContent = finalText; off(); }
      });
    },

    /* tween a number for counters; cb(value) */
    count(from, to, dur, cb, { delay = 0, ease = easeOut, onDone } = {}) {
      return this.animate(dur, e => cb(from + (to - from) * e), { delay, ease, onDone });
    },
  };
})();
