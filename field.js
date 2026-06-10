/* ============================================================
   DATA FIELD — mouse-reactive pipeline network on canvas
   driven by OS ticker (not rAF)
   ============================================================ */
(function () {
  const canvas = document.getElementById('field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let nodes = [], edges = [], packets = [];
  const mouse = { x: -9999, y: -9999, on: false };

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.min(64, Math.floor((w * h) / 26000));
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      bx: 0, by: 0,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.4 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));
    nodes.forEach(n => { n.bx = n.x; n.by = n.y; });

    // edges: each node links to up to 2 nearest neighbours
    edges = [];
    const LINK = Math.min(260, w / 4);
    for (let i = 0; i < nodes.length; i++) {
      const dists = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < LINK) dists.push([d, j]);
      }
      dists.sort((a, b) => a[0] - b[0]);
      dists.slice(0, 2).forEach(([, j]) => {
        if (!edges.some(e => (e.a === j && e.b === i))) edges.push({ a: i, b: j });
      });
    }
    packets = [];
    for (let k = 0; k < Math.min(18, edges.length); k++) spawnPacket();
  }

  function spawnPacket() {
    if (!edges.length) return;
    const e = edges[(Math.random() * edges.length) | 0];
    packets.push({ e, t: Math.random(), speed: 0.0004 + Math.random() * 0.0007, dir: Math.random() < 0.5 ? 1 : -1 });
  }

  addEventListener('resize', build);
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; });
  addEventListener('mouseout', () => { mouse.on = false; mouse.x = mouse.y = -9999; });
  build();

  let scrollFade = 1;
  addEventListener('scroll', () => {
    scrollFade = Math.max(0.15, 1 - window.scrollY / (innerHeight * 1.4));
  }, { passive: true });

  OS.onTick((now, dt) => {
    if (OS.reduce) return;
    ctx.clearRect(0, 0, w, h);

    // update nodes (drift + return to base + mouse repel)
    for (const n of nodes) {
      n.bx += n.vx; n.by += n.vy;
      if (n.bx < 0 || n.bx > w) n.vx *= -1;
      if (n.by < 0 || n.by > h) n.vy *= -1;
      let tx = n.bx, ty = n.by;
      if (mouse.on) {
        const dx = n.bx - mouse.x, dy = n.by - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 180) { const f = (1 - d / 180) * 46; tx += dx / d * f; ty += dy / d * f; }
      }
      n.x += (tx - n.x) * 0.08;
      n.y += (ty - n.y) * 0.08;
      n.pulse += dt * 0.003;
    }

    // edges
    ctx.lineWidth = 1;
    for (const e of edges) {
      const a = nodes[e.a], b = nodes[e.b];
      ctx.strokeStyle = `oklch(0.85 0.14 195 / ${(0.10 * scrollFade).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    // packets travelling along edges
    for (const p of packets) {
      p.t += p.speed * p.dir * dt;
      if (p.t > 1 || p.t < 0) {
        p.e = edges[(Math.random() * edges.length) | 0];
        p.t = p.dir > 0 ? 0 : 1;
        p.speed = 0.0004 + Math.random() * 0.0007;
      }
      const a = nodes[p.e.a], b = nodes[p.e.b];
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, `oklch(0.92 0.13 195 / ${(0.9 * scrollFade).toFixed(2)})`);
      g.addColorStop(1, 'oklch(0.92 0.13 195 / 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    }

    // nodes
    for (const n of nodes) {
      const glow = 0.45 + Math.sin(n.pulse) * 0.25;
      ctx.fillStyle = `oklch(0.85 0.14 195 / ${(glow * scrollFade).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
  });
})();
