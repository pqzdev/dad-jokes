# Dad Jokes

A whimsical dad jokes app with online rating system powered by Cloudflare D1.

## Features

- 1100+ dad jokes in Q&A format
- Whimsical design with Bangers and Comic Neue fonts
- Random joke selection
- Hover tilt effect (randomizes left/right for each joke)
- Thumbs up/down rating with outline/filled states
- Online ratings stored in Cloudflare D1
- Responsive mobile design

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Pages

## Development

### Local Setup

1. Install dependencies:
```bash
npm install -g wrangler
```

2. Run local development server:
```bash
python3 -m http.server 8002
```

3. Run local worker (for API):
```bash
npx wrangler dev worker.js --local
```

### Database Setup

The D1 database is already configured with ID: `3fe465ca-ff86-4914-9206-7962f2a8c9ce`

To reset the database schema:
```bash
npx wrangler d1 execute dad-jokes-ratings --remote --file=schema.sql
```

## Deployment

### Cloudflare Pages

1. Connect the GitHub repo to Cloudflare Pages
2. Configure build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `/`
3. Add D1 binding in Pages settings:
   - Variable name: `DB`
   - D1 database: `dad-jokes-ratings`

The Pages Functions in `/functions/api/` will automatically handle the API routes.

## API Endpoints

### GET /api/rating
Get ratings for a joke
- Query params: `joke_key` (unique identifier for the joke)
- Returns: `{ thumbs_up: number, thumbs_down: number, user_rating: 'up' | 'down' | null }`

### POST /api/rating
Submit a rating
- Query params: `joke_key`
- Body: `{ rating: 'up' | 'down' | null }`
- Returns: Updated rating object

### GET /api/stats
Get top 100 rated jokes
- Returns: Array of `{ joke_key, thumbs_up, thumbs_down }`

## License

MIT
