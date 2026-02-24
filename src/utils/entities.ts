import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
export const CONTEXT_KINDS = ["factory", "area", "line", "cell", "machine"] as const;
export type ContextKind = (typeof CONTEXT_KINDS)[number];

//------------------------------------------------------------------------------
/** Id is the entity name, e.g. "area:Assembly", "machine:CNC-1" (from entity.name or entity.debug_name) */
export function getContextId(entity: Entity): string | null {
    const raw = (entity as Entity & { name?: string }).name ?? (entity as Entity & { debug_name?: { value?: string } }).debug_name?.value;
    const name = typeof raw === "string" ? raw : null;
    if (!name) return null;
    const n = name.toLowerCase();
    const [type] = n.split(":");
    if (CONTEXT_KINDS.includes(type as ContextKind)) return n;
    return null;
}

//------------------------------------------------------------------------------
export function getContextKind(id: string): ContextKind | null {
    const [type] = id.toLowerCase().split(":");
    return CONTEXT_KINDS.includes(type as ContextKind) ? (type as ContextKind) : null;
}

//------------------------------------------------------------------------------
export function sortEntities({ entities }: { entities: Entity[] }) {
    const factories: Entity[] = [];
    const areas: Entity[] = [];
    const lines: Entity[] = [];
    const cells: Entity[] = [];
    const machines: Entity[] = [];

    for (const e of entities) {
        const name = ((e as Entity & { name?: string }).name ?? "").toLowerCase();
        if (!name) continue;
        const parts = name.split(":");
        if (parts.length !== 2) continue;
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

    return { factories, areas, lines, cells, machines };
}
