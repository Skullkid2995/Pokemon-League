import UserForm from '@/components/UserForm';

export default function NewUserPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Add New Player</h1>
        <UserForm />
      </div>
    </div>
  );
}


