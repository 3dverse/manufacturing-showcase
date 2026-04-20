//------------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { orders, orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";
import { SalesOrderProgressBar } from "./SalesOrderProgressBar";

//------------------------------------------------------------------------------
type SalesOrderCarouselProps = {
    onOrderSelect?: (order: Order) => void;
};

//------------------------------------------------------------------------------
export const SalesOrderCarousel = ({ onOrderSelect }: SalesOrderCarouselProps) => {
    //--------------------------------------------------------------------------
    const scrollerRef = useRef<HTMLDivElement>(null);
    const scrollEndTimeoutRef = useRef<number | null>(null);
    const initializedRef = useRef(false);

    //--------------------------------------------------------------------------
    const [now, setNow] = useState(() => Date.now());

    //--------------------------------------------------------------------------
    const sortedOrders = useMemo(() => [...orders].sort((a, b) => a.startDate.getTime() - b.startDate.getTime()), []);
    const initialOrderRef = useMemo(
        () =>
            sortedOrders.find((order) => order.status.name === orderStatus.inProgress.name)?.ref ??
            sortedOrders[0]?.ref ??
            null,
        [sortedOrders],
    );

    //--------------------------------------------------------------------------
    useEffect(() => {
        const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    //--------------------------------------------------------------------------
    const pickCenteredOrder = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const containerRect = scroller.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;
        const cards = Array.from(scroller.querySelectorAll<HTMLDivElement>("[data-order-ref]"));

        if (!cards.length) return;

        const centeredCard = cards.reduce<{ ref: string | null; distance: number }>(
            (closest, card) => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.left + rect.width / 2;
                const distance = Math.abs(cardCenter - containerCenter);
                const ref = card.dataset.orderRef ?? null;

                if (distance < closest.distance) {
                    return { ref, distance };
                }
                return closest;
            },
            { ref: null, distance: Number.POSITIVE_INFINITY },
        );

        const selectedOrder = sortedOrders.find((order) => order.ref === centeredCard.ref);
        if (selectedOrder) {
            onOrderSelect?.(selectedOrder);
        }
    }, [onOrderSelect, sortedOrders]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const handleScroll = () => {
            if (scrollEndTimeoutRef.current) {
                window.clearTimeout(scrollEndTimeoutRef.current);
            }
            scrollEndTimeoutRef.current = window.setTimeout(() => {
                pickCenteredOrder();
            }, 140);
        };

        scroller.addEventListener("scroll", handleScroll, { passive: true });
        pickCenteredOrder();

        return () => {
            scroller.removeEventListener("scroll", handleScroll);
            if (scrollEndTimeoutRef.current) {
                window.clearTimeout(scrollEndTimeoutRef.current);
            }
        };
    }, [pickCenteredOrder]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        if (initializedRef.current) return;
        if (!initialOrderRef) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        const target = scroller.querySelector<HTMLDivElement>(`[data-order-ref="${initialOrderRef}"]`);
        if (!target) return;

        target.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
        initializedRef.current = true;
    }, [initialOrderRef]);

    //--------------------------------------------------------------------------
    return (
        <div className="relative">
            <span className="absolute bottom-0 left-0 w-full h-[140%] scale-200 bg-linear-to-t from-slate-0 to-transparent -z-1" />
            <div
                ref={scrollerRef}
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-2 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="shrink-0 w-3 snap-start" />
                {sortedOrders.map((order) => (
                    <SalesOrderCarouselItem key={order.ref} order={order} now={now} />
                ))}
                <div className="shrink-0 w-3 snap-end" />
            </div>
        </div>
    );
};

//------------------------------------------------------------------------------
const SalesOrderCarouselItem = ({ order, now }: { order: Order; now: number }) => {
    const statusTone =
        order.status.name === orderStatus.completed.name
            ? "text-positive-700"
            : order.status.name === orderStatus.inProgress.name
              ? "text-accent"
              : order.status.name === orderStatus.cancelled.name
                ? "text-negative-900"
                : "text-neutral/50";

    // const progressColor =
    //     order.status.name === orderStatus.completed.name
    //         ? "bg-positive-600"
    //         : order.status.name === orderStatus.inProgress.name
    //             ? "bg-accent-600 stripes [--color:var(--color-accent-400)]"
    //             : order.status.name === orderStatus.cancelled.name
    //                 ? "bg-negative-500"
    //                 : "bg-neutral-500";

    return (
        <div
            data-order-ref={order.ref}
            className={cn("pointer-events-auto snap-center shrink-0 w-[min(42rem,92%)] overflow-hidden", statusTone)}
        >
            <div className="flex flex-col mb-2">
                <p className="text-6xl font-bold tracking-tight leading-none -translate-x-px">
                    {order.unitsCompleted}
                    <span className="pl-1 text-2xl font-semibold tracking-normal">/{order.unitsPlanned}</span>
                </p>
                <div className="flex justify-between">
                    <p className="text-xs md:text-sm font-medium">Units ready to ship</p>
                    <p className="text-xs md:text-sm font-medium">{formatEndInLabel(order.endDate, now)}</p>
                </div>
            </div>
            <SalesOrderProgressBar order={order} size="lg" showClientName />
            {/* <div className="relative bg-accent-900/75 text-accent-50 rounded overflow-hidden">
                <div className={cn("absolute inset-y-0 left-0", progressColor)} style={{ width: `${progress}%` }} />
                <div className="relative z-1 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-1.5 text-sm">
                    <p className="font-semibold whitespace-nowrap">{order.ref}</p>
                    <p className="opacity-80 truncate">{order.client}</p>
                    <p className="font-semibold whitespace-nowrap">{progress}%</p>
                </div>
            </div> */}
        </div>
    );
};

//------------------------------------------------------------------------------
const formatEndInLabel = (endDate: Date, now: number) => {
    const remainingMs = endDate.getTime() - now;
    if (remainingMs <= 0) return "Ended";

    const totalMinutes = Math.ceil(remainingMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `End in ${minutes}min`;
    }
    return `End in ${hours}h ${minutes}min`;
};
