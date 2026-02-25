import { useMemo } from "react";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import type { Entity } from "@3dverse/livelink";
import type { AreaNode, CellNode, FactoryGraph, FactoryNode } from "@/content/type";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const FactoryContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // Hooks
    const { entities } = useEntities({ mandatory_components: ["scene_ref"] });

    //--------------------------------------------------------------------------
    // Memos
    const factoryGraph = useMemo(() => sortEntities({ entities }), [entities]);

    //--------------------------------------------------------------------------
    // Render
    return <FactoryContext.Provider value={factoryGraph}>{children}</FactoryContext.Provider>;
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function sortEntities({ entities }: { entities: Entity[] }): FactoryGraph {
    const factories: Entity[] = [];
    const areas: Entity[] = [];
    const lines: Entity[] = [];
    const cells: Entity[] = [];
    const machines: Entity[] = [];

    for (const e of entities) {
        const name = e.name.toLowerCase();
        if (!name.includes(":")) continue;

        const parts = name.split(":");
        const [type] = parts;

        switch (type) {
            case "factory":
                factories.push(e);
                break;
            case "area":
                areas.push(e);
                break;
            case "line":
                lines.push(e);
                break;
            case "cell":
                cells.push(e);
                break;
            case "machine":
                machines.push(e);
                break;
        }
    }

    const graph: FactoryGraph = {
        factories: factories.map((entity) => {
            const [, name] = entity.name.split(":");
            const factory: FactoryNode = {
                entity,
                name,
                areas: areas
                    .filter((a) => a.lineage?.value.includes(entity.euid.value))
                    .map((entity) => {
                        const [, name] = entity.name.split(":");
                        const area: AreaNode = {
                            entity,
                            name,
                            cells: cells
                                .filter((a) => a.lineage?.value.includes(entity.euid.value))
                                .map((entity) => {
                                    const [, name] = entity.name.split(":");
                                    const cell: CellNode = {
                                        entity,
                                        name,
                                        machines: [],
                                    };
                                    return cell;
                                }),
                        };
                        return area;
                    }),
            };
            return factory;
        }),
    };
    return graph;
}
