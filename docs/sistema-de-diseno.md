# Sistema de diseño «Edición» — Himnario EA

Estética de producto tecnológico premium con alma de libro bien editado.
El azul petróleo es la estructura; la jerarquía se construye con tipografía y
líneas finas, no con tarjetas, sombras ni degradados.

## Color (variables en `src/index.css`)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--accent` | `#0f4c5c` | `#72b8c4` | Azul petróleo: acciones, selección, enlaces |
| `--deep` | `#0b2f38` | `#06191e` | Petróleo profundo: portada de Inicio, barra lateral, controles de lectura, avisos |
| `--bg` | `#f4f3ef` | `#091315` | Papel (lienzo) |
| `--surface` | `#fbfaf8` | `#0f1c1f` | Hojas, menús, campos |
| `--text` | `#0c1d22` | `#e8eeec` | Tinta |
| `--muted` / `--faint` | `#5d6a6d` / `#8a9396` | `#93a3a6` / `#6b7c80` | Texto secundario / índices |
| `--border` | `#dedbd3` | `#213438` | Líneas finas de 1 px |
| `--chord` | `#b0502a` | `#f0a074` | Terracota (complementario del petróleo): solo acordes y tono |

Colecciones: Himnos (petróleo), Alabanzas (ocre `#96651c`), Coros (salvia `#4b7054`).
Contrastes AA (≥ 4,5:1) en texto.

## Tipografía

- **Geist** — interfaz (botones, filas, formularios).
- **Newsreader** (serif con tamaño óptico) — títulos (`.display`) y letras de las canciones.
- **Geist Mono** — números de himno (`001`), tonos, acordes, conteos y etiquetas (`.eyebrow`, `.num`).

## Forma y espacio

- Radios contenidos: 6 px (etiquetas), 8–10 px (botones, campos), 16 px solo en hojas inferiores.
- Listas a todo el ancho separadas por líneas finas; márgenes laterales 20 px (móvil) / 40 px (escritorio).
- Encabezados de página: etiqueta mono + título editorial grande.
- Filtros como pestañas subrayadas (`Tabs`), no píldoras.
- Íconos Lucide, trazo 1,5–1,75, sin cajas de color.

## Componentes base (`src/components/ui.tsx`)

`Button` · `IconButton` · `Sheet` · `ConfirmDialog` · `PageHeader` · `SectionLabel` · `Tabs` · `Segmented` · `Toggle` · `Field` · `EmptyState`; filas de canción en `src/components/songMeta.tsx`.
