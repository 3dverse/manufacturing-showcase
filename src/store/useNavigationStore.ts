import { create } from "zustand";

//------------------------------------------------------------------------------
interface NavigationState {
    navigate: (route: string) => void;
    setNavigate: (navigateFn: (route: string) => void) => void;
}

//------------------------------------------------------------------------------
export const useNavigationStore = create<NavigationState>((set) => ({
    navigate: () => {
        console.warn("Navigation not initialized yet");
    },
    setNavigate: (navigateFn) => set({ navigate: navigateFn }),
}));
