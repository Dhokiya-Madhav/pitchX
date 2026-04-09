import { isAxiosError } from "axios";
import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiEnvelope } from "@/features/auth/api/authApi";
import { formatSlotTime } from "@/features/slots/api/slotsApi";
import { slotSubtotalRupees } from "@/features/slots/slotPricing";

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as ApiEnvelope<unknown> | undefined)?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export interface BookingRow extends Record<string, unknown> {
  id: string | number;
  user_id?: string | number;
  slot_id?: string | number;
  status?: string;
}

/**
 * POST /bookings — player JWT only. Body: { slotIds: string[] } (or legacy slotId).
 */
export async function createBookingsForSlots(slotIds: string[]): Promise<BookingRow[]> {
  try {
    const { data } = await axiosClient.post<
      ApiEnvelope<{ bookings: BookingRow[] }>
    >("/bookings", { slotIds });
    if (!data.success || !data.data?.bookings) {
      throw new Error(data.message || "Booking failed");
    }
    return data.data.bookings;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Booking failed"));
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  try {
    const { data } = await axiosClient.patch<ApiEnvelope<unknown>>(
      `/bookings/${bookingId}/cancel`,
    );
    if (!data.success) {
      throw new Error(data.message || "Cancel failed");
    }
  } catch (err) {
    throw new Error(getErrorMessage(err, "Cancel failed"));
  }
}

export interface MyBookingApiRow extends Record<string, unknown> {
  booking_id: string | number;
  status: string;
  created_at: string;
  ground_id: string | number;
  ground_name: string;
  ground_address?: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  price_per_hour: number | string;
}

export interface PlayerBookingListItem {
  bookingId: string;
  status: string;
  createdAt: string;
  groundId: string;
  groundName: string;
  groundAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  amountRupees: number;
}

function normalizeApiDate(d: unknown): string {
  if (d == null) return "";
  if (d instanceof Date) return d.toISOString().split("T")[0];
  const s = String(d);
  return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
}

/** GET /bookings/me — players only (403 for owners). */
export async function fetchMyBookings(): Promise<PlayerBookingListItem[]> {
  try {
    const { data } = await axiosClient.get<ApiEnvelope<MyBookingApiRow[]>>("/bookings/me");
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load bookings");
    }
    return data.data.map((row) => {
      const st = formatSlotTime(String(row.start_time));
      const et = formatSlotTime(String(row.end_time));
      const rate = Number(row.price_per_hour);
      return {
        bookingId: String(row.booking_id),
        status: String(row.status ?? ""),
        createdAt: String(row.created_at ?? ""),
        groundId: String(row.ground_id),
        groundName: String(row.ground_name ?? ""),
        groundAddress: String(row.ground_address ?? ""),
        date: normalizeApiDate(row.slot_date),
        startTime: st,
        endTime: et,
        pricePerHour: Number.isFinite(rate) ? rate : 0,
        amountRupees: slotSubtotalRupees({
          startTime: st,
          endTime: et,
          pricePerHour: Number.isFinite(rate) ? rate : 0,
        }),
      };
    });
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load bookings"));
  }
}

export const myBookingsQueryKey = ["my-bookings"] as const;

export interface OwnerBookingApiRow extends Record<string, unknown> {
  booking_id: string | number;
  status: string;
  created_at: string;
  user_id: string | number;
  user_name: string;
  user_phone?: string | null;
  ground_id: string | number;
  ground_name: string;
  price_per_hour: number | string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface OwnerBookingListItem {
  bookingId: string;
  status: string;
  createdAt: string;
  userId: string;
  userName: string;
  userPhone: string;
  groundId: string;
  groundName: string;
  date: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  amountRupees: number;
}

export type OwnerBookingsFilter = {
  groundId?: string;
  date?: string;
};

export const ownerBookingsQueryKey = (filters: OwnerBookingsFilter) =>
  ["owner-bookings", filters.groundId ?? "", filters.date ?? ""] as const;

export async function fetchOwnerBookings(
  filters: OwnerBookingsFilter = {},
): Promise<OwnerBookingListItem[]> {
  try {
    const params = new URLSearchParams();
    if (filters.groundId) params.set("groundId", filters.groundId);
    if (filters.date) params.set("date", filters.date);
    const qs = params.toString();
    const url = qs ? `/bookings/owner?${qs}` : "/bookings/owner";
    const { data } = await axiosClient.get<ApiEnvelope<OwnerBookingApiRow[]>>(url);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load bookings");
    }
    return data.data.map((row) => {
      const st = formatSlotTime(String(row.start_time));
      const et = formatSlotTime(String(row.end_time));
      const rate = Number(row.price_per_hour);
      const pricePerHour = Number.isFinite(rate) ? rate : 0;
      return {
        bookingId: String(row.booking_id),
        status: String(row.status ?? ""),
        createdAt: String(row.created_at ?? ""),
        userId: String(row.user_id),
        userName: String(row.user_name ?? ""),
        userPhone: String(row.user_phone ?? ""),
        groundId: String(row.ground_id),
        groundName: String(row.ground_name ?? ""),
        date: normalizeApiDate(row.date),
        startTime: st,
        endTime: et,
        pricePerHour,
        amountRupees: slotSubtotalRupees({
          startTime: st,
          endTime: et,
          pricePerHour,
        }),
      };
    });
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load bookings"));
  }
}

export interface OwnerRevenueByGroundRow {
  groundId: string;
  groundName: string;
  bookingCount: number;
  revenue: number;
}

export interface OwnerDashboardStats {
  totalGrounds: number;
  totalBookings: number;
  activeSlots: number;
  revenue: number;
  revenueByGround: OwnerRevenueByGroundRow[];
}

interface OwnerDashboardStatsApi {
  total_grounds: string | number;
  total_bookings: string | number;
  active_slots: string | number;
  revenue: string | number;
  revenue_by_ground: Array<{
    ground_id: string | number;
    ground_name: string;
    booking_count: number;
    revenue: string | number;
  }>;
}

export const ownerDashboardStatsQueryKey = ["owner-dashboard-stats"] as const;

export async function fetchOwnerDashboardStats(): Promise<OwnerDashboardStats> {
  try {
    const { data } = await axiosClient.get<ApiEnvelope<OwnerDashboardStatsApi>>(
      "/bookings/owner/dashboard",
    );
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load dashboard stats");
    }
    const row = data.data;
    const num = (v: string | number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      totalGrounds: num(row.total_grounds),
      totalBookings: num(row.total_bookings),
      activeSlots: num(row.active_slots),
      revenue: num(row.revenue),
      revenueByGround: (row.revenue_by_ground ?? []).map((r) => ({
        groundId: String(r.ground_id),
        groundName: String(r.ground_name ?? ""),
        bookingCount: Number(r.booking_count) || 0,
        revenue: num(r.revenue),
      })),
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load dashboard stats"));
  }
}
