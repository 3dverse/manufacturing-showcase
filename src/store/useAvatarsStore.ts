import { create } from "zustand";
import type { Client } from "@3dverse/livelink";
import type { Avatar } from "@/content/type";

//------------------------------------------------------------------------------
interface AvatarsState {
    avatars: Avatar[];
    watchedClient: Client | null;
    showAvatarsOverlay: boolean;
    setAvatars: (avatars: Avatar[]) => void;
    clearAvatars: () => void;
    setWatchedClient: (client: Client | null) => void;
    setShowAvatarsOverlay: (show: boolean) => void;
}

//------------------------------------------------------------------------------
export const useAvatarsStore = create<AvatarsState>((set) => ({
    avatars: [],
    watchedClient: null,
    showAvatarsOverlay: true,
    setAvatars: (avatars) => set({ avatars }),
    clearAvatars: () => set({ avatars: [] }),
    setWatchedClient: (client) => set({ watchedClient: client }),
    setShowAvatarsOverlay: (show) => set({ showAvatarsOverlay: show }),
}));
