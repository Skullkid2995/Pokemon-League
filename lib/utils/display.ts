import { User } from '@/lib/types/database';

/**
 * Get the display name for a user (nickname if available, otherwise full name)
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return 'Unknown';
  return user.nickname || user.name;
}

