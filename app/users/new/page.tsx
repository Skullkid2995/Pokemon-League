import UserForm from '@/components/UserForm';
import { getCurrentUserRole } from '@/lib/utils/auth';
import { redirect } from 'next/navigation';

export default async function NewUserPage() {
  const userRole = await getCurrentUserRole();
  
  if (userRole !== 'super_admin') {
    redirect('/users');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Add New Player</h1>
        <UserForm />
      </div>
    </div>
  );
}


