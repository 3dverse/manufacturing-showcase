//------------------------------------------------------------------------------
import { useContext, useMemo, useState, useCallback } from "react";
import { LivelinkContext } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import Button from "@/components/common/Button";
import { InviteModal } from "@/components/clients/InviteModal";
import { AvatarList } from "@/components/clients/AvatarList";

//------------------------------------------------------------------------------
const makeGuestLink = ({ sessionId }: { sessionId: string }) => {
    const link = `${location.origin}/guest/${sessionId}`;
    console.debug("guestLink", link);
    return link;
};

//------------------------------------------------------------------------------
export const InvitePanel = () => {
    //--------------------------------------------------------------------------
    // Context
    const { instance } = useContext(LivelinkContext);

    //--------------------------------------------------------------------------
    const guestLink = useMemo(
        () =>
            instance?.session.session_id &&
            makeGuestLink({
                sessionId: instance?.session.session_id,
            }),
        [instance?.session.session_id],
    );

    //--------------------------------------------------------------------------
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const showGuestQrCode = useCallback(() => {
        if (!guestLink) return;
        setIsInviteModalOpen(true);
    }, [guestLink]);

    //--------------------------------------------------------------------------
    if (!instance) {
        return null;
    }
    return (
        <>
            <ViewerPanel className="flex gap-x-1 items-center rounded-full pointer-events-auto">
                <AvatarList />
                <Button size="sm" className="rounded-full" onClick={showGuestQrCode}>
                    Invite
                </Button>
            </ViewerPanel>
            {guestLink && (
                <InviteModal
                    isOpen={isInviteModalOpen}
                    guestLink={guestLink}
                    onClose={() => setIsInviteModalOpen(false)}
                />
            )}
        </>
    );
};
