//------------------------------------------------------------------------------
import { useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { faAngleRight } from "@fortawesome/sharp-regular-svg-icons";
import { faExclamationTriangle } from "@fortawesome/sharp-solid-svg-icons";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import { Router } from "@/core/Router";
import Button from "@/components/common/Button";
import { PanelTitle } from "@/components/common/panel";

//------------------------------------------------------------------------------
import type { ProjectedDowntime } from "@/core/Projection";
import { useFocusStore } from "@/store/useFocusStore";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const CellIncident = ({ downtimeEvent }: { downtimeEvent: ProjectedDowntime }) => {
    //--------------------------------------------------------------------------
    // Store
    const { setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    // Handlers
    const clickHandler = useCallback((e: ReactMouseEvent) => {
        e.stopPropagation();
        setSelected({ type: "downtime", id: downtimeEvent.id });
        const { factorySlug } = Router.currentRoute();
        if (factorySlug)
            Router.replace({
                factorySlug,
                nodeSlug: downtimeEvent.workCenterId,
                itemSlug: downtimeEvent.id,
            });
    }, []);

    //--------------------------------------------------------------------------
    return (
        <>
            <PanelTitle className="capitalize text-warning-100">
                <Icon
                    icon={faExclamationTriangle}
                    className="absolute -top-2 left-3 text-2xs text-warning-100 bg-warning-700 rounded-full p-1"
                />
                <p className="text-xs">{downtimeEvent.reasonDescription}</p>
            </PanelTitle>
            <div className="transform-3d shrink-0 bg-warning-800 rounded-md">
                <Button
                    size="xs"
                    variant="outline"
                    className="button bg-warning-100 text-warning-600 hover:bg-warning-50 border-0 -translate-z-[.1px] hover:translate-z-0"
                    onClick={clickHandler}
                >
                    <Icon icon={faAngleRight} className="mr-2 text-xs" />
                    Take action
                </Button>
            </div>
        </>
    );
};
