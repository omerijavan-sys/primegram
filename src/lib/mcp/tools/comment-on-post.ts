import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "comment_on_post",
  title: "Comment on a post",
  description: "Add a comment to a Primegram post as the signed-in user.",
  inputSchema: {
    post_id: z.string().uuid().describe("ID of the post to comment on."),
    content: z.string().trim().min(1).max(2000).describe("Comment text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ post_id, content }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("post_comments")
      .insert({ post_id, user_id: ctx.getUserId()!, content })
      .select("id, post_id, content, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Commented on post ${post_id}` }],
      structuredContent: { comment: data },
    };
  },
});
