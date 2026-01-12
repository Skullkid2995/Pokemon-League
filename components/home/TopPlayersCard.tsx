import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface TopPlayersCardProps {
  players: Player[];
  gameType: 'pokemon' | 'smash';
}

export default function TopPlayersCard({ players, gameType }: TopPlayersCardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-200 to-yellow-100 border-yellow-300';
      case 2: return 'from-gray-200 to-gray-100 border-gray-300';
      case 3: return 'from-amber-200 to-amber-100 border-amber-300';
      default: return 'bg-card border-border';
    }
  };

  if (players.length === 0) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl">Top Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.slice(0, 3).map((player) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 bg-gradient-to-r transition-all hover:scale-[1.02]",
                getRankColor(player.rank)
              )}
            >
              <div className="flex-shrink-0">
                {getRankIcon(player.rank)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{player.nickname || player.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    #{player.rank}
                  </Badge>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>W: {player.wins}</span>
                  <span>L: {player.losses}</span>
                  <span>{player.winPercentage}% Win</span>
                  {player.damagePoints !== undefined && (
                    <span className="font-semibold text-foreground">
                      {player.damagePoints} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

