import { useFactoryStore } from "@/store/useFactoryStore";

/**
 * Hook to access the current factory
 * @returns The current factory or null if no factory is selected
 */
export const useCurrentFactory = () => {
    return useFactoryStore((state) => state.currentFactory);
};
