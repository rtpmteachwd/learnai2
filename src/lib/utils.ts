import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes file URLs for consistent access across local and deployed environments
 * - Handles both old format (/uploads/filename) and new format (/api/files/filename)
 * - Ensures files are served through our API route which works on Render
 */
export function normalizeFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's already using the API route, return as is
  if (url.startsWith('/api/files/')) {
    return url;
  }
  
  // If it's the old /uploads format, convert to API route
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    return `/api/files/${filename}`;
  }
  
  // If it's a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For any other format, assume it's a relative path and return as is
  return url;
}
