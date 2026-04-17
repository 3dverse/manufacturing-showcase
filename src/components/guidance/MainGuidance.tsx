//------------------------------------------------------------------------------
import { useContext, useRef } from "react";

//------------------------------------------------------------------------------
import Button from "@/components/common/Button";

//------------------------------------------------------------------------------
import { CONTACT_URL, LANDING_3DVERSE_URL } from "@/content/routes";
import { METADATA } from "@/content/metadata";
import { FIRST_USE_CASE_ID } from "@/content/useCases";
import { UseCaseContext } from "@/contexts/UseCaseContext";

//------------------------------------------------------------------------------
export const MainGuidance = () => {
    //--------------------------------------------------------------------------
    const ref = useRef<HTMLDivElement>(null);
    const { useCases, activeUseCaseId, activateUseCase, clearActiveUseCase } = useContext(UseCaseContext);
    const activeUseCase = activeUseCaseId ? useCases[activeUseCaseId] : undefined;

    const openFirstUseCase = () => {
        if (activeUseCaseId === FIRST_USE_CASE_ID) {
            clearActiveUseCase();
        } else {
            activateUseCase(FIRST_USE_CASE_ID);
        }

        if (ref.current) {
            ref.current.classList.add("pointer-events-none");
            setTimeout(() => {
                if (!ref.current) {
                    return;
                }
                ref.current.classList.remove("pointer-events-none");
            }, 1800);
        }
    };

    //--------------------------------------------------------------------------
    return (
        <aside
            data-theme="dark"
            className={`
                group translate-y-full hover:translate-y-0 transition-transform duration-200
                fixed bottom-0 shadow-[0_-4px_32px_-1px_color-mix(in_oklch,var(--color-accent-200)_20%,transparent)] z-100
            `}
            {...(activeUseCase && { "data-current-use-case": true })}
            ref={ref}
        >
            <div className="relative h-18 w-screen">
                <header
                    className={`
                        absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center w-fit justify-between gap-2 p-2 pb-1 bg-slate-0 rounded-t-[1.9rem] [corner-shape:round] cursor-pointer
                        before:content-[''] before:absolute before:bottom-0 before:left-0 before:-translate-x-full before:w-5 before:h-5 before:bg-slate-50 before:rounded-tl-4xl before:[corner-shape:scoop]
                        after:content-[''] after:absolute after:bottom-0 after:right-0 after:translate-x-full after:w-5 after:h-5 after:bg-slate-50 after:rounded-tr-4xl after:[corner-shape:scoop]
                        group-data-current-use-case:pl-4
                        transition-all duration-200
                    `}
                >
                    <img src="/logo/3dverse_rocket.svg" alt="3dverse" className="w-6 h-6" />
                    {activeUseCase && (
                        <div className="flex flex-col pr-2">
                            <p className="text-2xs text-subtle">Simulation</p>
                            <p className="text-xs text-guidance">{activeUseCase.label}</p>
                        </div>
                    )}
                </header>
                <div className="grid grid-cols-3 items-center h-full px-4 bg-slate-0 text-default">
                    <div className="flex flex-col">
                        <a
                            href={LANDING_3DVERSE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 w-fit pl-2 pr-4 py-1 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                        >
                            <img src="/logo/3dverse_rocket.svg" alt="3dverse" className="w-8 h-8" />
                            <div className="flex flex-col">
                                <span>{METADATA.app_name}</span>
                                <span className="text-xs text-muted">
                                    Powered by <span className="font-family-heading text-guidance">3dverse</span>
                                </span>
                            </div>
                        </a>
                    </div>
                    <div className="flex justify-center mt-1">
                        {activeUseCase ? (
                            <Button onClick={openFirstUseCase} variant="ghost" size="sm" className="rounded-full">
                                Quit use case
                            </Button>
                        ) : (
                            <Button onClick={openFirstUseCase} variant="guidance" size="sm" className="rounded-full">
                                Simulate maintenance urgency
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <a
                            href={CONTACT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 w-fit px-3 py-2 text-xs text-guidance rounded border border-guidance/50 hover:border-guidance/80 transition-colors duration-200"
                        >
                            Create your own Digital Twin
                        </a>
                    </div>
                </div>
            </div>
        </aside>
    );
};
