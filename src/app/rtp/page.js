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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import { useRouter } from 'next/navigation';

// Main component for RTP data collection page
export default function RightToPlayPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [itineraries, setItineraries] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === 'rtp') || false;
  
  const router = useRouter();
  
  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1 && submissions.length === 0) {
      fetchSubmissionHistory();
    }
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
  
  // Mock function to fetch itineraries - replaced with live API call
  const fetchItineraries = async () => {
    try {
      const response = await fetch('/api/rtp/itineraries');
      const data = await response.json();
      const raw = data.itineraries || [];
      const mapped = raw.map(it => {
        const startDate = it.from_date;
        const endDate = it.until_date;
        const now = new Date();
        const sd = new Date(startDate);
        const ed = new Date(endDate);
        let status = 'upcoming';
        if (now >= sd && now <= ed) status = 'active';
        else if (now > ed) status = 'closed';
        return { id: it.id, title: it.title, startDate, endDate, status };
      });
      setItineraries(mapped);
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
      setItineraries([]);
    }
  };

  // Fetch submission history for all RTP components
  const fetchSubmissionHistory = async () => {
    if (!user?.id) return;
    setIsLoadingSubmissions(true);

    try {
      // Get all itineraries first - this will use the Redis cache
      const itineraryResponse = await fetch('/api/rtp/itineraries');
      const itineraryData = await itineraryResponse.json();
      const allItineraries = itineraryData.itineraries || [];
      
      // Create a map of itinerary IDs to titles for quick lookup
      const itineraryMap = allItineraries.reduce((map, it) => {
        map[it.id] = it.title;
        return map;
      }, {});
      
      // Array to store all submissions from different components
      let allSubmissions = [];
      
      // Fetch submissions for each component in parallel to improve performance
      await Promise.all([
        // 1. Fetch School Output submissions
        (async () => {
          try {
            for (const itinerary of allItineraries) {
              const response = await fetch(`/api/rtp/school-responses?itineraryId=${itinerary.id}`);
              if (response.ok) {
                const data = await response.json();
                
                // Filter submissions by the current user
                const userSubmissions = data.filter(sub => sub.submitted_by === user.id)
                  .map(sub => ({
                    ...sub,
                    itineraryTitle: itineraryMap[sub.itinerary_id] || `Itinerary #${sub.itinerary_id}`,
                    submissionDate: new Date(sub.last_submission),
                    type: 'School Output',
                    formType: 'school-output'
                  }));
                
                allSubmissions = [...allSubmissions, ...userSubmissions];
              }
            }
          } catch (error) {
            console.error('Error fetching school output submissions:', error);
          }
        })(),
        
        // 2. Fetch District Output submissions
        (async () => {
          try {
            for (const itinerary of allItineraries) {
              const response = await fetch(`/api/rtp/output/district?itineraryId=${itinerary.id}`);
              if (response.ok) {
                const data = await response.json();
                
                // Filter submissions by the current user
                const userSubmissions = data.data
                  .filter(sub => sub.submitted_by === user.id)
                  .map(sub => ({
                    ...sub,
                    itineraryTitle: itineraryMap[sub.itinerary_id] || `Itinerary #${sub.itinerary_id}`,
                    submissionDate: new Date(sub.last_submission || sub.created_at),
                    type: 'District Output',
                    formType: 'district-output',
                    district_name: sub.district_name || 'N/A'
                  }));
                
                allSubmissions = [...allSubmissions, ...userSubmissions];
              }
            }
          } catch (error) {
            console.error('Error fetching district output submissions:', error);
          }
        })(),
        
        // 3. Fetch Consolidated Checklist submissions
        (async () => {
          try {
            for (const itinerary of allItineraries) {
              const response = await fetch(`/api/rtp/consolidated-checklist?itineraryId=${itinerary.id}`);
              if (response.ok) {
                const data = await response.json();
                
                // Filter submissions by the current user
                const userSubmissions = data
                  .filter(sub => sub.submitted_by === user.id)
                  .map(sub => ({
                    ...sub,
                    itineraryTitle: itineraryMap[sub.itinerary_id] || `Itinerary #${sub.itinerary_id}`,
                    submissionDate: new Date(sub.last_submission || sub.created_at),
                    type: 'Consolidated Checklist',
                    formType: 'consolidated-checklist',
                    questions_answered: sub.total_questions || sub.answers?.length || 'N/A'
                  }));
                
                allSubmissions = [...allSubmissions, ...userSubmissions];
              }
            }
          } catch (error) {
            console.error('Error fetching consolidated checklist submissions:', error);
          }
        })(),
        
        // 4. Fetch Partners in Play submissions
        (async () => {
          try {
            for (const itinerary of allItineraries) {
              const response = await fetch(`/api/rtp/partners-in-play?itineraryId=${itinerary.id}`);
              if (response.ok) {
                const data = await response.json();
                
                // Filter submissions by the current user
                const userSubmissions = data
                  .filter(sub => sub.submitted_by === user.id)
                  .map(sub => ({
                    ...sub,
                    itineraryTitle: itineraryMap[sub.itinerary_id] || `Itinerary #${sub.itinerary_id}`,
                    submissionDate: new Date(sub.last_submission || sub.created_at),
                    type: 'Partners in Play',
                    formType: 'partners-in-play',
                    questions_answered: sub.total_questions || sub.answers?.length || 'N/A',
                    school_name: sub.school_name || 'N/A'
                  }));
                
                allSubmissions = [...allSubmissions, ...userSubmissions];
              }
            }
          } catch (error) {
            console.error('Error fetching partners in play submissions:', error);
          }
        })()
      ]);
      
      // Sort submissions by date (newest first)
      allSubmissions.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
      
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Failed to fetch submission history:', error);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };
  
  // Function to navigate to appropriate form
  const navigateToForm = (formType, itineraryId) => {
    if (formType === 'consolidated-checklist') {
      router.push(`/rtp/consolidated-checklist/new/${itineraryId}`);
    } else {
      router.push(`/rtp/${formType}/${itineraryId}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Function to get the chip color based on submission type
  const getTypeColor = (type) => {
    switch (type) {
      case 'School Output':
        return 'primary';
      case 'District Output':
        return 'secondary';
      case 'Consolidated Checklist':
        return 'info';
      case 'Partners in Play':
        return 'warning';
      default:
        return 'default';
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

  // Not authenticated user check
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

  // Hide content entirely if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  const isAuthorizedForRTP = typeof window !== 'undefined' ? isRtpAuthorized : true;
  
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
          
          {isLoadingSubmissions ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : submissions.length === 0 ? (
            <Typography>No submissions found. If you recently submitted data, please refresh the page.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Itinerary</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>School/District</strong></TableCell>
                    <TableCell><strong>Submission Date</strong></TableCell>
                    <TableCell><strong>Questions Answered</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission, index) => (
                    <TableRow key={index}>
                      <TableCell>{submission.itineraryTitle}</TableCell>
                      <TableCell>
                        <Chip 
                          label={submission.type} 
                          color={getTypeColor(submission.type)} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {submission.type === 'School Output' || submission.type === 'Partners in Play' 
                          ? submission.school_name
                          : submission.type === 'District Output'
                          ? submission.district_name
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{formatDate(submission.submissionDate)}</TableCell>
                      <TableCell>{submission.questions_answered}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => navigateToForm(submission.formType, submission.itinerary_id)}
                        >
                          View/Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Container>
  );
}