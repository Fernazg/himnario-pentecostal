"""Ícono de Himnario EA: silueta de un libro abierto en marfil sobre azul petróleo.

Uso: python3 design/logo.py design
Genera icon.svg (esquinas redondeadas), icon-square.svg (iOS),
icon-maskable.svg (margen de seguridad para Android) y symbol.svg
(solo el libro, para la pantalla de carga).
"""
import sys

W = 1024
BG = '#0f4c5c'      # azul petróleo
BG2 = '#0b3d4a'     # tono más profundo para un degradado sutil
IVORY = '#f7f1e3'   # marfil


def book(scale=1.0, dy=0):
    """Libro abierto: dos páginas en curva separadas por el lomo y una tapa debajo."""
    c = (W - W * scale) / 2
    g = [f'<g transform="translate({c:.1f} {c + dy * scale:.1f}) scale({scale})" fill="{IVORY}">']
    # Página izquierda: borde superior que sube hacia afuera, borde inferior en curva suave.
    g.append('<path d="M 494 436 C 430 360, 300 318, 176 328 C 166 329, 160 336, 160 346 L 150 664 '
             'C 150 674, 158 681, 168 680 C 300 668, 420 688, 494 756 Z"/>')
    # Página derecha (simétrica).
    g.append('<path d="M 530 436 C 594 360, 724 318, 848 328 C 858 329, 864 336, 864 346 L 874 664 '
             'C 874 674, 866 681, 856 680 C 724 668, 604 688, 530 756 Z"/>')
    # Tapa: banda fina bajo las páginas, que se une en el lomo.
    g.append('<path d="M 118 700 C 270 686, 420 708, 512 790 C 604 708, 754 686, 906 700 '
             'L 906 730 C 756 718, 612 742, 512 826 C 412 742, 268 718, 118 730 Z"/>')
    g.append('</g>')
    return '\n'.join(g)


def svg(rounded=True, scale=1.0):
    rx = 228 if rounded else 0
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BG}"/><stop offset="1" stop-color="{BG2}"/></linearGradient></defs>
<rect width="{W}" height="{W}" rx="{rx}" fill="url(#bg)"/>
{book(scale, dy=-60)}
</svg>'''


if __name__ == '__main__':
    out = sys.argv[1]
    open(f'{out}/icon.svg', 'w').write(svg(True, 0.84))
    open(f'{out}/icon-square.svg', 'w').write(svg(False, 0.84))
    open(f'{out}/icon-maskable.svg', 'w').write(svg(False, 0.68))
    # Solo el libro, recortado a su contorno, para la pantalla de carga.
    open(f'{out}/symbol.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="106 306 812 532">{book(1.0)}</svg>')
