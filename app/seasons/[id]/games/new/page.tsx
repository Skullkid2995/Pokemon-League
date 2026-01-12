import GameForm from '@/components/GameForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserRole } from '@/lib/utils/auth';

export default async function NewGamePage({
  params,
}: {
  params: { id: string };
}) {
  const userRole = await getCurrentUserRole();
  
  if (userRole !== 'super_admin') {
    redirect(`/seasons/${params.id}`);
  }

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

  return <GameForm seasonId={params.id} />;
}


