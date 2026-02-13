import { useNavigationStore } from "@/store/useNavigationStore";

/**
 * Hook to access the global navigation function
 * Use this anywhere in your app to navigate between routes
 * 
 * @example
 * const navigate = useNavigate();
 * navigate('/factory/x-factory');
 * navigate('/');
 */
export const useNavigate = () => {
    return useNavigationStore((state) => state.navigate);
};
