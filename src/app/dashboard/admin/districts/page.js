"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Breadcrumbs,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FormDialog from '@/components/FormDialog';
import { useRouter } from 'next/navigation';

// Districts Page Component
export default function Districts() {
  const router = useRouter();
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(true);
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
  const [regionFilter, setRegionFilter] = useState('');

  // Fetch districts from API - wrapped in useCallback to avoid dependency issues
  const fetchDistricts = useCallback(async () => {
    setLoadingDistricts(true);
    try {
      let url = `/api/districts?page=${pagination.page}&limit=${pagination.limit}`;
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      if (regionFilter) {
        url += `&region_id=${regionFilter}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
            if (data.districts) {
        setDistricts(data.districts);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      showAlert('Failed to fetch districts', 'error');
    } finally {
      setLoadingDistricts(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, regionFilter]);

  // Fetch regions only once on mount
  useEffect(() => {
    fetchRegions();
  }, []);

  // Fetch districts when pagination or filters change
  useEffect(() => {
    const fetchData = async () => {
      await fetchDistricts();
    };
    fetchData();
    // We only want to run this effect when pagination.page or pagination.limit changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // Handle filter changes separately to avoid unnecessary API calls
  useEffect(() => {
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 0
    }));
    
    const timer = setTimeout(() => {
      fetchDistricts();
    }, 300); // Small debounce for search
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, regionFilter]);

  // Fetch regions for district form
  const fetchRegions = async () => {
    setLoadingRegions(true);
    try {
      const response = await fetch('/api/regions?limit=20');
      const data = await response.json();
      
      if (data.regions) {
        setRegions(data.regions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 0 // Reset to first page when changing rows per page
    }));
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchTerm(query);
    setPagination(prev => ({
      ...prev,
      page: 0 // Reset to first page when searching
    }));
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
      <Box sx={{ pt: 1, pb: 1 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard');
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Districts
          </Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>
          District Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add, edit, and manage districts across regions
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Filter by Region</InputLabel>
              <Select
                value={regionFilter}
                label="Filter by Region"
                onChange={e => {
                  setRegionFilter(e.target.value);
                  setPagination(prev => ({
                    ...prev,
                    page: 0
                  }));
                }}
              >
                <MenuItem value="">
                  <em>All Regions</em>
                </MenuItem>
                {regions.map(region => (
                  <MenuItem key={region.id} value={region.id}>{region.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Districts"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(e.target.value); }}
              sx={{ minWidth: 240 }}
              placeholder="Type to search by name..."
            />
          </Grid>
        </Grid>
      </Box>

      {/* Districts Table */}
      {(loadingDistricts || loadingRegions) ? (
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
                  <TableCell>Region</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {districts.map((district) => (
                  <TableRow 
                    hover 
                    key={district.id}
                    onClick={() => router.push(`/dashboard/admin/districts/${district.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>{district.name}</TableCell>
                    <TableCell>{district.region_name}</TableCell>
                    <TableCell>{district.description}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={e => { e.stopPropagation(); handleEditClick(district); }} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={e => { e.stopPropagation(); handleDeleteClick([district.id]); }} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {districts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body1" sx={{ py: 3 }}>
                        No districts found. Click the "Add District" button to create one.
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

      {/* Add/Edit District Form */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'add' ? 'Add New District' : 'Edit District'}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
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
          <Grid size={{ xs: 12 }}>
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
          <Grid size={{ xs: 12 }}>
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