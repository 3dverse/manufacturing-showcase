import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <h1 className={cn("mb-4 text-base text-accent font-medium tracking-wide uppercase", className)}>{children}</h1>
    );
};
