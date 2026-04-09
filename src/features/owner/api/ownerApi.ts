import { apiFetch } from "@/shared/api/httpClient";

export interface OwnerDashboardStats {
  totalGrounds: number;
  totalBookings: number;
  totalRevenue: number;
}

/**
 * GET /bookings/owner/dashboard
 */
export async function fetchOwnerDashboardStats(_token: string): Promise<OwnerDashboardStats> {
  const res = await apiFetch("/bookings/owner/dashboard", {
    headers: { Authorization: `Bearer ${_token}` },
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json() as Promise<OwnerDashboardStats>;
}
