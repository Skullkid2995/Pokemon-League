'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDisplayName } from '@/lib/utils/display';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PendingGame {
  id: string;
  seasonId: string;
  player1: { id: string; name: string; nickname?: string | null; avatarUrl?: string | null };
  player2: { id: string; name: string; nickname?: string | null; avatarUrl?: string | null };
  gameDate: string;
  gameTime?: string | null;
  isCurrentUser: boolean;
}

interface PendingGamesCardProps {
  games: PendingGame[];
}

export default function PendingGamesCard({ games }: PendingGamesCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const gamesPerPage = 3;

  if (games.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(games.length / gamesPerPage);
  const startIndex = currentPage * gamesPerPage;
  const endIndex = startIndex + gamesPerPage;
  const currentGames = games.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return null;
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Pending Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentGames.map((game) => (
            <Link
              key={game.id}
              href={`/seasons/${game.seasonId}?gameId=${game.id}`}
              className="block p-4 rounded-lg border-2 border-border hover:border-primary transition-all hover:shadow-md bg-card"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg truncate">
                      {getDisplayName(game.player1)}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-semibold text-lg truncate">
                      {getDisplayName(game.player2)}
                    </span>
                    {game.isCurrentUser && (
                      <Badge variant="secondary" className="ml-auto">
                        Your Game
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(game.gameDate)}</span>
                    </div>
                    {game.gameTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(game.gameTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

