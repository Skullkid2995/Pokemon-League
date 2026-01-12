import { createClient } from '@/lib/supabase/server';
import { getDisplayName } from '@/lib/utils/display';
import HomeContent from '@/components/home/HomeContent';

interface Player {
  id: string;
  name: string;
  nickname?: string | null;
  wins: number;
  losses: number;
  winPercentage: number;
  damagePoints?: number;
  rank: number;
}

interface Victory {
  id: string;
  playerName: string;
  playerNickname?: string | null;
  playerImage?: string | null;
  opponentName: string;
  opponentNickname?: string | null;
  damagePoints?: number;
  lives?: number;
  score?: number;
  gameDate: string;
  gameTime?: string | null;
  winnerImage?: string | null;
  gameType: 'pokemon' | 'smash';
}

export default async function Home() {
  const supabase = await createClient();

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  let currentUserId: string | null = null;
  let friendsIds: string[] = [];

  if (authUser) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();
    
    if (currentUser) {
      currentUserId = currentUser.id;
      
      // Get friends (both directions)
      const { data: friendships } = await supabase
        .from('user_friends')
        .select('friend_id')
        .eq('user_id', currentUserId)
        .eq('status', 'accepted');
      
      const { data: reverseFriendships } = await supabase
        .from('user_friends')
        .select('user_id')
        .eq('friend_id', currentUserId)
        .eq('status', 'accepted');
      
      const friendIdsSet = new Set<string>();
      friendships?.forEach(f => f.friend_id && friendIdsSet.add(f.friend_id));
      reverseFriendships?.forEach(f => f.user_id && friendIdsSet.add(f.user_id));
      friendsIds = Array.from(friendIdsSet);
    }
  }

  // Get active season - only select needed fields
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name, year, start_date, end_date, status')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  let pokemonPlayers: Player[] = [];
  let pokemonVictories: Victory[] = [];
  let pokemonPendingGames: any[] = [];
  let todayBattle: any = null;
  let gymLeaders: any[] = [];

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  if (activeSeason) {
    // Get completed games - optimize select to only needed fields
    const { data: games } = await supabase
      .from('games')
      .select(`
        id,
        player1_id,
        player2_id,
        winner_id,
        game_date,
        game_time,
        player1_damage_points,
        player2_damage_points,
        player1_result_image_url,
        player2_result_image_url,
        player1:users!games_player1_id_fkey(id, name, nickname),
        player2:users!games_player2_id_fkey(id, name, nickname),
        winner:users!games_winner_id_fkey(id, name, nickname)
      `)
      .eq('season_id', activeSeason.id)
      .eq('status', 'completed')
      .not('winner_id', 'is', null)
      .order('game_date', { ascending: false })
      .limit(100); // Limit for performance

    // Get today's battles and find the first one
    if (games && games.length > 0) {
      const todayGames = games.filter((game: any) => game.game_date === today);
      
      if (todayGames.length > 0) {
        // Sort by date (ascending) and time (ascending) to get the first battle
        todayBattle = todayGames
          .sort((a: any, b: any) => {
            // First compare by date (should be same, but just in case)
            if (a.game_date !== b.game_date) {
              return a.game_date.localeCompare(b.game_date);
            }
            // Then compare by time (earlier time first)
            const timeA = a.game_time || '00:00:00';
            const timeB = b.game_time || '00:00:00';
            return timeA.localeCompare(timeB);
          })[0];
      }
    }

    if (games && games.length > 0) {
      // Filter games: include games where current user plays against friends OR both players are friends
      const filteredGames = friendsIds.length > 0 
        ? games.filter((game: any) => {
            const involvesFriend = friendsIds.includes(game.player1_id) || friendsIds.includes(game.player2_id);
            const involvesCurrentUser = currentUserId && (game.player1_id === currentUserId || game.player2_id === currentUserId);
            // Include if it involves a friend AND (both are friends OR current user is involved)
            return involvesFriend && (friendsIds.includes(game.player1_id) && friendsIds.includes(game.player2_id) || involvesCurrentUser);
          })
        : [];

      // Calculate player statistics - include current user AND friends
      const playerStatsMap = new Map<string, any>();
      const gamesToProcess = friendsIds.length > 0 ? filteredGames : games;

      gamesToProcess.forEach((game: any) => {
        const player1Id = game.player1_id;
        const player2Id = game.player2_id;
        const winnerId = game.winner_id;

        // Include player1 if they are a friend OR the current user
        const shouldIncludePlayer1 = friendsIds.length === 0 || 
          friendsIds.includes(player1Id) || 
          (currentUserId && player1Id === currentUserId);
        
        if (shouldIncludePlayer1) {
          if (!playerStatsMap.has(player1Id)) {
            playerStatsMap.set(player1Id, {
              player_id: player1Id,
              player_name: getDisplayName(game.player1),
              player_nickname: game.player1?.nickname,
              wins: 0,
              losses: 0,
              total_games: 0,
              damage_points: 0,
            });
          }
        }

        // Include player2 if they are a friend OR the current user
        const shouldIncludePlayer2 = friendsIds.length === 0 || 
          friendsIds.includes(player2Id) || 
          (currentUserId && player2Id === currentUserId);
        
        if (shouldIncludePlayer2) {
          if (!playerStatsMap.has(player2Id)) {
            playerStatsMap.set(player2Id, {
              player_id: player2Id,
              player_name: getDisplayName(game.player2),
              player_nickname: game.player2?.nickname,
              wins: 0,
              losses: 0,
              total_games: 0,
              damage_points: 0,
            });
          }
        }

        // Count games where: 
        // - Both players are friends (current user not involved), OR
        // - Current user plays against a friend
        const bothAreFriends = friendsIds.length === 0 || 
          (friendsIds.includes(player1Id) && friendsIds.includes(player2Id));
        const currentUserVsFriend = currentUserId && 
          ((player1Id === currentUserId && friendsIds.includes(player2Id)) ||
           (player2Id === currentUserId && friendsIds.includes(player1Id)));

        if (bothAreFriends || currentUserVsFriend) {
          const player1Stats = playerStatsMap.get(player1Id);
          const player2Stats = playerStatsMap.get(player2Id);

          if (player1Stats) {
            player1Stats.total_games++;
            if (winnerId === player1Id) {
              player1Stats.wins++;
              player1Stats.damage_points += game.player1_damage_points || 0;
            } else {
              player1Stats.losses++;
              player1Stats.damage_points += game.player1_damage_points || 0;
            }
          }

          if (player2Stats) {
            player2Stats.total_games++;
            if (winnerId === player2Id) {
              player2Stats.wins++;
              player2Stats.damage_points += game.player2_damage_points || 0;
            } else {
              player2Stats.losses++;
              player2Stats.damage_points += game.player2_damage_points || 0;
            }
          }
        }
      });

      // Convert to rankings array (only show if user has friends)
      if (friendsIds.length > 0 && playerStatsMap.size > 0) {
        const rankings = Array.from(playerStatsMap.values())
          .map((stats) => ({
            ...stats,
            win_percentage: stats.total_games > 0 
              ? Math.round((stats.wins / stats.total_games) * 100) 
              : 0,
          }))
          .sort((a, b) => {
            if (b.wins !== a.wins) {
              return b.wins - a.wins;
            }
            if (b.win_percentage !== a.win_percentage) {
              return b.win_percentage - a.win_percentage;
            }
            return b.damage_points - a.damage_points;
          })
          .slice(0, 3); // Top 3

        // Format players for component
        pokemonPlayers = rankings.map((player, index) => ({
          id: player.player_id,
          name: player.player_name,
          nickname: player.player_nickname,
          wins: player.wins,
          losses: player.losses,
          winPercentage: player.win_percentage,
          damagePoints: player.damage_points,
          rank: index + 1,
        }));
      }

      // Get recent victories - filter by friends and show last 15, newest first
      const victoriesGames = friendsIds.length > 0 ? filteredGames : games;
      const recentGames = victoriesGames
        .sort((a: any, b: any) => {
          // Sort by date (newest first)
          if (a.game_date !== b.game_date) {
            return b.game_date.localeCompare(a.game_date);
          }
          // Then by time (newest first)
          const timeA = a.game_time || '00:00:00';
          const timeB = b.game_time || '00:00:00';
          return timeB.localeCompare(timeA);
        })
        .slice(0, 15); // Last 15 games

      pokemonVictories = recentGames.map((game: any) => {
        const winner = game.winner_id === game.player1_id ? game.player1 : game.player2;
        const loser = game.winner_id === game.player1_id ? game.player2 : game.player1;
        const isPlayer1Winner = game.winner_id === game.player1_id;
        const winnerImage = isPlayer1Winner 
          ? game.player1_result_image_url 
          : game.player2_result_image_url;
        
        return {
          id: game.id,
          playerName: getDisplayName(winner),
          playerNickname: winner?.nickname,
          playerImage: null,
          opponentName: getDisplayName(loser),
          opponentNickname: loser?.nickname,
          damagePoints: isPlayer1Winner 
            ? game.player1_damage_points 
            : game.player2_damage_points,
          gameDate: game.game_date,
          gameTime: game.game_time,
          winnerImage: winnerImage || null,
          gameType: 'pokemon' as const,
        };
      });
    }

    // Get pending games (scheduled games) - filter by friends if user has friends
    if (currentUserId && activeSeason) {
      const allFriendIds = friendsIds.length > 0 ? [...friendsIds, currentUserId] : [];
      
      const { data: pendingGames } = await supabase
        .from('games')
        .select(`
          id,
          player1_id,
          player2_id,
          game_date,
          game_time,
          status,
          player1:users!games_player1_id_fkey(id, name, nickname, avatar_url),
          player2:users!games_player2_id_fkey(id, name, nickname, avatar_url)
        `)
        .eq('season_id', activeSeason.id)
        .eq('status', 'scheduled')
        .order('game_date', { ascending: true })
        .order('game_time', { ascending: true, nullsFirst: false })
        .limit(20);

      if (pendingGames) {
        const filteredPending = friendsIds.length > 0
          ? pendingGames.filter((game: any) => 
              allFriendIds.includes(game.player1_id) || allFriendIds.includes(game.player2_id)
            )
          : pendingGames.filter((game: any) => 
              game.player1_id === currentUserId || game.player2_id === currentUserId
            );

        // Sort by date (ascending - soonest first), then by time (ascending)
        const sortedPending = [...filteredPending].sort((a: any, b: any) => {
          if (a.game_date !== b.game_date) {
            return a.game_date.localeCompare(b.game_date);
          }
          const timeA = a.game_time || '23:59:59';
          const timeB = b.game_time || '23:59:59';
          return timeA.localeCompare(timeB);
        });

        pokemonPendingGames = sortedPending.map((game: any) => ({
          id: game.id,
          seasonId: activeSeason.id,
          player1: {
            id: game.player1.id,
            name: getDisplayName(game.player1),
            nickname: game.player1?.nickname,
            avatarUrl: game.player1?.avatar_url,
          },
          player2: {
            id: game.player2.id,
            name: getDisplayName(game.player2),
            nickname: game.player2?.nickname,
            avatarUrl: game.player2?.avatar_url,
          },
          gameDate: game.game_date,
          gameTime: game.game_time,
          isCurrentUser: currentUserId === game.player1_id || currentUserId === game.player2_id,
        }));
      }
    }

    // Get gym leaders (top player per deck type with badges)
    const { data: deckTypesData } = await supabase
      .from('player_deck_types')
      .select(`
        id,
        user_id,
        deck_type,
        wins,
        losses,
        user:users!player_deck_types_user_id_fkey(id, name, nickname, avatar_url)
      `)
      .eq('season_id', activeSeason.id)
      .order('wins', { ascending: false });

    // Get player badges to check who has which badges
    const { data: playerBadges } = await supabase
      .from('player_badges')
      .select(`
        user_id,
        badge:gym_badges!inner(badge_type)
      `)
      .eq('season_id', activeSeason.id);

    const badgesByUser = new Map<string, Set<string>>();
    if (playerBadges) {
      playerBadges.forEach((pb: any) => {
        if (!badgesByUser.has(pb.user_id)) {
          badgesByUser.set(pb.user_id, new Set());
        }
        badgesByUser.get(pb.user_id)?.add(pb.badge.badge_type);
      });
    }

    if (deckTypesData) {
      // Group by deck_type and get top player for each
      const leadersByType = new Map<string, any>();
      
      deckTypesData.forEach((item: any) => {
        const existing = leadersByType.get(item.deck_type);
        if (!existing || item.wins > existing.wins) {
          const userBadges = badgesByUser.get(item.user_id) || new Set();
          leadersByType.set(item.deck_type, {
            id: item.id,
            userId: item.user_id,
            playerName: item.user.name,
            playerNickname: item.user.nickname,
            avatarUrl: item.user.avatar_url,
            deckType: item.deck_type,
            wins: item.wins,
            losses: item.losses,
            hasBadge: userBadges.has(item.deck_type),
          });
        }
      });

      gymLeaders = Array.from(leadersByType.values())
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 18); // Top 18 (one per type)
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <HomeContent 
          initialPokemonPlayers={pokemonPlayers}
          initialPokemonVictories={pokemonVictories}
          initialPokemonPendingGames={pokemonPendingGames}
          todayBattle={todayBattle}
          gymLeaders={gymLeaders}
        />
      </div>
    </main>
  );
}
