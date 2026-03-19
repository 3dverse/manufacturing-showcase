import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const DataContainer = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <div
            className={cn(
                "flex flex-col gap-1 bg-slate-0/30 border border-slate-200/50 rounded-lg py-2 px-3",
                className,
            )}
        >
            {children}
        </div>
    );
};

//------------------------------------------------------------------------------
export const DataLabel = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return <p className={cn("text-sm text-subtle", className)}>{children}</p>;
};

//------------------------------------------------------------------------------
export const DataValue = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <p className={cn("text-xl font-semibold tabular-nums tracking-tight text-default", className)}>{children}</p>
    );
};
