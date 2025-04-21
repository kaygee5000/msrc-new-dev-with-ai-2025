"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';

export default function RegionDetail() {
  const { id } = useParams();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchRegion() {
      setLoading(true);
      const res = await fetch(`/api/regions/${id}`);
      const data = await res.json();
      setRegion(data);
      setLoading(false);
    }
    fetchRegion();
  }, [id]);

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!region) return <Box p={4}><Typography>Region not found.</Typography></Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>{region.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>{region.description}</Typography>
      <Paper sx={{ mt: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Stats" />
          {/* Add more tabs for thematic areas as needed */}
        </Tabs>
        <Box p={3}>
          {tab === 0 && <Typography>Overview and details for this region.</Typography>}
          {tab === 1 && <Typography>Analytics for this region (placeholder).</Typography>}
          {tab === 2 && <Typography>Stats for this region (placeholder).</Typography>}
        </Box>
      </Paper>
    </Box>
  );
}
