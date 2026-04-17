import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { FIRST_USE_CASE_ID, USE_CASES } from "@/content/useCases";

type UseCaseContextType = {
    isGuidanceVisible: boolean;
    useCases: typeof USE_CASES;
    activeUseCaseId?: string;
    useCaseActivatedAt?: number;
    pendingIncidentFocusUseCaseId?: string;
    setGuidanceVisible: (visible: boolean) => void;
    toggleGuidanceVisibility: () => void;
    activateUseCase: (useCaseId: string) => void;
    clearActiveUseCase: () => void;
    requestIncidentFocus: (useCaseId?: string) => void;
    clearIncidentFocusRequest: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const UseCaseContext = createContext(
    new Proxy({} as UseCaseContextType, {
        get() {
            throw new Error("UseCaseContext must be used within a UseCaseContextProvider");
        },
    }),
);

const hasGuidanceQuery = () => new URLSearchParams(window.location.search).has("guidance");

export const UseCaseContextProvider = ({ children }: { children: ReactNode }) => {
    const [isGuidanceVisible, setGuidanceVisible] = useState(() => hasGuidanceQuery());
    const [activeUseCaseId, setActiveUseCaseId] = useState<string | undefined>(() =>
        hasGuidanceQuery() ? FIRST_USE_CASE_ID : undefined,
    );
    const [useCaseActivatedAt, setUseCaseActivatedAt] = useState<number | undefined>(() =>
        hasGuidanceQuery() ? Date.now() : undefined,
    );
    const [pendingIncidentFocusUseCaseId, setPendingIncidentFocusUseCaseId] = useState<string | undefined>();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== "g") return;

            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                Boolean(target?.isContentEditable);

            if (isTypingTarget) return;
            setGuidanceVisible((current) => !current);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const value = useMemo(
        () => ({
            isGuidanceVisible,
            useCases: USE_CASES,
            activeUseCaseId,
            useCaseActivatedAt,
            pendingIncidentFocusUseCaseId,
            setGuidanceVisible,
            toggleGuidanceVisibility: () => setGuidanceVisible((current) => !current),
            activateUseCase: (useCaseId: string) => {
                setActiveUseCaseId(useCaseId);
                setUseCaseActivatedAt(Date.now());
            },
            clearActiveUseCase: () => {
                setActiveUseCaseId(undefined);
                setUseCaseActivatedAt(undefined);
                setPendingIncidentFocusUseCaseId(undefined);
            },
            requestIncidentFocus: (useCaseId?: string) => {
                setPendingIncidentFocusUseCaseId(useCaseId ?? activeUseCaseId);
            },
            clearIncidentFocusRequest: () => setPendingIncidentFocusUseCaseId(undefined),
        }),
        [isGuidanceVisible, activeUseCaseId, useCaseActivatedAt, pendingIncidentFocusUseCaseId],
    );

    return <UseCaseContext.Provider value={value}>{children}</UseCaseContext.Provider>;
};
