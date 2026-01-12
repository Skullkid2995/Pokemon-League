import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Season } from '@/lib/types/database';
import { getCurrentUserRole } from '@/lib/utils/auth';
import SeasonEditButton from '@/components/seasons/SeasonEditButton';

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

  const userRole = await getCurrentUserRole();
  const isSuperAdmin = userRole === 'super_admin';

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Seasons</h1>
          {isSuperAdmin && (
            <Link
              href="/seasons/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition text-sm sm:text-base w-full sm:w-auto text-center"
            >
              Add Season
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error loading seasons: {error.message}
          </div>
        )}

        {seasons && seasons.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No seasons yet.</p>
            {isSuperAdmin && (
              <Link
                href="/seasons/new"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Create your first season
              </Link>
            )}
          </div>
        )}

        {seasons && seasons.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season: Season) => {
              // Get gradient based on status
              const getGradient = (status: string) => {
                switch (status) {
                  case 'active':
                    return 'from-green-500/20 via-emerald-500/10 to-teal-500/20';
                  case 'completed':
                    return 'from-gray-500/20 via-slate-500/10 to-zinc-500/20';
                  case 'upcoming':
                    return 'from-blue-500/20 via-cyan-500/10 to-sky-500/20';
                  default:
                    return 'from-gray-500/20 via-slate-500/10 to-zinc-500/20';
                }
              };

              return (
                <Link
                  key={season.id}
                  href={season.status === 'completed' ? `/seasons/${season.id}/results` : `/seasons/${season.id}`}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 block"
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(season.status)}`} />
                  
                  {/* Luxury Ball Background - Corner */}
                  <div className="absolute -bottom-8 -right-8 w-40 h-40 opacity-130 group-hover:opacity-10 transition-opacity duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/Lujo_Ball_(Ilustración).png"
                      alt="Luxury Ball"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px]">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {season.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          season.status
                        )} shadow-sm`}
                      >
                        {season.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Year:</span> 
                        <span className="text-gray-900 dark:text-white">{season.year}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Start:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(season.start_date).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">End:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(season.end_date).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                      <span className="text-primary font-semibold text-sm group-hover:underline">
                        {season.status === 'completed' ? 'View Results →' : 'View Games →'}
                      </span>
                      {isSuperAdmin && season.status !== 'completed' && (
                        <SeasonEditButton seasonId={season.id} />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

