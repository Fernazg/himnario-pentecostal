"""Ícono de Himnario EA: almendro minimalista en marfil sobre azul petróleo.

Uso: python3 design/logo.py design
Genera icon.svg (esquinas redondeadas), icon-square.svg (iOS) e
icon-maskable.svg (con margen de seguridad para Android).
"""
import math, sys

W = 1024
BG = '#0f4c5c'      # azul petróleo
BG2 = '#0b3d4a'     # tono más profundo para un degradado sutil
IVORY = '#f7f1e3'   # marfil

def blossom(cx, cy, r, rot=0):
    """Flor de 5 pétalos con el centro calado (deja ver el fondo)."""
    parts = [f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})">']
    for i in range(5):
        a = math.radians(i * 72 - 90)
        x, y = math.cos(a) * r * 0.52, math.sin(a) * r * 0.52
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*0.5:.1f}" fill="{IVORY}"/>')
    parts.append(f'<circle r="{r*0.2:.1f}" fill="{BG}"/>')
    parts.append('</g>')
    return ''.join(parts)

def tree(scale=1.0):
    c = (W - W * scale) / 2
    s = [f'<g transform="translate({c:.1f} {c:.1f}) scale({scale})">']
    # Tronco que se afina hacia arriba, con base ligeramente abierta.
    s.append(f'<path fill="{IVORY}" d="M 456 866 C 482 836, 490 756, 490 690 C 490 650, 492 620, 494 596 L 530 596 C 532 620, 534 650, 534 690 C 534 756, 542 836, 568 866 Z"/>')
    # Ramas: dos brazos principales que se abren en curva y se subdividen, más un eje central.
    branches = [
        ('M 512 600 C 486 540, 440 496, 384 462 C 344 438, 314 410, 298 368', 30),
        ('M 512 600 C 538 540, 584 496, 640 462 C 680 438, 710 410, 726 368', 30),
        ('M 512 610 C 514 520, 516 400, 512 278', 22),
        ('M 392 466 C 390 400, 400 330, 420 286', 16),
        ('M 632 466 C 634 400, 624 330, 604 286', 16),
        ('M 330 420 C 290 412, 254 396, 228 372', 13),
        ('M 694 420 C 734 412, 770 396, 796 372', 13),
        ('M 514 420 C 486 396, 468 372, 460 346', 10),
        ('M 512 400 C 540 378, 556 356, 562 330', 10),
    ]
    for d, w in branches:
        s.append(f'<path d="{d}" fill="none" stroke="{IVORY}" stroke-width="{w}" stroke-linecap="round"/>')
    # Copa en flor con silueta de cúpula.
    flowers = [
        (512, 228, 54, 0),
        (420, 250, 44, -14), (604, 250, 44, 14),
        (352, 278, 30, 8), (672, 278, 30, -8),
        (298, 330, 48, -6), (726, 330, 48, 6),
        (220, 360, 38, -20), (804, 360, 38, 20),
        (456, 334, 26, 12), (566, 322, 26, -12),
        (356, 400, 24, 18), (668, 400, 24, -18),
    ]
    for x, y, r, rot in flowers:
        s.append(blossom(x, y, r, rot))
    for x, y, r in [(462, 160, 12), (562, 160, 12), (380, 196, 11), (644, 196, 11), (248, 284, 11), (776, 284, 11), (180, 430, 10), (844, 430, 10)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{IVORY}"/>')
    s.append('</g>')
    return '\n'.join(s)

def svg(rounded=True, scale=1.0):
    rx = 228 if rounded else 0
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BG}"/><stop offset="1" stop-color="{BG2}"/></linearGradient></defs>
<rect width="{W}" height="{W}" rx="{rx}" fill="url(#bg)"/>
{tree(scale)}
</svg>'''

if __name__ == '__main__':
    out = sys.argv[1]
    open(f'{out}/icon.svg', 'w').write(svg(True, 0.86))
    open(f'{out}/icon-square.svg', 'w').write(svg(False, 0.86))
    open(f'{out}/icon-maskable.svg', 'w').write(svg(False, 0.70))
    # Solo el árbol, sin recuadro, para la pantalla de carga (fondo azul petróleo).
    tree_only = tree(1.0)  # centros en azul petróleo, igual al fondo de la pantalla de carga
    open(f'{out}/tree.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="160 130 704 750">{tree_only}</svg>')
