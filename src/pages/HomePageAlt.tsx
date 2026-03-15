//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Livelink } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { FactoryProviders } from "@/components/layout/FactoryProviders";
import FactoryLayout from "@/components/layout/FactoryLayout";
import MainGuidance from "@/components/guidance/MainGuidance";

//------------------------------------------------------------------------------
import { Router, type RouteChangeEvent } from "@/core/Router";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import { LoadingOverlay } from "@/components/viewer/overlays/LoadingOverlay";
import { DisconnectedOverlay } from "@/components/viewer/overlays/DisconnectedOverlay";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";
import { LivelinkExfilContextProvider } from "@/components/contextProviders/LivelinkExfilContextProvider";
import { GhettoReconnectContextProvider } from "@/components/contextProviders/GhettoReconnectContextProvider";

//------------------------------------------------------------------------------
import { TOKEN_3DVERSE } from "@/content/3dverse";
import { factories } from "@/content/factory";
import type { Factory } from "@/content/factory";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export default function HomePageAlt() {
    //--------------------------------------------------------------------------
    // State
    const [selectedFactorySlug, setSelectedFactorySlug] = useState<string | undefined>();
    const [transitionDone, setTransitionDone] = useState<boolean>();

    //--------------------------------------------------------------------------
    // Handlers
    const selectionHandler = useCallback(
        (factory: Factory | undefined) => {
            if (selectedFactorySlug === factory?.slug) return;
            if (!factory) {
                setTransitionDone?.(false);
                setSelectedFactorySlug(undefined);
                Router.push({});
            } else {
                setSelectedFactorySlug(factory?.slug);
                Router.push({ factorySlug: factory.slug });
            }
        },
        [selectedFactorySlug],
    );

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (!selectedFactorySlug) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [selectedFactorySlug]);

    //--------------------------------------------------------------------------
    const routeChangeHandler = useCallback((event: RouteChangeEvent) => {
        switch (event.source) {
            case "pop":
                setTransitionDone(false);
                setSelectedFactorySlug(event.route.factorySlug);
                break;
            case "init":
                setSelectedFactorySlug(event.route.factorySlug);
                break;
        }
    }, []);

    //--------------------------------------------------------------------------
    useEffect(() => Router.onChange(routeChangeHandler), [routeChangeHandler]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        Router.init();
    }, []);

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
                            key={factory.slug}
                            className={cn(
                                "transition-opacity",
                                selectedFactorySlug && selectedFactorySlug !== factory.slug
                                    ? "opacity-0 "
                                    : "opacity-100",
                            )}
                        >
                            {(!transitionDone || selectedFactorySlug === factory.slug) && (
                                <GhettoReconnectContextProvider>
                                    <FactoryItem
                                        key={factory.slug}
                                        factory={factory}
                                        selectedFactorySlug={selectedFactorySlug}
                                        onSelect={selectionHandler}
                                        setTransitionDone={setTransitionDone}
                                    />
                                </GhettoReconnectContextProvider>
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
    selectedFactorySlug,
    onSelect,
    setTransitionDone,
}: {
    factory: Factory;
    selectedFactorySlug: string | undefined;
    setTransitionDone?: (done: boolean) => void;
    onSelect?: (factory: Factory | undefined) => void;
}) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { reconnector } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // Memo
    const isOpen = useMemo(() => selectedFactorySlug === factory.slug, [selectedFactorySlug, factory]);

    //--------------------------------------------------------------------------
    const selectHandler = useCallback(() => onSelect?.(factory), [onSelect, factory]);

    //--------------------------------------------------------------------------
    const deselectHandler = useCallback(() => onSelect?.(undefined), [onSelect]);

    //--------------------------------------------------------------------------
    const transitionStartHandler = useCallback(() => {
        setTransitionDone?.(false);
    }, [setTransitionDone]);

    //--------------------------------------------------------------------------
    const transitionEndHandler = useCallback(() => {
        if (selectedFactorySlug === factory.slug) setTransitionDone?.(true);
    }, [setTransitionDone, selectedFactorySlug, factory.slug]);

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
            <div className="relative w-full h-full">
                <LivelinkExfilContextProvider>
                    <Livelink
                        sceneId={factory.scene_id}
                        token={TOKEN_3DVERSE}
                        isTransient={reconnector}
                        LoadingPanel={LoadingOverlay}
                        ConnectionErrorPanel={DisconnectedOverlay}
                    >
                        <FactoryProviders factory={factory}>
                            <FactoryLayout thumbnailMode={!isOpen} onBack={deselectHandler} />

                            {isOpen && <MainGuidance />}
                        </FactoryProviders>
                    </Livelink>
                </LivelinkExfilContextProvider>
            </div>
        </motion.div>
    );
};
