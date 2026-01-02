import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SaveGameForm from '@/components/SaveGameForm';
import Link from 'next/link';
import { getDisplayName } from '@/lib/utils/display';

export default async function SaveGamePage({
  params,
}: {
  params: { id: string; gameId: string };
}) {
  const supabase = await createClient();
  
  // Get current authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    redirect(`/seasons/${params.id}`);
  }

  // Get current user record
  const { data: currentUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single();

  if (!currentUser) {
    redirect(`/seasons/${params.id}`);
  }

  // Get game with players
  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      player1:users!games_player1_id_fkey(*),
      player2:users!games_player2_id_fkey(*)
    `)
    .eq('id', params.gameId)
    .single();

  if (error || !game) {
    redirect(`/seasons/${params.id}`);
  }

  // Check if current user is one of the players (or is super admin)
  const { data: userRoleData } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  const isSuperAdmin = userRoleData?.role === 'super_admin';
  const isPlayer1 = currentUser.id === game.player1_id;
  const isPlayer2 = currentUser.id === game.player2_id;

  // Allow access only if user is super admin or one of the players
  if (!isSuperAdmin && !isPlayer1 && !isPlayer2) {
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
        <h1 className="text-4xl font-bold mb-8">Save Game Result</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getDisplayName(game.player1)} vs {getDisplayName(game.player2)}
        </p>
        <SaveGameForm game={game} seasonId={params.id} />
      </div>
    </div>
  );
}

