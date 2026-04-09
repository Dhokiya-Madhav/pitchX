export interface Ground {
  id: string;
  name: string;
  city: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  facilities: string[];
  isLive: boolean;
  ownerId: string;
}

export interface Slot {
  id: string;
  groundId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "available" | "booked";
}

export interface Booking {
  id: string;
  groundId: string;
  userId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "completed";
  paymentMode: "pay-at-ground";
  createdAt: string;
}

export interface Review {
  id: string;
  groundId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
