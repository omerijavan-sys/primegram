import { describe, it, expect, vi } from "vitest";
const insert = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));
import { beginCall, rtcChannelName } from "@/utils/calls";
import { CAMERA_CONSTRAINTS, VIDEO_BITRATE, isVideoMedia } from "@/utils/media";
describe("one-on-one calls", () => {
  it("uses the same signaling room for both participants", () => {
    expect(rtcChannelName("b", "a")).toBe("rtc-a--b");
    expect(rtcChannelName("a", "b")).toBe("rtc-a--b");
  });
  it("rejects self calls", async () => { await expect(beginCall("a", "a")).rejects.toThrow("another member"); });
  it("creates a video invitation before opening a call", async () => {
    insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: "invite" }, error: null }) }) });
    expect(await beginCall("caller", "receiver")).toBe("/call/receiver?call=invite");
    expect(insert).toHaveBeenCalledWith({ caller_id: "caller", receiver_id: "receiver", audio: false });
  });
});
describe("media capture", () => {
  it("targets full HD capture rather than square low-resolution video", () => {
    expect(CAMERA_CONSTRAINTS.width.ideal).toBe(1920);
    expect(CAMERA_CONSTRAINTS.height.ideal).toBe(1080);
    expect(VIDEO_BITRATE).toBe(8000000);
  });
  it("recognizes video stories including signed URLs", () => {
    expect(isVideoMedia("/story.webm?token=x")).toBe(true);
    expect(isVideoMedia("/story.mp4")).toBe(true);
    expect(isVideoMedia("/story.jpg")).toBe(false);
  });
});