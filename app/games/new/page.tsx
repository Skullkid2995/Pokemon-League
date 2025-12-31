import GameForm from '@/components/GameForm';

export default function NewGamePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Schedule New Game</h1>
        <GameForm />
      </div>
    </div>
  );
}


