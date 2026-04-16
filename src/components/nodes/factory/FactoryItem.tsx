import { useMemo } from "react";

//------------------------------------------------------------------------------
import { Triangle } from "@/components/common/icons/Triangle";

//------------------------------------------------------------------------------
import { useFactoryItemOEE } from "@/hooks/useFactoryItemOEE";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";
import { KeyStatusIndicators } from "@/components/dashboard/header/StatusIndicators";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryItem = ({ factoryItem }: { factoryItem: Factory }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const oee = useFactoryItemOEE(factoryItem.scene_id);

    //--------------------------------------------------------------------------
    // Memos
    const className = useMemo(() => {
        if (!factoryItem.enabled) return "grayscale pointer-events-none opacity-50";
    }, [factoryItem.enabled]);

    //--------------------------------------------------------------------------
    const As = factoryItem.enabled ? "a" : "span";

    //--------------------------------------------------------------------------
    // Render
    return (
        <As
            href={`/${factoryItem.slug}`}
            {...(!factoryItem.enabled ? { "data-disabled": true } : {})}
            className={cn(
                "relative flex w-full h-full text-left bg-slate-50 rounded-md border border-slate-200/50 md:rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group",
                "data-disabled:grayscale data-disabled:pointer-events-none data-disabled:opacity-40 data-disabled:border-slate-200",
                "[&:not([data-disabled])]:shadow-xl [&:not([data-disabled])]:shadow-accent/8",
                "hover:[&:not([data-disabled])]:shadow-2xl hover:[&:not([data-disabled])]:shadow-accent/16",
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
                <div className="grow pl-4 md:pl-7 pr-4 md:pr-5 pt-2 md:pt-5 pb-3 md:pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl md:text-2xl font-semibold mb-1 group-hover:text-accent transition-colors">
                                {factoryItem.name}
                            </h2>
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
                        </div>
                    </div>
                    {/* {factoryItem.description && (
                        <p className="text-sm text-subtle/80 mb-4">{factoryItem.description}</p>
                    )} */}
                </div>
                <div className="flex border-t md:border-t-0 border-slate-100">
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
                    <div className="relative flex flex-col items-center justify-center border-l border-slate-100 overflow-hidden">
                        <span
                            className={`
                            absolute h-full w-full shrink-0
                            starting:scale-200 scale-100 transition-all duration-300
                            bg-[repeating-linear-gradient(135deg,var(--color-positive-200)_0px,var(--color-positive-200)_1px,transparent_1px,transparent_6px)]
                            z-0
                        `}
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
