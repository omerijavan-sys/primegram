const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TMDB_BASE = 'https://api.themoviedb.org/3'

const ALLOWED_ENDPOINTS = new Set([
  'trending/movie/week',
  'trending/movie/day',
  'trending/tv/week',
  'movie/popular',
  'movie/top_rated',
  'movie/upcoming',
  'movie/now_playing',
  'tv/popular',
  'tv/top_rated',
  'search/movie',
  'search/tv',
  'genre/movie/list',
])

// Detail-style endpoints such as movie/123/videos or movie/123/credits
const DETAIL_PATTERN = /^(movie|tv)\/\d{1,9}(\/(videos|credits|images|similar|recommendations))?$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401)

    const apiKey = Deno.env.get('TMDB_API_KEY')
    if (!apiKey) return json({ error: 'Movie service is not configured' }, 503)

    const url = new URL(req.url)
    const endpoint = (url.searchParams.get('endpoint') || 'trending/movie/week').trim()
    if (!ALLOWED_ENDPOINTS.has(endpoint) && !DETAIL_PATTERN.test(endpoint)) {
      return json({ error: 'Forbidden endpoint' }, 403)
    }

    const rawQuery = url.searchParams.get('query') || ''
    const query = rawQuery.slice(0, 200)
    const pageNum = Math.min(Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1), 500)

    let tmdbUrl = `${TMDB_BASE}/${endpoint}?page=${pageNum}&language=en-US`
    if (query) tmdbUrl += `&query=${encodeURIComponent(query)}`

    const resp = await fetch(tmdbUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!resp.ok) return json({ error: 'Movie service request failed' }, 502)
    return json(await resp.json())
  } catch (err) {
    console.error('tmdb-proxy error:', err)
    return json({ error: 'Request failed' }, 500)
  }
})
