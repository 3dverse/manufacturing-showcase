import React, { useState, useRef, useEffect, type ReactNode } from "react";
import "./Tooltip.css";

//------------------------------------------------------------------------------
export interface TooltipProps {
    /** Whether tooltip is open */
    open?: boolean;
    /** The content to display in the tooltip */
    content: ReactNode;
    /** Whether to remove padding from the tooltip */
    noPadding?: boolean;
    /** Tooltip position relative to trigger */
    position?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
    /** Delay before showing tooltip (ms) */
    delay?: number;
    /** Whether tooltip is disabled */
    disabled?: boolean;
    /** Whether to use top-layer API for better positioning */
    useTopLayer?: boolean;
    /** Maximum width of the tooltip */
    maxWidth?: string;
    /** Whether tooltip is hoverable and stays visible when hovering over it */
    hoverable?: boolean;
    /** Delay before hiding tooltip when hoverable (ms) */
    hoverableHideDelay?: number;
    /** Offset distance from trigger element (px) */
    offset?: number;
    /** Whether to show arrow */
    showArrow?: boolean;
    /** Follow cursor */
    followCursor?: boolean;
    /** Custom className for the tooltip */
    className?: string;
    /** The trigger element */
    children: ReactNode;
}

//------------------------------------------------------------------------------
function Tooltip({
    open = false,
    content,
    position = "top",
    delay = 300,
    noPadding = false,
    disabled = false,
    useTopLayer = true,
    maxWidth = "320px",
    hoverable = false,
    hoverableHideDelay = 250,
    offset = 8,
    showArrow = true,
    followCursor = false,
    className = "",
    children,
}: TooltipProps) {
    //--------------------------------------------------------------------------
    const [isVisible, setIsVisible] = useState(open);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    //--------------------------------------------------------------------------
    const showTooltip = () => {
        if (disabled) return;

        // Clear any existing hide timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        timeoutRef.current = setTimeout(() => {
            // Set initial position before showing to avoid animation from top-left
            updatePosition();
            // Use requestAnimationFrame to ensure position is set before visibility
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, delay);
    };

    //--------------------------------------------------------------------------
    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        if (hoverable) {
            // If hoverable, delay hiding by hoverableHideDelay
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, hoverableHideDelay);
        } else {
            // If not hoverable, hide immediately
            setIsVisible(false);
        }
    };

    //--------------------------------------------------------------------------
    const handleTooltipMouseEnter = () => {
        if (hoverable && hideTimeoutRef.current) {
            // Cancel hide timeout when hovering over tooltip
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    //--------------------------------------------------------------------------
    const handleTooltipMouseLeave = () => {
        if (hoverable) {
            // Start hide timeout when leaving tooltip
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, hoverableHideDelay);
        }
    };

    //--------------------------------------------------------------------------
    const handleTooltipMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (followCursor) {
            const mouseX = e.clientX - (tooltipRef.current?.getBoundingClientRect().left ?? 0);
            tooltipRef.current?.style.setProperty("--follow-cursor-mouse-x", `${mouseX}px`);
        }
    };

    //--------------------------------------------------------------------------
    const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        tooltipRect.width = tooltipRef.current.offsetWidth;
        tooltipRect.height = tooltipRef.current.offsetHeight;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = 0;
        let y = 0;

        // Calculate position based on the position prop
        switch (position) {
            case "top":
                x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                y = triggerRect.top - tooltipRect.height - offset;
                break;
            case "bottom":
                x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                y = triggerRect.bottom + offset;
                break;
            case "left":
                x = triggerRect.left - tooltipRect.width - offset;
                y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                break;
            case "right":
                x = triggerRect.right + offset;
                y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                break;
            case "top-start":
                x = triggerRect.left;
                y = triggerRect.top - tooltipRect.height - offset;
                break;
            case "top-end":
                x = triggerRect.right - tooltipRect.width;
                y = triggerRect.top - tooltipRect.height - offset;
                break;
            case "bottom-start":
                x = triggerRect.left;
                y = triggerRect.bottom + offset;
                break;
            case "bottom-end":
                x = triggerRect.right - tooltipRect.width;
                y = triggerRect.bottom + offset;
                break;
        }

        // Ensure tooltip stays within viewport
        if (x < offset) x = offset;
        if (x + tooltipRect.width > viewportWidth - offset) {
            x = viewportWidth - tooltipRect.width - offset;
        }
        if (y < offset) y = offset;
        if (y + tooltipRect.height > viewportHeight - offset) {
            y = viewportHeight - tooltipRect.height - offset;
        }

        setTooltipPosition({ x, y });
    };

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (isVisible) {
            updatePosition();

            const handleResize = () => updatePosition();
            const handleScroll = () => updatePosition();

            window.addEventListener("resize", handleResize);
            window.addEventListener("scroll", handleScroll, true);

            return () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener("scroll", handleScroll, true);
            };
        }
    }, [isVisible, position]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    //--------------------------------------------------------------------------
    const tooltipStyle: React.CSSProperties = {
        position: useTopLayer ? "fixed" : "absolute",
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        maxWidth,
        zIndex: useTopLayer ? 2147483647 : 1000, // top-layer uses maximum z-index
    };

    //--------------------------------------------------------------------------
    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onMouseMove={followCursor ? handleTooltipMouseMove : undefined}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                style={{ display: "inline-block" }}
            >
                {children}
            </div>

            {/* Always render tooltip but control visibility with CSS */}
            <div
                ref={tooltipRef}
                className={`tooltip ${className} ${isVisible ? "tooltip-visible" : ""} ${hoverable ? "tooltip-hoverable" : ""}`}
                style={{
                    ...tooltipStyle,
                    pointerEvents: hoverable && isVisible ? "auto" : "none",
                }}
                role="tooltip"
                data-position={position}
                aria-hidden={!isVisible}
                onMouseEnter={hoverable ? handleTooltipMouseEnter : undefined}
                onMouseLeave={hoverable ? handleTooltipMouseLeave : undefined}
            >
                <div className={`tooltip-content ${noPadding ? "p-0!" : ""}`}>{content}</div>
                {showArrow && (
                    <div
                        className="tooltip-arrow"
                        style={
                            {
                                "--tooltip-offset": `${offset}px`,
                            } as React.CSSProperties
                        }
                    />
                )}
            </div>
        </>
    );
}

export default Tooltip;
