'use client';

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Container, 
  Box,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { isRtpAuthorized } from '@/utils/auth';

// Main component for RTP data collection page
export default function RightToPlayPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [itineraries, setItineraries] = useState([]);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Add null check for user
  if (!isLoading && (!user || !user.id)) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh">
          <Typography variant="h6" color="error" gutterBottom>
            You must be logged in to access this page.
          </Typography>
          <Button variant="contained" color="primary" href="/login">
            Go to Login
          </Button>
        </Box>
      </Container>
    );
  }

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Fetch active itineraries when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchItineraries();
    }
  }, [isAuthenticated]);
  
  // Early redirect if not authenticated
  useEffect(() => {
    console.log("RTP isloading", isLoading, "isAuthenticated", isAuthenticated);

    if (!isLoading && !isAuthenticated) {
        
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Mock function to fetch itineraries - will be replaced with actual API call
  const fetchItineraries = async () => {
    // TODO: Replace with actual API call
    const mockItineraries = [
      { id: 1, title: 'Term 1 Collection', startDate: '2025-01-15', endDate: '2025-02-15', status: 'active' },
      { id: 2, title: 'Term 2 Collection', startDate: '2025-04-01', endDate: '2025-05-01', status: 'upcoming' },
    ];
    setItineraries(mockItineraries);
  };
  
  // Function to navigate to appropriate form
  const navigateToForm = (formType, itineraryId) => {
    if (formType === 'consolidated-checklist') {
      // For consolidated checklist, go to the new form with itinerary pre-selected
      router.push(`/rtp/consolidated-checklist/new?itineraryId=${itineraryId}`);
    } else {
      // For other forms, use the standard route
      router.push(`/rtp/${formType}/${itineraryId}`);
    }
  };

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Hide content entirely if not authenticated
  if (!isAuthenticated) {
    return null; // This prevents content flash before redirect completes
  }
  
  // Only check RTP authorization on the client side to avoid hydration mismatch
  const isAuthorizedForRTP = typeof window !== 'undefined' ? isRtpAuthorized() : true;
  
  // Hide content if not authorized (client-side only check)
  if (!isAuthorizedForRTP) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Right to Play (RTP) Data Collection
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="rtp data collection tabs">
          <Tab label="Active Itineraries" />
          <Tab label="Submission History" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Available Itineraries
          </Typography>
          
          {itineraries.length === 0 ? (
            <Typography>No active itineraries found.</Typography>
          ) : (
            itineraries.map((itinerary) => (
              <Card key={itinerary.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{itinerary.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${new Date(itinerary.startDate).toLocaleDateString()} - ${new Date(itinerary.endDate).toLocaleDateString()}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Status: <strong>{itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}</strong>
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      disabled={itinerary.status !== 'active'}
                      onClick={() => navigateToForm('school-output', itinerary.id)}
                    >
                      School Output Indicators
                    </Button>
                    <Button 
                      variant="contained" 
                      color="secondary"
                      disabled={itinerary.status !== 'active'}
                      onClick={() => navigateToForm('district-output', itinerary.id)}
                    >
                      District Output Indicators
                    </Button>
                    <Button 
                      variant="contained" 
                      color="info"
                      disabled={itinerary.status !== 'active'}
                      onClick={() => navigateToForm('consolidated-checklist', itinerary.id)}
                    >
                      Consolidated Checklist
                    </Button>
                    <Button 
                      variant="contained" 
                      color="warning"
                      disabled={itinerary.status !== 'active'}
                      onClick={() => navigateToForm('partners-in-play', itinerary.id)}
                    >
                      Partners in Play
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Your Submission History
          </Typography>
          {/* Submission history table will go here */}
          <Typography>No submissions found.</Typography>
        </Box>
      )}
    </Container>
  );
}