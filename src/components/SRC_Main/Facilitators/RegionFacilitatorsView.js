'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataDisplayTable from '@/components/DataDisplayTable';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facilitator-tabpanel-${index}`}
      aria-labelledby={`facilitator-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function RegionFacilitatorsView({ filterParams }) {
  const [facilitators, setFacilitators] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lessonData, setLessonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [districtsData, setDistrictsData] = useState([]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!filterParams?.region_id) { 
      resetData();
      return; 
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['region_id', 'year', 'term', 'week'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch facilitators data
      const facilitatorsRes = await fetch(`/api/school-report/main/facilitators?${q}`);
      if (!facilitatorsRes.ok) throw new Error((await facilitatorsRes.json()).message || `Error ${facilitatorsRes.status}`);
      const facilitatorsData = await facilitatorsRes.json();
      setFacilitators(facilitatorsData);
      
      // Fetch attendance data
      const attendanceRes = await fetch(`/api/school-report/main/facilitator-attendance?${q}`);
      if (!attendanceRes.ok) throw new Error((await attendanceRes.json()).message || `Error ${attendanceRes.status}`);
      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
      
      // Fetch lesson data
      const lessonRes = await fetch(`/api/school-report/main/facilitator-lessons?${q}`);
      if (!lessonRes.ok) throw new Error((await lessonRes.json()).message || `Error ${lessonRes.status}`);
      const lessonData = await lessonRes.json();
      setLessonData(lessonData);
      
      // Group all data by district, circuit, and school
      const allData = [
        ...facilitatorsData.map(item => ({ ...item, data_type: 'facilitator' })),
        ...attendanceData.map(item => ({ ...item, data_type: 'attendance' })),
        ...lessonData.map(item => ({ ...item, data_type: 'lesson' }))
      ];
      
      // Create district map
      const districtMap = new Map();
      
      allData.forEach(item => {
        // Create district entry if it doesn't exist
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map(),
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const district = districtMap.get(item.district_id);
        
        if (item.data_type === 'facilitator') {
          district.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          district.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          district.lessons.push(item);
        }
        
        // Create circuit entry if it doesn't exist
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        
        if (item.data_type === 'facilitator') {
          circuit.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          circuit.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          circuit.lessons.push(item);
        }
        
        // Create school entry if it doesn't exist
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const school = circuit.schools.get(item.school_id);
        
        if (item.data_type === 'facilitator') {
          school.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          school.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          school.lessons.push(item);
        }
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
      console.error('Error fetching facilitator data:', e);
      setError(e.message);
      resetData();
    }
    
    setLoading(false);
  }, [filterParams]);

  const resetData = () => {
    setFacilitators([]);
    setAttendance([]);
    setLessonData([]);
    setDistrictsData([]);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !facilitators.length && !attendance.length && !lessonData.length) {
    return (
      <Box display="flex" p={2}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading facilitator data...</Typography>
      </Box>
    );
  }
  
  if (error && !facilitators.length && !attendance.length && !lessonData.length) {
    return (
      <Alert severity="warning" sx={{ mt:1, mb:2 }}>
        Error loading facilitator data: {error}
      </Alert>
    );
  }

  if (!facilitators.length && !attendance.length && !lessonData.length) {
    return (
      <Paper elevation={0} sx={{ p: 2 }}>
        <Typography>No facilitator data available for schools in this region.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Region Facilitators Data - {districtsData.length} Districts
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="facilitator tabs">
          <Tab label="Facilitators" />
          <Tab label="Attendance & Punctuality" />
          <Tab label="Lesson Data" />
          <Tab label="District Breakdown" />
        </Tabs>
      </Box>
      
      {/* Facilitators Tab */}
      <TabPanel value={tabValue} index={0}>
        {facilitators.length > 0 ? (
          <DataDisplayTable data={facilitators} title="All Region Facilitators" />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No facilitators found for schools in this region.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Attendance & Punctuality Tab */}
      <TabPanel value={tabValue} index={1}>
        {attendance.length > 0 ? (
          <DataDisplayTable data={attendance} title="Region Facilitator Attendance & Punctuality" />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No attendance data found for facilitators in this region.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Lesson Data Tab */}
      <TabPanel value={tabValue} index={2}>
        {lessonData.length > 0 ? (
          <DataDisplayTable 
            data={lessonData} 
            title="Region Facilitator Lesson Data (Exercises, Lesson Plans, Units Covered)" 
          />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No lesson data found for facilitators in this region.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* District Breakdown Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="subtitle1" gutterBottom>District-by-District Breakdown</Typography>
        
        {districtsData.map((district) => (
          <Accordion key={district.district_id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{district.district_name} - {district.circuits.length} Circuits</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>District Summary</Typography>
                <Tabs value={0} aria-label="district facilitator tabs">
                  <Tab label="Facilitators" />
                  <Tab label="Attendance" />
                  <Tab label="Lesson Data" />
                </Tabs>
                
                <Box sx={{ mt: 2 }}>
                  {district.facilitators.length > 0 ? (
                    <DataDisplayTable data={district.facilitators} title={`${district.district_name} Facilitators`} />
                  ) : (
                    <Typography>No facilitator data available for this district.</Typography>
                  )}
                </Box>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Circuits in {district.district_name}</Typography>
              
              {district.circuits.map((circuit) => (
                <Accordion key={circuit.circuit_id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{circuit.circuit_name} - {circuit.schools.length} Schools</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Circuit Summary</Typography>
                      {circuit.facilitators.length > 0 ? (
                        <DataDisplayTable data={circuit.facilitators} title={`${circuit.circuit_name} Facilitators`} />
                      ) : (
                        <Typography>No facilitator data available for this circuit.</Typography>
                      )}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Schools in {circuit.circuit_name}</Typography>
                    
                    {circuit.schools.map((school) => (
                      <Accordion key={school.school_id} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>{school.school_name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ mt: 2 }}>
                            {school.facilitators.length > 0 ? (
                              <DataDisplayTable data={school.facilitators} title={`${school.school_name} Facilitators`} />
                            ) : (
                              <Typography>No facilitator data available for this school.</Typography>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>
    </Box>
  );
}
