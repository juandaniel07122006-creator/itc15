/* Fotos de los 15 años: galería con filtros y visor (fotos.html) y tira de fotos de la portada (index.html).

   Para agregar una foto:
     1. Cópiala a media/lineaTiempo.
     2. Ejecuta  python tools/optimizar_fotos.py  (crea media/fotos/<id>.webp y media/fotos/mini/<id>.webp).
     3. Agrega una línea a FOTOS con su id (el primer número del nombre del archivo), su tema y su texto.
        Si sabes el año, ponlo en "anio" y aparecerá junto a la descripción. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  var TEMAS = {
    generaciones: 'Generaciones',
    aula: 'Aula y laboratorio',
    comunidad: 'Eventos y vinculación',
    recuerdos: 'Prensa y reconocimientos'
  };

  /* [id, tema, descripción, ancho, alto, año] — ancho y alto son los de la miniatura */
  var FOTOS = [
    ['33597420', 'generaciones', 'Estudiantes del ITC con su gafete', 560, 344],
    ['61453488', 'comunidad', 'Plática con el auditorio lleno', 560, 275],
    ['77118555', 'aula', 'Trabajo en el salón', 206, 206],
    ['78388637', 'aula', 'Clase con laptops y proyector', 560, 420],
    ['84355810', 'aula', 'Práctica en el centro de cómputo', 206, 206],
    ['84391837', 'generaciones', 'Estudiantes en el laboratorio de cómputo', 560, 420],
    ['84496579', 'aula', 'Exposición frente al grupo', 206, 206],
    ['84848484', 'aula', 'Programación en paralelo con MPI', 206, 206],
    ['458750973', 'recuerdos', 'Nota de prensa: «Aprender matemáticas es útil»', 526, 699],
    ['488930418', 'generaciones', 'Foto de grupo en la escalinata', 560, 372],
    ['488977640', 'generaciones', 'Una generación completa', 443, 590],
    ['489155376', 'generaciones', 'Foto de grupo con camisa de la UV', 560, 372],
    ['489163998', 'comunidad', 'Visita de estudiantes de bachillerato', 560, 315],
    ['489230765', 'comunidad', 'Taller práctico con laptops', 560, 420],
    ['489505352', 'comunidad', 'Visita al COBAEV, plantel 32', 560, 315],
    ['489702156', 'comunidad', 'Presentación ante estudiantes', 560, 420],
    ['489777283', 'aula', 'Charla en el laboratorio', 560, 420],
    ['490121843', 'recuerdos', 'Nota de prensa: curso de telemetría y sistemas de tiempo real', 560, 420],
    ['490336909', 'generaciones', 'Foto de grupo en la escalera', 560, 315],
    ['490345314', 'aula', 'Curso en el laboratorio', 560, 315],
    ['490381015', 'comunidad', 'Demostración para estudiantes de bachillerato', 560, 420],
    ['490448333', 'comunidad', 'Presentación de carteles', 560, 420],
    ['490466526', 'comunidad', 'Demostración en una feria', 560, 420],
    ['490730520', 'recuerdos', 'Nota de prensa: concluye el curso de telemetría', 438, 590],
    ['491724070', 'generaciones', 'Frente a las Facultades de Ingeniería y Ciencias Químicas', 560, 420],
    ['492430860', 'comunidad', 'Equipo con sus profesores en un evento', 560, 420],
    ['493084224', 'recuerdos', 'Navidad con el Laboratorio de Cómputo de Alto Rendimiento', 560, 433, 2016],
    ['494036811', 'recuerdos', 'Felicitación navideña del Laboratorio de Cómputo de Alto Rendimiento', 560, 433, 2016],
    ['494052890', 'generaciones', 'Estudiantes y profesores', 560, 315],
    ['496118241', 'comunidad', 'Semana Mundial del Espacio', 526, 701],
    ['497772112', 'aula', 'Trabajo en equipo', 560, 315],
    ['497816046', 'generaciones', 'Convivencia de la carrera', 560, 420],
    ['499553951', 'comunidad', 'En un congreso de tecnología', 560, 420],
    ['503648815', 'comunidad', 'Recorrido por una exposición', 560, 420],
    ['504120061', 'comunidad', 'Exposición de proyectos', 560, 747],
    ['504205714', 'aula', 'Presentación en el aula', 560, 420],
    ['504887610', 'aula', 'Clase con proyector', 560, 420],
    ['505374595', 'aula', 'En el salón de clases', 560, 420],
    ['505543817', 'recuerdos', 'Entrega de constancias', 560, 420],
    ['505614145', 'recuerdos', 'Grupo con sus constancias', 560, 420],
    ['505714392', 'recuerdos', 'Entrega de reconocimientos', 560, 420],
    ['511067031', 'comunidad', 'Conferencia', 560, 420],
    ['514287267', 'recuerdos', 'Foto de grupo con un reconocimiento', 560, 466],
    ['517384302', 'generaciones', 'Ceremonia en el auditorio', 206, 206],
    ['518340173', 'comunidad', 'Ceremonia de la región Poza Rica-Tuxpan', 560, 420],
    ['558900224', 'comunidad', 'Exposición de proyectos estudiantiles', 526, 935],
    ['669007349', 'generaciones', 'Grupo en el centro de cómputo', 560, 252],
    ['669852963', 'generaciones', 'La comunidad ITC al aire libre', 560, 373],
    ['903912444', 'generaciones', 'Generación con uniforme', 560, 420],
    ['904906241', 'comunidad', 'Visita de estudiantes', 206, 206],
    ['905793532', 'aula', 'Frente al clúster de cómputo de alto rendimiento', 560, 420],
    ['906368099', 'aula', 'Laboratorio de cómputo', 560, 420]
  ].map(function (f, i) {
    return { i: i, id: f[0], tema: f[1], texto: f[2], w: f[3], h: f[4], anio: f[5] || null,
             mini: 'media/fotos/mini/' + f[0] + '.webp', grande: 'media/fotos/' + f[0] + '.webp' };
  });
  window.ITCFotos = FOTOS;

  function etiqueta(f) { return TEMAS[f.tema] + (f.anio ? ' · ' + f.anio : ''); }

  /* ---------- Tira de fotos de la portada ---------- */
  (function () {
    var strip = document.getElementById('photoStrip');
    if (!strip) return;
    var pick = [10, 51, 47, 19, 32, 28, 49, 0, 20, 45, 5, 22, 33, 11, 36, 29].map(function (i) { return FOTOS[i]; });
    var tilt = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5];
    function add(f, k, hidden) {
      var a = make('a');
      a.href = 'fotos.html';
      a.style.setProperty('--r', tilt[k % tilt.length] + 'deg');
      if (hidden) { a.setAttribute('aria-hidden', 'true'); a.tabIndex = -1; }
      var img = make('img');
      img.src = f.mini; img.width = f.w; img.height = f.h; img.loading = 'lazy'; img.decoding = 'async';
      img.alt = hidden ? '' : f.texto;
      a.appendChild(img);
      strip.appendChild(a);
    }
    pick.forEach(function (f, k) { add(f, k, false); });
    /* segunda copia para que el movimiento sea continuo */
    if (!reduce) pick.forEach(function (f, k) { add(f, k, true); });
  })();

  /* ---------- Galería ---------- */
  var grid = document.getElementById('gallery');
  if (!grid) return;
  var filterBox = document.getElementById('galleryFilter'), countEl = document.getElementById('galleryCount');
  var box = document.getElementById('lightbox'), lbImg = document.getElementById('lbImg');
  var lbText = document.getElementById('lbText'), lbTag = document.getElementById('lbTag'), lbPos = document.getElementById('lbPos');
  var tema = 'todas', visibles = FOTOS.slice(), actual = 0;

  /* tarjetas */
  var items = FOTOS.map(function (f) {
    var b = make('button', 'gitem' + (f.w < 300 ? ' small' : ''));
    b.type = 'button';
    /* ruta completa: dentro de una variable de CSS, una ruta relativa se buscaría desde la carpeta css/ */
    if (f.w < 300) b.style.setProperty('--bg-img', 'url("' + new URL(f.mini, document.baseURI).href + '")');
    b.setAttribute('aria-label', 'Ver en grande: ' + f.texto);
    var img = make('img');
    img.src = f.mini; img.width = f.w; img.height = f.h; img.alt = f.texto;
    img.loading = 'lazy'; img.decoding = 'async';
    b.appendChild(img);
    var cap = make('figcaption');
    cap.appendChild(make('small', null, etiqueta(f)));
    cap.appendChild(document.createTextNode(f.texto));
    b.appendChild(cap);
    b.addEventListener('click', function () { abrir(visibles.indexOf(f)); });
    grid.appendChild(b);
    return b;
  });

  /* las fotos entran suavemente al aparecer en pantalla */
  if (!reduce && 'IntersectionObserver' in window) {
    grid.classList.add('fx');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        setTimeout(function () { en.target.classList.remove('wait'); }, Math.random() * 180);
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (b) { b.classList.add('wait'); io.observe(b); });
  }

  /* filtros por tema */
  var chips = [];
  function contar(t) { return t === 'todas' ? FOTOS.length : FOTOS.filter(function (f) { return f.tema === t; }).length; }
  function chip(t, label) {
    var b = make('button', 'vchip');
    b.type = 'button';
    b.appendChild(document.createTextNode(label));
    b.appendChild(make('small', null, contar(t)));
    b.setAttribute('aria-pressed', t === tema ? 'true' : 'false');
    b.addEventListener('click', function () { filtrar(t); });
    chips.push({ t: t, el: b });
    filterBox.appendChild(b);
  }
  chip('todas', 'Todas');
  Object.keys(TEMAS).forEach(function (t) { chip(t, TEMAS[t]); });
  function filtrar(t) {
    tema = t;
    chips.forEach(function (c) { c.el.setAttribute('aria-pressed', c.t === t ? 'true' : 'false'); });
    visibles = FOTOS.filter(function (f) { return t === 'todas' || f.tema === t; });
    FOTOS.forEach(function (f, k) {
      var show = t === 'todas' || f.tema === t;
      items[k].hidden = !show;
      if (show && !reduce) { items[k].animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)', delay: Math.min(visibles.indexOf(f), 12) * 25, fill: 'backwards' }); }
    });
    countEl.textContent = visibles.length === FOTOS.length ? FOTOS.length + ' fotos' : visibles.length + ' de ' + FOTOS.length + ' fotos';
  }
  countEl.textContent = FOTOS.length + ' fotos';

  /* visor */
  function mostrar(n, dir) {
    actual = (n + visibles.length) % visibles.length;
    var f = visibles[actual];
    lbImg.src = f.grande;
    lbImg.alt = f.texto;
    lbText.textContent = f.texto;
    lbTag.textContent = etiqueta(f);
    lbPos.textContent = (actual + 1) + ' / ' + visibles.length;
    if (!reduce) {
      lbImg.style.setProperty('--from', (dir || 0) * 40 + 'px');
      lbImg.classList.remove('swap'); void lbImg.offsetWidth; lbImg.classList.add('swap');
    }
    /* precarga las vecinas para que el cambio sea inmediato */
    [actual + 1, actual - 1].forEach(function (k) { var v = visibles[(k + visibles.length) % visibles.length]; (new Image()).src = v.grande; });
  }
  function abrir(n) {
    if (n < 0) return;
    mostrar(n, 0);
    if (box.showModal) box.showModal(); else box.setAttribute('open', '');
  }
  function cerrar() { if (box.close) box.close(); else box.removeAttribute('open'); }
  document.getElementById('lbPrev').addEventListener('click', function () { mostrar(actual - 1, -1); });
  document.getElementById('lbNext').addEventListener('click', function () { mostrar(actual + 1, 1); });
  document.getElementById('lbClose').addEventListener('click', cerrar);
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(actual + 1, 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(actual - 1, -1); }
  });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-stage')) cerrar(); });
  /* deslizar con el dedo */
  var x0 = null;
  box.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') x0 = e.clientX; });
  box.addEventListener('pointerup', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
})();
