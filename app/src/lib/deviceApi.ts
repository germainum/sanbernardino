import type { Direction } from "@san-bernardino/core";
import { API_BASE, SUPABASE_ANON_KEY } from "./env";

function authHeaders() {
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" };
}

export interface DevicePrefs {
  directions: Direction[];
  types: Record<string, boolean>;
  jam_threshold_min: number;
  quiet_hours: { from: string; to: string };
}

export interface DeviceRecord {
  id: string;
  push_token: string;
  platform: string;
  prefs: DevicePrefs;
  remove_ads: boolean;
  consent: unknown;
}

export async function registerDevice(pushToken: string, platform: "android" | "ios"): Promise<string> {
  const res = await fetch(`${API_BASE}/devices`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ push_token: pushToken, platform }),
  });
  if (!res.ok) throw new Error(`device registration failed: ${res.status}`);
  const data: { device_id: string } = await res.json();
  return data.device_id;
}

export async function fetchDevice(deviceId: string): Promise<DeviceRecord> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`device fetch failed: ${res.status}`);
  return res.json();
}

export async function updateDevicePrefs(deviceId: string, prefs: DevicePrefs): Promise<DeviceRecord> {
  const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ prefs }),
  });
  if (!res.ok) throw new Error(`device update failed: ${res.status}`);
  return res.json();
}

export async function schedulePlannedTrip(deviceId: string, direction: Direction, departAt: string): Promise<void> {
  const res = await fetch(`${API_BASE}/planned-trips`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ device_id: deviceId, direction, depart_at: departAt }),
  });
  if (!res.ok) throw new Error(`planned trip creation failed: ${res.status}`);
}
