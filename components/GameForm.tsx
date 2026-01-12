'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Game, User, Season } from '@/lib/types/database';
import { getDisplayName } from '@/lib/utils/display';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Copy, Check, Key, Calendar, Clock, Users, Shield, Trophy, FileText } from 'lucide-react';
import { POKEMON_TYPE_OPTIONS } from '@/lib/constants/pokemon-types';

// List of popular Pokemon names for password generation
const POKEMON_NAMES = [
  'Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew', 'Lucario',
  'Garchomp', 'Gengar', 'Snorlax', 'Dragonite', 'Tyranitar', 'Metagross',
  'Salamence', 'Rayquaza', 'Gyarados', 'Machamp', 'Alakazam', 'Golem',
  'Arcanine', 'Lapras', 'Vaporeon', 'Jolteon', 'Flareon', 'Espeon', 'Umbreon',
  'Leafeon', 'Glaceon', 'Sylveon', 'Gardevoir', 'Gallade', 'Garchomp', 'Scizor',
  'Typhlosion', 'Feraligatr', 'Meganium', 'Sceptile', 'Blaziken', 'Swampert',
  'Infernape', 'Empoleon', 'Torterra', 'Serperior', 'Emboar', 'Samurott',
  'Delphox', 'Chesnaught', 'Greninja', 'Decidueye', 'Incineroar', 'Primarina'
];

interface GameFormProps {
  game?: Game;
  seasonId?: string;
}

export default function GameForm({ game, seasonId }: GameFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [player1Code, setPlayer1Code] = useState<string>('');
  const [player2Code, setPlayer2Code] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Generate random 5-character alphanumeric code
  const generateGameCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Check if code is available (not in active games)
  const isCodeAvailable = async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('games')
      .select('id')
      .eq('game_code', code)
      .in('status', ['scheduled', 'completed'])
      .limit(1);
    
    if (error) {
      console.error('Error checking code availability:', error);
      return true; // Assume available if error
    }
    
    return !data || data.length === 0;
  };

  // Generate unique code
  const generateUniqueCode = async (): Promise<string> => {
    let code = generateGameCode();
    let attempts = 0;
    while (!(await isCodeAvailable(code)) && attempts < 10) {
      code = generateGameCode();
      attempts++;
    }
    return code;
  };

  // Generate password based on random Pokemon name
  const generatePokemonPassword = (): string => {
    const randomPokemon = POKEMON_NAMES[Math.floor(Math.random() * POKEMON_NAMES.length)];
    const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const specialChars = ['!', '@', '#', '$', '%'];
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Format: PokemonName1234!
    const password = `${randomPokemon}${randomNumber}${randomSpecial}`;
    return password;
  };

  // Handle password generation and copy to clipboard
  const handleGeneratePassword = async () => {
    const password = generatePokemonPassword();
    setGeneratedPassword(password);
    
    try {
      await navigator.clipboard.writeText(password);
      setPasswordCopied(true);
      setTimeout(() => {
        setPasswordCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
      setError('Failed to copy password to clipboard');
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async (code: string, player: 'player1' | 'player2') => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(player);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  
  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const defaultDate = getCurrentDate();

  const [formData, setFormData] = useState({
    season_id: game?.season_id || seasonId || '',
    player1_id: game?.player1_id || '',
    player2_id: game?.player2_id || '',
    player1_score: game?.player1_score || 0,
    player2_score: game?.player2_score || 0,
    game_date: game?.game_date || defaultDate,
    game_time: game?.game_time || '',
    status: game?.status || 'scheduled',
    notes: game?.notes || '',
    player1_deck_type: (game as any)?.player1_deck_type || '',
    player2_deck_type: (game as any)?.player2_deck_type || '',
  });

  useEffect(() => {
    async function fetchData() {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();
        
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          if (!game && !formData.player1_id) {
            setFormData(prev => ({ ...prev, player1_id: currentUser.id }));
          }
        }
      }

      const [usersResult, seasonsResult] = await Promise.all([
        supabase.from('users').select('*').order('name'),
        supabase.from('seasons').select('*').order('year', { ascending: false }),
      ]);

      if (usersResult.data) setUsers(usersResult.data);
      if (seasonsResult.data) setSeasons(seasonsResult.data);

      // Auto-select "Practice run" season if there isn't one
      if (!game && !seasonId && seasonsResult.data) {
        let practiceSeason = seasonsResult.data.find((s: Season) => 
          s.name.toLowerCase().includes('practice run') || s.name.toLowerCase() === 'practice run'
        );
        
        // If Practice run doesn't exist, try to create it
        if (!practiceSeason) {
          const currentYear = new Date().getFullYear();
          const { data: newSeason, error: createError } = await supabase
            .from('seasons')
            .insert({
              name: 'Practice run',
              year: currentYear,
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date(currentYear, 11, 31).toISOString().split('T')[0],
              status: 'active',
            })
            .select()
            .single();
          
          if (!createError && newSeason) {
            practiceSeason = newSeason;
            setSeasons(prev => [...(prev || []), newSeason]);
          }
        }
        
        // Fallback to active season if Practice run not found/created
        if (!practiceSeason) {
          const activeSeason = seasonsResult.data.find((s: Season) => s.status === 'active');
          if (activeSeason) {
            practiceSeason = activeSeason;
          }
        }
        
        if (practiceSeason) {
          setFormData(prev => ({ ...prev, season_id: practiceSeason.id }));
        }
      }

    }
    fetchData();
  }, [supabase, game, seasonId]);

  // Generate codes when both players are selected
  useEffect(() => {
    async function generateCodes() {
      if (!game && formData.player1_id && formData.player2_id) {
        if (!player1Code) {
          const code1 = await generateUniqueCode();
          setPlayer1Code(code1);
        }
        if (!player2Code) {
          const code2 = await generateUniqueCode();
          setPlayer2Code(code2);
        }
      }
    }
    generateCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.player1_id, formData.player2_id, game]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.player1_id === formData.player2_id) {
      setError('Players must be different');
      setLoading(false);
      return;
    }

    // For new games, always set status to 'scheduled'
    const finalStatus = game ? formData.status : 'scheduled';

    if (finalStatus === 'completed' && formData.player1_score === formData.player2_score) {
      setError('Scores cannot be equal in a completed game');
      setLoading(false);
      return;
    }

    try {
      // If completing a game and no time set, use current time
      let gameTime = formData.game_time;
      if (formData.status === 'completed' && !gameTime) {
        const now = new Date();
        gameTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      }

      const gameData: any = {
        season_id: formData.season_id,
        player1_id: formData.player1_id,
        player2_id: formData.player2_id,
        game_date: formData.game_date,
        game_time: gameTime || null,
        status: finalStatus,
        notes: formData.notes || null,
        player1_deck_type: formData.player1_deck_type || null,
        player2_deck_type: formData.player2_deck_type || null,
      };

      // For new games, set game_code (use player1_code as the main code)
      if (!game && player1Code) {
        gameData.game_code = player1Code;
      }

      if (finalStatus === 'completed') {
        gameData.player1_score = formData.player1_score;
        gameData.player2_score = formData.player2_score;
        gameData.winner_id = formData.player1_score > formData.player2_score 
          ? formData.player1_id 
          : formData.player2_id;
      } else {
        gameData.player1_score = 0;
        gameData.player2_score = 0;
      }

      let gameId: string | null = null;

      if (game) {
        const { data: updatedGame, error: updateError } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', game.id)
          .select('id')
          .single();
        if (updateError) throw updateError;
        gameId = updatedGame?.id || game.id;
      } else {
        const { data: newGame, error: insertError } = await supabase
          .from('games')
          .insert(gameData)
          .select('id')
          .single();
        if (insertError) throw insertError;
        gameId = newGame?.id || null;
      }

      // Process achievements if game is completed
      if (finalStatus === 'completed' && gameId && gameData.winner_id && formData.season_id) {
        try {
          const { processGameCompletion } = await import('@/app/actions/achievements');
          await processGameCompletion(
            gameId,
            gameData.winner_id,
            formData.player1_id,
            formData.player2_id,
            formData.player1_deck_type || null,
            formData.player2_deck_type || null,
            formData.season_id
          );
        } catch (achievementError) {
          console.error('Error processing achievements:', achievementError);
          // Don't fail the entire operation if achievements fail
        }
      }

      if (seasonId || formData.season_id) {
        router.push(`/seasons/${seasonId || formData.season_id}`);
      } else {
        router.push('/games');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const player1 = users.find(u => u.id === formData.player1_id);
  const player2 = users.find(u => u.id === formData.player2_id);
  const selectedSeason = seasons.find(s => s.id === formData.season_id);
  
  // Determine if current user is player1 or player2
  const isCurrentUserPlayer1 = currentUserId && currentUserId === formData.player1_id;
  const isCurrentUserPlayer2 = currentUserId && currentUserId === formData.player2_id;
  const isGameCompleted = formData.status === 'completed' || game?.status === 'completed';
  
  // Show deck type selector only for the current player if game is NOT completed
  // Show both deck types if game IS completed (but only allow editing own deck type)
  const shouldShowPlayer1DeckType = isCurrentUserPlayer1 || (isGameCompleted && formData.player1_id);
  const shouldShowPlayer2DeckType = isCurrentUserPlayer2 || (isGameCompleted && formData.player2_id);

  return (
    <main className="min-h-screen bg-background pt-20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {game ? 'Edit Game' : 'Pokemon Battle'}
          </h1>
          {seasonId && selectedSeason && (
            <Link
              href={`/seasons/${seasonId}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to {selectedSeason.name}
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
          {/* Status - Only show if editing existing game */}
          {game && (
            <Card className="p-6 border-2 border-red-300/30 bg-gradient-to-br from-red-100/50 to-red-200/30 dark:from-red-950/20 dark:to-red-900/10">
              <Label htmlFor="status" className="text-lg font-semibold mb-3 block text-center">
                Status
              </Label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium shadow-sm text-gray-900 dark:text-gray-100"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Card>
          )}

          {/* Trainers */}
          <Card className="p-6 border-2 border-red-300/30 bg-gradient-to-br from-red-100/50 to-red-200/30 dark:from-red-950/20 dark:to-red-900/10">
            <Label className="text-lg font-semibold mb-4 block text-center">
              Trainers
            </Label>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              {/* Trainer 1 */}
              <div className="flex-1 w-full sm:w-auto space-y-2">
                <Label htmlFor="player1_id" className="flex items-center justify-center gap-2 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    1
                  </div>
                  Trainer 1 {currentUserId === formData.player1_id && '(You)'}
                </Label>
                <select
                  id="player1_id"
                  required
                  value={formData.player1_id}
                  onChange={(e) => setFormData({ ...formData, player1_id: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer font-medium shadow-sm hover:shadow-md text-center text-gray-900 dark:text-gray-100"
                >
                  <option value="">Choose Trainer...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getDisplayName(user)} {currentUserId === user.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
                {/* Game Code for Trainer 1 */}
                {!game && formData.player1_id && player1Code && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(player1Code, 'player1')}
                    className="w-full gap-2 border-2 border-white dark:border-gray-300 bg-white hover:bg-gray-50 dark:bg-gray-100 dark:hover:bg-gray-200 text-gray-900 hover:text-gray-900 dark:text-gray-900"
                  >
                    {copiedCode === 'player1' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Code: {player1Code}
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Pokeball SVG */}
              <div className="flex-shrink-0 py-2">
                <svg width="50" height="50" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <circle cx="60" cy="60" r="60" fill="#FF0000"/>
                  <circle cx="60" cy="60" r="45" fill="#FFFFFF"/>
                  <rect x="15" y="60" width="90" height="5" fill="#000000"/>
                  <circle cx="60" cy="60" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3"/>
                  <circle cx="60" cy="60" r="8" fill="#000000"/>
                </svg>
              </div>

              {/* Trainer 2 */}
              <div className="flex-1 w-full sm:w-auto space-y-2">
                <Label htmlFor="player2_id" className="flex items-center justify-center gap-2 font-semibold">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    2
                  </div>
                  Trainer 2
                </Label>
                <select
                  id="player2_id"
                  required
                  value={formData.player2_id}
                  onChange={(e) => setFormData({ ...formData, player2_id: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer font-medium shadow-sm hover:shadow-md text-center text-gray-900 dark:text-gray-100"
                >
                  <option value="">Choose Trainer...</option>
                  {users
                    .filter(u => u.id !== formData.player1_id)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {getDisplayName(user)}
                      </option>
                    ))}
                </select>
                {/* Game Code for Trainer 2 */}
                {!game && formData.player2_id && player2Code && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(player2Code, 'player2')}
                    className="w-full gap-2 border-2 border-white dark:border-gray-300 bg-white hover:bg-gray-50 dark:bg-gray-100 dark:hover:bg-gray-200 text-gray-900 hover:text-gray-900 dark:text-gray-900"
                  >
                    {copiedCode === 'player2' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Code: {player2Code}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Match Details */}
          <Card className="p-6 border-2 border-red-300/30 bg-gradient-to-br from-red-100/50 to-red-200/30 dark:from-red-950/20 dark:to-red-900/10">
            <Label className="text-lg font-semibold mb-4 block text-center">
              Match Details
            </Label>
            <div className="space-y-4">
              {/* Deck Types */}
              <div className={`grid gap-4 ${shouldShowPlayer1DeckType && shouldShowPlayer2DeckType && isGameCompleted ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Trainer 1 Deck Type - Only visible if user is player1, or if game is completed */}
                {shouldShowPlayer1DeckType && (
                  <div className="space-y-2">
                    <Label htmlFor="player1_deck_type" className="flex items-center justify-center gap-2">
                      Trainer 1 Deck Type
                      {isGameCompleted && !isCurrentUserPlayer1 && formData.player1_deck_type && (
                        <span className="text-xs text-muted-foreground">(Locked)</span>
                      )}
                    </Label>
                  <select
                    id="player1_deck_type"
                    value={formData.player1_deck_type}
                    onChange={(e) => setFormData({ ...formData, player1_deck_type: e.target.value })}
                    disabled={isGameCompleted && !isCurrentUserPlayer1}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium shadow-sm hover:shadow-md cursor-pointer text-center text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <option value="">Select Deck Type</option>
                      {POKEMON_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    {isGameCompleted && !isCurrentUserPlayer1 && formData.player1_deck_type && (
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {formData.player1_deck_type.charAt(0).toUpperCase() + formData.player1_deck_type.slice(1)}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Trainer 2 Deck Type - Only visible if user is player2, or if game is completed */}
                {shouldShowPlayer2DeckType && (
                  <div className="space-y-2">
                    <Label htmlFor="player2_deck_type" className="flex items-center justify-center gap-2">
                      Trainer 2 Deck Type
                      {isGameCompleted && !isCurrentUserPlayer2 && formData.player2_deck_type && (
                        <span className="text-xs text-muted-foreground">(Locked)</span>
                      )}
                    </Label>
                  <select
                    id="player2_deck_type"
                    value={formData.player2_deck_type}
                    onChange={(e) => setFormData({ ...formData, player2_deck_type: e.target.value })}
                    disabled={isGameCompleted && !isCurrentUserPlayer2}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium shadow-sm hover:shadow-md cursor-pointer text-center text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <option value="">Select Deck Type</option>
                      {POKEMON_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    {isGameCompleted && !isCurrentUserPlayer2 && formData.player2_deck_type && (
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        {formData.player2_deck_type.charAt(0).toUpperCase() + formData.player2_deck_type.slice(1)}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Message for users who are not players and game is not completed */}
                {!shouldShowPlayer1DeckType && !shouldShowPlayer2DeckType && !isGameCompleted && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    {currentUserId ? 'Only trainers can select their deck type' : 'Select trainers to choose their deck types'}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-red-300/30 dark:border-red-700/30 my-4"></div>

              {/* Pokecode Generator */}
              <div className="space-y-3">
                <Label className="flex items-center justify-center gap-2 font-semibold">
                  Pokecode Generator
                </Label>
                <div className={`flex flex-col sm:flex-row gap-3 ${!generatedPassword ? 'justify-center' : ''}`}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    className={`gap-2 border-2 border-blue-500 dark:border-blue-400 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:text-white border-blue-600 dark:border-blue-700 ${!generatedPassword ? 'w-full sm:w-auto' : 'flex-1 sm:flex-none'}`}
                  >
                    <Key className="h-4 w-4" />
                    Generate Pokecode
                  </Button>
                  {generatedPassword && (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="font-mono text-sm border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-gray-900 dark:text-gray-100"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(generatedPassword);
                            setPasswordCopied(true);
                            setTimeout(() => {
                              setPasswordCopied(false);
                            }, 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className="shrink-0 border-2 border-green-500 dark:border-green-400 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white hover:text-white"
                      >
                        {passwordCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* General Info */}
          <Card className="p-6 border-2 border-red-300/30 bg-gradient-to-br from-red-100/50 to-red-200/30 dark:from-red-950/20 dark:to-red-900/10">
            <Label className="text-lg font-semibold mb-4 block text-center">
              General Info
            </Label>
            <div className="space-y-4">
              {/* Season */}
              {!seasonId && (
                <div className="space-y-2">
                  <Label htmlFor="season_id" className="flex items-center justify-center gap-2">
                    Season
                  </Label>
                  <select
                    id="season_id"
                    required
                    value={formData.season_id}
                    onChange={(e) => setFormData({ ...formData, season_id: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium shadow-sm hover:shadow-md cursor-pointer text-center text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Season</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.name} ({season.year})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game_date" className="flex items-center justify-center gap-2">
                    Date
                  </Label>
                  <Input
                    type="date"
                    id="game_date"
                    required
                    value={formData.game_date}
                    onChange={(e) => setFormData({ ...formData, game_date: e.target.value })}
                    onClick={(e) => {
                      // Open date picker on click anywhere in the input
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-red-500 focus:ring-red-500 shadow-sm hover:shadow-md text-center text-gray-900 dark:text-gray-100 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game_time" className="flex items-center justify-center gap-2">
                    Game Time
                  </Label>
                  <Input
                    type="time"
                    id="game_time"
                    value={formData.game_time}
                    onChange={(e) => setFormData({ ...formData, game_time: e.target.value })}
                    onClick={(e) => {
                      // Open time picker on click anywhere in the input
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-red-500 focus:ring-red-500 shadow-sm hover:shadow-md text-center text-gray-900 dark:text-gray-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-red-300/30 dark:border-red-700/30 my-4"></div>

              {/* Notes */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setNotesExpanded(!notesExpanded)}
                  className="w-full flex items-center justify-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
                >
                  <span>Notes</span>
                  {notesExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                {notesExpanded && (
                  <div className="mt-3">
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Additional notes..."
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Scores - Only if completed */}
          {formData.status === 'completed' && (
            <Card className="p-6 border-2 border-red-300/30 bg-gradient-to-br from-red-100/50 to-red-200/30 dark:from-red-950/20 dark:to-red-900/10">
              <Label className="text-lg font-semibold mb-4 block text-center">
                Match Scores
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player1_score" className="flex items-center justify-center gap-2 font-semibold">
                    Trainer 1 {player1 ? `(${getDisplayName(player1)})` : ''}
                  </Label>
                  <Input
                    type="number"
                    id="player1_score"
                    required
                    min="0"
                    value={formData.player1_score}
                    onChange={(e) => setFormData({ ...formData, player1_score: parseInt(e.target.value) || 0 })}
                    className="text-center text-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-red-500 focus:ring-red-500 font-bold shadow-sm hover:shadow-md text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player2_score" className="flex items-center justify-center gap-2 font-semibold">
                    Trainer 2 {player2 ? `(${getDisplayName(player2)})` : ''}
                  </Label>
                  <Input
                    type="number"
                    id="player2_score"
                    required
                    min="0"
                    value={formData.player2_score}
                    onChange={(e) => setFormData({ ...formData, player2_score: parseInt(e.target.value) || 0 })}
                    className="text-center text-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-red-500 focus:ring-red-500 font-bold shadow-sm hover:shadow-md text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 max-w-xs bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-blue-500 dark:border-blue-400"
            >
              {loading ? 'Saving...' : game ? 'Update' : 'Create Battle'}
            </Button>
            <Link
              href={seasonId || formData.season_id ? `/seasons/${seasonId || formData.season_id}` : '/games'}
              className="flex-1 max-w-xs"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-500 dark:border-gray-400 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white hover:text-white"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

