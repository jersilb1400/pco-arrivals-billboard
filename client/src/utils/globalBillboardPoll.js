/**
 * Resolve /global-billboard poll results without wiping a live event on transient failures.
 *
 * @param {object} params
 * @param {object|null} params.previous
 * @param {object|null|undefined} params.responseData
 * @param {Error|null|undefined} params.error
 * @returns {object|null}
 */
export function resolveGlobalBillboardPoll({ previous, responseData, error }) {
  if (error) {
    return previous ?? null;
  }

  if (responseData == null) {
    return previous ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(responseData, 'activeBillboard')) {
    return responseData.activeBillboard || null;
  }

  return previous ?? null;
}
