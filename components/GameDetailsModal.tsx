'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDisplayName, formatLocalDate } from '@/lib/utils/display';
import DeleteGameButton from '@/components/DeleteGameButton';
import { X, ZoomIn } from 'lucide-react';

interface GameDetailsModalProps {
  game: any;
  isOpen: boolean;
  onClose: () => void;
  seasonId?: string;
  currentUserRole?: 'super_admin' | 'player' | null;
  currentUserId?: string | null;
  seasonStatus?: string;
}

export default function GameDetailsModal({ 
  game, 
  isOpen, 
  onClose, 
  seasonId, 
  currentUserRole = null, 
  currentUserId = null,
  seasonStatus = 'active'
}: GameDetailsModalProps) {
  const [imageExpanded, setImageExpanded] = useState<string | null>(null);
  
  if (!game) return null;

  const player1 = game.player1;
  const player2 = game.player2;
  const season = game.season;
  const isCompleted = game.status === 'completed';
  const winner = isCompleted && game.winner_id 
    ? (game.winner_id === game.player1_id ? player1 : player2)
    : null;
  const loser = isCompleted && winner
    ? (game.winner_id === game.player1_id ? player2 : player1)
    : null;
  
  const player1WinnerSelection = game.player1_winner_selection;
  const player2WinnerSelection = game.player2_winner_selection;
  const player1SelectedWinner = player1WinnerSelection 
    ? (player1WinnerSelection === game.player1_id ? player1 : player2)
    : null;
  const player2SelectedWinner = player2WinnerSelection 
    ? (player2WinnerSelection === game.player1_id ? player1 : player2)
    : null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Game Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header info - Date and Time */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b">
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {formatLocalDate(game.game_date)}
                  {game.game_time && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {season && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {season.name}
                  </div>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                  game.status
                )}`}
              >
                {game.status === 'completed' ? 'Completed' : game.status === 'scheduled' ? 'Scheduled' : 'Cancelled'}
              </span>
            </div>

            {/* Winner - Right after date/time */}
            {isCompleted && winner && (
              <div className="relative bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-xl border-2 border-primary/50 overflow-hidden">
                {/* Pokeball background */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                  <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="60" fill="#FF0000"/>
                    <circle cx="60" cy="60" r="45" fill="#FFFFFF"/>
                    <rect x="15" y="60" width="90" height="5" fill="#000000"/>
                    <circle cx="60" cy="60" r="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3"/>
                    <circle cx="60" cy="60" r="8" fill="#000000"/>
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">WINNER</div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    {getDisplayName(winner)}
                  </div>
                  <div className="text-base font-semibold text-foreground mt-1">
                    {game.winner_id === game.player1_id ? game.player1_score : game.player2_score} points
                  </div>
                </div>
              </div>
            )}

            {/* Players info - If not completed */}
            {!isCompleted && (
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <div className="text-lg font-medium text-foreground text-center">
                  {getDisplayName(player1)} <span className="text-muted-foreground mx-2">vs</span> {getDisplayName(player2)}
                </div>
              </div>
            )}

            {/* Screenshots - Side by side, small and clickable */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Participant Results</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Player 1 Screenshot */}
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-foreground">
                      {getDisplayName(player1)}
                    </h4>
                    {game.player1_damage_points !== null && game.player1_damage_points !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {game.player1_damage_points}
                      </span>
                    )}
                  </div>
                  
                  {game.player1_result_image_url ? (
                    <div 
                      className="rounded-lg overflow-hidden border-2 border-border cursor-pointer hover:opacity-90 transition-opacity bg-muted/20"
                      onClick={() => setImageExpanded('player1')}
                    >
                      <img
                        src={game.player1_result_image_url}
                        alt={`${getDisplayName(player1)} screenshot`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center h-32 flex items-center justify-center">
                      No screenshot
                    </div>
                  )}

                  {player1SelectedWinner && (
                    <div className="text-xs text-muted-foreground">
                      Winner: <span className="font-semibold text-primary">{getDisplayName(player1SelectedWinner)}</span>
                    </div>
                  )}
                </div>

                {/* Player 2 Screenshot */}
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-foreground">
                      {getDisplayName(player2)}
                    </h4>
                    {game.player2_damage_points !== null && game.player2_damage_points !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {game.player2_damage_points}
                      </span>
                    )}
                  </div>
                  
                  {game.player2_result_image_url ? (
                    <div 
                      className="rounded-lg overflow-hidden border-2 border-border cursor-pointer hover:opacity-90 transition-opacity bg-muted/20"
                      onClick={() => setImageExpanded('player2')}
                    >
                      <img
                        src={game.player2_result_image_url}
                        alt={`${getDisplayName(player2)} screenshot`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded text-center h-32 flex items-center justify-center">
                      No screenshot
                    </div>
                  )}

                  {player2SelectedWinner && (
                    <div className="text-xs text-muted-foreground">
                      Winner: <span className="font-semibold text-primary">{getDisplayName(player2SelectedWinner)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {game.notes && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{game.notes}</p>
              </div>
            )}

            {/* Actions - Save Game and Delete */}
            {(currentUserRole === 'super_admin' || currentUserId === game.player1_id || currentUserId === game.player2_id) && (
              <div className="flex flex-col gap-3 pt-4 border-t">
                {game.status === 'scheduled' && seasonStatus !== 'completed' && (
                  <>
                    {(currentUserId === game.player1_id || currentUserId === game.player2_id || currentUserRole === 'super_admin') && (
                      <Link
                        href={`/seasons/${seasonId}/games/${game.id}/save`}
                        className="text-center text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-bold py-2 px-4 bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-all shadow-md hover:shadow-lg"
                        onClick={onClose}
                      >
                        {currentUserRole === 'super_admin' ? 'Save Game' : 'Upload My Screenshot'}
                      </Link>
                    )}
                    {currentUserRole === 'super_admin' && (
                      <div className="flex justify-center">
                        {seasonId && <DeleteGameButton gameId={game.id} seasonId={seasonId} gameStatus={game.status} />}
                      </div>
                    )}
                  </>
                )}
                {game.status === 'completed' && currentUserRole === 'super_admin' && seasonId && (
                  <div className="flex justify-center">
                    <DeleteGameButton gameId={game.id} seasonId={seasonId} gameStatus={'completed'} />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Modal */}
      {imageExpanded && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageExpanded(null)}
        >
          <button
            onClick={() => setImageExpanded(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageExpanded === 'player1' ? game.player1_result_image_url : game.player2_result_image_url}
            alt={`Expanded screenshot of ${imageExpanded === 'player1' ? getDisplayName(player1) : getDisplayName(player2)}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

