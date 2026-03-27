import { useEffect, useState } from "react";

/**
 * A custom hook that listens for changes to a CSS media query and returns whether it matches or not.
 * @param query  The CSS media query to listen for (e.g. "(min-width: 600px)")
 * @returns  A boolean indicating whether the media query matches or not
 */
export function useMediaQuery(query: string): [boolean] {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return [matches];
}
