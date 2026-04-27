import { useContext, useMemo } from "react";
import { faMapMarkerAlt } from "@fortawesome/sharp-regular-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { Triangle } from "@/components/common/icons/Triangle";
import { BadgeOEE } from "@/components/common/BadgeOEE";
import { KeyStatusIndicators } from "@/components/nodes/factory/StatusIndicators";
import { ConnectedSystemsBadge } from "@/components/connectedSystems/ConnectedSystemsBadge";
import { IncidentCallout } from "@/components/incidents/IncidentCallout";

//------------------------------------------------------------------------------
import { ScenarioContext } from "@/contexts/ScenariosContext";
import { useFactoryItemOEE } from "@/hooks/useFactoryItemOEE";
import { useNavigationStore } from "@/store/useNavigationStore";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { MEDIA_QUERIES, useMediaQuery } from "@/utils/useMediaQuery";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryItem = ({ factoryItem }: { factoryItem: Factory }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const oee = useFactoryItemOEE(factoryItem.scene_id);
    const navigate = useNavigationStore((state) => state.navigate);
    const { activeStep } = useContext(ScenarioContext);
    const incident = activeStep?.incident;
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

                <div className="block md:hidden group-data-disabled:hidden absolute top-0 right-0 bg-slate-800 m-1 rounded">
                    <BadgeOEE oee={oee ?? 0} className="text-2xl p-2" />
                </div>

                <div className="grow flex pl-4 md:pl-7 pr-4 md:pr-3 pt-2 md:pt-5 pb-3">
                    <div className="grow flex items-start justify-between">
                        <div className="grow flex flex-col gap-y-1 h-full">
                            <h2 className="text-xl md:text-2xl font-semibold group-hover:text-accent transition-colors">
                                {factoryItem.name}
                            </h2>
                            <div className="grow flex flex-col lg:flex-row items-start lg:items-baseline justify-between gap-x-3 gap-y-2">
                                <div className="flex items-center mt-2 text-sm text-accent">
                                    <ConnectedSystemsBadge className="mr-3" />
                                    <Icon icon={faMapMarkerAlt} size="sm" className="mr-1" />
                                    <span className="text-xs">{factoryItem.location}</span>
                                </div>
                            </div>
                        </div>

                        {incident && <IncidentCallout incidentConfig={incident} />}
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
                    <div className="hidden md:flex stripes [--color:var(--color-positive-300)] flex-col items-center justify-center w-full border-l border-slate-100 overflow-hidden">
                        <div className="relative z-10 flex flex-col text-left px-6 py-3">
                            <p className="text-3xl font-semibold text-positive-800">
                                {oee ?? "—"}
                                <span className="text-base opacity-80 ml-px">{oee !== null ? "%" : ""}</span>
                            </p>
                            <p>
                                OEE <Triangle />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
        </As>
    );
};
