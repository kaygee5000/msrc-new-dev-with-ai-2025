"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Breadcrumbs,
  Link,
  Chip,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import RegionReportContainer from '@/components/SRC_ReportContainers/RegionReportContainer';
import SRC_PeriodSelector from '@/components/SRC_PeriodSelector';

export default function RegionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ year: null, term: null, week: null });

  const handlePeriodChange = (newPeriod) => setSelectedPeriod(newPeriod);

  const filterParams = useMemo(() => ({
    region_id: id,
    year: selectedPeriod.year,
    term: selectedPeriod.term,
  }), [id, selectedPeriod]);

  useEffect(() => {
    async function fetchRegionDetails() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/regions/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setRegion(data.region);
        } else {
          setError(data.error || 'Failed to fetch region details.');
          setRegion(null);
        }
      } catch (err) {
        console.error('Error fetching region details:', err);
        setError('An error occurred while fetching region details.');
        setRegion(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRegionDetails();
  }, [id]);

  const handleEdit = () => router.push(`/dashboard/admin/regions/${id}/edit`);
  const handleBack = () => router.push('/dashboard/admin/regions');

  if (loading) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Alert severity="error">{error}</Alert>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Regions
      </Button>
    </Box>
  );

  if (!region) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Typography variant="h6">Region not found.</Typography>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Regions
      </Button>
    </Box>
  );

  return (
    <Box p={1}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />Dashboard
          </Link>
          <Link color="inherit" href="/dashboard/admin/regions" sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => { e.preventDefault(); router.push('/dashboard/admin/regions'); }}>
            <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />Regions
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {region.name || 'Region Details'}
          </Typography>
        </Breadcrumbs>
        <Box>
          <Button startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mr: 2 }} onClick={handleBack}>
            Back to Regions
          </Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>
            Edit
          </Button>
        </Box>
      </Box>

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{region.name}</Typography>
        <Chip label={`Description: ${region.description || 'N/A'}`} variant="outlined" size="small" />
      </Paper>

      <SRC_PeriodSelector
        entityType="region"
        entityId={id}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        showWeekSelector={false}
        showHeader={true}
        elevation={1}
        sx={{ mb: 3 }}
      />

      {(selectedPeriod.year && selectedPeriod.term) ? (
        <RegionReportContainer filterParams={filterParams} />
      ) : (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography>Please select a year and term to view the report.</Typography>
        </Paper>
      )}
    </Box>
  );
}
