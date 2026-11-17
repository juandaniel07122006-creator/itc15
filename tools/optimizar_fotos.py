"""Convierte las fotos de media/lineaTiempo a WebP para la web.

Uso (desde la carpeta del proyecto):
    python tools/optimizar_fotos.py

Por cada foto crea dos archivos con el mismo nombre corto (el primer número del nombre original):
    media/fotos/<nombre>.webp        hasta 1600 px por lado, para verla en grande
    media/fotos/mini/<nombre>.webp   hasta 560 px de ancho, para la cuadrícula

Las fotos que ya están convertidas y no cambiaron se saltan. Las originales no se tocan.
Necesita Pillow:  pip install pillow
"""
import os
import sys
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "media", "lineaTiempo")
DESTINO = os.path.join(RAIZ, "media", "fotos")
MINI = os.path.join(DESTINO, "mini")
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")
# Fotos que no se publican. 504069017 es una lista de asistencia con nombres y calificaciones de estudiantes.
EXCLUIR = {"504069017"}


def nombre_corto(archivo):
    base = os.path.splitext(archivo)[0]
    return base.split("_")[0] or base


def convertir(origen, destino, maximo, solo_ancho, calidad):
    im = ImageOps.exif_transpose(Image.open(origen)).convert("RGB")
    if solo_ancho:
        if im.width > maximo:
            im = im.resize((maximo, round(im.height * maximo / im.width)), Image.LANCZOS)
    else:
        im.thumbnail((maximo, maximo), Image.LANCZOS)
    im.save(destino, "WEBP", quality=calidad, method=6)
    return im.size


def main():
    os.makedirs(MINI, exist_ok=True)
    archivos = sorted(f for f in os.listdir(ORIGEN) if f.lower().endswith(EXTENSIONES))
    antes = despues = 0
    for archivo in archivos:
        ruta = os.path.join(ORIGEN, archivo)
        corto = nombre_corto(archivo)
        if corto in EXCLUIR:
            continue
        grande = os.path.join(DESTINO, corto + ".webp")
        chica = os.path.join(MINI, corto + ".webp")
        antes += os.path.getsize(ruta)
        if not (os.path.exists(grande) and os.path.exists(chica) and os.path.getmtime(grande) >= os.path.getmtime(ruta)):
            convertir(ruta, grande, 1600, False, 80)
            mw, mh = convertir(ruta, chica, 560, True, 72)
            print("convertida  %-16s miniatura %d x %d   ->  ['%s', 'tema', 'descripción', %d, %d],"
                  % (corto, mw, mh, corto, mw, mh))
        despues += os.path.getsize(grande) + os.path.getsize(chica)
    print("\n%d fotos · originales %.1f MB · versiones web (grande + mini) %.1f MB"
          % (len(archivos), antes / 1048576, despues / 1048576))


if __name__ == "__main__":
    sys.exit(main())
