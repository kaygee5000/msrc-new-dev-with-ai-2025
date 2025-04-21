"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';

export default function SchoolDetail() {
  const { id } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchSchool() {
      setLoading(true);
      const res = await fetch(`/api/schools/${id}`);
      const data = await res.json();
      setSchool(data);
      setLoading(false);
    }
    fetchSchool();
  }, [id]);

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!school) return <Box p={4}><Typography>School not found.</Typography></Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>{school.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>GES Code: {school.gesCode}</Typography>
      <Typography variant="body2" gutterBottom>Region: {school.region?.name} | District: {school.district?.name} | Circuit: {school.circuit?.name}</Typography>
      <Paper sx={{ mt: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Stats" />
        </Tabs>
        <Box p={3}>
          {tab === 0 && <Typography>Overview and details for this school.</Typography>}
          {tab === 1 && <Typography>Analytics for this school (placeholder).</Typography>}
          {tab === 2 && <Typography>Stats for this school (placeholder).</Typography>}
        </Box>
      </Paper>
    </Box>
  );
}
