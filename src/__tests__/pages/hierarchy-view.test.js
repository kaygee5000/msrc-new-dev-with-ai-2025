import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HierarchyViewPage from '../../app/dashboard/admin/rtp/hierarchy-view/[entityType]/[entityName]/page';
// import * as rtpApiService from '../../utils/RTP_apiService'; // Removed to avoid redeclaration
import { RTP_DataSourceProvider } from '../../context/RTP_DataSourceContext';
import * as dataUtils from '../../utils/RTP_dataUtils';

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
    },
    Tab: function MockTab(props) {
      return React.createElement('button', { role: 'tab', onClick: props.onClick }, props.label);
    },
    Tabs: function MockTabs(props) {
      return React.createElement('div', { role: 'tablist' }, props.children);
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

// Mock DatePicker component
jest.mock('@mui/x-date-pickers/DatePicker', () => {
  const React = require('react');
  return {
    DatePicker: function MockDatePicker(props) {
      return React.createElement('input', { type: 'date', onChange: (e) => props.onChange(new Date(e.target.value)) });
    }
  };
});

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  const React = require('react');
  return {
    LocalizationProvider: function MockLocalizationProvider(props) {
      return React.createElement('div', {}, props.children);
    }
  };
});

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: function MockAdapter() {}
}));

// Mock the API service and data utilities
// jest.mock('../../utils/RTP_apiService'); // Will use specific mock below
import rtpApiService from '../../utils/RTP_apiService'; // Use default import

jest.mock('../../utils/RTP_apiService', () => ({
  __esModule: true,
  default: {
    getSubmissionsByEntity: jest.fn(),
    // Add other functions that might be called by the component
  },
  // Mock named exports if any are used directly and need mocking
}));

jest.mock('../../utils/RTP_dataUtils', () => ({
  ...jest.requireActual('../../utils/RTP_dataUtils'),
  groupSubmissionsByEntity: jest.fn(),
  calculateStats: jest.fn()
}));

// Mock Next.js navigation hooks
const mockUseRouter = jest.fn();
const mockUsePathname = jest.fn();
const mockUseParams = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  usePathname: mockUsePathname,
  useParams: mockUseParams,
  useSearchParams: mockUseSearchParams,
}));

// Mock data for testing
const mockSubmissions = [
  { 
    id: 'sub1', 
    survey_type: 'school_output', 
    teacher: 'John Doe',
    school: 'School A',
    district: 'Test District',
    region: 'Test Region',
    date: '2025-04-20',
    score: 80,
    itinerary: 'Itinerary 1'
  },
  { 
    id: 'sub2', 
    survey_type: 'district_output', 
    teacher: 'Jane Smith',
    school: 'School B',
    district: 'Test District',
    region: 'Test Region',
    date: '2025-04-18',
    score: 75,
    itinerary: 'Itinerary 2'
  },
  { 
    id: 'sub3', 
    survey_type: 'school_output', 
    teacher: 'Alice Johnson',
    school: 'School A',
    district: 'Test District',
    region: 'Test Region',
    date: '2025-04-15',
    score: 90,
    itinerary: 'Itinerary 1'
  }
];

const mockChildEntities = [
  {
    name: 'School A',
    submissions: [mockSubmissions[0], mockSubmissions[2]],
    averageScore: 85,
    submissionCount: 2,
    lastSubmissionDate: '2025-04-20'
  },
  {
    name: 'School B',
    submissions: [mockSubmissions[1]],
    averageScore: 75,
    submissionCount: 1,
    lastSubmissionDate: '2025-04-18'
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

describe('Hierarchy View Page', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations for navigation hooks
    mockUseRouter.mockImplementation(() => ({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    }));
    mockUsePathname.mockImplementation(() => '/dashboard/admin/rtp/hierarchy-view/district/Test District');
    mockUseParams.mockImplementation(() => ({ entityType: 'district', entityName: 'Test District' }));
    mockUseSearchParams.mockImplementation(() => ({ get: jest.fn() }));

    // Setup default mock implementations for API service and data utils
    // Assuming rtpApiService from the import IS the mocked default export
    rtpApiService.getSubmissionsByEntity.mockResolvedValue(mockSubmissions);

    dataUtils.groupSubmissionsByEntity.mockReturnValue({
      'School A': [mockSubmissions[0], mockSubmissions[2]],
      'School B': [mockSubmissions[1]]
    });
    dataUtils.calculateStats.mockImplementation((submissions) => {
      if (submissions.length === 2) {
        return {
          averageScore: 85,
          submissionCount: 2,
          lastSubmissionDate: '2025-04-20'
        };
      } else {
        return {
          averageScore: 75,
          submissionCount: 1,
          lastSubmissionDate: '2025-04-18'
        };
      }
    });
  });

  it('renders loading state initially', () => {
    renderWithProvider(<HierarchyViewPage />);
    
    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders hierarchy view after loading', async () => {
    renderWithProvider(<HierarchyViewPage />);
    
    await waitFor(() => {
      expect(screen.getByText('District: Test District')).toBeInTheDocument();
      expect(screen.getByText('School A')).toBeInTheDocument();
      expect(screen.getByText('School B')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // School A average score
      expect(screen.getByText('2')).toBeInTheDocument(); // School A submission count
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Additional checks if necessary, though covered by waitFor
    expect(screen.getByText('75%')).toBeInTheDocument(); // School B average score
    expect(screen.getByText('1')).toBeInTheDocument();   // School B submission count
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    // Assuming rtpApiService is the mocked default export, containing getSubmissionsByEntity
    rtpApiService.getSubmissionsByEntity.mockRejectedValue(new Error('API error')); // Simple error for this test
    
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    });
    // Progress bar should also be gone by now
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles empty submissions gracefully', async () => {
    // Mock empty submissions
    rtpApiService.getSubmissionsByEntity.mockResolvedValue([]);
    
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for no data message to appear
    await waitFor(() => {
      expect(screen.getByText(/no submissions found/i)).toBeInTheDocument();
    });
    // Progress bar should also be gone
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('filters submissions correctly', async () => {
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for initial data to load and title to be present
    await waitFor(() => {
      expect(screen.getByText('District: Test District')).toBeInTheDocument();
    });
    // It's possible the filters are rendered after another microtask,
    // let's specifically wait for the label of the filter.
    await waitFor(() => {
      // Check initial state - all submissions should be visible BEFORE attempting to get the filter
      expect(screen.getAllByRole('row').length).toBeGreaterThan(3); // Header + 3 submissions
      expect(screen.getByLabelText(/survey type/i)).toBeInTheDocument();
    });
    
    // Find and change the survey type filter
    const surveyTypeFilter = screen.getByLabelText(/survey type/i);
    act(() => {
      userEvent.selectOptions(surveyTypeFilter, 'school_output');
    });
    
    // Check that only school_output submissions are visible
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Header + 2 school_output submissions
      expect(rows.length).toBe(3);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
    
    // Change to itinerary filter
    const itineraryFilter = screen.getByLabelText(/itinerary/i);
    act(() => {
      userEvent.selectOptions(itineraryFilter, 'Itinerary 2');
    });
    
    // Check that only Itinerary 2 submissions are visible
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Header + 1 Itinerary 2 submission
      expect(rows.length).toBe(2);
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('toggles between mock and live data', async () => {
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('District: Test District')).toBeInTheDocument(); // Ensure initial load
    });
    
    // Check initial API calls with mock data (true)
    expect(rtpApiService.getSubmissionsByEntity).toHaveBeenCalledWith('district', 'Test District', true);
    rtpApiService.getSubmissionsByEntity.mockClear(); // Clear mock for the next assertion

    
    // Find and click the toggle switch
    const toggleSwitch = screen.getByRole('checkbox', { name: /using mock data/i });
    act(() => {
      userEvent.click(toggleSwitch);
    });
    
    // Wait for the API call with live data (false)
    await waitFor(() => {
      expect(rtpApiService.getSubmissionsByEntity).toHaveBeenCalledWith('district', 'Test District', false);
    });
    // Also ensure loading finishes if there's a visual indicator change
    await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that the child entities tab is active by default
    expect(screen.getByText('Schools')).toBeInTheDocument(); // Child entities for district
    
    // Find and click the submissions tab
    const submissionsTab = screen.getByRole('tab', { name: /submissions/i });
    act(() => {
      userEvent.click(submissionsTab);
    });
    
    // Check that submissions tab content is displayed
    await waitFor(() => {
      expect(screen.getByText('All Submissions')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('navigates to child entity when clicked', async () => {
    // Mock router
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      ...jest.requireActual('next/navigation'),
      useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn()
      })
    }));
    
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click a child entity
    const schoolALink = screen.getAllByRole('link').find(link => 
      link.textContent.includes('School A')
    );
    
    expect(schoolALink).toBeInTheDocument();
    expect(schoolALink.getAttribute('href')).toContain('school/School%20A');
  });

  it('handles invalid entity type gracefully', async () => {
    // Override useParams for this specific test
    mockUseParams.mockReturnValueOnce({ entityType: 'invalid', entityName: 'Test Entity' });
    
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for the error message to appear, which also implies loading is done or bypassed
    await waitFor(() => {
      expect(screen.getByText(/invalid entity type: invalid/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('displays correct date formatting', async () => {
    renderWithProvider(<HierarchyViewPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for formatted dates (assuming the formatDate function formats to MM/DD/YYYY)
    // This test may need adjustment based on your actual date formatting
    expect(screen.getByText(/04\/20\/2025/i)).toBeInTheDocument();
    expect(screen.getByText(/04\/18\/2025/i)).toBeInTheDocument();
  });
});
