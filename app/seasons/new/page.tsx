import SeasonForm from '@/components/SeasonForm';
import { getCurrentUserRole } from '@/lib/utils/auth';
import { redirect } from 'next/navigation';

export default async function NewSeasonPage() {
  const userRole = await getCurrentUserRole();
  
  if (userRole !== 'super_admin') {
    redirect('/seasons');
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create New Season</h1>
        <SeasonForm />
      </div>
    </div>
  );
}


