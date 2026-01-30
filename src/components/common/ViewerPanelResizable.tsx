import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export const ViewerPanelResizable = ({
    as = "div",
    className,
    children,
    resizableFrom,
    defaultWidth = 600,
    minWidth = 200,
    maxWidth,
    ...props
}: {
    as?: "div" | "aside";
    className?: string;
    children: React.ReactNode;
    resizableFrom: "right" | "left";
    defaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
    [key: string]: unknown;
}) => {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(defaultWidth);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const delta = resizableFrom === "left" ? startXRef.current - e.clientX : e.clientX - startXRef.current;

            let newWidth = startWidthRef.current + delta;

            if (newWidth < minWidth) {
                newWidth = minWidth;
            }
            if (maxWidth && newWidth > maxWidth) {
                newWidth = maxWidth;
            }

            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizing, resizableFrom, minWidth, maxWidth]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;
    };

    const Element = as;
    const isResizableFromRight = resizableFrom === "right";

    return (
        <Element
            ref={panelRef as React.RefObject<HTMLDivElement>}
            className={cn(
                "bg-ground/92 shadow-[0_-4px_48px_-1px_rgba(0,0,0,0.1)] backdrop-blur-xl relative",
                className,
            )}
            style={{ width: `${width}px`, ...(props.style as React.CSSProperties) }}
            {...props}
        >
            {/* Resize handle */}
            <div
                className={cn(
                    "absolute top-0 bottom-0 w-1 cursor-col-resize z-10 transition-colors",
                    isResizableFromRight ? "right-0" : "left-0",
                    "hover:bg-accent-500/20 active:bg-accent-500/20",
                )}
                onMouseDown={handleMouseDown}
            >
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-1 h-12 rounded-full",
                        isResizableFromRight ? "left-0" : "right-0",
                        "bg-neutral-500/50 hover:bg-accent-500/80",
                    )}
                />
            </div>
            {children}
        </Element>
    );
};
