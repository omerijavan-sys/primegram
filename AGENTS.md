# Architecture rules
- Keep Vite as the client build and Vercel rewrites as the SPA deep-link fallback; Lovable hosting handles its own fallback.
- Share online presence through one authenticated app-wide provider and keep call signaling in private participant channels so subscriptions do not multiply across screens.
- Store call invitations before navigating and scope each signaling room to an invitation; this permits missed-ring recovery and avoids offer/answer races.
- Apply persisted appearance before React renders and keep the home background static; this prevents theme flashes and unnecessary animation work.
- Record camera video from a dedicated canvas with microphone tracks; this preserves live zoom and filters without interfering with still-photo capture.