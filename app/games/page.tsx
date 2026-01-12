import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDisplayName, formatLocalDate } from '@/lib/utils/display';
import { GameWithPlayers } from '@/lib/types/database';
import GamesListClient from '@/components/GamesListClient';

export default async function GamesPage() {
  const supabase = await createClient();
  const { data: games, error } = await supabase
    .from('games')
    .select(`
      id,
      season_id,
      player1_id,
      player2_id,
      game_date,
      game_time,
      status,
      winner_id,
      player1_score,
      player2_score,
      notes,
      player1:users!games_player1_id_fkey(id, name, nickname),
      player2:users!games_player2_id_fkey(id, name, nickname),
      season:seasons(id, name, year)
    `)
    .order('game_date', { ascending: false })
    .order('game_time', { ascending: false })
    .limit(100); // Limit for performance

  if (error) {
    console.error('Error fetching games:', error);
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Games</h1>
          <Link
            href="/games/new"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-6 rounded-lg transition"
          >
            New Game
          </Link>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
            Error loading games: {error.message}
          </div>
        )}

        <GamesListClient games={games || []} />
      </div>
    </div>
  );
}
