'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDisplayName, formatLocalDate } from '@/lib/utils/display';
import CloseSeasonButton from '@/components/CloseSeasonButton';
import GameDetailsModal from '@/components/GameDetailsModal';
import { User, Season } from '@/lib/types/database';

interface SeasonDetailClientProps {
  season: Season;
  games: any[];
  users: Pick<User, 'id' | 'name' | 'nickname'>[];
  currentUserRole: 'super_admin' | 'player' | null;
  currentUserId: string | null;
}

export default function SeasonDetailClient({
  season,
  games: initialGames,
  users,
  currentUserRole,
  currentUserId,
}: SeasonDetailClientProps) {
  const searchParams = useSearchParams();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [selectedGame, setSelectedGame] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open modal if gameId is in URL query params
  useEffect(() => {
    const gameId = searchParams.get('gameId');
    if (gameId && initialGames.length > 0 && !isModalOpen && !selectedGame) {
      const game = initialGames.find((g: any) => g.id === gameId);
      if (game) {
        setSelectedGame(game);
        setIsModalOpen(true);
        // Clean up URL without reloading after a short delay
        setTimeout(() => {
          window.history.replaceState({}, '', window.location.pathname);
        }, 100);
      }
    }
  }, [searchParams, initialGames, isModalOpen, selectedGame]);

  // Filter games based on selected player - memoized for performance
  const games = useMemo(() => {
    if (selectedPlayerId === 'all') {
      return initialGames;
    }
    return initialGames.filter(
      (game) => game.player1_id === selectedPlayerId || game.player2_id === selectedPlayerId
    );
  }, [selectedPlayerId, initialGames]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white font-bold shadow-md';
      case 'scheduled':
        return 'bg-blue-500 text-white font-bold shadow-md';
      case 'cancelled':
        return 'bg-red-600 text-white font-bold shadow-md';
      default:
        return 'bg-gray-500 text-white font-bold shadow-md';
    }
  };

  const getStatusPokeballColor = (status: string) => {
    switch (status) {
      case 'completed':
        // Green pokeball (completed)
        return '#22c55e'; // green-500
      case 'scheduled':
        // Blue pokeball (scheduled)
        return '#3b82f6'; // blue-500
      case 'cancelled':
        // Red pokeball (cancelled)
        return '#dc2626'; // red-600
      default:
        // Gray pokeball (default)
        return '#6b7280'; // gray-500
    }
  };

  const getGameCompletionStatus = (game: any) => {
    // If game is already completed
    if (game.status === 'completed') {
      return { status: 'Game Saved', color: 'bg-green-500 text-white font-bold shadow-md' };
    }

    const hasP1Image = !!game.player1_result_image_url;
    const hasP2Image = !!game.player2_result_image_url;
    const hasP1Damage = game.player1_damage_points !== null && game.player1_damage_points !== undefined;
    const hasP2Damage = game.player2_damage_points !== null && game.player2_damage_points !== undefined;
    const hasP1Winner = !!game.player1_winner_selection;
    const hasP2Winner = !!game.player2_winner_selection;

    // Check if player has all required data (image, damage, winner)
    const p1Complete = hasP1Image && hasP1Damage && hasP1Winner;
    const p2Complete = hasP2Image && hasP2Damage && hasP2Winner;

    // Check for winner mismatch
    if (hasP1Winner && hasP2Winner && game.player1_winner_selection !== game.player2_winner_selection) {
      return { status: 'Winner Mismatch', color: 'bg-red-600 text-white font-bold shadow-md' };
    }

    // Check if all data is provided
    if (p1Complete && p2Complete) {
      return { status: 'Ready to Complete', color: 'bg-yellow-400 text-red-600 font-bold shadow-md' };
    }

    // Check which players are missing data
    const missingPlayers = [];
    if (!p1Complete) missingPlayers.push(getDisplayName(game.player1));
    if (!p2Complete) missingPlayers.push(getDisplayName(game.player2));

    if (missingPlayers.length === 2) {
      return { status: 'Pending', color: 'bg-gray-500 text-white font-bold shadow-md' };
    }

    return { status: `Pending: ${missingPlayers.join(', ')}`, color: 'bg-orange-500 text-white font-bold shadow-md' };
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/seasons"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to Seasons
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{season.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {formatLocalDate(season.start_date)} - {formatLocalDate(season.end_date)} ({season.year})
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {currentUserRole === 'super_admin' && season.status === 'active' && (
              <CloseSeasonButton seasonId={season.id} />
            )}
            {currentUserRole === 'super_admin' && season.status === 'active' && (
              <Link
                href={`/seasons/${season.id}/games/new`}
                className="tcg-gradient-primary hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl text-center text-sm sm:text-base"
              >
                Add Game
              </Link>
            )}
            {season.status === 'completed' && (
              <Link
                href={`/seasons/${season.id}/results`}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition text-center text-sm sm:text-base"
              >
                View Results
              </Link>
            )}
          </div>
        </div>

        {/* Player Filter */}
        <div className="mb-6">
          <label htmlFor="playerFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Player
          </label>
          <select
            id="playerFilter"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Players</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {getDisplayName(user)}
              </option>
            ))}
          </select>
        </div>

        {games && games.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {games.map((game: any) => {
                const player1 = game.player1;
                const player2 = game.player2;
                const isCompleted = game.status === 'completed';
                const rowTextColor = isCompleted 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-white';
                const pokeballColor = getStatusPokeballColor(game.status);
                
                return (
                  <div 
                    key={game.id} 
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow ${isCompleted ? 'opacity-75' : ''}`}
                    onClick={() => {
                      setSelectedGame(game);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`flex items-center gap-3 ${rowTextColor}`}>
                        {/* Status Pokeball */}
                        <div className="flex-shrink-0 w-8 h-8">
                          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <circle cx="60" cy="60" r="60" fill={pokeballColor}/>
                            <circle cx="60" cy="60" r="45" fill="#FFFFFF"/>
                            <rect x="15" y="60" width="90" height="5" fill="#000000"/>
                            <circle cx="60" cy="60" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3"/>
                            <circle cx="60" cy="60" r="8" fill="#000000"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {formatLocalDate(game.game_date)}
                          </div>
                          {game.game_time && (
                            <div className="text-sm">
                              {new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          game.status
                        )}`}
                      >
                        {game.status}
                      </span>
                    </div>
                    <div className={`mb-3 ${rowTextColor}`}>
                      <div className="text-sm font-semibold">
                        {getDisplayName(player1)} vs {getDisplayName(player2)}
                      </div>
                    </div>
                    <div className={`mb-3 ${rowTextColor}`}>
                      {game.status === 'completed' && game.winner_id ? (
                        <div className="text-sm font-semibold">
                          Winner: {getDisplayName(game.winner_id === game.player1_id ? player1 : player2)}
                        </div>
                      ) : (
                        <div className="text-sm">No score yet</div>
                      )}
                    </div>
                    <div className="mb-3">
                      {(() => {
                        const completionStatus = getGameCompletionStatus(game);
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${completionStatus.color}`}>
                            {completionStatus.status}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Game Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {games.map((game: any) => {
                    const player1 = game.player1;
                    const player2 = game.player2;
                    const isCompleted = game.status === 'completed';
                    const rowTextColor = isCompleted 
                      ? 'text-gray-600 dark:text-gray-400' 
                      : 'text-gray-900 dark:text-white';
                    
                    const pokeballColor = getStatusPokeballColor(game.status);
                    
                    return (
                      <tr 
                        key={game.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${isCompleted ? 'opacity-75' : ''}`}
                        onClick={() => {
                          setSelectedGame(game);
                          setIsModalOpen(true);
                        }}
                      >
                        <td className={`px-6 py-4 whitespace-nowrap ${rowTextColor}`}>
                          <div className="flex items-center gap-3">
                            {/* Status Pokeball */}
                            <div className="flex-shrink-0 w-8 h-8">
                              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <circle cx="60" cy="60" r="60" fill={pokeballColor}/>
                                <circle cx="60" cy="60" r="45" fill="#FFFFFF"/>
                                <rect x="15" y="60" width="90" height="5" fill="#000000"/>
                                <circle cx="60" cy="60" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3"/>
                                <circle cx="60" cy="60" r="8" fill="#000000"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {formatLocalDate(game.game_date)}
                              </div>
                              {game.game_time && (
                                <div className="text-sm">
                                  {new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${rowTextColor}`}>
                          <div className="text-sm">
                            {getDisplayName(player1)} vs {getDisplayName(player2)}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-center ${rowTextColor}`}>
                          {game.status === 'completed' && game.winner_id ? (
                            <div className="text-sm font-semibold">
                              Winner: {getDisplayName(game.winner_id === game.player1_id ? player1 : player2)}
                            </div>
                          ) : (
                            <div className="text-sm">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                              game.status
                            )}`}
                          >
                            {game.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {(() => {
                            const completionStatus = getGameCompletionStatus(game);
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${completionStatus.color}`}>
                                {completionStatus.status}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {games && games.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {selectedPlayerId === 'all' 
                ? 'No games scheduled for this season yet.' 
                : 'No games found for this player.'}
            </p>
          </div>
        )}

        {/* Game Details Modal */}
        {selectedGame && (
          <GameDetailsModal
            game={selectedGame}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedGame(null);
              // Clean up URL when modal closes
              window.history.replaceState({}, '', window.location.pathname);
            }}
            seasonId={season.id}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            seasonStatus={season.status}
          />
        )}
      </div>
    </div>
  );
}



