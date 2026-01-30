import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { dashboardApi } from "@/services/dashboardApi";

//------------------------------------------------------------------------------
const SYSTEMS = ["SAP", "MES", "WMS", "Process"] as const;
type SystemId = (typeof SYSTEMS)[number];

type ConnectionState = Record<SystemId, boolean>;

const DEFAULT_CONNECTIONS: ConnectionState = {
    SAP: true,
    MES: true,
    WMS: true,
    Process: false, // disconnected by default (e.g. simulate maintenance)
};

//------------------------------------------------------------------------------
export const ConnectedSystemsPanel: React.FC<{ className?: string }> = ({ className }) => {
    const [connections, setConnections] = useState<ConnectionState>(() => ({ ...DEFAULT_CONNECTIONS }));

    // Sync API with Process state (Process disconnected by default)
    useEffect(() => {
        dashboardApi.setProductionRunning(connections.Process);
    }, [connections.Process]);

    const toggle = (id: SystemId) => {
        setConnections((prev) => {
            const next = { ...prev, [id]: !prev[id] };
            if (id === "Process") dashboardApi.setProductionRunning(next.Process);
            return next;
        });
    };

    const isConnected = (id: SystemId): boolean => connections[id];

    return (
        <ViewerPanel
            className={cn(
                "appear-in-from-left opacity-0 [--animation-delay:1200ms] px-2 py-1.5 w-fit min-w-[120px] rounded-md pointer-events-auto",
                className,
            )}
        >
            <p className="px-px pb-1 text-2xs text-muted mb-px">Connected systems</p>
            <ul className="flex flex-col">
                {SYSTEMS.map((id) => {
                    const connected = isConnected(id);
                    return (
                        <li key={id}>
                            <Button
                                variant="ghost"
                                size="2xs"
                                className="group pl-[3px] relative w-full justify-start not-disabled:hover:bg-(--color)/10 rounded-full"
                                style={
                                    {
                                        "--color": connected ? "var(--color-positive-600)" : "var(--color-neutral-400)",
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
                                        connected ? "bg-positive-600 text-neutral-0" : "group-hover:bg-neutral-0",
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
                                        "text-xs text-default transition-opacity",
                                        connected ? "opacity-100" : "opacity-60 group-hover:opacity-100",
                                    )}
                                >
                                    {id}
                                </span>
                            </Button>
                        </li>
                    );
                })}
            </ul>
        </ViewerPanel>
    );
};
