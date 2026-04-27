import type { ShiftDefinition } from "./config";

export type ShiftInterval = { name: string; start: Date; end: Date };

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function parseHHMM(hhmm: string): { h: number; m: number } {
    const [h, m] = hhmm.split(":").map(Number);
    return { h, m };
}

export function startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
}

export function addMinutes(d: Date, mins: number): Date {
    return new Date(d.getTime() + mins * 60_000);
}

export function addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
}

function intervalsForDay(day: Date, shifts: ShiftDefinition[]): ShiftInterval[] {
    return shifts
        .map((s) => {
            const { h: sh, m: sm } = parseHHMM(s.start);
            const { h: eh, m: em } = parseHHMM(s.end);
            const start = new Date(day);
            start.setHours(sh, sm, 0, 0);
            const end = new Date(day);
            end.setHours(eh, em, 0, 0);
            return { name: s.name, start, end };
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns `from` unchanged if it falls inside an active shift on a work day,
 * otherwise returns the next shift start.  Use this for cursor advances between
 * consecutive items (PO → PO, WO → PO) so back-to-back scheduling is possible
 * within the same shift without introducing artificial gaps.
 */
export function clampToShift(from: Date, shifts: ShiftDefinition[], workDays: number[]): Date {
    const day = startOfDay(from);
    if (workDays.includes(day.getDay())) {
        for (const { start, end } of intervalsForDay(day, shifts)) {
            if (from >= start && from < end) return from;
        }
    }
    return nextShiftStart(from, shifts, workDays);
}

/** First shift-start timestamp at or after `from`. */
export function nextShiftStart(from: Date, shifts: ShiftDefinition[], workDays: number[]): Date {
    let day = startOfDay(from);
    for (let i = 0; i < 14; i++, day = addDays(day, 1)) {
        if (!workDays.includes(day.getDay())) continue;
        for (const { start } of intervalsForDay(day, shifts)) {
            if (start.getTime() >= from.getTime()) return start;
        }
    }
    return from; // fallback – should never be reached with sane config
}

/** Count of working minutes in the half-open interval [start, end). */
export function workingMinutes(start: Date, end: Date, shifts: ShiftDefinition[], workDays: number[]): number {
    if (end <= start) return 0;
    let total = 0;
    let day = startOfDay(start);
    while (day < end) {
        if (workDays.includes(day.getDay())) {
            for (const iv of intervalsForDay(day, shifts)) {
                const a = Math.max(iv.start.getTime(), start.getTime());
                const b = Math.min(iv.end.getTime(), end.getTime());
                if (b > a) total += (b - a) / 60_000;
            }
        }
        day = addDays(day, 1);
    }
    return total;
}

/**
 * Advance `from` by exactly `workMinutes` of working time, skipping
 * nights, weekends, and gaps between shifts.  If `from` falls outside
 * a shift it is first snapped to the next shift start (consuming 0 minutes).
 */
export function addWorkingMinutes(
    from: Date,
    workMinutes: number,
    shifts: ShiftDefinition[],
    workDays: number[],
): Date {
    let cursor = new Date(from);
    let remaining = workMinutes;

    for (let guard = 0; guard < 100_000; guard++) {
        const day = startOfDay(cursor);

        if (!workDays.includes(day.getDay())) {
            // Off-day — jump to the next work day's first shift
            cursor = nextShiftStart(cursor, shifts, workDays);
            continue;
        }

        const intervals = intervalsForDay(day, shifts);
        let advanced = false;

        for (const iv of intervals) {
            if (cursor < iv.start) {
                // Gap before this shift — snap forward, then re-evaluate
                cursor = new Date(iv.start);
                advanced = true;
                break;
            }
            if (cursor >= iv.start && cursor < iv.end) {
                const minsLeft = (iv.end.getTime() - cursor.getTime()) / 60_000;
                if (remaining <= minsLeft) {
                    return new Date(cursor.getTime() + remaining * 60_000);
                }
                remaining -= minsLeft;
                cursor = new Date(iv.end);
                advanced = true;
                break;
            }
        }

        if (!advanced) {
            // Past all shifts today — advance to the next shift start
            cursor = nextShiftStart(addDays(day, 1), shifts, workDays);
        }
    }

    return cursor; // safety fallback
}

/**
 * All shift intervals that overlap [start, end), each annotated with the
 * clamped overlap window.  Used to build OEE buckets.
 */
export function shiftCoverage(
    start: Date,
    end: Date,
    shifts: ShiftDefinition[],
    workDays: number[],
): Array<ShiftInterval & { overlapStart: Date; overlapEnd: Date }> {
    const result: Array<ShiftInterval & { overlapStart: Date; overlapEnd: Date }> = [];
    let day = startOfDay(start);
    while (day < end) {
        if (workDays.includes(day.getDay())) {
            for (const iv of intervalsForDay(day, shifts)) {
                const a = Math.max(iv.start.getTime(), start.getTime());
                const b = Math.min(iv.end.getTime(), end.getTime());
                if (b > a) {
                    result.push({
                        name: iv.name,
                        start: iv.start,
                        end: iv.end,
                        overlapStart: new Date(a),
                        overlapEnd: new Date(b),
                    });
                }
            }
        }
        day = addDays(day, 1);
    }
    return result;
}
