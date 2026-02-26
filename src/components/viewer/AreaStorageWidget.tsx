//------------------------------------------------------------------------------
import { Fragment, useEffect, useState } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import { QuadLayout } from "@/utils/QuadLayout";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { AreaNode } from "@/content/type";

//------------------------------------------------------------------------------
export function AreaStorageWidget({ area }: { area: AreaNode }) {
    //--------------------------------------------------------------------------
    const [childrenEntities, setChildrenEntities] = useState<Entity[]>([]);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        area.entity
            .getChildren()
            .then((children) => children.filter((c) => c.name.toLowerCase().includes("rack")))
            .then(setChildrenEntities);
    }, [area.entity]);

    //--------------------------------------------------------------------------
    return (
        <div className="pointer-events-none">
            {childrenEntities.map((entity, index) => (
                <Fragment key={entity.name}>
                    <QuadLayout
                        entity={entity}
                        face="top"
                        center={
                            <div
                                className={cn(
                                    "w-full h-full",
                                    index === childrenEntities.length - 1
                                        ? "bg-linear-to-t from-accent/80 from-50% to-accent/10 to-51%"
                                        : "bg-accent/60",
                                )}
                            />
                        }
                    />
                    <QuadLayout
                        entity={entity}
                        face="right"
                        center={
                            <div
                                className={cn(
                                    "w-full h-full",
                                    index === childrenEntities.length - 1
                                        ? "bg-linear-to-r from-accent/80 from-50% to-accent/10 to-51%"
                                        : "bg-accent/60",
                                )}
                            />
                        }
                    />
                    <QuadLayout entity={entity} face="front" center={<div className="w-full h-full bg-accent/60" />} />
                </Fragment>
            ))}
        </div>
    );
}
