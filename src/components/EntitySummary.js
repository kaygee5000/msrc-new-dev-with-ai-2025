"use client";

import { useState, useEffect, useRef } from 'react';
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
  selectedPeriod: controlledSelectedPeriod, // Renamed to avoid conflict
  onPeriodChange
}) => {
  const [stats, setStats] = useState({
    enrolment: null,
    studentAttendance: null,
    teacherAttendance: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const initialPeriodSuggested = useRef(false);
  // selectedPeriod is now controlled by props: controlledSelectedPeriod and onPeriodChange

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

  // Reset suggestion flag if entityType changes, allowing new suggestion for new type
  useEffect(() => {
    initialPeriodSuggested.current = false;
  }, [entityType]);

  // Fetch available periods - only depends on entityType and showPeriodSelector
  useEffect(() => {
    if (!showPeriodSelector) return;
    
    let isMounted = true;
    const controller = new AbortController();

    const fetchPeriodsData = async () => {
      try {
        const res = await fetch(endpoints[entityType].periods, {
          signal: controller.signal,
          cache: 'force-cache' // Cache the response to prevent refetches
        });
        
        if (!res.ok) throw new Error('Failed to fetch periods');
        
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.periods?.length > 0) {
          setPeriods(data.periods);
          
          // Only suggest initial period if we don't have one yet
          if (!controlledSelectedPeriod?.year && onPeriodChange) {
            const mostRecentYearData = data.periods[0];
            if (mostRecentYearData?.terms?.length) {
              const mostRecentTermData = mostRecentYearData.terms[0];
              const mostRecentWeekData = mostRecentTermData.weeks[mostRecentTermData.weeks.length - 1];
              
              onPeriodChange({
                year: mostRecentYearData.year,
                term: mostRecentTermData.term,
                week: mostRecentWeekData
              });
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching periods:', err);
          setError('Failed to load reporting periods');
        }
      }
    };

    fetchPeriodsData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [entityType, showPeriodSelector]); // Removed onPeriodChange and controlledSelectedPeriod from deps

  // Fetch statistics when entityId or period changes
  useEffect(() => {
    // Only fetch stats if we have an entity ID and a selected year
    if (!entityId || !controlledSelectedPeriod?.year) return;
    
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch statistics from the appropriate endpoint
        const params = {};
        
        if (controlledSelectedPeriod.year) {
          params.year = controlledSelectedPeriod.year;
          if (controlledSelectedPeriod.term) params.term = controlledSelectedPeriod.term;
          if (controlledSelectedPeriod.week) params.week = controlledSelectedPeriod.week;
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
          console.log("Entity Data: ", data);
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
  }, [entityId, controlledSelectedPeriod.year, controlledSelectedPeriod.term, controlledSelectedPeriod.week, entityType]);

  const handlePeriodChange = (field, value, isInitialSetup = false) => {
    if (!onPeriodChange) return;

    let newPeriod = { ...controlledSelectedPeriod, [field]: value };

    if (field === 'year') {
      const yearData = periods.find(p => p.year === value);
      if (yearData?.terms?.length > 0) {
        newPeriod.term = yearData.terms[0].term;
        newPeriod.week = yearData.terms[0].weeks[yearData.terms[0].weeks.length - 1]; // Default to last week of first term
      } else {
        newPeriod.term = '';
        newPeriod.week = '';
      }
    } else if (field === 'term') {
      const yearData = periods.find(p => p.year === controlledSelectedPeriod.year);
      const termData = yearData?.terms.find(t => t.term === value);
      newPeriod.week = termData?.weeks?.[termData.weeks.length -1] || ''; // Default to last week of selected term
    }
    // If it's an initial setup call triggered by fetching periods, only update if parent hasn't set a year
    if (isInitialSetup && controlledSelectedPeriod.year) {
      return; 
    }

    onPeriodChange(newPeriod); // Pass the whole new period object
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
                  value={controlledSelectedPeriod.year || ''}
                  label="Academic Year"
                  onChange={(e) => handlePeriodChange('year', e.target.value)}
                  disabled={!onPeriodChange}
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
                  value={controlledSelectedPeriod.term || ''}
                  label="Term"
                  onChange={(e) => handlePeriodChange('term', e.target.value)}
                  disabled={!onPeriodChange || !controlledSelectedPeriod.year || !periods.find(p => p.year === controlledSelectedPeriod.year)?.terms?.length}
                >
                  {controlledSelectedPeriod.year && 
                    periods
                      .find(p => p.year === controlledSelectedPeriod.year)
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
                  value={controlledSelectedPeriod.week || ''}
                  label="Week"
                  onChange={(e) => handlePeriodChange('week', e.target.value)}
                  disabled={!onPeriodChange || !controlledSelectedPeriod.term || !periods.find(p => p.year === controlledSelectedPeriod.year)?.terms.find(t => t.term === controlledSelectedPeriod.term)?.weeks?.length}
                >
                  {controlledSelectedPeriod.year && controlledSelectedPeriod.term && 
                    periods
                      .find(p => p.year === controlledSelectedPeriod.year)
                      ?.terms.find(t => t.term === controlledSelectedPeriod.term)
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
