'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeSeason } from '@/app/actions/seasons';

interface CloseSeasonButtonProps {
  seasonId: string;
}

export default function CloseSeasonButton({ seasonId }: CloseSeasonButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = async () => {
    if (!confirm('Are you sure you want to close this season? This will lock all games and prevent further editing. This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await closeSeason(seasonId);
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to close season');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <button
        onClick={handleClose}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-6 rounded-lg transition"
      >
        {loading ? 'Closing...' : 'Close Season'}
      </button>
    </>
  );
}

