import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SeasonRankings from '@/components/SeasonRankings';

export default async function Home() {
  const supabase = await createClient();
  
  // Get counts for dashboard
  const [usersResult, seasonsResult, gamesResult] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('seasons').select('id', { count: 'exact', head: true }),
    supabase.from('games').select('id', { count: 'exact', head: true }),
  ]);

  const userCount = usersResult.count || 0;
  const seasonCount = seasonsResult.count || 0;
  const gameCount = gamesResult.count || 0;

  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Pokemon League</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Official Pokemon Trading Card Game League Score Tracker
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/users"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {userCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Users</div>
          </Link>
          <Link
            href="/seasons"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {seasonCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Seasons</div>
          </Link>
          <Link
            href="/rankings"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {gameCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Games</div>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          {activeSeason ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Current Season Rankings</h2>
                <Link
                  href={`/seasons/${activeSeason.id}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View Season →
                </Link>
              </div>
              <SeasonRankings seasonId={activeSeason.id} compact={true} />
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">No Active Season</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                There is no active season at the moment. Create a new season to get started!
              </p>
              <Link
                href="/seasons/new"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Create Season
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

