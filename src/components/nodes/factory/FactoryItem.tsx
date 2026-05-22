import { useMemo } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { Triangle } from "@/components/common/icons/Triangle";
import { BadgeOEE } from "@/components/common/BadgeOEE";
import { KeyStatusIndicators } from "@/components/nodes/factory/StatusIndicators";
import { ConnectedSystemsBadge } from "@/components/connectedSystems/ConnectedSystemsBadge";
import { StoppageCallout } from "@/components/scadaEvents/StoppageCallout";
import type { StoppageEvent } from "@/components/scadaEvents/StoppageCallout";

//------------------------------------------------------------------------------
import { useFactoryOEE } from "@/hooks/useFactoryOEE";
import { useNavigationStore } from "@/store/useNavigationStore";
import { useTimelineStore } from "@/store/useTimelineStore";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { MEDIA_QUERIES, useMediaQuery } from "@/utils/useMediaQuery";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryItem = ({ factoryItem, stoppage }: { factoryItem: Factory; stoppage?: StoppageEvent | null }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const span = useTimelineStore((s) => s.span);
    const present = useTimelineStore((s) => s.present);
    const oee = useFactoryOEE(span, present);
    const navigate = useNavigationStore((state) => state.navigate);
    const isMobile = useMediaQuery(MEDIA_QUERIES.MOBILE);

    //--------------------------------------------------------------------------
    // Memos
    const className = useMemo(() => {
        return factoryItem.enabled ? "rounded-b-none!" : "grayscale pointer-events-none opacity-50";
    }, [factoryItem.enabled]);

    //--------------------------------------------------------------------------
    const enterFullscreenOnMobile = () => {
        if (!window.matchMedia(MEDIA_QUERIES.MOBILE).matches) return;
        if (!document.fullscreenEnabled || document.fullscreenElement) return;

        void document.documentElement.requestFullscreen().catch(() => {
            // Browsers can reject fullscreen requests depending on runtime policies.
        });
    };

    //--------------------------------------------------------------------------
    const openFactory = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
        e.preventDefault();
        if (!factoryItem.enabled) return;

        //TODO: if incident is active, open incident

        const targetRoute = `/${factoryItem.slug}`;
        enterFullscreenOnMobile();
        navigate(targetRoute);
    };

    //--------------------------------------------------------------------------
    const As = factoryItem.enabled ? "a" : "span";

    const showKeyStatusIndicators = false;

    //--------------------------------------------------------------------------
    // Render
    return (
        <As
            //TODO: keep link but if incident is active, open incident
            href={`/${factoryItem.slug}`}
            onClick={isMobile ? openFactory : undefined}
            {...(!factoryItem.enabled ? { "data-disabled": true } : {})}
            className={cn(
                "relative flex w-full h-full text-left bg-slate-50 rounded-md border-b border-slate-200/50 md:rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group",
                "data-disabled:grayscale data-disabled:pointer-events-none data-disabled:opacity-40 data-disabled:border-slate-200",
                "shadow-none md:[&:not([data-disabled])]:shadow-md md:[&:not([data-disabled])]:shadow-accent/8 ",
                "hover:[&:not([data-disabled])]:shadow-lg hover:[&:not([data-disabled])]:shadow-accent/10",
                className,
            )}
        >
            <div className="flex flex-col md:flex-row grow">
                {factoryItem.video && (
                    <video
                        src={factoryItem.video}
                        className="w-full md:w-43 h-auto max-h-24 md:max-h-none object-cover object-center bg-slate-800 border-r border-slate-100"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                )}

                <div className="grow flex pl-4 md:pl-7 pr-4 md:pr-3 pt-2 md:pt-5 pb-3">
                    <div className="grow flex flex-col md:flex-row items-start justify-between gap-y-5">
                        <div className="grow flex flex-col gap-y-1 h-full">
                            <h2 className="text-accent-900 text-xl md:text-2xl font-semibold group-hover:text-accent transition-colors">
                                {factoryItem.name}
                            </h2>
                            <div className="grow flex flex-col lg:flex-row items-start lg:items-baseline justify-between gap-x-3 gap-y-2">
                                <div className="flex items-center mt-2 text-sm text-accent">
                                    <ConnectedSystemsBadge data-scenario="tour-guide-2" className="mr-3" />
                                    <Icon icon={FaMapMarkerAlt} size="sm" className="mr-1" />
                                    <span className="text-xs">{factoryItem.location}</span>
                                </div>
                            </div>
                        </div>

                        {stoppage && (
                            <StoppageCallout
                                event={stoppage}
                                factorySlug={factoryItem.slug}
                                siteId={factoryItem.scene_id}
                                className="w-full md:max-w-70"
                            />
                        )}
                    </div>
                </div>
                <div className="flex">
                    {showKeyStatusIndicators && (
                        <div className="grid grid-cols-4 md:grid-cols-2 scale-85 grow">
                            <KeyStatusIndicators
                                keyStatus={{
                                    efficiency: 1,
                                    quality: 1,
                                    tracking: 1,
                                    maintenance: 2,
                                }}
                            />
                        </div>
                    )}
                    <FactoryItemOEE oee={oee} hasStoppage={!!stoppage} />
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
        </As>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function FactoryItemOEE({ oee, hasStoppage }: { oee: number | null; hasStoppage: boolean }) {
    return (
        <>
            <div className="block md:hidden group-data-disabled:hidden absolute top-0 right-0 bg-slate-800 m-1 rounded">
                <BadgeOEE oee={oee ?? 0} className="text-2xl p-2" />
            </div>
            <div
                className={cn(
                    "hidden md:flex stripes flex-col items-center justify-center w-full border-l overflow-hidden",
                    hasStoppage
                        ? "[--color:var(--color-warning-200)] border-warning-100"
                        : "[--color:var(--color-positive-300)] border-slate-100",
                )}
            >
                <div className="relative z-10 flex flex-col text-left px-6 py-3">
                    <p className={cn("text-3xl font-semibold", hasStoppage ? "text-warning-800" : "text-positive-800")}>
                        {oee ?? "—"}
                        <span className="text-base opacity-80 ml-px">{oee !== null ? "%" : ""}</span>
                    </p>
                    <p className="flex items-center gap-1">
                        OEE
                        <span
                            className={cn(
                                "text-xs -mt-0.5",
                                hasStoppage ? "text-warning-700/70" : "text-positive-700/70",
                            )}
                        >
                            7d
                        </span>
                        <Triangle className={cn(hasStoppage && "rotate-180 bg-warning-600")} />
                    </p>
                </div>
            </div>
        </>
    );
}
