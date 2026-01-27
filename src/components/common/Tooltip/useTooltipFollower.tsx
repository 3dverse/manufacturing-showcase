import { useEffect } from "react";

//------------------------------------------------------------------------------
export function useTooltipFollower() {
    //--------------------------------------------------------------------------
    useEffect(() => {
        if (typeof window === "undefined") return;

        let activeEl: HTMLElement | null = null;

        const setPos = (el: HTMLElement, x: number, y: number) => {
            el.style.setProperty("--tooltip-x", `${x}px`);
            el.style.setProperty("--tooltip-y", `${y}px`);
        };

        const clear = () => {
            if (!activeEl) return;
            activeEl.classList.remove("is-following");
            activeEl.style.removeProperty("--tooltip-x");
            activeEl.style.removeProperty("--tooltip-y");
            activeEl = null;
        };

        // Find the host [data-tooltip] safely, even through Shadow DOM.
        const findTooltipHost = (evt: Event): HTMLElement | null => {
            const path = (evt.composedPath?.() ?? []) as EventTarget[];
            for (const t of path) {
                if (t instanceof HTMLElement && t.hasAttribute("data-tooltip")) return t;
            }
            // Fallback: try closest() only if target is an HTMLElement
            const tgt = evt.target;
            if (tgt instanceof HTMLElement) {
                return tgt.closest("[data-tooltip]") as HTMLElement | null;
            }
            return null;
        };

        // Convert viewport pointer coords to element-local coords
        const localXY = (el: HTMLElement, e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        };

        const onPointerMove = (e: PointerEvent) => {
            const host = findTooltipHost(e);
            if (host !== activeEl) {
                // switched elements or left tooltip area
                if (activeEl) clear();
                if (host) {
                    activeEl = host;
                    activeEl.classList.add("is-following");
                }
            }
            if (activeEl) {
                const { x, y } = localXY(activeEl, e);
                setPos(activeEl, x, y);
            }
        };

        // Keyboard focus support: position at top-right initially
        const onFocusIn = (e: FocusEvent) => {
            const host = findTooltipHost(e);
            if (!host) return;
            const r = host.getBoundingClientRect();
            activeEl = host;
            activeEl.classList.add("is-following");
            setPos(activeEl, r.width, 0);
        };

        const onFocusOut = (e: FocusEvent) => {
            const host = findTooltipHost(e);
            if (host && host === activeEl) clear();
        };

        const onWindowBlur = () => clear();

        document.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
        document.addEventListener("focusin", onFocusIn as EventListener);
        document.addEventListener("focusout", onFocusOut as EventListener);
        window.addEventListener("blur", onWindowBlur);

        return () => {
            document.removeEventListener("pointermove", onPointerMove as EventListener);
            document.removeEventListener("focusin", onFocusIn as EventListener);
            document.removeEventListener("focusout", onFocusOut as EventListener);
            window.removeEventListener("blur", onWindowBlur);
            clear();
        };
    }, []);

    return null;
}
