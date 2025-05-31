"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import { Breadcrumbs, Link,} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';

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
      if (!data.success) {
        throw new Error(data.error);
      }
      setRegion(data.region);
      setLoading(false);
    }
    fetchRegion();
  }, [id]);

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!region) return <Box p={4}><Typography>Region not found.</Typography></Box>;

  return (
    <Box p={4}>

       {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
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
          href="/dashboard/admin/regions"
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.preventDefault();
            router.push('/dashboard/admin/regions');
          }}
        >
          <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Regions
        </Link>
        
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {region?.name || 'Region Details'}
        </Typography>
      </Breadcrumbs>

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
