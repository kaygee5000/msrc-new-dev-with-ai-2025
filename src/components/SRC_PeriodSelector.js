import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Box,
  Grid
} from '@mui/material';

const SRC_PeriodSelector = ({ 
  entityType = 'school',
  entityId,
  selectedPeriod = {},
  onPeriodChange,
  showWeekSelector = true,
  showHeader = true,
  elevation = 2,
  sx = {}
}) => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch available periods
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        
        // Add entity ID if provided
        if (entityId && entityType) {
          params.append(`${entityType}_id`, entityId);
        }
        
        const response = await fetch(`/api/statistics/periods?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch periods');
        }

        const data = await response.json();
        
        if (data.success && data.periods?.length > 0) {
          setPeriods(data.periods);
          
          // If no period is selected, suggest the most recent one
          if (onPeriodChange && !selectedPeriod?.year) {
            const mostRecentYear = data.periods[0];
            if (mostRecentYear?.terms?.length) {
              const mostRecentTerm = mostRecentYear.terms[0];
              const mostRecentWeek = mostRecentTerm.weeks[mostRecentTerm.weeks.length - 1];
              
              onPeriodChange({
                year: mostRecentYear.year,
                term: mostRecentTerm.term,
                week: mostRecentWeek
              });
            }
          }
        } else {
          setPeriods([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching periods:', err);
        setError('Failed to load reporting periods');
      } finally {
        setLoading(false);
      }
    };

    fetchPeriods();
  }, [entityType, entityId, onPeriodChange, selectedPeriod?.year]);

  const handlePeriodChange = (field, value) => {
    console.log(`Period change - Field: ${field}, Value:`, value);
    
    const newPeriod = { ...selectedPeriod, [field]: value };
    
    // Handle year change
    if (field === 'year') {
      const availableTerms = getAvailableTerms();
      const firstTerm = availableTerms[0]?.term || null;
      
      // Update term and clear week
      newPeriod.term = firstTerm;
      newPeriod.week = null;
      
      // If we have a term, find its weeks
      if (firstTerm) {
        const yearData = periods.find(p => p.year === value);
        const termData = yearData?.terms?.find(t => t.term === firstTerm);
        const availableWeeks = termData?.weeks || [];
        
        // Select the last week of the term (or first if no weeks)
        newPeriod.week = availableWeeks.length > 0 
          ? availableWeeks[availableWeeks.length - 1] 
          : null;
      }
    } 
    // Handle term change
    else if (field === 'term') {
      const yearData = periods.find(p => p.year === selectedPeriod.year);
      const termData = yearData?.terms?.find(t => t.term === value);
      const availableWeeks = termData?.weeks || [];
      
      // Select the last week of the term (or first if no weeks)
      newPeriod.week = availableWeeks.length > 0 
        ? availableWeeks[availableWeeks.length - 1] 
        : null;
    }
    
    console.log('New period state:', newPeriod);
    
    // Notify parent component of the change
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  // Get available terms for the selected year (filtering out term "0")
  const getAvailableTerms = () => {
    if (!selectedPeriod.year) return [];
    const yearData = periods.find(p => p.year === selectedPeriod.year);
    return (yearData?.terms || []).filter(term => term.term !== "0");
  };

  // Get available weeks for the selected year and term
  const getAvailableWeeks = () => {
    if (!selectedPeriod.year || !selectedPeriod.term) return [];
    const yearData = periods.find(p => p.year === selectedPeriod.year);
    if (!yearData) return [];
    
    const termData = yearData.terms.find(t => t.term === selectedPeriod.term);
    return termData?.weeks || [];
  };

  // Format term for display
  const formatTerm = (term) => {
    const termMap = {
      '1': 'First Term',
      '2': 'Second Term',
      '3': 'Third Term'
    };
    return termMap[term] || `Term ${term}`;
  };

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (periods.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No reporting periods available.
      </Alert>
    );
  }

  return (
    <Paper elevation={elevation} sx={{ p: 2, mb: 2, ...sx }}>
      {showHeader && (
        <Typography variant="h6" gutterBottom>
          Reporting Period
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {/* Year Selector */}
        <Grid size={{ xs: 12, sm: showWeekSelector ? 4 : 6 }}>
          <FormControl fullWidth size="small" disabled={loading}>
            {loading && (
              <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CircularProgress size={16} />
              </Box>
            )}
            <InputLabel id="year-select-label">Academic Year</InputLabel>
            <Select
              labelId="year-select-label"
              id="year-select"
              value={selectedPeriod.year || ''}
              label="Academic Year"
              onChange={(e) => handlePeriodChange('year', e.target.value)}
            >
              {periods.map((period) => (
                <MenuItem key={period.year} value={period.year}>
                  {period.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Term Selector */}
        <Grid size={{ xs: 12, sm: showWeekSelector ? 4 : 6 }}>
          <FormControl fullWidth size="small" disabled={!selectedPeriod.year || loading}>
            {loading && (
              <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                <CircularProgress size={16} />
              </Box>
            )}
            <InputLabel id="term-select-label">Term</InputLabel>
            <Select
              labelId="term-select-label"
              id="term-select"
              value={selectedPeriod.term || ''}
              label="Term"
              onChange={(e) => handlePeriodChange('term', e.target.value)}
            >
              {getAvailableTerms().map((termData) => (
                <MenuItem key={termData.term} value={termData.term}>
                  {formatTerm(termData.term)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Week Selector - Only shown if enabled */}
        {showWeekSelector && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small" disabled={!selectedPeriod.term || loading}>
              {loading && (
                <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                  <CircularProgress size={16} />
                </Box>
              )}
              <InputLabel id="week-select-label">Week</InputLabel>
              <Select
                labelId="week-select-label"
                id="week-select"
                value={selectedPeriod.week ?? ''}
                label="Week"
                onChange={(e) => handlePeriodChange('week', e.target.value)}
              >
                {getAvailableWeeks().map((week) => (
                  <MenuItem key={week} value={week}>
                    Week {week}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {selectedPeriod.week ? `Week ${selectedPeriod.week}` : ' '}
              </FormHelperText>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default SRC_PeriodSelector;
