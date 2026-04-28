//------------------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

//------------------------------------------------------------------------------
import { ManufacturingOrderProgressBar } from "@/components/manufacturingOrders/ManufacturingOrderProgressBar";
import { ManufacturingOrderDetailsPanel } from "./CarouselItemDetails";
import { TimeBadge } from "./TimeBadge";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
import { orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";

//------------------------------------------------------------------------------
const DETAILS_DRAG_DISTANCE = 140;
const DETAILS_SWIPE_THRESHOLD = 48;

//------------------------------------------------------------------------------
type ManufacturingOrdersCarouselItemProps = {
    order: Order;
    now: number;
    isSelected?: boolean;
    isDetailsOpen?: boolean;
    onClick?: () => void;
    onDetailsToggle?: (isOpen: boolean) => void;
};

//------------------------------------------------------------------------------
export const ManufacturingOrdersCarouselItem = ({
    order,
    now,
    isSelected = false,
    isDetailsOpen = false,
    onClick,
    onDetailsToggle,
}: ManufacturingOrdersCarouselItemProps) => {
    //--------------------------------------------------------------------------
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [dragDeltaY, setDragDeltaY] = useState(0);
    const [isDraggingDetails, setIsDraggingDetails] = useState(false);
    const pointerStartRef = useRef<{
        x: number;
        y: number;
        isVerticalDrag: boolean;
        startedOpen: boolean;
    } | null>(null);
    const dragDeltaYRef = useRef(0);
    const suppressClickRef = useRef(false);

    //--------------------------------------------------------------------------
    const isNotStarted = order.status.name === orderStatus.planned.name;
    const nowDate = new Date(now);
    const endRelative = timeAgo(order.endDate, nowDate);
    const endRelativeWithoutIn = endRelative.startsWith("in ") ? endRelative.slice(3) : endRelative;
    const endLabel = order.endDate.getTime() <= now ? `Ended ${endRelative}` : `End in ${endRelativeWithoutIn}`;
    const statusTone =
        order.status.name === orderStatus.completed.name
            ? "text-positive-700"
            : order.status.name === orderStatus.inProgress.name
              ? "text-accent"
              : order.status.name === orderStatus.cancelled.name
                ? "text-negative-900"
                : "text-neutral/50";

    //--------------------------------------------------------------------------
    const unitsDisplay = useMemo(() => {
        if (order.status.name === orderStatus.completed.name) {
            return order.unitsCompleted;
        }
        if (order.status.name === orderStatus.inProgress.name) {
            return (
                <>
                    {order.unitsCompleted}
                    <span className="pl-1 text-2xl font-semibold tracking-normal">/{order.unitsPlanned}</span>
                </>
            );
        }
        return order.unitsPlanned;
    }, [order.status.name, order.unitsCompleted, order.unitsPlanned]);

    //--------------------------------------------------------------------------
    const unitsLabel = useMemo(() => {
        if (order.status.name === orderStatus.completed.name) {
            return "Units shipped";
        }
        if (order.status.name === orderStatus.inProgress.name) {
            return "Units ready to ship";
        }
        return "Units planned";
    }, [order.status.name]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (!isDetailsOpen) {
            setIsLoadingDetails(false);
            return;
        }

        setIsLoadingDetails(true);
        const timeoutId = window.setTimeout(() => setIsLoadingDetails(false), 550);

        return () => window.clearTimeout(timeoutId);
    }, [isDetailsOpen, order.ref]);

    //--------------------------------------------------------------------------
    const detailsProgress = useMemo(() => {
        if (!isDraggingDetails || !pointerStartRef.current) {
            return isDetailsOpen ? 1 : 0;
        }

        const startedOpen = pointerStartRef.current.startedOpen;
        if (startedOpen) {
            return Math.max(0, Math.min(1, 1 - Math.max(0, dragDeltaY) / DETAILS_DRAG_DISTANCE));
        }

        return Math.max(0, Math.min(1, Math.max(0, -dragDeltaY) / DETAILS_DRAG_DISTANCE));
    }, [dragDeltaY, isDetailsOpen, isDraggingDetails]);

    //--------------------------------------------------------------------------
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
        }
    };

    //--------------------------------------------------------------------------
    const resetDrag = () => {
        pointerStartRef.current = null;
        dragDeltaYRef.current = 0;
        setIsDraggingDetails(false);
        setDragDeltaY(0);
    };

    //--------------------------------------------------------------------------
    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (!onDetailsToggle) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        pointerStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            isVerticalDrag: false,
            startedOpen: isDetailsOpen,
        };
        suppressClickRef.current = false;
        dragDeltaYRef.current = 0;
        setDragDeltaY(0);
    };

    //--------------------------------------------------------------------------
    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const pointerStart = pointerStartRef.current;
        if (!pointerStart) return;

        const deltaX = event.clientX - pointerStart.x;
        const deltaY = event.clientY - pointerStart.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (!pointerStart.isVerticalDrag) {
            if (absDeltaX > absDeltaY || absDeltaY < 8) return;
            pointerStart.isVerticalDrag = true;
            setIsDraggingDetails(true);
        }

        suppressClickRef.current = true;
        dragDeltaYRef.current = deltaY;
        setDragDeltaY(deltaY);
    };

    //--------------------------------------------------------------------------
    const handlePointerUp = () => {
        const pointerStart = pointerStartRef.current;
        if (!pointerStart) return;

        if (pointerStart.isVerticalDrag) {
            const finalDeltaY = dragDeltaYRef.current;
            const shouldOpen =
                Math.abs(finalDeltaY) > DETAILS_SWIPE_THRESHOLD ? finalDeltaY < 0 : detailsProgress >= 0.5;

            if (shouldOpen || pointerStart.startedOpen) {
                onDetailsToggle?.(shouldOpen);
            }
        }

        resetDrag();
    };

    //--------------------------------------------------------------------------
    const handleClick = () => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }

        onClick?.();
    };

    //--------------------------------------------------------------------------
    return (
        <div
            data-order-ref={order.ref}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-pressed={onClick ? isSelected : undefined}
            className={cn(
                "pointer-events-auto snap-center shrink-0 w-[min(42rem,92%)] overflow-hidden rounded-md transition-[color,background-color,box-shadow,transform] duration-300 outline-none",
                onClick && "cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/70",
                // isSelected && "bg-slate-0/35 shadow-lg shadow-accent/15",
                statusTone,
            )}
            style={{ touchAction: "pan-x" }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={resetDrag}
        >
            <div className="px-1 pt-1 pb-3">
                <div className="flex justify-between items-end mb-2">
                    <p className="flex flex-col">
                        <span className="text-6xl font-bold tracking-tight leading-none -translate-x-px translate-y-1">
                            {unitsDisplay}
                        </span>
                        <span className="text-sm font-semibold">{unitsLabel}</span>
                    </p>
                    <div className="flex flex-col items-end gap-2">
                        <TimeBadge order={order} isPanelOpen={isDetailsOpen} />
                        <p className="font-normal text-xs text-right">
                            {isNotStarted ? `Start ${timeAgo(order.startDate, nowDate)}` : endLabel}
                        </p>
                    </div>
                </div>
                <ManufacturingOrderProgressBar order={order} size="lg" showClientName showDuration />
            </div>
            <div
                className={cn(
                    "grid px-1.5",
                    !isDraggingDetails && "transition-[grid-template-rows,opacity,transform] duration-300 ease-out",
                    detailsProgress > 0
                        ? "pointer-events-auto opacity-100 translate-y-0"
                        : "pointer-events-none opacity-0 translate-y-4",
                )}
                style={{ gridTemplateRows: `${detailsProgress}fr` }}
            >
                <div className="overflow-hidden">
                    <ManufacturingOrderDetailsPanel order={order} isLoading={isLoadingDetails} />
                </div>
            </div>
        </div>
    );
};
