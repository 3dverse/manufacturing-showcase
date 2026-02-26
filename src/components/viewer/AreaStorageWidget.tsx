//------------------------------------------------------------------------------
import { Fragment, useEffect, useState } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
const EMPTY_SPACE_PERCENTAGE = 0.3;

//------------------------------------------------------------------------------
export function AreaStorageWidget({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    const [childrenEntities, setChildrenEntities] = useState<Entity[]>([]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        area.entity
            .getChildren()
            .then((children) => children.filter((c) => c.name.toLowerCase().includes("rack")))
            .then(setChildrenEntities);
    }, [area.entity]);

    //--------------------------------------------------------------------------
    return childrenEntities.map((entity, index) => (
        <Fragment key={entity.name}>
            <QuadLayout
                entity={entity}
                face="top"
                center={
                    <div
                        className="w-full h-full bg-accent/85"
                        style={
                            index === childrenEntities.length - 1
                                ? ({
                                      "--prct": `${EMPTY_SPACE_PERCENTAGE * 100}%`,
                                      backgroundColor: "transparent",
                                      backgroundImage: `linear-gradient(to top, var(--color-accent) var(--prct), transparent var(--prct))`,
                                      opacity: 0.8,
                                  } as React.CSSProperties)
                                : undefined
                        }
                    />
                }
                className="pointer-events-none"
            />
            <QuadLayout
                entity={entity}
                face="right"
                center={
                    <div
                        className="w-full h-full bg-accent/60"
                        style={
                            index === childrenEntities.length - 1
                                ? ({
                                      "--prct": `${EMPTY_SPACE_PERCENTAGE * 100}%`,
                                      backgroundColor: "transparent",
                                      backgroundImage: `linear-gradient(to right, var(--color-accent) var(--prct), transparent var(--prct))`,
                                      opacity: 0.8,
                                  } as React.CSSProperties)
                                : undefined
                        }
                    />
                }
                className="pointer-events-none"
            />
            <QuadLayout entity={entity} face="front" center={<div className="w-full h-full bg-accent/90" />} />
        </Fragment>
    ));
}
