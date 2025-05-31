import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RTP_Dashboard from '../../components/RTP_Dashboard';
import * as rtpApiService from '../../utils/RTP_apiService';
import { RTP_DataSourceProvider } from '../../context/RTP_DataSourceContext';

// Mock the utility functions
jest.mock('../../app/dashboard/admin/rtp-ui/utils/dataUtils', () => ({
  formatDate: jest.fn(date => new Date(date).toLocaleDateString()),
  calculatePercentage: jest.fn((value, total) => (value / total) * 100),
  capPercentage: jest.fn(value => Math.min(100, Math.max(0, value)))
}));

// Mock the components
jest.mock('../../app/dashboard/admin/rtp-ui/components/IndicatorCard', () => {
  const React = require('react');
  return function MockIndicatorCard(props) {
    return React.createElement('div', { 'data-testid': 'indicator-card' }, props.value + '%');
  };
});

jest.mock('../../app/dashboard/admin/rtp-ui/components/DrilldownDialog', () => {
  const React = require('react');
  return function MockDrilldownDialog(props) {
    return React.createElement('div', { 'data-testid': 'drilldown-dialog' }, 'Mock Dialog');
  };
});

// Mock the API service
jest.mock('../../utils/RTP_apiService');

// Mock data for testing
const mockOutcomeIndicators = [
  { id: 1, name: 'Outcome 1', value: 75, target: 80, previousValue: 70 },
  { id: 2, name: 'Outcome 2', value: 60, target: 90, previousValue: 55 }
];

const mockOutputIndicators = [
  { id: 1, name: 'Output 1', value: 85, target: 80, previousValue: 80 },
  { id: 2, name: 'Output 2', value: 40, target: 60, previousValue: 30 }
];

const mockRecentSubmissions = [
  { 
    id: 'sub1', 
    survey_type: 'school_output', 
    teacher: 'John Doe',
    school: 'Test School',
    district: 'Test District',
    region: 'Test Region',
    date: '2025-04-20',
    score: 80
  },
  { 
    id: 'sub2', 
    survey_type: 'district_output', 
    teacher: 'Jane Smith',
    school: 'Another School',
    district: 'Another District',
    region: 'Another Region',
    date: '2025-04-18',
    score: 75
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

describe('RTP_Dashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    rtpApiService.getOutcomeIndicators.mockResolvedValue(mockOutcomeIndicators);
    rtpApiService.getOutputIndicators.mockResolvedValue(mockOutputIndicators);
    rtpApiService.getRecentSubmissions.mockResolvedValue(mockRecentSubmissions);
  });

  it('renders loading state initially', () => {
    renderWithProvider(<RTP_Dashboard />);
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for dashboard sections
    expect(screen.getByText('RTP Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Outcome Indicators')).toBeInTheDocument();
    expect(screen.getByText('Output Indicators')).toBeInTheDocument();
    expect(screen.getByText('Recent Submissions')).toBeInTheDocument();
    
    // Check for indicator data
    expect(screen.getByText('Outcome 1')).toBeInTheDocument();
    expect(screen.getByText('Outcome 2')).toBeInTheDocument();
    expect(screen.getByText('Output 1')).toBeInTheDocument();
    expect(screen.getByText('Output 2')).toBeInTheDocument();
    
    // Check for recent submissions
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    rtpApiService.getOutcomeIndicators.mockRejectedValue(new Error('API error'));
    rtpApiService.getOutputIndicators.mockRejectedValue(new Error('API error'));
    rtpApiService.getRecentSubmissions.mockRejectedValue(new Error('API error'));
    
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for error message
    expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
  });

  it('handles partial API failures gracefully', async () => {
    // Mock partial API failure (only outcome indicators fail)
    rtpApiService.getOutcomeIndicators.mockRejectedValue(new Error('API error'));
    
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that output indicators and recent submissions are still displayed
    expect(screen.getByText('Output Indicators')).toBeInTheDocument();
    expect(screen.getByText('Output 1')).toBeInTheDocument();
    expect(screen.getByText('Recent Submissions')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Outcome indicators section might still render but without data
    expect(screen.getByText('Outcome Indicators')).toBeInTheDocument();
    expect(screen.queryByText('Outcome 1')).not.toBeInTheDocument();
  });

  it('toggles between mock and live data', async () => {
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check initial API calls with mock data (true)
    expect(rtpApiService.getOutcomeIndicators).toHaveBeenCalledWith(true);
    expect(rtpApiService.getOutputIndicators).toHaveBeenCalledWith(true);
    expect(rtpApiService.getRecentSubmissions).toHaveBeenCalledWith(true, 10);
    
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
    expect(rtpApiService.getOutcomeIndicators).toHaveBeenCalledWith(false);
    expect(rtpApiService.getOutputIndicators).toHaveBeenCalledWith(false);
    expect(rtpApiService.getRecentSubmissions).toHaveBeenCalledWith(false, 10);
  });

  it('displays correct progress indicators for outcome and output metrics', async () => {
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for progress indicators
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
    
    // Check for percentage values
    expect(screen.getByText('75%')).toBeInTheDocument(); // Outcome 1 value
    expect(screen.getByText('60%')).toBeInTheDocument(); // Outcome 2 value
    expect(screen.getByText('85%')).toBeInTheDocument(); // Output 1 value
    expect(screen.getByText('40%')).toBeInTheDocument(); // Output 2 value
  });

  it('navigates to survey details when clicking on a recent submission', async () => {
    // Mock router
    const mockRouter = { push: jest.fn() };
    jest.mock('next/navigation', () => ({
      ...jest.requireActual('next/navigation'),
      useRouter: () => mockRouter
    }));
    
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the first submission
    const submissionLinks = screen.getAllByRole('link');
    const firstSubmissionLink = submissionLinks.find(link => 
      link.textContent.includes('John Doe') || 
      link.getAttribute('href').includes('sub1')
    );
    
    expect(firstSubmissionLink).toBeInTheDocument();
    expect(firstSubmissionLink.getAttribute('href')).toContain('sub1');
  });

  it('displays correct date formatting for recent submissions', async () => {
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for formatted dates (assuming the formatDate function formats to MM/DD/YYYY)
    // This test may need adjustment based on your actual date formatting
    expect(screen.getByText(/04\/20\/2025/i)).toBeInTheDocument();
    expect(screen.getByText(/04\/18\/2025/i)).toBeInTheDocument();
  });

  it('displays trend indicators for metrics comparing to previous values', async () => {
    renderWithProvider(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for trend indicators (this depends on your implementation)
    // For example, if you use arrow icons or text like "Up 5%" or "Down 3%"
    expect(screen.getByText(/\+5%/i)).toBeInTheDocument(); // Outcome 1: 75 vs 70
    expect(screen.getByText(/\+5%/i)).toBeInTheDocument(); // Outcome 2: 60 vs 55
    expect(screen.getByText(/\+5%/i)).toBeInTheDocument(); // Output 1: 85 vs 80
    expect(screen.getByText(/\+10%/i)).toBeInTheDocument(); // Output 2: 40 vs 30
  });
});
