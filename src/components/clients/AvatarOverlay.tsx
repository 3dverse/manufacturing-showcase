//------------------------------------------------------------------------------
import { DOM3DOverlay } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { useAvatarsStore } from "@/store/useAvatarsStore";
import { AvatarOverlayItem } from "./AvatarOverlayItem";

//------------------------------------------------------------------------------
export const AvatarOverlay = () => {
    const { avatars, showAvatarsOverlay } = useAvatarsStore();

    //--------------------------------------------------------------------------
    // UI
    return showAvatarsOverlay ? (
        <DOM3DOverlay>
            {avatars.map((avatar) => (
                <AvatarOverlayItem key={avatar.client.id} avatar={avatar} />
            ))}
        </DOM3DOverlay>
    ) : null;
};
