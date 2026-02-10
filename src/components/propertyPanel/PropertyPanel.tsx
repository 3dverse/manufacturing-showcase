//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import { StationContent } from "./station/StationContent";

//------------------------------------------------------------------------------
import type { StationId } from "@/content/stations/enum";

//------------------------------------------------------------------------------
export const PropertyPanel = ({
    station_id,
    hoveredEntity,
    pickedEntity,
}: {
    station_id: StationId;
    hoveredEntity: { entity: Entity } | null;
    pickedEntity: { entity: Entity } | null;
}) => {
    //--------------------------------------------------------------------------
    return (
        <ViewerPanel className="w-80 rounded-e-none translate-x-4 pointer-events-auto wrap-anywhere">
            <StationContent station_id={station_id} />
            <div hidden className="bg-ground">
                {hoveredEntity?.entity && (
                    <div>
                        <h3 className="text-sm font-semibold">Hovered Entity</h3>
                        <p className="text-sm text-muted">{hoveredEntity.entity.name}</p>
                    </div>
                )}
                {pickedEntity?.entity && (
                    <div>
                        <h3 className="text-sm font-semibold">Picked Entity</h3>
                        <p className="text-sm text-muted">{pickedEntity.entity.name}</p>
                    </div>
                )}
            </div>
        </ViewerPanel>
    );
};
