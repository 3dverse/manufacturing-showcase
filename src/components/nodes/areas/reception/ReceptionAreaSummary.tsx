//------------------------------------------------------------------------------
import { PanelLabel } from "@/components/common/panel";

//------------------------------------------------------------------------------
import { useReceptionSummary } from "@/hooks/useReceptionSummary";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export function KpiRow({
    label,
    primary,
    secondary,
    className,
}: {
    label: string;
    primary: React.JSX.Element | string | number;
    secondary?: string;
    className?: string;
}) {
    return (
        <div className={cn("flex items-baseline justify-between gap-4", className)}>
            <PanelLabel className="text-xs shrink-0">{label}</PanelLabel>
            <div className="flex items-baseline gap-2 text-right">
                <span className="text-sm font-semibold tabular-nums leading-tight">{primary}</span>
                {secondary && <span className="text-2xs text-muted/70">{secondary}</span>}
            </div>
        </div>
    );
}

//------------------------------------------------------------------------------
export function ReceptionAreaSummary({ className }: { className?: string }) {
    const summary = useReceptionSummary();

    const processingCount = summary.processingReceipts.length;

    return (
        <div
            className={cn(
                "flex flex-col gap-3 min-w-56 transition-opacity duration-300",
                summary.isLoading && "opacity-40",
                className,
            )}
        >
            {/* In transit */}
            <div className="flex items-center justify-between">
                <PanelLabel className="text-xs">In transit</PanelLabel>
                <span
                    className={cn(
                        "text-lg font-semibold tabular-nums leading-none",
                        summary.activePOCount === 0 ? "text-muted/50" : "text-accent",
                    )}
                >
                    {summary.activePOCount}
                    <span className="text-xs font-normal text-muted/70 ml-1">
                        PO{summary.activePOCount !== 1 ? "s" : ""}
                    </span>
                </span>
            </div>

            {/* Processing */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <PanelLabel className="text-xs">Currently Processing</PanelLabel>
                    <span
                        className={cn(
                            "text-lg font-semibold tabular-nums leading-none",
                            processingCount === 0 ? "text-muted/50" : "text-positive",
                        )}
                    >
                        {processingCount}
                        <span className="text-xs font-normal text-muted/70 ml-1">
                            PO{processingCount !== 1 ? "s" : ""}
                        </span>
                    </span>
                </div>
                {summary.processingReceipts.map((r) => (
                    <div
                        key={r.receiptId}
                        className="flex items-baseline justify-between gap-2 pl-1 border-l-2 border-positive/30"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{r.itemId}</p>
                            <p className="text-2xs text-muted/70 truncate">{r.supplierName ?? "—"}</p>
                            <div className="relative mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-positive rounded-full transition-all duration-500"
                                    style={{ width: `${r.progress * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs tabular-nums">{r.quantity} units</p>
                            <p className="text-2xs text-muted/70 tabular-nums">{Math.round(r.progress * 100)}%</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
