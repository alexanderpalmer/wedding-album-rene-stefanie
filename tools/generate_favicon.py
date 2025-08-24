#!/usr/bin/env python3
"""
tools/generate_favicon.py
Erstellt Favicons aus einem vorhandenen Bild des Hochzeitsalbums.
Nutzung: python tools/generate_favicon.py
"""

import os
from PIL import Image

# Konfiguration
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
IMAGES_DIR = os.path.join(ROOT, 'images')
OUTPUT_DIR = ROOT

# Wähle ein schönes Bild aus (kann angepasst werden)
SOURCE_IMAGE = 'hochzeit-steffi-und-rene-0301-480.jpg'  # Ein Bild aus der Trauung
SOURCE_PATH = os.path.join(IMAGES_DIR, SOURCE_IMAGE)

# Favicon-Größen
SIZES = [16, 32, 48, 64, 128, 152, 167, 180, 192, 256, 512]

def generate_favicons():
    if not os.path.exists(SOURCE_PATH):
        print(f"Bild {SOURCE_IMAGE} nicht gefunden!")
        return
    
    print(f"Erstelle Favicons aus: {SOURCE_IMAGE}")
    
    # Lade und bearbeite das Originalbild
    img = Image.open(SOURCE_PATH)
    
    # Schneide das Bild zu einem Quadrat zu (mittig)
    width, height = img.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    img_square = img.crop((left, top, right, bottom))
    
    # Erstelle verschiedene Größen
    for size in SIZES:
        favicon = img_square.resize((size, size), Image.LANCZOS)
        
        # ICO für klassische Browser
        if size in [16, 32, 48]:
            ico_path = os.path.join(OUTPUT_DIR, f'favicon-{size}x{size}.ico')
            favicon.save(ico_path, format='ICO', sizes=[(size, size)])
            print(f"  - favicon-{size}x{size}.ico")
        
        # PNG für moderne Browser und Apps
        png_path = os.path.join(OUTPUT_DIR, f'favicon-{size}x{size}.png')
        favicon.save(png_path, format='PNG', optimize=True)
        print(f"  - favicon-{size}x{size}.png")
    
    # Hauptfavicon als favicon.ico (Multi-Size)
    favicon_multi = []
    for size in [16, 32, 48]:
        favicon_size = img_square.resize((size, size), Image.LANCZOS)
        favicon_multi.append(favicon_size)
    
    main_favicon_path = os.path.join(OUTPUT_DIR, 'favicon.ico')
    favicon_multi[0].save(main_favicon_path, format='ICO', 
                         sizes=[(img.size[0], img.size[1]) for img in favicon_multi],
                         append_images=favicon_multi[1:])
    print(f"  - favicon.ico (Multi-Size)")
    
    # Apple Touch Icon
    apple_icon = img_square.resize((180, 180), Image.LANCZOS)
    apple_path = os.path.join(OUTPUT_DIR, 'apple-touch-icon.png')
    apple_icon.save(apple_path, format='PNG', optimize=True)
    print(f"  - apple-touch-icon.png")
    
    print("\nFavicons erfolgreich erstellt!")
    print("\nFüge diese Zeilen zum <head> der index.html hinzu:")
    print('<link rel="icon" type="image/x-icon" href="favicon.ico">')
    print('<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">')
    print('<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">')
    print('<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">')
    print('<link rel="manifest" href="site.webmanifest">')

if __name__ == '__main__':
    generate_favicons()