'use client';

import Link from 'next/link';

interface SeasonEditButtonProps {
  seasonId: string;
}

export default function SeasonEditButton({ seasonId }: SeasonEditButtonProps) {
  return (
    <Link
      href={`/seasons/${seasonId}/edit`}
      onClick={(e) => e.stopPropagation()}
      className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10 relative"
    >
      Edit
    </Link>
  );
}

