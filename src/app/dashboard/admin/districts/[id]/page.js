"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';

export default function DistrictDetail() {
  const { id } = useParams();
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchDistrict() {
      setLoading(true);
      const res = await fetch(`/api/districts/${id}`);
      const data = await res.json();
      setDistrict(data);
      setLoading(false);
    }
    fetchDistrict();
  }, [id]);

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!district) return <Box p={4}><Typography>District not found.</Typography></Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>{district.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>{district.description}</Typography>
      <Typography variant="body2" gutterBottom>Region: {district.region_name}</Typography>
      <Paper sx={{ mt: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Stats" />
        </Tabs>
        <Box p={3}>
          {tab === 0 && <Typography>Overview and details for this district.</Typography>}
          {tab === 1 && <Typography>Analytics for this district (placeholder).</Typography>}
          {tab === 2 && <Typography>Stats for this district (placeholder).</Typography>}
        </Box>
      </Paper>
    </Box>
  );
}
