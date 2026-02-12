import { create } from "zustand";
import type { Factory } from "@/content/factory";

//------------------------------------------------------------------------------
interface FactoryState {
    currentFactory: Factory | null;
    setCurrentFactory: (factory: Factory | null) => void;
    clearCurrentFactory: () => void;
}

//------------------------------------------------------------------------------
export const useFactoryStore = create<FactoryState>((set) => ({
    currentFactory: null,
    setCurrentFactory: (factory) => set({ currentFactory: factory }),
    clearCurrentFactory: () => set({ currentFactory: null }),
}));
