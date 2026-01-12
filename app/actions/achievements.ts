'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Update player deck type statistics after a game
 */
export async function updatePlayerDeckType(
  userId: string,
  deckType: string,
  won: boolean,
  seasonId: string
) {
  const supabase = await createClient();

  // Get or create deck type record
  const { data: existing } = await supabase
    .from('player_deck_types')
    .select('*')
    .eq('user_id', userId)
    .eq('deck_type', deckType)
    .eq('season_id', seasonId)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('player_deck_types')
      .update({
        wins: won ? existing.wins + 1 : existing.wins,
        losses: won ? existing.losses : existing.losses + 1,
        total_games: existing.total_games + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Create new record
    const { error } = await supabase
      .from('player_deck_types')
      .insert({
        user_id: userId,
        deck_type: deckType,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        total_games: 1,
        season_id: seasonId,
        is_active: false,
      });

    if (error) throw error;
  }
}

/**
 * Assign gym badge to the player with most wins for a specific type
 */
export async function assignGymBadges(seasonId: string) {
  const supabase = await createClient();

  // Get all deck types with wins
  const { data: deckTypes } = await supabase
    .from('player_deck_types')
    .select('user_id, deck_type, wins')
    .eq('season_id', seasonId)
    .gt('wins', 0)
    .order('wins', { ascending: false });

  if (!deckTypes) return;

  // Group by deck_type and find the player with most wins
  const leadersByType = new Map<string, { userId: string; wins: number }>();

  deckTypes.forEach((item) => {
    const existing = leadersByType.get(item.deck_type);
    if (!existing || item.wins > existing.wins) {
      leadersByType.set(item.deck_type, {
        userId: item.user_id,
        wins: item.wins,
      });
    }
  });

  // Get all badge types
  const { data: badges } = await supabase
    .from('gym_badges')
    .select('id, badge_type');

  if (!badges) return;

  // Assign badges
  const deckTypeKeys = Array.from(leadersByType.keys());
  for (const deckType of deckTypeKeys) {
    const leader = leadersByType.get(deckType);
    if (!leader) continue;

    const badge = badges.find((b) => b.badge_type === deckType);
    if (!badge) continue;

    // Remove badge from previous leader if exists
    await supabase
      .from('player_badges')
      .delete()
      .eq('badge_id', badge.id)
      .eq('season_id', seasonId);

    // Assign badge to new leader
    await supabase
      .from('player_badges')
      .upsert({
        user_id: leader.userId,
        badge_id: badge.id,
        season_id: seasonId,
        earned_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,badge_id,season_id',
      });
  }
}

/**
 * Check and assign pokeball achievements based on player stats
 */
export async function assignPokeballAchievements(userId: string, seasonId: string) {
  const supabase = await createClient();

  // Get player total stats
  const { data: deckTypes } = await supabase
    .from('player_deck_types')
    .select('wins, losses, total_games, deck_type')
    .eq('user_id', userId)
    .eq('season_id', seasonId);

  if (!deckTypes || deckTypes.length === 0) return;

  const totalWins = deckTypes.reduce((sum, dt) => sum + dt.wins, 0);
  const totalGames = deckTypes.reduce((sum, dt) => sum + dt.total_games, 0);
  const maxTypeWins = Math.max(...deckTypes.map((dt) => dt.wins), 0);

  // Get all players to determine total wins and rankings
  const { data: allGames } = await supabase
    .from('games')
    .select('player1_id, player2_id, winner_id, status')
    .eq('season_id', seasonId)
    .eq('status', 'completed');

  // Calculate total wins per user
  const totalWinsByUser = new Map<string, number>();
  if (allGames) {
    allGames.forEach((game: any) => {
      if (game.winner_id) {
        const currentWins = totalWinsByUser.get(game.winner_id) || 0;
        totalWinsByUser.set(game.winner_id, currentWins + 1);
      }
    });
  }

  // Find user with most total wins (master ball candidate)
  let maxWins = 0;
  let topPlayerId = '';
  totalWinsByUser.forEach((wins, uid) => {
    if (wins > maxWins) {
      maxWins = wins;
      topPlayerId = uid;
    }
  });

  const userTotalWins = totalWinsByUser.get(userId) || 0;
  const isTopPlayer = userId === topPlayerId && maxWins > 0;

  // Get recent games to calculate win streak
  const { data: games } = await supabase
    .from('games')
    .select('winner_id, game_date, status')
    .eq('season_id', seasonId)
    .eq('status', 'completed')
    .in('player1_id', [userId])
    .or(`player2_id.eq.${userId}`)
    .order('game_date', { ascending: false })
    .order('game_time', { ascending: false })
    .limit(10);

  let winStreak = 0;
  if (games) {
    for (const game of games) {
      if (game.winner_id === userId) {
        winStreak++;
      } else {
        break;
      }
    }
  }

  // Get all pokeball achievements
  const { data: pokeballs } = await supabase
    .from('pokeball_achievements')
    .select('*')
    .order('priority', { ascending: false });

  if (!pokeballs) return;

  // Check which achievements the player qualifies for
  const earnedPokeballs: string[] = [];

  for (const pokeball of pokeballs) {
    let qualifies = false;

    switch (pokeball.requirement_type) {
      case 'total_wins':
        qualifies = totalWins >= (pokeball.requirement_value || 0);
        break;
      case 'total_games':
        qualifies = totalGames >= (pokeball.requirement_value || 0);
        break;
      case 'win_streak':
        qualifies = winStreak >= (pokeball.requirement_value || 0);
        break;
      case 'type_wins':
        qualifies = maxTypeWins >= (pokeball.requirement_value || 0);
        break;
      case 'top_player':
        // Only master ball for top player with most total wins
        qualifies = isTopPlayer && pokeball.pokeball_type === 'master_ball' && userTotalWins >= 100;
        break;
    }

    if (qualifies) {
      earnedPokeballs.push(pokeball.id);

      // Assign pokeball
      await supabase
        .from('player_pokeballs')
        .upsert({
          user_id: userId,
          pokeball_id: pokeball.id,
          season_id: seasonId,
          earned_at: new Date().toISOString(),
          is_current: pokeball.pokeball_type === 'master_ball' ? isTopPlayer : false,
        }, {
          onConflict: 'user_id,pokeball_id,season_id',
        });
    }
  }

  // Set highest priority pokeball as current
  if (earnedPokeballs.length > 0) {
    const { data: playerPokeballs } = await supabase
      .from('player_pokeballs')
      .select('pokeball:pokeball_achievements!inner(priority)')
      .eq('user_id', userId)
      .eq('season_id', seasonId);

    if (playerPokeballs && playerPokeballs.length > 0) {
      const highestPriority = Math.max(
        ...playerPokeballs.map((pp: any) => pp.pokeball.priority)
      );

      // Update is_current for the highest priority pokeball
      const topPokeball = pokeballs.find(
        (p) => p.priority === highestPriority
      );

      if (topPokeball) {
        // Reset all to false
        await supabase
          .from('player_pokeballs')
          .update({ is_current: false })
          .eq('user_id', userId)
          .eq('season_id', seasonId);

        // Set top one to true
        await supabase
          .from('player_pokeballs')
          .update({ is_current: true })
          .eq('user_id', userId)
          .eq('pokeball_id', topPokeball.id)
          .eq('season_id', seasonId);
      }
    }
  }
}

/**
 * Process game completion and update all achievements
 */
export async function processGameCompletion(
  gameId: string,
  winnerId: string,
  player1Id: string,
  player2Id: string,
  player1DeckType: string | null,
  player2DeckType: string | null,
  seasonId: string
) {
  try {
    // Update deck types
    if (player1DeckType) {
      await updatePlayerDeckType(
        player1Id,
        player1DeckType,
        winnerId === player1Id,
        seasonId
      );
    }

    if (player2DeckType) {
      await updatePlayerDeckType(
        player2Id,
        player2DeckType,
        winnerId === player2Id,
        seasonId
      );
    }

    // Reassign gym badges
    await assignGymBadges(seasonId);

    // Update pokeball achievements for both players
    await assignPokeballAchievements(player1Id, seasonId);
    await assignPokeballAchievements(player2Id, seasonId);
  } catch (error) {
    console.error('Error processing game completion:', error);
    throw error;
  }
}

