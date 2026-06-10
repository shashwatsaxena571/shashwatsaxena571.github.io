/* ============================================================
   BOOT — cinematic terminal intro
   ============================================================ */
(function () {
  const boot = document.getElementById('boot');
  const out = document.getElementById('bootlog');
  const bar = document.getElementById('bootbar');
  const skip = document.getElementById('bootskip');
  if (!boot) { window.__startSite && window.__startSite(); return; }

  let finished = false;
  const finish = (remember) => {
    if (finished) return; finished = true;
    if (remember) { try { localStorage.setItem('sxn_skipboot', '1'); } catch (e) {} }
    OS.animate(620, e => { boot.style.opacity = 1 - e; }, {
      ease: OS.easeInOut,
      onDone: () => { boot.style.display = 'none'; window.__startSite && window.__startSite(); }
    });
  };

  // play every visit, except for visitors who explicitly skipped before, or reduced-motion
  let optedOut = false;
  try { optedOut = localStorage.getItem('sxn_skipboot') === '1'; } catch (e) {}
  if (optedOut || OS.reduce) {
    boot.style.display = 'none';
    window.__startSite && window.__startSite();
    return;
  }

  const lines = [
    ['SHASHWAT.SYS', 'v4.0.26', 'head'],
    ['booting kernel', 'OK'],
    ['mounting data lake  s3://core', 'OK'],
    ['spinning up spark cluster', 'OK'],
    ['kafka streams · 12 topics', 'LIVE'],
    ['airflow scheduler', 'OK'],
    ['rag pipeline · vector store', 'OK'],
    ['loading operator profile', 'OK'],
    ['uptime guarantee', '99.9%'],
  ];

  let i = 0;
  function next() {
    if (i >= lines.length) {
      bar.style.width = '100%';
      const done = document.createElement('div');
      done.className = 'boot-ready';
      done.textContent = 'SYSTEM READY';
      out.appendChild(done);
      OS.scramble(done, { dur: 600, chars: '01<>/_=+#' });
      setTimeout(finish, 1100);
      return;
    }
    const [label, status, kind] = lines[i];
    const row = document.createElement('div');
    row.className = 'boot-row' + (kind === 'head' ? ' boot-head' : '');
    if (kind === 'head') {
      row.innerHTML = `<span class="bl">${label}</span><span class="bs">${status}</span>`;
    } else {
      row.innerHTML = `<span class="bl"><i>›</i> ${label}</span><span class="bdots"></span><span class="bs">${status}</span>`;
    }
    out.appendChild(row);
    bar.style.width = ((i + 1) / (lines.length + 1) * 100).toFixed(0) + '%';
    i++;
    setTimeout(next, kind === 'head' ? 420 : 150 + Math.random() * 160);
  }
  setTimeout(next, 300);

  skip && skip.addEventListener('click', () => finish(true));
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === 'Escape') && boot.style.display !== 'none') finish(true);
  });
})();
