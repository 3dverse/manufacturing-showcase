import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and merges Tailwind classes with tailwind-merge.
 * This function intelligently handles Tailwind class conflicts, ensuring that
 * later classes override earlier ones when they conflict.
 *
 * @param inputs - Class values to merge (strings, objects, arrays, etc.)
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-2 is overridden by px-4)
 * cn('bg-red-500', { 'bg-blue-500': true }) // Returns 'bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
