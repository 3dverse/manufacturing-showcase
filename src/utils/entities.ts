//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { Element, AreaCategory } from "@/contexts/SelectedContext";

//------------------------------------------------------------------------------
export function fetchElementsFromEntities({ entities }: { entities: Entity[] }) {
    const factories: Element[] = [];
    const areas: Element[] = [];
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

    return { factories, areas, lines, cells, machines };
}
