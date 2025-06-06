'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Box
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SchoolIcon from '@mui/icons-material/School';

export default function SchoolSummary({ entityId, selectedPeriod = {} }) {
  console.log('SchoolSummary - Props:', { entityId, selectedPeriod });

  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  const { year, term, week } = selectedPeriod || {};

  const fetchSchoolInfo = useCallback(async () => {

    if (!entityId) {
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (term) params.append('term', term);
      // if (week) params.append('weekNumber', week);

      const queryString = params.toString();
      const url = `/api/schools/${entityId}${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('fetchSchoolInfo - API Error:', { status: res.status, errorData });
        throw new Error(errorData.error || `Error fetching school info: ${res.status}`);
      }

      const data = await res.json();

      if (data && data.school) {
        setSchoolInfo(data.school);
        if (data.statistics) setStats(data.statistics);
      } else {
        console.log('fetchSchoolInfo - No school data in response');
        setSchoolInfo(null);
      }
    } catch (e) {
      console.error('fetchSchoolInfo - Error:', e);
      setError(e.message || 'Failed to load school information');
      setSchoolInfo(null);
    } finally {
      setLoading(false);
    }
  }, [entityId, year, term]);
  
  useEffect(() => {
    fetchSchoolInfo();
  }, [fetchSchoolInfo]);

  if (!entityId) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Alert severity="info">Please select a school to view details.</Alert>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading school information...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading school information: {error}
      </Alert>
    );
  }

  if (!schoolInfo) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No information available for the selected school.
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom component="div">
        {schoolInfo.name || 'School Details'}
      </Typography>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {/* Enrollment */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Enrollment</Typography>
                <Typography variant="h4">{stats.enrolment?.totalStudents || 'N/A'}</Typography>
                {stats.enrolment?.genderDistribution.boys != null && (
                  <Typography variant="body2">Boys: {stats.enrolment.genderDistribution.boys} | Girls: {stats.enrolment.genderDistribution.girls}</Typography>
                )}
              </Box>
              <PeopleIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>
        {/* Student Attendance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Student Attendance</Typography>
                <Typography variant="h4">{stats.studentAttendance?.attendanceRate != null ? `${stats.studentAttendance.attendanceRate}%` : 'N/A'}</Typography>
                {stats.studentAttendance && (
                  <Typography variant="body2">Present: {stats.studentAttendance.totalPresent || 0} / {stats.studentAttendance.totalEnrolled || 0}</Typography>
                )}
              </Box>
              <EventAvailableIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>
        {/* Teacher Attendance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Teacher Attendance</Typography>
                <Typography variant="h4">{stats.teacherAttendance?.attendanceRate ? `${stats.teacherAttendance.attendanceRate}%` : 'N/A'}</Typography>
                {stats.teacherAttendance && (
                  <Typography variant="body2">Teachers: {stats.teacherAttendance.totalTeachers || 0}</Typography>
                )}
              </Box>
              <SchoolIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>
        {/* Teacher Performance */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Teacher Performance</Typography>
                <Typography variant="h4">{stats.teacherAttendance?.exerciseCompletionRate ? `${stats.teacherAttendance.exerciseCompletionRate}%` : 'N/A'}</Typography>
                {stats.teacherAttendance && (
                  <Typography variant="body2">Exercises Marked Rate</Typography>
                )}
              </Box>
              <SchoolIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
      <Grid container spacing={1}>
        {schoolInfo.circuit_name && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="body1">
              <strong>Circuit:</strong> {schoolInfo.circuit_name}
            </Typography>
          </Grid>
        )}
        {schoolInfo.district_name && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="body1">
              <strong>District:</strong> {schoolInfo.district_name}
            </Typography>
          </Grid>
        )}
        {schoolInfo.region_name && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="body1">
              <strong>Region:</strong> {schoolInfo.region_name}
            </Typography>
          </Grid>
        )}
        {year && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="body1">
              <strong>Year:</strong> {year}
            </Typography>
          </Grid>
        )}
        {term && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="body1">
              <strong>Term:</strong> {term}
            </Typography>
          </Grid>
        )}
        {week && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="body1">
              <strong>Week:</strong> {week}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
