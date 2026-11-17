/* Escenas del hackathon (código que se escribe solo, botones de lenguaje, compilación) y marcador del torneo de videojuegos. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  /* ---------- Hackathon: código que se escribe solo ---------- */
  var snippets = [
    { lang: 'Python + IA', file: 'equipo_ia.py', code:
'# IA permitida, sin restricciones\nfrom equipo import ia\nidea = ia.proponer("reto ITC 15")\nprint(idea.construir(horas=48))' },
    { lang: 'Python', file: 'celebrar.py', code:
'def celebrar(anios=15):\n    for a in range(1, anios + 1):\n        print(f"ITC año {a}")\n    return "15 años de innovación"' },
    { lang: 'JavaScript', file: 'fiesta.js', code:
'const itc = { anios: 15, comunidad: "ITC" };\nconst fiesta = () =>\n  `ITC cumple ${itc.anios} años`;\nconsole.log(fiesta());' },
    { lang: 'Java', file: 'Aniversario.java', code:
'public class Aniversario {\n  public static void main(String[] a) {\n    int anios = 15;\n    System.out.println("ITC " + anios);\n  }\n}' },
    { lang: 'C++', file: 'itc.cpp', code:
'#include <iostream>\nint main() {\n  for (int i = 1; i <= 15; i++)\n    std::cout << "Año " << i << "\\n";\n  return 0;\n}' },
    { lang: 'Rust', file: 'main.rs', code:
'fn main() {\n    let anios: u8 = 15;\n    // hackathon en marcha\n    println!("ITC cumple {} años", anios);\n}' },
    { lang: 'Go', file: 'main.go', code:
'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("ITC 15 años")\n}' }
  ];
  var kw = /^(def|for|in|range|return|print|const|let|fn|func|public|class|static|void|int|main|package|import|from|true|false|u8)$/;
  var tok = /(\/\/[^\n]*|#[^\n]*|f?"(?:[^"\\\n]|\\.)*"?|`[^`]*`?|\b\d+\b|\b[A-Za-z_]+\b)/g;
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function hl(src) {
    var out = '', last = 0, m;
    tok.lastIndex = 0;
    while ((m = tok.exec(src))) {
      out += esc(src.slice(last, m.index));
      var t = m[0], cls = null;
      if (t[0] === '/' || t[0] === '#') cls = 't-com';
      else if (t[0] === '"' || t[0] === '`' || t.slice(0, 2) === 'f"') cls = 't-str';
      else if (/^\d/.test(t)) cls = 't-num';
      else if (kw.test(t)) cls = 't-kw';
      out += cls ? '<span class="' + cls + '">' + esc(t) + '</span>' : esc(t);
      last = m.index + t.length;
    }
    return out + esc(src.slice(last));
  }
  var codeEl = document.getElementById('code'), fileEl = document.getElementById('termFile'), langEl = document.getElementById('termLang');
  var si = 0, typeRun = 0;
  function show(s, n) {
    fileEl.textContent = s.file; langEl.textContent = s.lang;
    codeEl.innerHTML = hl(s.code.slice(0, n)) + '<span class="caret"></span>';
  }

  /* Botones para elegir el lenguaje; si nadie elige, la terminal los recorre sola */
  var chipBox = document.getElementById('langChips');
  var chips = snippets.map(function (s, i) {
    var b = make('button', 'lang-chip', s.lang);
    b.type = 'button';
    b.addEventListener('click', function () { si = i; typeSnippet(); });
    if (chipBox) chipBox.appendChild(b);
    return b;
  });
  function markChip() {
    chips.forEach(function (c, i) {
      c.classList.toggle('on', i === si);
      c.setAttribute('aria-pressed', i === si ? 'true' : 'false');
    });
  }
  function typeSnippet() {
    var run = ++typeRun, s = snippets[si], n = 0;
    markChip();
    if (reduce) { show(s, s.code.length); return; }
    (function step() {
      if (run !== typeRun) return;
      n += 1 + (Math.random() < .3 ? 1 : 0);
      show(s, n);
      if (n < s.code.length) setTimeout(step, 28 + Math.random() * 40);
      else setTimeout(function () {
        if (run !== typeRun) return;
        si = (si + 1) % snippets.length;
        typeSnippet();
      }, 1800);
    })();
  }
  typeSnippet();

  var langs = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'TypeScript', 'Kotlin', 'PHP', 'SQL', 'Swift', 'Dart', 'HTML/CSS', 'IA', 'Prompts', 'Agentes'];
  var colors = ['var(--neon-g)', 'var(--neon-b)', 'var(--white)'];
  var fl = document.getElementById('floaters');
  function spawn() {
    var el = make('span', 'floater', langs[Math.floor(Math.random() * langs.length)]);
    el.style.left = (Math.random() * 50) + '%';
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (6 + Math.random() * 5) + 's';
    fl.appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); });
  }
  if (!reduce) { for (var i = 0; i < 4; i++) setTimeout(spawn, i * 600); setInterval(spawn, 1000); }

  /* Compilación sincronizada con la cámara (ciclo de 8 s) */
  var build = document.getElementById('build'), buildTxt = document.getElementById('buildTxt'), testsEl = document.getElementById('tests');
  var buildTimers = [];
  function runBuild() {
    buildTimers.forEach(clearTimeout); buildTimers = [];
    build.classList.remove('ok'); buildTxt.textContent = 'Compilando…'; testsEl.textContent = '0/15 tests';
    for (var t = 1; t <= 15; t++) (function (t) {
      buildTimers.push(setTimeout(function () { testsEl.textContent = t + '/15 tests'; }, 8000 * 0.7 * t / 15));
    })(t);
    buildTimers.push(setTimeout(function () { build.classList.add('ok'); buildTxt.textContent = 'Build exitoso ✓'; }, 8000 * 0.72));
  }
  if (!reduce) {
    runBuild();
    document.querySelector('.cam-hack').addEventListener('animationiteration', runBuild);
  } else { build.classList.add('ok'); buildTxt.textContent = 'Build exitoso ✓'; testsEl.textContent = '15/15 tests'; document.querySelector('.pbar i').style.width = '100%'; }

  /* El hackathon dura 48 horas */
  var HACK_SECONDS = 48 * 3600;
  var hackT = document.getElementById('hackTimer'), left = HACK_SECONDS - 1;
  if (!reduce) setInterval(function () {
    left = left > 0 ? left - 1 : HACK_SECONDS - 1;
    var h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), s = left % 60;
    hackT.textContent = [h, m, s].map(function (x) { return String(x).padStart(2, '0'); }).join(':');
  }, 1000);

  /* ---------- Torneo de videojuegos: puntaje del marcador ---------- */
  var scoreEl = document.getElementById('score'), score = 15000;
  if (scoreEl && !reduce) setInterval(function () {
    score += Math.floor(Math.random() * 150);
    scoreEl.textContent = String(score).padStart(6, '0');
  }, 400);
})();
