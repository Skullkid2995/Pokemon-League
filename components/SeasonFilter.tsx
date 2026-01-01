'use client';

import { useRouter } from 'next/navigation';
import { Season } from '@/lib/types/database';

interface SeasonFilterProps {
  seasons: Season[];
  selectedSeasonId?: string;
}

export default function SeasonFilter({ seasons, selectedSeasonId }: SeasonFilterProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonId = e.target.value;
    if (seasonId === 'all') {
      router.push('/rankings');
    } else {
      router.push(`/rankings?season=${seasonId}`);
    }
  };

  return (
    <div className="mt-4">
      <label htmlFor="season-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Filter by Season:
      </label>
      <select
        id="season-filter"
        value={selectedSeasonId || 'all'}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
      >
        <option value="all">All Seasons</option>
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name} ({season.year})
          </option>
        ))}
      </select>
    </div>
  );
}

