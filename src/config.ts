const envUrl =
  process.env.REACT_APP_API_URL || (process.env as any).VITE_API_URL || "";
export const API_URL =
  (envUrl && envUrl.trim()) ||
  (typeof window !== "undefined" ? "http://localhost:4000" : "http://localhost:4000");

export const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  (process.env as any).VITE_STRIPE_PUBLISHABLE_KEY ||
  "";
