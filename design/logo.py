"""Genera el ícono del himnario (rama de almendro en flor sobre un libro abierto)."""
import math, random, sys

random.seed(7)
W = 1024

def blossom(cx, cy, r, rot=0, open_=1.0):
    """Flor de almendro: 5 pétalos redondeados, centro rosado y estambres dorados."""
    out = [f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})">']
    for i in range(5):
        a = i * 72
        out.append(
            f'<path transform="rotate({a})" d="M0 0 C {-r*0.55:.1f} {-r*0.25:.1f}, {-r*0.62:.1f} {-r*0.95:.1f}, 0 {-r:.1f} '
            f'C {r*0.62:.1f} {-r*0.95:.1f}, {r*0.55:.1f} {-r*0.25:.1f}, 0 0Z" fill="url(#petal)" stroke="#e7b9c3" stroke-width="{r*0.035:.2f}"/>'
        )
    out.append(f'<circle r="{r*0.30:.1f}" fill="url(#heart)"/>')
    for i in range(9):
        a = math.radians(i * 40 + 10)
        x, y = math.cos(a) * r * 0.36, math.sin(a) * r * 0.36
        out.append(f'<line x1="0" y1="0" x2="{x:.1f}" y2="{y:.1f}" stroke="#c98a5a" stroke-width="{r*0.03:.2f}"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*0.055:.1f}" fill="#e2b25a"/>')
    out.append('</g>')
    return ''.join(out)

def bud(cx, cy, r, rot):
    return (f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})">'
            f'<path d="M0 {r*0.2:.1f} C {-r*0.6:.1f} {-r*0.2:.1f}, {-r*0.3:.1f} {-r:.1f}, 0 {-r*1.1:.1f} C {r*0.3:.1f} {-r:.1f}, {r*0.6:.1f} {-r*0.2:.1f}, 0 {r*0.2:.1f}Z" fill="url(#petal)" stroke="#e7b9c3" stroke-width="2"/>'
            f'<path d="M0 {r*0.35:.1f} C {-r*0.45:.1f} {r*0.1:.1f}, {-r*0.4:.1f} {-r*0.3:.1f}, 0 {-r*0.2:.1f} C {r*0.4:.1f} {-r*0.3:.1f}, {r*0.45:.1f} {r*0.1:.1f}, 0 {r*0.35:.1f}Z" fill="#8a5a3c"/>'
            '</g>')

def leaf(cx, cy, l, rot):
    return (f'<path transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})" '
            f'd="M0 0 C {l*0.3:.1f} {-l*0.28:.1f}, {l*0.75:.1f} {-l*0.22:.1f}, {l:.1f} 0 C {l*0.75:.1f} {l*0.22:.1f}, {l*0.3:.1f} {l*0.28:.1f}, 0 0Z" fill="url(#leaf)"/>'
            f'<path transform="translate({cx:.1f} {cy:.1f}) rotate({rot:.1f})" d="M{l*0.05:.1f} 0 L{l*0.9:.1f} 0" stroke="#3f6f52" stroke-width="2" opacity=".6"/>')

def icon(rounded=True, scale=1.0):
    """scale < 1 deja margen de seguridad para íconos 'maskable'."""
    s = []
    s.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}">')
    s.append('''<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#14305a"/><stop offset=".55" stop-color="#15486d"/><stop offset="1" stop-color="#16707a"/>
  </linearGradient>
  <radialGradient id="glow" cx=".5" cy=".62" r=".45">
    <stop offset="0" stop-color="#f6e7c1" stop-opacity=".35"/><stop offset="1" stop-color="#f6e7c1" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="page" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#f1e6cc"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f3d58a"/><stop offset=".5" stop-color="#c9973f"/><stop offset="1" stop-color="#e9c46f"/>
  </linearGradient>
  <linearGradient id="branch" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#7a5232"/><stop offset="1" stop-color="#b98a52"/>
  </linearGradient>
  <radialGradient id="petal" cx=".5" cy=".8" r=".9">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fde9ee"/><stop offset="1" stop-color="#f4c3cf"/>
  </radialGradient>
  <radialGradient id="heart"><stop offset="0" stop-color="#b8475c"/><stop offset="1" stop-color="#e796a8"/></radialGradient>
  <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f9a72"/><stop offset="1" stop-color="#9cc7a2"/></linearGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#06142b" flood-opacity=".45"/></filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#06142b" flood-opacity=".35"/></filter>
</defs>''')
    rx = 228 if rounded else 0
    s.append(f'<rect width="{W}" height="{W}" rx="{rx}" fill="url(#bg)"/>')
    s.append(f'<rect width="{W}" height="{W}" rx="{rx}" fill="url(#glow)"/>')
    # Brillo sutil superior
    c = (W - W * scale) / 2
    s.append(f'<g transform="translate({c:.1f} {c:.1f}) scale({scale})">')

    # ---- Libro abierto ----
    s.append('<g filter="url(#shadow)">')
    # tapa
    s.append('<path d="M168 610 C 300 572, 430 580, 512 626 C 594 580, 724 572, 856 610 L 868 846 C 742 808, 600 812, 512 858 C 424 812, 282 808, 156 846 Z" fill="#0d2443"/>')
    s.append('<path d="M168 610 C 300 572, 430 580, 512 626 C 594 580, 724 572, 856 610 L 868 846 C 742 808, 600 812, 512 858 C 424 812, 282 808, 156 846 Z" fill="none" stroke="url(#gold)" stroke-width="7"/>')
    # cantos de hojas
    for i, off in enumerate([26, 18, 10]):
        s.append(f'<path d="M190 {600-off+30} C 310 {566-off+30}, 430 {572-off+30}, 512 {612-off+30} C 594 {572-off+30}, 714 {566-off+30}, 834 {600-off+30} L 842 {818-off+14} C 724 {786-off+14}, 596 {790-off+14}, 512 {832-off+14} C 428 {790-off+14}, 300 {786-off+14}, 182 {818-off+14} Z" fill="#efe2c2" stroke="#d6bf8a" stroke-width="2"/>')
    # páginas
    s.append('<path d="M196 572 C 318 536, 436 544, 512 590 L 512 812 C 436 768, 318 762, 188 792 Z" fill="url(#page)"/>')
    s.append('<path d="M828 572 C 706 536, 588 544, 512 590 L 512 812 C 588 768, 706 762, 836 792 Z" fill="url(#page)"/>')
    s.append('</g>')
    # sombra del lomo
    s.append('<path d="M512 590 L512 812" stroke="#c9b17a" stroke-width="4"/>')
    s.append('<path d="M470 572 C 490 582, 502 586, 512 592 L 512 812 C 500 805, 488 797, 470 790Z" fill="#c9a86a" opacity=".18"/>')
    s.append('<path d="M554 572 C 534 582, 522 586, 512 592 L 512 812 C 524 805, 536 797, 554 790Z" fill="#c9a86a" opacity=".18"/>')
    # pentagramas
    for side in (-1, 1):
        for k in range(5):
            y0 = 640 + k * 15
            if side < 0:
                d = f'M232 {y0+ -8} C 330 {y0-34}, 420 {y0-28}, 488 {y0+2}'
            else:
                d = f'M536 {y0+2} C 604 {y0-28}, 694 {y0-34}, 792 {y0-8}'
            s.append(f'<path d="{d}" fill="none" stroke="#c9973f" stroke-width="2.4" opacity=".55"/>')
        for k in range(5):
            y0 = 728 + k * 13
            if side < 0:
                d = f'M232 {y0} C 330 {y0-26}, 420 {y0-20}, 488 {y0+8}'
            else:
                d = f'M536 {y0+8} C 604 {y0-20}, 694 {y0-26}, 792 {y0}'
            s.append(f'<path d="{d}" fill="none" stroke="#c9973f" stroke-width="2" opacity=".35"/>')
    # notas
    for (x, y, stem) in [(318, 636, 1), (404, 630, 1), (628, 630, 1), (712, 634, 1)]:
        s.append(f'<ellipse cx="{x}" cy="{y}" rx="11" ry="8" transform="rotate(-20 {x} {y})" fill="#b98535"/>')
        s.append(f'<line x1="{x+10}" y1="{y-2}" x2="{x+10}" y2="{y-48}" stroke="#b98535" stroke-width="3.5"/>')

    # ---- Rama de almendro ----
    s.append('<g filter="url(#soft)">')
    s.append('<path d="M150 690 C 170 520, 290 330, 520 262 C 690 214, 820 300, 878 470" fill="none" stroke="url(#branch)" stroke-width="20" stroke-linecap="round"/>')
    s.append('<path d="M150 690 C 170 520, 290 330, 520 262 C 690 214, 820 300, 878 470" fill="none" stroke="#d9ad6e" stroke-width="5" stroke-linecap="round" opacity=".55" transform="translate(-3 -4)"/>')
    for d, w in [('M300 392 C 280 340, 290 300, 318 270', 10), ('M640 236 C 680 196, 724 190, 760 200', 9), ('M790 330 C 830 320, 862 330, 884 352', 8), ('M210 520 C 176 492, 166 462, 172 430', 8)]:
        s.append(f'<path d="{d}" fill="none" stroke="url(#branch)" stroke-width="{w}" stroke-linecap="round"/>')
    for (x, y, l, r) in [(250, 470, 70, 200), (196, 590, 64, 160), (330, 330, 70, -60), (440, 286, 66, -100), (590, 230, 68, -30), (700, 250, 62, 40), (820, 380, 64, 70), (760, 196, 56, -10), (176, 440, 56, -120), (860, 420, 54, 20)]:
        s.append(leaf(x, y, l * 1.3, r))
    s.append('</g>')
    for (x, y, r, rot) in [(318, 266, 30, -20), (762, 196, 26, 30), (884, 352, 26, 60), (172, 428, 24, -40), (462, 236, 26, -30), (606, 210, 24, 20)]:
        s.append(bud(x, y, r, rot))
    for (x, y, r, rot) in [(244, 410, 68, 8), (396, 300, 62, 30), (530, 258, 78, 0), (672, 244, 64, 18), (794, 306, 66, -12), (166, 556, 56, 20), (862, 476, 52, 40)]:
        s.append(f'<g filter="url(#soft)">{blossom(x, y, r, rot)}</g>')
    # pétalos sueltos
    s.append('</g></svg>')
    return '\n'.join(s)

if __name__ == '__main__':
    out = sys.argv[1]
    open(f'{out}/icon.svg', 'w').write(icon(True, 1.0))
    open(f'{out}/icon-square.svg', 'w').write(icon(False, 1.0))
    open(f'{out}/icon-maskable.svg', 'w').write(icon(False, 0.8))
