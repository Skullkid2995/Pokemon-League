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
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    // Allow deletion of scheduled or completed games (super admin only)
    if (!confirm('Are you sure you want to delete this game? This action will be logged and cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await deleteGame(gameId, seasonId);
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to delete game');
      }

      // Show success message
      setSuccess(true);
      setLoading(false);
      
      // Refresh the page after a brief delay to show the success message
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Unable to Delete');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
        Deleted Successfully
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      {error && (
        <div className="text-red-600 dark:text-red-400 text-xs mb-1 font-medium">
          Unable to Delete
        </div>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 text-sm font-medium"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
