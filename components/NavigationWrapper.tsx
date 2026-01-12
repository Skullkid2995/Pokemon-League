import { createClient } from '@/lib/supabase/server';
import Navigation from './Navigation';

export default async function NavigationWrapper() {
  const supabase = await createClient();
  
  // Fetch user data on the server
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  let userData = null;
  let userRole: 'super_admin' | 'player' | null = null;
  
  if (authUser) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, role, nickname, name')
      .eq('auth_user_id', authUser.id)
      .single();
    
    if (userProfile) {
      userData = userProfile;
      userRole = userProfile.role || null;
    }
  }

  return <Navigation initialUser={authUser} initialUserData={userData} initialUserRole={userRole} />;
}



