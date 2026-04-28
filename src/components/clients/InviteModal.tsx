//------------------------------------------------------------------------------
import { useCallback, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";
import Modal from "@/components/common/modal/Modal";

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
    const handleEscapeClose = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose],
    );

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="bottomSheet"
            isFullScreen={true}
            showCloseButton={false}
            closeOnOverlayClick={true}
            contentClassName="flex flex-col items-center justify-center"
            bodyClassName="p-4 mb-16 md:my-16"
        >
            <QRCode value={guestLink} size={200} bgColor="transparent" />
            <p className="mt-3 text-center text-sm text-slate">Scan to join the 3D session</p>
            <Button onClick={onClose} className="mt-12 min-w-48">
                Close
            </Button>
        </Modal>
    );
};
