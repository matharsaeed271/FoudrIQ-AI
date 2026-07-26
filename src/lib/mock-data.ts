export type Project = {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  stage: "Ideation" | "Research" | "Blueprint" | "Launch";
  health: number;
  progress: number;
  updated: string;
};

export const projects: Project[] = [
  { id: "nimbus", name: "Nimbus", tagline: "AI accounting for SMBs", industry: "Fintech", stage: "Launch", health: 92, progress: 88, updated: "2h ago" },
  { id: "relay", name: "Relay", tagline: "Async standups for remote teams", industry: "Productivity", stage: "Blueprint", health: 78, progress: 64, updated: "Yesterday" },
  { id: "fern", name: "Fern Health", tagline: "Personalized women's wellness", industry: "Healthtech", stage: "Research", health: 71, progress: 41, updated: "2d ago" },
  { id: "atlas", name: "Atlas Cargo", tagline: "Freight matching marketplace", industry: "Logistics", stage: "Ideation", health: 54, progress: 18, updated: "5d ago" },
  { id: "verse", name: "Verse", tagline: "AI music co-creation tool", industry: "Creator", stage: "Blueprint", health: 83, progress: 71, updated: "1w ago" },
  { id: "orbit", name: "Orbit Learn", tagline: "AI tutors for K-12 STEM", industry: "Edtech", stage: "Research", health: 66, progress: 33, updated: "1w ago" },
];

export const activity = [
  { t: "Generated pitch deck", p: "Nimbus", ago: "2m" },
  { t: "Refined ICP for", p: "Relay", ago: "18m" },
  { t: "Ran competitor analysis", p: "Fern Health", ago: "1h" },
  { t: "Drafted brand identity", p: "Verse", ago: "3h" },
  { t: "Blueprint published", p: "Nimbus", ago: "1d" },
];

export const templates = [
  { name: "SaaS Landing Kit", desc: "Hero, features, pricing, waitlist form.", tag: "Launch", uses: 1240 },
  { name: "Investor Deck v2", desc: "10-slide pre-seed pitch narrative.", tag: "Fundraising", uses: 980 },
  { name: "Brand Identity Suite", desc: "Names, logo directions, palette, voice.", tag: "Branding", uses: 872 },
  { name: "Market Research Deep-Dive", desc: "TAM/SAM/SOM + competitor teardown.", tag: "Research", uses: 743 },
  { name: "Financial Model", desc: "3-year P&L, unit economics, scenarios.", tag: "Finance", uses: 621 },
  { name: "GTM Playbook", desc: "Channels, pricing, 90-day launch plan.", tag: "GTM", uses: 512 },
];
