"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  Alert
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const EntitySummary = ({ 
  entityType = 'school', 
  entityId, 
  showPeriodSelector = true,
  defaultPeriod = {}
}) => {
  const [stats, setStats] = useState({
    enrolment: null,
    studentAttendance: null,
    teacherAttendance: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: defaultPeriod.year || '',
    term: defaultPeriod.term || '',
    week: defaultPeriod.week || ''
  });

  // Map entity types to API endpoints
  const endpoints = {
    school: {
      stats: (id, params) => `/api/schools/${id}/stats${params ? `?${new URLSearchParams(params)}` : ''}`,
      periods: '/api/statistics/periods'
    },
    circuit: {
      stats: (id, params) => `/api/circuits/${id}/stats${params ? `?${new URLSearchParams(params)}` : ''}`,
      periods: '/api/statistics/periods'
    },
    district: {
      stats: (id, params) => `/api/districts/${id}/stats${params ? `?${new URLSearchParams(params)}` : ''}`,
      periods: '/api/statistics/periods'
    },
    region: {
      stats: (id, params) => `/api/regions/${id}/stats${params ? `?${new URLSearchParams(params)}` : ''}`,
      periods: '/api/statistics/periods'
    }
  };

  // Fetch available periods
  useEffect(() => {
    if (!showPeriodSelector) return;
    
    const fetchPeriods = async () => {
      try {
        const res = await fetch(endpoints[entityType].periods);
        const data = await res.json();
        
        if (data.success && data.periods?.length > 0) {
          setPeriods(data.periods);
          
          // Set default period if not already set
          if (!selectedPeriod.year) {
            const mostRecentYear = data.periods[0];
            const mostRecentTerm = mostRecentYear.terms[0];
            const mostRecentWeek = mostRecentTerm.weeks[mostRecentTerm.weeks.length - 1];
            
            setSelectedPeriod({
              year: mostRecentYear.year,
              term: mostRecentTerm.term,
              week: mostRecentWeek
            });
          }
        }
      } catch (error) {
        console.error('Error fetching periods:', error);
        setError('Failed to load reporting periods');
      }
    };
    
    fetchPeriods();
  }, [entityType, showPeriodSelector, selectedPeriod.year]);

  // Fetch statistics when entityId or period changes
  useEffect(() => {
    if (!entityId) return;
    
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch statistics from the appropriate endpoint
        const params = {};
        
        if (selectedPeriod.year) {
          params.year = selectedPeriod.year;
          if (selectedPeriod.term) params.term = selectedPeriod.term;
          if (selectedPeriod.week) params.week = selectedPeriod.week;
        }
        
        const response = await fetch(endpoints[entityType].stats(entityId, params));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${entityType} summary`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStats({
            enrolment: data.enrolment || null,
            studentAttendance: data.studentAttendance || null,
            teacherAttendance: data.teacherAttendance || null
          });
          console.log("ENtity Data: ", data);
        } else {
          throw new Error(data.message || 'Failed to load summary data');
        }
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setError(error.message || 'An error occurred while loading summary data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [entityId, selectedPeriod, entityType]);

  const handlePeriodChange = (field, value) => {
    setSelectedPeriod(prev => {
      const newPeriod = { ...prev, [field]: value };
      
      // Reset dependent fields when parent field changes
      if (field === 'year') {
        const yearData = periods.find(p => p.year === value);
        if (yearData?.terms?.length > 0) {
          newPeriod.term = yearData.terms[0].term;
          newPeriod.week = yearData.terms[0].weeks[0];
        } else {
          newPeriod.term = '';
          newPeriod.week = '';
        }
      } else if (field === 'term') {
        const yearData = periods.find(p => p.year === prev.year);
        const termData = yearData?.terms.find(t => t.term === value);
        newPeriod.week = termData?.weeks?.[0] || '';
      }
      
      return newPeriod;
    });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    try {
      return `${parseFloat(value).toFixed(1)}%`;
    } catch (e) {
      return `${value}%`;
    }
  };

  const renderStatCards = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {/* Enrollment Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">Enrollment</Typography>
                  <Typography variant="h4">
                    {stats.enrolment?.totalStudents || 'N/A'}
                  </Typography>
                  {stats.enrolment?.genderDistribution && (
                    <Typography variant="body2">
                      Boys: {stats.enrolment.genderDistribution.boys || 0} | 
                      Girls: {stats.enrolment.genderDistribution.girls || 0}
                    </Typography>
                  )}
                </Box>
                <PeopleIcon fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Student Attendance Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">Student Attendance</Typography>
                  <Typography variant="h4">
                    {stats.studentAttendance?.attendanceRate ? `${stats.studentAttendance.attendanceRate}%` : 'N/A'}
                  </Typography>
                  {stats.studentAttendance && (
                    <Typography variant="body2">
                      Present: {stats.studentAttendance.totalPresent || 0} / {stats.studentAttendance.totalEnrolled || 0}
                    </Typography>
                  )}
                </Box>
                <EventAvailableIcon fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Teacher Attendance Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">Teacher Attendance</Typography>
                  <Typography variant="h4">
                    {formatPercentage(stats.teacherAttendance?.attendanceRate)}
                  </Typography>
                  {stats.teacherAttendance && (
                    <Typography variant="body2">
                      Teachers: {stats.teacherAttendance.totalTeachers || 0}
                    </Typography>
                  )}
                </Box>
                <SchoolIcon fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Teacher Performance Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="subtitle2">Teacher Performance</Typography>
                  <Typography variant="h4">
                    {formatPercentage(stats.teacherAttendance?.exerciseCompletionRate)}
                  </Typography>
                  {stats.teacherAttendance && (
                    <Typography variant="body2">
                      Exercises Marked Rate
                    </Typography>
                  )}
                </Box>
                <SchoolIcon fontSize="large" color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      {showPeriodSelector && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Reporting Period</Typography>
          {periods.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              No reporting periods available. Summary will show the most recent data.
            </Alert>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={selectedPeriod.year}
                  label="Academic Year"
                  onChange={(e) => handlePeriodChange('year', e.target.value)}
                >
                  {periods.map((period) => (
                    <MenuItem key={period.year} value={period.year}>
                      {period.year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Term</InputLabel>
                <Select
                  value={selectedPeriod.term}
                  label="Term"
                  onChange={(e) => handlePeriodChange('term', e.target.value)}
                  disabled={!selectedPeriod.year}
                >
                  {selectedPeriod.year && 
                    periods
                      .find(p => p.year === selectedPeriod.year)
                      ?.terms.map((term) => (
                        <MenuItem key={term.term} value={term.term}>
                          Term {term.term}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Week</InputLabel>
                <Select
                  value={selectedPeriod.week}
                  label="Week"
                  onChange={(e) => handlePeriodChange('week', e.target.value)}
                  disabled={!selectedPeriod.term}
                >
                  {selectedPeriod.year && selectedPeriod.term && 
                    periods
                      .find(p => p.year === selectedPeriod.year)
                      ?.terms.find(t => t.term === selectedPeriod.term)
                      ?.weeks.map((week) => (
                        <MenuItem key={week} value={week}>
                          Week {week}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderStatCards()}
    </Box>
  );
};

export default EntitySummary;
