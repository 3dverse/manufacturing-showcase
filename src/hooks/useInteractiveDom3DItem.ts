//------------------------------------------------------------------------------
import { useCallback } from "react";

//------------------------------------------------------------------------------
export const useInteractiveDom3DItem = (condition?: boolean) => {
    //------------------------------------------------------------------------------
    const ignoreClickPassthrough = useCallback(
        (e: MouseEvent) => {
            if (condition === undefined || condition) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        },
        [condition],
    );

    //--------------------------------------------------------------------------
    const setRef = useCallback(
        (node: HTMLDivElement | null) => {
            // dealing with the react synthetic events and native browser events at the same time is painful
            if (node) {
                node.addEventListener("mousedown", ignoreClickPassthrough);
                node.addEventListener("mouseup", ignoreClickPassthrough);
                node.addEventListener("pointerdown", ignoreClickPassthrough);
                node.addEventListener("pointerup", ignoreClickPassthrough);
            }
        },
        [ignoreClickPassthrough],
    );
    return setRef;
};
