import type { SongInput } from './types';

/**
 * Canciones de DEMOSTRACIÓN. Su texto fue redactado únicamente para mostrar
 * el formato de letra y acordes; no corresponden a himnos publicados ni se
 * atribuyen a ningún autor. Pueden editarse o eliminarse libremente.
 * Para cargar el himnario real, agregue contenido propio o debidamente
 * autorizado desde Ajustes → Administrar canciones o importando un respaldo.
 */
const DEMO_NOTE = 'Canción de demostración incluida para mostrar el formato de letra y acordes. Puede editarla o eliminarla.';

export const DEMO_SONGS: SongInput[] = [
  {
    title: 'Ejemplo de himno',
    number: '1',
    category: 'himnos',
    key: 'Sol',
    notes: DEMO_NOTE,
    lyrics: `# Estrofa 1
[Sol]Este es un texto de [Do]ejemplo
para [Sol]ver cómo se a[Re]linean
los a[Sol]cordes sobre [Sol7]cada [Do]palabra
y [Sol]cómo se trans[Re7]pone el [Sol]tono.

{soc}
[Do]Toque los botones [Sol]más y menos
[Mim]para subir o [La7]bajar el [Re]tono,
[Sol]todos los a[Sol/Si]cordes [Do]cambian
y [Sol]se conser[Re7]van sus ti[Sol]pos.
{eoc}

# Estrofa 2
[Sol]Puede editar o [Do]borrar este ejemplo
desde el [Sol]botón de edi[Re]ción,
y a[Sol]gregar sus [Sol7]propios [Do]himnos
con [Sol]letra y a[Re7]cordes de [Sol]Dios.

{c: Repetir el coro}`,
  },
  {
    title: 'Ejemplo de alabanza especial',
    category: 'alabanzas',
    key: 'Lam',
    notes: DEMO_NOTE,
    lyrics: `# Intro
[Lam] [Fa] [Do] [Mi7]

# Estrofa
[Lam]Esta alabanza de [Fa]muestra
está en [Do]tono me[Mi7]nor,
[Lam]use el selector de [Fa]tono
para [Rem]elegir el [Mi7]mejor.

# Coro
[Fa]Los acordes [Sol]con séptima
[Mim7]y las inver[Lam]siones
[Rem7]se trans[Sol/Si]ponen [Do]bien
[Fa]en todas las [Mi7sus4]can[Mi7]ciones.`,
  },
  {
    title: 'Ejemplo de coro pentecostal',
    number: '1',
    category: 'coros',
    key: 'Re',
    notes: DEMO_NOTE,
    lyrics: `[Re]Este coro de e[La]jemplo
[Sim]muestra un ritmo [Fa#m]alegre,
[Sol]cambie la nota[Re]ción
en [Mim7]ajustes cuando [La7]quiera.

[Re]Do, Re, Mi o [Re7]C, D, E,
[Sol]elija la que [Solm]prefiera,
[Re]y su lista de [Si7]culto
[Mim7]lista [La7]queda[Re]rá.

{c: x2}`,
  },
];
