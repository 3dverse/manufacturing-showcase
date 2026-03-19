import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelBox = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
};
