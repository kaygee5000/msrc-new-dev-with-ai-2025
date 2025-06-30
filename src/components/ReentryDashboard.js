"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Chip, 
  Divider, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Card
} from '@mui/material';
import { fetchAPI, getList } from '@/utils/api';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import ReentryFormPage from './ReentryFormPage';
import DataTable from './DataTable';
import { useSession, signOut } from "next-auth/react";

// Move the non-authenticated UI to a separate component
function NotAuthenticated() {
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

export default function ReentryDashboard({ user }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [schools, setSchools] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [viewSubmission, setViewSubmission] = useState(null);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState('termly');
  const [selectedClass, setSelectedClass] = useState('All');

  // Early return if not authenticated - AFTER ALL HOOKS
  if (!user || !user.id) {
    return <NotAuthenticated />;
  }
  
  // Check if user is in development mode (has id 999)
  // This const must be defined after the user check, but it's not a hook.
  const isDevMode = user?.id === 999;

  // Get unique class levels from schools (or use a static list if needed)
  // These are constants, not hooks.
  const classLevels = ['All', 'Primary', 'JHS', 'SHS', 'TVET'];
  const frequencyOptions = ['All', 'Termly', 'Weekly'];

  // Helper to reload schools and submissions - memoized with useCallback
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let schoolsList = [];
      if (user.regionId) {
        schoolsList = await getList('schools', { region_id: user.regionId });
      } else if (user.districtId) {
        schoolsList = await getList('schools', { district_id: user.districtId || 2 });
      } else if (user.circuitId) {
        schoolsList = await getList('schools', { circuit_id: user.circuitId });
      } else {
        schoolsList = await getList('schools', { district_id: 2 });
      }
      if (schoolsList && schoolsList.schools) {
        setSchools(schoolsList.schools);
      } else {
        setSchools([]);
      }
      const submissionsResponse = await fetchAPI('pregnancy_responses?userId=' + user.id);
      if (Array.isArray(submissionsResponse)) {
        const formattedSubmissions = submissionsResponse.map(submission => {
          return {
            ...submission,
            createdAt: submission.submittedAt || new Date().toISOString()
          };
        });
        setSubmissions(formattedSubmissions);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error reloading data:', error);
      setSchools([]);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.regionId, user.districtId, user.circuitId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (isDevMode) {
          // Assuming MOCK_SCHOOLS and MOCK_SUBMISSIONS are defined elsewhere or were part of removed code
          // For now, to prevent further errors, I'll use empty arrays if isDevMode is true.
          // const filteredSchools = user.districtId
          //   ? MOCK_SCHOOLS.filter(school => school.districtId === user.districtId)
          //   : MOCK_SCHOOLS;
          // setSchools(filteredSchools);
          // setSubmissions(MOCK_SUBMISSIONS);
          setSchools([]);
          setSubmissions([]);
          setIsLoading(false);
          return;
        }

        // Reuse the reloadData function to avoid code duplication
        await reloadData();
      } catch (error) {
        console.error('Error loading data:', error);
        setSchools([]);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, isDevMode, reloadData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSchoolSelect = useCallback((school) => {
    setSelectedSchool(school);
    setCreateFormOpen(true);
  }, []);

  const handleViewSubmission = useCallback(async (submissionId) => {
    try {
      if (isDevMode) {
        // const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
        // if (submission) {
        //   setViewSubmission(submission);
        // }
        setViewSubmission(null); // Placeholder if MOCK_SUBMISSIONS is not available
        return;
      }
      
      const submissionDetails = await fetchAPI(`pregnancy_responses/${submissionId}`);
      setViewSubmission(submissionDetails);
    } catch (error) {
      console.error('Error fetching submission details:', error);
      setViewSubmission(null);
    }
  }, [isDevMode]);

  const handleCloseForm = useCallback(() => {
    setCreateFormOpen(false);
    setSelectedSchool(null);
    setViewSubmission(null);
    if (!isDevMode) {
      reloadData();
    }
  }, [isDevMode, reloadData]);

  const handleLogout = () => {
    signOut();
  };

  const hasSubmitted = useCallback((schoolId) => {
    return submissions.some(
      (submission) =>
        submission.schoolId === schoolId &&
        (selectedFrequency === 'All' || submission.metadata?.frequency === selectedFrequency) &&
        (selectedClass === 'All' || submission.metadata?.classLevel === selectedClass)
    );
  }, [submissions, selectedFrequency, selectedClass]);

  const filteredSchools = schools
    .filter((school) => {
      const search = schoolSearch.toLowerCase();
      return (
        school.name.toLowerCase().includes(search) ||
        (school.circuit?.name || "").toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const circuitA = (a.circuit?.name || '').localeCompare(b.circuit?.name || '');
      if (circuitA !== 0) return circuitA;
      return a.name.localeCompare(b.name);
    });

  const schoolColumns = React.useMemo(() => [
    { field: 'name', headerName: 'School Name', width: 220 },
    { field: 'circuit', headerName: 'Circuit', width: 160, valueFormatter: ({ row }) => row.circuit?.name || 'N/A' },
    { field: 'district', headerName: 'District', width: 160, valueFormatter: ({ row }) => row.district?.name || 'N/A' },
    { field: 'submitted', headerName: 'Submitted', width: 120, valueFormatter: ({ row }) => hasSubmitted(row.id) ? 'Yes' : 'No' },
    { field: 'actions', headerName: '', width: 140, valueFormatter: ({ row }) => (
      <Button
        variant="contained"
        color="primary"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => handleSchoolSelect(row)}
        disabled={hasSubmitted(row.id)}
      >
        {hasSubmitted(row.id) ? 'Submitted' : 'Submit'}
      </Button>
    ) }
  ], [hasSubmitted, handleSchoolSelect]);

  // Conditional rendering for forms must be AFTER all hooks
  if (createFormOpen && selectedSchool) {
    return (
      <ReentryFormPage 
        school={selectedSchool}
        user={user}
        onClose={handleCloseForm}
        isDevMode={isDevMode}
      />
    );
  }
  
  if (viewSubmission) {
    return (
      <ReentryFormPage 
        submission={viewSubmission}
        readOnly={true}
        user={user}
        onClose={handleCloseForm}
        isDevMode={isDevMode}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, mb: isMobile ? 7 : 0 }}>
      <Box 
        display="flex" 
        flexDirection={isMobile ? "column" : "row"} 
        justifyContent={isMobile ? "center" : "space-between"} 
        alignItems={isMobile ? "center" : "flex-start"} 
        mb={3}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1"
          textAlign={isMobile ? "center" : "left"}
          mb={isMobile ? 2 : 0}
        >
          Pregnancy & Re-entry Dashboard
        </Typography>
        
        {!isMobile && (
          <Box>
            <Chip 
              label={`${user.first_name || user.name || user.email}`} 
              color="primary" 
              variant="outlined" 
            />
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={handleLogout}
              sx={{ ml: 1 }}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        )}
      </Box>

      {!isMobile ? (
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<SchoolIcon />} label="My Schools" />
            <Tab icon={<HistoryIcon />} label="Submission History" />
          </Tabs>
        </Paper>
      ) : (
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<SchoolIcon />} aria-label="Schools" />
            <Tab icon={<HistoryIcon />} aria-label="History" />
          </Tabs>
        </Paper>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 ? (
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={2} gap={2} flexWrap="wrap">
                <SearchIcon sx={{ mr: 1 }} />
                <input
                  type="text"
                  placeholder="Search by school or circuit..."
                  value={schoolSearch}
                  onChange={e => setSchoolSearch(e.target.value)}
                  style={{ padding: 8, width: 220, borderRadius: 4, border: '1px solid #ccc', flex: '1 1 220px' }}
                />
                <select value={selectedFrequency} onChange={e => setSelectedFrequency(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minWidth: 140, flex: '1 1 140px' }}>
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minWidth: 140, flex: '1 1 140px' }}>
                  {classLevels.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </Box>
              <DataTable 
                columns={schoolColumns} 
                rows={filteredSchools} 
                pageSize={10} 
                onRowClick={row => handleSchoolSelect(row)}
              />
            </Box>
          ) : (
            <Card>
              <List dense={isMobile}>
                {submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <React.Fragment key={submission.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            color="primary" 
                            onClick={() => handleViewSubmission(submission.id)}
                            size={isMobile ? "small" : "medium"}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography 
                              variant={isMobile ? "body1" : "subtitle1"}
                              sx={{ fontWeight: 'medium' }}
                              noWrap
                            >
                              {submission.school?.name}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {new Date(submission.createdAt).toLocaleDateString()}
                              </Typography>
                              <br />
                              <Typography variant="body2" color="text.secondary" component="span">
                                {submission.academicTerm || 'Term not specified'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No submission history found"
                      secondary="Submit a new form for any of your assigned schools"
                    />
                  </ListItem>
                )}
              </List>
            </Card>
          )}
        </>
      )}

      {isMobile && (
        <Paper 
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} 
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={2} // This value seems static, might need to be dynamic if it controls active tab
            onChange={(event, newValue) => {
              if (newValue === 0) {
                setActiveTab(0);
              } else if (newValue === 1) {
                setActiveTab(1);
              } else if (newValue === 2) {
                handleLogout();
              }
            }}
          >
            <BottomNavigationAction 
              label="Schools" 
              icon={<SchoolIcon />} 
              selected={activeTab === 0}
            />
            <BottomNavigationAction 
              label="History" 
              icon={<HistoryIcon />}
              selected={activeTab === 1}
            />
            <BottomNavigationAction label="Logout" icon={<LogoutIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Container>
  );
}
