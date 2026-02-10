import React, { type HTMLElementType } from "react";
import { cn } from "@/utils/cn";

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
                "bg-ground/80 rounded-md border border-neutral-0 shadow-[0_-4px_56px_-1px_rgba(55,53,77,0.4)] backdrop-blur-xl",
                className,
            )}
            {...props}
        >
            {children}
        </Element>
    );
};
