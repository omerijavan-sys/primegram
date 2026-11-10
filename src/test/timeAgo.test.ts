import { describe, it, expect } from "vitest";
import { timeAgo } from "@/utils/timeAgo";

const now = new Date("2026-10-22T12:00:00Z");
const ago = (sec: number) => new Date(now.getTime() - sec * 1000);

describe("timeAgo", () => {
  it("under a minute is just now", () => expect(timeAgo(ago(30), now)).toBe("just now"));
  it("minutes", () => expect(timeAgo(ago(5 * 60), now)).toBe("5m ago"));
  it("hours", () => expect(timeAgo(ago(3 * 3600), now)).toBe("3h ago"));
  it("days", () => expect(timeAgo(ago(2 * 86400), now)).toBe("2d ago"));
  it("weeks", () => expect(timeAgo(ago(14 * 86400), now)).toBe("2w ago"));
});
