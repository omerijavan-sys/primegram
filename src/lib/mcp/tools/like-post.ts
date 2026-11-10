import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "like_post",
  title: "Like or unlike a post",
  description:
    "Like a Primegram post as the signed-in user, or remove that like when `unlike` is true. Liking twice is a no-op.",
  inputSchema: {
    post_id: z.string().uuid().describe("ID of the post to like."),
    unlike: z.boolean().optional().describe("Set true to remove the signed-in user's like instead."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ post_id, unlike }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;

    if (unlike) {
      const { error } = await sb.from("post_likes").delete().eq("post_id", post_id).eq("user_id", userId);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: `Removed like from post ${post_id}` }],
        structuredContent: { post_id, liked: false },
      };
    }

    const { error } = await sb.from("post_likes").insert({ post_id, user_id: userId });
    // 23505 = unique violation: the user already liked this post.
    if (error && error.code !== "23505") {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Liked post ${post_id}` }],
      structuredContent: { post_id, liked: true, already_liked: error?.code === "23505" },
    };
  },
});
