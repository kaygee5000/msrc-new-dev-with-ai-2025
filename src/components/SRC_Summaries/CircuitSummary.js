'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SchoolIcon from '@mui/icons-material/School';

export default function CircuitSummary({ circuitId: entityId, selectedPeriod = {} }) {
  const [stats, setStats] = useState({});
  const [circuitInfo, setCircuitInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { year, term, week } = selectedPeriod;

  const fetchSummaryData = useCallback(async () => {
    if (!entityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `/api/circuits/${entityId}?year=${year}&term=${term}` + (week ? `&week=${week}` : '');
      console.log('CircuitSummary fetching URL:', url);
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      console.log('CircuitSummary received data:', data);
      if (data && data.circuit) {
        setCircuitInfo(data.circuit);
        if (data.statistics) setStats(data.statistics);
      } else {
        throw new Error('Circuit not found or no data available.');
      }
    } catch (e) {
      console.error('Error fetching circuit summary:', e);
      setError(e.message);
      setStats({});
    }
    setLoading(false);
  }, [entityId, year, term]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} sx={{mr: 1}} />
        <Typography>Loading circuit summary...</Typography>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (!circuitInfo) {
    return <Alert severity="info" sx={{ mb: 2 }}>Select a circuit to view its summary.</Alert>;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom component="div">
        {circuitInfo.name} Circuit Summary
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>District:</strong> {circuitInfo.district_name}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Region:</strong> {circuitInfo.region_name}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Year:</strong> {year}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Term:</strong> {term}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1" component="div"><strong>Description :</strong> {circuitInfo.description}</Typography>
        </Grid>
      </Grid>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {/* Enrollment */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Enrollment</Typography>
                <Typography variant="h4">{stats.enrolment?.totalStudents ?? 'N/A'}</Typography>
                {stats.enrolment?.genderDistribution && (
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
                  <Typography variant="body2">Present: {stats.studentAttendance.totalPresent} / {stats.studentAttendance.totalEnrolled}</Typography>
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
                <Typography variant="h4">{stats.teacherAttendance?.attendanceRate != null ? `${stats.teacherAttendance.attendanceRate}%` : 'N/A'}</Typography>
                {stats.teacherAttendance && (
                  <Typography variant="body2">Teachers: {stats.teacherAttendance.totalTeachers}</Typography>
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
                <Typography variant="h4">{stats.teacherAttendance?.exerciseCompletionRate != null ? `${stats.teacherAttendance.exerciseCompletionRate}%` : 'N/A'}</Typography>
                {stats.teacherAttendance && (
                  <Typography variant="body2">Exercises Completion Rate</Typography>
                )}
              </Box>
              <SchoolIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Paper>
  );
}
