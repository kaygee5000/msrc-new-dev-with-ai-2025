'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataDisplayTable from '@/components/DataDisplayTable';

export default function CircuitFurnitureView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schoolsData, setSchoolsData] = useState([]);
  const title = 'Furniture';

  const fetchData = useCallback(async () => {
    if (!filterParams?.circuit_id) { 
      setData(null); 
      setSchoolsData([]);
      return; 
    }
    
    setLoading(true); 
    setError(null);
    
    const q = new URLSearchParams();
    ['circuit_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      const res = await fetch(`/api/school-report/grounds/furniture?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const furnitureData = await res.json();
      setData(furnitureData);
      
      // Group data by school
      const schoolMap = new Map();
      
      furnitureData.forEach(item => {
        if (!schoolMap.has(item.school_id)) {
          schoolMap.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            furniture: []
          });
        }
        
        schoolMap.get(item.school_id).furniture.push(item);
      });
      
      setSchoolsData(Array.from(schoolMap.values()));
    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null);
      setSchoolsData([]);
    }
    
    setLoading(false);
  }, [filterParams]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  if (loading) return (
    <Box display="flex" p={2}>
      <CircularProgress size={24} sx={{ mr: 1 }} />
      <Typography>Loading {title} data...</Typography>
    </Box>
  );
  
  if (error) return (
    <Alert severity="warning" sx={{ mt:1, mb:2 }}>
      Error loading {title} data: {error}
    </Alert>
  );

  if (!data || data.length === 0) return (
    <Paper elevation={0} sx={{ p: 2, mt: 1 }}>
      <Typography variant="body1">No furniture data available for schools in this circuit.</Typography>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Circuit Furniture Data - {schoolsData.length} Schools
      </Typography>
      
      {/* Summary of all furniture data */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>All Circuit Furniture Data</Typography>
        <DataDisplayTable data={data} title={title} />
      </Paper>
      
      {/* School-by-school breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>School Breakdown</Typography>
      
      {schoolsData.map((school) => (
        <Accordion key={school.school_id} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{school.school_name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <DataDisplayTable data={school.furniture} title={`${school.school_name} Furniture`} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
