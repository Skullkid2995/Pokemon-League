'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Game, User, Season } from '@/lib/types/database';

interface GameFormProps {
  game?: Game;
  seasonId?: string;
}

export default function GameForm({ game, seasonId }: GameFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [formData, setFormData] = useState({
    season_id: game?.season_id || seasonId || '',
    player1_id: game?.player1_id || '',
    player2_id: game?.player2_id || '',
    player1_score: game?.player1_score || 0,
    player2_score: game?.player2_score || 0,
    game_date: game?.game_date || '',
    game_time: game?.game_time || '',
    status: game?.status || 'scheduled',
    notes: game?.notes || '',
  });

  useEffect(() => {
    // Fetch users and seasons
    async function fetchData() {
      const [usersResult, seasonsResult] = await Promise.all([
        supabase.from('users').select('*').order('name'),
        supabase.from('seasons').select('*').order('year', { ascending: false }),
      ]);

      if (usersResult.data) setUsers(usersResult.data);
      if (seasonsResult.data) setSeasons(seasonsResult.data);
    }
    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate players are different
    if (formData.player1_id === formData.player2_id) {
      setError('Players must be different');
      setLoading(false);
      return;
    }

    // Validate scores for completed games
    if (formData.status === 'completed' && formData.player1_score === formData.player2_score) {
      setError('Scores cannot be equal for a completed game');
      setLoading(false);
      return;
    }

    try {
      const gameData: any = {
        season_id: formData.season_id,
        player1_id: formData.player1_id,
        player2_id: formData.player2_id,
        game_date: formData.game_date,
        game_time: formData.game_time || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      // Only include scores if game is completed
      if (formData.status === 'completed') {
        gameData.player1_score = formData.player1_score;
        gameData.player2_score = formData.player2_score;
      } else {
        gameData.player1_score = 0;
        gameData.player2_score = 0;
      }

      if (game) {
        // Update existing game
        const { error: updateError } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', game.id);

        if (updateError) throw updateError;
      } else {
        // Create new game
        const { error: insertError } = await supabase.from('games').insert(gameData);

        if (insertError) throw insertError;
      }

      // Redirect to season page if seasonId is provided, otherwise to games list
      if (seasonId || formData.season_id) {
        router.push(`/seasons/${seasonId || formData.season_id}`);
      } else {
        router.push('/games');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!seasonId && (
        <div className="mb-4">
          <label htmlFor="season_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Season <span className="text-red-500">*</span>
          </label>
          <select
            id="season_id"
            required
            value={formData.season_id}
            onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a season</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} ({season.year})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="player1_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Player 1 <span className="text-red-500">*</span>
          </label>
          <select
            id="player1_id"
            required
            value={formData.player1_id}
            onChange={(e) => setFormData({ ...formData, player1_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select player 1</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="player2_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Player 2 <span className="text-red-500">*</span>
          </label>
          <select
            id="player2_id"
            required
            value={formData.player2_id}
            onChange={(e) => setFormData({ ...formData, player2_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select player 2</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="game_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Game Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="game_date"
            required
            value={formData.game_date}
            onChange={(e) => setFormData({ ...formData, game_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="game_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Game Time (optional)
          </label>
          <input
            type="time"
            id="game_time"
            value={formData.game_time}
            onChange={(e) => setFormData({ ...formData, game_time: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {formData.status === 'completed' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="player1_score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Player 1 Score <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="player1_score"
              required
              min="0"
              value={formData.player1_score}
              onChange={(e) => setFormData({ ...formData, player1_score: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="player2_score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Player 2 Score <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="player2_score"
              required
              min="0"
              value={formData.player2_score}
              onChange={(e) => setFormData({ ...formData, player2_score: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Additional notes about the game..."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {loading ? 'Saving...' : game ? 'Update Game' : 'Create Game'}
        </button>
        <Link
          href={seasonId || formData.season_id ? `/seasons/${seasonId || formData.season_id}` : '/games'}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

