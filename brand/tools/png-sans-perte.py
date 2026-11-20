"""Recompression sans perte des cartes PNG générées (sdf.mjs, name-trace.mjs) : le PNG du canvas est peu compressé.
python3 png-sans-perte.py fichier.png… → réécrit chaque fichier en PNG optimisé ; RVB si l'alpha est partout opaque
(WebGL et getImageData relisent alors alpha = 255, comme avant). Vérifie que chaque pixel relu est identique au bit près
(cartes 16 bits r/g comprises), sinon garde l'original."""
import io, os, sys
from PIL import Image

for f in sys.argv[1:]:
    im = Image.open(f); im.load()
    src = im.convert('RGBA')
    opaque = src.getchannel('A').getextrema() == (255, 255)
    buf = io.BytesIO(); (src.convert('RGB') if opaque else src).save(buf, 'PNG', optimize=True, compress_level=9)
    if Image.open(io.BytesIO(buf.getvalue())).convert('RGBA').tobytes() != src.tobytes():
        print(f, ': différence, original gardé'); continue
    avant = os.path.getsize(f)
    if len(buf.getvalue()) < avant:
        open(f, 'wb').write(buf.getvalue())
    print(f'{f} : {avant // 1024} → {min(avant, len(buf.getvalue())) // 1024} Ko, pixels identiques')
