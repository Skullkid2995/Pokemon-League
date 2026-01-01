import { createClient } from '@/lib/supabase/server';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUser();
  return !!user;
}

/**
 * Get user data from users table by auth user id
 */
export async function getUserData(authUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  return { data, error };
}

/**
 * Get the current user's role (for server components)
 * Returns the role or null if not authenticated or user not found
 */
export async function getCurrentUserRole(): Promise<'super_admin' | 'player' | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single();
  
  return (userData?.role as 'super_admin' | 'player') || null;
}
