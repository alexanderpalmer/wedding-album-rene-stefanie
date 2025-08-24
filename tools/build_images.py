#!/usr/bin/env python3
"""
tools/build_images.py
Erzeugt aus Originalbildern responsive Varianten (JPG & WebP) und ein manifest.json.
Nutzung:
  1) Lege Originale in ./originals
  2) Starte: python tools/build_images.py
  3) Öffne index.html mit einem lokalen Server (z.B. python -m http.server)
"""
import os, io, json, base64
from PIL import Image, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'originals')
OUT = os.path.join(ROOT, 'images')
ASSETS = os.path.join(ROOT, 'assets')
os.makedirs(OUT, exist_ok=True)
os.makedirs(ASSETS, exist_ok=True)

WIDTHS = [480, 960, 1600, 2200]

def slugify(name):
    s = name.lower()
    mapping = {'ä':'ae','ö':'oe','ü':'ue','ß':'ss'}
    for k,v in mapping.items():
        s = s.replace(k, v)
    s = ''.join(c if c.isalnum() else '-' for c in s)
    while '--' in s: s = s.replace('--', '-')
    return s.strip('-')

manifest = []
for root, dirs, files in os.walk(SRC):
    for fname in sorted(files):
        if not fname.lower().endswith(('.jpg','.jpeg','.png','.webp')):
            continue
        path = os.path.join(root, fname)
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)  # Korrigiert die Orientierung basierend auf EXIF-Daten
        img = img.convert('RGB')
        w, h = img.size
        base = os.path.splitext(fname)[0]
        slug = slugify(base)
        
        # Bestimme das Unterverzeichnis als Tag
        rel_path = os.path.relpath(root, SRC)
        if rel_path == '.':
            tags = []
        else:
            tags = [slugify(rel_path.replace(os.sep, '-'))]
        
        entry = {
            'slug': slug,
            'title': base,
            'alt': base,
            'tags': tags,
            'width': w, 'height': h,
            'srcset_webp': [],
            'srcset_jpg': [],
            'thumb_jpg': '', 'full_jpg': ''
        }
        for target in WIDTHS + [w]:
            target = min(target, w)
            ratio = target / w
            new_w = int(round(w * ratio))
            new_h = int(round(h * ratio))
            resized = img.resize((new_w, new_h), Image.LANCZOS)
            jpg = f'{slug}-{new_w}.jpg'
            webp = f'{slug}-{new_w}.webp'
            resized.save(os.path.join(OUT, jpg), 'JPEG', quality=85, optimize=True, progressive=True)
            resized.save(os.path.join(OUT, webp), 'WEBP', quality=80, method=6)
            entry['srcset_jpg'].append(f'images/{jpg} {new_w}w')
            entry['srcset_webp'].append(f'images/{webp} {new_w}w')
        entry['srcset_jpg'] = sorted(set(entry['srcset_jpg']), key=lambda s:int(s.split()[1][:-1]))
        entry['srcset_webp'] = sorted(set(entry['srcset_webp']), key=lambda s:int(s.split()[1][:-1]))
        widths = [int(s.split()[1][:-1]) for s in entry['srcset_jpg']]
        thumb_w = min([ww for ww in widths if ww >= 960], default=max(widths))
        full_w = max(widths)
        entry['thumb_jpg'] = f'images/{slug}-{thumb_w}.jpg'
        entry['full_jpg'] = f'images/{slug}-{full_w}.jpg'
        tiny_w = 24
        tr = tiny_w / w
        tiny = img.resize((tiny_w, max(1, int(h*tr))), Image.LANCZOS)
        buf = io.BytesIO(); tiny.save(buf, 'JPEG', quality=50)
        entry['placeholder'] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
        manifest.append(entry)

with open(os.path.join(ASSETS, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f'Fertig. {len(manifest)} Bilder im Manifest.')
