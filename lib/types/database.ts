export type User = {
  id: string;
  name: string;
  nickname: string | null;
  email: string | null;
  auth_user_id: string | null;
  role: 'super_admin' | 'player';
  must_change_password: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Season = {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  created_at: string;
  updated_at: string;
};

export type Game = {
  id: string;
  season_id: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  game_date: string;
  game_time: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  winner_id: string | null;
  result_image_url: string | null;
  damage_points: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Extended types with relations
export type GameWithPlayers = Game & {
  player1: User;
  player2: User;
  season: Season;
};

export type SeasonWithGames = Season & {
  games: GameWithPlayers[];
};

