'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getDisplayName } from '@/lib/utils/display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Check, X, Trophy, Shield, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
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
        
        // Always update if player has entered a value (even if it's 0)
        if (player1DamagePoints.trim() !== '') {
          const damagePointsNumber = parseInt(player1DamagePoints, 10);
          if (isNaN(damagePointsNumber) || damagePointsNumber < 0) {
            setError('Damage points must be a valid non-negative number');
            setLoading(false);
            return;
          }
          updateData.player1_damage_points = damagePointsNumber;
        } else if (currentGame?.player1_damage_points !== undefined && currentGame?.player1_damage_points !== null) {
          // Keep existing value if user didn't change it
          updateData.player1_damage_points = currentGame.player1_damage_points;
        }
      }

      if (isPlayer2) {
        // If both images are/will be uploaded, damage points are required
        if (willHaveBothImages && player2DamagePoints.trim() === '' && !currentGame?.player2_damage_points) {
          setError('Damage points are required when both players have uploaded screenshots');
          setLoading(false);
          return;
        }
        
        // Always update if player has entered a value (even if it's 0)
        if (player2DamagePoints.trim() !== '') {
          const damagePointsNumber = parseInt(player2DamagePoints, 10);
          if (isNaN(damagePointsNumber) || damagePointsNumber < 0) {
            setError('Damage points must be a valid non-negative number');
            setLoading(false);
            return;
          }
          updateData.player2_damage_points = damagePointsNumber;
        } else if (currentGame?.player2_damage_points !== undefined && currentGame?.player2_damage_points !== null) {
          // Keep existing value if user didn't change it
          updateData.player2_damage_points = currentGame.player2_damage_points;
        }
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
      const { data: updatedGame, error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', game.id)
        .select('player1_deck_type, player2_deck_type, winner_id')
        .single();

      if (updateError) throw updateError;

      // Process achievements if game was completed
      if (updateData.status === 'completed' && updatedGame?.winner_id) {
        try {
          const { processGameCompletion } = await import('@/app/actions/achievements');
          await processGameCompletion(
            game.id,
            updatedGame.winner_id,
            game.player1_id,
            game.player2_id,
            updatedGame.player1_deck_type,
            updatedGame.player2_deck_type,
            seasonId
          );
        } catch (achievementError) {
          console.error('Error processing achievements:', achievementError);
          // Don't fail the entire operation if achievements fail
        }
      }

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

  // Get opponent's data
  const opponent = isPlayer1 ? player2 : player1;
  const opponentImage = isPlayer1 ? game.player2_result_image_url : game.player1_result_image_url;
  const opponentWinnerSelection = isPlayer1 ? game.player2_winner_selection : game.player1_winner_selection;
  const opponentDamagePoints = isPlayer1 ? game.player2_damage_points : game.player1_damage_points;
  const myImage = isPlayer1 ? player1ImagePreview : player2ImagePreview;
  const myImageUrl = isPlayer1 ? game.player1_result_image_url : game.player2_result_image_url;
  const myWinnerSelection = isPlayer1 ? player1WinnerSelection : player2WinnerSelection;
  const myDamagePoints = isPlayer1 ? player1DamagePoints : player2DamagePoints;
  
  // Determine who opponent selected as winner
  const opponentSelectedWinner = opponentWinnerSelection 
    ? (opponentWinnerSelection === game.player1_id ? player1 : player2)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Screenshots Comparison - Side by Side */}
      <Card className="p-6">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-center">
          {getDisplayName(player1)} <span className="text-muted-foreground">vs</span> {getDisplayName(player2)}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Your Screenshot */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Your Screenshot
            </h3>
            
            {/* Upload Button - Thematic and Compact */}
            {(isPlayer1 || isPlayer2) ? (
              <label className="block">
                <input
                  type="file"
                  id={isPlayer1 ? "player1_result_image" : "player2_result_image"}
                  accept="image/*"
                  onChange={(e) => handleImageChange(isPlayer1 ? 'player1' : 'player2', e)}
                  className="hidden"
                />
                <div className="relative">
                  {(isPlayer1 ? (player1ImagePreview || game.player1_result_image_url) : (player2ImagePreview || game.player2_result_image_url)) ? (
                    <div className="relative group">
                      <img
                        src={isPlayer1 ? (player1ImagePreview || game.player1_result_image_url || '') : (player2ImagePreview || game.player2_result_image_url || '')}
                        alt="Your screenshot"
                        className="w-full h-64 object-cover rounded-lg border-2 border-primary shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(isPlayer1 ? (player1ImagePreview || game.player1_result_image_url || '') : (player2ImagePreview || game.player2_result_image_url || ''))}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            document.getElementById(isPlayer1 ? 'player1_result_image' : 'player2_result_image')?.click();
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById(isPlayer1 ? 'player1_result_image' : 'player2_result_image')?.click()}
                      className="w-full h-64 border-2 border-dashed border-primary/50 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                      {/* Pokeball Icon */}
                      <div className="relative">
                        <svg width="60" height="60" viewBox="0 0 120 120" fill="none" className="opacity-60 group-hover:opacity-100 transition-opacity">
                          <circle cx="60" cy="60" r="60" fill="#FF0000"/>
                          <circle cx="60" cy="60" r="45" fill="#FFFFFF"/>
                          <rect x="15" y="60" width="90" height="5" fill="#000000"/>
                          <circle cx="60" cy="60" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3"/>
                          <circle cx="60" cy="60" r="8" fill="#000000"/>
                        </svg>
                        <Upload className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-primary">Upload Screenshot</span>
                      <span className="text-xs text-muted-foreground">Max 5MB</span>
                    </button>
                  )}
                </div>
              </label>
            ) : null}

            {/* Your Damage Points - Compact and Thematic */}
            {(isPlayer1 || isPlayer2) && (
              <div className="space-y-2">
                <label htmlFor={isPlayer1 ? "player1_damage_points" : "player2_damage_points"} className="block text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Damage Points {!game[isPlayer1 ? 'player1_damage_points' : 'player2_damage_points'] && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id={isPlayer1 ? "player1_damage_points" : "player2_damage_points"}
                    min="0"
                    step="1"
                    value={myDamagePoints}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        if (isPlayer1) setPlayer1DamagePoints(value);
                        else setPlayer2DamagePoints(value);
                      }
                    }}
                    placeholder="0"
                    required={!game[isPlayer1 ? 'player1_damage_points' : 'player2_damage_points']}
                    className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-primary/30 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">HP</div>
                </div>
              </div>
            )}

            {/* Your Winner Selection */}
            {(isPlayer1 || isPlayer2) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Select Winner {!game[isPlayer1 ? 'player1_winner_selection' : 'player2_winner_selection'] && <span className="text-red-500">*</span>}
                </label>
                <div className="flex justify-center gap-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlayer1) setPlayer1WinnerSelection(game.player1_id);
                      else setPlayer2WinnerSelection(game.player1_id);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all flex-1 ${
                      (isPlayer1 ? player1WinnerSelection : player2WinnerSelection) === game.player1_id
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-center">{getDisplayName(player1)}</div>
                    {(isPlayer1 ? player1WinnerSelection : player2WinnerSelection) === game.player1_id && (
                      <Check className="h-5 w-5 mx-auto mt-2 text-primary" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlayer1) setPlayer1WinnerSelection(game.player2_id);
                      else setPlayer2WinnerSelection(game.player2_id);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all flex-1 ${
                      (isPlayer1 ? player1WinnerSelection : player2WinnerSelection) === game.player2_id
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-center">{getDisplayName(player2)}</div>
                    {(isPlayer1 ? player1WinnerSelection : player2WinnerSelection) === game.player2_id && (
                      <Check className="h-5 w-5 mx-auto mt-2 text-primary" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Opponent Screenshot */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              {getDisplayName(opponent)}&apos;s Screenshot
            </h3>
            
            <div className="relative">
              {opponentImage ? (
                <div className="relative">
                  <img
                    src={opponentImage}
                    alt={`${getDisplayName(opponent)}'s screenshot`}
                    className="w-full h-64 object-cover rounded-lg border-2 border-border shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(opponentImage)}
                  />
                  {/* Opponent's Winner Selection Indicator */}
                  {opponentSelectedWinner && (
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg border-2 border-yellow-400 z-10">
                      <div className="flex flex-col items-center gap-1">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="text-xs font-bold text-center">Selected:</span>
                        <span className="text-xs font-semibold text-center">{getDisplayName(opponentSelectedWinner)}</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                    <Check className="h-3 w-3" />
                    Uploaded
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 border-2 border-dashed border-border rounded-lg bg-muted/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2 opacity-50">⏳</div>
                    <p className="text-sm text-muted-foreground font-medium">Waiting for upload</p>
                  </div>
                </div>
              )}

              {/* Opponent's Damage Points Display */}
              {opponentDamagePoints !== null && opponentDamagePoints !== undefined && (
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Damage Points:
                    </span>
                    <span className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{opponentDamagePoints} HP</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          disabled={loading || uploading || (isPlayer1 && !player1ImageFile && !game.player1_result_image_url) || (isPlayer2 && !player2ImageFile && !game.player2_result_image_url)}
          className="flex-1"
          size="lg"
        >
          {loading || uploading ? 'Saving...' : (() => {
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
        </Button>
        <Link href={`/seasons/${seasonId}`} className="flex-1">
          <Button type="button" variant="outline" className="w-full" size="lg">
            Cancel
          </Button>
        </Link>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-transparent border-none shadow-none">
          <div className="relative flex items-center justify-center p-2">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Screenshot preview"
                className="max-h-[90vh] max-w-[90vw] w-auto h-auto rounded-lg shadow-2xl object-contain"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white rounded-full z-10 h-8 w-8"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
