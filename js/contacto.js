/* Botón para copiar el correo de contacto (contacto.html). */
(function () {
  /* ---------- Contacto: copiar el correo ---------- */
  (function () {
    var btn = document.getElementById('copyMail'), mail = document.getElementById('contactMail'), msg = document.getElementById('copyMsg');
    if (!btn || !mail) return;
    function selectMail() {
      var range = document.createRange();
      range.selectNodeContents(mail);
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
    }
    btn.addEventListener('click', function () {
      var text = mail.textContent.trim();
      function done() { msg.textContent = 'Correo copiado.'; msg.classList.add('ok'); }
      function manual() { selectMail(); msg.textContent = 'Correo seleccionado: cópialo con Ctrl + C.'; msg.classList.remove('ok'); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, manual);
      else manual();
    });
  })();
})();
