import { isAxiosError } from "axios";
import { axiosClient } from "@/shared/api/axiosClient";
import type { AuthUser } from "@/features/auth/lib/authStorage";

export type UserRole = "user" | "owner";

export interface LoginPayload {
  email: string;
  password: string;
}

/** Body required by BE for both `/users/signup` and POST `/owners`. */
export interface SignupBody {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_owner: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginPlayerData {
  token: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    phone: string;
  };
}

/** Owner row from BE plus token (password must not be persisted). */
export interface LoginOwnerRaw extends Record<string, unknown> {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  token: string;
  password?: string;
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

function toAuthUserId(id: string | number): string {
  return String(id);
}

export interface AuthCredentialsResult {
  token: string;
  user: AuthUser;
}

export async function loginPlayer(payload: LoginPayload): Promise<AuthCredentialsResult> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<LoginPlayerData>>("/users/login", payload);
    if (!data.success || !data.data?.token || !data.data.user) {
      throw new Error(data.message || "Login failed");
    }
    const { token, user } = data.data;
    return {
      token,
      user: {
        id: toAuthUserId(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        is_owner: false,
      },
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Login failed"));
  }
}

export async function loginOwnerRequest(payload: LoginPayload): Promise<AuthCredentialsResult> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<LoginOwnerRaw>>("/owners/login", payload);
    if (!data.success || !data.data?.token) {
      throw new Error(data.message || "Login failed");
    }
    const row = data.data;
    return {
      token: row.token,
      user: {
        id: toAuthUserId(row.id),
        name: String(row.name ?? ""),
        email: String(row.email ?? ""),
        phone: String(row.phone ?? ""),
        is_owner: true,
      },
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Login failed"));
  }
}

export async function signupPlayer(body: SignupBody): Promise<AuthUserRow> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<AuthUserRow>>("/users/signup", body);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Signup failed");
    }
    return data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Signup failed"));
  }
}

export async function signupOwner(body: SignupBody): Promise<AuthUserRow> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<AuthUserRow>>("/owners", body);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Owner signup failed");
    }
    return data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Owner signup failed"));
  }
}

export interface ProfileUser {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  is_owner: boolean;
}

export async function getProfile(): Promise<ProfileUser> {
  try {
    const { data } = await axiosClient.get<ApiEnvelope<ProfileUser>>("/users/me");
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to load profile");
    }
    return data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to load profile"));
  }
}

export interface UpdateProfileBody {
  name: string;
  phone: string;
  /** When omitted, backend keeps existing email. */
  email?: string;
}

export async function updateProfile(body: UpdateProfileBody): Promise<ProfileUser> {
  try {
    const { data } = await axiosClient.patch<ApiEnvelope<ProfileUser>>("/users/me", body);
    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to update profile");
    }
    return data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to update profile"));
  }
}

/** Map API profile to `AuthUser` for storage/context. */
export function profileToAuthUser(p: ProfileUser): AuthUser {
  return {
    id: toAuthUserId(p.id),
    name: p.name,
    email: p.email,
    phone: p.phone ?? "",
    is_owner: Boolean(p.is_owner),
  };
}

const GENERIC_RESET_REQUEST_OK =
  "If an account exists for this email, you will receive reset instructions.";

export async function requestPasswordReset(email: string): Promise<string> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<unknown>>("/users/forgot-password", {
      email: email.trim().toLowerCase(),
    });
    if (!data.success) {
      throw new Error(data.message || "Request failed");
    }
    return typeof data.message === "string" && data.message.length > 0
      ? data.message
      : GENERIC_RESET_REQUEST_OK;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Request failed"));
  }
}

export async function validateResetToken(token: string): Promise<void> {
  try {
    const { data } = await axiosClient.post<
      ApiEnvelope<{ valid?: boolean }>
    >("/users/reset-password/validate", { token });
    if (!data.success || !data.data?.valid) {
      throw new Error(data.message || "Invalid or expired reset link.");
    }
  } catch (err) {
    throw new Error(getErrorMessage(err, "Invalid or expired reset link."));
  }
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
): Promise<void> {
  try {
    const { data } = await axiosClient.post<ApiEnvelope<unknown>>("/users/reset-password", {
      token,
      password,
    });
    if (!data.success) {
      throw new Error(data.message || "Could not reset password");
    }
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not reset password"));
  }
}
