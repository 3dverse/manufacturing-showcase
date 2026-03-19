//------------------------------------------------------------------------------
import { Fragment, useEffect, useState } from "react";
import type { Entity } from "@3dverse/livelink";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import { MOCK_STORAGE_DATA } from "@/components/nodes/areas/storage/content";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function AreaStorageOverlay({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    const [childrenEntities, setChildrenEntities] = useState<{
        screen: Entity[];
        case: Entity[];
        electronics: Entity[];
    }>({
        screen: [],
        case: [],
        electronics: [],
    });

    //--------------------------------------------------------------------------
    useEffect(() => {
        area.entity.getChildren().then((children) =>
            setChildrenEntities({
                screen: children.filter((c) => c.name.toLowerCase().includes("screen:")),
                case: children.filter((c) => c.name.toLowerCase().includes("case:")),
                electronics: children.filter((c) => c.name.toLowerCase().includes("electronics:")),
            }),
        );
    }, [area.entity]);

    const showOverlay = true;

    //--------------------------------------------------------------------------
    return (
        <>
            <BoundingBoxFaceProjection entity={area.entity} face="right" className="transform-3d pointer-events-none">
                <div className="absolute bottom-0 left-96 flex items-end gap-px transform-3d">
                    <p className="absolute bottom-1 -left-3 -translate-x-full text-xs text-accent">Quantity</p>
                    {MOCK_STORAGE_DATA.map((item) => (
                        <div
                            key={item.id}
                            className="relative w-16 p-1 flex items-end text-slate-900 backdrop-blur-xl"
                            style={
                                {
                                    height: `${item.maxQuantity / 2}px`,
                                    backgroundColor: `color-mix(in srgb, var(--color-${item.id}) 40%, transparent)`,
                                    "--color": `var(--color-${item.id})`,
                                } as React.CSSProperties
                            }
                        >
                            <div
                                className="absolute bottom-0 left-0 w-full bg-(--color) z-[-1] starting:scale-y-0 scale-y-100 origin-bottom transition-all duration-800 delay-1000"
                                style={{
                                    height: `${item.quantity / 2}px`,
                                }}
                            />
                            <div>
                                <p className="text-2xs">{item.name}</p>
                                <p className="text-sm font-medium">{item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </BoundingBoxFaceProjection>
            {showOverlay &&
                childrenEntities.screen.map((entity) => (
                    <Fragment key={entity.euid.value}>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="front"
                            className="w-full h-full bg-screen/85"
                        ></BoundingBoxFaceProjection>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="top"
                            className="w-full h-full bg-screen/85"
                        ></BoundingBoxFaceProjection>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="right"
                            className="w-full h-full bg-screen"
                        ></BoundingBoxFaceProjection>
                    </Fragment>
                ))}
            {showOverlay &&
                childrenEntities.case.map((entity) => (
                    <Fragment key={entity.euid.value}>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="front"
                            className="w-full h-full bg-case/85"
                        ></BoundingBoxFaceProjection>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="top"
                            className="w-full h-full bg-case/85"
                        ></BoundingBoxFaceProjection>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="right"
                            className="w-full h-full bg-case"
                        ></BoundingBoxFaceProjection>
                    </Fragment>
                ))}
            {showOverlay &&
                childrenEntities.electronics.map((entity) => (
                    <Fragment key={entity.euid.value}>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="front"
                            className="w-full h-full bg-electronics/85"
                        ></BoundingBoxFaceProjection>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="top"
                            className="w-full h-full bg-electronics/85"
                        ></BoundingBoxFaceProjection>
                        <BoundingBoxFaceProjection
                            entity={entity}
                            face="right"
                            className="w-full h-full bg-electronics"
                        ></BoundingBoxFaceProjection>
                    </Fragment>
                ))}
        </>
    );
}
