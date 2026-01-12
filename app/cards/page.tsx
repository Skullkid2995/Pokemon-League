import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CardsCatalog from '@/components/cards/CardsCatalog';

export default async function CardsPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get cards from database
  const { data: cards, error } = await supabase
    .from('pokemon_cards')
    .select('*')
    .order('name')
    .limit(500); // Limit initial load

  return (
    <main className="min-h-screen bg-background pt-20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Pokemon Cards Catalog</h1>
        <CardsCatalog initialCards={cards || []} />
      </div>
    </main>
  );
}

