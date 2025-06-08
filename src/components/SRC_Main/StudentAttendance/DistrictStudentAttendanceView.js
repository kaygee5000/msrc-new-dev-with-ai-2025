'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataDisplayTable from '@/components/DataDisplayTable';

export default function DistrictStudentAttendanceView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [circuitsData, setCircuitsData] = useState([]);
  const title = 'Student Attendance';

  const fetchData = useCallback(async () => {
    if (!filterParams?.district_id) { 
      setData(null); 
      setCircuitsData([]);
      return; 
    }
    
    setLoading(true); 
    setError(null);
    
    const q = new URLSearchParams();
    ['district_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      const res = await fetch(`/api/school-report/main/student-attendance?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const attendanceData = await res.json();
      setData(attendanceData);
      
      // Group data by circuit and school
      const circuitMap = new Map();
      
      attendanceData.forEach(item => {
        // Create circuit entry if it doesn't exist
        if (!circuitMap.has(item.circuit_id)) {
          circuitMap.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            attendance: []
          });
        }
        
        const circuit = circuitMap.get(item.circuit_id);
        circuit.attendance.push(item);
        
        // Create school entry if it doesn't exist
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            attendance: []
          });
        }
        
        // Add attendance data to school
        circuit.schools.get(item.school_id).attendance.push(item);
      });
      
      // Convert maps to arrays for rendering
      const circuitsArray = Array.from(circuitMap.values()).map(circuit => ({
        ...circuit,
        schools: Array.from(circuit.schools.values())
      }));
      
      setCircuitsData(circuitsArray);
    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null);
      setCircuitsData([]);
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
      <Typography variant="body1">No student attendance data available for schools in this district.</Typography>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        District Student Attendance Data - {circuitsData.length} Circuits
      </Typography>
      
      {/* Summary of all attendance data */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>All District Student Attendance Data</Typography>
        <DataDisplayTable data={data} title={title} />
      </Paper>
      
      {/* Circuit-by-circuit breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Circuit Breakdown</Typography>
      
      {circuitsData.map((circuit) => (
        <Accordion key={circuit.circuit_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{circuit.circuit_name} - {circuit.schools.length} Schools</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Circuit Summary</Typography>
              <DataDisplayTable data={circuit.attendance} title={`${circuit.circuit_name} Student Attendance`} />
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Schools in {circuit.circuit_name}</Typography>
            
            {circuit.schools.map((school) => (
              <Accordion key={school.school_id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{school.school_name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DataDisplayTable data={school.attendance} title={`${school.school_name} Student Attendance`} />
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
