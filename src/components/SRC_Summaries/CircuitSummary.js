'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Box
} from '@mui/material';

export default function CircuitSummary({ circuitId, year, term }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummaryData = useCallback(async () => {
    if (!circuitId || !year || !term) {
        setLoading(false);
        // setError('Circuit ID, Year, and Term are required to fetch summary.');
        // Or set summaryData to a default state indicating selection is needed
        setSummaryData(null); 
        return;
    }
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call to fetch circuit details
      // Example: /api/circuits/${circuitId}?year=${year}&term=${term}
      // This API would need to return circuit name, district name, region name, number of schools, etc.
      // For now, using placeholder data structure based on what CircuitSanitationView might receive
      const q = new URLSearchParams({ circuit_id: circuitId, year, term, level: 'circuit' });
      const res = await fetch(`/api/school-report/grounds/sanitation?${q.toString()}`); 
      // The above API is for sanitation, we'll need a dedicated circuit info API.
      // For now, let's assume it gives us some basic info or we derive it.
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      if (data && data.length > 0) {
        // Assuming the API returns an array of circuits, even if filtered to one
        const circuitInfo = data[0]; 
        setSummaryData({
          name: circuitInfo.circuit_name || 'N/A',
          districtName: circuitInfo.district_name || 'N/A',
          regionName: circuitInfo.region_name || 'N/A',
          numberOfSchools: circuitInfo.schools ? circuitInfo.schools.length : 'N/A', // Example
        });
      } else {
        throw new Error('Circuit not found or no data available.');
      }
    } catch (e) {
      console.error('Error fetching circuit summary:', e);
      setError(e.message);
      setSummaryData(null);
    }
    setLoading(false);
  }, [circuitId, year, term]);

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

  if (!summaryData) {
    return <Alert severity="info" sx={{ mb: 2 }}>Select a circuit to view its summary.</Alert>;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom component="div">
        {summaryData.name} Circuit Summary
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>District:</strong> {summaryData.districtName}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Region:</strong> {summaryData.regionName}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Year:</strong> {year}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Term:</strong> {term}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1" component="div"><strong>Number of Schools:</strong> <Chip label={summaryData.numberOfSchools} size="small" color="primary" /></Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
