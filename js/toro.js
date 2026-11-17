/* Torito mecánico (el Juego Grande): escena 3D hecha con three.js.
   Todo se construye con figuras básicas: no usa modelos ni imágenes externas.

   Historia (ciclo de 15.6 s reales):
     0.0 –  1.2   El jinete se acomoda, la cámara baja hacia el ruedo
     1.2 –  9.2   La monta: 8 segundos exactos, en tres niveles de velocidad
     9.2 – 11.4   Sale volando en cámara lenta y cae en el colchón inflable
    11.4 – 15.6   Polvo, confeti, el toro resopla y el jinete celebra; desvanecido y vuelta a empezar

   Para revisar un instante: ITCToro.seek(9.8) en la consola del navegador. */
(function () {
  'use strict';

  var stage = document.getElementById('stageToro');
  if (!stage) return;
  var canvas = stage.querySelector('canvas');
  var timeEl = document.getElementById('toroTime'), levelEl = document.getElementById('toroLevel');
  var meterEl = document.getElementById('toroMeter'), shoutEl = document.getElementById('toroShout');
  var fadeEl = document.getElementById('toroFade');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  function fail() { stage.classList.add('no-3d'); }

  /* three.js se carga aparte para que, sin internet, el resto de la página siga funcionando */
  if (window.THREE) start(window.THREE);
  else {
    var lib = document.createElement('script');
    lib.src = THREE_SRC;
    lib.async = true;
    lib.onload = function () { if (window.THREE) start(window.THREE); else fail(); };
    lib.onerror = fail;
    document.head.appendChild(lib);
  }

  function start(THREE) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { fail(); return; }
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    /* ---------- utilidades ---------- */
    var PI = Math.PI, TAU = PI * 2;
    function clamp(x, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x)); }
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
    /* Interpolación monótona: se usa para el reloj de la escena y para la cámara */
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
    function C(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
    function M(hex, rough, metal) {
      return new THREE.MeshStandardMaterial({ color: C(hex), roughness: rough === undefined ? 0.7 : rough, metalness: metal || 0 });
    }
    function put(parent, geo, material, x, y, z) {
      var m = new THREE.Mesh(geo, material);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true; m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    function ball(parent, r, material, x, y, z, sx, sy, sz) {
      var m = put(parent, new THREE.SphereGeometry(r, 28, 20), material, x, y, z);
      if (sx) m.scale.set(sx, sy, sz);
      return m;
    }
    /* cilindro que cuelga de su origen hacia abajo: sirve para brazos, piernas y la cola */
    function limb(parent, len, rTop, rBottom, material) {
      var g = new THREE.CylinderGeometry(rTop, rBottom, len, 12);
      g.translate(0, -len / 2, 0);
      var m = new THREE.Mesh(g, material);
      m.castShadow = true;
      parent.add(m);
      return m;
    }

    /* ---------- tiempos ---------- */
    var TOTAL = 15.6;
    var RIDE_START = 1.2, RIDE_LEN = 8, RIDE_END = RIDE_START + RIDE_LEN;
    var G = 9.8;
    /* reloj: tiempo real -> tiempo de la escena (cámara lenta mientras el jinete vuela) */
    var warp = pchip([0, 9.2, 10.9, 11.45, TOTAL], [0, 9.2, 9.95, 10.5, 14.65]);

    /* ---------- escena, cámara y luces ---------- */
    var NIGHT = 0x050c1a;
    var scene = new THREE.Scene();
    scene.background = C(NIGHT);
    scene.fog = new THREE.FogExp2(NIGHT, 0.026);
    scene.fog.color.convertSRGBToLinear();

    var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 140);

    scene.add(new THREE.HemisphereLight(C('#b9d2ff'), C('#10281c'), 0.95));
    var key = new THREE.SpotLight(C('#fff1dc'), 2.5, 50, 0.5, 0.6, 1);
    key.position.set(4.5, 13.5, 5.5);
    key.target.position.set(0, 1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0006;
    key.shadow.radius = 3;
    key.shadow.camera.near = 4; key.shadow.camera.far = 32;
    scene.add(key); scene.add(key.target);
    var rimG = new THREE.PointLight(C('#38e08a'), 1.5, 30, 1.5);
    rimG.position.set(-8, 4.4, 5.5);
    scene.add(rimG);
    var rimB = new THREE.PointLight(C('#4d9bff'), 1.9, 30, 1.5);
    rimB.position.set(8, 4, -6.5);
    scene.add(rimB);

    /* ---------- ruedo inflable ---------- */
    var MAT_TOP = 0.55, ARENA_R = 4.45, WALL_R = 0.62, PIVOT_Y = 1.62;
    (function () {
      var floor = put(scene, new THREE.CircleGeometry(70, 64), M('#0a1730', 0.96));
      floor.rotation.x = -PI / 2;
      floor.castShadow = false;

      /* lona del colchón: gajos azules con un aro verde */
      var cv = document.createElement('canvas');
      cv.width = cv.height = 1024;
      var g = cv.getContext('2d'), i;
      g.translate(512, 512);
      for (i = 0; i < 24; i++) {
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 512, i * PI / 12, (i + 1) * PI / 12); g.closePath();
        g.fillStyle = i % 2 ? '#1466dc' : '#0f54bb';
        g.fill();
      }
      g.lineWidth = 36; g.strokeStyle = '#14a352';
      g.beginPath(); g.arc(0, 0, 372, 0, TAU); g.stroke();
      g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,.6)';
      g.beginPath(); g.arc(0, 0, 398, 0, TAU); g.stroke();
      g.beginPath(); g.arc(0, 0, 346, 0, TAU); g.stroke();
      g.fillStyle = '#0b3f8f';
      g.beginPath(); g.arc(0, 0, 150, 0, TAU); g.fill();
      var tex = new THREE.CanvasTexture(cv);
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = 4;
      var side = M('#0d4aa8', 0.5);
      var top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
      var mat = put(scene, new THREE.CylinderGeometry(ARENA_R, ARENA_R + 0.1, MAT_TOP, 72), [side, top, side], 0, MAT_TOP / 2, 0);
      mat.castShadow = false;

      /* pared inflable en gajos verde y azul */
      var n = 16, arc = TAU / n, colors = ['#14a352', '#1466dc'];
      var wallGeo = new THREE.TorusGeometry(ARENA_R, WALL_R, 18, 10, arc * 0.95);
      for (i = 0; i < n; i++) {
        var holder = new THREE.Group();
        holder.rotation.y = i * arc;
        var seg = put(holder, wallGeo, M(colors[i % 2], 0.32), 0, MAT_TOP + WALL_R * 0.7, 0);
        seg.rotation.x = PI / 2;
        scene.add(holder);
      }

      /* base mecánica con fuelle de hule */
      var metal = M('#232d3d', 0.42, 0.65), rubber = M('#0c1118', 0.85);
      put(scene, new THREE.CylinderGeometry(0.8, 1.02, 0.32, 36), metal, 0, MAT_TOP + 0.16, 0);
      put(scene, new THREE.CylinderGeometry(0.5, 0.62, 0.2, 28), metal, 0, MAT_TOP + 0.42, 0);
      for (i = 0; i < 5; i++) {
        put(scene, new THREE.CylinderGeometry(i % 2 ? 0.36 : 0.44, i % 2 ? 0.44 : 0.36, 0.11, 24), rubber, 0, MAT_TOP + 0.575 + i * 0.11, 0);
      }
    })();

    /* ---------- ambiente: luces de feria, focos y reflectores ---------- */
    var glow = (function () {
      var cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      var g = cv.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    })();
    function pointCloud(positions, colors, size, opacity, additive) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (colors) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      var material = new THREE.PointsMaterial({
        size: size, map: glow, transparent: true, opacity: opacity, depthWrite: false, fog: false,
        vertexColors: !!colors, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
      });
      var pts = new THREE.Points(geo, material);
      pts.frustumCulled = false;
      scene.add(pts);
      return pts;
    }
    var rnd = mulberry32(2026);
    var FAIR = ['#6ef0a2', '#5aa8ff', '#ffe2a8', '#ffffff', '#38e08a', '#4d9bff'].map(C);
    var bulbs = (function () {
      var pos = [], col = [], i, j, c;
      /* luces lejanas, desenfocadas */
      for (i = 0; i < 150; i++) {
        var a = rnd() * TAU, r = 17 + rnd() * 16;
        pos.push(Math.cos(a) * r, 0.6 + rnd() * 10, Math.sin(a) * r);
        c = FAIR[Math.floor(rnd() * FAIR.length)];
        col.push(c.r, c.g, c.b);
      }
      pointCloud(pos, col, 2.1, 0.5, true);

      /* guirnaldas de focos colgadas alrededor del ruedo */
      var poles = 6, R = 7.6, H = 6.4;
      pos = []; col = [];
      var linePts = [];
      for (i = 0; i < poles; i++) {
        var a0 = i / poles * TAU, a1 = (i + 1) / poles * TAU;
        for (j = 0; j <= 9; j++) {
          var u = j / 9, ang = mix(a0, a1, u);
          var x = Math.cos(ang) * R * (1 - 0.05 * Math.sin(u * PI)), z = Math.sin(ang) * R * (1 - 0.05 * Math.sin(u * PI));
          var y = H - 0.02 - 0.9 * Math.sin(u * PI);
          linePts.push(new THREE.Vector3(x, y + 0.06, z));
          if (j > 0 && j < 9) {
            pos.push(x, y, z);
            c = FAIR[(i * 8 + j) % 3];
            col.push(c.r, c.g, c.b);
          }
        }
      }
      var wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), new THREE.LineBasicMaterial({ color: 0x1a2436, fog: false }));
      wire.frustumCulled = false;
      scene.add(wire);
      return pointCloud(pos, col, 0.62, 0.95, true);
    })();
    var beams = [['#38e08a', -7, -5], ['#4d9bff', 7, -6]].map(function (b) {
      var geo = new THREE.ConeGeometry(2.7, 15, 32, 1, true);
      geo.translate(0, -7.5, 0);
      var cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: C(b[0]), transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide, depthWrite: false, fog: false
      }));
      cone.position.set(b[1], 13, b[2]);
      scene.add(cone);
      return { mesh: cone, base: new THREE.Vector3(-b[1], -13 + 1.2, -b[2]).normalize() };
    });

    /* ---------- el toro ---------- */
    var bull = new THREE.Group();
    bull.position.y = PIVOT_Y;
    scene.add(bull);
    var tilt = new THREE.Group();
    bull.add(tilt);
    var BULL_SCALE = 0.86;
    var body = new THREE.Group();
    body.scale.setScalar(BULL_SCALE);
    tilt.add(body);
    var YB = 0.72; /* altura del centro del cuerpo sobre el pivote, antes de escalar */
    var SEAT = new THREE.Vector3(-0.08, YB + 0.84, 0).multiplyScalar(BULL_SCALE);
    var HANDLE = new THREE.Vector3(0.3, YB + 0.9, 0).multiplyScalar(BULL_SCALE);
    var eyeMat = new THREE.MeshStandardMaterial({ color: C('#1a0503'), emissive: C('#ff3b2f'), emissiveIntensity: 1, roughness: 0.3 });
    var tail = new THREE.Group();
    var snout = new THREE.Object3D();
    (function () {
      var hide = M('#5b3a25', 0.72), dark = M('#2a190e', 0.85), muzzle = M('#a98468', 0.7);
      var horn = M('#f2e9d5', 0.35), gold = M('#e2b84c', 0.28, 0.8), leather = M('#5d3719', 0.55);
      var pad = M('#14a352', 0.6), rope = M('#dccba2', 0.8), metal = M('#232d3d', 0.42, 0.65);
      pad.side = THREE.DoubleSide;

      ball(body, 1, hide, 0, YB, 0, 1.25, 0.74, 0.68);           /* barril */
      ball(body, 0.56, hide, 0.74, YB + 0.2, 0, 1, 1.05, 1.05);  /* giba */
      ball(body, 0.62, hide, -0.78, YB + 0.05, 0, 1, 1, 0.98);   /* grupa */
      ball(body, 0.46, hide, 1.16, YB + 0.2, 0, 1.1, 1, 0.9);    /* cuello */
      put(body, new THREE.BoxGeometry(0.5, 0.22, 0.42), metal, 0, 0.03, 0);

      var head = new THREE.Group();
      head.position.set(1.6, YB + 0.12, 0);
      head.rotation.z = -0.12;
      body.add(head);
      ball(head, 0.42, hide, 0, 0, 0, 1.15, 0.95, 0.9);
      ball(head, 0.3, muzzle, 0.36, -0.14, 0, 1.1, 0.85, 1);
      var ring = put(head, new THREE.TorusGeometry(0.1, 0.022, 8, 24), gold, 0.67, -0.27, 0);
      ring.rotation.y = PI / 2;
      snout.position.set(0.7, -0.1, 0);
      head.add(snout);
      [1, -1].forEach(function (s) {
        ball(head, 0.045, dark, 0.66, -0.1, s * 0.1);
        ball(head, 0.058, eyeMat, 0.27, 0.14, s * 0.3);
        ball(head, 0.16, hide, -0.12, 0.2, s * 0.44, 0.5, 0.8, 1.4);
        var base = put(head, new THREE.CylinderGeometry(0.055, 0.09, 0.44, 12), horn, -0.04, 0.36, s * 0.5);
        base.rotation.x = s * 1.35;
        var tip = put(head, new THREE.ConeGeometry(0.056, 0.46, 12), horn, 0.06, 0.62, s * 0.8);
        tip.rotation.set(s * 0.45, 0, -0.35);
      });

      /* montura: mantilla verde con ribete dorado, asiento de cuero y agarradera */
      var padMesh = put(body, new THREE.SphereGeometry(1, 32, 12, 0, TAU, 0, 1.15), pad, -0.08, YB, 0);
      padMesh.scale.set(0.74, 0.775, 0.715);
      var trim = put(body, new THREE.TorusGeometry(1, 0.035, 8, 48), gold, -0.08, YB + 0.775 * Math.cos(1.15), 0);
      trim.rotation.x = PI / 2;
      trim.scale.set(0.74 * Math.sin(1.15), 0.715 * Math.sin(1.15), 1);
      ball(body, 0.3, leather, -0.1, YB + 0.775, 0, 1.3, 0.3, 1.05);
      put(body, new THREE.CylinderGeometry(0.025, 0.03, 0.16, 8), rope, HANDLE.x, HANDLE.y - 0.14, 0);
      put(body, new THREE.TorusGeometry(0.085, 0.024, 8, 20), rope, HANDLE.x, HANDLE.y, 0);

      tail.position.set(-1.34, YB + 0.28, 0);
      body.add(tail);
      limb(tail, 0.7, 0.04, 0.028, hide);
      ball(tail, 0.1, dark, 0, -0.74, 0, 1, 1.3, 1);
    })();

    /* ---------- el jinete ---------- */
    var rider = (function () {
      var jersey = M('#18a85a', 0.75), jeans = M('#1f4fa0', 0.8), skin = M('#e0a077', 0.7);
      var hair = M('#2a1a10', 0.85), boots = M('#2c1d12', 0.6), hatM = M('#dcc07c', 0.8), band = M('#0f7a40', 0.7);

      var root = new THREE.Group();
      ball(root, 0.2, jeans, 0, 0.07, 0, 1, 0.75, 1.2);

      function buildLeg(s) {
        var hip = new THREE.Group();
        hip.position.set(0.02, 0.05, s * 0.17);
        root.add(hip);
        limb(hip, 0.44, 0.105, 0.085, jeans);
        var knee = new THREE.Group();
        knee.position.y = -0.44;
        hip.add(knee);
        ball(knee, 0.086, jeans);
        limb(knee, 0.42, 0.08, 0.062, jeans);
        var boot = put(knee, new THREE.BoxGeometry(0.27, 0.11, 0.13), boots, 0.07, -0.45, 0);
        boot.receiveShadow = false;
        return { hip: hip, knee: knee, s: s };
      }
      var legs = [buildLeg(1), buildLeg(-1)];

      var torso = new THREE.Group();
      torso.position.y = 0.08;
      root.add(torso);
      var chest = put(torso, new THREE.CylinderGeometry(0.2, 0.165, 0.58, 16), jersey, 0, 0.3, 0);
      chest.scale.set(0.82, 1, 1.28);
      ball(torso, 0.2, jersey, 0, 0.57, 0, 0.82, 0.5, 1.28);

      var neck = new THREE.Group();
      neck.position.y = 0.66;
      torso.add(neck);
      put(neck, new THREE.CylinderGeometry(0.062, 0.07, 0.12, 10), skin, 0, 0.03, 0);
      var headG = new THREE.Group();
      headG.position.y = 0.22;
      neck.add(headG);
      ball(headG, 0.17, skin);
      ball(headG, 0.03, skin, 0.17, -0.02, 0);
      var hairMesh = put(headG, new THREE.SphereGeometry(0.178, 24, 14, 0, TAU, 0, 1.75), hair, -0.012, 0.012, 0);
      hairMesh.rotation.z = 0.5;
      [1, -1].forEach(function (s) { ball(headG, 0.022, hair, 0.15, 0.03, s * 0.065); });

      var hat = new THREE.Group();
      put(hat, new THREE.CylinderGeometry(0.33, 0.33, 0.026, 28), hatM, 0, 0, 0);
      put(hat, new THREE.CylinderGeometry(0.15, 0.175, 0.2, 20), hatM, 0, 0.11, 0);
      put(hat, new THREE.CylinderGeometry(0.178, 0.18, 0.045, 20), band, 0, 0.04, 0);

      function buildArm(s) {
        var shoulder = new THREE.Group();
        ball(shoulder, 0.078, jersey);
        limb(shoulder, 0.33, 0.07, 0.058, jersey);
        var elbow = new THREE.Group();
        elbow.position.y = -0.33;
        shoulder.add(elbow);
        ball(elbow, 0.058, skin);
        limb(elbow, 0.31, 0.054, 0.044, skin);
        ball(elbow, 0.066, skin, 0, -0.33, 0);
        return { shoulder: shoulder, elbow: elbow, s: s };
      }
      var hold = buildArm(1), free = buildArm(-1);
      root.add(hold.shoulder);            /* la mano que agarra se resuelve en el marco del asiento */
      free.shoulder.position.set(0, 0.56, -0.29);
      torso.add(free.shoulder);

      return { root: root, torso: torso, head: headG, neck: neck, hat: hat, legs: legs, hold: hold, free: free };
    })();
    var ARM1 = 0.33, ARM2 = 0.33, SHOULDER_Y = 0.56, SHOULDER_Z = 0.29;

    /* ---------- movimiento del toro ---------- */
    function intensity(r) {
      return (0.28 + 0.34 * ease((r - 2.4) / 0.7) + 0.38 * ease((r - 5.2) / 0.8)) * ease(r / 0.6);
    }
    function phase(r) { return TAU * (0.62 * r + 0.075 * r * r); }
    function yawAt(r) {
      return 0.55 * Math.sin(0.85 * r) * (0.4 + intensity(r)) + 0.18 * r + TAU * ease((r - 5.4) / 2.2);
    }
    function bullState(s) {
      var r = clamp(s - RIDE_START, 0, RIDE_LEN), k = 1;
      if (s > RIDE_END) { k = Math.exp(-(s - RIDE_END) * 2.4); r = RIDE_LEN + (1 - k) / 2.4; }
      var I = intensity(r) * k, ph = phase(r);
      var idle = s < RIDE_START ? 0.02 * Math.sin(s * 2.4) : 0;
      return {
        r: r, I: I, ph: ph,
        pitch: I * (0.34 * Math.sin(ph) + 0.1 * Math.sin(ph * 2.3 + 0.7)) + idle,
        roll: I * 0.2 * Math.sin(ph * 0.5 + 1.1),
        bob: I * 0.09 * Math.sin(ph + 0.6),
        yaw: yawAt(r)
      };
    }
    function poseBull(s) {
      var b = bullState(s);
      bull.rotation.y = b.yaw;
      tilt.rotation.set(b.roll, 0, b.pitch);
      tilt.position.y = b.bob;
      tail.rotation.set(0.5 * Math.sin(b.ph * 0.5) * (0.3 + b.I), 0, -0.4 - 0.7 * b.I + 0.25 * Math.sin(b.ph + 2));
      eyeMat.emissiveIntensity = 0.7 + 2 * b.I;
      return b;
    }

    /* ---------- poses del jinete ---------- */
    function setArm(arm, rx, rz, bend) {
      arm.shoulder.rotation.set(rx, 0, rz);
      arm.elbow.rotation.z = bend;
    }
    function setLegs(rx, rz, bend, wiggle) {
      rider.legs.forEach(function (l) {
        l.hip.rotation.set(-rx * l.s, 0, rz + (wiggle || 0) * l.s);
        l.knee.rotation.z = bend - (wiggle || 0) * l.s;
      });
    }
    function placeHoldShoulder(lean) {
      rider.hold.shoulder.position.set(-SHOULDER_Y * Math.sin(lean), 0.08 + SHOULDER_Y * Math.cos(lean), SHOULDER_Z);
    }
    function poseRide(s) {
      var b = bullState(s), lag = bullState(s - 0.09);
      var r = b.r, slip = ease((r - 6.4) / 1.6);
      if (rider.root.parent !== tilt) tilt.add(rider.root);
      if (rider.hat.parent !== rider.head) rider.head.add(rider.hat);
      rider.hat.position.set(0, 0.1, 0);
      rider.hat.quaternion.set(0, 0, 0, 1);
      rider.hat.rotation.z = -0.08;

      rider.root.position.set(SEAT.x - 0.3 * slip, SEAT.y + 0.16 * slip * slip, SEAT.z + 0.1 * slip);
      rider.root.quaternion.set(0, 0, 0, 1);
      rider.root.rotation.set(0.42 * slip + 0.1 * b.I * Math.sin(b.ph * 0.5), 0, 0.12 * slip);

      var lean = -0.12 - 0.55 * lag.pitch + 0.25 * slip;
      rider.torso.rotation.set(-0.7 * lag.roll, 0, lean);
      rider.neck.rotation.set(0, 0, 0.5 * lag.pitch - 0.2 * slip);
      rider.head.rotation.set(0, 0.25 * Math.sin(b.ph * 0.5) * b.I, 0);

      setLegs(0.6, 1.15 + 0.1 * lag.pitch, -1.5 + 0.25 * slip * Math.sin(b.ph), 0);

      /* brazo libre: sube al empezar y se agita cada vez más */
      var up = ease((s - 0.25) / 0.8);
      setArm(rider.free, 0.25 + 0.2 * b.I * Math.sin(b.ph * 0.7), mix(0.25, -2.5, up) + 0.5 * Math.sin(b.ph - 0.8) * (0.3 + b.I), 0.4 + 0.5 * b.I * Math.sin(b.ph + 1));

      /* brazo que agarra: dos huesos hacia la agarradera */
      placeHoldShoulder(lean);
      var S = rider.hold.shoulder.position, R = rider.root.position;
      var dx = (HANDLE.x - R.x) - S.x, dy = (HANDLE.y - R.y) - S.y;
      var d = clamp(Math.sqrt(dx * dx + dy * dy), 0.08, ARM1 + ARM2 - 0.004);
      var aim = Math.atan2(dx, -dy), open = Math.acos(d / (ARM1 + ARM2));
      setArm(rider.hold, 0.42, aim - open, 2 * open);
      return b;
    }

    /* pose del jinete y del sombrero en el instante en que sale volando (se calcula una sola vez) */
    var P0 = new THREE.Vector3(), Q0 = new THREE.Quaternion(), H0 = new THREE.Vector3(), HQ0 = new THREE.Quaternion();
    poseBull(RIDE_END);
    poseRide(RIDE_END);
    scene.updateMatrixWorld(true);
    rider.root.getWorldPosition(P0);
    rider.root.getWorldQuaternion(Q0);
    rider.hat.getWorldPosition(H0);
    rider.hat.getWorldQuaternion(HQ0);

    var throwAng = bullState(RIDE_END).yaw + 0.9;
    var DIR = new THREE.Vector3(Math.cos(throwAng), 0, -Math.sin(throwAng));
    /* si el toro termina mirando hacia fuera del colchón por ese lado, el vuelo sigue cayendo dentro */
    var V0 = DIR.clone().multiplyScalar(1.9); V0.y = 4.7;
    var REST_Y = MAT_TOP + 0.17;
    var T_FLY = (V0.y + Math.sqrt(V0.y * V0.y + 2 * G * (P0.y - REST_Y))) / G;
    var S_LAND = RIDE_END + T_FLY;
    var P_LAND = new THREE.Vector3(P0.x + V0.x * T_FLY, REST_Y, P0.z + V0.z * T_FLY);
    var UP = new THREE.Vector3(0, 1, 0);
    var SIDE = new THREE.Vector3().crossVectors(UP, DIR).normalize();
    /* tendido boca arriba: la cabeza apunta hacia donde iba volando y el pecho mira al cielo */
    var Q_LAND = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(UP, DIR, SIDE));

    var VH = new THREE.Vector3(-DIR.x * 0.9 + SIDE.x * 0.5, 3.1, -DIR.z * 0.9 + SIDE.z * 0.5), GH = 5.2;
    var HAT_Y = MAT_TOP + 0.02;
    var T_HAT = (VH.y + Math.sqrt(VH.y * VH.y + 2 * GH * (H0.y - HAT_Y))) / GH;

    function realTimeOf(sim) {
      for (var T = 0; T < TOTAL; T += 0.004) if (warp(T) >= sim) return T;
      return TOTAL;
    }
    var T_THROW = realTimeOf(RIDE_END), T_LAND = realTimeOf(S_LAND);

    var qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), va = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);
    function posePost(s) {
      var t = s - RIDE_END, u = s - S_LAND;
      if (rider.root.parent !== scene) scene.add(rider.root);
      if (rider.hat.parent !== scene) scene.add(rider.hat);
      rider.torso.rotation.set(0, 0, 0);
      rider.neck.rotation.set(0, 0, 0);
      rider.head.rotation.set(0, 0, 0);
      placeHoldShoulder(0);

      if (u < 0) {
        /* en el aire: parábola y voltereta hacia atrás */
        var e = t / T_FLY;
        rider.root.position.set(P0.x + V0.x * t, P0.y + V0.y * t - 0.5 * G * t * t, P0.z + V0.z * t);
        qa.copy(Q0).slerp(Q_LAND, ease(e));
        qb.setFromAxisAngle(SIDE, -TAU * ease(e * 1.05));
        rider.root.quaternion.copy(qb).multiply(qa);
        var flail = Math.sin(t * 13);
        setArm(rider.hold, -0.6, -2.1 + 0.5 * flail, 0.5);
        setArm(rider.free, 0.6, -2.3 - 0.5 * flail, 0.5);
        setLegs(0.35, 0.8 + 0.25 * flail, -1.0, 0.3 * flail);
      } else {
        /* en el colchón: rebote, se queda tendido y luego levanta los brazos */
        var bounce = 0.26 * Math.abs(Math.sin(u * 8.5)) * Math.exp(-u * 4.5);
        rider.root.position.set(P_LAND.x, REST_Y + bounce, P_LAND.z);
        rider.root.quaternion.copy(Q_LAND);
        var flop = ease(u / 0.35), win = ease((u - 1.15) / 0.5), pump = win * 0.18 * Math.sin(u * 9);
        setArm(rider.hold, mix(-0.6, mix(-1.35, -0.3, win), flop), mix(-2.1, mix(0.3, 1.45 + pump, win), flop), 0.3);
        setArm(rider.free, mix(0.6, mix(1.35, 0.3, win), flop), mix(-2.3, mix(0.3, 1.45 - pump, win), flop), 0.3);
        setLegs(mix(0.35, 0.22, flop), mix(0.8, 0.5, flop), mix(-1.0, -0.75, flop), 0);
        rider.neck.rotation.z = -0.35 * win;
      }

      /* el sombrero sale por su lado, planea y cae más tarde */
      var th = Math.min(t, T_HAT), eh = th / T_HAT;
      rider.hat.position.set(H0.x + VH.x * th, Math.max(HAT_Y, H0.y + VH.y * th - 0.5 * GH * th * th), H0.z + VH.z * th);
      qa.copy(HQ0).slerp(qb.set(0, 0, 0, 1), ease(eh * 1.1));
      qb.setFromAxisAngle(UP, th * 5);
      rider.hat.quaternion.copy(qb).multiply(qa);
      qb.setFromAxisAngle(va.set(1, 0, 0.4).normalize(), 0.55 * Math.sin(th * 9) * (1 - eh));
      rider.hat.quaternion.multiply(qb);
    }

    /* ---------- partículas: polvo, confeti y resoplido ---------- */
    var DUST_N = 44, dust = (function () {
      var seeds = [];
      for (var i = 0; i < DUST_N; i++) seeds.push({ a: rnd() * TAU, sp: 0.8 + rnd() * 2.4, up: 0.3 + rnd() * 1.3, r0: rnd() * 0.5 });
      var pts = pointCloud(new Array(DUST_N * 3).fill(0), null, 0.5, 0, false);
      pts.material.color = C('#e8eef8');
      return { pts: pts, seeds: seeds };
    })();
    var CONF_N = 280, conf = (function () {
      var seeds = [], col = [], pal = ['#12924a', '#6ef0a2', '#0f5fd1', '#5aa8ff', '#f0d58a', '#ffffff'].map(C);
      for (var i = 0; i < CONF_N; i++) {
        var a = rnd() * TAU, r = Math.sqrt(rnd()) * 5.2, c = pal[i % pal.length];
        seeds.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 6.5 + rnd() * 3.5, v: 1.3 + rnd() * 1.5, t: rnd() * 1.3, f: 1.5 + rnd() * 2.5, w: 0.2 + rnd() * 0.5, ph: rnd() * TAU });
        col.push(c.r, c.g, c.b);
      }
      var pts = pointCloud(new Array(CONF_N * 3).fill(0), col, 0.2, 0, false);
      pts.material.map = null;
      pts.material.needsUpdate = true;
      return { pts: pts, seeds: seeds };
    })();
    var STEAM_N = 24, steam = (function () {
      var seeds = [];
      for (var i = 0; i < STEAM_N; i++) seeds.push({ burst: i < 12 ? 0 : 1, j: rnd() - 0.5, k: rnd() - 0.5, sp: 0.7 + rnd() * 0.9, d: rnd() * 0.25 });
      var pts = pointCloud(new Array(STEAM_N * 3).fill(0), null, 0.42, 0, false);
      pts.material.color = C('#dfe8f5');
      return { pts: pts, seeds: seeds };
    })();
    var sn = new THREE.Vector3(), fw = new THREE.Vector3();
    function poseParticles(s, T) {
      var u = s - S_LAND, p, i, a, e;

      p = dust.pts.geometry.attributes.position;
      if (u > 0 && u < 1.1) {
        for (i = 0; i < DUST_N; i++) {
          a = dust.seeds[i];
          var rr = a.r0 + a.sp * (1 - Math.exp(-u * 2.6)) / 2.6 * 2.4;
          p.setXYZ(i, P_LAND.x + Math.cos(a.a) * rr, MAT_TOP + 0.12 + a.up * u * (1 - u * 0.6), P_LAND.z + Math.sin(a.a) * rr);
        }
        p.needsUpdate = true;
        dust.pts.material.opacity = 0.55 * (1 - u / 1.1);
        dust.pts.material.size = 0.35 + u * 0.9;
      } else dust.pts.material.opacity = 0;

      p = conf.pts.geometry.attributes.position;
      if (u > 0) {
        for (i = 0; i < CONF_N; i++) {
          a = conf.seeds[i];
          e = Math.max(0, u - a.t);
          var rest = Math.hypot(a.x, a.z) > ARENA_R + WALL_R ? 0.03 : MAT_TOP + 0.03;
          p.setXYZ(i, a.x + a.w * Math.sin(e * a.f + a.ph), Math.max(rest, a.y - a.v * e), a.z + a.w * Math.cos(e * a.f * 0.8 + a.ph));
        }
        p.needsUpdate = true;
        conf.pts.material.opacity = Math.min(1, u * 3) * (1 - ease((T - (TOTAL - 1.1)) / 0.8));
      } else conf.pts.material.opacity = 0;

      /* dos resoplidos por la nariz cuando el toro ya se detuvo */
      p = steam.pts.geometry.attributes.position;
      var any = 0;
      snout.getWorldPosition(sn);
      fw.set(1, 0, 0).applyQuaternion(bull.quaternion);
      for (i = 0; i < STEAM_N; i++) {
        a = steam.seeds[i];
        e = (u - (a.burst ? 1.75 : 0.55) - a.d) / 0.9;
        if (e > 0 && e < 1) {
          p.setXYZ(i, sn.x + fw.x * a.sp * e + a.j * 0.5 * e, sn.y - 0.05 + 0.35 * e * e + a.k * 0.3 * e, sn.z + fw.z * a.sp * e + a.k * 0.5 * e);
          any = Math.max(any, 1 - e);
        } else p.setXYZ(i, 0, -50, 0);
      }
      p.needsUpdate = true;
      steam.pts.material.opacity = 0.5 * any;
      steam.pts.material.size = 0.3 + 0.5 * (1 - any);
    }

    /* ---------- cámara ---------- */
    var CAM_S = [0, 1.2, 6.6, 9.2, 10.5, 14.65];
    var camR = pchip(CAM_S, [17, 13, 11, 11.6, 13.6, 14.6], true);
    var camH = pchip(CAM_S, [6.6, 4.4, 3.5, 3.8, 4.4, 5.2], true);
    var look = new THREE.Vector3(0, 1.95, 0), want = new THREE.Vector3(), par = { x: 0, y: 0, tx: 0, ty: 0 };
    function poseCamera(T, s, snap) {
      var ang = 0.75 + 0.13 * T + par.x * 0.3, rad = camR(s), h = camH(s) + par.y * 0.8;
      var dL = T - T_LAND, shake = dL > 0 ? 0.16 * Math.exp(-dL * 7) : 0;
      camera.position.set(Math.sin(ang) * rad + shake * Math.sin(dL * 60), h + shake * Math.cos(dL * 53), Math.cos(ang) * rad);
      if (s <= RIDE_END) want.set(0, 1.95, 0);
      else {
        var follow = ease((s - RIDE_END) / 0.5);
        want.set(rider.root.position.x * 0.6 * follow, mix(1.95, 0.4 * rider.root.position.y + 0.9, follow), rider.root.position.z * 0.6 * follow);
      }
      if (snap) look.copy(want); else look.lerp(want, 0.09);
      camera.lookAt(look);
    }

    /* ---------- un cuadro completo ---------- */
    var curT = 0, shoutPhase = -1;
    function draw(T, snap) {
      var s = warp(T), b = poseBull(s);
      if (s < RIDE_END) poseRide(s); else posePost(s);
      poseParticles(s, T);

      rimG.position.x = -8 + 1.5 * Math.sin(T * 0.7);
      rimB.position.z = -6.5 + 1.5 * Math.cos(T * 0.6);
      bulbs.material.opacity = 0.8 + 0.15 * Math.sin(T * 5);
      beams.forEach(function (bm, i) {
        va.copy(bm.base);
        va.x += 0.22 * Math.sin(T * 0.8 + i * 2);
        va.z += 0.18 * Math.cos(T * 0.65 + i);
        bm.mesh.quaternion.setFromUnitVectors(DOWN, va.normalize());
      });

      poseCamera(T, s, snap);
      renderer.render(scene, camera);
      hud(T, s, b);
    }

    function hud(T, s, b) {
      var r = clamp(s - RIDE_START, 0, RIDE_LEN);
      timeEl.textContent = r.toFixed(2);
      levelEl.textContent = s < RIDE_START ? 'Listo' : s >= RIDE_END ? '¡Fuera!' : r < 2.6 ? 'Nivel 1' : r < 5.5 ? 'Nivel 2' : 'Nivel 3';
      meterEl.style.setProperty('--v', clamp(b.I).toFixed(3));
      var phaseNow = T < T_LAND + 0.15 ? 0 : (T < TOTAL - 1 ? 1 : 2);
      if (phaseNow !== shoutPhase) {
        shoutPhase = phaseNow;
        shoutEl.classList.remove('on', 'out');
        void shoutEl.offsetWidth;
        if (phaseNow === 1) shoutEl.classList.add('on');
        if (phaseNow === 2) shoutEl.classList.add('out');
      }
      fadeEl.style.opacity = Math.max(1 - ease(T / 0.7), ease((T - (TOTAL - 0.7)) / 0.7)).toFixed(3);
    }

    /* ---------- tamaño ---------- */
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      var aspect = w / h;
      camera.aspect = aspect;
      camera.fov = clamp(2 * Math.atan(5.7 / (aspect * 12.6)) * 180 / PI, 34, 60);
      /* en pantallas anchas la escena se corre a la derecha para dejar sitio al texto */
      if (w > 820) camera.setViewOffset(w, h, -w * 0.15, 0, w, h); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      key.shadow.mapSize.set(w < 700 ? 1024 : 2048, w < 700 ? 1024 : 2048);
      if (!running) draw(curT, true);
    }

    /* ---------- reproducción ---------- */
    var running = false, visible = false, last = 0, raf = 0;
    function frame(now) {
      raf = 0;
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      curT += dt;
      var wrapped = curT >= TOTAL;
      if (wrapped) curT -= TOTAL;
      par.x += (par.tx - par.x) * 0.05; par.y += (par.ty - par.y) * 0.05;
      draw(curT, wrapped);
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (running || reduce || !visible || document.hidden) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      par.ty = -((e.clientY - r.top) / r.height - 0.5);
    });
    stage.addEventListener('pointerleave', function () { par.tx = 0; par.ty = 0; });

    if (reduce) curT = 7.4;
    resize();
    draw(curT, true);
    stage.classList.add('ready');
    if (reduce) fadeEl.style.opacity = 0;

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else play(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) play(); else pause();
      }, { rootMargin: '200px 0px', threshold: 0.05 }).observe(stage);
    } else { visible = true; play(); }

    window.ITCToro = {
      duration: TOTAL, throwAt: T_THROW, landAt: T_LAND,
      seek: function (T) { pause(); curT = clamp(T, 0, TOTAL); draw(curT, true); },
      play: play, pause: pause
    };
  }
})();
