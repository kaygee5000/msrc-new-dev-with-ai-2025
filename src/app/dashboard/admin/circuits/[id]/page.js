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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CircuitReportContainer from '@/components/SRC_ReportContainers/CircuitReportContainer';
import SRC_PeriodSelector from '@/components/SRC_PeriodSelector';
import CircuitSummary from '@/components/SRC_Summaries/CircuitSummary';

const CURRENT_YEAR = new Date().getFullYear();
// Academic years in 'YYYY/YYYY' format (latest first)
const ACADEMIC_YEARS = Array.from({ length: 3 }, (_, i) => `${CURRENT_YEAR - 1 - i}/${CURRENT_YEAR - i}`);
const TERMS = [1, 2, 3];

export default function CircuitDetail() {
  const { id } = useParams(); // This is circuit_id
  const router = useRouter();
  const [circuit, setCircuit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPeriod, setSelectedPeriod] = useState({
    year: ACADEMIC_YEARS[0],
    term: TERMS[0],
  });

  // Update selectedPeriod directly from PeriodSelector's newPeriod object
  const handlePeriodChange = useCallback((newPeriod) => {
    setSelectedPeriod(newPeriod);
  }, []);

  // Memoize filterParams to prevent unnecessary re-renders of CircuitReportContainer
  const filterParams = useMemo(() => ({
    circuit_id: id,
    year: selectedPeriod.year,
    term: selectedPeriod.term,
    week: selectedPeriod.week,
  }), [id, selectedPeriod.year, selectedPeriod.term, selectedPeriod.week]);

  useEffect(() => {
    async function fetchCircuitDetails() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/circuits/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setCircuit(data.circuit);
        } else {
          setError(data.error || 'Failed to fetch circuit details.');
          setCircuit(null); // Clear previous data if fetch fails
        }
      } catch (err) {
        console.error('Error fetching circuit:', err);
        setError('An error occurred while fetching circuit details.');
        setCircuit(null); // Clear previous data on error
      } finally {
        setLoading(false);
      }
    }
    fetchCircuitDetails();
  }, [id]);

  const handleEdit = () => {
    router.push(`/dashboard/admin/circuits/${id}/edit`);
  };

  const handleBack = () => router.push('/dashboard/admin/circuits');

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight="50vh">
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Alert severity="error">{error}</Alert>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Circuits
      </Button>
    </Box>
  );
  
  if (!circuit) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Typography variant="h6">Circuit not found.</Typography>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Circuits
      </Button>
    </Box>
  );

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
          >
            Edit
          </Button>
        </Box>
      </Box>

      {/* Circuit Header Info - Can be expanded or moved into a dedicated component if needed */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{circuit.name}</Typography>
        {circuit.description && <Typography variant="subtitle1" color="text.secondary" gutterBottom>{circuit.description}</Typography>}
        <Typography variant="body2" color="text.secondary">District: {circuit.district_name || 'N/A'}</Typography>
        <Typography variant="body2" color="text.secondary">Region: {circuit.region_name || 'N/A'}</Typography>
      </Paper>

      {/* Report Period Selector */}
      <SRC_PeriodSelector
        entityType="circuit"
        entityId={id}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        showHeader={false}
        sx={{ mb: 3 }}
      />

        {/* Circuit Report Container */}
      {(selectedPeriod.year && selectedPeriod.term) ? (
        <CircuitReportContainer filterParams={filterParams} />
      ) : (
        <Paper sx={{p:2, mt:2}}><Typography>Please select a year and term to view the report.</Typography></Paper>
      )}

    </Box>
  );
}
