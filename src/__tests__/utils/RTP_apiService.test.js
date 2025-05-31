// Mock the mock data imports that the API service uses
jest.mock('../../utils/mockData/RTP_mockData', () => {
  // Create simple mock data for testing
  const schoolOutputSubmissions = [
    { id: 'mock-id-1', survey_type: 'school_output', teacher: 'Test Teacher', school: 'Test School', district: 'Test District', region: 'Test Region', date: '2025-04-01', score: 80 },
    { id: 'mock-id-2', survey_type: 'school_output', teacher: 'Test Teacher 2', school: 'Test School 2', district: 'Test District', region: 'Test Region', date: '2025-03-28', score: 75 }
  ];
  
  const districtOutputSubmissions = [
    { id: 'mock-id-3', survey_type: 'district_output', teacher: 'Test Teacher', school: 'Test School', district: 'Test District', region: 'Test Region', date: '2025-04-02', score: 85 }
  ];
  
  const consolidatedChecklistSubmissions = [
    { id: 'mock-id-4', survey_type: 'consolidated_checklist', teacher: 'Test Teacher 3', school: 'Test School 3', district: 'Test District 2', region: 'Test Region 2', date: '2025-04-03', score: 90 }
  ];
  
  const partnersInPlaySubmissions = [
    { id: 'mock-id-5', survey_type: 'partners_in_play', teacher: 'Test Teacher 4', school: 'Test School 4', district: 'Test District 2', region: 'Test Region 2', date: '2025-04-04', score: 70 }
  ];
  
  const mockOutcomeIndicators = [
    { id: 1, name: 'Outcome 1', value: 75, target: 80, previousValue: 70 },
    { id: 2, name: 'Outcome 2', value: 60, target: 90, previousValue: 55 }
  ];
  
  const mockOutputIndicators = [
    { id: 1, name: 'Output 1', value: 85, target: 80, previousValue: 80 },
    { id: 2, name: 'Output 2', value: 40, target: 60, previousValue: 30 }
  ];
  
  return {
    schoolOutputSubmissions,
    districtOutputSubmissions,
    consolidatedChecklistSubmissions,
    partnersInPlaySubmissions,
    mockOutcomeIndicators,
    mockOutputIndicators
  };
});

// Import the API service after mocking its dependencies
import * as rtpApiService from '../../utils/RTP_apiService';

// Create a mock for RTPApiError class
class MockRTPApiError extends Error {
  constructor(status, message, endpoint) {
    super(message);
    this.status = status;
    this.endpoint = endpoint;
    this.name = 'RTPApiError';
  }
  
  getUserMessage() {
    return `API Error (${this.status}): ${this.message}`;
  }
}

// Add the mock error class to the API service module
rtpApiService.RTPApiError = MockRTPApiError;

// Mock the fetch function
global.fetch = jest.fn();

describe('RTP API Service', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('fetchFromApi', () => {
    it('should successfully fetch data from API', async () => {
      // Mock successful API response
      const mockData = { success: true, data: [1, 2, 3] };
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      // Call the function directly using the exported object
      const result = await rtpApiService.fetchFromApi('test-endpoint');
      
      // Verify fetch was called with correct parameters
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-endpoint'),
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

    it('should handle API errors and throw RTPApiError', async () => {
      // Mock API error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValueOnce({ error: 'Resource not found' })
      });

      // Verify error handling
      await expect(rtpApiService.fetchFromApi('test-endpoint')).rejects.toThrow();
      
      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network failure', async () => {
      // Mock network failure then success
      fetch.mockRejectedValueOnce(new Error('Network error'))
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce({ success: true })
           });

      // Call the function
      const result = await rtpApiService.fetchFromApi('test-endpoint');
      
      // Verify fetch was called twice (initial + 1 retry)
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Verify result
      expect(result).toEqual({ success: true });
    });
  });

  describe('getAllSubmissions', () => {
    it('should return mock data when useMockData is true', async () => {
      const result = await rtpApiService.getAllSubmissions(true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is an array
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API responses for all endpoints
      const mockResponses = [
        [{ id: 1, type: 'school' }],
        [{ id: 2, type: 'district' }],
        [{ id: 3, type: 'checklist' }],
        [{ id: 4, type: 'partners' }]
      ];
      
      // Setup fetch to return different mock data for each endpoint
      fetch.mockImplementation((url) => {
        let responseData;
        if (url.includes('school-responses')) responseData = mockResponses[0];
        else if (url.includes('output')) responseData = mockResponses[1];
        else if (url.includes('consolidated-checklist')) responseData = mockResponses[2];
        else if (url.includes('partners-in-play')) responseData = mockResponses[3];
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(responseData)
        });
      });

      const result = await rtpApiService.getAllSubmissions(false);
      
      // Verify fetch was called for each endpoint
      expect(fetch).toHaveBeenCalledTimes(4);
      
      // Verify result is combined from all endpoints
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
      expect(result).toEqual(expect.arrayContaining([
        { id: 1, type: 'school' },
        { id: 2, type: 'district' },
        { id: 3, type: 'checklist' },
        { id: 4, type: 'partners' }
      ]));
    });

    it('should handle partial API failures gracefully', async () => {
      // Mock mixed success/failure responses
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: 1, type: 'school' }])
      })).mockImplementationOnce(() => Promise.reject(new Error('Network error')))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 3, type: 'checklist' }])
        })).mockImplementationOnce(() => Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 4, type: 'partners' }])
        }));

      const result = await rtpApiService.getAllSubmissions(false);
      
      // Verify fetch was called for each endpoint
      expect(fetch).toHaveBeenCalledTimes(4);
      
      // Verify result contains data from successful endpoints
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result).toEqual(expect.arrayContaining([
        { id: 1, type: 'school' },
        { id: 3, type: 'checklist' },
        { id: 4, type: 'partners' }
      ]));
    });
  });

  describe('getRecentSubmissions', () => {
    it('should return sorted mock data when useMockData is true', async () => {
      const result = await rtpApiService.getRecentSubmissions(true, 5);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is an array with correct length
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      
      // Verify sorting (most recent first)
      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i-1].date);
        const currDate = new Date(result[i].date);
        expect(prevDate >= currDate).toBe(true);
      }
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API response
      const mockData = [
        { id: 1, date: '2025-04-01' },
        { id: 2, date: '2025-04-02' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.getRecentSubmissions(false, 2);
      
      // Verify fetch was called with correct endpoint
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('overview/recent?limit=2'),
        expect.any(Object)
      );
      
      // Verify result
      expect(result).toEqual(mockData);
    });

    it('should handle API failure with fallback to getAllSubmissions', async () => {
      // Mock API failure for recent submissions endpoint
      fetch.mockRejectedValueOnce(new Error('API error'))
           // Mock success for getAllSubmissions endpoints
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([
               { id: 1, date: '2025-04-05' },
               { id: 2, date: '2025-04-03' },
               { id: 3, date: '2025-04-10' }
             ])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           });

      const result = await rtpApiService.getRecentSubmissions(false, 2);
      
      // Verify fetch was called multiple times (initial failure + getAllSubmissions calls)
      expect(fetch).toHaveBeenCalledTimes(5);
      
      // Verify result is sorted by date and limited to 2
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(3); // Most recent date (2025-04-10)
      expect(result[1].id).toBe(1); // Second most recent (2025-04-05)
    });
  });

  describe('getSubmissionById', () => {
    it('should return specific submission from mock data when useMockData is true', async () => {
      // Call with a known ID from mock data
      const result = await rtpApiService.getSubmissionById('mock-id-1', true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is an object with the correct ID
      expect(result).toBeTruthy();
      expect(result.id.toString()).toBe('mock-id-1');
    });

    it('should return null for non-existent ID with mock data', async () => {
      const result = await rtpApiService.getSubmissionById('non-existent-id', true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is null
      expect(result).toBeNull();
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API response
      const mockData = { id: 'api-id-1', teacher: 'John Doe' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.getSubmissionById('api-id-1', false);
      
      // Verify fetch was called with correct endpoint
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('submissions/api-id-1'),
        expect.any(Object)
      );
      
      // Verify result
      expect(result).toEqual(mockData);
    });

    it('should handle 404 errors by searching in all submissions', async () => {
      // Mock 404 error for specific submission
      const notFoundError = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValueOnce({ error: 'Submission not found' })
      };
      
      // Mock successful response for getAllSubmissions
      const mockAllSubmissions = [
        { id: 'other-id', teacher: 'Jane Doe' },
        { id: 'target-id', teacher: 'John Smith' }
      ];
      
      fetch.mockResolvedValueOnce(notFoundError)
           // Mock responses for getAllSubmissions calls
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce(mockAllSubmissions[0])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce(mockAllSubmissions[1])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           });

      const result = await rtpApiService.getSubmissionById('target-id', false);
      
      // Verify fetch was called multiple times
      expect(fetch).toHaveBeenCalled();
      
      // Verify result is the correct submission from all submissions
      expect(result).toEqual({ id: 'target-id', teacher: 'John Smith' });
    });
  });

  describe('getSubmissionsByEntity', () => {
    it('should filter mock data correctly when useMockData is true', async () => {
      // Test for school entity
      const schoolResult = await rtpApiService.getSubmissionsByEntity('school', 'Test School', true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is filtered correctly
      expect(Array.isArray(schoolResult)).toBe(true);
      schoolResult.forEach(submission => {
        expect(submission.school).toBe('Test School');
      });
      
      // Test for teacher entity
      const teacherResult = await rtpApiService.getSubmissionsByEntity('teacher', 'Test Teacher', true);
      
      // Verify result is filtered correctly
      expect(Array.isArray(teacherResult)).toBe(true);
      teacherResult.forEach(submission => {
        expect(submission.teacher).toBe('Test Teacher');
      });
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API response
      const mockData = [
        { id: 1, school: 'Test School' },
        { id: 2, school: 'Test School' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.getSubmissionsByEntity('school', 'Test School', false);
      
      // Verify fetch was called with correct endpoint
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('schools/Test%20School/submissions'),
        expect.any(Object)
      );
      
      // Verify result
      expect(result).toEqual(mockData);
    });

    it('should handle API errors with fallback to getAllSubmissions', async () => {
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('API error'))
           // Mock success for getAllSubmissions endpoints
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([
               { id: 1, district: 'Other District' },
               { id: 2, district: 'Test District' },
               { id: 3, district: 'Test District' }
             ])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           })
           .mockResolvedValueOnce({
             ok: true,
             status: 200,
             json: jest.fn().mockResolvedValueOnce([])
           });

      const result = await rtpApiService.getSubmissionsByEntity('district', 'Test District', false);
      
      // Verify fetch was called multiple times
      expect(fetch).toHaveBeenCalled();
      
      // Verify result is filtered correctly from all submissions
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach(submission => {
        expect(submission.district).toBe('Test District');
      });
    });

    it('should validate entity type and return empty array for invalid type', async () => {
      const result = await rtpApiService.getSubmissionsByEntity('invalid-type', 'Test Entity', false);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is empty array
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getOutcomeIndicators', () => {
    it('should return mock data when useMockData is true', async () => {
      const result = await rtpApiService.getOutcomeIndicators(true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is an array
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API response
      const mockData = [
        { id: 1, name: 'Outcome 1' },
        { id: 2, name: 'Outcome 2' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.getOutcomeIndicators(false);
      
      // Verify fetch was called with correct endpoint
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('outcome-indicators'),
        expect.any(Object)
      );
      
      // Verify result
      expect(result).toEqual(mockData);
    });

    it('should handle API errors and fall back to mock data', async () => {
      // Mock API error
      fetch.mockRejectedValueOnce(new Error('API error'));

      const result = await rtpApiService.getOutcomeIndicators(false);
      
      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Verify result is mock data
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getOutputIndicators', () => {
    it('should return mock data when useMockData is true', async () => {
      const result = await rtpApiService.getOutputIndicators(true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is an array
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API response
      const mockData = [
        { id: 1, name: 'Output 1' },
        { id: 2, name: 'Output 2' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.getOutputIndicators(false);
      
      // Verify fetch was called with correct endpoint
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('output'),
        expect.any(Object)
      );
      
      // Verify result
      expect(result).toEqual(mockData);
    });
  });

  describe('getFilters', () => {
    it('should return mock filters when useMockData is true', async () => {
      const result = await rtpApiService.getFilters(true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result structure
      expect(result).toHaveProperty('regions');
      expect(result).toHaveProperty('districts');
      expect(result).toHaveProperty('schools');
      expect(result).toHaveProperty('teachers');
      expect(result).toHaveProperty('itineraries');
      
      // Verify all properties are arrays
      expect(Array.isArray(result.regions)).toBe(true);
      expect(Array.isArray(result.districts)).toBe(true);
      expect(Array.isArray(result.schools)).toBe(true);
      expect(Array.isArray(result.teachers)).toBe(true);
      expect(Array.isArray(result.itineraries)).toBe(true);
    });

    it('should fetch from API when useMockData is false', async () => {
      // Mock successful API responses
      fetch.mockImplementation((url) => {
        let responseData;
        if (url.includes('regions')) responseData = ['Region 1', 'Region 2'];
        else if (url.includes('districts')) responseData = ['District 1', 'District 2'];
        else if (url.includes('schools')) responseData = ['School 1', 'School 2'];
        else if (url.includes('itineraries')) responseData = ['Itinerary 1', 'Itinerary 2'];
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(responseData)
        });
      });

      const result = await rtpApiService.getFilters(false);
      
      // Verify fetch was called for each endpoint
      expect(fetch).toHaveBeenCalledTimes(4);
      
      // Verify result structure
      expect(result).toHaveProperty('regions');
      expect(result).toHaveProperty('districts');
      expect(result).toHaveProperty('schools');
      expect(result).toHaveProperty('itineraries');
      
      // Verify values
      expect(result.regions).toEqual(['Region 1', 'Region 2']);
      expect(result.districts).toEqual(['District 1', 'District 2']);
      expect(result.schools).toEqual(['School 1', 'School 2']);
      expect(result.itineraries).toEqual(['Itinerary 1', 'Itinerary 2']);
    });

    it('should handle partial API failures gracefully', async () => {
      // Mock mixed success/failure responses
      fetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(['Region 1', 'Region 2'])
      })).mockImplementationOnce(() => Promise.reject(new Error('Network error')))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(['School 1', 'School 2'])
        })).mockImplementationOnce(() => Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(['Itinerary 1', 'Itinerary 2'])
        }));

      const result = await rtpApiService.getFilters(false);
      
      // Verify fetch was called for each endpoint
      expect(fetch).toHaveBeenCalledTimes(4);
      
      // Verify result structure
      expect(result).toHaveProperty('regions');
      expect(result).toHaveProperty('districts');
      expect(result).toHaveProperty('schools');
      expect(result).toHaveProperty('itineraries');
      
      // Verify values - districts should be empty array due to failure
      expect(result.regions).toEqual(['Region 1', 'Region 2']);
      expect(result.districts).toEqual([]);
      expect(result.schools).toEqual(['School 1', 'School 2']);
      expect(result.itineraries).toEqual(['Itinerary 1', 'Itinerary 2']);
    });
  });
});
