import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FriendsContent from '@/components/FriendsContent';

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get current user record
  // Primero intentamos con default_game_code, si falla, intentamos sin ella
  let { data: currentUserData, error: userError } = await supabase
    .from('users')
    .select('id, name, nickname, email, default_game_code')
    .eq('auth_user_id', user.id)
    .single();

  // Si falla porque la columna no existe, intentamos sin ella
  if (userError && userError.message?.includes('default_game_code')) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, nickname, email')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!error && data) {
      currentUserData = { ...data, default_game_code: null };
      userError = null;
    } else {
      userError = error;
    }
  }

  // Si hay error, mostrar mensaje en lugar de redirigir (para evitar bucle de redirecciones)
  if (userError || !currentUserData) {
    console.error('Error fetching user data:', userError);
    return (
      <main className="min-h-screen bg-background pt-20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">Friends</h1>
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error loading your user information</p>
            <p className="text-sm mt-2">
              {userError?.message || 'Your user record was not found. Please contact the administrator.'}
            </p>
            <p className="text-xs mt-2 opacity-75">
              Auth User ID: {user.id}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Fetch accepted friends (both directions)
  const { data: friendships, error: friendshipsError } = await supabase
    .from('user_friends')
    .select(`
      id,
      status,
      created_at,
      friend:users!user_friends_friend_id_fkey(id, name, nickname, email, avatar_url)
    `)
    .eq('user_id', currentUserData.id)
    .eq('status', 'accepted');

  const { data: reverseFriendships, error: reverseFriendshipsError } = await supabase
    .from('user_friends')
    .select(`
      id,
      status,
      created_at,
      friend:users!user_friends_user_id_fkey(id, name, nickname, email, avatar_url)
    `)
    .eq('friend_id', currentUserData.id)
    .eq('status', 'accepted');

  // Log errors and debug info
  console.log('Current User ID:', currentUserData.id);
  console.log('Friendships (outgoing):', friendships?.length || 0, friendshipsError);
  console.log('Reverse Friendships (incoming):', reverseFriendships?.length || 0, reverseFriendshipsError);
  
  if (friendshipsError) {
    console.error('Error fetching friendships:', friendshipsError);
  }
  if (reverseFriendshipsError) {
    console.error('Error fetching reverse friendships:', reverseFriendshipsError);
  }

  // Combine both directions of friendships, filtering out null friends
  const allFriends = [
    ...(friendships || []).filter((f: any) => f.friend).map((f: any) => ({ ...f, friend: f.friend })),
    ...(reverseFriendships || []).filter((f: any) => f.friend).map((f: any) => ({ ...f, friend: f.friend }))
  ];

  // Remove duplicates (in case there are any)
  const friendsMap = new Map<string, any>();
  allFriends.forEach((f: any) => {
    if (f.friend?.id) {
      friendsMap.set(f.friend.id, f);
    }
  });
  const uniqueFriends = Array.from(friendsMap.values()) as any[];
  
  console.log('Total unique friends found:', uniqueFriends.length);

  return (
    <main className="min-h-screen bg-background pt-20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">Friends</h1>
        
        {/* Show query errors if any */}
        {(friendshipsError || reverseFriendshipsError) && (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold">Warning:</p>
            {friendshipsError && (
              <p className="text-sm">Error loading friends: {friendshipsError.message}</p>
            )}
            {reverseFriendshipsError && (
              <p className="text-sm">Error loading reverse friendships: {reverseFriendshipsError.message}</p>
            )}
          </div>
        )}
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg mb-4 text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Current User ID: {currentUserData.id}</p>
            <p>Friendships (outgoing): {friendships?.length || 0}</p>
            <p>Reverse Friendships (incoming): {reverseFriendships?.length || 0}</p>
            <p>Total Unique Friends: {uniqueFriends.length}</p>
          </div>
        )}
        
        <FriendsContent 
          currentUser={currentUserData} 
          friends={uniqueFriends || []}
        />
      </div>
    </main>
  );
}

