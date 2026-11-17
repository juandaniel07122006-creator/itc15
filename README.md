# Celebración 15 Aniversario ITC

Página informativa del 15 aniversario de **Ingeniería en Tecnologías Computacionales** (Universidad Veracruzana), 2011–2026.
La celebración es el **martes 1 y miércoles 2 de diciembre de 2026**.

## Páginas

| Página | Archivo | Qué contiene | Scripts |
|---|---|---|---|
| Inicio | `index.html` | Portada con cuenta regresiva, accesos a las demás páginas, «El porqué», votación y tira de fotos | `comun.js`, `votacion.js`, `fotos.js` |
| La carrera | `carrera.html` | Datos oficiales, objetivo, campo laboral, fortalezas e historia | `comun.js` |
| Eventos | `eventos.html` | Los tres torneos, las dinámicas y la agenda | `comun.js`, `gol.js`, `torneos.js` |
| Carteles | `carteles.html` | Un cartel por actividad | `comun.js`, `carteles.js` |
| Fotos | `fotos.html` | Galería de los 15 años con filtros y visor | `comun.js`, `fotos.js` |
| Colabora | `contacto.html` | Inscripción (pendiente) y contacto | `comun.js`, `contacto.js` |

El menú y el pie de página están copiados en las seis páginas. Si cambias un enlace del menú, cámbialo en todas. En cada página, el enlace de la página actual lleva `aria-current="page"`.

## Estructura

```
*.html               Las seis páginas
css/styles.css       Estilos generales, colores y las escenas de los tres torneos
css/secciones.css    Cuenta regresiva, votación, carteles, agenda, inscripción y contacto (y los estilos del torito, en pausa)
css/paginas.css      Menú, encabezados de página, portada, la carrera y la galería de fotos
js/comun.js          Fecha de actualización del pie, menú del teléfono y cuenta regresiva (todas las páginas)
js/votacion.js       Gráfica de la votación, podio y tabla
js/fotos.js          Lista de fotos, galería, visor y tira de fotos de la portada
js/toro.js           Animación 3D del torito mecánico (en pausa: ninguna página lo carga)
js/gol.js            Animación del gol (torneo de fútbol)
js/torneos.js        Escenas del hackathon y marcador del torneo de videojuegos
js/carteles.js       Carteles de las actividades
js/contacto.js       Botón para copiar el correo
media/lineaTiempo/   Fotos originales de los 15 años. No se suben a GitHub
media/fotos/         Fotos convertidas a WebP; media/fotos/mini/ guarda las miniaturas
media/gol/           Capas de la animación del gol (WebP)
tools/optimizar_fotos.py   Convierte las fotos de media/lineaTiempo a WebP
pendiente/           Piezas guardadas para volver a usarlas (la sección del torito). No se sube a GitHub
.gitignore           Lo que no se sube a GitHub: media/lineaTiempo, pendiente y archivos del sistema
```

## Cómo verla

1. Abre la carpeta en Visual Studio Code.
2. Instala la extensión **Live Server** (de Ritwick Dey).
3. Clic derecho en `index.html` → **Open with Live Server**. La página se recarga sola con cada cambio.

También funciona abriendo `index.html` directamente en el navegador.

La página necesita internet solo para las tipografías (Google Fonts). Sin internet funciona igual, con letras del sistema.

## Publicar en GitHub Pages

La página se publica gratis con GitHub Pages y se actualiza con **GitHub Desktop**, una aplicación con botones (no hace falta usar la terminal).

### La primera vez

1. Crea una cuenta en [github.com](https://github.com) e instala [GitHub Desktop](https://desktop.github.com). Inicia sesión en la aplicación con tu cuenta.
2. En GitHub Desktop: **File → Add local repository** y elige la carpeta `celebracion15AniversarioITC`. Como todavía no es un repositorio, la aplicación ofrece **create a repository**: dale clic.
3. En la ventana que aparece, pon de nombre `itc15`, deja **Git ignore** en **None** (el proyecto ya trae su `.gitignore`) y presiona **Create repository**.
4. Revisa la lista de archivos de la izquierda: **no debe aparecer nada de `media/lineaTiempo` ni de `pendiente`**. Si aparece, no sigas y revisa el `.gitignore`.
5. Presiona **Publish repository**, quita la marca de **Keep this code private** (GitHub Pages gratis necesita un repositorio público) y confirma.
6. En github.com, abre el repositorio: **Settings → Pages → Branch: main** y carpeta **/ (root)** → **Save**.
7. En 1 o 2 minutos la página queda en `https://TU-USUARIO.github.io/itc15/`.

### Cada vez que cambies algo

1. Edita en VS Code y revisa con Live Server.
2. Cambia la fecha `ACTUALIZADO` al inicio de `js/comun.js` (es la que aparece en el pie de todas las páginas).
3. En GitHub Desktop escribe qué cambiaste (por ejemplo, «Agrego horario del torneo»), presiona **Commit to main** y luego **Push origin**.
4. En github.com, en la pestaña **Actions**, espera la palomita verde de «pages build and deployment».
5. Abre la página publicada con **Ctrl + F5** o en una ventana de incógnito. Si ves la fecha nueva en el pie, ya estás viendo la última versión. GitHub puede tardar hasta unos 10 minutos en mostrar la versión nueva.

Para deshacer un cambio publicado: en GitHub Desktop, pestaña **History**, clic derecho sobre el cambio → **Revert changes in commit**, y luego **Push origin**.

### Qué queda público

En la página publicada se ven las seis páginas. En el repositorio, además, cualquiera puede leer el código, `tools/` y este README (que menciona el torito en pausa y la foto que no se publica). Lo que está en `.gitignore` no se sube.

## Fotos de los 15 años

Las fotos originales están en `media/lineaTiempo`. La página no las usa directamente: usa copias en WebP, más ligeras.

Para agregar fotos:

1. Copia las fotos nuevas a `media/lineaTiempo`.
2. En la terminal de VS Code, desde la carpeta del proyecto, ejecuta `python tools/optimizar_fotos.py` (necesita Pillow: `pip install pillow`). Crea `media/fotos/<id>.webp` (hasta 1600 px) y `media/fotos/mini/<id>.webp` (560 px de ancho). El `<id>` es el primer número del nombre del archivo original.
3. Agrega una línea a la lista `FOTOS` de `js/fotos.js` con el id, el tema, la descripción y el tamaño de la miniatura (el script lo imprime). Si sabes el año, agrégalo al final y aparecerá junto a la descripción.

Temas: `generaciones`, `aula` (aula y laboratorio), `comunidad` (eventos y vinculación) y `recuerdos` (prensa y reconocimientos).

Las fotos no traen fecha. Solo dos tienen año porque se ve en la imagen (la felicitación de Navidad 2016). Las descripciones las escribí a partir de lo que se ve en cada foto; conviene revisarlas.

La foto `504069017` (una lista de asistencia con nombres y calificaciones de estudiantes) no se publica: está en la lista `EXCLUIR` de `tools/optimizar_fotos.py`.

## Carteles

Los carteles se dibujan con la lista `CARTELES` de `js/carteles.js`. Cada actividad tiene estos datos:

| Dato | Para qué sirve |
|---|---|
| `nombre`, `tipo`, `lugar` | Título, etiqueta («Torneo», «Dinámica»…) y lugar en la votación |
| `texto` | Descripción que aparece al abrir el cartel |
| `fecha` | Si no se pone, usa «1 y 2 de diciembre» |
| `horario`, `sede`, `precio` | Si no se ponen, el cartel dice «Por confirmar» |
| `imagen` | Ruta de un cartel ya diseñado, por ejemplo `'media/carteles/videojuegos.jpg'`. Si existe, la página muestra esa imagen en lugar del cartel provisional |

Ejemplo para completar un cartel:

```js
{ nombre: 'Torneo de fútbol', tipo: 'Torneo', lugar: '3.º más votado · 22 votos', icono: 'ball', c: ['#0f5fd1', '#06101f'],
  fecha: 'Martes 1 de diciembre', horario: 'De 10:00 a 13:15', sede: 'Cancha de la FIEC', precio: '$50 por equipo',
  texto: 'Equipos de todas las generaciones por la Copa 15 años.' },
```

## Torito mecánico (en pausa)

El torito mecánico (el Juego Grande) se quitó de la página mientras se aprueba. Todo lo necesario para volver a ponerlo está guardado:

- La sección completa, con su texto y su escena: `pendiente/torito-seccion.html` (solo en tu computadora: `pendiente/` no se sube a GitHub)
- La animación: `js/toro.js` (sin cambios)
- Sus estilos: siguen en `css/secciones.css`

Para volver a ponerlo:

1. Pega el contenido de `pendiente/torito-seccion.html` en `eventos.html`, justo antes de `<section class="band events-band" id="eventos">`.
2. En `eventos.html`, agrega `<script src="js/toro.js"></script>` después de `<script src="js/gol.js"></script>`.
3. En `js/carteles.js`, agrega su cartel a `CARTELES`, después del torneo de videojuegos:
   ```js
   { nombre: 'Torito mecánico', tipo: 'Juego Grande', lugar: '2.º más votado · 45 votos', icono: 'bull', c: ['#b8862b', '#2b1c08'],
     fecha: 'Solo el martes 1 de diciembre',
     texto: 'El Juego Grande de la celebración. Súbete, agárrate fuerte y aguanta lo más que puedas.' },
   ```
4. En `js/votacion.js`, cambia `{ name: 'Juego Grande', v: [...] }` por `{ name: 'Torito mecánico', alias: 'Juego Grande', v: [...] }`.
5. Vuelve a mencionarlo en los textos: la portada (frase principal y tarjeta «Eventos»), el encabezado de `eventos.html`, la cinta de actividades, la agenda (en el día 1: `<em class="sched-only">Torito mecánico · solo este día</em>`) y la lista de actividades del formulario en `contacto.html`.

La animación usa three.js, que se descarga de internet; sin conexión, en su lugar aparece un aviso.

Es una escena 3D en `<canvas>` hecha con three.js y armada solo con figuras básicas (no usa modelos ni imágenes). Dura 15.6 segundos y se repite.
Se pausa sola cuando no está en pantalla y, si la persona tiene activada la opción de reducir movimiento, muestra una imagen fija de la monta.

| Escena | Segundos | Qué pasa |
|---|---|---|
| Preparación | 0.0 – 1.2 | El jinete se acomoda y la cámara baja hacia el ruedo |
| Monta | 1.2 – 9.2 | 8 segundos exactos en tres niveles de velocidad; el marcador cuenta el tiempo |
| Vuelo | 9.2 – 11.4 | Sale volando en cámara lenta, el sombrero se va por su lado y cae en el colchón inflable |
| Festejo | 11.4 – 15.6 | Polvo, confeti, el toro resopla y el jinete levanta los brazos; desvanecido y vuelta a empezar |

Dónde se ajusta, en `js/toro.js`:

- `warp`: reloj de la escena (pares de tiempo real y tiempo de la escena). Controla la cámara lenta.
- `intensity`, `phase` y `yawAt`: fuerza, ritmo y giro del toro.
- `CAM_S`, `camR` y `camH`: distancia y altura de la cámara en cada momento.
- Los colores del toro, el jinete y el ruedo están en las llamadas `M('#color', …)`.

Para revisar un instante concreto, abre la consola del navegador y escribe `ITCToro.seek(10.2)`. Con `ITCToro.play()` vuelve a reproducirse.

## Votación

Los datos están al inicio de `js/votacion.js`, en la lista `DATA`: una línea por actividad con los votos de las generaciones 2026, 2025, 2024 y 2023, en ese orden. Si cambian los votos, basta con editar esos números: los totales, el podio, la tabla y la gráfica se calculan solos.

Los cuatro colores de la gráfica (`--s1` a `--s4` en `css/secciones.css`) se revisaron para que se distingan con daltonismo. Si se cambian, conviene volver a revisarlos.

Las etiquetas «1.º más votado · 70 votos» de los torneos y de los carteles están escritas a mano (en `index.html` y en `CARTELES`); si cambian los votos hay que actualizarlas ahí.

## Animación del gol

Es una escena en `<canvas>` de 16:9 que se dibuja con las imágenes de `media/gol/`. Dura 7.1 segundos y se repite.
Se pausa sola cuando no está en pantalla y, si la persona tiene activada la opción de reducir movimiento, muestra solo el momento del gol.

| Escena | Segundos | Qué pasa |
|---|---|---|
| Preparación | 0.0 – 1.0 | Plano abierto, el jugador respira, la cámara avanza despacio |
| Carrera | 1.0 – 1.7 | El jugador corre hacia el balón a velocidad normal |
| Golpe | 1.7 – 2.6 | Cámara lenta (0.26x), el contacto ocurre cerca de 2.2 s, sacudida y destello suave |
| Vuelo | 2.6 – 3.5 | El balón gira con estela, la cámara lo sigue hasta la portería |
| Impacto | 3.5 – 3.6 | Congelado breve, destello blanco y sacudida |
| Gol | 3.6 – 4.9 | La red ondula, aparece **¡GOOOL!**, el marcador pasa de 14 a 15 y cae confeti |
| Celebración | 4.9 – 7.1 | Cámara lenta, luces del estadio más intensas y desvanecido a negro |

Para cambiar los tiempos, edita estas líneas al inicio de `js/gol.js`:

- `warp`: pares de tiempo real y tiempo de la jugada. Cuanto más lejos estén dos tiempos reales para el mismo tramo de jugada, más lenta se ve.
- `CAM_T` y las tres listas de `camS`, `camX` y `camY`: zoom y centro de la cámara en cada momento.
- Los degradados de color están en la función `grade` (azul del cielo, verde del césped, viñeta y brillo del gol).

Para revisar un instante concreto, abre la consola del navegador y escribe `ITCGol.seek(4.3)`. Con `ITCGol.play()` vuelve a reproducirse.

Las imágenes de `media/gol/` se pueden reemplazar por otras con el mismo orden y tamaño de láminas. Si cambia la posición de las poses, hay que ajustar la tabla `POSE_DATA` de `js/gol.js`.

## Colores

Definidos al inicio de `css/styles.css` en `:root`:

- Verde institucional: `--green` `#12924a`
- Azul institucional: `--blue` `#0f5fd1`
- Fondo: `--bg` blanco

## Pendiente

- [ ] Visto bueno de la coordinación de la FIEC para publicar con el nombre y el logo de la UV y las fotos de estudiantes
- [ ] Aprobación del torito mecánico (Juego Grande). Si se aprueba, ver «Torito mecánico (en pausa)»
- [ ] Horario, lugar y precio de cada actividad (van en los carteles: lista `CARTELES` de `js/carteles.js`)
- [ ] Carteles diseñados, si se van a usar imágenes en lugar de los provisionales
- [ ] Lugar exacto de la celebración (la portada dice «FIEC · Poza Rica»)
- [ ] Qué actividad va en cada día (la agenda solo fija el hackathon de 48 horas)
- [ ] Año de las fotos de la galería y revisión de sus descripciones (`js/fotos.js`)
- [ ] Fotos reales para las escenas de los torneos (hoy usan fotos de Unsplash)
- [ ] Más fechas de la historia de la carrera (`carrera.html`): primera generación, laboratorios, eventos importantes
- [ ] Reglas y premios de cada actividad
- [ ] Activar el formulario de inscripción y conectarlo (por ejemplo, a Google Forms)
- [ ] Logo oficial de la UV desde el [manual de identidad](https://www.uv.mx/identidad-institucional/manual/)

## Datos de la carrera

Los datos de `carrera.html` (sede, créditos, duración, acreditación CACEI de diciembre de 2017, objetivo, campo laboral y fortalezas) vienen de la [página oficial de la carrera](https://www.uv.mx/ofertaeducativa/ingenieria-en-tecnologias-computacionales/). Esa página no publica misión, visión ni el año de inicio; el año 2011 viene del logo del aniversario.

## Créditos de imágenes

- Fotos de los 15 años (`media/lineaTiempo`): proporcionadas por el equipo ITC.
- Fotos de referencia de las escenas del hackathon y del torneo de videojuegos: [Unsplash](https://unsplash.com) (licencia Unsplash, uso libre).
- Imágenes de la animación del gol (estadio, jugador y balón): generadas con IA, entregadas por el equipo en `Imagenes_animacion_gol.zip`.
- Logo UV: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo-UV.jpg), CC BY-SA 4.0.
- Logo del 15 aniversario: proporcionado por el equipo ITC.
