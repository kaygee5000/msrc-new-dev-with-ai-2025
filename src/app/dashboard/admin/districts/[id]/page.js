"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import DistrictReportContainer from '@/components/SRC_ReportContainers/DistrictReportContainer';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const TERMS = [1, 2, 3];

export default function DistrictDetail() {
  const { id } = useParams(); // This is district_id
  const router = useRouter();
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPeriod, setSelectedPeriod] = useState({
    year: CURRENT_YEAR,
    term: TERMS[0],
  });

  const handlePeriodChange = (name, value) => {
    setSelectedPeriod(prev => ({ ...prev, [name]: value }));
  };

  const filterParams = useMemo(() => ({
    district_id: id,
    year: selectedPeriod.year,
    term: selectedPeriod.term,
  }), [id, selectedPeriod.year, selectedPeriod.term]);

  useEffect(() => {
    async function fetchDistrictDetails() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/districts/${id}`); // Fetch basic details for header
        const data = await res.json();
        if (res.ok && data.success) {
          setDistrict(data.district);
        } else {
          setError(data.error || 'Failed to fetch district details.');
          setDistrict(null);
        }
      } catch (err) {
        console.error('Error fetching district details:', err);
        setError('An error occurred while fetching district details.');
        setDistrict(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDistrictDetails();
  }, [id]);

  const handleEdit = () => {
    router.push(`/dashboard/admin/districts/${id}/edit`);
  };

  const handleBack = () => router.push('/dashboard/admin/districts');

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight="50vh">
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Alert severity="error">{error}</Alert>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Districts
      </Button>
    </Box>
  );

  if (!district) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Typography variant="h6">District not found.</Typography>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Districts
      </Button>
    </Box>
  );

  return (
    <Box p={1}>
      {/* Breadcrumbs and Actions */}
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
            href="/dashboard/admin/districts"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard/admin/districts');
            }}
          >
            <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Districts
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {district?.name || 'District Details'}
          </Typography>
        </Breadcrumbs>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack} // Using defined handleBack for consistency
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to Districts
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

      {/* District Header Info */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{district.name}</Typography>
        <Chip
          label={`Region: ${district.region_name || 'N/A'}`}
          variant="outlined"
          color="primary"
          size="small"
          sx={{ mb: 1 }}
        />
        {/* Add other relevant non-report header info here if needed */}
      </Paper>

      {/* Year and Term Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1">Report Period:</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              id="year-select"
              value={selectedPeriod.year}
              label="Year"
              onChange={(e) => handlePeriodChange('year', e.target.value)}
            >
              {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="term-select-label">Term</InputLabel>
            <Select
              labelId="term-select-label"
              id="term-select"
              value={selectedPeriod.term}
              label="Term"
              onChange={(e) => handlePeriodChange('term', e.target.value)}
            >
              {TERMS.map(t => <MenuItem key={t} value={t}>{`Term ${t}`}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* District Report Container */}
      {(selectedPeriod.year && selectedPeriod.term) ? (
        <DistrictReportContainer filterParams={filterParams} />
      ) : (
        <Paper sx={{p:2, mt:2}}><Typography>Please select a year and term to view the report.</Typography></Paper>
      )}
    </Box>
  );
}
