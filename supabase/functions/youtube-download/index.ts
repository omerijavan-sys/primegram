import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const { videoId, title } = await req.json()

    if (typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return json({ error: 'A valid video ID is required' }, 400)
    }
    const safeTitle = (typeof title === 'string' ? title : 'audio')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 80) || 'audio'

    // Use yt-dlp to extract audio from YouTube
    const process = new Deno.Command('yt-dlp', {
      args: [
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--output', '-',
        '--no-playlist',
        `https://www.youtube.com/watch?v=${videoId}`
      ],
      stdout: 'piped',
      stderr: 'piped',
    })

    const { code, stdout, stderr } = await process.output()

    if (code !== 0) {
      console.error('yt-dlp error:', new TextDecoder().decode(stderr))
      return json({ error: 'Failed to download audio' }, 500)
    }

    return new Response(stdout, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${safeTitle}.mp3"`
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return json({ error: 'Request failed' }, 500)
  }
})
