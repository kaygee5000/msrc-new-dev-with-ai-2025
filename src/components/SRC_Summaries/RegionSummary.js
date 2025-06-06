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
      // TODO: Replace with actual API call to fetch region details
      // Example: /api/regions/${regionId}?year=${year}&term=${term}
      // This API would need to return region name, number of districts, number of schools etc.
      const q = new URLSearchParams({ region_id: regionId, year, term, level: 'region' });
      // Using sanitation API temporarily to get some region info, will need a dedicated API.
      const res = await fetch(`/api/school-report/grounds/sanitation?${q.toString()}`); 
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      if (data && data.length > 0) {
        const regionInfo = data[0]; // Assuming API returns an array
        setSummaryData({
          name: regionInfo.region_name || 'N/A',
          numberOfDistricts: regionInfo.districts ? regionInfo.districts.length : 'N/A', // Example
          // numberOfSchools: regionInfo.total_schools_in_region, // This would come from a dedicated API
        });
      } else {
        throw new Error('Region not found or no data available.');
      }
    } catch (e) {
      console.error('Error fetching region summary:', e);
      setError(e.message);
      setSummaryData(null);
    }
    setLoading(false);
  }, [regionId, year, term]);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={24} sx={{mr: 1}} />
        <Typography>Loading region summary...</Typography>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (!summaryData) {
    return <Alert severity="info" sx={{ mb: 2 }}>Select a region to view its summary.</Alert>;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom component="div">
        {summaryData.name} Region Summary
      </Typography>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant="body1"><strong>Year:</strong> {year}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant="body1"><strong>Term:</strong> {term}</Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant="body1"><strong>Number of Districts:</strong> <Chip label={summaryData.numberOfDistricts} size="small" color="primary" /></Typography>
        </Grid>
        {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant="body1"><strong>Total Schools:</strong> <Chip label={summaryData.numberOfSchools} size="small" color="secondary" /></Typography>
        </Grid> */}
      </Grid>
    </Paper>
  );
}
