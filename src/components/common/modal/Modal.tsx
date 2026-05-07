import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";

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
            className={cn(
                "pointer-events-auto fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-none bg-transparent p-0",
                isClosing ? "animate-modal-fade-out" : "animate-modal-fade-in",
                isBottomSheet && "max-md:items-end max-md:p-0",
                !isFullScreen &&
                    "backdrop:bg-[color-mix(in_srgb,var(--color-underground)_90%,transparent)] backdrop:backdrop-blur-sm backdrop:transition-[opacity_0.3s_ease,backdrop-filter_0.3s_ease]",
                isFullScreen && "backdrop:hidden",
                isClosing && !isFullScreen && "backdrop:opacity-0 backdrop:backdrop-blur-none",
            )}
            onClick={(e) => {
                // Close when clicking on backdrop
                if (closeOnOverlayClick && e.target === dialogRef.current) {
                    handleClose();
                }
            }}
        >
            <div
                ref={contentRef}
                className={cn(
                    "relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-lg bg-ground shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-[transform_0.2s_ease,opacity_0.2s_ease]",
                    isDragging && "transition-none",
                    isBottomSheet
                        ? isClosing
                            ? "max-md:animate-modal-slide-down-mobile md:animate-modal-slide-down"
                            : "max-md:animate-modal-slide-up-mobile md:animate-modal-slide-up"
                        : isClosing
                          ? "animate-modal-slide-down"
                          : "animate-modal-slide-up",
                    isFullScreen && "h-full! max-h-none! max-w-none! animate-none! w-full",
                    contentClassName,
                )}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                {isBottomSheet && (
                    <div className="mx-auto mt-3 hidden h-1 w-10 shrink-0 cursor-grab rounded-full bg-(--color-border-subtle) max-md:block active:cursor-grabbing" />
                )}

                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex shrink-0 items-center justify-between border-b border-(--color-border-subtle) p-6">
                        {title && (
                            <h2 className="m-0 text-2xl font-semibold leading-normal text-(--color-text-default)">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-md border-none bg-transparent p-0 text-(--color-text-subtle) transition-[background-color_0.2s_ease,color_0.2s_ease] hover:bg-(--color-bg-ground) hover:text-(--color-text-default) active:scale-[0.95]",
                                    !title && "ml-auto",
                                )}
                                onClick={handleClose}
                                aria-label="Close modal"
                            >
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
                <div
                    className={cn(
                        "flex flex-col overflow-y-auto p-6 text-(--color-text-default) [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-(--color-accent) hover:[&::-webkit-scrollbar-thumb]:bg-accent-600",
                        bodyClassName,
                    )}
                >
                    {children}
                </div>
            </div>
        </dialog>
    );
};

export default Modal;
