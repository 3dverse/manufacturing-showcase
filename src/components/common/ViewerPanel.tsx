import React, { type HTMLElementType } from "react";
import { cn } from "@/utils/cn";
import { PERFORMANCE_MODE } from "@/content/3dverse";

//------------------------------------------------------------------------------
export const ViewerPanel = ({
    as = "div",
    className,
    children,
    ...props
}: {
    as?: HTMLElementType;
    className?: string;
    children: React.ReactNode;
    [key: string]: unknown;
}) => {
    const Element = as;
    return (
        <Element
            className={cn(
                "rounded-md border border-slate-0/50 shadow-[0_-4px_56px_-1px_var(--color-slate-200)]",
                PERFORMANCE_MODE ? "bg-slate-0/97" : "bg-slate-0/80 backdrop-blur-xl",
                className,
            )}
            {...props}
        >
            {children}
        </Element>
    );
};
