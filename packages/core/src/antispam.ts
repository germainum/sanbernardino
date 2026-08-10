import { COOLDOWN_MIN, DAILY_NOTIFICATION_CAP } from "./constants.js";
import type { EventPriority, EventType } from "./types.js";

export interface QuietHours {
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

/** Cooldown (minutes) before the same event type can notify the same device again. */
export function cooldownFor(type: EventType): number {
  return COOLDOWN_MIN[type] ?? 15;
}

function toMinutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Handles overnight ranges (e.g. 22:00-07:00), per fonctionnalites-natives-san-bernardino.md §4. */
export function isInQuietHours(quietHours: QuietHours, now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const from = toMinutesOfDay(quietHours.from);
  const to = toMinutesOfDay(quietHours.to);
  if (from === to) return false;
  if (from < to) return nowMin >= from && nowMin < to;
  return nowMin >= from || nowMin < to; // wraps past midnight
}

export function exceedsDailyCap(dailyCount: number, priority: EventPriority): boolean {
  if (priority === "high") return false;
  return dailyCount >= DAILY_NOTIFICATION_CAP;
}

export interface SuppressionContext {
  type: EventType;
  priority: EventPriority;
  now: Date;
  quietHours?: QuietHours;
  lastSentAt: Date | null;
  dailyCount: number;
}

/**
 * Pure anti-spam gate, per backend-san-bernardino.md §3.2 fanOut() and
 * fonctionnalites-natives-san-bernardino.md §5 (persistence-over-2-polls is handled
 * separately via event_candidates before this ever runs). Returns true if the
 * notification should be suppressed.
 */
export function shouldSuppress(ctx: SuppressionContext): boolean {
  if (ctx.quietHours && isInQuietHours(ctx.quietHours, ctx.now) && ctx.priority !== "high") {
    return true;
  }
  if (ctx.lastSentAt) {
    const minutesSince = (ctx.now.getTime() - ctx.lastSentAt.getTime()) / 60000;
    if (minutesSince < cooldownFor(ctx.type)) return true;
  }
  if (exceedsDailyCap(ctx.dailyCount, ctx.priority)) return true;
  return false;
}
