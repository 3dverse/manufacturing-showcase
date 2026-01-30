import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return <div className={cn("bg-neutral-0/70 rounded border border-muted", className)}>{children}</div>;
};
