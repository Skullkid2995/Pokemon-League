'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface PokemonCard {
  id: string;
  card_id: string;
  name: string;
  card_type: string;
  rarity: string | null;
  hp: number | null;
  image_url: string | null;
  image_url_small: string | null;
  set_name: string | null;
  card_number: string | null;
}

interface CardsCatalogProps {
  initialCards: PokemonCard[];
}

const POKEMON_TYPES = [
  'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock',
  'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal'
];

const RARITIES = ['common', 'uncommon', 'rare', 'rare-holo', 'ultra-rare'];

export default function CardsCatalog({ initialCards }: CardsCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 20;

  // Filter cards
  const filteredCards = initialCards.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.set_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || card.card_type === selectedType;
    const matchesRarity = selectedRarity === 'all' || card.rarity === selectedRarity;
    
    return matchesSearch && matchesType && matchesRarity;
  });

  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      water: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      electric: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      grass: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      ice: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
      fighting: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      poison: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      ground: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
      flying: 'border-sky-500 bg-sky-50 dark:bg-sky-900/20',
      psychic: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
      bug: 'border-lime-500 bg-lime-50 dark:bg-lime-900/20',
      rock: 'border-stone-500 bg-stone-50 dark:bg-stone-900/20',
      ghost: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
      dragon: 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
      dark: 'border-gray-700 bg-gray-50 dark:bg-gray-900/20',
      steel: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
      fairy: 'border-pink-300 bg-pink-50 dark:bg-pink-900/20',
      normal: 'border-gray-400 bg-gray-50 dark:bg-gray-900/20',
    };
    return colors[type] || 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cards by name or set..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                {POKEMON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rarity:</span>
              <select
                value={selectedRarity}
                onChange={(e) => {
                  setSelectedRarity(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border rounded-md bg-background"
              >
                <option value="all">All Rarities</option>
                {RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedCards.length} of {filteredCards.length} cards
      </div>

      {/* Cards Grid */}
      {paginatedCards.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No cards found matching your filters.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {paginatedCards.map((card) => (
              <Card
                key={card.id}
                className={`overflow-hidden border-2 hover:shadow-lg transition-all cursor-pointer ${getTypeColor(card.card_type)}`}
              >
                <CardContent className="p-0">
                  {card.image_url_small || card.image_url ? (
                    <div className="aspect-[63/88] relative bg-white rounded-t-lg overflow-hidden">
                      <img
                        src={card.image_url_small || card.image_url || ''}
                        alt={card.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[63/88] bg-muted flex items-center justify-center rounded-t-lg">
                      <span className="text-4xl opacity-20">?</span>
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <h3 className="font-semibold text-sm line-clamp-2">{card.name}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize px-2 py-1 rounded bg-background/50">
                        {card.card_type}
                      </span>
                      {card.hp && (
                        <span className="font-medium">HP: {card.hp}</span>
                      )}
                    </div>
                    {card.set_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {card.set_name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

