//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";

//------------------------------------------------------------------------------
export const PropertyPanel = ({
    hoveredEntity,
    pickedEntity,
}: {
    hoveredEntity: { entity: Entity } | null;
    pickedEntity: { entity: Entity } | null;
}) => {
    //--------------------------------------------------------------------------
    return (
        <ViewerPanel className="w-72 px-3 py-2">
            <header className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">Property Panel</h2>
            </header>
            <div>
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
