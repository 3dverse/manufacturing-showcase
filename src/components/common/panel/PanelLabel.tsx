import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelLabel = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return <p className={cn("text-base text-subtle", className)}>{children}</p>;
};
