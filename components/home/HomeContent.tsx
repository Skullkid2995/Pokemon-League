'use client';

import { useState, useEffect } from 'react';
import TopPlayersCard from './TopPlayersCard';
import RecentVictoriesBar from './RecentVictoriesBar';
import TodayBattleCard from './TodayBattleCard';
import GymLeadersCard from './GymLeadersCard';
import PendingGamesCard from './PendingGamesCard';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useGame } from '@/components/layout/GameSelectorDropdown';

type GameType = 'pokemon' | 'smash';

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

interface TodayBattle {
  id: string;
  player1: { id: string; name: string; nickname?: string | null };
  player2: { id: string; name: string; nickname?: string | null };
  winner: { id: string; name: string; nickname?: string | null };
  winner_id: string;
  player1_id: string;
  player2_id: string;
  game_date: string;
  game_time: string | null;
  player1_damage_points: number | null;
  player2_damage_points: number | null;
  player1_result_image_url: string | null;
  player2_result_image_url: string | null;
}

interface GymLeader {
  id: string;
  userId: string;
  playerName: string;
  playerNickname?: string | null;
  avatarUrl?: string | null;
  deckType: string;
  wins: number;
  losses: number;
}

interface PendingGame {
  id: string;
  seasonId: string;
  player1: { id: string; name: string; nickname?: string | null; avatarUrl?: string | null };
  player2: { id: string; name: string; nickname?: string | null; avatarUrl?: string | null };
  gameDate: string;
  gameTime?: string | null;
  isCurrentUser: boolean;
}

interface HomeContentProps {
  initialPokemonPlayers: Player[];
  initialPokemonVictories: Victory[];
  initialPokemonPendingGames?: PendingGame[];
  todayBattle: TodayBattle | null;
  gymLeaders: GymLeader[];
}

export default function HomeContent({ 
  initialPokemonPlayers, 
  initialPokemonVictories,
  initialPokemonPendingGames = [],
  todayBattle,
  gymLeaders
}: HomeContentProps) {
  const { selectedGame } = useGame();
  const [players, setPlayers] = useState<Player[]>(initialPokemonPlayers);
  const [victories, setVictories] = useState<Victory[]>(initialPokemonVictories);
  const [pendingGames, setPendingGames] = useState<PendingGame[]>(initialPokemonPendingGames);

  useEffect(() => {
    if (selectedGame === 'smash') {
      // Datos de ejemplo para Smash Ultimate
      setPlayers([
        {
          id: 'smash-1',
          name: 'Ejemplo Player 1',
          nickname: 'SmashMaster',
          wins: 15,
          losses: 2,
          winPercentage: 88,
          rank: 1,
        },
        {
          id: 'smash-2',
          name: 'Ejemplo Player 2',
          nickname: 'ComboKing',
          wins: 12,
          losses: 5,
          winPercentage: 71,
          rank: 2,
        },
        {
          id: 'smash-3',
          name: 'Ejemplo Player 3',
          nickname: 'FinalSmash',
          wins: 10,
          losses: 7,
          winPercentage: 59,
          rank: 3,
        },
      ]);
      setVictories([
        {
          id: 'smash-v-1',
          playerName: 'SmashMaster',
          playerNickname: 'SmashMaster',
          opponentName: 'ComboKing',
          opponentNickname: 'ComboKing',
          score: 3,
          lives: 2,
          gameDate: new Date().toISOString(),
          gameType: 'smash',
        },
      ]);
    } else {
      setPlayers(initialPokemonPlayers);
      setVictories(initialPokemonVictories);
    }
  }, [selectedGame, initialPokemonPlayers, initialPokemonVictories]);

  return (
    <div className="space-y-8">
      <AnimatedContainer direction="up" delay={0.1}>
        <RecentVictoriesBar victories={victories} />
      </AnimatedContainer>

      {/* Top Players - Only show if there are players (i.e., user has friends) */}
      {players.length > 0 && (
        <AnimatedContainer direction="up" delay={0.125}>
          <TopPlayersCard players={players} gameType={selectedGame} />
        </AnimatedContainer>
      )}

      {/* Pending Games - Only show for Pokemon and if there are pending games */}
      {selectedGame === 'pokemon' && pendingGames.length > 0 && (
        <AnimatedContainer direction="up" delay={0.15}>
          <PendingGamesCard games={pendingGames} />
        </AnimatedContainer>
      )}

      {/* Today's Battle - Only show for Pokemon and if battle exists */}
      {selectedGame === 'pokemon' && todayBattle && (
        <AnimatedContainer direction="up" delay={0.175}>
          <TodayBattleCard battle={todayBattle} />
        </AnimatedContainer>
      )}

      {/* Gym Leaders Section - Only for Pokemon */}
      {selectedGame === 'pokemon' && (
        <AnimatedContainer direction="up" delay={0.2}>
          <GymLeadersCard leaders={gymLeaders} />
        </AnimatedContainer>
      )}
    </div>
  );
}
