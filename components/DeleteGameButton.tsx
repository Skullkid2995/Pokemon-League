'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteGame } from '@/app/actions/games';

interface DeleteGameButtonProps {
  gameId: string;
  seasonId: string;
  gameStatus: string;
}

export default function DeleteGameButton({ gameId, seasonId, gameStatus }: DeleteGameButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    // Only allow deletion of completed games
    if (gameStatus !== 'completed') {
      setError('Only completed games can be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this game? This action will be logged and cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteGame(gameId, seasonId);
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to delete game');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  // Only show delete button for completed games
  if (gameStatus !== 'completed') {
    return null;
  }

  return (
    <>
      {error && (
        <div className="text-red-600 text-xs">{error}</div>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </>
  );
}
