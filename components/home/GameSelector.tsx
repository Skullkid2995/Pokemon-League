'use client';

import { cn } from '@/lib/utils';

type GameType = 'pokemon' | 'smash';

interface GameSelectorProps {
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
}

export default function GameSelector({ selectedGame, onGameChange }: GameSelectorProps) {
  const games = [
    { id: 'pokemon' as GameType, name: 'Pokemon', icon: '⚡' },
    { id: 'smash' as GameType, name: 'Smash Ultimate', icon: '💥' },
  ];

  return (
    <div className="flex gap-3 p-1 bg-muted/50 rounded-2xl">
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => onGameChange(game.id)}
          className={cn(
            "flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200",
            selectedGame === game.id
              ? "bg-primary text-primary-foreground shadow-md scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="text-xl mr-2">{game.icon}</span>
          {game.name}
        </button>
      ))}
    </div>
  );
}

