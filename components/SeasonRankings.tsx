import { createClient } from '@/lib/supabase/server';
import { getDisplayName } from '@/lib/utils/display';

interface SeasonRankingsProps {
  seasonId: string;
  compact?: boolean;
}

export default async function SeasonRankings({ seasonId, compact = false }: SeasonRankingsProps) {
  const supabase = await createClient();

  // Get season info
  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single();

  if (!season) return null;

  // Get all completed games with winners for this season
  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      player1:users!games_player1_id_fkey(*),
      player2:users!games_player2_id_fkey(*),
      winner:users!games_winner_id_fkey(*)
    `)
    .eq('season_id', seasonId)
    .eq('status', 'completed')
    .not('winner_id', 'is', null)
    .not('result_image_url', 'is', null);

  // Calculate statistics
  const playerStatsMap = new Map<string, any>();

  if (games) {
    games.forEach((game: any) => {
      const player1Id = game.player1_id;
      const player2Id = game.player2_id;
      const winnerId = game.winner_id;

      if (!playerStatsMap.has(player1Id)) {
        playerStatsMap.set(player1Id, {
          player_id: player1Id,
          player_name: getDisplayName(game.player1),
          player: game.player1,
          wins: 0,
          losses: 0,
          total_games: 0,
          damage_points: 0,
        });
      }

      if (!playerStatsMap.has(player2Id)) {
        playerStatsMap.set(player2Id, {
          player_id: player2Id,
          player_name: getDisplayName(game.player2),
          player: game.player2,
          wins: 0,
          losses: 0,
          total_games: 0,
          damage_points: 0,
        });
      }

      const player1Stats = playerStatsMap.get(player1Id)!;
      const player2Stats = playerStatsMap.get(player2Id)!;

      player1Stats.total_games++;
      player2Stats.total_games++;

      if (winnerId === player1Id) {
        player1Stats.wins++;
        player1Stats.damage_points += game.damage_points || 0;
        player2Stats.losses++;
      } else {
        player2Stats.wins++;
        player2Stats.damage_points += game.damage_points || 0;
        player1Stats.losses++;
      }
    });
  }

  const rankings = Array.from(playerStatsMap.values())
    .map((stats) => ({
      ...stats,
      win_percentage: stats.total_games > 0 
        ? Math.round((stats.wins / stats.total_games) * 100) 
        : 0,
    }))
    .sort((a, b) => {
      if (b.damage_points !== a.damage_points) {
        return b.damage_points - a.damage_points;
      }
      return b.win_percentage - a.win_percentage;
    })
    .slice(0, compact ? 5 : undefined); // Show top 5 if compact

  if (rankings.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No completed games yet in this season.
        </p>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (compact) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {season.name} - Current Rankings
          </h3>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Player</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">W-L</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Damage Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rankings.map((player, index) => (
                <tr key={player.player_id} className={index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {getRankBadge(index)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {player.player_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                    {player.wins}-{player.losses}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-gray-900 dark:text-white">
                    {player.damage_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Player</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Wins</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Losses</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Win %</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Damage Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rankings.map((player, index) => (
            <tr key={player.player_id} className={index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {getRankBadge(index)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {player.player_name}
              </td>
              <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                {player.wins}
              </td>
              <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                {player.losses}
              </td>
              <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                {player.total_games}
              </td>
              <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                {player.win_percentage}%
              </td>
              <td className="px-6 py-4 text-sm text-center font-bold text-gray-900 dark:text-white">
                {player.damage_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

