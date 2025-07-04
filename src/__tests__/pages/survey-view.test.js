import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurveyViewPage from '../../app/dashboard/admin/rtp/survey-view/[surveyId]/page';
import * as rtpApiService from '../../utils/RTP_apiService';
import { RTP_DataSourceProvider } from '../../context/RTP_DataSourceContext';

// Mock MUI components
jest.mock('@mui/material', () => {
  const React = require('react');
  const actual = jest.requireActual('@mui/material');
  
  return {
    ...actual,
    CircularProgress: function MockCircularProgress() {
      return React.createElement('div', { role: 'progressbar' }, 'Loading...');
    },
    Alert: function MockAlert(props) {
      return React.createElement('div', { role: 'alert', 'data-severity': props.severity }, props.children);
    }
  };
});

// Mock MUI icons
jest.mock('@mui/icons-material/ArrowBack', () => {
  const React = require('react');
  return function ArrowBackIcon() {
    return React.createElement('span', { 'data-testid': 'arrow-back-icon' }, 'Back');
  };
});

// Mock the utility functions
jest.mock('../../utils/RTP_dataUtils', () => ({
  formatDate: jest.fn(date => new Date(date).toLocaleDateString()),
  calculatePercentage: jest.fn((value, total) => (value / total) * 100),
  capPercentage: jest.fn(value => Math.min(100, Math.max(0, value)))
}));

// Mock the API service
jest.mock('../../utils/RTP_apiService');

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/dashboard/admin/rtp/survey-view/test-survey-id',
  useParams: () => ({ surveyId: 'test-survey-id' }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock data for testing
const mockSurveyData = {
  id: 'test-survey-id',
  survey_type: 'school_output',
  teacher: 'John Doe',
  school: 'Test School',
  district: 'Test District',
  region: 'Test Region',
  date: '2025-04-20',
  score: 80,
  responses: [
    { question: 'Question 1', answer: 'Answer 1', score: 5 },
    { question: 'Question 2', answer: 'Answer 2', score: 4 }
  ],
  comments: 'Test comments',
  itinerary: 'Test Itinerary'
};

const mockRelatedSubmissions = [
  { 
    id: 'related-1', 
    survey_type: 'school_output', 
    teacher: 'John Doe',
    school: 'Test School',
    date: '2025-04-15',
    score: 75
  },
  { 
    id: 'related-2', 
    survey_type: 'school_output', 
    teacher: 'Jane Smith',
    school: 'Test School',
    date: '2025-04-10',
    score: 70
  }
];

// Setup wrapper component with context provider
const renderWithProvider = (ui) => {
  return render(
    <RTP_DataSourceProvider>
      {ui}
    </RTP_DataSourceProvider>
  );
};

describe('Survey View Page', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    rtpApiService.getSubmissionById.mockResolvedValue(mockSurveyData);
    rtpApiService.getAllSubmissions.mockResolvedValue([
      mockSurveyData,
      ...mockRelatedSubmissions
    ]);
  });

  it('renders loading state initially', () => {
    renderWithProvider(<SurveyViewPage />);
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders survey details after loading', async () => {
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for survey details
    expect(screen.getByRole('heading', { name: /survey details/i, level: 5 })).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Test School')).toBeInTheDocument();
    expect(screen.getByText('Test District')).toBeInTheDocument();
    expect(screen.getByText('Test Region')).toBeInTheDocument();
    expect(screen.getByText('School Output')).toBeInTheDocument(); // Formatted survey type
    
    // Check for survey responses
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('Answer 2')).toBeInTheDocument();
    
    // Check for related submissions section
    expect(screen.getByText('Related Submissions')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // From related submissions
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    rtpApiService.getSubmissionById.mockRejectedValue(new Error('API error'));
    
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for error message
    expect(screen.getByText(/failed to load survey data/i)).toBeInTheDocument();
    
    // Check for back button
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('handles survey not found gracefully', async () => {
    // Mock survey not found
    rtpApiService.getSubmissionById.mockResolvedValue(null);
    
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for error message
    expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
  });

  it('handles related submissions API errors gracefully', async () => {
    // Mock successful survey fetch but failed related submissions
    rtpApiService.getSubmissionById.mockResolvedValue(mockSurveyData);
    rtpApiService.getAllSubmissions.mockRejectedValue(new Error('API error'));
    
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that survey details are still displayed
    expect(screen.getByText('Survey Details')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Related submissions section should exist but be empty
    expect(screen.getByText('Related Submissions')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument(); // Should not be found
  });

  it('toggles between mock and live data', async () => {
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check initial API calls with mock data (true)
    expect(rtpApiService.getSubmissionById).toHaveBeenCalledWith('test-survey-id', true);
    expect(rtpApiService.getAllSubmissions).toHaveBeenCalledWith(true);
    
    // Find and click the toggle switch
    const toggleSwitch = screen.getByRole('checkbox', { name: /use mock data/i });
    act(() => {
      userEvent.click(toggleSwitch);
    });
    
    // Wait for re-loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check API calls with live data (false)
    expect(rtpApiService.getSubmissionById).toHaveBeenCalledWith('test-survey-id', false);
    expect(rtpApiService.getAllSubmissions).toHaveBeenCalledWith(false);
  });

  it('displays correct score and progress indicators', async () => {
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for score display
    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument(); // Overall score
    });
    
    // Check for progress indicators
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('navigates back when back button is clicked', async () => {
    // Mock router
    const mockBack = jest.fn();
    jest.mock('next/navigation', () => ({
      ...jest.requireActual('next/navigation'),
      useRouter: () => ({
        back: mockBack,
        push: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn()
      })
    }));
    
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the back button (exact match)
    const backButton = screen.getByRole('button', { name: /^back$/i });
    userEvent.click(backButton);
    
    // Check that back function was called
    expect(mockBack).toHaveBeenCalled();
  });

  it('displays correct date formatting', async () => {
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for formatted date (assuming the formatDate function formats to MM/DD/YYYY)
    // This test may need adjustment based on your actual date formatting
    await waitFor(() => {
      expect(screen.getByText(/04\/20\/2025/i)).toBeInTheDocument();
    });
  });

  it('links to related submissions correctly', async () => {
    renderWithProvider(<SurveyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for links to related submissions
    const relatedLinks = screen.getAllByRole('link');
    const firstRelatedLink = relatedLinks.find(link => 
      link.getAttribute('href')?.includes('related-1')
    );
    
    expect(firstRelatedLink).toBeInTheDocument();
    expect(firstRelatedLink.getAttribute('href')).toContain('related-1');
  });
});
