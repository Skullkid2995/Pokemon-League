'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types/database';
import { createUserWithAuth } from '@/app/actions/users';
import { PasswordOption } from '@/lib/utils/password';

interface UserFormProps {
  user?: User;
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [passwordOption, setPasswordOption] = useState<PasswordOption>('random');
  const [role, setRole] = useState<'super_admin' | 'player'>(user?.role || 'player');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    nickname: user?.nickname || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTempPassword(null);

    try {
      if (user) {
        // Update existing user (no password generation for updates)
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            nickname: formData.nickname || null,
            email: formData.email || null,
            role: role,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
        router.push('/users');
        router.refresh();
      } else {
        // Create new user with auth
        if (!formData.email) {
          setError('Email is required for creating new users');
          setLoading(false);
          return;
        }

        const result = await createUserWithAuth(formData.name, formData.email, passwordOption, role, formData.nickname || null);
        
        if (!result.success || result.error) {
          throw new Error(result.error || 'Failed to create user');
        }

        if (result.temporaryPassword) {
          setTempPassword(result.temporaryPassword);
          // Don't navigate yet - show the password
        } else {
          router.push('/users');
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  // Show temporary password if just created
  if (tempPassword) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            User Created Successfully!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mb-4">
            Please save this temporary password. The user will need to change it on first login.
          </p>
          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-300 dark:border-green-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temporary Password:
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-lg font-mono bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded border">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  alert('Password copied to clipboard!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setTempPassword(null);
              router.push('/users');
              router.refresh();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => {
              setTempPassword(null);
              setFormData({ name: '', email: '' });
            }}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter player name"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nickname
        </label>
        <input
          type="text"
          id="nickname"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter nickname (used in game displays)"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          This nickname will be used to display "Player1 vs Player2" in games. If not provided, full name will be used.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email {!user && <span className="text-red-500">*</span>}
        </label>
        <input
          type="email"
          id="email"
          required={!user}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter email address"
        />
        {!user && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Required for authentication. User will receive a temporary password.
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'super_admin' | 'player')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="player">Player</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {!user && (
        <div className="mb-6">
          <label htmlFor="passwordOption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Temporary Password Type
          </label>
          <select
            id="passwordOption"
            value={passwordOption}
            onChange={(e) => setPasswordOption(e.target.value as PasswordOption)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="random">Random Secure (Recommended)</option>
            <option value="simple">Simple Pattern (Temp1234!Pokemon)</option>
            <option value="name-based">Name-Based (John2024!123)</option>
            <option value="pattern">Pattern-Based (Poke2024!123)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select the type of temporary password to generate for this user.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {loading ? 'Saving...' : user ? 'Update Player' : 'Create Player'}
        </button>
        <Link
          href="/users"
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

