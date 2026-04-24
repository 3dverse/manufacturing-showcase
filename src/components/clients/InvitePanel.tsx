//------------------------------------------------------------------------------
import { useRef, useEffect, useContext, useMemo, useState, useCallback } from "react";
import { faLink, faShare, faQrcode } from "@fortawesome/pro-light-svg-icons";
import { faCheck, faUserPlus } from "@fortawesome/pro-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { LivelinkContext } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { ViewerPanel } from "@/components/common/ViewerPanel";
import Button from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { InviteModal } from "@/components/clients/InviteModal";
import { AvatarList } from "@/components/clients/AvatarList";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";

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

    //--------------------------------------------------------------------------
    // Handlers
    const closeModalHandler = useCallback(() => setIsInviteModalOpen(false), []);

    //--------------------------------------------------------------------------
    // Render
    if (!instance) {
        return null;
    }
    return (
        <>
            <ViewerPanel className="flex gap-x-1 p-[2px] items-center rounded-full bg-slate-0/80 border-0 backdrop-blur-3xl pointer-events-auto">
                <AvatarList />
                <div className="relative" ref={menuRef}>
                    <Button
                        colorScheme="accent"
                        size="sm"
                        className={cn(
                            "md:min-w-24 p-2 gap-2 rounded-full md:rounded-3xl aspect-square md:aspect-auto font-normal",
                            isTextCopied && "bg-positive-800",
                        )}
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                    >
                        <Icon icon={faUserPlus} className={cn("text-sm md:text-xs", isTextCopied && "hidden!")} />
                        <span className={cn("hidden md:block", isTextCopied ? "hidden!" : undefined)}>Invite</span>
                        {isTextCopied && (
                            <span className="starting:translate-y-2 starting:opacity-0 translate-y-0 opacity-100 transition-all duration-200">
                                <Icon icon={faCheck} className="text-sm mr-1 text-positive -translate-y-px" />
                                Copied
                            </span>
                        )}
                    </Button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 mt-px w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
                            role="menu"
                        >
                            {actions.map(({ label, onClick, icon }, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onClick();
                                        setMenuOpen(false);
                                    }}
                                    className="flex items-center w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
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
            {guestLink && <InviteModal isOpen={isInviteModalOpen} guestLink={guestLink} onClose={closeModalHandler} />}
        </>
    );
};
