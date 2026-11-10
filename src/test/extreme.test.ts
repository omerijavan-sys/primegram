import { describe, it, expect } from "vitest";
import { BOOSTS, TIERS, tipNet, CRUSH_REVEAL_PRICE } from "@/lib/extreme";
describe("extreme pricing", () => {
  it("boost prices", () => expect(BOOSTS.map(b => [b.price, b.views])).toEqual([[30,300],[100,1500],[300,5000]]));
  it("tier prices", () => expect(TIERS.map(t => t.price)).toEqual([199,499,999]));
  it("tip fee 5%", () => expect(tipNet(100)).toBe(95));
  it("crush reveal 30", () => expect(CRUSH_REVEAL_PRICE).toBe(30));
});
