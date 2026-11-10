import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_post_comments",
  title: "List comments on a post",
  description: "List comments on a Primegram post, newest first.",
  inputSchema: {
    post_id: z.string().uuid().describe("ID of the post."),
    limit: z.number().int().min(1).max(100).default(30).describe("Max number of comments to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id, limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("post_comments")
      .select("id, post_id, user_id, content, created_at")
      .eq("post_id", post_id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { comments: data ?? [] },
    };
  },
});
