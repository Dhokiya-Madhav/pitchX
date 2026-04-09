import { isAxiosError } from "axios";
import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiEnvelope } from "@/features/auth/api/authApi";
import type { Slot } from "@/shared/data/types";

export interface SlotApiRow extends Record<string, unknown> {
  id: string | number;
  ground_id: string;
  date: string;
  start_time: string;
  end_time: string;
  price?: string | number | null;
  is_booked: boolean;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as ApiEnvelope<unknown> | undefined)?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function formatSlotTime(t: string | undefined): string {
  if (!t) return "";
  const s = String(t);
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return s.slice(0, 5);
}

function normalizeDate(d: unknown): string {
  if (d == null) return "";
  if (d instanceof Date) return d.toISOString().split("T")[0];
  const s = String(d);
  return s.includes("T") ? s.split("T")[0] : s;
}

export function mapRowToSlot(row: SlotApiRow, fallbackPricePerHour: number): Slot {
  const p = row.price;
  const priceNum = p != null && p !== "" ? Number(p) : fallbackPricePerHour;
  const booked = Boolean(row.is_booked);
  return {
    id: String(row.id),
    groundId: String(row.ground_id),
    date: normalizeDate(row.date),
    startTime: formatSlotTime(String(row.start_time)),
    endTime: formatSlotTime(String(row.end_time)),
    price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : fallbackPricePerHour,
    status: booked ? "booked" : "available",
  };
}

/** `price` is always the ground's current `price_per_hour` from the API (not stored per slot). */
export interface OwnerSlotView {
  id: string;
  groundId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
}

export function mapRowToOwnerSlotView(row: SlotApiRow): OwnerSlotView {
  const p = row.price;
  const priceNum = p != null && p !== "" ? Number(p) : 0;
  return {
    id: String(row.id),
    groundId: String(row.ground_id),
    date: normalizeDate(row.date),
    startTime: formatSlotTime(String(row.start_time)),
    endTime: formatSlotTime(String(row.end_time)),
    price: Number.isFinite(priceNum) ? priceNum : 0,
    isBooked: Boolean(row.is_booked),
  };
}

export const slotsQueryKey = (groundId: string, date?: string) =>
  ["slots", groundId, date ?? "all"] as const;

export async function listSlotsForGround(groundId: string, date?: string): Promise<OwnerSlotView[]> {
  try {
    const params = new URLSearchParams({ groundId });
    if (date) params.set("date", date);
    const { data } = await axiosClient.get<ApiEnvelope<SlotApiRow[]>>(`/slots?${params}`);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load slots");
    }
    return data.data.map((row) => mapRowToOwnerSlotView(row as SlotApiRow));
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load slots"));
  }
}

export async function fetchSlotsAsBookingSlots(
  groundId: string,
  date: string,
  fallbackPricePerHour: number,
): Promise<Slot[]> {
  try {
    const params = new URLSearchParams({ groundId, date });
    const { data } = await axiosClient.get<ApiEnvelope<SlotApiRow[]>>(`/slots?${params}`);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load slots");
    }
    return data.data.map((row) => mapRowToSlot(row as SlotApiRow, fallbackPricePerHour));
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load slots"));
  }
}

export async function createSlotApi(body: {
  groundId: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<OwnerSlotView> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<SlotApiRow>>("/slots", body);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to create slot");
    }
    return mapRowToOwnerSlotView(data.data as SlotApiRow);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to create slot"));
  }
}

export async function updateSlotApi(
  id: string,
  body: { date: string; startTime: string; endTime: string },
): Promise<OwnerSlotView> {
  try {
    const { data } = await axiosClient.put<ApiEnvelope<SlotApiRow>>(`/slots/${id}`, body);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to update slot");
    }
    return mapRowToOwnerSlotView(data.data as SlotApiRow);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to update slot"));
  }
}

export async function deleteSlotApi(id: string): Promise<void> {
  try {
    const { data } = await axiosClient.delete<ApiEnvelope<unknown>>(`/slots/${id}`);
    if (!data.success) {
      throw new Error(data.message || "Failed to delete slot");
    }
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to delete slot"));
  }
}
