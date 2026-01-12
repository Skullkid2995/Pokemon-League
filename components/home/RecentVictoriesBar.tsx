'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

interface RecentVictoriesBarProps {
  victories: Victory[];
}

export default function RecentVictoriesBar({ victories }: RecentVictoriesBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Sort victories by date (newest first) and limit to 15
  const sortedVictories = useMemo(() => {
    return [...victories]
      .sort((a, b) => {
        // Sort by date (newest first)
        if (a.gameDate !== b.gameDate) {
          return b.gameDate.localeCompare(a.gameDate);
        }
        // Then by time (newest first)
        const timeA = a.gameTime || '00:00:00';
        const timeB = b.gameTime || '00:00:00';
        return timeB.localeCompare(timeA);
      })
      .slice(0, 15); // Last 15 games
  }, [victories]);

  const nextVictory = () => {
    if (isAnimating || sortedVictories.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % sortedVictories.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevVictory = () => {
    if (isAnimating || sortedVictories.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + sortedVictories.length) % sortedVictories.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (sortedVictories.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground border-2">
        No recent victories to display
      </Card>
    );
  }

  // Ensure currentIndex is within bounds
  const safeIndex = currentIndex >= sortedVictories.length ? 0 : currentIndex;
  const currentVictory = sortedVictories[safeIndex];

  return (
    <Card className="overflow-hidden border-2 relative">
      {/* Pokeball Background */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72">
          <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="60" fill="#FF0000"/>
            <circle cx="60" cy="60" r="45" fill="#FFFFFF"/>
            <rect x="15" y="60" width="90" height="5" fill="#000000"/>
            <circle cx="60" cy="60" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3"/>
            <circle cx="60" cy="60" r="8" fill="#000000"/>
          </svg>
        </div>
      </div>

      <div className="relative z-10">
        <div className="relative flex items-stretch min-h-[200px]">
          {/* Left Navigation Button - Extends full height */}
          {sortedVictories.length > 1 && (
            <button
              onClick={prevVictory}
              className="w-12 z-20 bg-gradient-to-r from-background/90 via-background/80 to-transparent backdrop-blur-sm hover:from-primary/20 hover:via-primary/15 hover:to-transparent transition-all shadow-lg flex items-center justify-center rounded-l-lg group absolute left-0 inset-y-0"
              aria-label="Previous victory"
            >
              <ChevronLeft className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" />
            </button>
          )}

          {/* Victory content */}
          <div
            className={cn(
              "flex-1 px-16 py-6 transition-all duration-300 relative z-10 flex flex-col",
              isAnimating && "opacity-0 scale-95"
            )}
          >
            {/* Main content: text and image side by side */}
            <div className="flex items-center justify-center gap-8 max-w-4xl mx-auto mb-4">
              {/* Victory details */}
              <div className="flex-1 min-w-0 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Badge variant="default" className="bg-primary">
                    Victory! 🎉
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {new Date(currentVictory.gameDate).toLocaleDateString()}
                    </span>
                    {currentVictory.gameTime && (
                      <>
                        <span>•</span>
                        <span>
                          {new Date(`2000-01-01T${currentVictory.gameTime}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Winner and Loser names with different styling */}
                <div className="mb-3">
                  <div className="text-2xl font-bold text-primary mb-1 text-center">
                    {currentVictory.playerNickname || currentVictory.playerName}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">vs</span>
                    <span className="text-base text-muted-foreground font-normal">
                      {currentVictory.opponentNickname || currentVictory.opponentName}
                    </span>
                  </div>
                </div>
                
                {/* Game stats */}
                <div className="flex gap-4 mt-3 justify-center flex-wrap">
                  {currentVictory.damagePoints !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-semibold">Damage:</span>
                      <span className="text-primary font-bold">{currentVictory.damagePoints}</span>
                    </div>
                  )}
                  {currentVictory.lives !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-semibold">Lives:</span>
                      <span className="text-primary font-bold">{currentVictory.lives}</span>
                    </div>
                  )}
                  {currentVictory.score !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-semibold">Score:</span>
                      <span className="text-primary font-bold">{currentVictory.score}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Winner image or avatar - Centered on right side, larger size */}
              <div className="flex-shrink-0 flex items-center justify-center">
                {currentVictory.winnerImage ? (
                  <div 
                    className="w-48 h-48 rounded-lg overflow-hidden border-2 border-primary shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(currentVictory.winnerImage || null)}
                  >
                    <img
                      src={currentVictory.winnerImage}
                      alt="Winner victory"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : currentVictory.playerImage ? (
                  <img
                    src={currentVictory.playerImage}
                    alt={currentVictory.playerName}
                    className="w-24 h-24 rounded-full border-2 border-primary object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-3xl font-bold text-primary">
                    {(currentVictory.playerNickname || currentVictory.playerName)[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Progress dots - Below content, centered */}
            {sortedVictories.length > 1 && (
              <div className="flex justify-center gap-2 pt-2 pb-2 w-full">
                {sortedVictories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex
                        ? "bg-primary w-8"
                        : "bg-muted hover:bg-primary/50"
                    )}
                    aria-label={`Go to victory ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Navigation Button - Extends full height */}
          {sortedVictories.length > 1 && (
            <button
              onClick={nextVictory}
              className="w-12 z-20 bg-gradient-to-l from-background/90 via-background/80 to-transparent backdrop-blur-sm hover:from-primary/20 hover:via-primary/15 hover:to-transparent transition-all shadow-lg flex items-center justify-center rounded-r-lg group absolute right-0 inset-y-0"
              aria-label="Next victory"
            >
              <ChevronRight className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-transparent border-none overflow-hidden">
          <div className="relative flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Victory screenshot"
                className="max-h-[90vh] max-w-[90vw] w-auto h-auto rounded-lg shadow-2xl object-contain"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

