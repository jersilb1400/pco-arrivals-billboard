import { getSecurityCodeEntryResult } from './securityCodeEntryResult';

describe('getSecurityCodeEntryResult', () => {
  test('treats HTTP 200 with success:false as a failed pickup', () => {
    expect(
      getSecurityCodeEntryResult({
        status: 200,
        data: {
          success: false,
          message: 'No active check-in found with this security code for the current event and date.',
        },
      })
    ).toEqual({
      ok: false,
      message: 'No active check-in found with this security code for the current event and date.',
    });
  });

  test('accepts success:true and prefers childName', () => {
    expect(
      getSecurityCodeEntryResult({
        status: 200,
        data: {
          success: true,
          childName: 'Ada Lovelace',
          addedChildren: [{ childName: 'Ignored' }],
          message: '1 child(ren) have been added to the pickup list.',
        },
      })
    ).toEqual({
      ok: true,
      childName: 'Ada Lovelace',
      message: '1 child(ren) have been added to the pickup list.',
    });
  });

  test('rejects rate-limited responses', () => {
    expect(getSecurityCodeEntryResult({ status: 429, data: null })).toEqual({
      ok: false,
      message: 'Security code not found',
    });
  });
});
