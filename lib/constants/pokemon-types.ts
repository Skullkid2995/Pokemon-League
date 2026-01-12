// Pokemon types with their theme colors and properties
export const POKEMON_TYPES = {
  fire: { name: 'Fire', colors: 'from-red-500 to-orange-500', border: 'border-red-600', badge: '🔥' },
  water: { name: 'Water', colors: 'from-blue-400 to-cyan-500', border: 'border-blue-600', badge: '💧' },
  electric: { name: 'Electric', colors: 'from-yellow-400 to-yellow-600', border: 'border-yellow-600', badge: '⚡' },
  grass: { name: 'Grass', colors: 'from-green-400 to-green-600', border: 'border-green-600', badge: '🌿' },
  ice: { name: 'Ice', colors: 'from-cyan-300 to-blue-300', border: 'border-cyan-500', badge: '❄️' },
  fighting: { name: 'Fighting', colors: 'from-red-700 to-orange-700', border: 'border-red-800', badge: '👊' },
  poison: { name: 'Poison', colors: 'from-purple-500 to-purple-700', border: 'border-purple-800', badge: '☠️' },
  ground: { name: 'Ground', colors: 'from-amber-600 to-amber-800', border: 'border-amber-800', badge: '🌍' },
  flying: { name: 'Flying', colors: 'from-sky-400 to-indigo-400', border: 'border-sky-600', badge: '🪽' },
  psychic: { name: 'Psychic', colors: 'from-pink-500 to-purple-500', border: 'border-pink-700', badge: '🔮' },
  bug: { name: 'Bug', colors: 'from-green-500 to-lime-500', border: 'border-green-700', badge: '🐛' },
  rock: { name: 'Rock', colors: 'from-stone-500 to-stone-700', border: 'border-stone-800', badge: '🪨' },
  ghost: { name: 'Ghost', colors: 'from-purple-600 to-indigo-600', border: 'border-purple-900', badge: '👻' },
  dragon: { name: 'Dragon', colors: 'from-indigo-600 to-purple-600', border: 'border-indigo-800', badge: '🐉' },
  dark: { name: 'Dark', colors: 'from-gray-700 to-gray-900', border: 'border-gray-900', badge: '🌑' },
  steel: { name: 'Steel', colors: 'from-gray-400 to-gray-600', border: 'border-gray-700', badge: '⚙️' },
  fairy: { name: 'Fairy', colors: 'from-pink-300 to-rose-300', border: 'border-pink-500', badge: '✨' },
  normal: { name: 'Normal', colors: 'from-gray-300 to-gray-500', border: 'border-gray-600', badge: '⚪' },
} as const;

export type PokemonType = keyof typeof POKEMON_TYPES;

export const POKEMON_TYPE_OPTIONS = Object.keys(POKEMON_TYPES) as PokemonType[];

// Get type info with fallback for unknown types
export const getTypeInfo = (deckType: string) => {
  const normalizedType = deckType.toLowerCase() as PokemonType;
  return POKEMON_TYPES[normalizedType] || {
    name: deckType.charAt(0).toUpperCase() + deckType.slice(1),
    colors: 'from-gray-400 to-gray-600',
    border: 'border-gray-600',
    badge: '⚪'
  };
};

