//------------------------------------------------------------------------------
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Entity } from "@3dverse/livelink";
import { useEntities } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { getContextId, getContextKind, sortEntities, type ContextKind } from "@/utils/entities";
export type { ContextKind } from "@/utils/entities";

//------------------------------------------------------------------------------
export interface Element {
    kind: ContextKind;
    id: string; /* E.g. "area:Assembly", "machine:CNC-1" */
    entity: Entity | undefined;
}

export interface EntityParents {
    factory?: Entity;
    area?: Entity;
    line?: Entity;
    cell?: Entity;
    machine?: Entity;
}

export interface SortedEntities {
    factories: Element[];
    areas: Element[];
    lines: Element[];
    cells: Element[];
    machines: Element[];
}

interface SelectedContextState {
    selected: Element | null;
    setSelected: (value: Element | null) => void;
    setSelectedFromEntity: (entity: Entity | null) => void;
    getParents: (entityOrId: Entity | string) => EntityParents;
    sorted: SortedEntities;
}

//------------------------------------------------------------------------------
const SelectedContext = createContext<SelectedContextState | null>(null);

/** Walk entity.parent chain and collect entities by context kind */
function collectParents(entity: Entity): EntityParents {
    const parents: EntityParents = {};
    let current: Entity | undefined = entity;
    while (current) {
        const name = (current as Entity & { name?: string }).name;
        if (typeof name === "string") {
            const n = name.toLowerCase();
            if (n.startsWith("factory:")) parents.factory = current;
            else if (n.startsWith("area:")) parents.area = current;
            else if (n.startsWith("line:")) parents.line = current;
            else if (n.startsWith("cell:")) parents.cell = current;
            else if (n.startsWith("machine:")) parents.machine = current;
        }
        current = (current as Entity & { parent?: Entity }).parent;
    }
    return parents;
}

function findEntityById(sorted: SortedEntities, id: string): Element | undefined {
    const kind = getContextKind(id);
    if (!kind) return undefined;
    const list =
        sorted[
            kind === "factory"
                ? "factories"
                : kind === "area"
                  ? "areas"
                  : kind === "line"
                    ? "lines"
                    : kind === "cell"
                      ? "cells"
                      : "machines"
        ];
    const idLower = id.toLowerCase();
    return list.find((e) => ({ kind, id, entity: e }));
}

//------------------------------------------------------------------------------
export function SelectedContextProvider({ children }: { children: ReactNode }) {
    const { entities } = useEntities({ mandatory_components: ["scene_ref"] });
    const [selected, setSelectedState] = useState<Element | null>(null);

    const sorted = useMemo(() => sortEntities({ entities }), [entities]);

    const setSelected = useCallback((value: Element | null) => {
        setSelectedState(value);
    }, []);

    const setSelectedFromEntity = useCallback((entity: Entity | null) => {
        if (!entity) {
            setSelectedState(null);
            return;
        }
        const id = getContextId(entity);
        const kind = id ? getContextKind(id) : null;
        if (!id || !kind) {
            setSelectedState(null);
            return;
        }
        setSelectedState({ kind, id, entity });
    }, []);

    const getParents = useCallback(
        (entityOrId: Entity | string): EntityParents => {
            const entity = typeof entityOrId === "string" ? findEntityById(sorted, entityOrId) : entityOrId;
            if (!entity) return {};
            return collectParents(entity);
        },
        [sorted],
    );

    const value = useMemo<SelectedContextState>(
        () => ({
            selected,
            setSelected,
            setSelectedFromEntity,
            getParents,
            sorted,
        }),
        [selected, setSelected, setSelectedFromEntity, getParents, sorted],
    );

    return <SelectedContext.Provider value={value}>{children}</SelectedContext.Provider>;
}

//------------------------------------------------------------------------------
export function useSelectedContext(): SelectedContextState {
    const ctx = useContext(SelectedContext);
    if (!ctx) {
        throw new Error("useSelectedContext must be used within a SelectedContextProvider (e.g. inside Viewer)");
    }
    return ctx;
}
