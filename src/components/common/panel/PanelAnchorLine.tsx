import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const PanelAnchorLine = ({ className }: { className?: string }) => {
    return <span className={cn("shrink-0 self-center h-10 w-[2px] bg-[#ffffff90]", className)} />;
};
