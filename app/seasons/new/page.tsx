import SeasonForm from '@/components/SeasonForm';

export default function NewSeasonPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create New Season</h1>
        <SeasonForm />
      </div>
    </div>
  );
}


