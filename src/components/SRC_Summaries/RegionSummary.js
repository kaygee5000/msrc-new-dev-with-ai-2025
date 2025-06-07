'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Box,
  Card,
  CardContent
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SchoolIcon from '@mui/icons-material/School';

export default function RegionSummary({ regionId, year, term }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummaryData = useCallback(async () => {
    if (!regionId || !year || !term) {
      setLoading(false);
      setSummaryData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/regions/${regionId}?year=${year}&term=${term}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: `HTTP error ${res.status}` }));
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      if (data && data.region && data.statistics) {
        setSummaryData({
          name: data.region.name || 'N/A',
          districtCount: data.districtCount || 0,
          schoolCount: data.schoolCount || 0,
          statistics: data.statistics || {
            enrolment: { totalStudents: 0, genderDistribution: { boys: 0, girls: 0 } },
            studentAttendance: { attendanceRate: 0, totalPresent: 0, totalEnrolled: 0 },
            teacherAttendance: { attendanceRate: 0, totalTeachers: 0, exerciseCompletionRate: 0 }
          }
        });
      } else {
        throw new Error('Region data from API is incomplete or not in expected format');
      }
    } catch (e) {
      console.error('Error fetching region summary:', e);
      setError(e.message);
      setSummaryData(null);
    }
    setLoading(false);
  }, [regionId, year, term]);

  useEffect(() => { fetchSummaryData(); }, [fetchSummaryData]);

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading region summary...</Typography>
      </Paper>
    );
  }
  if (error) return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  if (!summaryData) return <Alert severity="info" sx={{ mb: 2 }}>Select a region to view its summary.</Alert>;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom component="div">
        {summaryData.name} Region Summary
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Year:</strong> {year}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Term:</strong> {term}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1" component="div"><strong>Number of Districts:</strong> <Chip label={summaryData.districtCount || 'N/A'} size="small" color="primary" /></Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1" component="div"><strong>Total Schools:</strong> <Chip label={summaryData.schoolCount || 'N/A'} size="small" color="secondary" /></Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Enrollment */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ height: '100%' }}><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Enrollment</Typography>
                <Typography variant="h5">{summaryData.statistics.enrolment?.totalStudents ?? 'N/A'}</Typography>
                <Typography variant="body2">Boys: {summaryData.statistics.enrolment?.genderDistribution?.boys ?? '0'} | Girls: {summaryData.statistics.enrolment?.genderDistribution?.girls ?? '0'}</Typography>
              </Box>
              <PeopleIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Student Attendance */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ height: '100%' }}><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Student Attendance</Typography>
                <Typography variant="h5">{summaryData.statistics.studentAttendance?.attendanceRate != null ? `${summaryData.statistics.studentAttendance.attendanceRate}%` : 'N/A'}</Typography>
                <Typography variant="body2">Present: {summaryData.statistics.studentAttendance?.totalPresent ?? '0'} / {summaryData.statistics.studentAttendance?.totalEnrolled ?? '0'}</Typography>
              </Box>
              <EventAvailableIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Teacher Attendance */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ height: '100%' }}><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Teacher Attendance</Typography>
                <Typography variant="h5">{summaryData.statistics.teacherAttendance?.attendanceRate != null ? `${summaryData.statistics.teacherAttendance?.attendanceRate}%` : 'N/A'}</Typography>
                <Typography variant="body2">Teachers: {summaryData.statistics.teacherAttendance?.totalTeachers ?? '0'}</Typography>
              </Box>
              <SchoolIcon fontSize="large" color="primary" />
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Exercise Completion */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ height: '100%' }}><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography color="textSecondary" variant="subtitle2">Exercise Completion</Typography>
                <Typography variant="h5">{summaryData.statistics.teacherAttendance?.exerciseCompletionRate != null ? `${summaryData.statistics.teacherAttendance?.exerciseCompletionRate}%` : 'N/A'}</Typography>
              </Box>
              <SchoolIcon fontSize="large" color="secondary" />
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Paper>
  );
}
