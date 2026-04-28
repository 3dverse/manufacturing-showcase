import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    variant?: "default" | "bottomSheet";
    isFullScreen?: boolean;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    contentClassName?: string;
    bodyClassName?: string;
}

//------------------------------------------------------------------------------
const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    variant = "default",
    isFullScreen = false,
    showCloseButton = true,
    closeOnOverlayClick = true,
    contentClassName = "",
    bodyClassName = "",
}: ModalProps) => {
    //--------------------------------------------------------------------------
    const dialogRef = useRef<HTMLDialogElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    //--------------------------------------------------------------------------
    const [isClosing, setIsClosing] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    //--------------------------------------------------------------------------
    const isBottomSheet = variant === "bottomSheet";
    const canDragBottomSheet = () => isBottomSheet && window.matchMedia("(max-width: 768px)").matches;

    //--------------------------------------------------------------------------
    const resetDragStyles = useCallback(() => {
        const content = contentRef.current;
        if (!content) return;

        content.style.transform = "";
    }, []);

    //--------------------------------------------------------------------------
    const handleClose = useCallback(() => {
        setIsClosing(true);
        // Wait for animation to complete before actually closing
        setTimeout(() => {
            const dialog = dialogRef.current;
            if (dialog) {
                dialog.close();
            }
            resetDragStyles();
            setIsClosing(false);
            onClose();
        }, 300);
    }, [onClose, resetDragStyles]);

    //--------------------------------------------------------------------------
    // Handle dialog open/close
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
                resetDragStyles();
                setIsClosing(false);
            }
        } else {
            // When isOpen is false, ensure dialog is closed
            if (dialog.open) {
                if (isClosing) {
                    // Already closing via user action, let animation finish
                    // The handleClose timeout will call onClose and close the dialog
                    return;
                } else {
                    // Programmatic close (isOpen set to false externally), close immediately
                    dialog.close();
                    resetDragStyles();
                    setIsClosing(false);
                }
            } else {
                // Dialog is already closed, ensure closing state is reset
                resetDragStyles();
                setIsClosing(false);
            }
        }
    }, [isOpen, isClosing, resetDragStyles]);

    //--------------------------------------------------------------------------
    // Handle escape key
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && dialog.open) {
                handleClose();
            }
        };

        dialog.addEventListener("keydown", handleEscape);
        return () => dialog.removeEventListener("keydown", handleEscape);
    }, [handleClose]);

    //--------------------------------------------------------------------------
    // Touch handlers for swipe down on mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!canDragBottomSheet()) return;

        const touch = e.touches[0];
        setTouchStart(touch.clientY);
        setTouchCurrent(touch.clientY);
        setIsDragging(true);
    };

    //--------------------------------------------------------------------------
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!canDragBottomSheet() || touchStart === null) return;

        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStart;

        setTouchCurrent(touch.clientY);
        if (contentRef.current) {
            const translateY = Math.max(-20, Math.min(deltaY, 200));
            contentRef.current.style.transform = `translateY(${translateY}px)`;
        }
    };

    //--------------------------------------------------------------------------
    const handleTouchEnd = () => {
        if (!canDragBottomSheet()) return;
        if (touchStart === null || touchCurrent === null) return;

        const deltaY = touchCurrent - touchStart;
        const threshold = 100; // Minimum swipe distance to close

        if (deltaY > threshold && contentRef.current) {
            // Close modal
            handleClose();
        } else if (contentRef.current) {
            // Snap back
            resetDragStyles();
        }

        setTouchStart(null);
        setTouchCurrent(null);
        setIsDragging(false);
    };

    //--------------------------------------------------------------------------
    return (
        <dialog
            ref={dialogRef}
            className={`modal modal--${variant} ${isClosing ? "modal--closing" : ""} pointer-events-auto`}
            onClick={(e) => {
                // Close when clicking on backdrop
                if (closeOnOverlayClick && e.target === dialogRef.current) {
                    handleClose();
                }
            }}
        >
            <div
                ref={contentRef}
                className={`modal__content ${isClosing ? "modal__content--closing" : ""} ${
                    isDragging ? "modal__content--dragging" : ""
                } ${isFullScreen ? "animate-none! w-full h-full max-w-none! max-h-none!" : ""} ${contentClassName}`}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                {isBottomSheet && <div className="modal__drag-handle" />}

                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="modal__header">
                        {title && <h2 className="modal__title">{title}</h2>}
                        {showCloseButton && (
                            <button className="modal__close-button" onClick={handleClose} aria-label="Close modal">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
                {/* Content */}
                <div className={`modal__body ${bodyClassName}`}>{children}</div>
            </div>
        </dialog>
    );
};

export default Modal;
