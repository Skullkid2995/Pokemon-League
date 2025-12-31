import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DeleteGameButton from '@/components/DeleteGameButton';

export default async function SeasonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  
  // Get season details
  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', params.id)
    .single();

  if (seasonError || !season) {
    redirect('/seasons');
  }

  // Get games for this season
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select(`
      *,
      player1:users!games_player1_id_fkey(*),
      player2:users!games_player2_id_fkey(*)
    `)
    .eq('season_id', params.id)
    .order('game_date', { ascending: false })
    .order('game_time', { ascending: false });

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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/seasons"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Seasons
          </Link>
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-4xl font-bold">{season.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()} ({season.year})
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href={`/seasons/${season.id}/edit`}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Edit Season
              </Link>
              <Link
                href={`/seasons/${season.id}/games/new`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Add Game
              </Link>
            </div>
          </div>
        </div>

        {gamesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading games: {gamesError.message}
          </div>
        )}

        {games && games.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No games scheduled for this season yet.</p>
            <Link
              href={`/seasons/${season.id}/games/new`}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Schedule your first game
            </Link>
          </div>
        )}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                  return (
                    <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(game.game_date).toLocaleDateString()}
                        </div>
                        {game.game_time && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>{player1?.name || 'Unknown'} vs {player2?.name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {game.status === 'completed' ? (
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {game.player1_score} - {game.player2_score}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                          <Link
                            href={`/seasons/${season.id}/games/${game.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </Link>
                          <DeleteGameButton gameId={game.id} seasonId={season.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


