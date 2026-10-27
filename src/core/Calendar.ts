export type ShiftDefinition = {
    name: string;
    start: string; // "HH:MM" 24-hour
    end: string; // "HH:MM" 24-hour
};

// Mirrors the generator defaults in server/sources/generator/config.ts
export const FACTORY_SHIFTS: ShiftDefinition[] = [
    { name: "First", start: "06:00", end: "14:00" },
    { name: "Second", start: "14:00", end: "22:00" },
];

// 0 = Sun … 6 = Sat — matches the generator workDays default
export const FACTORY_WORK_DAYS: number[] = [1, 2, 3, 4, 5];

// All schedule math is performed in this timezone so closed-period shading
// matches the factory clock regardless of the browser's locale.
export const FACTORY_TZ = "America/New_York";

// ---------------------------------------------------------------------------
// Timezone-aware helpers
// ---------------------------------------------------------------------------

function parseHHMM(hhmm: string): { h: number; m: number } {
    const [h, m] = hhmm.split(":").map(Number);
    return { h, m };
}

function getDateParts(ts: number, tz: string) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
    }).formatToParts(new Date(ts * 1000));
    const g = (type: string) => +(parts.find((p) => p.type === type)?.value ?? 0);
    return { year: g("year"), month: g("month"), day: g("day") };
}

// Convert a wall-clock datetime in `tz` to a unix timestamp.
// Uses the "double-conversion" trick: treat the local time as UTC, measure
// the offset Intl shows for that UTC instant, then subtract it.
function tzToUnix(year: number, month: number, day: number, hour: number, minute: number, tz: string): number {
    const approxMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    const shown = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    }).formatToParts(new Date(approxMs));
    const g = (type: string) => +(shown.find((p) => p.type === type)?.value ?? 0);
    const h = g("hour");
    const shownMs = Date.UTC(g("year"), g("month") - 1, g("day"), h === 24 ? 0 : h, g("minute"), g("second"));
    return (2 * approxMs - shownMs) / 1000;
}

// Unix timestamp of midnight on the calendar day containing `ts` in `tz`.
function midnightInTZ(ts: number, tz: string): number {
    const { year, month, day } = getDateParts(ts, tz);
    return tzToUnix(year, month, day, 0, 0, tz);
}

// Day of week (0 = Sun … 6 = Sat) for `ts` in `tz`.
function dayOfWeekInTZ(ts: number, tz: string): number {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(new Date(ts * 1000));
    return DAYS.indexOf(name);
}

// Unix timestamp for HH:MM on the calendar day containing `dayRef` in `tz`.
function shiftTimeInTZ(dayRef: number, hhmm: string, tz: string): number {
    const { h, m } = parseHHMM(hhmm);
    const { year, month, day } = getDateParts(dayRef, tz);
    return tzToUnix(year, month, day, h, m, tz);
}

// ---------------------------------------------------------------------------

/**
 * Returns all closed (non-working) intervals within [winStart, winEnd] as
 * unix second pairs. Includes nighttime gaps between/around shifts on work
 * days and full-day closures on non-work days.
 *
 * All day-boundary and shift calculations are performed in `tz` (default:
 * FACTORY_TZ) so the shading reflects the factory clock, not the browser's.
 */
export function buildClosedIntervals(
    winStart: number,
    winEnd: number,
    shifts: ShiftDefinition[] = FACTORY_SHIFTS,
    workDays: number[] = FACTORY_WORK_DAYS,
    tz: string = FACTORY_TZ,
): { start: number; end: number }[] {
    const closed: { start: number; end: number }[] = [];

    let dayStart = midnightInTZ(winStart, tz);

    while (dayStart < winEnd) {
        // Use local noon to identify the day safely across DST transitions
        const midday = dayStart + 43200;
        const { year, month, day } = getDateParts(midday, tz);
        const dayEnd = tzToUnix(year, month, day + 1, 0, 0, tz);

        if (!workDays.includes(dayOfWeekInTZ(midday, tz))) {
            closed.push({ start: dayStart, end: dayEnd });
        } else {
            const openIntervals = shifts
                .map((s) => ({
                    start: shiftTimeInTZ(midday, s.start, tz),
                    end: shiftTimeInTZ(midday, s.end, tz),
                }))
                .sort((a, b) => a.start - b.start);

            let prev = dayStart;
            for (const open of openIntervals) {
                if (open.start > prev) closed.push({ start: prev, end: open.start });
                prev = open.end;
            }
            if (prev < dayEnd) closed.push({ start: prev, end: dayEnd });
        }

        dayStart = dayEnd;
    }

    return closed
        .map(({ start, end }) => ({ start: Math.max(start, winStart), end: Math.min(end, winEnd) }))
        .filter(({ start, end }) => start < end);
}
