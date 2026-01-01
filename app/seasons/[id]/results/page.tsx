import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SeasonResults from '@/components/SeasonResults';

export default async function SeasonResultsPage({
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

  // Only allow viewing results for completed seasons
  if (season.status !== 'completed') {
    redirect(`/seasons/${params.id}`);
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{season.name} - Final Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Season closed on {new Date(season.end_date).toLocaleDateString()}
          </p>
        </div>
        <SeasonResults seasonId={params.id} season={season} />
      </div>
    </div>
  );
}

