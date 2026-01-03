import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getDisplayName } from '@/lib/utils/display';
import SeasonFilter from '@/components/SeasonFilter';

interface PlayerStats {
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  total_games: number;
  win_percentage: number;
  damage_points: number;
}

interface RankingsPageProps {
  searchParams: { season?: string };
}

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const supabase = await createClient();
  const selectedSeasonId = searchParams.season;
  
  // Get all seasons for the filter
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })
    .order('start_date', { ascending: false });

  // Build the query for games
  let gamesQuery = supabase
    .from('games')
    .select(`
      *,
      player1:users!games_player1_id_fkey(*),
      player2:users!games_player2_id_fkey(*),
      winner:users!games_winner_id_fkey(*),
      season:seasons(*)
    `)
    .eq('status', 'completed')
    .not('winner_id', 'is', null);

  // Filter by season if one is selected
  if (selectedSeasonId && selectedSeasonId !== 'all') {
    gamesQuery = gamesQuery.eq('season_id', selectedSeasonId);
  }

  const { data: games, error } = await gamesQuery;

  if (error) {
    console.error('Error fetching games:', error);
  }

  // Calculate statistics for each player
  const playerStatsMap = new Map<string, PlayerStats>();

  if (games) {
    games.forEach((game: any) => {
      const player1Id = game.player1_id;
      const player2Id = game.player2_id;
      const winnerId = game.winner_id;

      // Initialize player 1 stats
      if (!playerStatsMap.has(player1Id)) {
        playerStatsMap.set(player1Id, {
          player_id: player1Id,
          player_name: getDisplayName(game.player1),
          wins: 0,
          losses: 0,
          total_games: 0,
          win_percentage: 0,
          damage_points: 0,
        });
      }

      // Initialize player 2 stats
      if (!playerStatsMap.has(player2Id)) {
        playerStatsMap.set(player2Id, {
          player_id: player2Id,
          player_name: getDisplayName(game.player2),
          wins: 0,
          losses: 0,
          total_games: 0,
          win_percentage: 0,
          damage_points: 0,
        });
      }

      const player1Stats = playerStatsMap.get(player1Id)!;
      const player2Stats = playerStatsMap.get(player2Id)!;

      // Update stats
      player1Stats.total_games++;
      player2Stats.total_games++;

      if (winnerId === player1Id) {
        player1Stats.wins++;
        // Add damage points for both players (using player-specific damage points)
        player1Stats.damage_points += game.player1_damage_points || 0;
        player2Stats.losses++;
        player2Stats.damage_points += game.player2_damage_points || 0;
      } else {
        player2Stats.wins++;
        // Add damage points for both players (using player-specific damage points)
        player2Stats.damage_points += game.player2_damage_points || 0;
        player1Stats.losses++;
        player1Stats.damage_points += game.player1_damage_points || 0;
      }
    });
  }

  // Calculate win percentages and sort by wins (desc), then win percentage, then damage points
  const rankings = Array.from(playerStatsMap.values())
    .map((stats) => ({
      ...stats,
      win_percentage: stats.total_games > 0 
        ? Math.round((stats.wins / stats.total_games) * 100) 
        : 0,
    }))
    .sort((a, b) => {
      // Sort by wins first (desc), then win percentage (desc), then damage points (desc)
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (b.win_percentage !== a.win_percentage) {
        return b.win_percentage - a.win_percentage;
      }
      return b.damage_points - a.damage_points;
    });

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          🥇 1st
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          🥈 2nd
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          🥉 3rd
        </span>
      );
    }
    return <span className="text-gray-500 dark:text-gray-400">#{index + 1}</span>;
  };

  const selectedSeason = selectedSeasonId && selectedSeasonId !== 'all' 
    ? seasons?.find(s => s.id === selectedSeasonId)
    : null;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Rankings</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {selectedSeason 
                  ? `Standings for ${selectedSeason.name} (${selectedSeason.year})`
                  : 'Overall standings based on completed games from all seasons'}
              </p>
            </div>
          </div>
          
          {/* Season Filter */}
          {seasons && seasons.length > 0 && (
            <SeasonFilter seasons={seasons} selectedSeasonId={selectedSeasonId} />
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading rankings: {error.message}
          </div>
        )}

        {rankings.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No completed games yet. Complete some games to see rankings!
            </p>
          </div>
        )}

        {rankings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Losses
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Games
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Win %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Damage Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rankings.map((player, index) => (
                  <tr 
                    key={player.player_id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getRankBadge(index)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {player.player_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {player.wins}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {player.losses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {player.total_games}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {player.win_percentage}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {player.damage_points}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {rankings.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">Prize Positions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings[0] && (
                <div className="bg-yellow-100 dark:bg-yellow-900/40 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🥇</div>
                  <div className="font-bold text-gray-900 dark:text-white">1st Place</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{rankings[0].player_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rankings[0].damage_points} damage points</div>
                </div>
              )}
              {rankings[1] && (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🥈</div>
                  <div className="font-bold text-gray-900 dark:text-white">2nd Place</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{rankings[1].player_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rankings[1].damage_points} damage points</div>
                </div>
              )}
              {rankings[2] && (
                <div className="bg-orange-100 dark:bg-orange-900/40 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🥉</div>
                  <div className="font-bold text-gray-900 dark:text-white">3rd Place</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{rankings[2].player_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rankings[2].damage_points} damage points</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

