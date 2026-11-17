/* Carteles de las actividades (carteles.html). */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  /* ---------- Carteles ----------
     Cada cartel se dibuja con estos datos. Cuando exista el cartel diseñado, pon su ruta en "imagen"
     (por ejemplo 'media/carteles/videojuegos.jpg') y la página mostrará esa imagen en su lugar. */
  var FECHA = '1 y 2 de diciembre';
  var CARTELES = [
    { nombre: 'Torneo de videojuegos', tipo: 'Torneo', lugar: '1.º más votado · 70 votos', icono: 'gamepad', c: ['#12924a', '#0b4aa6'],
      texto: 'La actividad favorita de la comunidad: eliminatorias y final entre generaciones.' },
    { nombre: 'Torneo de fútbol', tipo: 'Torneo', lugar: '3.º más votado · 22 votos', icono: 'ball', c: ['#0f5fd1', '#06101f'],
      texto: 'Equipos de todas las generaciones por la Copa 15 años.' },
    { nombre: 'Memorama', tipo: 'Dinámica', lugar: '4.º más votado · 17 votos', icono: 'cards', c: ['#0c7038', '#06101f'],
      texto: 'Memoria y rapidez: gana quien encuentre más pares.' },
    { nombre: 'Lotería temática', tipo: 'Dinámica', lugar: '5.º más votado · 16 votos', icono: 'grid', c: ['#0b4aa6', '#12924a'],
      texto: 'La lotería de siempre, con cartas hechas para la celebración.' },
    { nombre: 'Mesa de regalos', tipo: 'Zona', lugar: '6.º más votado · 10 votos', icono: 'gift', c: ['#12924a', '#0b4aa6'],
      texto: 'Regalos y sorpresas de la celebración.' },
    { nombre: 'Juego con harina', tipo: 'Dinámica', lugar: '7.º más votado · 7 votos', icono: 'flour', c: ['#0f5fd1', '#06101f'],
      texto: 'Una dinámica para reír un rato entre generaciones.' },
    { nombre: 'Hackathon', tipo: 'Torneo', lugar: '8.º más votado · 6 votos', icono: 'code', c: ['#06101f', '#0c7038'],
      fecha: FECHA + ' · 48 horas', texto: '48 horas para resolver un reto con código, en equipo. Se puede usar inteligencia artificial sin restricciones.' },
    { nombre: 'Cabina de fotos', tipo: 'Zona', lugar: '9.º más votado · 6 votos', icono: 'camera', c: ['#0b4aa6', '#12924a'],
      texto: 'Llévate el recuerdo de los 15 años del ITC.' },
    { nombre: 'Carrera de cartones', tipo: 'Dinámica', lugar: '10.º más votado · 4 votos', icono: 'box', c: ['#0c7038', '#06101f'],
      texto: 'Una carrera diferente: a ver quién llega primero a la meta.' }
  ];
  var ICONS = {
    gamepad: '<path d="M7.5 8h9a5 5 0 0 1 4.600 7c-.6 1.500-2.100 1.900-3.100 1L16 14H8l-2 2c-1 .9-2.500.5-3.100-1A5 5 0 0 1 7.500 8z"/><path d="M8 10.300v3M6.500 11.800h3M15.500 10.800h.01M17.500 12.800h.01"/>',
    bull: '<path d="M4 4.500c-.4 3 1 5 4 5.500M20 4.500c.4 3-1 5-4 5.500"/><path d="M8 10c0-2 1.800-3.200 4-3.200s4 1.200 4 3.200v3.500c0 3.200-1.800 5.700-4 5.700s-4-2.500-4-5.700z"/><path d="M5.500 11l2.500.5M18.500 11l-2.500.5M10.300 16.300h3.400M10.200 12.300h.01M13.800 12.300h.01"/>',
    ball: '<circle cx="12" cy="12" r="8.500"/><path d="M12 8.200l3.400 2.500-1.300 4h-4.200l-1.300-4zM12 3.500v4.700M20.200 10.200l-4.800.5M17 18.800l-2.900-4.100M7 18.800l2.900-4.100M3.800 10.200l4.800.5"/>',
    cards: '<rect x="3.500" y="6" width="9" height="13" rx="1.500" transform="rotate(-9 8 12.500)"/><rect x="11.500" y="5" width="9" height="13" rx="1.500" transform="rotate(9 16 11.500)"/>',
    grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.300h16M4 14.700h16M9.300 4v16M14.700 4v16"/><circle cx="12" cy="12" r="1.100"/>',
    gift: '<rect x="4.500" y="10.500" width="15" height="9.500" rx="1"/><path d="M3.500 7.200h17v3.300h-17zM12 7.200V20M12 7.200c-1.500-3.200-5-3.200-5-1.200s3 1.200 5 1.200zM12 7.200c1.500-3.200 5-3.200 5-1.200s-3 1.200-5 1.200z"/>',
    flour: '<path d="M4 13.500h16a8 8 0 0 1-16 0z"/><path d="M7 13.500c.5-3.700 2.500-6 5-6s4.500 2.300 5 6"/><circle cx="12" cy="5" r="1.300"/>',
    code: '<path d="M8.500 7l-5 5 5 5M15.500 7l5 5-5 5M13.600 4.500l-3.200 15"/>',
    camera: '<path d="M4 8h3.200l1.500-2.200h6.600L16.800 8H20v10.500H4z"/><circle cx="12" cy="13" r="3.300"/>',
    box: '<path d="M4 8l8-4 8 4v8.500l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8.500"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }
  function poster(c, tag) {
    var el = make(tag, 'cartel');
    el.style.setProperty('--c1', c.c[0]);
    el.style.setProperty('--c2', c.c[1]);
    if (c.imagen) {
      el.classList.add('has-img');
      var img = make('img');
      img.src = c.imagen;
      img.alt = 'Cartel de ' + c.nombre;
      el.appendChild(img);
      return el;
    }
    el.appendChild(make('span', 'cartel-tag', c.tipo));
    var art = make('span', 'cartel-art');
    art.innerHTML = icon(c.icono);
    el.appendChild(art);
    var foot = make('span', 'cartel-foot');
    foot.appendChild(make('span', 'cartel-name', c.nombre));
    var meta = make('span', 'cartel-meta');
    meta.appendChild(make('b', null, c.fecha || FECHA));
    meta.appendChild(make('span', null, 'Precio: ' + (c.precio || 'por confirmar')));
    foot.appendChild(meta);
    el.appendChild(foot);
    return el;
  }
  (function () {
    var grid = document.getElementById('cartelGrid'), dialog = document.getElementById('cartelDialog');
    if (!grid || !dialog) return;
    var slot = document.getElementById('cdPoster'), facts = document.getElementById('cdFacts');

    function open(c) {
      slot.textContent = '';
      slot.appendChild(poster(c, 'div'));
      document.getElementById('cdRank').textContent = c.lugar;
      document.getElementById('cdTitle').textContent = c.nombre;
      document.getElementById('cdText').textContent = c.texto;
      facts.textContent = '';
      [['Fecha', c.fecha || FECHA], ['Horario', c.horario || 'Por confirmar'], ['Lugar', c.sede || 'Por confirmar'], ['Precio', c.precio || 'Por confirmar']].forEach(function (f) {
        facts.appendChild(make('dt', null, f[0]));
        facts.appendChild(make('dd', null, f[1]));
      });
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    }
    function close() { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }

    CARTELES.forEach(function (c) {
      var b = poster(c, 'button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ver el cartel de ' + c.nombre);
      b.addEventListener('click', function () { open(c); });
      if (!reduce) {
        /* el cartel se inclina hacia el cursor y le pasa un brillo por encima */
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          b.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(1) + 'deg');
          b.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(1) + 'deg');
          b.style.setProperty('--sx', (x * 100).toFixed(0) + '%');
          b.style.setProperty('--sy', (y * 100).toFixed(0) + '%');
        });
        b.addEventListener('pointerleave', function () {
          b.style.setProperty('--rx', '0deg');
          b.style.setProperty('--ry', '0deg');
        });
      }
      grid.appendChild(b);
    });
    dialog.querySelector('.cd-close').addEventListener('click', close);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
  })();
})();
