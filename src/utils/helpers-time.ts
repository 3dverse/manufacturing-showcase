//------------------------------------------------------------------------------
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = 60 * 60;
const DAY_IN_SECONDS = 24 * 60 * 60;

//------------------------------------------------------------------------------
const toDate = (value: Date | string) => new Date(value);

//------------------------------------------------------------------------------
const isSameCalendarDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const isNow = (date: Date, now: Date = new Date()) =>
    Math.floor(date.getTime() / 1000) === Math.floor(now.getTime() / 1000);
const isToday = (date: Date, now: Date = new Date()) => isSameCalendarDate(date, now);

//------------------------------------------------------------------------------
const isYesterday = (date: Date, now: Date) => {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return isSameCalendarDate(date, yesterday);
};

//------------------------------------------------------------------------------
const isTomorrow = (date: Date, now: Date) => {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return isSameCalendarDate(date, tomorrow);
};

//------------------------------------------------------------------------------
const formatTime = (date: Date, opts?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        ...opts,
    }).format(date);

//------------------------------------------------------------------------------
const formatDateWithTime = (date: Date, opts?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        ...opts,
    }).format(date);

//------------------------------------------------------------------------------
const formatDateWithYearAndTime = (date: Date, opts?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...opts,
    }).format(date);

//------------------------------------------------------------------------------
export const timeAgo = (date: Date | string, now: Date = new Date(), options?: Intl.DateTimeFormatOptions) => {
    const targetDate = toDate(date);
    const isPast = targetDate.getTime() <= now.getTime();
    const differenceInSeconds = Math.floor(Math.abs(now.getTime() - targetDate.getTime()) / 1000);
    const differenceInMinutes = Math.floor(differenceInSeconds / MINUTE_IN_SECONDS);
    const differenceInHours = Math.floor(differenceInSeconds / HOUR_IN_SECONDS);

    if (differenceInMinutes < 2) {
        return isPast ? "just now" : "in a moment";
    } else if (differenceInHours < 10) {
        if (differenceInHours >= 1) {
            return isPast ? `${differenceInHours} h ago` : `in ${differenceInHours} h`;
        } else if (differenceInMinutes >= 1) {
            return isPast ? `${differenceInMinutes} min ago` : `in ${differenceInMinutes} min`;
        } else {
            return isPast ? `${differenceInSeconds} s ago` : `in ${differenceInSeconds} s`;
        }
    } else {
        if (isToday(targetDate, now)) {
            return "today " + formatTime(targetDate, options); // today 5:39 PM
        }
        if (isPast && isYesterday(targetDate, now)) {
            return "yesterday " + formatTime(targetDate, options); // yesterday 5:39 PM
        }
        if (!isPast && isTomorrow(targetDate, now)) {
            return "tomorrow " + formatTime(targetDate, options); // tomorrow 5:39 PM
        }

        if (differenceInSeconds < 365 * DAY_IN_SECONDS) {
            return formatDateWithTime(targetDate, options); // 5 May 5:39 PM
        }
        return formatDateWithYearAndTime(targetDate, options); // 5 May 2020, 5:39 PM
    }
};

//------------------------------------------------------------------------------
export const areDatesSame = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

//------------------------------------------------------------------------------
export function fmtTs(ts: number, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(ts * 1000).toLocaleString(
        undefined,
        opts ?? {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
    );
}

//------------------------------------------------------------------------------
export function fmtDuration(seconds: number): string {
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (seconds < 86400) return m ? `${h}h ${m}m` : `${h}h`;
    const d = Math.floor(seconds / 86400);
    const hr = Math.round((seconds % 86400) / 3600);
    return hr ? `${d}d ${hr}h` : `${d}d`;
}

//------------------------------------------------------------------------------
export function formatDuration(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
}
