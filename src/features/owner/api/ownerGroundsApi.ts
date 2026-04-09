import { isAxiosError } from "axios";
import { axiosClient } from "@/shared/api/axiosClient";
import { getApiBaseUrl } from "@/shared/api/httpClient";
import type { Ground } from "@/shared/data/types";
import type { ApiEnvelope } from "@/features/auth/api/authApi";
import { cityLabelForId } from "@/features/owner/data/ownerCities";
import groundPlaceholder from "@/assets/ground-1.jpg";

const FALLBACK_IMAGE =
  typeof groundPlaceholder === "string" ? groundPlaceholder : groundPlaceholder.src;

/**
 * Unwrap double-encoded JSON or mistaken `{...}` / `[...]` wrappers so the value is a real
 * data URL or path. Otherwise browsers resolve values like `{"data:image...` as relative URLs
 * from `/owner/...` and issue huge GETs (431 Request Header Fields Too Large).
 */
export function unwrapGroundImageString(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  for (let depth = 0; depth < 5; depth++) {
    if (
      s.startsWith("data:") ||
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("/uploads/")
    ) {
      return s;
    }
    if (s.startsWith("/") && s.length > 1 && !s.startsWith("//")) {
      return s;
    }
    if ((s.startsWith("{") && s.includes("}")) || (s.startsWith("[") && s.includes("]"))) {
      try {
        const p = JSON.parse(s) as unknown;
        if (typeof p === "string") {
          s = p.trim();
          continue;
        }
        if (Array.isArray(p) && p.length > 0) {
          s = String(p[0]).trim();
          continue;
        }
        if (p && typeof p === "object") {
          const vals = Object.values(p as Record<string, unknown>);
          const hit = vals.find(
            (v) =>
              typeof v === "string" &&
              (v.startsWith("data:") || v.startsWith("/") || v.startsWith("http")),
          );
          if (hit) {
            s = String(hit).trim();
            continue;
          }
        }
      } catch {
        break;
      }
    }
    if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
      try {
        const inner = JSON.parse(s) as unknown;
        if (typeof inner === "string") {
          s = inner.trim();
          continue;
        }
      } catch {
        s = s.slice(1, -1).trim();
        continue;
      }
    }
    break;
  }
  return s.trim();
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

/** Raw row from GET /ground/mine or ground CRUD (snake_case + optional rating aggregate). */
export interface GroundApiRow extends Record<string, unknown> {
  id: string;
  name: string;
  city_id?: string | null;
  address: string;
  price_per_hour: number | string;
  owner_id?: string;
  description?: string | null;
  images?: unknown;
  rating?: number | string | null;
}

function parseImages(images: unknown): string[] {
  if (images == null) return [];
  if (Array.isArray(images)) {
    return images
      .map((x) => unwrapGroundImageString(String(x)))
      .filter((u) => u.length > 0);
  }
  if (typeof images === "object") {
    const vals = Object.values(images as Record<string, unknown>)
      .map((v) => (typeof v === "string" || typeof v === "number" ? unwrapGroundImageString(String(v)) : ""))
      .filter((u) => u.length > 0);
    if (vals.length > 0) return vals;
  }
  if (typeof images === "string") {
    const trimmed = images.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return parseImages(JSON.parse(trimmed) as unknown);
      } catch {
        if (trimmed.length > 0) {
          const u = unwrapGroundImageString(trimmed);
          return u ? [u] : [];
        }
      }
    }
    if (trimmed.length > 0) {
      const u = unwrapGroundImageString(trimmed);
      return u ? [u] : [];
    }
  }
  return [];
}

export type OwnerGround = Ground & {
  _cityId: string;
  description?: string;
  /** Stored image URLs/paths from API (for edit when not replacing file). */
  _imageUrls: string[];
};

export function groundImageSrc(url: string): string {
  if (!url) return FALLBACK_IMAGE;
  const u = unwrapGroundImageString(url);
  if (!u) return FALLBACK_IMAGE;
  if (u.startsWith("data:")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/uploads/")) {
    const base = getApiBaseUrl();
    return base ? `${base}${u}` : u;
  }
  if (u.startsWith("{") || u.startsWith("[") || (u.startsWith('"') && u.length > 1)) {
    return FALLBACK_IMAGE;
  }
  if (u.startsWith("/")) return u;
  return FALLBACK_IMAGE;
}

/** Read a local image file as a data URL for storing in `images[0]` (base64 in DB). */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export const ownerGroundsQueryKey = ["owner", "grounds"] as const;

export function ownerGroundDetailQueryKey(id: string) {
  return ["owner", "grounds", id] as const;
}

export function toOwnerGround(row: GroundApiRow): OwnerGround {
  const imgs = parseImages(row.images);
  const ratingNum =
    row.rating != null ? Number(row.rating) : 0;
  const price =
    typeof row.price_per_hour === "string"
      ? Number(row.price_per_hour)
      : row.price_per_hour;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    city: cityLabelForId(row.city_id != null ? String(row.city_id) : null),
    address: String(row.address ?? ""),
    image: imgs[0] || FALLBACK_IMAGE,
    rating: Number.isFinite(ratingNum) ? ratingNum : 0,
    reviewCount: 0,
    pricePerHour: Number.isFinite(price) ? price : 0,
    facilities: [],
    isLive: true,
    ownerId: row.owner_id != null ? String(row.owner_id) : "",
    _cityId: row.city_id != null ? String(row.city_id) : "",
    description: row.description != null ? String(row.description) : "",
    _imageUrls: [...imgs],
  };
}

export function getCityIdFromGround(g: Ground): string {
  return (g as OwnerGround)._cityId ?? "";
}

export async function listMyGrounds(): Promise<OwnerGround[]> {
  try {
    const { data } = await axiosClient.get<ApiEnvelope<GroundApiRow[]>>("/ground/mine");
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load grounds");
    }
    return data.data.map((row) => toOwnerGround(row));
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load grounds"));
  }
}

export async function getMyGroundById(id: string): Promise<OwnerGround> {
  try {
    const { data } = await axiosClient.get<ApiEnvelope<GroundApiRow>>(`/ground/mine/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load ground");
    }
    return toOwnerGround(data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load ground"));
  }
}

export interface CreateGroundBody {
  name: string;
  city_id: string | null;
  address: string;
  pricePerHour: number;
  description?: string;
  images: string[];
}

export async function createGroundApi(body: CreateGroundBody): Promise<OwnerGround> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<GroundApiRow>>("/ground", {
      name: body.name,
      city_id: body.city_id,
      address: body.address,
      pricePerHour: body.pricePerHour,
      description: body.description ?? "",
      images: body.images,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to create ground");
    }
    return toOwnerGround(data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to create ground"));
  }
}

export interface UpdateGroundBody {
  name: string;
  cityId: string | null;
  address: string;
  pricePerHour: number;
  description?: string;
  images: string[];
}

export async function updateGroundApi(id: string, body: UpdateGroundBody): Promise<OwnerGround> {
  try {
    const { data } = await axiosClient.put<ApiEnvelope<GroundApiRow>>(`/ground/${id}`, {
      name: body.name,
      cityId: body.cityId,
      address: body.address,
      pricePerHour: body.pricePerHour,
      description: body.description ?? "",
      images: body.images,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to update ground");
    }
    return toOwnerGround(data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to update ground"));
  }
}

export async function deleteGroundApi(id: string): Promise<void> {
  try {
    const { data } = await axiosClient.delete<ApiEnvelope<unknown>>(`/ground/${id}`);
    if (!data.success) {
      throw new Error(data.message || "Failed to delete ground");
    }
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to delete ground"));
  }
}
