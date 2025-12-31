import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SeasonForm from '@/components/SeasonForm';

export default async function EditSeasonPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
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
        <h1 className="text-4xl font-bold mb-8">Edit Season</h1>
        <SeasonForm season={season} />
      </div>
    </div>
  );
}


