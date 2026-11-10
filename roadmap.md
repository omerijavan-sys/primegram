# Primegram Extreme — media, discovery & navigation expansion

Spec: user-uploads "Update and expand the Primegram Extreme social app".

## Tasks
- [ ] 1. DB: music columns + view counter + adult flags on posts; adult verification on profiles; register_post_view + verify_adult RPCs; gate adult posts behind verification
- [ ] 2. Music: "Add Background Track" picker in CreatePostPage (Audius global search + built-in chart); in-feed audio player card (art, waveform, play/pause)
- [ ] 3. Crush AI Match tab in ExtremePage: photo upload, scan animation, match pool from profiles, compatibility card with % breakdown
- [ ] 4. View counters on posts (server-side RPC, once per viewer) + live view count on cards
- [ ] 5. FAB: collapse the floating buttons (calls/hub/AI) into one FAB with radial menu incl. Create Post, Chat, Search (bottom bar untouched)
- [ ] 6. 18+ tab in ExtremePage: age-verification gate (DOB + consent, persisted server-side), restricted content grid; "Mark as 18+" toggle in CreatePostPage
- [ ] 7. Verify: build OK + Playwright pass through feed, create post with track, 18+ gate, FAB menu

## Notes
- Theme stays the established gold-on-carbon palette; the spec's purple/cyan theme text conflicts with the user's chosen design, so tokens are untouched.
- Bottom bar (GlassTabBar) is never modified.
