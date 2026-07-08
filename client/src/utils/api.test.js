test('rejects 429 responses so callers use their error paths', async () => {
  let mockResponseErrorHandler;
  const mockApiInstance = {
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn((onSuccess, onError) => {
          mockResponseErrorHandler = onError;
        })
      }
    }
  };

  jest.resetModules();
  jest.doMock('axios', () => ({
    create: jest.fn(() => mockApiInstance)
  }));

  const axios = require('axios');
  const api = require('./api').default;

  expect(api).toBe(mockApiInstance);
  expect(axios.create).toHaveBeenCalled();

  const rateLimitError = {
    response: {
      status: 429,
      statusText: 'Too Many Requests',
      data: { error: 'rate limited' }
    },
    config: {
      url: '/location-status',
      method: 'get'
    },
    message: 'Request failed with status code 429'
  };

  await expect(mockResponseErrorHandler(rateLimitError)).rejects.toBe(rateLimitError);
});
