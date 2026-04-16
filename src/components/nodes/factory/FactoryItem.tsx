import { useMemo } from "react";
import { faCheck } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { Triangle } from "@/components/common/icons/Triangle";
import { KeyStatusIndicators } from "@/components/dashboard/header/StatusIndicators";

//------------------------------------------------------------------------------
import { useFactoryItemOEE } from "@/hooks/useFactoryItemOEE";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryItem = ({ factoryItem }: { factoryItem: Factory }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const oee = useFactoryItemOEE(factoryItem.scene_id);

    //--------------------------------------------------------------------------
    // Memos
    const className = useMemo(() => {
        return factoryItem.enabled ? "rounded-b-none!" : "grayscale pointer-events-none opacity-50";
    }, [factoryItem.enabled]);

    //--------------------------------------------------------------------------
    const As = factoryItem.enabled ? "a" : "span";

    const showKeyStatusIndicators = false;

    //--------------------------------------------------------------------------
    // Render
    return (
        <As
            href={`/${factoryItem.slug}`}
            {...(!factoryItem.enabled ? { "data-disabled": true } : {})}
            className={cn(
                "relative flex w-full h-full text-left bg-slate-50 rounded-md border border-slate-200/50 md:rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group",
                "data-disabled:grayscale data-disabled:pointer-events-none data-disabled:opacity-40 data-disabled:border-slate-200",
                "[&:not([data-disabled])]:shadow-md [&:not([data-disabled])]:shadow-accent/8",
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
                    <div className="grow flex items-start justify-between">
                        <div className="grow flex flex-col gap-y-1 h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-1 group-hover:text-accent transition-colors">
                                {factoryItem.name}
                            </h2>
                            <div className="grow flex flex-col lg:flex-row items-start lg:items-baseline justify-between gap-x-3 gap-y-2">
                                <div className="flex items-center text-sm text-accent">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <span className="text-xs">{factoryItem.location}</span>
                                </div>
                                <div className="self-end flex items-center gap-1 bg-positive-500 border border-positive-500/20 text-neutral-600 rounded-full">
                                    <Icon icon={faCheck} className="text-2xs pl-1.5 pr-5 text-positive-50" />
                                    {["SAP", "MES", "WMS", "Process"].map((system) => (
                                        <span
                                            key={system}
                                            className="bg-slate-0 h-full rounded-full px-1 py-px text-2xs -ml-5 pl-2 pr-5 last:pr-2 outline outline-positive-500/50"
                                        >
                                            {system}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex border-t md:border-t-0 border-slate-100">
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
                    <div className="relative flex flex-col items-center w-full justify-center border-l border-slate-100 overflow-hidden">
                        <span
                            className="stripes [--color:var(--color-positive-300)] absolute h-full w-full shrink-0 z-0"
                            aria-hidden
                        />
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
