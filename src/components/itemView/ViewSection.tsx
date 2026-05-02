import { cn } from "@/utils/cn";

export function ViewSection({
    title,
    children,
    className,
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("border border-slate-200/70 rounded-lg overflow-hidden", className)}>
            <div className="px-3 py-2 bg-slate-50/80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">{title}</span>
            </div>
            <div className="px-3 py-3">{children}</div>
        </div>
    );
}

export function MiniProgress({ pct }: { pct: number }) {
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${clamped}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-muted w-7 text-right">{pct}%</span>
        </div>
    );
}
