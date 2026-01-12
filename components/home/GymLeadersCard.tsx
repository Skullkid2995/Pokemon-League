'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayName } from '@/lib/utils/display';
import { getTypeInfo } from '@/lib/constants/pokemon-types';

interface GymLeader {
  id: string;
  userId: string;
  playerName: string;
  playerNickname?: string | null;
  avatarUrl?: string | null;
  deckType: string;
  wins: number;
  losses: number;
  hasBadge?: boolean; // Whether player has the gym badge
}

interface GymLeadersCardProps {
  leaders: GymLeader[];
}

const LEADERS_PER_PAGE = 3;

export default function GymLeadersCard({ leaders }: GymLeadersCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalPages = Math.ceil(leaders.length / LEADERS_PER_PAGE);
  const currentLeaders = leaders.slice(
    currentPage * LEADERS_PER_PAGE,
    (currentPage + 1) * LEADERS_PER_PAGE
  );

  const nextPage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentPage((prev) => (prev + 1) % totalPages);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevPage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  if (leaders.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Gym Leaders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No gym leaders yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl">Gym Leaders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Navigation Buttons */}
          {totalPages > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevPage}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
                aria-label="Previous leaders"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextPage}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-all shadow-lg"
                aria-label="Next leaders"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Leaders Grid */}
          <div 
            className={cn(
              "grid grid-cols-1 md:grid-cols-3 gap-4 px-8 transition-all duration-500 ease-in-out",
              isTransitioning && "opacity-50"
            )}
          >
            {currentLeaders.map((leader) => {
              const typeInfo = getTypeInfo(leader.deckType);
              return (
                <div
                  key={leader.id}
                  className={cn(
                    "relative p-4 rounded-xl border-2 bg-gradient-to-br transition-all duration-300 hover:scale-105 hover:shadow-xl",
                    typeInfo.colors,
                    typeInfo.border
                  )}
                >
                  {/* Gym Badge - Top Right Corner (only if player has badge) */}
                  {leader.hasBadge && (
                    <div className="absolute top-2 right-2 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-400 animate-pulse">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#FFA500" strokeWidth="3" />
                        <path
                          d="M50 20 L60 40 L80 45 L65 60 L67 80 L50 70 L33 80 L35 60 L20 45 L40 40 Z"
                          fill="#FFA500"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Player Avatar */}
                  <div className="flex flex-col items-center mb-3">
                    {leader.avatarUrl ? (
                      <img
                        src={leader.avatarUrl}
                        alt={getDisplayName({ name: leader.playerName ?? '', nickname: leader.playerNickname ?? null })}
                        className="w-20 h-20 rounded-full border-4 border-white/80 shadow-lg object-cover mb-2"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full border-4 border-white/80 shadow-lg bg-white/20 flex items-center justify-center text-3xl font-bold text-white mb-2">
                        {(leader.playerNickname || leader.playerName)[0].toUpperCase()}
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-white text-center drop-shadow-lg">
                      {leader.playerNickname || leader.playerName}
                    </h3>
                    <div className="text-sm text-white/90 font-semibold">
                      {typeInfo.name} Type
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white drop-shadow-lg">
                        {leader.wins}
                      </div>
                      <div className="text-xs text-white/90 font-semibold">
                        Victories
                      </div>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute bottom-2 left-2 text-2xl">
                    {typeInfo.badge}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Dots */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentPage
                      ? "bg-primary w-8"
                      : "bg-muted hover:bg-primary/50"
                  )}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

