/* Animación del gol (Torneo Aniversario).
   Escena en canvas con tres capas fotográficas: estadio, jugador (26 poses) y balón.
   Coordenadas de la escena: 1536 x 864 (16:9). La cámara, el color y los efectos se calculan aquí.

   Tiempos (segundos reales, ciclo de 7.1 s):
     0.0 – 1.0   Preparación: plano abierto, el jugador respira, la cámara avanza despacio
     1.0 – 1.7   Carrera hacia el balón (velocidad normal)
     1.7 – 2.6   Golpe en cámara lenta (el contacto ocurre cerca de 2.2 s)
     2.6 – 3.5   Vuelo del balón, la cámara lo sigue hacia la portería
     3.5 – 3.6   Impacto en la red: congelado breve, destello y sacudida
     3.6 – 4.9   Red ondulando, aparece ¡GOOOL!, confeti
     4.9 – 7.1   Celebración, desvanecido y vuelta a empezar */
(function () {
  'use strict';

  var stage = document.getElementById('stageGol');
  if (!stage) return;
  var canvas = stage.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var golEl = document.getElementById('golText');
  var scoreEl = document.getElementById('scoreA');
  var clockEl = document.getElementById('clock');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 1536, H = 864, TOTAL = 7.1, FADE_OUT = 6.6;
  var BASE = 'media/gol/';
  var TAU = Math.PI * 2;

  /* ---------- utilidades ---------- */
  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, x)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* Interpolación monótona (sin rebotes): sirve para el tiempo y para la cámara */
  function pchip(xs, ys, flat) {
    var n = xs.length, h = [], d = [], m = [], i;
    for (i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
    m[0] = flat ? 0 : d[0];
    m[n - 1] = flat ? 0 : d[n - 2];
    for (i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        var w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return function (x) {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      i = 0; while (x > xs[i + 1]) i++;
      var t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] +
             (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
  }

  /* ---------- reloj de la escena: tiempo real -> tiempo de la jugada ----------
     Velocidad de la jugada por tramo: 0.42x · 0.87x · 0.26x (golpe) · 0.82x (vuelo) · 0.41x (impacto) · 0.61x · 0.33x */
  var warp = pchip(
    [0, 1.05, 1.72, 2.62, 3.45, 3.62, 4.90, 6.70, 7.10],
    [0, 0.44, 1.02, 1.25, 1.95, 2.02, 2.80, 3.40, 3.50]
  );
  function realTimeOf(story) {
    for (var T = 0; T < TOTAL; T += 0.002) if (warp(T) >= story) return T;
    return TOTAL;
  }

  /* ---------- geometría ---------- */
  var sxk = W / 1672, syk = H / 941;
  function sp(p) { return [p[0] * sxk, p[1] * syk]; }
  var FRONT = [[1084, 384], [1547, 345], [1549, 575], [1084, 550]].map(sp);
  var BACK = [[1130, 398], [1581, 357], [1628, 563], [1170, 544]].map(sp);
  var BALL0 = { x: 738, y: 759, r: 41 };
  var ROOT = [410, 800], BODY_H = 690;
  var CONTACT = 34 / 30, LAUNCH = 35 / 30, ARRIVAL = 2.0, GOAL_T = 2.32;
  var HIT = { u: 0.5, v: 0.56 };

  function quad(q, u, v) {
    return [
      mix(mix(q[0][0], q[1][0], u), mix(q[3][0], q[2][0], u), v),
      mix(mix(q[0][1], q[1][1], u), mix(q[3][1], q[2][1], u), v)
    ];
  }
  var HIT_PT = quad(BACK, HIT.u, HIT.v), FLOOR_PT = quad(BACK, HIT.u, 1);
  var KICK_DIR = Math.atan2(HIT_PT[1] - BALL0.y, HIT_PT[0] - BALL0.x);

  var T_CONTACT = realTimeOf(CONTACT);
  var T_NET = realTimeOf(ARRIVAL);
  var T_GOAL = realTimeOf(GOAL_T);

  /* Luces del estadio (posiciones en la foto de 1672 x 941) */
  var LIGHTS = [[45, 20, 150, 1], [155, 48, 200, 1.2], [335, 92, 170, 1], [510, 138, 180, 1.1],
                [730, 178, 150, 0.9], [950, 236, 130, 0.8], [1460, 160, 120, 0.7], [1590, 135, 130, 0.8]]
    .map(function (l, i) { var p = sp(l); return { x: p[0], y: p[1], r: l[2], k: l[3], ph: i * 1.3 }; });

  /* ---------- poses del jugador (hoja, columna de la hoja, punto de apoyo, altura) ---------- */
  var POSE_DATA = [
    ['a', 245, 595, 582], ['a', 231, 595, 580], ['a', 220, 595, 577], ['a', 245, 596, 579], ['a', 231, 596, 577], ['a', 222, 596, 575],
    ['b', 297, 616, 599], ['b', 297, 616, 598], ['b', 300, 617, 601], ['b', 300, 617, 601],
    ['c', 312, 606, 591], ['c', 312, 606, 591], ['c', 312, 606, 593], ['c', 312, 606, 592],
    ['d', 286, 609, 593], ['d', 282, 609, 590], ['d', 284, 611, 598], ['d', 282, 611, 597],
    ['e', 301, 611, 603], ['e', 300, 611, 603], ['e', 297, 612, 606], ['e', 278, 612, 605],
    ['f', 300, 616, 600], ['f', 300, 616, 600], ['f', 300, 617, 600], ['f', 300, 616, 599]
  ];
  var POSES = [], slot = {};
  POSE_DATA.forEach(function (d) {
    var n = slot[d[0]] = (slot[d[0]] === undefined ? 0 : slot[d[0]] + 1);
    var wide = d[0] === 'a';
    var cw = wide ? 418 : 627, cols = wide ? 3 : 2;
    POSES.push({ sheet: d[0], sx: (n % cols) * cw, sy: Math.floor(n / cols) * 627, sw: cw, sh: 627, ax: d[1], ay: d[2], ht: d[3] });
  });
  /* [segundo de la jugada, pose]: la pose 12 es el contacto con el balón */
  var SCHED = [[0, 0], [14, 1], [16, 2], [18, 3], [20, 4], [21, 5], [22, 6], [23, 7], [24, 8], [25, 9],
               [26, 22], [27, 23], [28, 24], [29, 25], [30, 10], [32, 11], [34, 12], [36, 13], [38, 14],
               [40, 15], [42, 16], [44, 17], [46, 18], [48, 19], [51, 20], [54, 21]]
    .map(function (e) { return [e[0] / 30, e[1]]; });

  /* ---------- cámara: zoom y centro de la vista según el tiempo de la jugada ---------- */
  var CAM_T = [0, 1.04, 1.17, 2.33, 3.5];
  var camS = pchip(CAM_T, [1.0, 1.12, 1.21, 1.76, 1.86], true);
  var camX = pchip(CAM_T, [768, 690, 700, 1100, 1110], true);
  var camY = pchip(CAM_T, [432, 478, 470, 424, 432], true);

  /* ---------- elementos aleatorios con semilla fija (el ciclo siempre se ve igual) ---------- */
  var rnd = mulberry32(15);
  var FLASHES = [];
  function addFlashes(n, t0, t1) {
    for (var i = 0; i < n; i++) FLASHES.push({ t: t0 + rnd() * (t1 - t0), x: rnd() * W, y: 215 + rnd() * 235, r: 2.5 + rnd() * 4, d: 0.05 + rnd() * 0.09 });
  }
  addFlashes(22, 0.2, T_GOAL);
  addFlashes(70, T_GOAL, FADE_OUT);

  var CONFETTI = [], CONF_COLORS = ['#12924a', '#6ef0a2', '#0f5fd1', '#5aa8ff', '#ffffff', '#ffffff'];
  for (var ci = 0; ci < 80; ci++) {
    CONFETTI.push({
      t: T_GOAL + 0.05 + rnd() * 0.6, x: W * (0.28 + rnd() * 0.72), y: -20 - rnd() * 60,
      vx: (rnd() - 0.5) * 90, v0: 40 + rnd() * 120, vt: 110 + rnd() * 90, sw: 12 + rnd() * 26,
      f: 2 + rnd() * 3, ph: rnd() * TAU, w: 6 + rnd() * 7, h: 3 + rnd() * 4, c: CONF_COLORS[Math.floor(rnd() * CONF_COLORS.length)], rs: 3 + rnd() * 6
    });
  }

  var GRASS = [];
  for (var gi = 0; gi < 18; gi++) {
    GRASS.push({ vx: 40 + rnd() * 330, vy: -90 - rnd() * 210, len: 5 + rnd() * 7, c: rnd() < 0.7 ? (rnd() < 0.5 ? '#64883b' : '#9fb866') : '#4a3a24' });
  }

  var grain = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), d = g.createImageData(128, 128), r = mulberry32(3);
    for (var i = 0; i < d.data.length; i += 4) { var v = 128 + (r() - 0.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    return c;
  })();

  /* ---------- imágenes y tamaño ---------- */
  var img = {}, ready = false, k = 1, ps = 1;
  var PW = 800, PH = 740, RX = 380, RY = 722;
  var pc = document.createElement('canvas'), pctx = pc.getContext('2d');

  function load(name, file) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { img[name] = im; resolve(true); };
      im.onerror = function () { resolve(false); };
      im.src = BASE + file;
    });
  }
  function loadAll() {
    var jobs = [load('estadio', 'estadio.webp'), load('balon', 'balon.webp')];
    'abcdef'.split('').forEach(function (n) { jobs.push(load(n, 'poses-' + n + '.webp')); });
    return Promise.all(jobs).then(function (r) { return r.every(Boolean); });
  }

  function resize() {
    var w = stage.getBoundingClientRect().width || 700;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    k = clamp(w * dpr / W, 0.4, 1);
    canvas.width = Math.round(W * k);
    canvas.height = Math.round(H * k);
    ps = clamp(k * 1.2, 0.5, 1.25);
    pc.width = Math.round(PW * ps);
    pc.height = Math.round(PH * ps);
    if (ready) draw(curT);
  }

  /* ---------- red de la portería ---------- */
  function netPt(u, v, t) {
    var p = quad(BACK, u, v), dt = t - ARRIVAL;
    if (dt <= 0) return p;
    var dist = Math.hypot((u - HIT.u) * 1.4, (v - HIT.v) * 0.72);
    var local = dt - dist * 0.27;
    if (local <= 0) return p;
    var pin = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
    var wave = 40 * Math.exp(-local * 3.1) * Math.sin(local * 19) * Math.exp(-dist * 4.4) * pin;
    var belly = 16 * Math.exp(-local * 1.5) * Math.exp(-dist * 3.2) * pin;
    return [p[0] + wave + belly, p[1] - (wave + belly) * 0.2];
  }
  function polyline(pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }
  function gridPath(q, nx, ny) {
    var i, u, v;
    for (i = 0; i <= nx; i++) { u = i / nx; polyline([quad(q, u, 0), quad(q, u, 1)]); }
    for (i = 0; i <= ny; i++) { v = i / ny; polyline([quad(q, 0, v), quad(q, 1, v)]); }
  }
  function strokeNet(lw, alpha, build) {
    ctx.beginPath(); build();
    ctx.lineWidth = lw * 2.2; ctx.strokeStyle = 'rgba(3,10,24,' + alpha * 0.28 + ')'; ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(240,247,243,' + alpha + ')'; ctx.stroke();
  }
  function drawNet(t, camZoom) {
    var lw = Math.max(0.8, 1.05 / (k * camZoom));
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    /* sombra interior para dar profundidad al arco */
    ctx.fillStyle = 'rgba(4,12,30,0.17)';
    ctx.beginPath(); polyline([BACK[0], BACK[1], BACK[2], BACK[3]]); ctx.fill();

    strokeNet(lw, 0.5, function () { gridPath([FRONT[0], BACK[0], BACK[3], FRONT[3]], 8, 22); });
    strokeNet(lw, 0.62, function () { gridPath([FRONT[1], BACK[1], BACK[2], FRONT[2]], 8, 22); });
    strokeNet(lw, 0.66, function () { gridPath([FRONT[0], FRONT[1], BACK[1], BACK[0]], 52, 5); });

    var moving = t > ARRIVAL, i, j, pts;
    var nv = moving ? 44 : 1, nh = moving ? 80 : 1;
    strokeNet(lw * 1.05, 0.78, function () {
      for (i = 0; i <= 52; i++) { pts = []; for (j = 0; j <= nv; j++) pts.push(netPt(i / 52, j / nv, t)); polyline(pts); }
      for (j = 0; j <= 22; j++) { pts = []; for (i = 0; i <= nh; i++) pts.push(netPt(i / nh, j / 22, t)); polyline(pts); }
    });
    ctx.restore();
  }

  /* ---------- balón ---------- */
  function ballState(t) {
    var kk = BALL0.r / 12 - 1;
    var u = clamp((t - LAUNCH) / (ARRIVAL - LAUNCH));
    var v = (1 + kk) * u / (1 + kk * u);
    var r = BALL0.r / (1 + kk * u);
    var x = mix(BALL0.x, HIT_PT[0], v);
    var y = mix(BALL0.y, HIT_PT[1], v) - 56 * Math.sin(Math.PI * u) / (1 + kk * u);
    var floor = mix(BALL0.y + BALL0.r, FLOOR_PT[1], v);
    var dt = t - ARRIVAL;
    if (dt > 0) {
      var net = netPt(HIT.u, HIT.v, t), q = clamp(dt / 0.63), att = 1 - ease(q);
      x = HIT_PT[0] + (net[0] - HIT_PT[0]) * att - 18 * ease(q);
      y = HIT_PT[1] + (net[1] - HIT_PT[1]) * att + (FLOOR_PT[1] - r - HIT_PT[1]) * q * q;
      if (dt > 0.63) {
        var b = dt - 0.63;
        x = HIT_PT[0] - 18 - Math.min(20, b * 19);
        y = FLOOR_PT[1] - r - 9 * Math.abs(Math.sin(b * 9)) * Math.exp(-b * 5);
      }
      floor = FLOOR_PT[1];
    }
    var dc = t - CONTACT;
    return {
      x: x, y: y, r: r, floor: floor, u: u,
      rot: u * 10 + Math.max(0, dt) * 1.5,
      squash: dc >= 0 && dc < 0.07 ? 0.16 * Math.sin(Math.PI * dc / 0.07) : 0
    };
  }
  function drawBallSprite(s, alpha) {
    var ratio = 0.971;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(s.x, s.y);
    if (s.squash) { ctx.rotate(KICK_DIR); ctx.scale(1 - s.squash, 1 + s.squash * 0.6); ctx.rotate(-KICK_DIR); }
    ctx.rotate(s.rot);
    ctx.drawImage(img.balon, -s.r * ratio, -s.r, 2 * s.r * ratio, 2 * s.r);
    ctx.restore();
  }
  function drawBall(t) {
    var s = ballState(t);
    /* desenfoque de movimiento: copias tenues del balón y una estela suave */
    if (t > LAUNCH && t < ARRIVAL + 0.02) {
      var prev = ballState(t - 0.05);
      var g = ctx.createLinearGradient(prev.x, prev.y, s.x, s.y);
      g.addColorStop(0, 'rgba(235,245,255,0)'); g.addColorStop(1, 'rgba(235,245,255,0.20)');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = s.r * 1.1;
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.restore();
      for (var j = 5; j >= 1; j--) drawBallSprite(ballState(t - j * 0.011), 0.3 * Math.pow(1 - j / 6, 1.5));
    }
    drawBallSprite(s, 1);
  }
  function radial(x, y, rx, ry, rgb, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(rx, ry);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawShadows(t) {
    radial(446, 803, 112, 13, '7,18,13', 0.44);
    radial(496, 819, 165, 15, '7,18,13', 0.14);
    var s = ballState(t), alt = Math.max(0, s.floor - s.y - s.r);
    radial(s.x, s.floor, 1.1 * s.r + alt * 0.09, Math.max(2, s.r * 0.18), '7,18,13', 0.31 / (1 + alt * 0.015));
  }

  /* ---------- jugador ---------- */
  function poseDraw(idx, alpha) {
    var p = POSES[idx], s = BODY_H / p.ht;
    pctx.globalAlpha = alpha;
    pctx.drawImage(img[p.sheet], p.sx, p.sy, p.sw, p.sh, RX - p.ax * s, RY - p.ay * s, p.sw * s, p.sh * s);
  }
  function schedIndex(t) {
    var i = 0;
    while (i + 1 < SCHED.length && t >= SCHED[i + 1][0]) i++;
    return i;
  }
  function drawPlayer(T, t) {
    var i = schedIndex(t);
    var cur = SCHED[i], nxt = SCHED[i + 1], p = 0;
    if (nxt) {
      var w = Math.min((nxt[0] - cur[0]) * 0.5, 0.05);
      p = ease((t - (nxt[0] - w)) / w);
    }
    pctx.setTransform(ps, 0, 0, ps, 0, 0);
    pctx.clearRect(0, 0, PW, PH);
    pctx.globalCompositeOperation = 'source-over';
    poseDraw(cur[1], 1 - p);
    if (p > 0.001) { pctx.globalCompositeOperation = 'lighter'; poseDraw(nxt[1], p); }
    pctx.globalAlpha = 1;

    /* luz integrada: luz fría de los reflectores arriba, rebote verde del césped abajo, sombra a la derecha */
    pctx.globalCompositeOperation = 'source-atop';
    var g1 = pctx.createLinearGradient(RX - 260, RY - 700, RX + 120, RY - 150);
    g1.addColorStop(0, 'rgba(170,205,255,0.20)'); g1.addColorStop(1, 'rgba(170,205,255,0)');
    pctx.fillStyle = g1; pctx.fillRect(0, 0, PW, PH);
    var g2 = pctx.createLinearGradient(0, RY - 260, 0, RY);
    g2.addColorStop(0, 'rgba(30,150,80,0)'); g2.addColorStop(1, 'rgba(40,170,95,0.26)');
    pctx.fillStyle = g2; pctx.fillRect(0, 0, PW, PH);
    var g3 = pctx.createLinearGradient(RX - 120, 0, RX + 300, 0);
    g3.addColorStop(0, 'rgba(3,10,24,0)'); g3.addColorStop(1, 'rgba(3,10,24,0.2)');
    pctx.fillStyle = g3; pctx.fillRect(0, 0, PW, PH);
    pctx.globalCompositeOperation = 'source-over';

    ctx.save();
    var breath = t < 0.46 ? 0.004 * Math.sin(T * 2.4) : 0;
    ctx.translate(ROOT[0], ROOT[1]);
    ctx.scale(1 - breath * 0.4, 1 + breath);
    ctx.drawImage(pc, -RX, -RY, PW, PH);
    ctx.restore();
  }

  /* ---------- césped, polvo, destellos ---------- */
  function drawGrass(t) {
    var dt = t - CONTACT;
    if (dt < 0 || dt > 0.5) return;
    var life = 1 - dt / 0.5, pr = 24 + dt * 200;
    ctx.save();
    ctx.translate(690, 800); ctx.scale(1.6, 0.5);
    var pg = ctx.createRadialGradient(0, 0, 0, 0, 0, pr);
    pg.addColorStop(0, 'rgba(176,206,128,' + 0.3 * life + ')'); pg.addColorStop(1, 'rgba(176,206,128,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, pr, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = life * 0.85; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    GRASS.forEach(function (g) {
      var x = 690 + g.vx * dt, y = 795 + g.vy * dt + 520 * dt * dt;
      var vy = g.vy + 1040 * dt, n = Math.hypot(g.vx, vy) || 1;
      ctx.strokeStyle = g.c;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - g.vx / n * g.len, y - vy / n * g.len); ctx.stroke();
    });
    ctx.restore();
  }
  function drawBlooms(T) {
    var after = T > T_NET ? Math.exp(-(T - T_NET) * 1.6) : 0, boost = 1 + 0.8 * after;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    LIGHTS.forEach(function (L) {
      var a = (0.2 + 0.07 * Math.sin(T * 1.7 + L.ph)) * L.k * boost;
      var g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, 'rgba(215,232,255,' + a + ')');
      g.addColorStop(0.35, 'rgba(120,170,255,' + a * 0.35 + ')');
      g.addColorStop(1, 'rgba(90,150,255,0)');
      ctx.fillStyle = g; ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    });
    ctx.restore();
  }
  function drawCrowdFlashes(T) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    FLASHES.forEach(function (f) {
      var u = (T - f.t) / f.d;
      if (u < 0 || u > 1) return;
      var a = Math.sin(Math.PI * u), r = f.r * (0.5 + a);
      var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 3);
      g.addColorStop(0, 'rgba(255,255,255,' + 0.95 * a + ')'); g.addColorStop(0.3, 'rgba(210,230,255,' + 0.4 * a + ')'); g.addColorStop(1, 'rgba(210,230,255,0)');
      ctx.fillStyle = g; ctx.fillRect(f.x - r * 3, f.y - r * 3, r * 6, r * 6);
    });
    ctx.restore();
  }
  function drawHitBurst(T) {
    var d = T - T_NET;
    if (d < 0 || d > 0.7) return;
    var a = Math.exp(-d * 6);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    var r = 110 + d * 520, g = ctx.createRadialGradient(HIT_PT[0], HIT_PT[1], 0, HIT_PT[0], HIT_PT[1], r);
    g.addColorStop(0, 'rgba(255,255,255,' + 0.65 * a + ')');
    g.addColorStop(0.35, 'rgba(110,240,162,' + 0.3 * a + ')');
    g.addColorStop(1, 'rgba(90,168,255,0)');
    ctx.fillStyle = g; ctx.fillRect(HIT_PT[0] - r, HIT_PT[1] - r, r * 2, r * 2);
    ctx.restore();
  }

  /* ---------- color de toda la imagen, en pantalla ---------- */
  function grade(T, s, tx, ty) {
    ctx.save();
    ctx.setTransform(k, 0, 0, k, 0, 0);

    ctx.globalCompositeOperation = 'soft-light';
    var gSky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    gSky.addColorStop(0, 'rgba(15,95,209,0.38)'); gSky.addColorStop(1, 'rgba(15,95,209,0)');
    ctx.fillStyle = gSky; ctx.fillRect(0, 0, W, H);
    var gGrass = ctx.createLinearGradient(0, H * 0.5, 0, H);
    gGrass.addColorStop(0, 'rgba(18,146,74,0)'); gGrass.addColorStop(1, 'rgba(40,185,100,0.4)');
    ctx.fillStyle = gGrass; ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'source-over';
    var gVig = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.68);
    gVig.addColorStop(0, 'rgba(2,8,20,0)'); gVig.addColorStop(1, 'rgba(2,8,20,0.46)');
    ctx.fillStyle = gVig; ctx.fillRect(0, 0, W, H);
    var gLow = ctx.createLinearGradient(0, H * 0.68, 0, H);
    gLow.addColorStop(0, 'rgba(4,12,26,0)'); gLow.addColorStop(1, 'rgba(4,12,26,0.5)');
    ctx.fillStyle = gLow; ctx.fillRect(0, 0, W, H);

    /* destello suave del contacto y estallido de color en el gol */
    ctx.globalCompositeOperation = 'screen';
    var dc = T - T_CONTACT;
    if (dc > 0 && dc < 0.35) { ctx.fillStyle = 'rgba(255,255,255,' + 0.13 * Math.exp(-dc * 12) + ')'; ctx.fillRect(0, 0, W, H); }
    var dn = T - T_NET;
    if (dn > 0) {
      var hx = tx + s * HIT_PT[0], hy = ty + s * HIT_PT[1];
      var glow = Math.exp(-dn * 1.15), flash = Math.exp(-dn * 9);
      var gG = ctx.createRadialGradient(hx, hy, 0, hx, hy, 560);
      gG.addColorStop(0, 'rgba(110,240,162,' + 0.5 * glow + ')');
      gG.addColorStop(0.5, 'rgba(90,168,255,' + 0.22 * glow + ')');
      gG.addColorStop(1, 'rgba(90,168,255,0)');
      ctx.fillStyle = gG; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,' + 0.5 * flash + ')'; ctx.fillRect(0, 0, W, H);
      var gF = ctx.createLinearGradient(0, 0, W, 0);
      gF.addColorStop(0, 'rgba(120,200,255,0)'); gF.addColorStop(0.5, 'rgba(190,235,255,' + 0.7 * Math.exp(-dn * 5) + ')'); gF.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.fillStyle = gF; ctx.fillRect(0, hy - 2, W, 4);
    }

    /* grano de película: une las capas para que parezcan una sola toma */
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(-Math.random() * 128, -Math.random() * 128);
    ctx.fillStyle = ctx.createPattern(grain, 'repeat');
    ctx.fillRect(0, 0, canvas.width + 128, canvas.height + 128);
    ctx.restore();
  }
  function drawConfetti(T) {
    if (T < T_GOAL) return;
    ctx.save(); ctx.setTransform(k, 0, 0, k, 0, 0);
    var fade = 1 - ease((T - 6.0) / 0.6);
    CONFETTI.forEach(function (c) {
      var age = T - c.t;
      if (age < 0) return;
      var e = (1 - Math.exp(-age * 3)) / 3;
      var x = c.x + c.vx * age + c.sw * Math.sin(age * c.f + c.ph);
      var y = c.y + c.vt * (age - e) - c.v0 * e;
      if (y > H + 20) return;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x, y); ctx.rotate(age * c.rs + c.ph);
      ctx.scale(1, Math.cos(age * c.f * 2.2 + c.ph));
      ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    });
    ctx.restore();
  }

  /* ---------- un cuadro completo ---------- */
  var curT = 0, loops = 0;
  function draw(T) {
    if (!ready) return;
    var t = warp(T);

    /* cámara: avance suave, pequeñas vibraciones de cámara en mano y sacudidas en el golpe y en la red */
    var s = camS(t), tx = W / 2 - s * camX(t), ty = H / 2 - s * camY(t);
    tx += 2 * Math.sin(T * 0.8) + 1.2 * Math.sin(T * 2.1 + 1);
    ty += 1.5 * Math.sin(T * 0.65 + 2) + 0.8 * Math.sin(T * 1.9);
    var dc = T - T_CONTACT, dn = T - T_NET;
    if (dc > 0) { var a1 = 4.5 * Math.exp(-dc * 12); tx += a1 * Math.sin(dc * 55); ty += a1 * 0.7 * Math.cos(dc * 61); }
    if (dn > 0) { var a2 = 11 * Math.exp(-dn * 8); tx += a2 * Math.sin(dn * 52); ty += a2 * 0.8 * Math.cos(dn * 47); }
    tx = clamp(tx, W - s * W, 0); ty = clamp(ty, H - s * H, 0);

    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(tx, ty); ctx.scale(s, s);
    ctx.drawImage(img.estadio, 0, 0, W, H);
    drawBlooms(T);
    drawCrowdFlashes(T);
    drawNet(t, s);
    drawShadows(t);
    drawPlayer(T, t);
    drawGrass(t);
    drawBall(t);
    drawHitBurst(T);
    ctx.restore();

    grade(T, s, tx, ty);
    drawConfetti(T);

    /* entrada y salida en negro (la primera vez entra directo desde la foto del estadio) */
    var fade = Math.max(loops > 0 ? 1 - ease(T / 0.5) : 0, ease((T - FADE_OUT) / (TOTAL - FADE_OUT)));
    if (fade > 0.001) {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.fillStyle = 'rgba(3,9,20,' + fade + ')'; ctx.fillRect(0, 0, W, H);
    }
    sync(T);
  }

  /* ---------- marcador y letrero de GOL ---------- */
  var scored = null, golPhase = -1, clockBase = 0;
  function sync(T) {
    var isGoal = T >= T_GOAL && T < TOTAL;
    if (isGoal !== scored) {
      scored = isGoal;
      scoreEl.textContent = isGoal ? '15' : '14';
      if (isGoal && !reduce) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
    }
    var phase = T < T_GOAL ? 0 : (T < FADE_OUT - 0.1 ? 1 : 2);
    if (phase !== golPhase) {
      golPhase = phase;
      golEl.classList.remove('on', 'out');
      void golEl.offsetWidth;
      if (phase === 1) golEl.classList.add('on');
      if (phase === 2) golEl.classList.add('out');
    }
    var secs = (88 * 60 + 12 + Math.floor(clockBase)) % (90 * 60 + 1);
    clockEl.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  }

  /* ---------- reproducción ---------- */
  var running = false, visible = false, last = 0, raf = 0, started = false;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    curT += dt; clockBase += dt;
    if (curT >= TOTAL) { curT -= TOTAL; loops++; }
    draw(curT);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (running || reduce || !ready || !visible || document.hidden) return;
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  function start() {
    if (started) return;
    started = true;
    loadAll().then(function (ok) {
      if (!ok) return; /* si falta una imagen se queda la foto del estadio de fondo */
      ready = true;
      resize();
      if (reduce) { curT = 5.2; draw(curT); }
      else draw(0);
      stage.classList.add('ready');
      play();
    });
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else play(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { start(); play(); } else pause();
    }, { rootMargin: '300px 0px', threshold: 0.05 }).observe(stage);
  } else { visible = true; start(); }

  /* para revisar la animación a mano: ITCGol.seek(3.9) */
  window.ITCGol = {
    duration: TOTAL, goal: T_GOAL, net: T_NET, contact: T_CONTACT,
    state: function (T) { var t = warp(T), b = ballState(t); return { t: +t.toFixed(3), pose: SCHED[schedIndex(t)][1], ball: [Math.round(b.x), Math.round(b.y), +b.r.toFixed(1)] }; },
    seek: function (T) { pause(); curT = clamp(T, 0, TOTAL); if (ready) draw(curT); },
    replay: function () { curT = 0; if (ready) draw(0); play(); },
    play: play, pause: pause
  };

  var replayBtn = document.getElementById('golReplay');
  if (replayBtn) replayBtn.addEventListener('click', function () { window.ITCGol.replay(); });
})();
