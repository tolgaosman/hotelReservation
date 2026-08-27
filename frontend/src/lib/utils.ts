import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Case-insensitive substring match using Turkish casing rules (dotted/dotless İ/I/ı/i). */
export function matchesQuery(haystack: string, query: string): boolean {
  return haystack.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}
