//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { Element, AreaCategory } from "@/contexts/SelectedContext";
import type { Factory } from "@/content/factory";

//------------------------------------------------------------------------------
export function fetchElementsFromEntities({
    entities,
    currentFactory,
}: {
    entities: Entity[];
    currentFactory: Factory | null;
}) {
    //--------------------------------------------------------------------------
    const factories: Element[] = [];
    let areas: Element[] = [];
    const lines: Element[] = [];
    const cells: Element[] = [];
    const machines: Element[] = [];

    for (const e of entities) {
        const id = ((e as Entity & { name?: string }).name ?? "").toLowerCase();
        if (!id) continue;
        // Id pattern:
        // <type>:<category>:<count>
        // E.g. "area:Assembly:1"
        const parts = id.split(":");
        if (parts.length !== 3) continue;
        const [type, category, count] = parts;

        switch (type) {
            case "factory":
                factories.push({ type: "factory", id, count, entity: e });
                break;
            case "area":
                areas.push({ type: "area", id, count, entity: e, category: category as AreaCategory });
                break;
            case "line":
                lines.push({ type: "line", id, count, entity: e });
                break;
            case "cell":
                cells.push({ type: "cell", id, count, entity: e });
                break;
            case "machine":
                machines.push({ type: "machine", id, count, entity: e });
                break;
        }
    }

    // Sort areas by currentFactory.area_categories_sort order
    areas = sortAreas(areas, currentFactory);

    // Return
    return { factories, areas, lines, cells, machines };
}

//------------------------------------------------------------------------------
const sortAreas = (areas: Element[], currentFactory: Factory | null) => {
    const order = currentFactory?.area_categories_sort;
    if (!order?.length) return areas;
    const indexOf = (category: string) => {
        const i = order.findIndex((s) => s.toLowerCase() === category.toLowerCase());
        return i === -1 ? order.length : i;
    };
    return [...areas].sort((a, b) => indexOf(a.category!) - indexOf(b.category!));
};
