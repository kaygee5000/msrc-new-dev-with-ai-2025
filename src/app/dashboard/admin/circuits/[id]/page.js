"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress, Button } from '@mui/material';
import { Breadcrumbs, Link } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EntitySummary from '@/components/EntitySummary';

export default function CircuitDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [circuit, setCircuit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    async function fetchCircuit() {
      setLoading(true);
      const res = await fetch(`/api/circuits/${id}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      setCircuit(data.circuit);
      setLoading(false);
    }
    fetchCircuit();
  }, [id]);

  const handleEdit = () => {
    router.push(`/dashboard/admin/circuits/${id}/edit`);
  };

  if (loading) return <Box p={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
  if (!circuit) return <Box p={4} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Typography>Circuit not found.</Typography></Box>;

  return (
    <Box p={2}>
      {/* Breadcrumbs */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link 
            color="inherit" 
            href="/dashboard" 
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard');
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          
          <Link 
            color="inherit" 
            href="/dashboard/admin/circuits"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard/admin/circuits');
            }}
          >
            <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Circuits
          </Link>
          
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {circuit?.name || 'Circuit Details'}
          </Typography>
        </Breadcrumbs>
        <Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.back()}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to Circuits
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={handleEdit}
            size="small"
          >
            Edit
          </Button>
        </Box>
      </Box>
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
          {tab === 1 && <Typography>Analytics for this circuit.</Typography>}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Circuit Statistics</Typography>
              <EntitySummary 
                entityType="circuit"
                entityId={id}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
