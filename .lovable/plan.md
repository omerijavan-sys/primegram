## Scope

Six focused workstreams. Existing infra is reused — TMDB proxy, IndexedDB stores, Lovable AI gateway, WebRTC util, LiquidBackground, GlassTabBar — and only the gaps are filled.

## 1. Movie Hub fix (highest priority — currently broken)

Bug found in `src/pages/MoviesPage.tsx`: `fetchMovies()` is called on line 146 but never defined, so trending/top_rated/upcoming all throw and the grid stays empty. `loading` is also never set to `false`.

- Add a local `fetchMovies(endpoint)` helper that calls the tmdb-proxy edge function with the publishable-key Authorization header, returns `data.results || []`, and sets `loading`/`error` correctly.
- If the edge function returns 500 (missing `TMDB_API_KEY`), surface a friendly "Movie hub unavailable — check API key" state with retry.
- Tighten the skeleton grid (already present) and ensure poster URLs always use `https://image.tmdb.org/t/p/w500` (already correct).

## 2. Music Hub evolution

- Keep the existing YouTube IFrame player — it already plays full tracks. Refactor it into a persistent bottom mini-player (`MiniPlayer.tsx`) mounted in `App.tsx` so playback survives navigation, fed by a small `MusicPlayerContext`.
- Custom-skinned controls: play/pause, next/prev, scrubber, volume, expand-to-full-hub.
- "Save to Library" → new `src/lib/musicLibrary.ts` wrapping IndexedDB (`PrimeMusicDB` store `savedTracks`). Saved tracks survive reload and feed the Library tab.
- "Picked for You" section that POSTs saved track metadata (titles/artists/genres) to a new edge function `music-recs` which calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a structured JSON prompt to return 6 suggested songs. Results are matched against the local `tracks` catalog by fuzzy title.
- Download button: for tracks tagged `royaltyFree: true` in the catalog, fetch the asset and trigger `Blob` + `URL.createObjectURL` download. For all others, show an "Offline Cache" toggle that stores the YouTube ID + metadata in IndexedDB store `offlineQueue` for playback when reopened (we cannot legally download copyrighted YouTube audio).

## 3. Siri-style AI assistant

- Wire the existing top-left "P" logo (`TopNavBar`) to dispatch a global event `prime:openOrb`.
- Build `SiriOrb.tsx`: Framer Motion fixed bottom-center bubble with `backdrop-blur-3xl`, layered radial gradients, rotating conic-gradient ring, and pulsing scale tied to mic input level. Reuses existing `PrimeOrb` Three.js sphere inside the bubble.
- Embed the existing `PrimeAIChat` voice/text flow inside the bubble surface (collapsed by default, expandable). Voice in/out via Web Speech API (already in `PrimeAIChat`).

## 4. WebRTC calling in Messages

- Reuse `src/utils/webrtc.ts` + `IncomingCallModal`. Wire a "Call" button in `MessagesPage` that creates an offer, stores it in a new `calls` table (caller_id, callee_id, sdp, ice, status), and uses Supabase Realtime to deliver it.
- The callee subscribes to `calls` rows where `callee_id = auth.uid()` and shows `IncomingCallModal` with Join/Decline + an audible ringtone (HTML5 `<audio loop>` pointing at a short ringtone asset).
- Accept → navigate to `/call/:id`, exchange SDP + ICE through the table, attach local/remote streams.

## 5. Stories / Reels / Feed video

- `StoriesBar` viewer: full-screen overlay with top auto-advancing progress bar (5s per story), tap-left/right to navigate, swipe-down to close.
- `ReelsPage`: tap on the video toggles play/pause with a brief center icon flash.
- `FeedPost`: wire an `IntersectionObserver` (threshold 0.7) so any `<video>` plays muted when in view and pauses otherwise.

## 6. Aesthetic + persistence

- Keep the current dark liquid-glass tokens (already Tailwind-driven). Tweak the mini-player and SiriOrb to use the same `--primary` accent and shadow-elegant tokens for the K.I.T.T.-style vibe.
- All "saved" content (movies, music, offline cache) goes through IndexedDB helpers in `src/lib/`.

## Technical details

- New files: `src/lib/musicLibrary.ts`, `src/lib/movieLibrary.ts` (extract from MoviesPage), `src/contexts/MusicPlayerContext.tsx`, `src/components/MiniPlayer.tsx`, `src/components/SiriOrb.tsx`, `supabase/functions/music-recs/index.ts`, migration for `calls` table with RLS (caller or callee can read; only caller inserts; only callee updates status).
- Edited files: `MoviesPage.tsx`, `PrimeMusicHub.tsx`, `App.tsx`, `TopNavBar.tsx`, `MessagesPage.tsx`, `CallPage.tsx`, `FeedPost.tsx`, `ReelsPage.tsx`, `StoriesBar.tsx`.
- Lovable AI Gateway used for music recs via `LOVABLE_API_KEY` (already set). No new secrets needed.
- `calls` table gets `GRANT` + RLS per platform rules; Realtime enabled on it.

## Out of scope (flag if you want them next)

- Replacing YouTube with Audius (would lose most catalog coverage); current YouTube IFrame already plays full tracks.
- True audio-stream download of copyrighted tracks (legally restricted — Offline Cache toggle is the substitute).
- Group calls (1:1 only this pass).
