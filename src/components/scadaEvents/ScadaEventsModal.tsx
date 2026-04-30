import { createPortal } from "react-dom";
import { faXmark } from "@fortawesome/pro-light-svg-icons"

import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
export function ScadaEventsModal() {

    //--------------------------------------------------------------------------
    const handleClose = () => {
        console.log("handleClose");
    };

    //--------------------------------------------------------------------------
    return createPortal(
        <aside
            className="fixed top-0 right-0 bottom-0 w-1/2 max-w-md bg-slate-0/95 backdrop-blur-sm border-l border-slate-200/70 shadow-3xl z-100 overflow-y-auto starting:-translate-x-full translate-x-0 opacity-0 transition-all duration-200"
        >
            <header className="sticky top-0 flex items-center justify-between pl-6 pr-3 py-2 mb-4 bg-slate-0/95 border-b border-slate-200/70 backdrop-blur-sm">
                <h2 className="text-lg font-semibold">Scada Events</h2>
                <Button variant="ghost" colorScheme="neutral" size="lg" className="px-2" onClick={handleClose}>
                    <Icon icon={faXmark} />
                </Button>
            </header>
            <div className="flex flex-col gap-2 p-5 pt-3">
                Scada Events
            </div>
        </aside>,
        document.body,
    );
}