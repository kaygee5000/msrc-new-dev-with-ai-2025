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

export default function RegionStudentAttendanceView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const title = 'Student Attendance';

  const fetchData = useCallback(async () => {
    if (!filterParams?.region_id) { 
      setData(null); 
      setDistrictsData([]);
      return; 
    }
    
    setLoading(true); 
    setError(null);
    
    const q = new URLSearchParams();
    ['region_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      const res = await fetch(`/api/school-report/main/student-attendance?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const attendanceData = await res.json();
      setData(attendanceData);
      
      // Group data by district, circuit, and school
      const districtMap = new Map();
      
      attendanceData.forEach(item => {
        // Create district entry if it doesn't exist
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map(),
            attendance: []
          });
        }
        
        const district = districtMap.get(item.district_id);
        district.attendance.push(item);
        
        // Create circuit entry if it doesn't exist
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            attendance: []
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
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
      const districtsArray = Array.from(districtMap.values()).map(district => ({
        ...district,
        circuits: Array.from(district.circuits.values()).map(circuit => ({
          ...circuit,
          schools: Array.from(circuit.schools.values())
        }))
      }));
      
      setDistrictsData(districtsArray);
    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null);
      setDistrictsData([]);
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
      <Typography variant="body1">No student attendance data available for schools in this region.</Typography>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Region Student Attendance Data - {districtsData.length} Districts
      </Typography>
      
      {/* Summary of all attendance data */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>All Region Student Attendance Data</Typography>
        <DataDisplayTable data={data} title={title} />
      </Paper>
      
      {/* District-by-district breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>District Breakdown</Typography>
      
      {districtsData.map((district) => (
        <Accordion key={district.district_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{district.district_name} - {district.circuits.length} Circuits</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>District Summary</Typography>
              <DataDisplayTable data={district.attendance} title={`${district.district_name} Student Attendance`} />
            </Box>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>Circuits in {district.district_name}</Typography>
            
            {district.circuits.map((circuit) => (
              <Accordion key={circuit.circuit_id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{circuit.circuit_name} - {circuit.schools.length} Schools</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Circuit Summary</Typography>
                    <DataDisplayTable data={circuit.attendance} title={`${circuit.circuit_name} Student Attendance`} />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Schools in {circuit.circuit_name}</Typography>
                  
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
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
