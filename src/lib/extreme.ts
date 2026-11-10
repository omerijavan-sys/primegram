export const BOOSTS = [
  { id: "starter", name: "Starter Boost", price: 30, views: 300, perk: "pushed into feeds" },
  { id: "explore", name: "Explore Top", price: 100, views: 1500, perk: "top of Explore" },
  { id: "trending", name: "Trending in Kisumu", price: 300, views: 5000, perk: "Trending in Kisumu banner" },
] as const;

export const TIERS = [
  { id: "blue", name: "Prime Blue", price: 199, color: "text-brand-blue", perks: "Blue tick, search boost, DM Garage sellers" },
  { id: "gold", name: "Prime Gold", price: 499, color: "text-primary", perks: "Gold business tick, shop link, priority" },
  { id: "black", name: "Founder Black", price: 999, color: "text-foreground", perks: "Black aura, top spotlight, every perk" },
] as const;

export const TIP_AMOUNTS = [5, 20, 50, 100, 500, 1000] as const;
export const TIP_FEE = 0.05;
export const tipNet = (amount: number) => Math.round(amount * (1 - TIP_FEE) * 100) / 100;

export const BOUNTY_PER_FOLLOW = 10;
export const BOUNTY_FEE = 0.1;
export const CRUSH_REVEAL_PRICE = 30;

export const SOUNDS = [
  { title: "Kisumu Nights", artist: "Gengetone Riddim", uses: 12840 },
  { title: "Lakeside Bounce", artist: "Ochungulo Beats", uses: 9310 },
  { title: "Matatu Vibe", artist: "Sheng Wave", uses: 7650 },
  { title: "Dala Drill", artist: "Kondele Kings", uses: 5420 },
  { title: "Campus Shake", artist: "Maseno Mixers", uses: 3980 },
];
