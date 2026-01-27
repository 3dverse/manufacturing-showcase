import React from "react";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ViewerPanel = ({ as = "div", className, children }: { as?: "div" | "aside"; className?: string; children: React.ReactNode }) => {
    const Element = as;
    return (
        <Element className={cn("bg-ground/80 shadow-[0_-4px_48px_-1px_rgba(0,0,0,0.1)] backdrop-blur-xl", className)}>
            {children}
        </Element>
    );
};
