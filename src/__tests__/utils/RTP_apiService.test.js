// Mock the actual dependencies of RTP_apiService.js
jest.mock('@/app/dashboard/admin/rtp-ui/mock/mockSubmissions', () => ({
  schoolOutputSubmissions: [
    { id: 'mock-id-1', survey_type: 'school_output', teacher: 'Test Teacher', school: 'Test School', district: 'Test District', region: 'Test Region', date: '2025-04-01', score: 80 },
    { id: 'mock-id-2', survey_type: 'school_output', teacher: 'Test Teacher 2', school: 'Test School 2', district: 'Test District', region: 'Test Region', date: '2025-03-28', score: 75 }
  ],
  districtOutputSubmissions: [
    { id: 'mock-id-3', survey_type: 'district_output', teacher: 'Test Teacher', school: 'Test School', district: 'Test District', region: 'Test Region', date: '2025-04-02', score: 85 }
  ],
  consolidatedChecklistSubmissions: [
    { id: 'mock-id-4', survey_type: 'consolidated_checklist', teacher: 'Test Teacher 3', school: 'Test School 3', district: 'Test District 2', region: 'Test Region 2', date: '2025-04-03', score: 90 }
  ],
  partnersInPlaySubmissions: [
    { id: 'mock-id-5', survey_type: 'partners_in_play', teacher: 'Test Teacher 4', school: 'Test School 4', district: 'Test District 2', region: 'Test Region 2', date: '2025-04-04', score: 70 }
  ],
}));

jest.mock('@/app/dashboard/admin/rtp-ui/mock/mockIndicators', () => ({
  mockOutcomeIndicators: [
    { id: 1, name: 'Outcome 1', value: 75, target: 80, previousValue: 70 },
    { id: 2, name: 'Outcome 2', value: 60, target: 90, previousValue: 55 }
  ],
  mockOutputIndicators: [
    { id: 1, name: 'Output 1', value: 85, target: 80, previousValue: 80 },
    { id: 2, name: 'Output 2', value: 40, target: 60, previousValue: 30 }
  ],
}));

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
// rtpApiService.RTPApiError = MockRTPApiError; // This might not be needed if MockRTPApiError is used directly in tests
if (rtpApiService.default) { // Check if default exists before trying to assign to its property
  rtpApiService.default.RTPApiError = MockRTPApiError;
}


// Mock the fetch function
global.fetch = jest.fn();

describe('RTP API Service', () => {
  jest.setTimeout(15000); // Set timeout for all tests in this describe block

  beforeEach(() => {
    fetch.mockReset(); // Use mockReset to clear implementations and calls
  });

  // describe('fetchFromApi', () => { // fetchFromApi is not directly exported on the default object
  //   it('should successfully fetch data from API', async () => {
  //     // Mock successful API response
  //     const mockData = { success: true, data: [1, 2, 3] };
  //     fetch.mockResolvedValueOnce({
  //       ok: true,
  //       status: 200,
  //       json: jest.fn().mockResolvedValueOnce(mockData)
  //     });

  //     // Call the function directly using the exported object
  //     // This would require fetchFromApi to be part of the default export or a named export
  //     // const result = await rtpApiService.default.fetchFromApi('test-endpoint');

  //     // Verify fetch was called with correct parameters
  //     // expect(fetch).toHaveBeenCalledWith(
  //     //   expect.stringContaining('test-endpoint'),
  //     //   expect.objectContaining({
  //     //     method: 'GET',
  //     //     headers: expect.objectContaining({
  //     //       'Content-Type': 'application/json'
  //     //     })
  //     //   })
  //     // );

  //     // Verify result
  //     // expect(result).toEqual(mockData);
  //   });

  //   it('should handle API errors and throw RTPApiError', async () => {
  //     // Mock API error response
  //     fetch.mockResolvedValueOnce({
  //       ok: false,
  //       status: 404,
  //       statusText: 'Not Found',
  //       json: jest.fn().mockResolvedValueOnce({ error: 'Resource not found' })
  //     });

  //     // Verify error handling
  //     // await expect(rtpApiService.default.fetchFromApi('test-endpoint')).rejects.toThrow();

  //     // Verify fetch was called
  //     // expect(fetch).toHaveBeenCalledTimes(1);
  //   });

  //   it('should retry on network failure', async () => {
  //     // Mock network failure then success
  //     fetch.mockRejectedValueOnce(new Error('Network error'))
  //          .mockResolvedValueOnce({
  //            ok: true,
  //            status: 200,
  //            json: jest.fn().mockResolvedValueOnce({ success: true })
  //          });

  //     // Call the function
  //     // const result = await rtpApiService.default.fetchFromApi('test-endpoint');

  //     // Verify fetch was called twice (initial + 1 retry)
  //     // expect(fetch).toHaveBeenCalledTimes(2);

  //     // Verify result
  //     // expect(result).toEqual({ success: true });
  //   });
  // });

  describe('getAllSubmissions', () => {
    it('should return mock data when useMockData is true', async () => {
      const result = await rtpApiService.default.getAllSubmissions(true);
      
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
      
      const schoolData = [{ id: 1, type: 'school' }];
      const districtData = [{ id: 2, type: 'district' }];
      const checklistData = [{ id: 3, type: 'checklist' }];
      const partnersData = [{ id: 4, type: 'partners' }];

      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(schoolData) }) // for school-responses
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(districtData) }) // for output
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(checklistData) }) // for consolidated-checklist
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(partnersData) }); // for partners-in-play
      
      const result = await rtpApiService.default.getAllSubmissions(false);
      
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(result).toEqual([...schoolData, ...districtData, ...checklistData, ...partnersData]);
    });

    it('should handle partial API failures gracefully', async () => {
      const schoolData = [{ id: 1, type: 'school' }];
      // output data will fail and retry, then ultimately use []
      const checklistData = [{ id: 3, type: 'checklist' }];
      const partnersData = [{ id: 4, type: 'partners' }];

      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(schoolData) }) // 1st call (school-responses) - success
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'output')) // 2nd call (output) - initial fail - Corrected
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'output')) // 3rd call (output) - retry 1 fail - Corrected
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'output')) // 4th call (output) - retry 2 fail - Corrected
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'output')) // 5th call (output) - retry 3 fail (max retries reached) - Corrected
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(checklistData) }) // 6th call (consolidated-checklist) - success
        .mockResolvedValueOnce({ ok: true, status: 200, json: jest.fn().mockResolvedValueOnce(partnersData) }); // 7th call (partners-in-play) - success

      const result = await rtpApiService.getAllSubmissions(false);
      
      // school (1) + output (1 initial + 3 retries) + checklist (1) + partners (1) = 7 calls
      expect(fetch).toHaveBeenCalledTimes(7);
      
      expect(Array.isArray(result)).toBe(true);
      // Expect data from successful calls, and empty array for the one that ultimately failed
      expect(result).toEqual(expect.arrayContaining([
        ...schoolData,
        // ... (empty for districtOutput as it failed all retries)
        ...checklistData,
        ...partnersData
      ]));
      // More precise check for length and content
      expect(result.length).toBe(schoolData.length + checklistData.length + partnersData.length);
      expect(result).not.toEqual(expect.arrayContaining(districtData)); // Ensure districtData is not there
    }, 10000); // Increased timeout for this specific test due to retries and sleeps
  });

  describe('getRecentSubmissions', () => {
    it('should return sorted mock data when useMockData is true', async () => {
      const result = await rtpApiService.default.getRecentSubmissions(true, 5);
      
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

      const result = await rtpApiService.default.getRecentSubmissions(false, 2);
      
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
      fetch.mockReset();
      // Mock API failure for recent submissions endpoint
      fetch.mockRejectedValueOnce(new rtpApiService.RTPApiError('API error', 500, 'overview/recent?limit=2'));

      // Mock success for the subsequent getAllSubmissions call's internal fetches
      const mockFallbackSubmissions = [
        { id: 1, date: '2025-04-05', survey_type: 'school_output', teacher: 'A', school: 'S1', district: 'D1', region: 'R1', score: 80, itinerary: 'I1' },
        { id: 2, date: '2025-04-03', survey_type: 'district_output', teacher: 'B', school: 'S2', district: 'D1', region: 'R1', score: 70, itinerary: 'I2' },
        { id: 3, date: '2025-04-10', survey_type: 'consolidated_checklist', teacher: 'C', school: 'S3', district: 'D2', region: 'R2', score: 90, itinerary: 'I1' }
      ];
      // These need to match the order of calls in getAllSubmissions
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockFallbackSubmissions[0]] }); // school-responses
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockFallbackSubmissions[1]] }); // output
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockFallbackSubmissions[2]] }); // consolidated-checklist
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }); // partners-in-play

      const result = await rtpApiService.default.getRecentSubmissions(false, 2);

      // 1 (getRecent) + 4 (getAllSubmissions) = 5 calls
      expect(fetch).toHaveBeenCalledTimes(5);
      
      // Verify result is sorted by date and limited to 2 from the fallback data
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(3); // Most recent: 2025-04-10
      expect(result[1].id).toBe(1); // Second most recent: 2025-04-05
    });
  });

  describe('getSubmissionById', () => {
    it('should return specific submission from mock data when useMockData is true', async () => {
      // Call with a known ID from mock data
      const result = await rtpApiService.default.getSubmissionById('mock-id-1', true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is an object with the correct ID
      expect(result).toBeTruthy();
      expect(result.id.toString()).toBe('mock-id-1');
    });

    it('should return null for non-existent ID with mock data', async () => {
      const result = await rtpApiService.default.getSubmissionById('non-existent-id', true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is null
      expect(result).toBeNull();
    });

    it('should fetch from API when useMockData is false', async () => {
      fetch.mockReset();
      const mockData = { id: 'api-id-1', teacher: 'John Doe' };
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.default.getSubmissionById('api-id-1', false);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('submissions/api-id-1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should handle 404 errors by searching in all submissions', async () => {
      fetch.mockReset();
      const targetId = 'target-id';
      const mockAllSubmissionsData = [
        { id: 'other-id', survey_type: 'type1', teacher: 'Jane Doe', school: 'S1', district: 'D1', region: 'R1', date: '2023-01-01', score: 70, itinerary: 'I1' },
        { id: targetId, survey_type: 'type2', teacher: 'John Smith', school: 'S2', district: 'D2', region: 'R2', date: '2023-01-02', score: 80, itinerary: 'I2' }
      ];

      // Call 1: Initial fetch for submission by ID (fails with 404)
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Submission not found' })
      });

      // Calls 2-5: Fallback to getAllSubmissions
      // Ensure these return arrays, as getAllSubmissions processes parts of these
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockAllSubmissionsData[0]] }); // school-responses (example)
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockAllSubmissionsData[1]] }); // output (example, contains the target)
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }); // consolidated-checklist
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }); // partners-in-play
      
      const result = await rtpApiService.default.getSubmissionById(targetId, false);
      
      // 1 for initial getSubmissionById, 4 for the fallback getAllSubmissions
      expect(fetch).toHaveBeenCalledTimes(5);
      expect(result).toEqual(mockAllSubmissionsData[1]); // Should find the target submission
    });
  });

  describe('getSubmissionsByEntity', () => {
    it('should filter mock data correctly when useMockData is true', async () => {
      // Test for school entity
      const schoolResult = await rtpApiService.default.getSubmissionsByEntity('school', 'Test School', true);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is filtered correctly
      expect(Array.isArray(schoolResult)).toBe(true);
      schoolResult.forEach(submission => {
        expect(submission.school).toBe('Test School');
      });
      
      // Test for teacher entity
      const teacherResult = await rtpApiService.default.getSubmissionsByEntity('teacher', 'Test Teacher', true);
      
      // Verify result is filtered correctly
      expect(Array.isArray(teacherResult)).toBe(true);
      teacherResult.forEach(submission => {
        expect(submission.teacher).toBe('Test Teacher');
      });
    });

    it('should fetch from API when useMockData is false', async () => {
      fetch.mockReset();
      const mockEntityData = [
        { id: 1, school: 'Test School', survey_type: 'typeA' },
        { id: 2, school: 'Test School', survey_type: 'typeB' }
      ];
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockEntityData)
      });

      const result = await rtpApiService.default.getSubmissionsByEntity('school', 'Test School', false);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('schools/Test%20School/submissions'),
        expect.any(Object)
      );
      expect(result).toEqual(mockEntityData);
    });

    it('should handle API errors with fallback to getAllSubmissions', async () => {
      fetch.mockReset();
      const entityType = 'district';
      const entityName = 'Test District';
      const mockFallbackSubmissions = [
        { id: 1, district: 'Other District', survey_type: 'type1', school: 'S1', teacher: 'T1', region: 'R1', date: 'd1', score: 0, itinerary: 'i1' },
        { id: 2, district: entityName, survey_type: 'type2', school: 'S2', teacher: 'T2', region: 'R2', date: 'd2', score: 0, itinerary: 'i2' }, // Match
        { id: 3, district: entityName, survey_type: 'type3', school: 'S3', teacher: 'T3', region: 'R3', date: 'd3', score: 0, itinerary: 'i3' }  // Match
      ];

      // Call 1: Initial fetch for getSubmissionsByEntity (fails)
      fetch.mockRejectedValueOnce(new rtpApiService.RTPApiError('API error', 500, `${entityType}s/${encodeURIComponent(entityName)}/submissions`));

      // Calls 2-5: Fallback to getAllSubmissions
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockFallbackSubmissions[0]] });
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockFallbackSubmissions[1]] });
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [mockFallbackSubmissions[2]] });
      fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

      const result = await rtpApiService.default.getSubmissionsByEntity(entityType, entityName, false);

      expect(fetch).toHaveBeenCalledTimes(5); // 1 for initial, 4 for getAllSubmissions
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // Should find the two matching district submissions
      expect(result).toEqual(expect.arrayContaining([mockFallbackSubmissions[1], mockFallbackSubmissions[2]]));
    });

    it('should validate entity type and return empty array for invalid type', async () => {
      fetch.mockReset(); // Ensure no interference from other tests
      const result = await rtpApiService.default.getSubmissionsByEntity('invalid-type', 'Test Entity', false);
      
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
      
      // Verify result is empty array
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getOutcomeIndicators', () => {
    it('should return mock data when useMockData is true', async () => {
      const result = await rtpApiService.default.getOutcomeIndicators(true);
      
      expect(fetch).not.toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch from API when useMockData is false', async () => {
      fetch.mockReset();
      const mockData = [ { id: 1, name: 'Outcome 1' }, { id: 2, name: 'Outcome 2' } ];
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });

      const result = await rtpApiService.default.getOutcomeIndicators(false);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('outcome-indicators'), expect.any(Object));
      expect(result).toEqual(mockData);
    });

    it('should handle API errors and fall back to mock data', async () => {
      fetch.mockReset();
      // Simulate fetchFromApi failing all retries for the 'outcome-indicators' endpoint
      fetch.mockRejectedValue(new rtpApiService.RTPApiError('API error', 500, 'outcome-indicators'));

      const result = await rtpApiService.default.getOutcomeIndicators(false);
      
      // fetchFromApi will call fetch 1 (initial) + 3 (retries) = 4 times
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(Array.isArray(result)).toBe(true);
      // Ensure it falls back to the imported mockOutcomeIndicators
      const { mockOutcomeIndicators } = await import('@/app/dashboard/admin/rtp-ui/mock/mockIndicators');
      expect(result).toEqual(mockOutcomeIndicators);
    });
  });

  describe('getOutputIndicators', () => {
    it('should return mock data when useMockData is true', async () => {
      const result = await rtpApiService.default.getOutputIndicators(true);
      
      expect(fetch).not.toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fetch from API when useMockData is false', async () => {
      fetch.mockReset();
      const mockData = [ { id: 1, name: 'Output 1' }, { id: 2, name: 'Output 2' } ];
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockData)
      });
      const result = await rtpApiService.default.getOutputIndicators(false);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('output'), expect.any(Object));
      expect(result).toEqual(mockData);
    });

    // Adding a similar test for getOutputIndicators error handling
    it('should handle API errors and fall back to mock data for output indicators', async () => {
      fetch.mockReset();
      fetch.mockRejectedValue(new rtpApiService.RTPApiError('API error', 500, 'output'));

      const result = await rtpApiService.default.getOutputIndicators(false);
      expect(fetch).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
      expect(Array.isArray(result)).toBe(true);
      const { mockOutputIndicators } = await import('@/app/dashboard/admin/rtp-ui/mock/mockIndicators');
      expect(result).toEqual(mockOutputIndicators);
    });
  });

  describe('getFilters', () => {
    it('should return mock filters when useMockData is true', async () => {
      const result = await rtpApiService.default.getFilters(true);
      
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
      fetch.mockReset();
      const regionsData = ['Region 1', 'Region 2'];
      const districtsData = ['District 1', 'District 2'];
      const schoolsData = ['School 1', 'School 2'];
      const itinerariesData = ['Itinerary 1', 'Itinerary 2'];
      const submissionsDataForTeachers = [
        { teacher: 'Teacher A', survey_type: 'school_output' },
        { teacher: 'Teacher B', survey_type: 'district_output' }
      ];

      // Initial filter calls
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => regionsData })       // Call 1 (regions)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => districtsData })     // Call 2 (districts)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => schoolsData })       // Call 3 (schools)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => itinerariesData });  // Call 4 (itineraries)

      // Mocks for the internal getAllSubmissions call (for teachers)
      // This assumes getAllSubmissions is called after the above 4 calls.
      // Order of these internal calls: school-responses, output, consolidated-checklist, partners-in-play
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => submissionsDataForTeachers.filter(s => s.survey_type === 'school_output') }) // Call 5
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => submissionsDataForTeachers.filter(s => s.survey_type === 'district_output') })      // Call 6
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => submissionsDataForTeachers.filter(s => s.survey_type === 'consolidated_checklist') }) // Call 7
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => submissionsDataForTeachers.filter(s => s.survey_type === 'partners_in_play') });      // Call 8

      const result = await rtpApiService.default.getFilters(false);

      expect(fetch).toHaveBeenCalledTimes(4 + 4); // 4 for filters + 4 for teacher sub-call
      expect(result.regions).toEqual(regionsData);
      expect(result.districts).toEqual(districtsData);
      expect(result.schools).toEqual(schoolsData);
      expect(result.itineraries).toEqual(itinerariesData);
      expect(result.teachers).toEqual(['Teacher A', 'Teacher B']);
    });

    it('should handle partial API failures gracefully', async () => {
      fetch.mockReset();
      const regionsData = ['Region 1', 'Region 2'];
      const schoolsData = ['School 1', 'School 2'];
      const itinerariesData = ['Itinerary 1', 'Itinerary 2'];
      const submissionsDataForTeachers = [{ teacher: 'Teacher A', survey_type: 'school_output' }];

      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => regionsData })      // Call 1: regions - success
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'districts')) // Call 2: districts - initial fail
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'districts')) // Call 3: districts - retry 1 fail
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'districts')) // Call 4: districts - retry 2 fail
        .mockRejectedValueOnce(new rtpApiService.RTPApiError('Network error', 'NETWORK', 'districts')) // Call 5: districts - retry 3 fail (max retries)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => schoolsData })      // Call 6: schools - success
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => itinerariesData }); // Call 7: itineraries - success

      // Mocks for internal getAllSubmissions (for teachers), assuming it runs successfully after other filter fetches
      fetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => submissionsDataForTeachers }) // Call 8: school-responses for teacher
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }) // Call 9: output for teacher
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] }) // Call 10: checklist for teacher
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });// Call 11: partners for teacher

      const result = await rtpApiService.default.getFilters(false);

      expect(fetch).toHaveBeenCalledTimes(1 + 4 + 1 + 1 + 4);

      expect(result.regions).toEqual(regionsData);
      expect(result.districts).toEqual([]);
      expect(result.schools).toEqual(schoolsData);
      expect(result.itineraries).toEqual(itinerariesData);
      expect(result.teachers).toEqual(['Teacher A']);
    }, 10000);
  });
});
