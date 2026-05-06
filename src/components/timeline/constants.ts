//------------------------------------------------------------------------------
// Zoom levels
//------------------------------------------------------------------------------
import type { EntityColorSet } from "@/content/entityColors";
import type { EntityType } from "@/core/Correlation";
import type { ZoomKey } from "@/store/useTimelineStore";

export type BarStyle = "bar" | "line";
export type StackingStyle = "swimlane" | "overlap";
export type AreaType = "production" | "delivery" | "reception" | "storage" | "quality" | "other";

export type BarItem = {
    id: string;
    entityType: EntityType;
    targetNodeHash?: string;
    start: number;
    end: number;
    colors: EntityColorSet;
    isPartial?: boolean;
    /** Shown inside the bar when `barStyle === "bar"` (e.g. manufacturing order number). */
    inlineLabel?: string;
};

export const ZOOMS: { key: ZoomKey; label: string; days: number }[] = [
    { key: "1D", label: "1D", days: 1 },
    { key: "1W", label: "1W", days: 7 },
    { key: "2W", label: "2W", days: 14 },
    { key: "1M", label: "1M", days: 30 },
    { key: "3M", label: "3M", days: 90 },
    //{ key: "6M", label: "6M", days: 180 },
];

//------------------------------------------------------------------------------
// Playback speeds
//------------------------------------------------------------------------------
export const PLAYBACK_SPEEDS = [1, 60, 300] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

//------------------------------------------------------------------------------
// Layout constants
//------------------------------------------------------------------------------

export const AXIS_H = 22;
export const ROW_H = 22;
export const ROW_H_LINE = 8;
export const ROW_GAP = 4;
export const BAR_H = 12;
export const LINE_H = 4;
