import { useEffect, useState } from "react";

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [query]);

    return matches;
};

export const MEDIA_QUERIES = {
    MOBILE: "(max-width: 768px)",
};
