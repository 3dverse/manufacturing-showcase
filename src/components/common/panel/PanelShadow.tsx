import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelShadow = ({ className }: { className?: string }) => {
    return (
        <span
            className={cn("absolute -bottom-2 left-0 w-full h-3 bg-slate-0/85 rounded-[200%] blur-sm z-0", className)}
        />
    );
};
