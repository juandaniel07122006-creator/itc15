/* Gráfica de la votación: barras por actividad, filtro por generación, podio y tabla.
   Para actualizar los votos basta con editar la lista DATA. */
(function () {
  'use strict';

  var root = document.getElementById('votes');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function add(a, b) { return a + b; }

  /* Votos por generación, en el orden de la hoja de cálculo (de más a menos votado) */
  var GENS = [
    { id: '2026', color: 'var(--s1)' },
    { id: '2025', color: 'var(--s2)' },
    { id: '2024', color: 'var(--s3)' },
    { id: '2023', color: 'var(--s4)' }
  ];
  var DATA = [
    { name: 'Torneo de videojuegos', v: [19, 32, 18, 1] },
    { name: 'Juego Grande', v: [12, 29, 3, 1] },
    { name: 'Torneo de fútbol', v: [7, 4, 10, 1] },
    { name: 'Memorama', v: [0, 8, 8, 1] },
    { name: 'Lotería temática', v: [3, 7, 5, 1] },
    { name: 'Mesa de regalos', v: [0, 3, 6, 1] },
    { name: 'Juego con harina', v: [0, 4, 2, 1] },
    { name: 'Hackathon', v: [1, 0, 4, 1] },
    { name: 'Cabina de fotos', v: [0, 1, 4, 1] },
    { name: 'Carrera de cartones', v: [0, 0, 3, 1] }
  ];
  DATA.forEach(function (d, i) {
    d.i = i;
    d.total = d.v.reduce(add, 0);
    d.full = d.alias ? d.name + ' (' + d.alias + ')' : d.name;
  });
  var genTotals = GENS.map(function (g, gi) { return DATA.reduce(function (s, d) { return s + d.v[gi]; }, 0); });
  var grand = genTotals.reduce(add, 0);

  var chart = $('voteChart'), filter = $('voteFilter'), tip = $('voteTip'), main = chart.parentNode;
  var sel = -1, shown = false, chips = [];

  /* filtros (también hacen de leyenda de colores) */
  filter.appendChild(make('span', 'lbl', 'Generación'));
  function addChip(label, index, color, count) {
    var b = make('button', 'vchip');
    b.type = 'button';
    b.setAttribute('aria-pressed', index === sel ? 'true' : 'false');
    if (color) { var sw = make('i'); sw.style.setProperty('--c', color); b.appendChild(sw); }
    b.appendChild(document.createTextNode(label));
    b.appendChild(make('small', null, count));
    b.addEventListener('click', function () {
      if (sel === index) return;
      sel = index;
      chips.forEach(function (c) { c.el.setAttribute('aria-pressed', c.index === sel ? 'true' : 'false'); });
      update(true);
    });
    chips.push({ el: b, index: index });
    filter.appendChild(b);
  }
  addChip('Todas', -1, null, grand);
  GENS.forEach(function (g, gi) { addChip(g.id, gi, g.color, genTotals[gi]); });

  /* filas de la gráfica */
  DATA.forEach(function (d) {
    var li = make('li', 'vrow');
    li.tabIndex = 0;
    d.rank = make('span', 'v-rank');
    var name = make('span', 'v-name', d.name);
    if (d.alias) name.appendChild(make('small', null, d.alias));
    var bar = make('span', 'v-bar');
    d.stack = make('span', 'v-stack');
    d.segs = GENS.map(function (g) {
      var s = make('i', 'v-seg');
      s.style.setProperty('--c', g.color);
      d.stack.appendChild(s);
      return s;
    });
    bar.appendChild(d.stack);
    d.val = make('span', 'v-val');
    li.appendChild(d.rank);
    li.appendChild(name);
    li.appendChild(bar);
    li.appendChild(d.val);
    li.addEventListener('pointerenter', function (e) { fillTip(d); placeTip(d, e); });
    li.addEventListener('pointermove', function (e) { placeTip(d, e); });
    li.addEventListener('pointerleave', function () { tip.hidden = true; });
    li.addEventListener('focus', function () { fillTip(d); placeTip(d, null); });
    li.addEventListener('blur', function () { tip.hidden = true; });
    d.li = li;
    chart.appendChild(li);
  });

  function value(d) { return sel < 0 ? d.total : d.v[sel]; }
  function describe(d) {
    return d.full + ': ' + d.total + ' votos. ' + GENS.map(function (g, gi) { return 'Generación ' + g.id + ': ' + d.v[gi]; }).join(', ') + '.';
  }
  function update(animate) {
    var order = DATA.slice().sort(function (a, b) { return value(b) - value(a) || a.i - b.i; });
    var max = Math.max.apply(null, order.map(value)) || 1;
    var before = {};
    var flip = animate && !reduce;
    if (flip) DATA.forEach(function (d) { before[d.i] = d.li.getBoundingClientRect().top; });

    order.forEach(function (d, pos) {
      var val = value(d), lastSeg = null;
      chart.appendChild(d.li);
      d.rank.textContent = pos + 1;
      d.val.textContent = val;
      d.li.classList.toggle('is-zero', val === 0);
      d.li.setAttribute('aria-label', describe(d));
      d.stack.style.width = shown ? (val / max * 100).toFixed(2) + '%' : '0';
      d.segs.forEach(function (s, gi) {
        var v = (sel < 0 || sel === gi) ? d.v[gi] : 0;
        s.style.flexGrow = v;
        s.classList.toggle('zero', v === 0);
        s.classList.remove('last');
        if (v > 0) lastSeg = s;
      });
      if (lastSeg) lastSeg.classList.add('last');
    });

    if (flip) {
      DATA.forEach(function (d) {
        var dy = before[d.i] - d.li.getBoundingClientRect().top;
        d.li.style.transition = 'none';
        d.li.style.transform = dy ? 'translateY(' + dy + 'px)' : '';
      });
      void chart.offsetWidth;
      DATA.forEach(function (d) {
        d.li.style.transition = 'transform .6s cubic-bezier(.2, .8, .2, 1)';
        d.li.style.transform = '';
      });
    }
  }

  /* detalle al pasar el cursor o enfocar con el teclado */
  function fillTip(d) {
    tip.textContent = '';
    tip.appendChild(make('h4', null, d.full));
    var dl = make('dl');
    GENS.forEach(function (g, gi) {
      var key = make('dt');
      key.style.setProperty('--c', g.color);
      dl.appendChild(key);
      dl.appendChild(make('dd', 'g', 'Generación ' + g.id));
      dl.appendChild(make('dd', 'n', d.v[gi]));
    });
    var tot = make('dd', 'tot');
    tot.appendChild(make('span', null, 'Total'));
    tot.appendChild(make('span', null, d.total + ' votos'));
    dl.appendChild(tot);
    tip.appendChild(dl);
    tip.hidden = false;
  }
  function placeTip(d, e) {
    if (tip.hidden) return;
    var mr = main.getBoundingClientRect(), lr = d.li.getBoundingClientRect();
    var x = e ? e.clientX - mr.left + 14 : lr.width * 0.4;
    x = Math.max(0, Math.min(x, mr.width - tip.offsetWidth));
    var above = lr.top - tip.offsetHeight - 8;
    var y = above > 70 ? above - mr.top : lr.bottom - mr.top + 8;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  /* tabla con los mismos datos */
  (function () {
    var table = $('voteTable'), head = make('thead'), body = make('tbody'), foot = make('tfoot');
    var hr = make('tr');
    hr.appendChild(make('th', null, 'Actividad'));
    GENS.forEach(function (g) { hr.appendChild(make('th', null, g.id)); });
    hr.appendChild(make('th', null, 'Total'));
    head.appendChild(hr);
    DATA.forEach(function (d) {
      var tr = make('tr');
      tr.appendChild(make('td', null, d.full));
      d.v.forEach(function (n) { tr.appendChild(make('td', null, n)); });
      tr.appendChild(make('td', null, d.total));
      body.appendChild(tr);
    });
    var fr = make('tr');
    fr.appendChild(make('td', null, 'Total por generación'));
    genTotals.forEach(function (n) { fr.appendChild(make('td', null, n)); });
    fr.appendChild(make('td', null, grand));
    foot.appendChild(fr);
    table.appendChild(head); table.appendChild(body); table.appendChild(foot);
  })();

  /* podio y dato destacado */
  var podium = $('votePodium');
  DATA.slice().sort(function (a, b) { return b.total - a.total || a.i - b.i; }).slice(0, 3).forEach(function (d, i) {
    var li = make('li', 'p' + (i + 1));
    li.appendChild(make('b', null, d.name));
    li.appendChild(make('small', null, d.total + ' votos'));
    li.appendChild(make('span', 'step', i + 1));
    podium.appendChild(li);
  });
  var topGen = genTotals.indexOf(Math.max.apply(null, genTotals));
  $('voteInsight').textContent = 'La generación ' + GENS[topGen].id + ' fue la que más participó: ' + genTotals[topGen] + ' de los ' + grand + ' votos.';

  var totalEl = $('voteTotal');
  totalEl.textContent = grand;
  update(false);

  function reveal() {
    shown = true;
    root.classList.add('in');
    update(false);
    if (reduce) return;
    var t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / 900);
      totalEl.textContent = Math.round(grand * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); reveal(); }
    }, { threshold: 0.2 });
    io.observe(root);
  } else reveal();
})();
