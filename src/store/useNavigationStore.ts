import { create } from "zustand";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
interface NavigationState {
    navigate: (route: string) => void;
}

//------------------------------------------------------------------------------
export const useNavigationStore = create<NavigationState>(() => ({
    navigate: (route: string) => {
        const [, factorySlug, nodeSlug, itemSlug] = route.split("/");
        Router.push({
            factorySlug: factorySlug || undefined,
            nodeSlug: nodeSlug || undefined,
            itemSlug: itemSlug || undefined,
        });
    },
}));
