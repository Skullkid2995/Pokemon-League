'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDisplayName, formatLocalDate } from '@/lib/utils/display';
import { Trophy, Calendar, Clock } from 'lucide-react';

interface TodayBattleProps {
  battle: {
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
  };
}

export default function TodayBattleCard({ battle }: TodayBattleProps) {
  const winner = battle.winner_id === battle.player1_id ? battle.player1 : battle.player2;
  const loser = battle.winner_id === battle.player1_id ? battle.player2 : battle.player1;
  const isPlayer1Winner = battle.winner_id === battle.player1_id;
  const winnerDamage = isPlayer1Winner ? battle.player1_damage_points : battle.player2_damage_points;
  const winnerImage = isPlayer1Winner ? battle.player1_result_image_url : battle.player2_result_image_url;

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Today&apos;s Battle</h2>
      </div>

      <div className="space-y-4">
        {/* Date and Time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatLocalDate(battle.game_date)}</span>
          </div>
          {battle.game_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(`2000-01-01T${battle.game_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Winner Section */}
        <div className="bg-primary/10 rounded-lg p-4 border-2 border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase">Winner</span>
          </div>
          <div className="flex items-center gap-4">
            {winnerImage && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary shadow-lg flex-shrink-0">
                <img
                  src={winnerImage}
                  alt="Winner victory"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-primary">
                {battle.winner.nickname || battle.winner.name}
              </h3>
              {winnerDamage !== null && (
                <p className="text-sm text-muted-foreground">
                  {winnerDamage} damage points
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Players Matchup */}
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <div className="text-right">
            <p className="font-semibold text-foreground">
              {getDisplayName(battle.player1)}
            </p>
          </div>
          <span className="text-xl font-bold">VS</span>
          <div className="text-left">
            <p className="font-semibold text-foreground">
              {getDisplayName(battle.player2)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}



