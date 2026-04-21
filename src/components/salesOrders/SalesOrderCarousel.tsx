//------------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

//------------------------------------------------------------------------------
import { SalesOrderCarouselItem } from "./SalesOrderCarouselItem";

//------------------------------------------------------------------------------
import { orders, orderStatus } from "@/content/orders";
import type { Order } from "@/content/type";

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
