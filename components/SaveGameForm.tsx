'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getDisplayName } from '@/lib/utils/display';

interface SaveGameFormProps {
  game: any; // Game with player1 and player2
  seasonId: string;
}

export default function SaveGameForm({ game, seasonId }: SaveGameFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [winnerId, setWinnerId] = useState<string>(game.winner_id || '');
  const [damagePoints, setDamagePoints] = useState<string>(game.damage_points?.toString() || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(game.result_image_url || null);

  const player1 = game.player1;
  const player2 = game.player2;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return game.result_image_url || null;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${game.id}-${Date.now()}.${fileExt}`;
      const filePath = `game-results/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('game-results')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('game-results')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate winner selection
    if (!winnerId) {
      setError('Please select a winner');
      setLoading(false);
      return;
    }

    if (winnerId !== game.player1_id && winnerId !== game.player2_id) {
      setError('Invalid winner selection');
      setLoading(false);
      return;
    }

    try {
      // Upload image if provided
      let imageUrl = game.result_image_url || null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Parse damage points (convert to number or null)
      const damagePointsNumber = damagePoints.trim() === '' ? null : parseInt(damagePoints, 10);
      
      if (damagePointsNumber !== null && (isNaN(damagePointsNumber) || damagePointsNumber < 0)) {
        setError('Damage points must be a valid non-negative number');
        setLoading(false);
        return;
      }

      // Update game
      const { error: updateError } = await supabase
        .from('games')
        .update({
          winner_id: winnerId,
          result_image_url: imageUrl,
          damage_points: damagePointsNumber,
          status: 'completed',
          // Set scores to 1 for winner, 0 for loser (for compatibility)
          player1_score: winnerId === game.player1_id ? 1 : 0,
          player2_score: winnerId === game.player2_id ? 1 : 0,
        })
        .eq('id', game.id);

      if (updateError) throw updateError;

      router.push(`/seasons/${seasonId}`);
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

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Game Details</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getDisplayName(player1)} vs {getDisplayName(player2)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Date: {new Date(game.game_date).toLocaleDateString()}
          {game.game_time && ` at ${new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Winner <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <div>
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" style={{ borderColor: winnerId === game.player1_id ? '#3b82f6' : '#e5e7eb' }}>
              <input
                type="radio"
                name="winner"
                value={game.player1_id}
                checked={winnerId === game.player1_id}
                onChange={(e) => setWinnerId(e.target.value)}
                className="mr-3 w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{getDisplayName(player1)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{player1?.name}</div>
              </div>
              {winnerId === game.player1_id && (
                <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
                  Winner
                </span>
              )}
            </label>
            {winnerId === game.player1_id && (
              <div className="mt-3 ml-12">
                <label htmlFor="damage_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Damage Points
                </label>
                <input
                  type="number"
                  id="damage_points"
                  min="0"
                  step="1"
                  value={damagePoints}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numeric input
                    if (value === '' || /^\d+$/.test(value)) {
                      setDamagePoints(value);
                    }
                  }}
                  placeholder="Enter damage points"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional: Enter the total damage points dealt in this game (numbers only).
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" style={{ borderColor: winnerId === game.player2_id ? '#3b82f6' : '#e5e7eb' }}>
              <input
                type="radio"
                name="winner"
                value={game.player2_id}
                checked={winnerId === game.player2_id}
                onChange={(e) => setWinnerId(e.target.value)}
                className="mr-3 w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{getDisplayName(player2)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{player2?.name}</div>
              </div>
              {winnerId === game.player2_id && (
                <span className="ml-3 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
                  Winner
                </span>
              )}
            </label>
            {winnerId === game.player2_id && (
              <div className="mt-3 ml-12">
                <label htmlFor="damage_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Damage Points
                </label>
                <input
                  type="number"
                  id="damage_points"
                  min="0"
                  step="1"
                  value={damagePoints}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numeric input
                    if (value === '' || /^\d+$/.test(value)) {
                      setDamagePoints(value);
                    }
                  }}
                  placeholder="Enter damage points"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional: Enter the total damage points dealt in this game (numbers only).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="result_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Result Image (Proof) <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          id="result_image"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Upload a screenshot or photo of the game result as proof. Max 5MB. (PNG, JPG, etc.)
        </p>
        {imagePreview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
            <img
              src={imagePreview}
              alt="Result preview"
              className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploading || !winnerId || !imageFile}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {loading || uploading ? 'Saving...' : 'Save Game Result'}
        </button>
        <Link
          href={`/seasons/${seasonId}`}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
