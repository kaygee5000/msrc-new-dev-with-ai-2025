"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Breadcrumbs,
  Link,
  Button,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import RegionReportContainer from '@/components/SRC_ReportContainers/RegionReportContainer';
import EntitySummary from '@/components/EntitySummary';

export default function RegionDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ year: null, term: null, week: null }); // EntitySummary will suggest initial

  useEffect(() => {
    async function fetchRegionDetails() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/regions/${id}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP error! status: ${res.status}` }));
          throw new Error(errorData.error || `Failed to fetch region data. Status: ${res.status}`);
        }
        const data = await res.json();
        if (data.success) {
          setRegion(data.region);
        } else {
          throw new Error(data.error || 'Failed to fetch region: API indicated failure.');
        }
      } catch (err) {
        console.error("Failed to fetch region details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRegionDetails();
  }, [id]);

  const handlePeriodChange = useCallback((newPeriod) => {
    setSelectedPeriod(newPeriod);
  }, []);

  const filterParams = useMemo(() => ({
    year: selectedPeriod.year,
    term: selectedPeriod.term,
  }), [selectedPeriod.year, selectedPeriod.term]);

  const handleBack = useCallback(() => {
    router.push('/dashboard/admin/regions');
  }, [router]);

  const handleEdit = useCallback(() => {
    // Navigate to edit page or open edit modal
    router.push(`/dashboard/admin/regions/${id}/edit`);
    // console.log(`Edit region ${id}`); // Placeholder
  }, [id, router]);

  if (loading) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2} minHeight="80vh">
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Regions
      </Button>
    </Box>
  );

  if (!region) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2} minHeight="80vh">
      <Typography variant="h6">Region not found.</Typography>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Regions
      </Button>
    </Box>
  );

  return (
    <Box p={1}> {/* Consistent padding with other detail pages */}
      {/* Breadcrumbs and Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link
            color="inherit"
            href="/dashboard/admin/regions"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => { e.preventDefault(); router.push('/dashboard/admin/regions'); }}
          >
            <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Regions
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {region?.name || 'Region Details'}
          </Typography>
        </Breadcrumbs>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to Regions
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Region Header Info */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{region.name}</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {region.description || 'No description available.'}
        </Typography>
        {/* Add other relevant non-report header info here if needed */}
      </Paper>

      {/* Entity Summary and Period Filters */}
      <EntitySummary 
        entityType="region" 
        entityId={id} 
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        showPeriodSelector={true} 
      />

      {/* Region Report Container */}
      {(selectedPeriod.year && selectedPeriod.term !== null) ? (
        <RegionReportContainer filterParams={filterParams} regionId={id} />
      ) : (
        !selectedPeriod.year && !selectedPeriod.term && (
          <Paper sx={{p:2, mt:2, textAlign: 'center'}} elevation={1}>
            <Typography>Loading available reporting periods...</Typography>
          </Paper>
        )
      )}
    </Box>
  );
}
