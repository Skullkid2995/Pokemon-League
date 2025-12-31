import GameForm from '@/components/GameForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NewGamePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  
  // Verify season exists
  const { data: season, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !season) {
    redirect('/seasons');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/seasons/${params.id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to {season.name}
        </Link>
        <h1 className="text-4xl font-bold mb-8">Schedule New Game</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Season: <span className="font-semibold">{season.name}</span>
        </p>
        <GameForm seasonId={params.id} />
      </div>
    </div>
  );
}


