//------------------------------------------------------------------------------
import { useRef, useEffect, useContext, useMemo, useState, useCallback } from "react";
import { faLink, faShare, faQrcode, faCheck, faUserPlus } from "@fortawesome/pro-light-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { LivelinkContext } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import Button from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { InviteModal } from "@/components/clients/InviteModal";
import { AvatarList } from "@/components/clients/AvatarList";

//------------------------------------------------------------------------------
import { useMediaQuery } from "@/hooks/useMediaQuery";

//------------------------------------------------------------------------------
const makeGuestLink = ({ sessionId }: { sessionId: string }) => {
    const link = `${location.origin}${location.pathname}/?sessionId=${sessionId}`;
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
    const [isTextCopied, setTextCopied] = useState(false);
    const copyGuestLink = useCallback(() => {
        if (!guestLink) {
            return;
        }
        navigator.clipboard.writeText(guestLink);
        setTextCopied(true);
        setTimeout(() => setTextCopied(false), 2000);
    }, [guestLink]);

    //--------------------------------------------------------------------------
    const shareGuestLink = () => {
        navigator.share({
            title: "3dverse",
            text: "Share this link to invite others.",
            url: guestLink,
        });
    };

    //--------------------------------------------------------------------------
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const showGuestQrCode = useCallback(() => {
        if (!guestLink) {
            return;
        }
        setIsInviteModalOpen(true);
    }, [guestLink]);

    //--------------------------------------------------------------------------
    const actions = [
        {
            label: "Copy link",
            onClick: copyGuestLink,
            icon: faLink,
        },
        {
            label: "Share link",
            onClick: shareGuestLink,
            icon: faShare,
        },
        {
            label: "Show QR code",
            onClick: showGuestQrCode,
            icon: faQrcode,
        },
    ] as { label: string; onClick: () => void; icon: IconDefinition }[];

    //--------------------------------------------------------------------------
    const [isLargerThan800] = useMediaQuery("(min-width: 800px)");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    if (!instance) {
        return null;
    }
    return (
        <>
            <ViewerPanel className="flex gap-x-1 items-center rounded-full pointer-events-auto p-1">
                <AvatarList />
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="primary"
                        size="md"
                        className="rounded-full"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                    >
                        {!isLargerThan800 ? (
                            <Icon size="lg" icon={faUserPlus} className={isTextCopied ? "hidden" : undefined} />
                        ) : (
                            <>
                                <span className={isTextCopied ? "hidden" : undefined}>Invite</span>
                                {isTextCopied && (
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        className="animate-appear-top"
                                    >
                                        <Icon icon={faCheck} size={"lg"} className="mr-1 text-green-500" />
                                        <span style={{ fontSize: "sm" }}>Copied</span>
                                    </span>
                                )}
                            </>
                        )}
                    </Button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
                            role="menu"
                        >
                            {actions.map(({ label, onClick, icon }, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onClick();
                                        setMenuOpen(false);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                    type="button"
                                >
                                    <Icon icon={icon} className="mr-2" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
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
