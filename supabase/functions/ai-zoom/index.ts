// AI Infinity Zoom: takes a base64 image and returns an AI-enhanced/outpainted version.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require an authenticated session — this endpoint spends AI credits.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const { imageDataUrl, prompt } = await req.json();
    if (
      !imageDataUrl ||
      typeof imageDataUrl !== "string" ||
      !imageDataUrl.startsWith("data:image/")
    ) {
      return json({ error: "imageDataUrl must be a data:image/* URL" }, 400);
    }
    if (imageDataUrl.length > 8_000_000) return json({ error: "Image too large" }, 413);

    const userPrompt =
      typeof prompt === "string" && prompt.trim().length > 0
        ? prompt.slice(0, 1000)
        : "Enhance this zoomed-in photo: sharpen blurry details, intelligently outpaint missing edges, recover natural texture, and produce a photorealistic high-resolution result. Keep the subject and composition identical.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return json({ error: "Rate limited, try again shortly." }, 429);
      if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
      console.error("ai-zoom gateway error", res.status, await res.text());
      return json({ error: "AI service unavailable" }, 500);
    }

    const data = await res.json();
    const imageUrl =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
      data?.choices?.[0]?.message?.content?.[0]?.image_url?.url;

    if (!imageUrl) return json({ error: "No image returned" }, 500);

    return json({ imageUrl });
  } catch (e) {
    console.error("ai-zoom error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
