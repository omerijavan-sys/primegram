import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  X,
  Image as ImageIcon,
  Film,
  Camera,
  Video as VideoIcon,
  RotateCcw,
  Sparkles,
  Sticker,
  Square,
  Circle,
  ZoomIn,
  Wand2,
  Music,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CAMERA_CONSTRAINTS, VIDEO_BITRATE } from "@/utils/media";
import MusicPicker, { type PickedTrack } from "@/components/MusicPicker";

type Mode = "upload" | "camera";

// CSS-filter based effects
const FILTERS = [
  { name: "Normal", css: "none" },
  { name: "Mono", css: "grayscale(1) contrast(1.05)" },
  { name: "Vivid", css: "saturate(1.5) contrast(1.1)" },
  { name: "Warm", css: "sepia(0.3) saturate(1.2) hue-rotate(-10deg)" },
  { name: "Cool", css: "hue-rotate(180deg) saturate(1.1)" },
  { name: "Noir", css: "grayscale(1) contrast(1.4) brightness(0.9)" },
  { name: "Dream", css: "blur(0.5px) brightness(1.1) saturate(1.3)" },
  { name: "Retro", css: "sepia(0.6) contrast(0.95) saturate(1.2)" },
  { name: "Neon", css: "hue-rotate(90deg) saturate(2) contrast(1.2)" },
  { name: "Fade", css: "contrast(0.85) brightness(1.1) saturate(0.8)" },
];

// Quick visual templates (filter + sticker preset)
const TEMPLATES = [
  { name: "Birthday", filter: "saturate(1.4)", emoji: "🎂✨🎉" },
  { name: "Travel", filter: "saturate(1.2) contrast(1.1)", emoji: "✈️🌍📍" },
  { name: "Foodie", filter: "saturate(1.5) brightness(1.05)", emoji: "🍕🔥😋" },
  { name: "Gym", filter: "contrast(1.2) saturate(0.9)", emoji: "💪🔥" },
  { name: "Love", filter: "saturate(1.3) brightness(1.05)", emoji: "❤️💕" },
];

const STICKERS = ["❤️", "🔥", "✨", "😎", "💯", "🎉", "⭐", "🌟", "💫", "🚀", "🌈", "💖"];

interface Overlay {
  id: string;
  emoji: string;
  x: number; // percent
  y: number; // percent
}

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("upload");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const [filterCss, setFilterCss] = useState("none");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [showStickers, setShowStickers] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aiZooming, setAiZooming] = useState(false);
  // Live AI ∞ zoom
  const [aiLive, setAiLive] = useState(true);
  const [aiFrame, setAiFrame] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [nativeZoomMax, setNativeZoomMax] = useState(1);
  const [track, setTrack] = useState<PickedTrack | null>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [isAdult, setIsAdult] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoStreamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiInFlightRef = useRef(false);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const recordingFrameRef = useRef<number>();
  const zoomRef = useRef(1);
  const filterRef = useRef("none");

  // Start/stop camera
  useEffect(() => {
    if (mode !== "camera" || preview) return;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, ...CAMERA_CONSTRAINTS },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoStreamRef.current) videoStreamRef.current.srcObject = stream;
        // Detect hardware (optical/sensor) zoom range
        const track = stream.getVideoTracks()[0];
        const caps: any = track.getCapabilities?.() ?? {};
        setNativeZoomMax(caps.zoom?.max ?? 1);
        setZoom(1);
      } catch (err) {
        toast.error("Camera access denied");
        setMode("upload");
      }
    };
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (recordingFrameRef.current) cancelAnimationFrame(recordingFrameRef.current);
    };
  }, [mode, facing, preview]);

  // ---- Infinite live zoom (1x → 500x) ----
  const MAX_ZOOM = 500;
  // Hardware zoom first, then digital crop for the rest
  const nativeZoom = Math.min(zoom, nativeZoomMax || 1);
  const digitalZoom = zoom / nativeZoom;
  zoomRef.current = digitalZoom;
  filterRef.current = filterCss;

  // Push hardware zoom to the camera track when supported
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || (nativeZoomMax || 1) <= 1) return;
    track.applyConstraints({ advanced: [{ zoom: nativeZoom }] } as any).catch(() => {});
  }, [nativeZoom, nativeZoomMax]);

  // Crop the current camera frame at the active zoom level
  const captureCrop = (size = 768): string | null => {
    const v = videoStreamRef.current;
    const c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return null;
    const z = Math.max(1, digitalZoom);
    const sw = v.videoWidth / z;
    const sh = v.videoHeight / z;
    const sx = (v.videoWidth - sw) / 2;
    const sy = (v.videoHeight - sh) / 2;
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, size, size);
    return c.toDataURL("image/jpeg", 0.82);
  };

  // Live AI reconstruction: as you keep zooming past what the lens can resolve,
  // the AI continuously repaints the frame so zoom feels infinite.
  useEffect(() => {
    if (mode !== "camera" || preview || !aiLive) {
      setAiFrame(null);
      return;
    }
    if (zoom < 6) {
      setAiFrame(null);
      return;
    }
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(async () => {
      if (aiInFlightRef.current) return;
      const dataUrl = captureCrop(640);
      if (!dataUrl) return;
      aiInFlightRef.current = true;
      setAiBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-zoom", {
          body: {
            imageDataUrl: dataUrl,
            prompt: `This is a ${zoom.toFixed(0)}x digital zoom crop. Reconstruct it as a sharp, photorealistic image: recover fine texture, remove pixelation and noise, and invent plausible micro-detail consistent with the subject. Keep framing identical.`,
          },
        });
        if (error) throw error;
        if (data?.imageUrl) setAiFrame(data.imageUrl);
      } catch {
        /* silent — live enhancement is best-effort */
      } finally {
        aiInFlightRef.current = false;
        setAiBusy(false);
      }
    }, 450);
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [zoom, aiLive, mode, preview]);

  // Pinch + wheel zoom gestures
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    pinchRef.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const next = pinchRef.current.zoom * (d / pinchRef.current.dist);
    setZoom(Math.min(MAX_ZOOM, Math.max(1, next)));
  };
  const onTouchEnd = () => {
    pinchRef.current = null;
  };
  const onWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(1, z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))));
  };


  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMediaType(f.type.startsWith("video") ? "video" : "image");
  };

  const snapPhoto = async () => {
    // If a live AI-reconstructed frame is on screen, capture that instead
    if (aiFrame) {
      try {
        const blob = await (await fetch(aiFrame)).blob();
        setFile(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
        setPreview(URL.createObjectURL(blob));
        setMediaType("image");
        return;
      } catch {
        /* fall through to raw capture */
      }
    }
    if (!videoStreamRef.current || !canvasRef.current) return;
    const v = videoStreamRef.current;
    const c = canvasRef.current;
    // Honor digital zoom by cropping center
    const z = Math.max(1, digitalZoom);
    const sw = v.videoWidth / z;
    const sh = v.videoHeight / z;
    const sx = (v.videoWidth - sw) / 2;
    const sy = (v.videoHeight - sh) / 2;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.filter = filterCss;
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        setFile(f);
        setPreview(URL.createObjectURL(blob));
        setMediaType("image");
      },
      "image/jpeg",
      0.92,
    );
  };

  // AI Infinity Zoom: snap current frame and ask AI to outpaint / enhance further detail
  const aiInfinityZoom = async () => {
    if (!videoStreamRef.current || !canvasRef.current) return;
    setAiZooming(true);
    try {
      const dataUrl = captureCrop(1024);
      if (!dataUrl) throw new Error("Camera not ready");
      toast.loading("AI is enhancing zoom…", { id: "ai-zoom" });
      const { data, error } = await supabase.functions.invoke("ai-zoom", {
        body: { imageDataUrl: dataUrl },
      });
      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");

      // Convert returned data URL to File
      const res = await fetch(data.imageUrl);
      const blob = await res.blob();
      const f = new File([blob], `ai-zoom-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(f);
      setPreview(URL.createObjectURL(blob));
      setMediaType("image");
      toast.success("AI zoom complete ✨", { id: "ai-zoom" });
    } catch (e: any) {
      toast.error(e.message || "AI zoom failed", { id: "ai-zoom" });
    } finally {
      setAiZooming(false);
    }
  };

  const toggleRecord = () => {
    if (recording) {
      recorderRef.current?.stop();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      setRecording(false);
      return;
    }
    if (!streamRef.current) return;
    if (typeof MediaRecorder === "undefined") { toast.error("Video recording is not supported in this browser."); return; }
    chunksRef.current = [];
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"].find(value => MediaRecorder.isTypeSupported(value));
    let captureStream = streamRef.current;
    const video = videoStreamRef.current;
    if (video?.videoWidth) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx && typeof canvas.captureStream === "function") {
        const paint = () => {
          const scale = Math.max(1, zoomRef.current);
          const width = video.videoWidth / scale;
          const height = video.videoHeight / scale;
          ctx.filter = filterRef.current;
          ctx.drawImage(video, (video.videoWidth - width) / 2, (video.videoHeight - height) / 2, width, height, 0, 0, canvas.width, canvas.height);
          recordingFrameRef.current = requestAnimationFrame(paint);
        };
        paint();
        captureStream = canvas.captureStream(30);
        streamRef.current.getAudioTracks().forEach(track => captureStream.addTrack(track));
      }
    }
    const rec = new MediaRecorder(captureStream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: VIDEO_BITRATE, audioBitsPerSecond: 128000 });
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      if (recordingFrameRef.current) cancelAnimationFrame(recordingFrameRef.current);
      if (captureStream !== streamRef.current) captureStream.getVideoTracks().forEach(track => track.stop());
      const type = rec.mimeType || mime || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const f = new File([blob], `video-${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`, { type });
      setFile(f);
      setPreview(URL.createObjectURL(blob));
      setMediaType("video");
      setRecordSecs(0);
    };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);
    setRecordSecs(0);
    recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
  };

  const addSticker = (emoji: string) => {
    setOverlays((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, emoji, x: 50, y: 50 },
    ]);
    setShowStickers(false);
  };

  // Bake filter + overlays into the final image before uploading
  const bakeImage = async (src: File): Promise<File> => {
    if (mediaType !== "image" || (filterCss === "none" && overlays.length === 0)) return src;
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = URL.createObjectURL(src);
    });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return src;
    ctx.filter = filterCss;
    ctx.drawImage(img, 0, 0);
    // Reset filter for overlays
    ctx.filter = "none";
    const fontSize = Math.round(c.width * 0.12);
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    overlays.forEach((o) => {
      ctx.fillText(o.emoji, (o.x / 100) * c.width, (o.y / 100) * c.height);
    });
    return await new Promise<File>((resolve, reject) =>
      c.toBlob(
        (b) => {
          if (!b) { reject(new Error("Could not prepare your photo.")); return; }
          resolve(new File([b], `edited-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      ),
    );
  };

  const handlePost = async () => {
    if (!user || !file) {
      toast.error("Capture or select something first");
      return;
    }
    setUploading(true);
    try {
      const finalFile = await bakeImage(file);
      const ext = finalFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("media").upload(path, finalFile);
      if (uploadErr) throw uploadErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption || null,
        media_url: publicUrl,
        media_type: mediaType,
        music_title: track?.title ?? null,
        music_artist: track?.artist ?? null,
        music_art_url: track?.artUrl ?? null,
        music_url: track?.streamUrl ?? null,
        music_youtube_id: track?.youtubeId ?? null,
        is_adult: isAdult,
      });
      if (error) throw error;
      toast.success("Post shared!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  const resetMedia = () => {
    setFile(null);
    setPreview(null);
    setOverlays([]);
    setFilterCss("none");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="liquid-glass-elevated safe-area-top">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="depth-press">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-headline text-foreground text-base flex-1">New Post</span>
          <button
            onClick={handlePost}
            disabled={uploading || !file}
            className="depth-press px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {uploading ? "..." : "Share"}
          </button>
        </div>

        {/* Mode toggle */}
        {!preview && (
          <div className="px-5 pb-3 flex gap-2 relative z-10">
            {(["camera", "upload"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`depth-press flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                  mode === m ? "bg-primary text-primary-foreground" : "liquid-glass text-foreground"
                }`}
              >
                {m === "camera" ? <Camera className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                {m === "camera" ? "Camera" : "Library"}
              </button>
            ))}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

      <div className="p-5 space-y-4">
        {/* PREVIEW MODE */}
        {preview ? (
          <>
            <div
              ref={previewRef}
              className="relative liquid-glass rounded-2xl overflow-hidden aspect-square"
              style={{ filter: filterCss }}
            >
              {mediaType === "video" ? (
                <video src={preview} className="w-full h-full object-cover" controls playsInline />
              ) : (
                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
              )}
              {/* Overlays (only on image) */}
              {mediaType === "image" &&
                overlays.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setOverlays((prev) => prev.filter((x) => x.id !== o.id))}
                    className="absolute text-5xl select-none cursor-pointer"
                    style={{ left: `${o.x}%`, top: `${o.y}%`, transform: "translate(-50%,-50%)", filter: "none" }}
                    title="Tap to remove"
                  >
                    {o.emoji}
                  </div>
                ))}
              <button
                onClick={resetMedia}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
                style={{ filter: "none" }}
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Filters scroller */}
            <div className="space-y-2">
              <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Effects
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setFilterCss(f.css)}
                    className={`depth-press flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium ${
                      filterCss === f.css ? "bg-primary text-primary-foreground" : "liquid-glass text-foreground"
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-2">
              <p className="text-caption text-muted-foreground">Templates</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setFilterCss(t.filter);
                      [...t.emoji].forEach((e, i) =>
                        setOverlays((prev) => [
                          ...prev,
                          { id: `${Date.now()}-${i}`, emoji: e, x: 20 + i * 15, y: 20 + i * 10 },
                        ]),
                      );
                    }}
                    className="depth-press flex-shrink-0 liquid-glass rounded-xl px-3 py-2 text-xs font-medium text-foreground"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stickers */}
            {mediaType === "image" && (
              <div>
                <button
                  onClick={() => setShowStickers((s) => !s)}
                  className="depth-press w-full liquid-glass rounded-xl py-2 text-xs font-medium text-foreground flex items-center justify-center gap-2"
                >
                  <Sticker className="w-4 h-4" /> Stickers
                </button>
                <AnimatePresence>
                  {showStickers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {STICKERS.map((e) => (
                          <button
                            key={e}
                            onClick={() => addSticker(e)}
                            className="depth-press liquid-glass rounded-xl py-2 text-2xl"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="liquid-glass rounded-2xl p-4 relative z-10">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none h-24"
              />
            </div>

            {/* Background track + 18+ flag */}
            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={() => setMusicOpen(true)}
                className="depth-press flex-1 py-2.5 rounded-xl liquid-glass text-sm font-medium text-foreground flex items-center justify-center gap-2"
              >
                <Music className="w-4 h-4 text-primary" />
                {track ? "Change Track" : "Add Background Track"}
              </button>
              <button
                onClick={() => setIsAdult((v) => !v)}
                aria-label="Mark as 18+ content"
                aria-pressed={isAdult}
                className={`depth-press px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isAdult ? "bg-destructive text-destructive-foreground" : "liquid-glass text-muted-foreground"
                }`}
              >
                18+
              </button>
            </div>
            {track && (
              <div className="liquid-glass rounded-xl px-3 py-2 flex items-center gap-2 relative z-10">
                <Music className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">
                  {track.title} — {track.artist}
                </span>
                <button onClick={() => setTrack(null)} aria-label="Remove track">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </>
        ) : mode === "camera" ? (
          <div className="fixed inset-0 z-50 bg-black flex flex-col gap-3 p-3 safe-area-top overflow-y-auto">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="depth-press w-9 h-9 rounded-full bg-foreground/10 backdrop-blur-md flex items-center justify-center"
                aria-label="Close camera"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-xs font-semibold text-muted-foreground">Camera</span>
              <button
                onClick={() => setMode("upload")}
                className="depth-press px-3 py-1.5 rounded-full bg-foreground/10 backdrop-blur-md text-foreground text-xs font-semibold"
              >
                Library
              </button>
            </div>

            {/* Capture controls */}
            <div
              className="relative flex-1 min-h-[45vh] liquid-glass rounded-3xl overflow-hidden bg-black touch-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onWheel={onWheelZoom}
            >
              <video
                ref={videoStreamRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facing === "user" ? "mirror" : ""}`}
                style={{
                  filter: filterCss,
                  transform: `scale(${digitalZoom})`,
                  transformOrigin: "center",
                }}
              />
              {/* Live AI-reconstructed frame layered on top past optical limits */}
              <AnimatePresence>
                {aiFrame && (
                  <motion.img
                    key={aiFrame}
                    src={aiFrame}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: filterCss }}
                    alt="AI reconstructed zoom frame"
                  />
                )}
              </AnimatePresence>
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-destructive/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  REC {Math.floor(recordSecs / 60)}:{(recordSecs % 60).toString().padStart(2, "0")}
                </div>
              )}
              {zoom > 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md text-xs font-semibold text-foreground">
                  {zoom < 10 ? zoom.toFixed(1) : Math.round(zoom)}x
                  {zoom >= 6 && aiLive && (
                    <span className="flex items-center gap-1 text-primary">
                      <span
                        className={`w-1.5 h-1.5 rounded-full bg-primary ${aiBusy ? "animate-pulse" : ""}`}
                      />
                      AI ∞
                    </span>
                  )}
                </div>
              )}
              {/* Quick zoom stops */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {[1, 5, 25, 100, 500].map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                      Math.round(zoom) === z
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/60 text-foreground"
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
              <button
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/60 flex items-center justify-center backdrop-blur-md"
              >
                <RotateCcw className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Infinite zoom slider + live AI toggle */}
            <div className="liquid-glass rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-primary" />
                <span className="text-caption text-muted-foreground flex-1">
                  Zoom · {zoom < 10 ? zoom.toFixed(1) : Math.round(zoom)}x / {MAX_ZOOM}x
                  {nativeZoomMax > 1 && ` · lens ${nativeZoom.toFixed(1)}x`}
                </span>
                <button
                  onClick={() => setAiLive((v) => !v)}
                  className={`depth-press flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    aiLive
                      ? "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground"
                      : "liquid-glass-subtle text-foreground"
                  }`}
                >
                  <Wand2 className="w-3 h-3" />
                  Live AI ∞ {aiLive ? "On" : "Off"}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={Math.log(zoom) / Math.log(MAX_ZOOM)}
                onChange={(e) =>
                  setZoom(Math.pow(MAX_ZOOM, parseFloat(e.target.value)))
                }
                className="w-full accent-primary"
                aria-label="Camera zoom"
              />
              <p className="text-[10px] text-muted-foreground">
                Pinch or scroll to zoom. Past {6}x the AI keeps repainting the frame live so zoom
                stays sharp all the way to {MAX_ZOOM}x.
              </p>
              <button
                onClick={aiInfinityZoom}
                disabled={aiZooming}
                className="depth-press w-full py-2 rounded-xl liquid-glass-subtle text-foreground text-xs font-semibold disabled:opacity-40"
              >
                {aiZooming ? "Enhancing…" : "Capture max-detail AI shot"}
              </button>
            </div>


            {/* Filter row on camera too */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFilterCss(f.css)}
                  className={`depth-press flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium ${
                    filterCss === f.css ? "bg-primary text-primary-foreground" : "liquid-glass text-foreground"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Capture controls */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={snapPhoto}
                disabled={recording}
                className="depth-press w-14 h-14 rounded-2xl liquid-glass-elevated flex items-center justify-center disabled:opacity-40"
                aria-label="Take photo"
              >
                <Square className="w-6 h-6 text-foreground" />
              </button>
              <button
                onClick={toggleRecord}
                className={`depth-press w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                  recording ? "border-destructive bg-destructive" : "border-white bg-white/20"
                }`}
                aria-label="Record video"
              >
                {recording ? (
                  <Square className="w-7 h-7 text-white" fill="white" />
                ) : (
                  <Circle className="w-10 h-10 text-white" fill="white" />
                )}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="depth-press w-14 h-14 rounded-2xl liquid-glass-elevated flex items-center justify-center"
                aria-label="Pick from library"
              >
                <ImageIcon className="w-6 h-6 text-foreground" />
              </button>
            </div>
          </div>
        ) : (
          // UPLOAD MODE
          <button
            onClick={() => fileRef.current?.click()}
            className="depth-press w-full aspect-square rounded-2xl liquid-glass flex flex-col items-center justify-center gap-3 relative z-10"
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-primary" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Film className="w-7 h-7 text-primary" />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">Tap to select photo or video</span>
          </button>
        )}
      </div>

      {/* AI ∞ Zoom fullscreen processing overlay */}
      <AnimatePresence>
        {aiZooming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #ff3c3c, #3c8cff, #3cff8c, #ff3c3c)",
                filter: "blur(8px)",
              }}
            />
            <p className="mt-6 text-headline text-foreground text-lg">AI ∞ Zoom</p>
            <p className="text-caption text-muted-foreground">Enhancing details in realtime…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <MusicPicker open={musicOpen} onClose={() => setMusicOpen(false)} onPick={setTrack} />
    </div>
  );
};

export default CreatePostPage;
