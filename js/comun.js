/* Lo que comparten todas las páginas: la fecha de actualización del pie, el menú en pantallas chicas y la cuenta regresiva de la portada. */
(function () {
  'use strict';

  /* Fecha que aparece en el pie de todas las páginas. Cámbiala cada vez que publiques:
     si al abrir la página publicada ves la fecha nueva, ya estás viendo la última versión. */
  var ACTUALIZADO = '16 de noviembre de 2026';
  Array.prototype.forEach.call(document.querySelectorAll('[data-actualizado]'), function (el) {
    el.textContent = 'Actualizado: ' + ACTUALIZADO;
  });

  /* ---------- Menú ---------- */
  var nav = document.querySelector('.nav'), toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  }

  /* ---------- Cuenta regresiva: la celebración es el 1 y 2 de diciembre de 2026 ---------- */
  var box = document.getElementById('countdown');
  if (box) {
    var num = box.querySelector('b'), label = box.querySelector('strong');
    var DAY1 = new Date(2026, 11, 1);
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.round((DAY1 - today) / 86400000);
    if (days > 1) { num.textContent = days; label.textContent = 'días para la celebración'; }
    else if (days === 1) { num.textContent = '1'; label.textContent = 'día para la celebración'; }
    else if (days === 0) { num.textContent = 'Hoy'; label.textContent = 'Primer día de la celebración'; }
    else if (days === -1) { num.textContent = 'Hoy'; label.textContent = 'Segundo día de la celebración'; }
    else { num.textContent = '15'; label.textContent = 'años celebrados. ¡Gracias por acompañarnos!'; }
  }
})();
