'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface GymBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_color: string;
  earned_at: string;
}

interface PokeballAchievement {
  id: string;
  pokeball_type: string;
  pokeball_name: string;
  is_current: boolean;
  earned_at: string;
}

interface PlayerAchievementsProps {
  badges: GymBadge[];
  pokeballs: PokeballAchievement[];
  userId: string;
}

export default function PlayerAchievements({ badges, pokeballs, userId }: PlayerAchievementsProps) {
  const currentPokeball = pokeballs?.find((p) => p.is_current) || pokeballs?.[pokeballs.length - 1];

  return (
    <div className="space-y-6">
      {/* Current Pokeball Display */}
      {currentPokeball && (
        <Card className="p-6 border-2">
          <CardHeader>
            <CardTitle className="text-xl">Current Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-4 border-primary">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{currentPokeball.pokeball_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {currentPokeball.pokeball_type.replace('_', ' ')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Earned: {new Date(currentPokeball.earned_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gym Badges */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-xl">Gym Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {!badges || badges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No badges earned yet
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map((badge: GymBadge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-4 border-2 rounded-lg hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2 border-2 border-yellow-600 shadow-lg">
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
                  <h4 className="font-semibold text-sm text-center">{badge.badge_name}</h4>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {badge.badge_type} Type
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Pokeballs */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-xl">Pokeball Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {!pokeballs || pokeballs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pokeball achievements yet
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pokeballs.map((pokeball: PokeballAchievement) => (
                <div
                  key={pokeball.id}
                  className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                    pokeball.is_current
                      ? 'bg-primary/10 border-primary shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                    pokeball.is_current ? 'ring-4 ring-primary' : ''
                  }`}>
                    <div className="text-4xl">
                      {pokeball.pokeball_type === 'master_ball' && '⚪'}
                      {pokeball.pokeball_type === 'ultra_ball' && '🔵'}
                      {pokeball.pokeball_type === 'great_ball' && '🔴'}
                      {pokeball.pokeball_type === 'safari_ball' && '🟡'}
                      {pokeball.pokeball_type === 'net_ball' && '🟢'}
                      {pokeball.pokeball_type === 'dive_ball' && '🔵'}
                      {pokeball.pokeball_type === 'pokeball' && '⚪'}
                      {!['master_ball', 'ultra_ball', 'great_ball', 'safari_ball', 'net_ball', 'dive_ball', 'pokeball'].includes(pokeball.pokeball_type) && '⚪'}
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm text-center">{pokeball.pokeball_name}</h4>
                  {pokeball.is_current && (
                    <Badge variant="default" className="mt-2 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

