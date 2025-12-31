# Pokemon League

A web application for tracking Pokemon Trading Card Game league scores, seasons, and player statistics. Built with Next.js, TypeScript, and Supabase.

## Features

- **Player Management**: Add and manage players in your league
- **Season Management**: Create and organize seasons (3 seasons per year, 4 months each)
- **Game Tracking**: Schedule games, record scores, and track results
- **Dashboard**: Overview of players, seasons, and games

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project created (you've already done this!)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Your `.env.local` file should already be configured with your Supabase credentials
   - If not, create `.env.local` with:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

3. **Set up the database** (IMPORTANT!):
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions
   - Go to your Supabase SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
   - This creates all necessary tables (users, seasons, games)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── games/             # Game management pages
│   ├── seasons/           # Season management pages
│   ├── users/             # Player management pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home dashboard
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── GameForm.tsx       # Game create/edit form
│   ├── Navigation.tsx     # Main navigation
│   ├── SeasonForm.tsx     # Season create/edit form
│   └── UserForm.tsx       # Player create/edit form
├── lib/
│   ├── supabase/          # Supabase client configuration
│   │   ├── client.ts      # Browser client
│   │   └── server.ts      # Server client
│   └── types/             # TypeScript types
│       └── database.ts    # Database type definitions
├── supabase/
│   └── migrations/        # Database migration files
│       └── 001_initial_schema.sql
└── middleware.ts          # Supabase auth middleware
```

## Database Schema

The application uses three main tables:

- **users**: Stores player information (name, email)
- **seasons**: Stores season information (name, year, dates, status)
- **games**: Stores game information (players, scores, date, time, status)

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service (database, auth, etc.)

## Usage

1. **Add Players**: Navigate to "Players" and add all league participants
2. **Create Seasons**: Create seasons (typically 3 per year, 4 months each)
3. **Schedule Games**: Add games, assign players, and set dates/times
4. **Record Results**: Edit games to record scores when completed

## Future Enhancements

- Leaderboards and statistics
- Prize pool tracking (2 MXN per game per player)
- End-of-season rankings (1st, 2nd, 3rd place)
- Player profiles with win/loss records

