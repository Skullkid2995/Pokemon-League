import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UserForm from '@/components/UserForm';
import { getCurrentUserRole } from '@/lib/utils/auth';

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const userRole = await getCurrentUserRole();
  
  if (userRole !== 'super_admin') {
    redirect('/users');
  }

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !user) {
    redirect('/users');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Edit Player</h1>
        <UserForm user={user} />
      </div>
    </div>
  );
}


