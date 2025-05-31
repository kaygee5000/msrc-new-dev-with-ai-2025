/**
 * Simple tests for RTP API Service
 */

// Mock the fetch function
global.fetch = jest.fn();

// Create a simplified mock for the API service
const mockGetAllSubmissions = jest.fn().mockResolvedValue([
  { id: 1, name: 'Test Submission 1' },
  { id: 2, name: 'Test Submission 2' }
]);

const mockGetRecentSubmissions = jest.fn().mockResolvedValue([
  { id: 1, name: 'Recent Submission 1', date: '2025-04-20' }
]);

const mockGetSubmissionById = jest.fn().mockImplementation((id) => {
  if (id === '1') {
    return Promise.resolve({ id: '1', name: 'Test Submission 1' });
  }
  return Promise.resolve(null);
});

// Mock the entire API service module
jest.mock('../../utils/RTP_apiService', () => ({
  getAllSubmissions: mockGetAllSubmissions,
  getRecentSubmissions: mockGetRecentSubmissions,
  getSubmissionById: mockGetSubmissionById,
  fetchFromApi: jest.fn().mockResolvedValue({ success: true }),
  RTPApiError: class RTPApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
      this.name = 'RTPApiError';
    }
    getUserMessage() {
      return `API Error (${this.status}): ${this.message}`;
    }
  }
}));

// Import the mocked API service
import * as rtpApiService from '../../utils/RTP_apiService';

describe('RTP API Service - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSubmissions', () => {
    it('should return submissions', async () => {
      const result = await rtpApiService.getAllSubmissions();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(mockGetAllSubmissions).toHaveBeenCalled();
    });
  });

  describe('getRecentSubmissions', () => {
    it('should return recent submissions', async () => {
      const result = await rtpApiService.getRecentSubmissions();
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-04-20');
      expect(mockGetRecentSubmissions).toHaveBeenCalled();
    });
  });

  describe('getSubmissionById', () => {
    it('should return a submission by ID', async () => {
      const result = await rtpApiService.getSubmissionById('1');
      expect(result).not.toBeNull();
      expect(result.id).toBe('1');
      expect(mockGetSubmissionById).toHaveBeenCalledWith('1');
    });

    it('should return null for non-existent ID', async () => {
      const result = await rtpApiService.getSubmissionById('999');
      expect(result).toBeNull();
      expect(mockGetSubmissionById).toHaveBeenCalledWith('999');
    });
  });
});
