import type { Review } from "@/shared/data/types";

export const mockReviews: Review[] = [
  {
    id: "r1",
    groundId: "1",
    userId: "u1",
    userName: "Rahul S.",
    rating: 5,
    comment: "Best turf in the city! Floodlights are top-notch.",
    createdAt: "2026-03-10",
  },
  {
    id: "r2",
    groundId: "1",
    userId: "u2",
    userName: "Priya M.",
    rating: 4,
    comment: "Great ground but parking can be tricky on weekends.",
    createdAt: "2026-03-08",
  },
  {
    id: "r3",
    groundId: "3",
    userId: "u3",
    userName: "Arjun K.",
    rating: 5,
    comment: "Premium ground, worth every rupee!",
    createdAt: "2026-03-12",
  },
];
