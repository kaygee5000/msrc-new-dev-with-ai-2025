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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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

export default function SchoolFacilitatorsView({ filterParams }) {
  const [facilitators, setFacilitators] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lessonData, setLessonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentFacilitator, setCurrentFacilitator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    qualification: '',
    contact: '',
    email: ''
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch facilitators data
  const fetchFacilitators = useCallback(async () => {
    if (!filterParams?.school_id) { 
      setFacilitators([]);
      return; 
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['school_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      const res = await fetch(`/api/school-report/main/facilitators?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const data = await res.json();
      setFacilitators(data);
    } catch(e) {
      console.error('Error fetching facilitators:', e);
      setError(e.message);
      setFacilitators([]);
    }
    
    setLoading(false);
  }, [filterParams]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    if (!filterParams?.school_id) { 
      setAttendance([]);
      return; 
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['school_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      const res = await fetch(`/api/school-report/main/facilitator-attendance?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const data = await res.json();
      setAttendance(data);
    } catch(e) {
      console.error('Error fetching facilitator attendance:', e);
      setError(e.message);
      setAttendance([]);
    }
    
    setLoading(false);
  }, [filterParams]);

  // Fetch lesson data (exercises, lesson plans, units covered)
  const fetchLessonData = useCallback(async () => {
    if (!filterParams?.school_id) { 
      setLessonData([]);
      return; 
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['school_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      const res = await fetch(`/api/school-report/main/facilitator-lessons?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const data = await res.json();
      setLessonData(data);
    } catch(e) {
      console.error('Error fetching facilitator lesson data:', e);
      setError(e.message);
      setLessonData([]);
    }
    
    setLoading(false);
  }, [filterParams]);

  // Fetch all data when filterParams change
  useEffect(() => {
    fetchFacilitators();
    fetchAttendance();
    fetchLessonData();
  }, [fetchFacilitators, fetchAttendance, fetchLessonData]);

  // Handle dialog open for add/edit
  const handleOpenDialog = (facilitator = null) => {
    if (facilitator) {
      setCurrentFacilitator(facilitator);
      setFormData({
        name: facilitator.name || '',
        position: facilitator.position || '',
        qualification: facilitator.qualification || '',
        contact: facilitator.contact || '',
        email: facilitator.email || ''
      });
    } else {
      setCurrentFacilitator(null);
      setFormData({
        name: '',
        position: '',
        qualification: '',
        contact: '',
        email: ''
      });
    }
    setDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save facilitator (create or update)
  const handleSaveFacilitator = async () => {
    try {
      const method = currentFacilitator ? 'PUT' : 'POST';
      const url = currentFacilitator 
        ? `/api/school-report/main/facilitators/${currentFacilitator.id}` 
        : `/api/school-report/main/facilitators`;
      
      const body = {
        ...formData,
        school_id: filterParams.school_id
      };
      
      if (currentFacilitator) {
        body.id = currentFacilitator.id;
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error ${res.status}`);
      }
      
      // Refresh facilitators data
      fetchFacilitators();
      setDialogOpen(false);
    } catch (e) {
      console.error('Error saving facilitator:', e);
      setError(e.message);
    }
  };

  // Handle delete facilitator
  const handleDeleteFacilitator = async (facilitator) => {
    if (window.confirm(`Are you sure you want to delete ${facilitator.name}?`)) {
      try {
        const res = await fetch(`/api/school-report/main/facilitators/${facilitator.id}`, {
          method: 'DELETE'
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}`);
        }
        
        // Refresh facilitators data
        fetchFacilitators();
      } catch (e) {
        console.error('Error deleting facilitator:', e);
        setError(e.message);
      }
    }
  };

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

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>School Facilitators</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="facilitator tabs">
          <Tab label="Facilitators" />
          <Tab label="Attendance & Punctuality" />
          <Tab label="Lesson Data" />
        </Tabs>
      </Box>
      
      {/* Facilitators Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Facilitator
          </Button>
        </Box>
        
        {facilitators.length > 0 ? (
          <Box sx={{ overflowX: 'auto' }}>
            <Paper elevation={1}>
              <DataDisplayTable 
                data={facilitators.map(f => ({
                  ...f,
                  actions: (
                    <>
                      <IconButton size="small" onClick={() => handleOpenDialog(f)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteFacilitator(f)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )
                }))} 
                title="Facilitators"
              />
            </Paper>
          </Box>
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No facilitators found for this school.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Attendance & Punctuality Tab */}
      <TabPanel value={tabValue} index={1}>
        {attendance.length > 0 ? (
          <DataDisplayTable data={attendance} title="Facilitator Attendance & Punctuality" />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No attendance data found for facilitators in this school.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Lesson Data Tab */}
      <TabPanel value={tabValue} index={2}>
        {lessonData.length > 0 ? (
          <DataDisplayTable 
            data={lessonData} 
            title="Facilitator Lesson Data (Exercises, Lesson Plans, Units Covered)" 
          />
        ) : (
          <Paper elevation={0} sx={{ p: 2 }}>
            <Typography>No lesson data found for facilitators in this school.</Typography>
          </Paper>
        )}
      </TabPanel>
      
      {/* Add/Edit Facilitator Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentFacilitator ? 'Edit Facilitator' : 'Add New Facilitator'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              name="name"
              label="Name"
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                name="position"
                value={formData.position}
                label="Position"
                onChange={handleInputChange}
              >
                <MenuItem value="Teacher">Teacher</MenuItem>
                <MenuItem value="Head Teacher">Head Teacher</MenuItem>
                <MenuItem value="Deputy Head Teacher">Deputy Head Teacher</MenuItem>
                <MenuItem value="Subject Specialist">Subject Specialist</MenuItem>
                <MenuItem value="Administrator">Administrator</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="qualification"
              label="Qualification"
              fullWidth
              value={formData.qualification}
              onChange={handleInputChange}
            />
            <TextField
              name="contact"
              label="Contact Number"
              fullWidth
              value={formData.contact}
              onChange={handleInputChange}
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFacilitator} variant="contained">
            {currentFacilitator ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
