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

export default function CircuitFacilitatorsView({ filterParams }) {
  const [facilitators, setFacilitators] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lessonData, setLessonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [schoolsData, setSchoolsData] = useState([]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!filterParams?.circuit_id) { 
      resetData();
      return; 
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['circuit_id', 'year', 'term', 'week'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
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
      
      // Group all data by school
      const allData = [
        ...facilitatorsData.map(item => ({ ...item, data_type: 'facilitator' })),
        ...attendanceData.map(item => ({ ...item, data_type: 'attendance' })),
        ...lessonData.map(item => ({ ...item, data_type: 'lesson' }))
      ];
      
      // Create school map
      const schoolMap = new Map();
      
      allData.forEach(item => {
        if (!schoolMap.has(item.school_id)) {
          schoolMap.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const school = schoolMap.get(item.school_id);
        
        if (item.data_type === 'facilitator') {
          school.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          school.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          school.lessons.push(item);
        }
      });
      
      setSchoolsData(Array.from(schoolMap.values()));
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
    setSchoolsData([]);
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
        <Typography>No facilitator data available for schools in this circuit.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Circuit Facilitators Data - {schoolsData.length} Schools
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="facilitator tabs">
          <Tab label="Facilitators" />
          <Tab label="Attendance & Punctuality" />
          <Tab label="Lesson Data" />
          <Tab label="School Breakdown" />
        </Tabs>
      </Box>
      
      {/* Facilitators Tab */}
      <TabPanel value={tabValue} index={0}>
        {facilitators.length > 0 ? (
          <DataDisplayTable data={facilitators} title="All Circuit Facilitators" />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No facilitators found for schools in this circuit.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Attendance & Punctuality Tab */}
      <TabPanel value={tabValue} index={1}>
        {attendance.length > 0 ? (
          <DataDisplayTable data={attendance} title="Circuit Facilitator Attendance & Punctuality" />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No attendance data found for facilitators in this circuit.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Lesson Data Tab */}
      <TabPanel value={tabValue} index={2}>
        {lessonData.length > 0 ? (
          <DataDisplayTable 
            data={lessonData} 
            title="Circuit Facilitator Lesson Data (Exercises, Lesson Plans, Units Covered)" 
          />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No lesson data found for facilitators in this circuit.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* School Breakdown Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="subtitle1" gutterBottom>School-by-School Breakdown</Typography>
        
        {schoolsData.map((school) => (
          <Accordion key={school.school_id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{school.school_name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={0} aria-label="school facilitator tabs">
                  <Tab label="Facilitators" />
                  <Tab label="Attendance" />
                  <Tab label="Lesson Data" />
                </Tabs>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                {school.facilitators.length > 0 ? (
                  <DataDisplayTable data={school.facilitators} title={`${school.school_name} Facilitators`} />
                ) : (
                  <Typography>No facilitator data available for this school.</Typography>
                )}
                
                {school.attendance.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Attendance & Punctuality</Typography>
                    <DataDisplayTable data={school.attendance} title={`${school.school_name} Attendance`} />
                  </Box>
                )}
                
                {school.lessons.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Lesson Data</Typography>
                    <DataDisplayTable data={school.lessons} title={`${school.school_name} Lesson Data`} />
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>
    </Box>
  );
}
