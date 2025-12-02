// Generate a simple user ID based on IP and User-Agent
function getUserId(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return btoa(`${ip}:${userAgent}`).slice(0, 32);
}

async function handleGetRatings(env, jokeKey, userId) {
  // Get aggregate ratings for the joke
  const aggregateResult = await env.DB.prepare(
    'SELECT thumbs_up, thumbs_down FROM ratings WHERE joke_key = ?'
  ).bind(jokeKey).first();

  // Get user's rating for this joke
  const userRating = await env.DB.prepare(
    'SELECT rating FROM user_ratings WHERE joke_key = ? AND user_id = ?'
  ).bind(jokeKey, userId).first();

  return {
    thumbs_up: aggregateResult?.thumbs_up || 0,
    thumbs_down: aggregateResult?.thumbs_down || 0,
    user_rating: userRating?.rating || null
  };
}

async function handleSetRating(env, jokeKey, userId, rating) {
  // Validate rating
  if (!['up', 'down'].includes(rating)) {
    return new Response(JSON.stringify({ error: 'Invalid rating' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if user has already rated this joke
  const existingRating = await env.DB.prepare(
    'SELECT rating FROM user_ratings WHERE joke_key = ? AND user_id = ?'
  ).bind(jokeKey, userId).first();

  if (existingRating) {
    // If same rating, remove it (toggle off)
    if (existingRating.rating === rating) {
      await env.DB.prepare(
        'DELETE FROM user_ratings WHERE joke_key = ? AND user_id = ?'
      ).bind(jokeKey, userId).run();

      // Decrement the count
      const column = rating === 'up' ? 'thumbs_up' : 'thumbs_down';
      await env.DB.prepare(
        `UPDATE ratings SET ${column} = MAX(0, ${column} - 1), updated_at = CURRENT_TIMESTAMP WHERE joke_key = ?`
      ).bind(jokeKey).run();
    } else {
      // Change from one rating to another
      await env.DB.prepare(
        'UPDATE user_ratings SET rating = ?, created_at = CURRENT_TIMESTAMP WHERE joke_key = ? AND user_id = ?'
      ).bind(rating, jokeKey, userId).run();

      // Update counts: decrement old, increment new
      const oldColumn = existingRating.rating === 'up' ? 'thumbs_up' : 'thumbs_down';
      const newColumn = rating === 'up' ? 'thumbs_up' : 'thumbs_down';

      await env.DB.prepare(
        `UPDATE ratings SET ${oldColumn} = MAX(0, ${oldColumn} - 1), ${newColumn} = ${newColumn} + 1, updated_at = CURRENT_TIMESTAMP WHERE joke_key = ?`
      ).bind(jokeKey).run();
    }
  } else {
    // New rating
    await env.DB.prepare(
      'INSERT INTO user_ratings (joke_key, user_id, rating) VALUES (?, ?, ?)'
    ).bind(jokeKey, userId, rating).run();

    // Update or create aggregate rating
    const column = rating === 'up' ? 'thumbs_up' : 'thumbs_down';

    const exists = await env.DB.prepare(
      'SELECT id FROM ratings WHERE joke_key = ?'
    ).bind(jokeKey).first();

    if (exists) {
      await env.DB.prepare(
        `UPDATE ratings SET ${column} = ${column} + 1, updated_at = CURRENT_TIMESTAMP WHERE joke_key = ?`
      ).bind(jokeKey).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO ratings (joke_key, ${column}) VALUES (?, 1)`
      ).bind(jokeKey).run();
    }
  }

  // Return updated ratings
  return await handleGetRatings(env, jokeKey, userId);
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get user ID
  const userId = getUserId(request);

  // API Routes
  if (url.pathname === '/api/rating') {
    const jokeKey = url.searchParams.get('joke_key');

    if (!jokeKey) {
      return new Response(JSON.stringify({ error: 'Missing joke_key parameter' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (request.method === 'GET') {
      const ratings = await handleGetRatings(env, jokeKey, userId);
      return new Response(JSON.stringify(ratings), { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const rating = body.rating;

      if (!rating) {
        return new Response(JSON.stringify({ error: 'Missing rating in request body' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const ratings = await handleSetRating(env, jokeKey, userId, rating);
      return new Response(JSON.stringify(ratings), { headers: corsHeaders });
    }
  }

  // Get stats for all jokes
  if (url.pathname === '/api/stats' && request.method === 'GET') {
    const stats = await env.DB.prepare(
      'SELECT joke_key, thumbs_up, thumbs_down FROM ratings ORDER BY (thumbs_up + thumbs_down) DESC LIMIT 100'
    ).all();

    return new Response(JSON.stringify(stats.results), { headers: corsHeaders });
  }

  return new Response('Not Found', { status: 404 });
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
