import Link from 'next/link';
import { User } from '@/lib/types/database';

interface MobileUserCardProps {
  user: User;
  isSuperAdmin: boolean;
}

export default function MobileUserCard({ user, isSuperAdmin }: MobileUserCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-900 dark:text-white">
              {user.name}
            </div>
            {user.nickname && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                @{user.nickname}
              </div>
            )}
          </div>
          {isSuperAdmin && (
            <Link
              href={`/users/${user.id}/edit`}
              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium ml-2"
            >
              Edit
            </Link>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.email || '-'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Joined: {new Date(user.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

