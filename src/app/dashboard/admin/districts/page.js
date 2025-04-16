"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  CircularProgress
} from '@mui/material';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';

// Districts Page Component
export default function Districts() {
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [districtToDelete, setDistrictToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Table columns
  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Name' },
    { id: 'code', label: 'Code' },
    { id: 'region_name', label: 'Region' },
    { 
      id: 'created_at', 
      label: 'Created Date',
      format: (value) => new Date(value).toLocaleString()
    },
  ];

  // Fetch districts on mount and pagination change
  useEffect(() => {
    fetchDistricts();
    fetchRegions();
  }, [pagination.page, pagination.limit]);

  // Fetch districts from API
  const fetchDistricts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/districts?page=${pagination.page + 1}&limit=${pagination.limit}${searchTerm ? `&search=${searchTerm}` : ''}`
      );
      const data = await response.json();
      
      if (data.districts) {
        setDistricts(data.districts);
        setPagination({
          page: data.pagination.page - 1,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      showAlert('Failed to fetch districts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions for district form
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
    fetchDistricts();
  };

  // Show form for adding new district
  const handleAddClick = () => {
    setCurrentDistrict({ name: '', code: '', region_id: '' });
    setFormMode('add');
    setFormOpen(true);
  };

  // Show form for editing district
  const handleEditClick = (district) => {
    setCurrentDistrict({ ...district });
    setFormMode('edit');
    setFormOpen(true);
  };

  // Show confirmation for deleting district
  const handleDeleteClick = (ids) => {
    setDistrictToDelete(ids[0]); // Currently handling single delete
    setConfirmDeleteOpen(true);
  };

  // Handle form submission (add or edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (formMode === 'add') {
        // Create new district
        response = await fetch('/api/districts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentDistrict.name,
            code: currentDistrict.code,
            region_id: currentDistrict.region_id
          }),
        });
      } else {
        // Update existing district
        response = await fetch('/api/districts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentDistrict.id,
            name: currentDistrict.name,
            code: currentDistrict.code,
            region_id: currentDistrict.region_id
          }),
        });
      }

      const data = await response.json();
      
      if (response.ok) {
        showAlert(
          formMode === 'add' ? 'District added successfully!' : 'District updated successfully!',
          'success'
        );
        setFormOpen(false);
        fetchDistricts(); // Refresh the districts list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error saving district:', error);
      showAlert('Failed to save district', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle district deletion
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/districts?id=${districtToDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('District deleted successfully!', 'success');
        fetchDistricts(); // Refresh the districts list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error deleting district:', error);
      showAlert('Failed to delete district', 'error');
    } finally {
      setConfirmDeleteOpen(false);
      setDistrictToDelete(null);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDistrict({ ...currentDistrict, [name]: value });
  };

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
          District Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add, edit, and manage districts across regions
        </Typography>
      </Box>

      {/* Districts Table */}
      <DataTable
        title="Districts"
        columns={columns}
        data={districts}
        isLoading={loading}
        totalCount={pagination.total}
        page={pagination.page}
        rowsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearch={handleSearch}
        onRefresh={fetchDistricts}
        onAdd={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        searchPlaceholder="Search districts..."
      />

      {/* Add/Edit District Form */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'add' ? 'Add New District' : 'Edit District'}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="District Name"
              value={currentDistrict?.name || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="code"
              label="District Code"
              value={currentDistrict?.code || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Region</InputLabel>
              <Select
                name="region_id"
                value={currentDistrict?.region_id || ''}
                onChange={handleInputChange}
                label="Region"
              >
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
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
          Are you sure you want to delete this district? This action cannot be undone.
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