export function responseArrayOrFallback(response, fallback = []) {
  return Array.isArray(response?.data) ? response.data : fallback;
}
