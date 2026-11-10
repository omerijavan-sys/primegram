export const isVideoMedia = (url: string) => /\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(url);
export const CAMERA_CONSTRAINTS = { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } };
export const VIDEO_BITRATE = 8_000_000;