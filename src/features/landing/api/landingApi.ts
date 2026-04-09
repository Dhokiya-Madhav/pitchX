/**
 * Landing/marketing-specific API helpers (e.g. featured grounds from CMS).
 * Use shared grounds endpoints or static data until the backend exposes a dedicated route.
 */
export type LandingHighlight = {
  label: string;
  value: string;
};

export const defaultLandingStats: LandingHighlight[] = [
  { label: "Grounds", value: "500+" },
  { label: "Bookings", value: "50K+" },
  { label: "Cities", value: "8" },
  { label: "Avg Rating", value: "4.7★" },
];
