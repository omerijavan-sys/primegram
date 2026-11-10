import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://www.googleapis.com/youtube/v3";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) return json({ error: "YouTube search is not configured" }, 503);

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "trending" ? "trending" : "search";
    const maxResults = Math.min(Math.max(Number(body?.maxResults) || 25, 1), 50);

    if (mode === "trending") {
      const region = typeof body?.region === "string" && /^[A-Z]{2}$/.test(body.region) ? body.region : "US";
      const res = await fetch(
        `${BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&regionCode=${region}&maxResults=${maxResults}&key=${apiKey}`,
      );
      if (!res.ok) return json({ error: "Failed to fetch trending music" }, 502);
      return json(await res.json());
    }

    const query = typeof body?.query === "string" ? body.query.trim().slice(0, 200) : "";
    if (!query) return json({ error: "query is required" }, 400);

    const searchRes = await fetch(
      `${BASE_URL}/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&videoCategoryId=10&key=${apiKey}`,
    );
    if (!searchRes.ok) return json({ error: "YouTube search failed" }, 502);
    const searchData = await searchRes.json();

    const ids = (searchData.items ?? [])
      .map((i: { id?: { videoId?: string } }) => i?.id?.videoId)
      .filter((id: string | undefined) => !!id && /^[a-zA-Z0-9_-]{11}$/.test(id))
      .join(",");

    let detailsData: unknown = { items: [] };
    if (ids) {
      const detailsRes = await fetch(
        `${BASE_URL}/videos?part=contentDetails,statistics&id=${ids}&key=${apiKey}`,
      );
      if (detailsRes.ok) detailsData = await detailsRes.json();
    }

    return json({ search: searchData, details: detailsData });
  } catch (e) {
    console.error("youtube-search error:", e);
    return json({ error: "Request failed" }, 500);
  }
});
