'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteGame(gameId: string, seasonId: string) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Unauthorized', success: false };
    }

    // Get current user record to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !currentUser) {
      return { error: 'User not found', success: false };
    }

    // Check if user is super admin
    if (currentUser.role !== 'super_admin') {
      return { error: 'Only super admins can delete games', success: false };
    }

    // Get game data before deletion for audit log
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select(`
        *,
        player1:users!games_player1_id_fkey(*),
        player2:users!games_player2_id_fkey(*),
        season:seasons(*)
      `)
      .eq('id', gameId)
      .single();

    if (gameError || !gameData) {
      return { error: 'Game not found', success: false };
    }

    // Only allow deletion of completed games
    if (gameData.status !== 'completed') {
      return { error: 'Only completed games can be deleted', success: false };
    }

    // Create audit log entry before deletion
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        table_name: 'games',
        record_id: gameId,
        action: 'deleted',
        user_id: currentUser.id || null,
        user_email: currentUser.email || user.email,
        changes: {
          game_data: gameData,
          deleted_at: new Date().toISOString(),
        },
      });

    // Log audit error but don't fail the deletion
    if (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    // Delete the game
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId);

    if (deleteError) {
      return { error: deleteError.message, success: false };
    }

    revalidatePath(`/seasons/${seasonId}`);
    revalidatePath('/rankings');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting game:', error);
    return { error: error.message || 'Failed to delete game', success: false };
  }
}

