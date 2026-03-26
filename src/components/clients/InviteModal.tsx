//------------------------------------------------------------------------------
import { useEffect } from "react";
import { QRCode } from "react-qrcode-logo";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
export const InviteModal = ({
    isOpen,
    guestLink,
    onClose,
}: {
    isOpen: boolean;
    guestLink: string;
    onClose: () => void;
}) => {
    //--------------------------------------------------------------------------
    const handleEscapeClose = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    //--------------------------------------------------------------------------
    useEffect(() => {
        document.addEventListener("keydown", handleEscapeClose);
        return () => document.removeEventListener("keydown", handleEscapeClose);
    }, [handleEscapeClose]);

    //--------------------------------------------------------------------------
    // UI
    if (!isOpen) {
        return null;
    }
    return (
        <aside
            className="fixed inset-0 flex flex-col items-center justify-center pointer-events-auto z-50 bg-white/50 backdrop-blur-xl starting:opacity-0 opacity-100 transition-opacity duration-300"
            onClick={onClose}
        >
            <QRCode value={guestLink} size={200} bgColor="transparent" />
            <p className="mt-2 text-center text-sm text-gray-500">Scan to join the 3D session</p>
            <Button onClick={onClose} className="mt-4 min-w-48">
                Close
            </Button>
        </aside>
    );
};
