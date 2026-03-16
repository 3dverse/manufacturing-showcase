//------------------------------------------------------------------------------
import { Fragment, useEffect, useState } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";
import { BoundingBoxFaceProjection } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
const MOCK_STORAGE_DATA = [
    {
        name: "Screen",
        id: "screen",
        quantity: 84,
        maxQuantity: 300,
    },
    {
        name: "Case",
        id: "case",
        quantity: 256,
        maxQuantity: 350,
    },
    {
        name: "Electronics",
        id: "electronics",
        quantity: 278,
        maxQuantity: 320,
    },
];

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
            <BoundingBoxFaceProjection entity={area.entity} face="right">
                <div className="absolute bottom-0 left-1/4 -translate-x-1/2 flex items-end gap-2">
                    <p className="absolute bottom-1 -left-3 -translate-x-full text-xs text-accent">Quantity</p>
                    {MOCK_STORAGE_DATA.map((item) => (
                        <div
                            key={item.name}
                            className="relative bg-accent/40 w-16 p-1 flex items-end text-slate-900"
                            style={
                                {
                                    height: `${item.maxQuantity / 2}px`,
                                    backgroundColor: `color-mix(in srgb, var(--color-${item.id}) 40%, transparent)`,
                                    "--color": `var(--color-${item.id})`,
                                } as React.CSSProperties
                            }
                        >
                            <div
                                className="absolute bottom-0 left-0 w-full h-full bg-(--color) z-[-1]"
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
                    <Fragment key={entity.name}>
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
                    <Fragment key={entity.name}>
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
                    <Fragment key={entity.name}>
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
