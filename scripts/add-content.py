"""Agrega canciones de content/*.json al catálogo incluido y genera el SQL para Supabase.

Uso: python3 scripts/add-content.py content/alabanzas-002.json [salida.sql]
Cada entrada: id, number, title, key, lyrics, y opcionalmente category (por defecto 'alabanzas'),
author, composer, notes. Después de ejecutarlo, suba CATALOG_VERSION en src/data/catalog.ts.
"""
import json, sys

src = sys.argv[1]
out_sql = sys.argv[2] if len(sys.argv) > 2 else None
new = json.load(open(src, encoding='utf-8'))
p = 'src/data/catalog.json'
d = json.load(open(p, encoding='utf-8'))
by_id = {s['id']: i for i, s in enumerate(d['songs'])}
for s in new:
    entry = {k: s[k] for k in ('id', 'title', 'number', 'key', 'lyrics', 'author', 'composer', 'notes') if s.get(k)}
    entry['category'] = s.get('category', 'alabanzas')
    if s['id'] in by_id:
        d['songs'][by_id[s['id']]] = entry
    else:
        d['songs'].append(entry)
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('catálogo:', len(d['songs']), 'canciones')

if out_sql:
    q = lambda v: 'null' if v is None else "'" + str(v).replace("'", "''") + "'"
    rows = ',\n'.join(
        f"({q(s['id'])},{q(s['title'])},{q(s.get('number'))},{q(s.get('category', 'alabanzas'))},{q(s['lyrics'])},{q(s.get('key'))},{q(s.get('author'))},{q(s.get('composer'))},{q(s.get('notes'))},public.now_ms(),public.now_ms())"
        for s in new)
    open(out_sql, 'w', encoding='utf-8').write(
        'insert into public.songs (id,title,number,category,lyrics,key,author,composer,notes,created_at,updated_at) values\n' + rows +
        '\non conflict (id) do update set title=excluded.title, number=excluded.number, category=excluded.category, lyrics=excluded.lyrics, '
        'key=excluded.key, author=excluded.author, composer=excluded.composer, notes=excluded.notes, deleted=false, updated_at=excluded.updated_at;\n'
        "select number, title, key from public.songs where category='alabanzas' and not deleted order by number::int;")
