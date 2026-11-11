/**
 * Categorías temáticas: clasifican cada canción según el mensaje de su letra
 * (no por palabras sueltas). Una canción puede tener varios temas; el primero
 * de `song.themes` es el principal.
 *
 * Para agregar una categoría nueva:
 *   1. Añada una entrada aquí (id estable en minúsculas, sin tildes).
 *   2. Asígnela a las canciones desde el editor (Categorías temáticas) o en
 *      content/temas.json para el himnario incluido.
 */
import {
  Anchor,
  BookMarked,
  Bird,
  CloudRain,
  Crown,
  Cross,
  DoorOpen,
  Footprints,
  Gift,
  Globe,
  HandHeart,
  Heart,
  HeartHandshake,
  LifeBuoy,
  MessageCircleHeart,
  Music,
  Shield,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Swords,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Tono de la tarjeta (variables CSS de la paleta). */
  tone: 'petroleo' | 'dorado' | 'salvia' | 'cobre';
}

export const THEMES: readonly Theme[] = [
  { id: 'alabanza', name: 'Alabanza y adoración', description: 'Para exaltar y adorar a Dios por quien Él es.', icon: Music, tone: 'dorado' },
  { id: 'fe-y-confianza', name: 'Fe y confianza en Dios', description: 'Descansar en Dios y creer en sus promesas.', icon: Anchor, tone: 'petroleo' },
  { id: 'salvacion', name: 'Salvación y redención', description: 'El rescate del pecador y la vida nueva en Cristo.', icon: LifeBuoy, tone: 'petroleo' },
  { id: 'cruz', name: 'Cruz y sacrificio de Jesús', description: 'El Calvario, la sangre de Cristo y su entrega por nosotros.', icon: Cross, tone: 'cobre' },
  { id: 'gracia', name: 'La gracia de Dios', description: 'Salvos por gracia, no por obras: el favor inmerecido de Dios.', icon: Gift, tone: 'dorado' },
  { id: 'amor-de-dios', name: 'Amor de Dios', description: 'El amor del Padre y de Cristo por cada persona.', icon: Heart, tone: 'cobre' },
  { id: 'espiritu-santo', name: 'Espíritu Santo', description: 'Su presencia, su fuego, su poder y el avivamiento.', icon: Bird, tone: 'salvia' },
  { id: 'oracion', name: 'Oración y comunión con Dios', description: 'Hablar con Dios, buscar su presencia y estar cerca de Él.', icon: MessageCircleHeart, tone: 'salvia' },
  { id: 'proteccion', name: 'Protección y cuidado de Dios', description: 'Dios como pastor, refugio, roca y amparo.', icon: Shield, tone: 'petroleo' },
  { id: 'pruebas', name: 'Pruebas y tribulaciones', description: 'Cantos para tiempos de dolor, aflicción y lucha.', icon: CloudRain, tone: 'petroleo' },
  { id: 'esperanza', name: 'Esperanza y fortaleza', description: 'Consuelo, paz y nuevas fuerzas en el Señor.', icon: Sunrise, tone: 'dorado' },
  { id: 'gratitud', name: 'Gratitud y agradecimiento', description: 'Dar gracias por las bendiciones y la bondad de Dios.', icon: HandHeart, tone: 'dorado' },
  { id: 'arrepentimiento', name: 'Arrepentimiento y perdón', description: 'Volver a Dios, confesar el pecado y recibir su perdón.', icon: HeartHandshake, tone: 'cobre' },
  { id: 'santidad', name: 'Santidad y consagración', description: 'Entregar la vida a Dios y vivir en pureza.', icon: Sparkles, tone: 'salvia' },
  { id: 'fidelidad', name: 'Fidelidad y obediencia', description: 'Seguir a Cristo y permanecer fieles hasta el fin.', icon: Footprints, tone: 'salvia' },
  { id: 'invitacion', name: 'Invitación a venir a Cristo', description: 'El llamado de Jesús al pecador: «Venid a mí».', icon: DoorOpen, tone: 'cobre' },
  { id: 'evangelizacion', name: 'Evangelización y misiones', description: 'Anunciar el evangelio, sembrar y ganar almas.', icon: Globe, tone: 'salvia' },
  { id: 'batalla-espiritual', name: 'Batalla espiritual', description: 'Soldados de Cristo en la lucha contra el mal.', icon: Swords, tone: 'cobre' },
  { id: 'segunda-venida', name: 'Segunda venida de Cristo', description: 'Cristo vuelve: velar, esperar y estar preparados.', icon: Crown, tone: 'dorado' },
  { id: 'cielo', name: 'Vida eterna y cielo', description: 'La patria celestial y la vida eterna con Dios.', icon: Sun, tone: 'dorado' },
  { id: 'iglesia', name: 'Iglesia y comunión de los hermanos', description: 'Unidad, saludos, despedidas y vida de la congregación.', icon: Users, tone: 'petroleo' },
  { id: 'palabra', name: 'Palabra de Dios', description: 'La Biblia como luz, guía y tesoro.', icon: BookMarked, tone: 'petroleo' },
  { id: 'navidad', name: 'Navidad y nacimiento de Jesús', description: 'El nacimiento del Salvador en Belén.', icon: Star, tone: 'dorado' },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export const themeById = (id: string) => BY_ID.get(id);

/** Filtra ids desconocidos (p. ej. de un respaldo antiguo) y duplicados. */
export const cleanThemes = (ids: unknown): string[] =>
  Array.isArray(ids) ? [...new Set(ids.filter((x): x is string => typeof x === 'string' && BY_ID.has(x)))] : [];

export const toneVar = (tone: Theme['tone']) =>
  ({ petroleo: 'var(--cat-himnos)', dorado: 'var(--cat-alabanzas)', salvia: 'var(--cat-coros)', cobre: 'var(--chord)' })[tone];
