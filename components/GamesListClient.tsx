'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getDisplayName, formatLocalDate } from '@/lib/utils/display';
import GameDetailsModal from './GameDetailsModal';

interface GamesListClientProps {
  games: any[];
}

export default function GamesListClient({ games }: GamesListClientProps) {
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleGameClick = (game: any) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  if (games.length === 0) {
    return (
      <div className="bg-card border border-border p-8 rounded-lg text-center">
        <p className="text-muted-foreground mb-4">No games yet.</p>
        <Link
          href="/games/new"
          className="text-primary hover:text-primary/80 font-semibold"
        >
          Schedule your first game
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {games.map((game: any) => {
          const player1 = game.player1;
          const player2 = game.player2;
          const season = game.season;
          const isCompleted = game.status === 'completed';
          const winner = isCompleted && game.winner_id 
            ? (game.winner_id === game.player1_id ? player1 : player2)
            : null;
          const loser = isCompleted && winner
            ? (game.winner_id === game.player1_id ? player2 : player1)
            : null;
          
          const resultImage = game.player1_result_image_url || game.player2_result_image_url || game.result_image_url;

          return (
            <div
              key={game.id}
              className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleGameClick(game)}
            >
              {/* Header con fecha */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-4 py-3 border-b border-border">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {formatLocalDate(game.game_date)}
                    </div>
                    {game.game_time && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                    {season && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {season.name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                      game.status
                    )}`}
                  >
                    {game.status === 'completed' ? 'Completed' : game.status === 'scheduled' ? 'Scheduled' : 'Cancelled'}
                  </span>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="p-4">
                {resultImage && (
                  <div className="mb-4 rounded-lg overflow-hidden border-2 border-border">
                    <img
                      src={resultImage}
                      alt="Game result"
                      className="w-full h-auto max-h-64 object-contain bg-muted/20"
                    />
                  </div>
                )}

                {/* Players */}
                <div className="space-y-3">
                  {isCompleted && winner && loser ? (
                    <>
                      {/* Winner - with pokeball background and larger text */}
                      <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-xl border-2 border-primary/50 overflow-hidden">
                        {/* Pokeball background */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-15">
                          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="40" cy="40" r="40" fill="#FF0000"/>
                            <circle cx="40" cy="40" r="30" fill="#FFFFFF"/>
                            <rect x="10" y="40" width="60" height="3" fill="#000000"/>
                            <circle cx="40" cy="40" r="10" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
                            <circle cx="40" cy="40" r="5" fill="#000000"/>
                          </svg>
                        </div>
                        <div className="relative z-10">
                          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">WINNER</div>
                          <div className="text-2xl sm:text-3xl font-bold text-primary">
                            {getDisplayName(winner)}
                          </div>
                          <div className="text-lg font-semibold text-foreground mt-1">
                            {game.winner_id === game.player1_id ? game.player1_score : game.player2_score} points
                          </div>
                        </div>
                      </div>
                      
                      {/* Loser - smaller text */}
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Loser</div>
                            <div className="text-base sm:text-lg font-medium text-muted-foreground">
                              {getDisplayName(loser)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {game.winner_id === game.player1_id ? game.player2_score : game.player1_score} points
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                      <div className="text-base sm:text-lg font-medium text-foreground text-center">
                        {getDisplayName(player1)} <span className="text-muted-foreground mx-2">vs</span> {getDisplayName(player2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with actions */}
              <div 
                className="bg-muted/20 px-4 py-3 border-t border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/games/${game.id}/edit`}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGame(null);
          }}
          seasonId={selectedGame.season_id}
        />
      )}
    </>
  );
}

