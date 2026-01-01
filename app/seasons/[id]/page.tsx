'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DeleteGameButton from '@/components/DeleteGameButton';
import { getDisplayName } from '@/lib/utils/display';
import CloseSeasonButton from '@/components/CloseSeasonButton';
import { User, Season } from '@/lib/types/database';

export default function SeasonDetailPage() {
  const params = useParams();
  const seasonId = params.id as string;
  const supabase = createClient();
  const [season, setSeason] = useState<Season | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<'super_admin' | 'player' | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user and role
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', authUser.id)
            .single();
          setCurrentUserRole(currentUser?.role || null);
        }

        // Get season
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('*')
          .eq('id', seasonId)
          .single();

        if (seasonError || !seasonData) {
          console.error('Error fetching season:', seasonError);
          return;
        }

        setSeason(seasonData);

        // Get users for filter
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('name');

        if (usersData) {
          setUsers(usersData);
        }

        // Get games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            *,
            player1:users!games_player1_id_fkey(*),
            player2:users!games_player2_id_fkey(*)
          `)
          .eq('season_id', seasonId)
          .order('game_date', { ascending: false })
          .order('game_time', { ascending: false });

        if (gamesError) {
          console.error('Error fetching games:', gamesError);
        } else if (gamesData) {
          setAllGames(gamesData);
          setGames(gamesData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [seasonId, supabase]);

  useEffect(() => {
    if (selectedPlayerId === 'all') {
      setGames(allGames);
    } else {
      const filtered = allGames.filter(
        (game) => game.player1_id === selectedPlayerId || game.player2_id === selectedPlayerId
      );
      setGames(filtered);
    }
  }, [selectedPlayerId, allGames]);

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

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Season not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/seasons"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to Seasons
        </Link>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{season.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()} ({season.year})
            </p>
          </div>
          <div className="flex gap-4">
            {season.status === 'active' && <CloseSeasonButton seasonId={season.id} />}
            {season.status === 'active' && (
              <Link
                href={`/seasons/${season.id}/games/new`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Add Game
              </Link>
            )}
            {season.status === 'completed' && (
              <Link
                href={`/seasons/${season.id}/results`}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
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
                  
                  return (
                    <tr 
                      key={game.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isCompleted ? 'opacity-75' : ''}`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap ${rowTextColor}`}>
                        <div className="text-sm font-medium">
                          {new Date(game.game_date).toLocaleDateString()}
                        </div>
                        {game.game_time && (
                          <div className="text-sm">
                            {new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-4">
                          {game.status === 'scheduled' && season.status !== 'completed' ? (
                            <Link
                              href={`/seasons/${season.id}/games/${game.id}/save`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Save Game
                            </Link>
                          ) : null}
                          {/* Only super admins can delete completed games */}
                          {game.status === 'completed' && currentUserRole === 'super_admin' && (
                            <DeleteGameButton gameId={game.id} seasonId={season.id} gameStatus={game.status} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      </div>
    </div>
  );
}
