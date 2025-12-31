import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Season } from '@/lib/types/database';

export default async function SeasonsPage() {
  const supabase = await createClient();
  const { data: seasons, error } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching seasons:', error);
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Seasons</h1>
          <Link
            href="/seasons/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Add Season
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading seasons: {error.message}
          </div>
        )}

        {seasons && seasons.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No seasons yet.</p>
            <Link
              href="/seasons/new"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create your first season
            </Link>
          </div>
        )}

        {seasons && seasons.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season: Season) => (
              <div
                key={season.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {season.name}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                      season.status
                    )}`}
                  >
                    {season.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-semibold">Year:</span> {season.year}
                  </p>
                  <p>
                    <span className="font-semibold">Start:</span>{' '}
                    {new Date(season.start_date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold">End:</span>{' '}
                    {new Date(season.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <Link
                    href={`/seasons/${season.id}`}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold text-sm"
                  >
                    View Games →
                  </Link>
                  <Link
                    href={`/seasons/${season.id}/edit`}
                    className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

