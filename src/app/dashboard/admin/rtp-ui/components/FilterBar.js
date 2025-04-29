'use client';
import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Chip, Stack, Typography, Tooltip } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TuneIcon from '@mui/icons-material/Tune';

// Define the order of filters to display
const filterOrder = [
  'regions',
  'districts',
  'circuits',
  'schools',
  'teachers',
  'intervention_types',
  'academic_years',
  'terms',
  'itineraries'
];

// Human-readable filter names
const filterLabels = {
  regions: 'Region',
  districts: 'District',
  circuits: 'Circuit',
  schools: 'School',
  teachers: 'Teacher',
  intervention_types: 'Intervention Type',
  academic_years: 'Academic Year',
  terms: 'Term',
  itineraries: 'Itinerary'
};

export default function FilterBar({ filters, selected, onChange }) {
  // Count active filters
  const activeFilterCount = Object.keys(selected).filter(k => selected[k]).length;
  
  // Sort filter keys according to the defined order
  const sortedFilterKeys = Object.keys(filters).sort((a, b) => {
    const indexA = filterOrder.indexOf(a);
    const indexB = filterOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterAltIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mr: 2 }}>
          Filters
        </Typography>
        <Tooltip title={activeFilterCount > 0 ? 
          `Filtering by: ${Object.keys(selected).filter(k => selected[k]).map(k => `${filterLabels[k]}: ${selected[k]}`).join(', ')}` : 
          'No filters applied'}>
          <Chip 
            icon={<TuneIcon fontSize="small" />}
            label={`${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied`} 
            variant="outlined" 
            size="small"
            color={activeFilterCount > 0 ? "primary" : "default"} 
          />
        </Tooltip>
      </Box>
      
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {sortedFilterKeys.map(key => {
          // Skip filter if it has no options
          if (!filters[key] || filters[key].length === 0) return null;
          
          return (
            <FormControl key={key} size="small" sx={{ minWidth: 150, mb: 1 }}>
              <InputLabel id={`filter-${key}-label`}>
                {filterLabels[key] || key.replace('_', ' ').toUpperCase()}
              </InputLabel>
              <Select
                labelId={`filter-${key}-label`}
                id={`filter-${key}`}
                value={selected[key] || ''}
                label={filterLabels[key] || key.replace('_', ' ').toUpperCase()}
                onChange={(e) => onChange(key, e.target.value)}
                disabled={filters[key].length === 0}
              >
                <MenuItem value="">All</MenuItem>
                {filters[key].map(opt => (
                  <MenuItem value={opt} key={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        })}
      </Stack>
    </Box>
  );
}
