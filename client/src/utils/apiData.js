/**
 * Prefer response.data when it is an array; otherwise keep the previous/fallback value.
 * Prevents 429 `{ data: null }` from wiping list state or crashing `.length` / `.map`.
 */
export function responseArrayOrFallback(response, fallback = []) {
  return Array.isArray(response?.data) ? response.data : fallback;
}
