import React, { useState, useEffect } from "react";
import { FaClock, FaTh } from "react-icons/fa";

//------------------------------------------------------------------------------
import { PanelWrapper } from "@/components/common/panel/PanelWrapper";
import { Icon } from "@/components/common/Icon";
import { KeyStatusIndicators } from "../../../nodes/factory/StatusIndicators";

//------------------------------------------------------------------------------
import { type KeyStatus } from "@/services/dashboardApi";
import { useFactoryStore } from "@/store/useFactoryStore";
import { useNavigationStore } from "@/store/useNavigationStore";

//------------------------------------------------------------------------------
interface HeaderProps {
    keyStatus: KeyStatus;
}

//------------------------------------------------------------------------------
export const Header: React.FC<HeaderProps> = ({ keyStatus }) => {
    //--------------------------------------------------------------------------
    const { currentFactory: factory } = useFactoryStore();
    const { navigate } = useNavigationStore();

    //--------------------------------------------------------------------------
    const [now, setNow] = useState<Date>(() => new Date());

    //--------------------------------------------------------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    //--------------------------------------------------------------------------
    if (!factory) {
        return null;
    }
    //--------------------------------------------------------------------------
    return (
        <PanelWrapper
            as="header"
            className="@container relative flex gap-2 pl-15 py-3 bg-neutral-0/70 border-b border-muted/90 shadow-lg/3"
        >
            <div className="absolute top-4 @lg:top-7 left-4 flex items-center gap-2">
                <button
                    className="px-1 py-px aspect-square rounded-sm text-accent bg-accent-50 hover:bg-accent-100 transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <Icon icon={FaTh} />
                </button>
            </div>

            <div className="grow flex flex-col items-stretch @lg:flex-row @lg:justify-between @lg:items-start gap-2">
                <div className="grow shrink-0 @lg:self-center flex flex-col items-baseline justify-between">
                    <p className="font-family-heading text-lg font-bold text-default">{factory.name}</p>
                    <div className="flex gap-2 text-2xs text-muted">
                        <p className="">{factory.location}</p>
                        <p className="tabular-nums">
                            <Icon icon={FaClock} size="sm" className="mr-1" />
                            {now.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                timeZone: "Europe/Paris",
                            })}
                        </p>
                    </div>
                </div>

                <KeyStatusIndicators keyStatus={keyStatus} className="shrink" />
            </div>
        </PanelWrapper>
    );
};
