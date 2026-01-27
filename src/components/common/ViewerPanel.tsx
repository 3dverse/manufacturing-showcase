import React from "react";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ViewerPanel = ({ className, children }: { className?: string; children: React.ReactNode }) => {
    return (
        <div className={cn("bg-neutral-1000/80 shadow-[0_-4px_32px_-1px_rgba(0,0,0,0.1)] backdrop-blur-xl", className)}>
            {children}
        </div>
    );
};
