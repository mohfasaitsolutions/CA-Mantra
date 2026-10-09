import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get API base URL from environment variables
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE ||
         import.meta.env.VITE_API_URL ||
         ((import.meta as unknown as { env?: Record<string, string> }).env?.API_BASE) ||
         'http://localhost:3000/api';
}
