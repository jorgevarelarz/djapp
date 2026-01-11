export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";
export const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

export async function apiFetch(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { res, data };
}
