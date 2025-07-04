import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the API service
jest.mock('../../utils/RTP_apiService', () => ({
  getOutcomeIndicators: jest.fn().mockResolvedValue([
    { id: 1, name: 'Outcome 1', value: 75, target: 80, previousValue: 70 },
    { id: 2, name: 'Outcome 2', value: 60, target: 90, previousValue: 55 }
  ]),
  getOutputIndicators: jest.fn().mockResolvedValue([
    { id: 1, name: 'Output 1', value: 85, target: 80, previousValue: 80 },
    { id: 2, name: 'Output 2', value: 40, target: 60, previousValue: 30 }
  ]),
  getRecentSubmissions: jest.fn().mockResolvedValue([
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
  ])
}));

// Mock the context
jest.mock('../../context/RTP_DataSourceContext', () => ({
  useRTP_DataSource: jest.fn().mockReturnValue({
    useMockData: true,
    toggleDataSource: jest.fn()
  })
}));

// Mock the utility functions
jest.mock('../../app/dashboard/admin/rtp-ui/utils/dataUtils', () => ({
  formatDate: jest.fn(date => new Date(date).toLocaleDateString()),
  calculatePercentage: jest.fn((value, total) => (value / total) * 100),
  capPercentage: jest.fn(value => Math.min(100, Math.max(0, value)))
}));

// Mock the components
jest.mock('../../app/dashboard/admin/rtp-ui/components/IndicatorCard', () => {
  return function MockIndicatorCard(props) {
    return <div data-testid="indicator-card">{props.value}%</div>;
  };
});

// Mock MUI components
jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material');
  return {
    ...original,
    CircularProgress: function MockCircularProgress() {
      return <div role="progressbar">Loading...</div>;
    }
  };
});

// Import the component after all mocks are set up
const RTP_Dashboard = require('../../components/RTP_Dashboard').default;

describe('RTP_Dashboard Component - Simple Tests', () => {
  it('renders loading state initially', () => {
    render(<RTP_Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    render(<RTP_Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for dashboard sections (these assertions depend on your actual component implementation)
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
