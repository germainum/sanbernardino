import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import type { Direction } from "@san-bernardino/core";
import { registerDevice } from "../lib/deviceApi";
import { parseDeeplink } from "./deeplink";

const DEVICE_ID_KEY = "sanbernardino:deviceId";
const EXPLANATION_SEEN_KEY = "sanbernardino:pushExplanationSeen";

export async function getStoredDeviceId(): Promise<string | null> {
  const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
  return value;
}

export async function hasSeenPushExplanation(): Promise<boolean> {
  const { value } = await Preferences.get({ key: EXPLANATION_SEEN_KEY });
  return value === "true";
}

export async function markPushExplanationSeen(): Promise<void> {
  await Preferences.set({ key: EXPLANATION_SEEN_KEY, value: "true" });
}

/**
 * Requests OS notification permission and registers the device, per
 * fonctionnalites-natives-san-bernardino.md §9: call this only after the user has already
 * seen the in-app explanation screen and tapped "Activer" — never at cold launch. No-op on
 * web/PWA builds, which have no native push bridge.
 */
export async function requestPushPermissionAndRegister(): Promise<{ granted: boolean; deviceId?: string }> {
  if (!Capacitor.isNativePlatform()) return { granted: false };

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return { granted: false };

  return new Promise((resolve) => {
    PushNotifications.addListener("registration", async (token) => {
      try {
        const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
        const deviceId = await registerDevice(token.value, platform);
        await Preferences.set({ key: DEVICE_ID_KEY, value: deviceId });
        resolve({ granted: true, deviceId });
      } catch {
        // Permission granted but the /api/devices call failed (offline, backend down) —
        // the user can retry from Settings; we don't want to block on it here.
        resolve({ granted: true });
      }
    });
    PushNotifications.addListener("registrationError", () => resolve({ granted: true }));
    void PushNotifications.register();
  });
}

/**
 * Wires both notification-tap and cold-start/already-running deeplink opens to the same
 * handler, per fonctionnalites-natives-san-bernardino.md §8 (`deeplink` in the push payload
 * pre-selects the right direction). No-op on web.
 */
export function listenForDeeplinks(onDirection: (direction: Direction) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  const pushHandle = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const deeplink = action.notification?.data?.deeplink;
    if (typeof deeplink === "string") {
      const { direction } = parseDeeplink(deeplink);
      if (direction) onDirection(direction);
    }
  });
  const urlHandle = CapacitorApp.addListener("appUrlOpen", (data) => {
    const { direction } = parseDeeplink(data.url);
    if (direction) onDirection(direction);
  });

  return () => {
    void pushHandle.then((h) => h.remove());
    void urlHandle.then((h) => h.remove());
  };
}
