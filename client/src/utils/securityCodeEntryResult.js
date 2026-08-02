/**
 * Interpret /api/security-code-entry JSON. The server returns HTTP 200 with
 * success:false for "not found" / already-on-list cases, so callers must not
 * treat a non-throwing response as a successful pickup.
 */
export function getSecurityCodeEntryResult(response) {
  const data = response?.data;
  if (response?.status === 429 || !data || data.success !== true) {
    return {
      ok: false,
      message: data?.message || 'Security code not found',
    };
  }

  let childName = data.childName;
  if (!childName && Array.isArray(data.addedChildren)) {
    childName = data.addedChildren.map((child) => child.childName).filter(Boolean).join(', ');
  }

  return {
    ok: true,
    childName: childName || '',
    message: data.message || 'Security code accepted.',
  };
}
