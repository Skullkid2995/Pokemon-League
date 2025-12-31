import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GameForm from '@/components/GameForm';

export default async function EditGamePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !game) {
    redirect('/games');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Edit Game</h1>
        <GameForm game={game} />
      </div>
    </div>
  );
}


