# Hochzeitsalbum – René & Stefanie

## Schnellstart
1. Lade das ZIP herunter und entpacke es.
2. Öffne einen Terminal im Ordner und starte einen kleinen lokalen Server:
   ```bash
   python -m http.server 8000
   ```
3. Öffne `http://localhost:8000` im Browser.

## Eigene Bilder (Batch, ~100 Stück)
- Lege Originale in den Ordner `originals/` (neu anlegen).
- Führe `python tools/build_images.py` aus.
- Das Skript erzeugt optimierte Varianten (JPG + WebP) unter `images/` und ein `assets/manifest.json`,
  das die Website automatisch einliest.

## Design
- Dunkles, dezentes Layout mit Serifenschrift „Cormorant Garamond“ und Goldakzenten (`#d4af37`).
- Mobile-First, responsive Masonry-Galerie (CSS Columns), Lightbox, Keyboard & Touch.

Viel Freude! ❤️
