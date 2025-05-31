"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FormDialog from '@/components/FormDialog';
import { useRouter } from 'next/navigation';

// Schools Page Component
export default function Schools() {
  const router = useRouter();
  const [schools, setSchools] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    region_id: '',
    district_id: '',
    circuit_id: ''
  });

  // School types
  const schoolTypes = [
    { value: 'primary', label: 'Primary School' },
    { value: 'jhs', label: 'Junior High School' },
    { value: 'primary_jhs', label: 'Primary & Junior High' },
    { value: 'shs', label: 'Senior High School' },
    { value: 'technical', label: 'Technical/Vocational School' },
    { value: 'special', label: 'Special Education School' }
  ];

  // Fetch schools from API - wrapped in useCallback to avoid dependency issues
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/schools?page=${pagination.page + 1}&limit=${pagination.limit}`;
      
      // Add search term if it exists
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }
      
      // Add region filter if it exists
      if (filters.region_id) {
        url += `&region_id=${filters.region_id}`;
      }
      
      // Add district filter if it exists
      if (filters.district_id) {
        url += `&district_id=${filters.district_id}`;
      }
      
      // Add circuit filter if it exists
      if (filters.circuit_id) {
        url += `&circuit_id=${filters.circuit_id}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.schools) {
        setSchools(data.schools);
        setPagination({
          page: data.pagination.page - 1,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      showAlert('Failed to fetch schools', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters]);
  // Fetch schools on mount and pagination change
  useEffect(() => {
    fetchSchools();
    fetchRegions();
  }, [pagination.page, pagination.limit, fetchSchools]);

  // Fetch regions for filters
  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions?limit=100');
      const data = await response.json();
      
      if (data.regions) {
        setRegions(data.regions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  // Fetch districts based on region
  const fetchDistricts = async (regionId = '') => {
    try {
      let url = '/api/districts?limit=100';
      if (regionId) {
        url += `&region_id=${regionId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.districts) {
        setDistricts(data.districts);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Fetch circuits based on district
  const fetchCircuits = async (districtId = '') => {
    try {
      let url = '/api/circuits?limit=100';
      if (districtId) {
        url += `&district_id=${districtId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.circuits) {
        setCircuits(data.circuits);
      }
    } catch (error) {
      console.error('Error fetching circuits:', error);
    }
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setPagination({ ...pagination, limit: parseInt(event.target.value, 10), page: 0 });
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchTerm(query);
    setPagination({ ...pagination, page: 0 });
  };

  // Show form for adding new school
  const handleAddClick = () => {
    setCurrentSchool({ 
      name: '', 
      code: '', 
      circuit_id: '', 
      type: '',
      address: '',
      contact: ''
    });
    setFormMode('add');
    setFormOpen(true);
  };

  // Show form for editing school
  const handleEditClick = (school) => {
    setCurrentSchool({ ...school });
    setFormMode('edit');
    setFormOpen(true);
    
    // Ensure we have the right circuits loaded for this school
    if (school.district_id) {
      fetchCircuits(school.district_id);
    }
  };

  // Show confirmation for deleting school
  const handleDeleteClick = (ids) => {
    setSchoolToDelete(ids[0]); // Currently handling single delete
    setConfirmDeleteOpen(true);
  };

  // Handle form submission (add or edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (formMode === 'add') {
        // Create new school
        response = await fetch('/api/schools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentSchool.name,
            code: currentSchool.code,
            circuit_id: currentSchool.circuit_id,
            type: currentSchool.type,
            address: currentSchool.address,
            contact: currentSchool.contact
          }),
        });
      } else {
        // Update existing school
        response = await fetch('/api/schools', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentSchool.id,
            name: currentSchool.name,
            code: currentSchool.code,
            circuit_id: currentSchool.circuit_id,
            type: currentSchool.type,
            address: currentSchool.address,
            contact: currentSchool.contact
          }),
        });
      }

      const data = await response.json();
      
      if (response.ok) {
        showAlert(
          formMode === 'add' ? 'School added successfully!' : 'School updated successfully!',
          'success'
        );
        setFormOpen(false);
        fetchSchools(); // Refresh the schools list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error saving school:', error);
      showAlert('Failed to save school', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle school deletion
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/schools?id=${schoolToDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('School deleted successfully!', 'success');
        fetchSchools(); // Refresh the schools list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      showAlert('Failed to delete school', 'error');
    } finally {
      setConfirmDeleteOpen(false);
      setSchoolToDelete(null);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSchool({ ...currentSchool, [name]: value });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'region_id') {
      setFilters({ region_id: value, district_id: '', circuit_id: '' });
      if (value) {
        fetchDistricts(value);
        setCircuits([]);
      }
    } else if (name === 'district_id') {
      setFilters(prev => ({ ...prev, district_id: value, circuit_id: '' }));
      if (value) {
        fetchCircuits(value);
      } else if (filters.region_id) {
        fetchDistricts(filters.region_id);
      }
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    
    setPagination({ ...pagination, page: 0 });
  };

  // Apply filters
  useEffect(() => {
    fetchSchools();
  }, [filters, searchTerm, fetchSchools]);

  // Display alert notification
  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  // Close alert
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 2, pb: 2 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/dashboard/admin">
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          
          <Typography color="text.primary">School Management</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          School Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add, edit, and manage schools across circuits, districts, and regions
        </Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Filter by Region</InputLabel>
              <Select
                name="region_id"
                value={filters.region_id}
                onChange={handleFilterChange}
                label="Filter by Region"
              >
                <MenuItem value="">
                  <em>All Regions</em>
                </MenuItem>
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 240 }} disabled={!filters.region_id}>
              <InputLabel>Filter by District</InputLabel>
              <Select
                name="district_id"
                value={filters.district_id}
                onChange={handleFilterChange}
                label="Filter by District"
              >
                <MenuItem value="">
                  <em>All Districts</em>
                </MenuItem>
                {districts.map((district) => (
                  <MenuItem key={district.id} value={district.id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 240 }} disabled={!filters.district_id}>
              <InputLabel>Filter by Circuit</InputLabel>
              <Select
                name="circuit_id"
                value={filters.circuit_id}
                onChange={handleFilterChange}
                label="Filter by Circuit"
              >
                <MenuItem value="">
                  <em>All Circuits</em>
                </MenuItem>
                {circuits.map((circuit) => (
                  <MenuItem key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Schools"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(e.target.value); }}
              sx={{ minWidth: 240 }}
              placeholder="Type to search by name..."
            />
          </Grid>
        </Grid>
      </Box>

      {/* Schools Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>GES Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Circuit</TableCell>
                  <TableCell>District</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schools
                  .map((school) => (
                    <TableRow hover key={school.id} onClick={() => router.push(`/dashboard/admin/schools/${school.id}`)} style={{ cursor: 'pointer' }}>
                      <TableCell>{school.name}</TableCell>
                      <TableCell>{school.gesCode}</TableCell>
                      <TableCell>{school.type}</TableCell>
                      <TableCell>{school.circuit.name}</TableCell>
                      <TableCell>{school.district.name}</TableCell>
                      <TableCell>{school.region.name}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={e => { e.stopPropagation(); handleEditClick(school); }} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={e => { e.stopPropagation(); handleDeleteClick([school.id]); }} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {schools.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" sx={{ py: 3 }}>
                        No schools found. Click the "Add School" button to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.limit}
            page={pagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {/* Add/Edit School Form */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'add' ? 'Add New School' : 'Edit School'}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="name"
              label="School Name"
              value={currentSchool?.name || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="code"
              label="School Code"
              value={currentSchool?.code || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>School Type</InputLabel>
              <Select
                name="type"
                value={currentSchool?.type || ''}
                onChange={handleInputChange}
                label="School Type"
              >
                {schoolTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {formMode === 'add' && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="region_id"
                    value={currentSchool?.region_id || ''}
                    onChange={(e) => {
                      handleInputChange(e);
                      fetchDistricts(e.target.value);
                      setCurrentSchool(prev => ({
                        ...prev,
                        district_id: '',
                        circuit_id: ''
                      }));
                    }}
                    label="Region"
                  >
                    <MenuItem value="">
                      <em>Select Region</em>
                    </MenuItem>
                    {regions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl 
                  fullWidth 
                  margin="normal"
                  disabled={!currentSchool?.region_id}
                >
                  <InputLabel>District</InputLabel>
                  <Select
                    name="district_id"
                    value={currentSchool?.district_id || ''}
                    onChange={(e) => {
                      handleInputChange(e);
                      fetchCircuits(e.target.value);
                      setCurrentSchool(prev => ({
                        ...prev,
                        circuit_id: ''
                      }));
                    }}
                    label="District"
                  >
                    <MenuItem value="">
                      <em>Select District</em>
                    </MenuItem>
                    {districts.map((district) => (
                      <MenuItem key={district.id} value={district.id}>
                        {district.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          
          <Grid size={{ xs: 12 }}>
            <FormControl 
              fullWidth 
              margin="normal" 
              required
              disabled={formMode === 'add' && !currentSchool?.district_id}
            >
              <InputLabel>Circuit</InputLabel>
              <Select
                name="circuit_id"
                value={currentSchool?.circuit_id || ''}
                onChange={handleInputChange}
                label="Circuit"
              >
                {circuits.map((circuit) => (
                  <MenuItem key={circuit.id} value={circuit.id}>
                    {circuit.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="address"
              label="School Address"
              value={currentSchool?.address || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="contact"
              label="Contact Information"
              value={currentSchool?.contact || ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              placeholder="Phone numbers, email addresses, etc."
            />
          </Grid>
        </Grid>
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <FormDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Confirm Delete"
        onSubmit={handleDeleteConfirm}
        submitLabel="Delete"
        maxWidth="xs"
      >
        <Typography>
          Are you sure you want to delete this school? This action cannot be undone.
        </Typography>
      </FormDialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alert.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}