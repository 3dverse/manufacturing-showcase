import { create } from "zustand";
import type { FocusedEntity } from "@/core/Correlation";

interface FocusStore {
    hovered:  FocusedEntity | null;
    selected: FocusedEntity | null;
    setHovered:  (entity: FocusedEntity | null) => void;
    setSelected: (entity: FocusedEntity | null) => void;
}

export const useFocusStore = create<FocusStore>((set) => ({
    hovered:  null,
    selected: null,
    setHovered:  (entity) => set({ hovered: entity }),
    setSelected: (entity) => set({ selected: entity }),
}));
