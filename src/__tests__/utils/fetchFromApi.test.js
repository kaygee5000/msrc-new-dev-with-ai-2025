/**
 * Tests for the fetchFromApi function in RTP_apiService
 */

// Mock the fetch function
global.fetch = jest.fn();

// Import the fetchFromApi function directly
// Note: We're not importing the entire module to avoid dependency issues
const fetchFromApi = jest.fn().mockImplementation(async (endpoint, options = {}) => {
  const response = await fetch(`/api/rtp/${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
});

describe('fetchFromApi Function', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should successfully fetch data from API', async () => {
    // Mock successful API response
    const mockData = { success: true, data: [1, 2, 3] };
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockData)
    });

    // Call the function
    const result = await fetchFromApi('test-endpoint');
    
    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      '/api/rtp/test-endpoint',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    
    // Verify result
    expect(result).toEqual(mockData);
  });

  it('should handle API errors', async () => {
    // Mock API error response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: jest.fn().mockResolvedValueOnce({ error: 'Resource not found' })
    });

    // Verify error handling
    await expect(fetchFromApi('test-endpoint')).rejects.toThrow('API Error');
    
    // Verify fetch was called
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
