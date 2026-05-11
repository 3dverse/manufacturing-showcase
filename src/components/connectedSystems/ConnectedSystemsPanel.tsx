import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/sharp-solid-svg-icons";
import { faSlidersSimple } from "@fortawesome/sharp-light-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { dashboardApi } from "@/services/dashboardApi";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { CONNECTED_SYSTEMS, DEFAULT_CONNECTIONS, Systems, SYSTEM_FULL_NAMES } from "./content";
import type { ConnectionState, SystemId } from "./content";

//------------------------------------------------------------------------------
export const ConnectedSystemsPanel: React.FC<{ className?: string }> = ({ className }) => {
    //--------------------------------------------------------------------------
    const [connections, setConnections] = useState<ConnectionState>(() => ({ ...DEFAULT_CONNECTIONS }));

    //--------------------------------------------------------------------------
    // Sync API with Process state (Process disconnected by default)
    useEffect(() => {
        dashboardApi.setProductionRunning(connections[Systems.APS]);
    }, [connections]);

    //--------------------------------------------------------------------------
    const toggle = (id: SystemId) => {
        setConnections((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            if (id === Systems.APS) dashboardApi.setProductionRunning(next[Systems.APS]);
            return next;
        });
    };

    //--------------------------------------------------------------------------
    const isConnected = (id: SystemId): boolean => connections[id];

    //--------------------------------------------------------------------------
    return (
        <ViewerPanel
            className={cn(
                "appear-in-from-left opacity-0 [--animation-delay:1200ms] px-2 py-1.5 w-fit min-w-[120px] border-none rounded-lg pointer-events-auto",
                className,
            )}
        >
            <p className="px-px pb-px text-2xs text-muted mb-px">Connected systems</p>
            <ul className="flex flex-col">
                {CONNECTED_SYSTEMS.map((id) => {
                    const connected = isConnected(id);
                    return (
                        <li key={id}>
                            <Button
                                variant="ghost"
                                size="2xs"
                                title={SYSTEM_FULL_NAMES[id]}
                                className="group pl-[3px] pr-2 relative w-full justify-start not-disabled:hover:bg-(--color)/10 rounded-full"
                                style={
                                    {
                                        "--color": connected ? "var(--color-positive-700)" : "var(--color-neutral-400)",
                                    } as React.CSSProperties
                                }
                                onClick={() => toggle(id)}
                            >
                                <span
                                    className={cn(
                                        `absolute -left-2 w-3 h-px border-t border-(--color)/40 -z-10 transition-all`,
                                        connected ? "border-2" : "border",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "flex items-center justify-center border border-(--color) w-4 h-4 mr-2 rounded-full shrink-0 transition-colors",
                                        connected ? "bg-positive-700 text-neutral-0" : "group-hover:bg-neutral-0",
                                    )}
                                >
                                    <FontAwesomeIcon
                                        icon={faCheck}
                                        className={cn(
                                            "text-[7px]",
                                            connected ? "appear-in-from-bottom [--translate:4px]" : "opacity-0",
                                        )}
                                    />
                                </span>
                                <span
                                    className={cn(
                                        "grow text-left text-xs text-default transition-opacity",
                                        connected ? "opacity-100" : "opacity-60 group-hover:opacity-100",
                                    )}
                                >
                                    {id}
                                </span>
                                <Icon
                                    icon={faSlidersSimple}
                                    size="sm"
                                    fixedWidth
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                />
                            </Button>
                        </li>
                    );
                })}
            </ul>
        </ViewerPanel>
    );
};
