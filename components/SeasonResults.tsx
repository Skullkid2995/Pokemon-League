'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDisplayName } from '@/lib/utils/display';

interface SeasonResultsProps {
  seasonId: string;
  season: any;
}

interface PlayerStats {
  player_id: string;
  player_name: string;
  wins: number;
  losses: number;
  total_games: number;
  win_percentage: number;
  damage_points: number;
}

interface GameData {
  date: string;
  [key: string]: any; // Player IDs as keys with win/loss counts
}

export default function SeasonResults({ seasonId, season }: SeasonResultsProps) {
  const supabase = createClient();
  const [rankings, setRankings] = useState<PlayerStats[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [chartData, setChartData] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: gamesData } = await supabase
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
        .order('game_date', { ascending: true });

      if (gamesData) {
        setGames(gamesData);
        calculateRankings(gamesData);
        calculateChartData(gamesData);
      }
      setLoading(false);
    }
    fetchData();
  }, [seasonId, supabase]);

  const calculateRankings = (gamesData: any[]) => {
    const playerStatsMap = new Map<string, PlayerStats>();

    gamesData.forEach((game: any) => {
      const player1Id = game.player1_id;
      const player2Id = game.player2_id;
      const winnerId = game.winner_id;

      if (!playerStatsMap.has(player1Id)) {
        playerStatsMap.set(player1Id, {
          player_id: player1Id,
          player_name: getDisplayName(game.player1),
          wins: 0,
          losses: 0,
          total_games: 0,
          damage_points: 0,
          win_percentage: 0,
        });
      }

      if (!playerStatsMap.has(player2Id)) {
        playerStatsMap.set(player2Id, {
          player_id: player2Id,
          player_name: getDisplayName(game.player2),
          wins: 0,
          losses: 0,
          total_games: 0,
          damage_points: 0,
          win_percentage: 0,
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

    const rankingsArray = Array.from(playerStatsMap.values())
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
      });

    setRankings(rankingsArray);
  };

  const calculateChartData = (gamesData: any[]) => {
    // Sort games by date
    const sortedGames = [...gamesData].sort((a, b) => 
      new Date(a.game_date).getTime() - new Date(b.game_date).getTime()
    );

    // Calculate cumulative wins per player per date
    const playerWins = new Map<string, number>();
    const chartDataArray: GameData[] = [];

    sortedGames.forEach((game: any) => {
      const date = new Date(game.game_date).toLocaleDateString();
      const player1Id = game.player1_id;
      const player2Id = game.player2_id;
      const winnerId = game.winner_id;

      // Initialize players if not seen before
      if (!playerWins.has(player1Id)) {
        playerWins.set(player1Id, 0);
      }
      if (!playerWins.has(player2Id)) {
        playerWins.set(player2Id, 0);
      }

      // Update wins
      if (winnerId === player1Id) {
        playerWins.set(player1Id, (playerWins.get(player1Id) || 0) + 1);
      } else {
        playerWins.set(player2Id, (playerWins.get(player2Id) || 0) + 1);
      }

      // Create data point with current cumulative wins
      const dataPoint: GameData = { date };
      playerWins.forEach((wins, playerId) => {
        dataPoint[playerId] = wins;
      });

      chartDataArray.push(dataPoint);
    });

    setChartData(chartDataArray);
  };

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

  // Filter chart data for selected player
  const filteredChartData = selectedPlayer === 'all' 
    ? chartData.map(point => {
        const filtered: GameData = { date: point.date };
        rankings.slice(0, 6).forEach((player) => {
          filtered[player.player_id] = point[player.player_id] || 0;
        });
        return filtered;
      })
    : chartData.map(point => ({
        date: point.date,
        [selectedPlayer]: point[selectedPlayer] || 0,
      }));

  // Get chart colors for players
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Season Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Season Summary</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Games</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{games.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Participants</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{rankings.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Start Date</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Date(season.start_date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">End Date</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Date(season.end_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Final Rankings */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Final Rankings</h2>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRankBadge(index)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {player.player_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                    {player.wins}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                    {player.losses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                    {player.total_games}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                    {player.win_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-white">
                    {player.damage_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prize Positions */}
      {rankings.length >= 3 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">🏆 Prize Positions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {rankings[0] && (
              <div className="bg-yellow-100 dark:bg-yellow-900/40 p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">🥇</div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">1st Place</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{rankings[0].player_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rankings[0].points} points</div>
              </div>
            )}
            {rankings[1] && (
              <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">🥈</div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">2nd Place</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{rankings[1].player_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rankings[1].damage_points} damage points</div>
              </div>
            )}
            {rankings[2] && (
              <div className="bg-orange-100 dark:bg-orange-900/40 p-6 rounded-lg text-center">
                <div className="text-4xl mb-2">🥉</div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">3rd Place</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{rankings[2].player_name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rankings[2].damage_points} damage points</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Win/Loss Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Win Progression Over Time</h2>
            <div className="mb-4">
              <label htmlFor="player-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Player:
              </label>
              <select
                id="player-filter"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Players</option>
                {rankings.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.player_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedPlayer === 'all' 
                ? rankings.slice(0, 6).map((player, index) => (
                    <Line
                      key={player.player_id}
                      type="monotone"
                      dataKey={player.player_id}
                      name={player.player_name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                    />
                  ))
                : <Line
                    type="monotone"
                    dataKey={selectedPlayer}
                    name={rankings.find(p => p.player_id === selectedPlayer)?.player_name || 'Player'}
                    stroke={colors[0]}
                    strokeWidth={2}
                  />
              }
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

