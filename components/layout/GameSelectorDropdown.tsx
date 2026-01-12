'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameType = 'pokemon' | 'smash';

interface GameContextType {
  selectedGame: GameType;
  setSelectedGame: (game: GameType) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [selectedGame, setSelectedGame] = useState<GameType>('pokemon');

  return (
    <GameContext.Provider value={{ selectedGame, setSelectedGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

interface GameSelectorDropdownProps {
  availableGames?: GameType[];
}

export default function GameSelectorDropdown({ 
  availableGames = ['pokemon', 'smash'] 
}: GameSelectorDropdownProps) {
  const { selectedGame, setSelectedGame } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const games = [
    { 
      id: 'pokemon' as GameType, 
      name: 'Pokemon', 
      logo: '/images/pokelogo.jpg',
      fallback: '⚡' 
    },
    { 
      id: 'smash' as GameType, 
      name: 'Smash Ultimate', 
      logo: '/images/smash-logo.png',
      fallback: '💥' 
    },
  ];

  const currentGame = games.find(g => g.id === selectedGame);

  const GameIcon = ({ game, className }: { game: typeof games[0], className?: string }) => {
    const [imgError, setImgError] = useState(false);
    return (
      <div className={cn("flex items-center justify-center", className)}>
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
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="gap-2"
      >
        {currentGame && <GameIcon game={currentGame} />}
        <span>{currentGame?.name}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              {games
                .filter(game => availableGames.includes(game.id))
                .map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      setSelectedGame(game.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                      selectedGame === game.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted"
                    )}
                  >
                    <GameIcon game={game} />
                    <span>{game.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
