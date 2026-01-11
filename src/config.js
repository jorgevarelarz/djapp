export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function apiFetch(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { res, data };
}
