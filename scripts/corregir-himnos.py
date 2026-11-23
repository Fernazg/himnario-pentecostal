"""Corrige errores de transcripción del himnario incluido (src/data/catalog.json).

Solo corrige errores mecánicos; nunca inventa letra:
  1. Restos de la página web («Descargar para Imprimir ⇓», «Himno 1 – …»).
  2. Marcas sueltas «Coro» / «.» que quedaron como texto: se reconstruye el coro
     con el texto que la propia canción usa como coro, y bloques {soc}/{eoc} mal cerrados.
  3. Líneas en MAYÚSCULAS o Con Cada Palabra En Mayúscula.
  4. Nombres propios y nombres de Dios en minúscula (Dios, Señor, Cristo, Satán, Belén…).
  5. Espacios antes de signos de puntuación y espacios dobles.
  6. Títulos sin tildes o sin signos de apertura (¿ ¡).
  7. Casos puntuales documentados abajo (himnos 4, 51 y 70).

Uso: python3 scripts/corregir-himnos.py  → escribe catalog.json y content/correcciones.json
"""
import json
import re

CAT = 'src/data/catalog.json'
data = json.load(open(CAT, encoding='utf-8'))

GARBAGE = re.compile(r'descargar\s+para\s+imprimir|⇓|^\s*himno\s*\d+\s*[–-]', re.I)
MARKER = re.compile(r'^\s*(coro:?|estribillo:?|\.)\s*$', re.I)

# Nombres propios y nombres de Dios (palabra completa, en minúscula).
PROPER = {
    'dios': 'Dios', 'señor': 'Señor', 'cristo': 'Cristo', 'jesús': 'Jesús', 'jesus': 'Jesús', 'jesucristo': 'Jesucristo',
    'jehová': 'Jehová', 'emmanuel': 'Emmanuel', 'satán': 'Satán', 'satanás': 'Satanás', 'edén': 'Edén', 'belén': 'Belén',
    'betlehem': 'Betlehem', 'biblia': 'Biblia', 'israel': 'Israel', 'betel': 'Betel', 'sion': 'Sion', 'sión': 'Sion',
    'canaán': 'Canaán', 'galilea': 'Galilea', 'trinidad': 'Trinidad', 'calvario': 'Calvario', 'jerusalén': 'Jerusalén',
    'getsemaní': 'Getsemaní', 'gólgota': 'Gólgota', 'nazaret': 'Nazaret', 'jordán': 'Jordán', 'judá': 'Judá',
}
PHRASES = [
    (re.compile(r'\bespíritu santo\b', re.I), 'Espíritu Santo'),
    (re.compile(r'\bsanto espíritu\b', re.I), 'Santo Espíritu'),
    (re.compile(r'\bespíritu (de dios|divino)\b', re.I), lambda m: 'Espíritu ' + ('de Dios' if m.group(1).lower() == 'de dios' else 'divino')),
]

TITLES = {
    'Oìdlo, Pobre Pecador': 'Oídlo, Pobre Pecador',
    'Cantemos Aqui': 'Cantemos Aquí',
    'No os Detengais': 'No os Detengáis',
    'Confio Yo en Cristo': 'Confío Yo en Cristo',
    'Hay una Fuente Carmesi': 'Hay una Fuente Carmesí',
    'Yo Confio en Jesús': 'Yo Confío en Jesús',
    'Concededme, Jesús, Poder': 'Concédeme, Jesús, Poder',
    'Jerusalem': 'Jerusalén',
    'El Salvador esta Aqui': 'El Salvador Está Aquí',
    'ved del cielo descendiendo': 'Ved del Cielo Descendiendo',
    'Heme Aqui': 'Heme Aquí',
    'Siempre Aqui Reposare': 'Siempre Aquí Reposaré',
    'Que Me Importa Del Mundo Las Penas': '¿Qué Me Importa del Mundo las Penas?',
    'Mire con Ansia': 'Miré con Ansia',
    'Más De Jesús Que Apender': 'Más de Jesús Quiero Aprender',
    'Avivanos, Señor': 'Avívanos, Señor',
    'Jerusalem De Arriba': 'Jerusalén de Arriba',
    'Unanimes Junto a la Cruz': 'Unánimes Junto a Jesús',
    '¡Oh! Ven a La Cruz': '¡Oh! Ven a la Cruz',
    'Que Ha Quitado Mi Maldad': '¿Qué Ha Quitado Mi Maldad?',
    'Soñe Que El Gran Día': 'Soñé que el Gran Día',
    'Cuando Anuncie El Arcangel': 'Cuando Anuncie el Arcángel',
    'Un Principe Vino': 'Un Príncipe Vino',
    'Que Mi Vida Entera Este': 'Que Mi Vida Entera Esté',
    'Cuan Glorioso Es El Cambio': 'Cuán Glorioso Es el Cambio',
    'Hasta Cuando Señor': '¿Hasta Cuándo, Señor?',
    'Cuan Hermosos Son Los Pies': 'Cuán Hermosos Son los Pies',
    'Como Podré Estar Triste': '¿Cómo Podré Estar Triste?',
    'El Señor Jesús Esta Llamando': 'El Señor Jesús Está Llamando',
    'Que Dios Tan Bondadoso': '¡Qué Dios Tan Bondadoso!',
    'Mas Cual Mi Cristo': 'Más Cual Mi Cristo',
    'Callad, ¿No oís?': 'Callad, ¿No Oís?',
    'Señor De Los Cielos': 'Señor de los Cielos',
    'Dejame Beber de Tú Río Señor': 'Déjame Beber de Tu Río, Señor',
    'Dónde Está Tú Dios?': '¿Dónde Está Tu Dios?',
    'En Está Reunión Cristo Está': 'En Esta Reunión Cristo Está',
    'Esté Avivamiento, ¿Quién Lo Apagará?': 'Este Avivamiento, ¿Quién lo Apagará?',
    'Libertad, Libertad, Oh Que Buena.': 'Libertad, Libertad, ¡Oh, Qué Buena!',
    'Mirad Cuan Bueno Es': 'Mirad Cuán Bueno Es',
    'No Sabeís, No Sabeís, Que Somos Templo': '¿No Sabéis que Somos Templo?',
    'Oh Jerusalen Que Bonita eres': 'Oh Jerusalén, Qué Bonita Eres',
    'Que Bonito Es': 'Qué Bonito Es',
    'Que Glorioso Es Andar Con Él': 'Qué Glorioso Es Andar con Él',
    'Que tú sí, sea sí': 'Que Tu Sí Sea Sí',
    'Yo Me Alegre Con Los Que Me Decían': 'Yo Me Alegré con los que Me Decían',
    'Yo Sé Que Estás Aqui': 'Yo Sé que Estás Aquí',
    '¡Señor!, unenos': '¡Señor!, Únenos',
    'Cuando Yo Contemple La Cruz': 'Cuando Yo Contemplé la Cruz',
    'El Señor Resucito': 'El Señor Resucitó',
    'Muy Cercano Esta El Día': 'Muy Cercano Está el Día',
    'Quien Esta de Parte': '¿Quién Está de Parte?',
    'Oíd Como Resuena': 'Oíd Cómo Resuena',
    'Estoy Listo Si El Me Llama': 'Estoy Listo Si Él Me Llama',
    'Jesús está Aquí Pide Lo Que Quieras': 'Jesús Está Aquí, Pide lo que Quieras',
    'De Jesús Escucha El Tierno': 'De Jesús Escucha el Tierno Llamamiento',
    'Mi redentor, El Rey de Gloria': 'Mi Redentor, el Rey de Gloria',
    'Quiero cantar a Mi Rey': 'Quiero Cantar a Mi Rey',
}


def norm(s):
    return re.sub(r'[^a-zñ]', '', s.lower().translate(str.maketrans('áéíóúü', 'aeiouu')))


def proper(line):
    out = re.sub(r'\b(\w+)\b', lambda m: PROPER.get(m.group(1), m.group(1)), line)
    for rx, rep in PHRASES:
        out = rx.sub(rep, out)
    return out


def recase(line, song_has_title_case=False):
    """MAYÚSCULAS o Cada Palabra En Mayúscula → minúscula salvo la primera letra y nombres propios."""
    letters = re.sub(r'[^A-Za-zÁÉÍÓÚÑáéíóúñ]', '', line)
    words = [w for w in re.findall(r'[A-Za-zÁÉÍÓÚÑáéíóúñ]+', line) if len(w) > 2]
    shouting = len(letters) > 8 and letters.upper() == letters
    title_case = (len(words) >= 4 and sum(w[0].isupper() for w in words) / len(words) > 0.8) or (
        song_has_title_case and len(words) >= 2 and all(w[0].isupper() for w in words))
    if not (shouting or title_case):
        return line
    low = line.lower()
    m = re.search(r'[a-záéíóúñ]', low)
    if m:
        low = low[: m.start()] + low[m.start()].upper() + low[m.start() + 1:]
    if shouting:
        low = re.sub(r'\b(él)\b', 'Él', low)
        low = re.sub(r'^El es\b', 'Él es', low)
    return low


def tidy(line):
    line = re.sub(r'\s+([,.;:!?])', r'\1', line)
    line = re.sub(r'(\S)  +', r'\1 ', line)
    return line.rstrip()


def rebuild_choruses(lyrics):
    """Reconstruye coros a partir de marcas «Coro» y bloques {soc} mal cerrados."""
    lines = lyrics.split('\n')
    has_marker = any(MARKER.match(l) for l in lines)
    socs = [i for i, l in enumerate(lines) if l.strip() == '{soc}']
    # Texto del coro: el primer bloque {soc}…{eoc} limpio, o lo que sigue a las marcas «Coro».
    chorus = []
    if socs:
        for l in lines[socs[0] + 1:]:
            if l.strip() in ('{eoc}', '{soc}') or not l.strip():
                break
            if not MARKER.match(l):
                chorus.append(l.strip())
    if not chorus and has_marker:
        idx = [i for i, l in enumerate(lines) if re.match(r'^\s*(coro|estribillo):?\s*$', l, re.I)]

        def follow(i):
            out = []
            for l in lines[i + 1:]:
                if not l.strip() or l.startswith('{') or MARKER.match(l):
                    break
                out.append(l.strip())
            return out

        fs = [f for f in (follow(i) for i in idx) if f]
        if len(fs) > 1:
            k = 0
            while all(len(f) > k for f in fs) and len({f[k] for f in fs}) == 1:
                k += 1
            chorus = fs[0][:k]
        elif fs:
            chorus = fs[0]
    broken = len(socs) != sum(1 for l in lines if l.strip() == '{eoc}') or any(
        l.strip() == '.' for l in lines)
    if not chorus or not (has_marker or broken):
        return lyrics, False

    # El coro solo se reconoce donde el original lo indicaba: tras una marca «Coro» o un {soc}.
    blocks, cur = [], []
    expect = False
    i = 0
    nchorus = [norm(x) for x in chorus]

    def close():
        nonlocal cur
        if cur:
            blocks.append(('v', cur))
            cur = []

    while i < len(lines):
        l = lines[i]
        t = l.strip()
        if t in ('{soc}', '{eoc}') or MARKER.match(l):
            is_coro = t == '{soc}' or re.match(r'^\s*(coro|estribillo):?\s*$', l, re.I)
            if is_coro:
                close()
                if [norm(x) for x in lines[i + 1: i + 1 + len(chorus)]] == nchorus:
                    blocks.append(('c', chorus))
                    i += 1 + len(chorus)
                    continue
                if t != '{soc}':
                    # «Coro» suelto sin el texto: significa «repetir el coro».
                    blocks.append(('c', chorus))
            elif t == '{eoc}':
                close()
            i += 1
            continue
        if not t:
            close()
        else:
            cur.append(t)
        i += 1
    close()
    out = []
    for kind, ls in blocks:
        out.append('{soc}\n' + '\n'.join(ls) + '\n{eoc}' if kind == 'c' else '\n'.join(ls))
    new = '\n\n'.join(out)
    same = re.sub(r'\s+', '', new) == re.sub(r'\s+', '', lyrics)
    return (lyrics, False) if same else (new, True)


log = []
for s in data['songs']:
    if not s['id'].startswith('sa-'):
        continue
    before_title, before = s['title'], s['lyrics']
    notes = []
    lines = [l for l in s['lyrics'].split('\n') if not GARBAGE.search(l)]
    if len(lines) != len(s['lyrics'].split('\n')):
        notes.append('restos de la página web eliminados')
    lyr = '\n'.join(lines).strip()

    if s['id'] == 'sa-himno-4-yo-por-cristo':
        # El estribillo «Alabanzas / doy a ti, mi salvador» venía abreviado como «Alabanzas».
        stanzas = [b for b in re.split(r'\n\s*\n', lyr) if b.strip()]
        body = []
        for b in stanzas:
            ls = [x for x in b.split('\n') if x.strip() and x.strip().lower() not in ('alabanzas', 'doy a ti, mi salvador')]
            body.append('\n'.join(ls))
        lyr = '\n\n'.join(f'{b}\n\n{{soc}}\nAlabanzas\ndoy a ti, mi Salvador.\n{{eoc}}' for b in body)
        notes.append('estribillo «Alabanzas doy a ti, mi salvador» completado en cada estrofa (venía abreviado)')
    else:
        lyr, changed = rebuild_choruses(lyr)
        if changed:
            notes.append('coro reconstruido (marcas «Coro» sueltas o bloques mal cerrados)')

    tc = sum(1 for l in lyr.split('\n') if recase(l) != l) >= 2
    new_lines = []
    for l in lyr.split('\n'):
        if l.startswith('{'):
            new_lines.append(l)
            continue
        r = recase(l, tc)
        if r != l and 'mayúsculas corregidas' not in notes:
            notes.append('mayúsculas corregidas')
        new_lines.append(tidy(proper(r)))
    lyr = re.sub(r'\n{3,}', '\n\n', '\n'.join(new_lines)).strip()
    if proper(before) != before and 'nombres propios con mayúscula' not in notes:
        notes.append('nombres propios con mayúscula')

    if s['id'] == 'sa-himno-51-en-el-curso-de-este-dia':
        lyr = ''
        s['notes'] = (s.get('notes', '') + '\nLetra pendiente: la fuente publicaba por error la letra del himno 50 («Un Buen Amigo»).').strip()
        notes.append('se quitó la letra del himno 50 que la fuente publicaba por error; queda pendiente la letra correcta')
    if s['id'] == 'sa-himno-70-cuando-leo-en-la-biblia':
        blocks = re.split(r'\n\s*\n', lyr)
        if blocks and blocks[0].startswith('Santa Biblia'):
            lyr = '\n\n'.join(blocks[1:])
            s['notes'] = (s.get('notes', '') + '\nFalta la primera estrofa: la fuente repetía por error una estrofa del himno 69 («Santa Biblia»).').strip()
            notes.append('se quitó una estrofa del himno 69 copiada por error; falta la primera estrofa original')

    s['lyrics'] = lyr
    s['title'] = TITLES.get(s['title'], s['title'])
    if s['title'] != before_title:
        notes.append(f'título: «{before_title}» → «{s["title"]}»')
    if s['lyrics'] != before or s['title'] != before_title:
        log.append({'id': s['id'], 'numero': s.get('number'), 'titulo': s['title'], 'cambios': notes or ['ajustes menores de espacios']})

json.dump(data, open(CAT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(log, open('content/correcciones.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(log), 'canciones corregidas')
