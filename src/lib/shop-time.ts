// The shop's own clock: US Central time (America/Chicago), daylight saving
// included. Used for discount code end dates.
export const SHOP_TIME_ZONE = "America/Chicago";

/** How far a time zone is ahead of UTC at a given moment, in milliseconds. */
function offsetMs(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The last second of a calendar day ("2026-12-24") in shop time, as a UTC instant. */
export function endOfShopDay(day: string, timeZone = SHOP_TIME_ZONE): Date {
  const [y, m, d] = day.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d, 23, 59, 59);
  // Correct by the zone's offset at that moment (checked twice around clock changes).
  let t = wall - offsetMs(new Date(wall), timeZone);
  t = wall - offsetMs(new Date(t), timeZone);
  return new Date(t);
}

/** A stored instant shown as a date in shop time, e.g. "Dec 24, 2026". */
export const shopDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: SHOP_TIME_ZONE, month: "short", day: "numeric", year: "numeric" });
