# Himnario Pentecostal

Himnario digital (PWA) con **himnos**, **alabanzas especiales** y **coros pentecostales**: acordes alineados, transposición, buscador instantáneo, favoritos, listas para cultos y funcionamiento sin conexión.

## Uso

```bash
npm install
npm run dev        # desarrollo
npm test           # pruebas unitarias (acordes, transposición, búsqueda)
npm run build      # compilación de producción + Service Worker
npm run preview    # servir la compilación (probar PWA/offline)
```

## Funciones

- **Tres categorías** fijas: Himnos, Alabanzas especiales, Coros pentecostales.
- **Modo canción**: acordes alineados sobre la sílaba, subir/bajar semitono, selector de tonalidad, notación española (Do, Rem, Sol7, Si°) o internacional (C, Dm, G7), mostrar/ocultar acordes, tamaño de letra, pantalla completa, favoritos, compartir y pantalla siempre encendida. El tono elegido se recuerda por canción.
- **Transposición** que conserva el tipo de acorde, extensiones (`maj7`, `sus4`, `7(b9)`, `6/9`) e inversiones (`Do/Mi`), eligiendo sostenidos o bemoles según la tonalidad destino.
- **Buscador** por título, número, fragmento de letra (sin acordes ni tildes) y autor, con filtro por categoría.
- **Listas** personales y de culto (con fecha): ordenar, quitar, compartir y recorrer en modo culto (anterior/siguiente).
- **Administración**: agregar, editar y eliminar canciones; conversión automática de «acordes sobre la letra» al formato en línea; vista previa; respaldo e importación JSON.
- **PWA sin conexión**: instalación, precache de la app y fuentes, datos en IndexedDB, preferencias en localStorage.

## Formato de letra

```
# Estrofa 1
[Sol]Texto con el acorde [Do]antes de la sílaba
{soc}
[Re]Líneas del coro
{eoc}
{c: Repetir}
```

## Contenido

Se incluyen solo tres canciones **de demostración** (texto redactado para mostrar el formato, sin autor). Agregue únicamente contenido propio, de dominio público o con autorización, e indique autor/compositor solo cuando estén verificados. Para cargas masivas, importe un JSON desde *Ajustes → Importar* con la forma:

```json
{ "app": "himnario-pentecostal", "version": 1, "songs": [
  { "title": "…", "number": "1", "category": "himnos", "key": "Sol", "lyrics": "[Sol]…", "author": "…" }
] }
```

También se acepta un arreglo de canciones. Las canciones con el mismo `id` se fusionan conservando la versión más reciente.

## Arquitectura

```
src/
  lib/chords.ts        motor de acordes (análisis, transposición, notación)
  lib/songText.ts      formato de letra, conversión y exportación a texto
  lib/search.ts        índice y ranking de búsqueda
  data/types.ts        modelo (Song, SongList, …)
  data/repository.ts   contrato de almacenamiento
  data/idbRepository.ts implementación IndexedDB
  data/sync/supabase.ts sincronización opcional (ver docs/supabase.sql)
  state/               contextos: biblioteca, ajustes, avisos
  pages/, components/  interfaz
```

Para integrar Supabase: cree el esquema `docs/supabase.sql`, defina `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, y use `syncSongs(repo, supabaseFromEnv())`.

Los íconos PWA se regeneran desde `public/favicon.svg` con `node scripts/icons.cjs` (requiere Playwright).
