import { User } from '@/lib/types/database';

type UserLike = { name?: string | null; nickname?: string | null } | null | undefined;

/**
 * Get the display name for a user (nickname if available, otherwise full name)
 */
export function getDisplayName(user: UserLike): string {
  if (!user) return 'Unknown';
  return user.nickname || user.name || 'Unknown';
}

/**
 * Format a date string (YYYY-MM-DD) as a local date string
 * This prevents timezone issues where dates are shifted by one day
 */
export function formatLocalDate(dateString: string): string {
  if (!dateString) return '';
  
  // Parse the date string (YYYY-MM-DD) as local time
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString();
}

