import { isAxiosError } from "axios";
import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiEnvelope } from "@/features/auth/api/authApi";
import type { Ground } from "@/shared/data/types";
import { toOwnerGround, type GroundApiRow } from "@/features/owner/api/ownerGroundsApi";

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as ApiEnvelope<unknown> | undefined)?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export interface FetchPublicGroundsParams {
  cityId?: string;
  limit?: number;
}

/**
 * Public listing: GET /ground (no auth). Optional cityId and limit (max 100 on BE).
 */
export async function fetchPublicGrounds(
  params?: FetchPublicGroundsParams,
): Promise<Ground[]> {
  const search = new URLSearchParams();
  if (params?.cityId) search.set("cityId", params.cityId);
  if (params?.limit != null && params.limit > 0)
    search.set("limit", String(params.limit));
  const q = search.toString();
  const url = q ? `/ground?${q}` : "/ground";
  try {
    const { data } = await axiosClient.get<ApiEnvelope<GroundApiRow[]>>(url);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load grounds");
    }
    return data.data.map((row) => toOwnerGround(row));
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load grounds"));
  }
}

export async function fetchPublicGroundById(id: string): Promise<Ground | null> {
  try {
    const { data } = await axiosClient.get<ApiEnvelope<GroundApiRow>>(`/ground/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load ground");
    }
    return toOwnerGround(data.data);
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw new Error(getErrorMessage(err, "Failed to load ground"));
  }
}
