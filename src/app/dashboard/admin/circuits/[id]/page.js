"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';

export default function CircuitDetail() {
  const { id } = useParams();
  const [circuit, setCircuit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchCircuit() {
      setLoading(true);
      const res = await fetch(`/api/circuits/${id}`);
      const data = await res.json();
      setCircuit(data);
      setLoading(false);
    }
    fetchCircuit();
  }, [id]);

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!circuit) return <Box p={4}><Typography>Circuit not found.</Typography></Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>{circuit.name}</Typography>
      <Typography variant="subtitle1" gutterBottom>{circuit.description}</Typography>
      <Typography variant="body2" gutterBottom>District: {circuit.district_name} | Region: {circuit.region_name}</Typography>
      <Paper sx={{ mt: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Stats" />
        </Tabs>
        <Box p={3}>
          {tab === 0 && <Typography>Overview and details for this circuit.</Typography>}
          {tab === 1 && <Typography>Analytics for this circuit (placeholder).</Typography>}
          {tab === 2 && <Typography>Stats for this circuit (placeholder).</Typography>}
        </Box>
      </Paper>
    </Box>
  );
}
