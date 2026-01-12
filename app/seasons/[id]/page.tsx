import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SeasonDetailClient from '@/components/SeasonDetailClient';

export default async function SeasonDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const seasonId = params.id;

  // Fetch all data in PARALLEL for better performance
  const [
    { data: { user: authUser } },
    seasonResult,
    usersResult,
    gamesResult
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('seasons')
      .select('id, name, year, start_date, end_date, status, created_at, updated_at')
      .eq('id', seasonId)
      .single(),
    supabase
      .from('users')
      .select('id, name, nickname')
      .order('name'),
    supabase
      .from('games')
      .select(`
        id,
        season_id,
        player1_id,
        player2_id,
        game_date,
        game_time,
        status,
        winner_id,
        player1_score,
        player2_score,
        player1_damage_points,
        player2_damage_points,
        player1_result_image_url,
        player2_result_image_url,
        player1_winner_selection,
        player2_winner_selection,
        notes,
        player1:users!games_player1_id_fkey(id, name, nickname),
        player2:users!games_player2_id_fkey(id, name, nickname),
        winner:users!games_winner_id_fkey(id, name, nickname)
      `)
      .eq('season_id', seasonId)
      .order('game_date', { ascending: false })
      .order('game_time', { ascending: false })
      .limit(200) // Limit to prevent excessive data
  ]);

  // Handle errors
  if (seasonResult.error || !seasonResult.data) {
    redirect('/seasons');
  }

  // Get current user info
  let currentUserId: string | null = null;
  let currentUserRole: 'super_admin' | 'player' | null = null;
  
  if (authUser) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUser.id)
      .single();
    
    currentUserId = currentUser?.id || null;
    currentUserRole = currentUser?.role || null;
  }

  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading...</div>}>
      <SeasonDetailClient
        season={seasonResult.data}
        games={gamesResult.data || []}
        users={usersResult.data || []}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />
    </Suspense>
  );
}
