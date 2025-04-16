"use client";

import React, { useState, useEffect } from 'react';
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
  Snackbar
} from '@mui/material';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';

// Circuits Page Component
export default function Circuits() {
  const [circuits, setCircuits] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCircuit, setCurrentCircuit] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [circuitToDelete, setCircuitToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    region_id: '',
    district_id: ''
  });

  // Table columns
  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Name' },
    { id: 'code', label: 'Code' },
    { id: 'district_name', label: 'District' },
    { id: 'region_name', label: 'Region' },
    { 
      id: 'created_at', 
      label: 'Created Date',
      format: (value) => new Date(value).toLocaleString()
    },
  ];

  // Fetch circuits on mount and pagination change
  useEffect(() => {
    fetchCircuits();
    fetchRegions();
    fetchDistricts();
  }, [pagination.page, pagination.limit]);

  // Fetch circuits from API
  const fetchCircuits = async () => {
    setLoading(true);
    try {
      let url = `/api/circuits?page=${pagination.page + 1}&limit=${pagination.limit}`;
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      if (filters.district_id) {
        url += `&district_id=${filters.district_id}`;
      } else if (filters.region_id) {
        url += `&region_id=${filters.region_id}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.circuits) {
        setCircuits(data.circuits);
        setPagination({
          page: data.pagination.page - 1,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching circuits:', error);
      showAlert('Failed to fetch circuits', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions for filters and circuit form
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

  // Fetch districts for circuit form
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
    fetchCircuits();
  };

  // Show form for adding new circuit
  const handleAddClick = () => {
    setCurrentCircuit({ name: '', code: '', district_id: '' });
    setFormMode('add');
    setFormOpen(true);
  };

  // Show form for editing circuit
  const handleEditClick = (circuit) => {
    setCurrentCircuit({ ...circuit });
    setFormMode('edit');
    setFormOpen(true);
    
    // Ensure we have the right districts loaded for this circuit's region
    if (circuit.region_id) {
      fetchDistricts(circuit.region_id);
    }
  };

  // Show confirmation for deleting circuit
  const handleDeleteClick = (ids) => {
    setCircuitToDelete(ids[0]); // Currently handling single delete
    setConfirmDeleteOpen(true);
  };

  // Handle form submission (add or edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (formMode === 'add') {
        // Create new circuit
        response = await fetch('/api/circuits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentCircuit.name,
            code: currentCircuit.code,
            district_id: currentCircuit.district_id
          }),
        });
      } else {
        // Update existing circuit
        response = await fetch('/api/circuits', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentCircuit.id,
            name: currentCircuit.name,
            code: currentCircuit.code,
            district_id: currentCircuit.district_id
          }),
        });
      }

      const data = await response.json();
      
      if (response.ok) {
        showAlert(
          formMode === 'add' ? 'Circuit added successfully!' : 'Circuit updated successfully!',
          'success'
        );
        setFormOpen(false);
        fetchCircuits(); // Refresh the circuits list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error saving circuit:', error);
      showAlert('Failed to save circuit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle circuit deletion
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/circuits?id=${circuitToDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('Circuit deleted successfully!', 'success');
        fetchCircuits(); // Refresh the circuits list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error deleting circuit:', error);
      showAlert('Failed to delete circuit', 'error');
    } finally {
      setConfirmDeleteOpen(false);
      setCircuitToDelete(null);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCircuit({ ...currentCircuit, [name]: value });
    
    // If region selection changes in form, update districts
    if (name === 'region_id') {
      // Find the district_id for the selected circuit in the form
      fetchDistricts(value);
      setCurrentCircuit(prev => ({ ...prev, district_id: '' })); // Reset district selection
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'region_id') {
      setFilters({ region_id: value, district_id: '' });
      if (value) {
        fetchDistricts(value);
      } else {
        fetchDistricts();
      }
    } else {
      setFilters({ ...filters, [name]: value });
    }
    
    setPagination({ ...pagination, page: 0 });
    // Fetch will happen in useEffect
  };

  // Apply filters
  useEffect(() => {
    fetchCircuits();
  }, [filters]);

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
      <Box sx={{ pt: 4, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Circuit Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add, edit, and manage circuits across districts
        </Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.region_id}>
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
        </Grid>
      </Box>

      {/* Circuits Table */}
      <DataTable
        title="Circuits"
        columns={columns}
        data={circuits}
        isLoading={loading}
        totalCount={pagination.total}
        page={pagination.page}
        rowsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearch={handleSearch}
        onRefresh={fetchCircuits}
        onAdd={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        searchPlaceholder="Search circuits..."
      />

      {/* Add/Edit Circuit Form */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'add' ? 'Add New Circuit' : 'Edit Circuit'}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Circuit Name"
              value={currentCircuit?.name || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="code"
              label="Circuit Code"
              value={currentCircuit?.code || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          
          {formMode === 'add' && (
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Region</InputLabel>
                <Select
                  name="region_id"
                  value={currentCircuit?.region_id || ''}
                  onChange={handleInputChange}
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
          )}
          
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>District</InputLabel>
              <Select
                name="district_id"
                value={currentCircuit?.district_id || ''}
                onChange={handleInputChange}
                label="District"
                disabled={formMode === 'add' && !currentCircuit?.region_id}
              >
                {districts.map((district) => (
                  <MenuItem key={district.id} value={district.id}>
                    {district.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          Are you sure you want to delete this circuit? This action cannot be undone.
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