/**
 * Google WebRTC infrastructure config.
 *
 * All NAT traversal goes through Google's public STUN cluster
 * (stun.l.google.com + mirrors 1-4 on both 19302 and 19305), which is the
 * same signalling infrastructure Google Meet/Hangouts clients bootstrap with.
 * Candidates are pre-gathered so the first offer already carries reflexive
 * candidates, cutting call setup time noticeably.
 */
export const GOOGLE_STUN_URLS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302",
  "stun:stun.l.google.com:19305",
  "stun:stun1.l.google.com:19305",
];

export const GOOGLE_RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: GOOGLE_STUN_URLS }],
  // Pre-gather candidates against Google STUN before the offer is created.
  iceCandidatePoolSize: 8,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceTransportPolicy: "all",
};

/** Fresh copy so callers can extend without mutating the shared object. */
export const getRtcConfig = (): RTCConfiguration => ({
  ...GOOGLE_RTC_CONFIG,
  iceServers: [{ urls: [...GOOGLE_STUN_URLS] }],
});
