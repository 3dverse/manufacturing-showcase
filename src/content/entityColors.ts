import type { EntityType } from "@/core/Correlation";

// ---------------------------------------------------------------------------
// Entity color palette
// ---------------------------------------------------------------------------
// Edit this file to retheme all entity-type colors across the app.
// Each entry drives:
//   bar        — story bar (active + completed phases), includes border
//   barFuture  — story bar (future/planned phase), gray + dashed, includes border
//   barCurrent — story bar when asOf falls within the bar interval (happening now)
//   barHighlight — hover ring applied to story bars
//   band       — full-height background band overlay (in-scope), no border
//   bandCurrent — scrolling stripe overlay applied on top of band/bandDimmed when asOf is within the interval
//   bandDimmed — full-height background band overlay (out-of-scope / cross-scope)
//   header     — ItemViewPanel header background
//   focusedBorder — left border highlight in correlation panel

export type EntityColorSet = {
    bar: string;
    barFuture: string;
    barCurrent: string;
    barHighlight: string;
    band: string;
    bandCurrent: string;
    bandDimmed: string;
    header: string;
    focusedBorder: string;
};

export const ENTITY_COLORS = {
    salesOrder: {
        bar: "bg-accent border border-accent/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-accent border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-accent/50",
        band: "bg-accent",
        bandCurrent: "band-current",
        bandDimmed: "bg-accent/40",
        header: "bg-accent",
        focusedBorder: "border-l-accent",
    },
    productionOrder: {
        bar: "bg-emerald-500 border border-emerald-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-emerald-400 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-emerald-500/50",
        band: "bg-emerald-500",
        bandCurrent: "band-current",
        bandDimmed: "bg-emerald-900",
        header: "bg-emerald-600",
        focusedBorder: "border-l-emerald-600",
    },
    operation: {
        bar: "bg-teal-500 border border-teal-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-teal-400 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-teal-500/50",
        band: "bg-teal-500",
        bandCurrent: "band-current",
        bandDimmed: "bg-teal-900",
        header: "bg-teal-600",
        focusedBorder: "border-l-teal-600",
    },
    downtime: {
        bar: "bg-red-500 border border-red-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-red-400 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-red-500/50",
        band: "bg-red-400 border border-red-400/35",
        bandCurrent: "band-current",
        bandDimmed: "bg-red-400/50 ",
        header: "bg-red-600",
        focusedBorder: "border-l-red-600",
    },
    workOrder: {
        bar: "bg-amber-400 border border-amber-300/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-amber-300 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-amber-400/50",
        band: "bg-amber-400 border border-amber-400/35",
        bandCurrent: "band-current",
        bandDimmed: "bg-amber-400/50",
        header: "bg-amber-500",
        focusedBorder: "border-l-amber-500",
    },
    pickTask: {
        bar: "bg-orange-400 border border-orange-300/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-orange-300 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-orange-400/50",
        band: "bg-orange-400",
        bandCurrent: "band-current",
        bandDimmed: "bg-orange-800",
        header: "bg-orange-500",
        focusedBorder: "border-l-orange-500",
    },
    receipt: {
        bar: "bg-sky-500 border border-sky-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-sky-400 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-sky-500/50",
        band: "bg-sky-500",
        bandCurrent: "band-current",
        bandDimmed: "bg-sky-900",
        header: "bg-sky-600",
        focusedBorder: "border-l-sky-600",
    },
    putawayTask: {
        bar: "bg-cyan-500 border border-cyan-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-cyan-400 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-cyan-500/50",
        band: "bg-cyan-500",
        bandCurrent: "band-current",
        bandDimmed: "bg-cyan-900",
        header: "bg-cyan-600",
        focusedBorder: "border-l-cyan-600",
    },
    purchaseOrder: {
        bar: "bg-violet-500 border border-violet-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-violet-400 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-violet-500/50",
        band: "bg-violet-500",
        bandCurrent: "band-current",
        bandDimmed: "bg-violet-900",
        header: "bg-violet-600",
        focusedBorder: "border-l-violet-600",
    },
    allocation: {
        bar: "bg-blue-400 border border-blue-400/50",
        barFuture: "bg-slate-300 border border-slate-300/50 border-dashed",
        barCurrent: "bg-blue-300 border-2 border-white/60",
        barHighlight: "hover:ring-2 hover:ring-offset-0 hover:ring-blue-400/50",
        band: "bg-blue-400",
        bandCurrent: "band-current",
        bandDimmed: "bg-blue-900",
        header: "bg-blue-500",
        focusedBorder: "border-l-blue-500",
    },
} satisfies Record<EntityType, EntityColorSet>;
