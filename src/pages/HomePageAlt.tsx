import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { LoadingOverlay } from "@3dverse/livelink-react-ui";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/factory";
import { factories } from "@/content/factory";
import { Livelink } from "@3dverse/livelink-react";
import { FactoryProviders } from "@/components/layout/FactoryProviders";
import FactoryLayout from "@/components/layout/FactoryLayout";
import MainGuidance from "@/components/guidance/MainGuidance";
import { TOKEN_3DVERSE } from "@/content/3dverse";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
export default function HomePageAlt() {
    //--------------------------------------------------------------------------
    // State
    const [selectedFactoryId, setSelectedFactoryId] = useState<string | undefined>();
    const [hideUnselected, setHideUnselected] = useState<string | undefined>();

    //--------------------------------------------------------------------------
    // Handlers
    const selectionHandler = useCallback((factoryId: string | undefined) => {
        if (!factoryId) setHideUnselected?.(undefined);
        setSelectedFactoryId(factoryId);
    }, []);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (!selectedFactoryId) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [selectedFactoryId]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div className="h-dvh bg-linear-to-br from-slate-50 to-slate-100 overflow-x-hidden">
            <div className="container flex flex-col h-full mx-auto pb-16">
                <header className="flex items-start gap-4 max-w-6xl py-10">
                    <span
                        role="img"
                        className="block w-8 aspect-square rounded-full bg-linear-to-tr from-accent-200 to-accent-500 shadow-[0_4px_16px_-8px_var(--color-accent)]"
                    />
                    <div>
                        <h1 className="text-xl font-bold mb-2">[Client Name]</h1>
                        <p className="text-sm text-subtle/80">[Client Description]</p>
                    </div>
                </header>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 grow">
                    {factories.map((factory) => (
                        <div
                            className={cn(
                                "transition-opacity",
                                selectedFactoryId && selectedFactoryId !== factory.id ? "opacity-0 " : "opacity-100",
                            )}
                        >
                            {(!hideUnselected || selectedFactoryId === factory.id) && (
                                <FactoryItem
                                    key={factory.id}
                                    factory={factory}
                                    selectedFactoryId={selectedFactoryId}
                                    onSelect={selectionHandler}
                                    setHideUnselected={setHideUnselected}
                                />
                            )}
                        </div>
                    ))}
                </ul>
            </div>
        </div>
    );
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const FactoryItem = ({
    factory,
    selectedFactoryId,
    onSelect,
    setHideUnselected,
}: {
    factory: Factory;
    selectedFactoryId: string | undefined;
    setHideUnselected?: (factoryId: string | undefined) => void;
    onSelect?: (factoryId: string | undefined) => void;
}) => {
    //--------------------------------------------------------------------------
    // Memo
    const isOpen = useMemo(() => selectedFactoryId === factory.id, [selectedFactoryId, factory]);

    //--------------------------------------------------------------------------
    const selectHandler = useCallback(() => onSelect?.(factory.id), [onSelect, factory]);

    //--------------------------------------------------------------------------
    const deselectHandler = useCallback(() => onSelect?.(undefined), [onSelect]);

    //--------------------------------------------------------------------------
    const transitionStartHandler = useCallback(() => {
        setHideUnselected?.(undefined);
    }, [setHideUnselected]);

    //--------------------------------------------------------------------------
    const transitionEndHandler = useCallback(() => {
        if (selectedFactoryId === factory.id) setHideUnselected?.(factory.id);
    }, [setHideUnselected, selectedFactoryId, factory.id]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onLayoutAnimationStart={transitionStartHandler}
            onLayoutAnimationComplete={transitionEndHandler}
            onClick={selectHandler}
            className={cn(
                "text-left",
                "w-full h-full",
                "rounded-3xl border border-white/10 bg-white/5 shadow-lg",
                "overflow-hidden",
                // when not open, behave like a normal card
                !isOpen && "relative hover:bg-white/10",
                // when open, THIS SAME ELEMENT becomes fullscreen
                isOpen && "fixed inset-0 z-50 m-0 rounded-none border-0",
            )}
        >
            <div className="w-full h-full">
                <Livelink sceneId={factory.scene_id} token={TOKEN_3DVERSE} LoadingPanel={LoadingOverlay}>
                    <FactoryProviders factory={factory}>
                        <FactoryLayout thumbnailMode={!isOpen} onBack={deselectHandler} />
                    </FactoryProviders>
                    {isOpen && <MainGuidance />}
                </Livelink>
            </div>
        </motion.div>
    );
};
