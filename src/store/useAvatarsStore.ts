import { create } from "zustand";
import type { Avatar } from "@/content/type";

//------------------------------------------------------------------------------
interface AvatarsState {
    avatars: Avatar[];
    watchedAvatar: Avatar | null;
    fullScreenWatchedAvatar: boolean;
    showAvatarsOverlay: boolean;
    setAvatars: (avatars: Avatar[]) => void;
    clearAvatars: () => void;
    setWatchedAvatar: (avatar: Avatar | null) => void;
    setFullScreenWatchedAvatar: (fullScreen: boolean) => void;
    setShowAvatarsOverlay: (show: boolean) => void;
}

//------------------------------------------------------------------------------
export const useAvatarsStore = create<AvatarsState>((set) => ({
    avatars: [],
    watchedAvatar: null,
    fullScreenWatchedAvatar: false,
    showAvatarsOverlay: true,
    setAvatars: (avatars) => set({ avatars }),
    clearAvatars: () => set({ avatars: [] }),
    setWatchedAvatar: (avatar) => set({ watchedAvatar: avatar }),
    setFullScreenWatchedAvatar: (fullScreen) => set({ fullScreenWatchedAvatar: fullScreen }),
    setShowAvatarsOverlay: (show) => set({ showAvatarsOverlay: show }),
}));
