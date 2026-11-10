import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "create_post",
  title: "Create post",
  description: "Create a new Primegram post as the signed-in user.",
  inputSchema: {
    caption: z.string().trim().min(1).max(2000).describe("Post caption text."),
    media_url: z.string().url().optional().describe("Optional media URL."),
    media_type: z.enum(["image", "video"]).optional().describe("Media type if media_url is provided."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ caption, media_url, media_type }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("posts")
      .insert({ user_id: ctx.getUserId()!, caption, media_url: media_url ?? null, media_type: media_type ?? null })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created post ${data.id}` }],
      structuredContent: { post: data },
    };
  },
});
