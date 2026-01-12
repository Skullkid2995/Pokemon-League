import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsContent from '@/components/SettingsContent';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Try to get user data - handle case where avatar_url might not exist yet
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, name, nickname, email, avatar_url, role')
    .eq('auth_user_id', user.id)
    .single();

  if (error || !userData) {
    console.error('Error fetching user data:', error);
    redirect('/login');
  }

  const userRole = (userData.role as 'super_admin' | 'player') || null;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Settings</h1>
        <SettingsContent user={userData} userRole={userRole} />
      </div>
    </div>
  );
}

