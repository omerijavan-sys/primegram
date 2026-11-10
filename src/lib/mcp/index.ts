import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoami from "./tools/whoami";
import listPosts from "./tools/list-posts";
import createPost from "./tools/create-post";
import listMessages from "./tools/list-messages";
import likePost from "./tools/like-post";
import commentOnPost from "./tools/comment-on-post";
import listPostComments from "./tools/list-post-comments";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "primegram-mcp",
  title: "Primegram",
  version: "0.2.0",
  instructions:
    "Tools for Primegram, a social + entertainment app. Act as the signed-in user: read their profile, list and create their posts, like and comment on posts, and read their direct messages. All access is scoped by the user's OAuth token via row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoami, listPosts, createPost, listMessages, likePost, commentOnPost, listPostComments],
});

