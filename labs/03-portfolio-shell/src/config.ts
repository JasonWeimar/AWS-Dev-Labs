// src/config.ts
export const APP_NAME = "Lab 03 — Portfolio Shell";

// Vite exposes env vars prefixed with VITE_
export const API_BASE_URL: string =
    (import.meta.env.VITE_API_BASE_URL as string) || "";