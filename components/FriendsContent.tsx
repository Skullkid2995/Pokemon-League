'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Mail, X, RefreshCw } from 'lucide-react';
import { getDisplayName } from '@/lib/utils/display';

interface Friend {
  id: string;
  status: string;
  created_at: string;
  friend: {
    id: string;
    name: string;
    nickname: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface FriendsContentProps {
  currentUser: {
    id: string;
    name: string;
    nickname: string | null;
    email: string | null;
    default_game_code: string | null;
  };
  friends: Friend[];
}

export default function FriendsContent({ currentUser, friends }: FriendsContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para agregar amigos
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);
  
  // Refresh function
  const handleRefresh = () => {
    router.refresh();
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFriend(true);
    setError(null);
    setSuccess(null);

    if (!friendEmail || !friendEmail.includes('@')) {
      setError('Please enter a valid email address');
      setAddingFriend(false);
      return;
    }

    try {
      // Find user by email using the search_user_by_email function
      const { data: friendUsers, error: findError } = await supabase
        .rpc('search_user_by_email', { search_email: friendEmail.toLowerCase().trim() });

      if (findError || !friendUsers || friendUsers.length === 0) {
        setError('No user found with that email');
        setAddingFriend(false);
        return;
      }

      const friendUser = friendUsers[0];

      if (friendUser.id === currentUser.id) {
        setError('You cannot add yourself as a friend');
        setAddingFriend(false);
        return;
      }

      // Check if friendship already exists (check both directions)
      const [friendships1, friendships2] = await Promise.all([
        supabase
          .from('user_friends')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('friend_id', friendUser.id),
        supabase
          .from('user_friends')
          .select('*')
          .eq('user_id', friendUser.id)
          .eq('friend_id', currentUser.id),
      ]);
      
      const existingFriendship = (friendships1.data && friendships1.data.length > 0) 
        ? friendships1.data[0]
        : (friendships2.data && friendships2.data.length > 0)
        ? friendships2.data[0]
        : null;

      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          setError('You are already friends');
        } else if (existingFriendship.status === 'pending') {
          setError('There is already a pending friend request');
        } else {
          setError('This user is blocked');
        }
        setAddingFriend(false);
        return;
      }

      // Create friend request
      const { error: insertError } = await supabase
        .from('user_friends')
        .insert({
          user_id: currentUser.id,
          friend_id: friendUser.id,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccess(`Friend request sent to ${friendUser.name || friendEmail}`);
      setFriendEmail('');
      setShowAddFriend(false);
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Error adding friend:', err);
      setError('Error adding friend: ' + (err.message || 'Unknown error'));
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    setRemovingFriendId(friendshipId);
    setError(null);
    setSuccess(null);

    try {
      // Delete friendship in both directions
      const { error: deleteError1 } = await supabase
        .from('user_friends')
        .delete()
        .eq('id', friendshipId);

      if (deleteError1) {
        // Try deleting from the other direction
        const { error: deleteError2 } = await supabase
          .from('user_friends')
          .delete()
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`);

        if (deleteError2) throw deleteError2;
      }

      setSuccess('Friend removed successfully');
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError('Error removing friend: ' + (err.message || 'Unknown error'));
    } finally {
      setRemovingFriendId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground">Error: Could not load user information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Friends List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">My Friends ({friends.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
              title="Refresh friends list"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddFriend(!showAddFriend)}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Friend
            </Button>
          </div>
        </div>

        {/* Add Friend Form */}
        {showAddFriend && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Add Friend by Email
              </h3>
              <Button
                onClick={() => {
                  setShowAddFriend(false);
                  setFriendEmail('');
                  setError(null);
                }}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleAddFriend} className="flex gap-3">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <Button
                type="submit"
                disabled={addingFriend || !friendEmail}
                variant="default"
              >
                {addingFriend ? 'Sending...' : 'Send Request'}
              </Button>
            </form>
          </div>
        )}

        {friends.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">You don&apos;t have any friends yet</p>
            <p className="text-sm mb-4">Add friends using the button above</p>
            {!showAddFriend && (
              <Button
                onClick={() => setShowAddFriend(true)}
                variant="outline"
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add First Friend
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friendship: Friend) => {
              const friend = friendship.friend;
              const displayName = getDisplayName(friend);
              const isRemoving = removingFriendId === friendship.id;
              
              return (
                <div
                  key={friendship.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors bg-card"
                >
                  {/* Avatar */}
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-xl font-bold text-primary">
                      {displayName[0].toUpperCase()}
                    </div>
                  )}

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg truncate">{displayName}</p>
                    {friend.nickname && friend.name !== friend.nickname && (
                      <p className="text-sm text-muted-foreground truncate">{friend.name}</p>
                    )}
                    {friend.email && (
                      <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                    )}
                  </div>

                  {/* Remove Friend Button */}
                  <Button
                    onClick={() => handleRemoveFriend(friendship.id, friend.id)}
                    disabled={isRemoving}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove friend"
                  >
                    <UserMinus className="h-4 w-4" />
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
