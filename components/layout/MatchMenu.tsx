'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useGame } from './GameSelectorDropdown';

export default function MatchMenu() {
  const router = useRouter();
  const { selectedGame } = useGame();

  const games = [
    { 
      id: 'pokemon' as const, 
      name: 'Pokemon', 
      logo: '/images/pokelogo.jpg',
      fallback: '⚡' 
    },
    { 
      id: 'smash' as const, 
      name: 'Smash Ultimate', 
      logo: '/images/smash-logo.png',
      fallback: '💥' 
    },
  ];

  const currentGame = games.find(g => g.id === selectedGame);

  const handleCreateMatch = () => {
    // Redirigir a crear juego - el juego ya está seleccionado en el contexto
    router.push('/games/new');
  };

  const GameIcon = ({ game, className }: { game: typeof games[0], className?: string }) => {
    const [imgError, setImgError] = useState(false);
    return (
      <div className={`flex items-center justify-center ${className || ''}`}>
        {!imgError ? (
          <img
            src={game.logo}
            alt={game.name}
            width={20}
            height={20}
            className="object-contain rounded"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-lg">{game.fallback}</span>
        )}
      </div>
    );
  };

  return (
    <Button
      onClick={handleCreateMatch}
      className="gap-2 border-2 border-white"
      variant="default"
    >
      <Plus className="h-4 w-4" />
      Match
      {currentGame && (
        <GameIcon game={currentGame} className="ml-1" />
      )}
    </Button>
  );
}
