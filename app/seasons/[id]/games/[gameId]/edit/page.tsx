import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GameForm from '@/components/GameForm';
import Link from 'next/link';
import { getCurrentUserRole } from '@/lib/utils/auth';

export default async function EditGamePage({
  params,
}: {
  params: { id: string; gameId: string };
}) {
  const userRole = await getCurrentUserRole();
  
  if (userRole !== 'super_admin') {
    redirect(`/seasons/${params.id}`);
  }

  const supabase = await createClient();
  
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', params.gameId)
    .single();

  if (error || !game) {
    redirect(`/seasons/${params.id}`);
  }

  // Get season for back link
  const { data: season } = await supabase
    .from('seasons')
    .select('name')
    .eq('id', params.id)
    .single();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/seasons/${params.id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to {season?.name || 'Season'}
        </Link>
        <h1 className="text-4xl font-bold mb-8">Edit Game</h1>
        <GameForm game={game} seasonId={params.id} />
      </div>
    </div>
  );
}


