'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getDisplayName, formatLocalDate } from '@/lib/utils/display';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [isPlayer2, setIsPlayer2] = useState(false);
  
  // Player 1 state
  const [player1ImageFile, setPlayer1ImageFile] = useState<File | null>(null);
  const [player1ImagePreview, setPlayer1ImagePreview] = useState<string | null>(game.player1_result_image_url || null);
  const [player1DamagePoints, setPlayer1DamagePoints] = useState<string>(game.player1_damage_points?.toString() || '');
  const [player1WinnerSelection, setPlayer1WinnerSelection] = useState<string>(game.player1_winner_selection || '');
  
  // Player 2 state
  const [player2ImageFile, setPlayer2ImageFile] = useState<File | null>(null);
  const [player2ImagePreview, setPlayer2ImagePreview] = useState<string | null>(game.player2_result_image_url || null);
  const [player2DamagePoints, setPlayer2DamagePoints] = useState<string>(game.player2_damage_points?.toString() || '');
  const [player2WinnerSelection, setPlayer2WinnerSelection] = useState<string>(game.player2_winner_selection || '');

  const player1 = game.player1;
  const player2 = game.player2;

  // Check current user on mount
  useEffect(() => {
    async function checkCurrentUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();
        
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          setIsPlayer1(currentUser.id === game.player1_id);
          setIsPlayer2(currentUser.id === game.player2_id);
        }
      }
    }
    checkCurrentUser();
  }, [supabase, game.player1_id, game.player2_id]);

  const handleImageChange = (player: 'player1' | 'player2', e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      if (player === 'player1') {
        setPlayer1ImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPlayer1ImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPlayer2ImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPlayer2ImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImage = async (file: File, playerNumber: 'player1' | 'player2'): Promise<string | null> => {
    if (!file) return null;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${game.id}-${playerNumber}-${Date.now()}.${fileExt}`;
      const filePath = `game-results/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('game-results')
        .upload(filePath, file, {
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

    // Validate user is one of the players
    if (!currentUserId || (!isPlayer1 && !isPlayer2)) {
      setError('You must be one of the players in this game');
      setLoading(false);
      return;
    }

    try {
      const updateData: any = {};
      let player1ImageUrl: string | null = null;
      let player2ImageUrl: string | null = null;

      // Upload images if provided
      if (isPlayer1 && player1ImageFile) {
        player1ImageUrl = await uploadImage(player1ImageFile, 'player1');
        updateData.player1_result_image_url = player1ImageUrl;
      } else if (isPlayer1 && game.player1_result_image_url) {
        // Keep existing image if no new file
        updateData.player1_result_image_url = game.player1_result_image_url;
      }

      if (isPlayer2 && player2ImageFile) {
        player2ImageUrl = await uploadImage(player2ImageFile, 'player2');
        updateData.player2_result_image_url = player2ImageUrl;
      } else if (isPlayer2 && game.player2_result_image_url) {
        // Keep existing image if no new file
        updateData.player2_result_image_url = game.player2_result_image_url;
      }

      // Fetch current game state first to check completion requirements
      const { data: currentGame } = await supabase
        .from('games')
        .select('player1_result_image_url, player2_result_image_url, player1_damage_points, player2_damage_points, player1_winner_selection, player2_winner_selection')
        .eq('id', game.id)
        .single();

      // Check if both images will be present after this update
      const willHaveBothImages = (updateData.player1_result_image_url || currentGame?.player1_result_image_url) && 
                                  (updateData.player2_result_image_url || currentGame?.player2_result_image_url);

      // Parse and update damage points
      if (isPlayer1) {
        // If both images are/will be uploaded, damage points are required
        if (willHaveBothImages && player1DamagePoints.trim() === '' && !currentGame?.player1_damage_points) {
          setError('Damage points are required when both players have uploaded screenshots');
          setLoading(false);
          return;
        }
        const damagePointsNumber = player1DamagePoints.trim() === '' ? null : parseInt(player1DamagePoints, 10);
        if (damagePointsNumber !== null && (isNaN(damagePointsNumber) || damagePointsNumber < 0)) {
          setError('Damage points must be a valid non-negative number');
          setLoading(false);
          return;
        }
        // Use new value if provided, otherwise keep existing value, otherwise null
        updateData.player1_damage_points = damagePointsNumber !== null ? damagePointsNumber : (currentGame?.player1_damage_points ?? null);
      }

      if (isPlayer2) {
        // If both images are/will be uploaded, damage points are required
        if (willHaveBothImages && player2DamagePoints.trim() === '' && !currentGame?.player2_damage_points) {
          setError('Damage points are required when both players have uploaded screenshots');
          setLoading(false);
          return;
        }
        const damagePointsNumber = player2DamagePoints.trim() === '' ? null : parseInt(player2DamagePoints, 10);
        if (damagePointsNumber !== null && (isNaN(damagePointsNumber) || damagePointsNumber < 0)) {
          setError('Damage points must be a valid non-negative number');
          setLoading(false);
          return;
        }
        // Use new value if provided, otherwise keep existing value, otherwise null
        updateData.player2_damage_points = damagePointsNumber !== null ? damagePointsNumber : (currentGame?.player2_damage_points ?? null);
      }

      // Check if both damage points will be present
      const willHaveBothDamagePoints = (updateData.player1_damage_points !== undefined ? (updateData.player1_damage_points !== null) : (currentGame?.player1_damage_points !== null)) &&
                                       (updateData.player2_damage_points !== undefined ? (updateData.player2_damage_points !== null) : (currentGame?.player2_damage_points !== null));
      
      const willHaveAllRequired = willHaveBothImages && willHaveBothDamagePoints;

      // Handle winner selection
      if (isPlayer1) {
        // Validate winner selection is required when both images and damage points are present
        if (willHaveAllRequired && !player1WinnerSelection && !currentGame?.player1_winner_selection) {
          setError('Winner selection is required when both players have uploaded screenshots and damage points');
          setLoading(false);
          return;
        }
        if (player1WinnerSelection && player1WinnerSelection !== game.player1_id && player1WinnerSelection !== game.player2_id) {
          setError('Invalid winner selection');
          setLoading(false);
          return;
        }
        updateData.player1_winner_selection = player1WinnerSelection || currentGame?.player1_winner_selection || null;
      }

      if (isPlayer2) {
        // Validate winner selection is required when both images and damage points are present
        if (willHaveAllRequired && !player2WinnerSelection && !currentGame?.player2_winner_selection) {
          setError('Winner selection is required when both players have uploaded screenshots and damage points');
          setLoading(false);
          return;
        }
        if (player2WinnerSelection && player2WinnerSelection !== game.player1_id && player2WinnerSelection !== game.player2_id) {
          setError('Invalid winner selection');
          setLoading(false);
          return;
        }
        updateData.player2_winner_selection = player2WinnerSelection || currentGame?.player2_winner_selection || null;
      }

      const player1HasImage = updateData.player1_result_image_url || currentGame?.player1_result_image_url;
      const player2HasImage = updateData.player2_result_image_url || currentGame?.player2_result_image_url;
      const player1HasDamagePoints = updateData.player1_damage_points !== undefined ? (updateData.player1_damage_points !== null) : (currentGame?.player1_damage_points !== null && currentGame?.player1_damage_points !== undefined);
      const player2HasDamagePoints = updateData.player2_damage_points !== undefined ? (updateData.player2_damage_points !== null) : (currentGame?.player2_damage_points !== null && currentGame?.player2_damage_points !== undefined);
      const player1HasWinnerSelection = updateData.player1_winner_selection || currentGame?.player1_winner_selection;
      const player2HasWinnerSelection = updateData.player2_winner_selection || currentGame?.player2_winner_selection;

      // Check for winner mismatch - both players have selected but they don't match
      if (player1HasWinnerSelection && player2HasWinnerSelection) {
        const p1Selection = updateData.player1_winner_selection || currentGame?.player1_winner_selection;
        const p2Selection = updateData.player2_winner_selection || currentGame?.player2_winner_selection;
        
        if (p1Selection !== p2Selection) {
          setError('Winner Mismatch: Both players must select the same winner. Please coordinate and select the correct winner.');
          setLoading(false);
          return;
        }
      }

      // If both players have uploaded images, entered damage points, AND selected winner (and they match), mark as completed
      if (player1HasImage && player2HasImage && player1HasDamagePoints && player2HasDamagePoints && player1HasWinnerSelection && player2HasWinnerSelection) {
        // Use the winner selections (they should match now after validation)
        const selectedWinner = updateData.player1_winner_selection || currentGame?.player1_winner_selection;
        updateData.winner_id = selectedWinner;
        
        if (selectedWinner === game.player1_id) {
          updateData.player1_score = 1;
          updateData.player2_score = 0;
        } else if (selectedWinner === game.player2_id) {
          updateData.player1_score = 0;
          updateData.player2_score = 1;
        }
        
        updateData.status = 'completed';
      }

      // Update game
      const { error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', game.id);

      if (updateError) throw updateError;

      router.push(`/seasons/${seasonId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  // Show error if user is not one of the players
  if (currentUserId && !isPlayer1 && !isPlayer2) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          You are not authorized to save results for this game. Only the players in this game can upload their screenshots.
        </div>
        <Link
          href={`/seasons/${seasonId}`}
          className="inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Back to Season
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
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
          Date: {formatLocalDate(game.game_date)}
          {game.game_time && ` at ${new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Status: {(() => {
            const hasP1Image = game.player1_result_image_url;
            const hasP2Image = game.player2_result_image_url;
            const hasP1Damage = game.player1_damage_points !== null && game.player1_damage_points !== undefined;
            const hasP2Damage = game.player2_damage_points !== null && game.player2_damage_points !== undefined;
            const hasP1Winner = game.player1_winner_selection;
            const hasP2Winner = game.player2_winner_selection;
            
            // Check for winner mismatch
            if (hasP1Winner && hasP2Winner && game.player1_winner_selection !== game.player2_winner_selection) {
              return '⚠ Winner Mismatch - Players selected different winners';
            }
            
            if (hasP1Image && hasP2Image && hasP1Damage && hasP2Damage && hasP1Winner && hasP2Winner) {
              return '✓ Ready to complete - All information provided';
            }
            
            const missing = [];
            if (!hasP1Image) missing.push(`${getDisplayName(player1)} screenshot`);
            if (!hasP2Image) missing.push(`${getDisplayName(player2)} screenshot`);
            if (!hasP1Damage) missing.push(`${getDisplayName(player1)} damage points`);
            if (!hasP2Damage) missing.push(`${getDisplayName(player2)} damage points`);
            if (!hasP1Winner) missing.push(`${getDisplayName(player1)} winner selection`);
            if (!hasP2Winner) missing.push(`${getDisplayName(player2)} winner selection`);
            
            return `Waiting for: ${missing.join(', ')}`;
          })()}
        </p>
      </div>

      <div className="space-y-6">
        {/* Player 1 Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {getDisplayName(player1)}
            {isPlayer1 && <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">(You)</span>}
          </h4>
          
          {/* Image Upload - Only for Player 1 */}
          <div className="mb-4">
            <label htmlFor="player1_result_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Screenshot (Proof) {isPlayer1 && !game.player1_result_image_url && <span className="text-red-500">*</span>}
            </label>
            {isPlayer1 ? (
              <>
                <input
                  type="file"
                  id="player1_result_image"
                  accept="image/*"
                  onChange={(e) => handleImageChange('player1', e)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload a screenshot or photo of the game result as proof. Max 5MB. (PNG, JPG, etc.)
                </p>
                {player1ImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={player1ImagePreview}
                      alt="Player 1 result preview"
                      className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                {game.player1_result_image_url ? '✓ Screenshot uploaded' : 'Waiting for screenshot'}
              </div>
            )}
          </div>

          {/* Damage Points - Only for Player 1 */}
          {isPlayer1 && (
            <div className="mb-4">
              <label htmlFor="player1_damage_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Damage Points {!game.player1_damage_points && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                id="player1_damage_points"
                min="0"
                step="1"
                value={player1DamagePoints}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setPlayer1DamagePoints(value);
                  }
                }}
                placeholder="Enter your damage points"
                required={!game.player1_damage_points}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {game.player2_result_image_url 
                  ? 'Required: Enter your total damage points dealt in this game to complete the game.'
                  : 'Enter your total damage points dealt in this game (numbers only).'}
              </p>
            </div>
          )}

          {/* Winner Selection - Only for Player 1 */}
          {isPlayer1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Winner {!game.player1_winner_selection && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" style={{ borderColor: player1WinnerSelection === game.player1_id ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="player1_winner"
                    value={game.player1_id}
                    checked={player1WinnerSelection === game.player1_id}
                    onChange={(e) => setPlayer1WinnerSelection(e.target.value)}
                    className="mr-3 w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1 font-semibold text-gray-900 dark:text-white">{getDisplayName(player1)}</div>
                </label>
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" style={{ borderColor: player1WinnerSelection === game.player2_id ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="player1_winner"
                    value={game.player2_id}
                    checked={player1WinnerSelection === game.player2_id}
                    onChange={(e) => setPlayer1WinnerSelection(e.target.value)}
                    className="mr-3 w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1 font-semibold text-gray-900 dark:text-white">{getDisplayName(player2)}</div>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {game.player2_result_image_url && game.player2_damage_points !== null
                  ? 'Required: Select who won the game to complete the game.'
                  : 'Select who won this game.'}
              </p>
            </div>
          )}
        </div>

        {/* Player 2 Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {getDisplayName(player2)}
            {isPlayer2 && <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">(You)</span>}
          </h4>
          
          {/* Image Upload - Only for Player 2 */}
          <div className="mb-4">
            <label htmlFor="player2_result_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Screenshot (Proof) {isPlayer2 && !game.player2_result_image_url && <span className="text-red-500">*</span>}
            </label>
            {isPlayer2 ? (
              <>
                <input
                  type="file"
                  id="player2_result_image"
                  accept="image/*"
                  onChange={(e) => handleImageChange('player2', e)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload a screenshot or photo of the game result as proof. Max 5MB. (PNG, JPG, etc.)
                </p>
                {player2ImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={player2ImagePreview}
                      alt="Player 2 result preview"
                      className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                {game.player2_result_image_url ? '✓ Screenshot uploaded' : 'Waiting for screenshot'}
              </div>
            )}
          </div>

          {/* Damage Points - Only for Player 2 */}
          {isPlayer2 && (
            <div className="mb-4">
              <label htmlFor="player2_damage_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Damage Points {!game.player2_damage_points && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                id="player2_damage_points"
                min="0"
                step="1"
                value={player2DamagePoints}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setPlayer2DamagePoints(value);
                  }
                }}
                placeholder="Enter your damage points"
                required={!game.player2_damage_points}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {game.player1_result_image_url 
                  ? 'Required: Enter your total damage points dealt in this game to complete the game.'
                  : 'Enter your total damage points dealt in this game (numbers only).'}
              </p>
            </div>
          )}

          {/* Winner Selection - Only for Player 2 */}
          {isPlayer2 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Winner {!game.player2_winner_selection && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" style={{ borderColor: player2WinnerSelection === game.player1_id ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="player2_winner"
                    value={game.player1_id}
                    checked={player2WinnerSelection === game.player1_id}
                    onChange={(e) => setPlayer2WinnerSelection(e.target.value)}
                    className="mr-3 w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1 font-semibold text-gray-900 dark:text-white">{getDisplayName(player1)}</div>
                </label>
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" style={{ borderColor: player2WinnerSelection === game.player2_id ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="player2_winner"
                    value={game.player2_id}
                    checked={player2WinnerSelection === game.player2_id}
                    onChange={(e) => setPlayer2WinnerSelection(e.target.value)}
                    className="mr-3 w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1 font-semibold text-gray-900 dark:text-white">{getDisplayName(player2)}</div>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {game.player1_result_image_url && game.player1_damage_points !== null
                  ? 'Required: Select who won the game to complete the game.'
                  : 'Select who won this game.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
        <button
          type="submit"
          disabled={loading || uploading || (isPlayer1 && !player1ImageFile && !game.player1_result_image_url) || (isPlayer2 && !player2ImageFile && !game.player2_result_image_url)}
          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 sm:py-2 px-6 rounded-lg transition text-sm sm:text-base"
        >
          {loading || uploading ? 'Saving...' : (() => {
            // Check if game is ready to complete
            const hasP1Image = (isPlayer1 && (player1ImageFile || game.player1_result_image_url)) || (!isPlayer1 && game.player1_result_image_url);
            const hasP2Image = (isPlayer2 && (player2ImageFile || game.player2_result_image_url)) || (!isPlayer2 && game.player2_result_image_url);
            const hasP1Damage = (isPlayer1 && player1DamagePoints.trim() !== '') || (!isPlayer1 && game.player1_damage_points !== null);
            const hasP2Damage = (isPlayer2 && player2DamagePoints.trim() !== '') || (!isPlayer2 && game.player2_damage_points !== null);
            const hasP1Winner = (isPlayer1 && player1WinnerSelection) || (!isPlayer1 && game.player1_winner_selection);
            const hasP2Winner = (isPlayer2 && player2WinnerSelection) || (!isPlayer2 && game.player2_winner_selection);
            
            if (hasP1Image && hasP2Image && hasP1Damage && hasP2Damage && hasP1Winner && hasP2Winner) {
              return 'Save & Complete Game';
            }
            return 'Save My Results';
          })()}
        </button>
        <Link
          href={`/seasons/${seasonId}`}
          className="w-full sm:flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2.5 sm:py-2 px-6 rounded-lg transition text-center text-sm sm:text-base"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
