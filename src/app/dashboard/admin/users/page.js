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
  Snackbar,
  Chip,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';

// Users Page Component
export default function Users() {
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    region_id: '',
    district_id: '',
    circuit_id: '',
    school_id: ''
  });
  const [resetPassword, setResetPassword] = useState(false);

  // User types
  const userTypes = [
    { value: 'admin', label: 'Admin' },
    { value: 'circuit_supervisor', label: 'Circuit Supervisor' },
    { value: 'head_facilitator', label: 'Head Facilitator' },
    { value: 'facilitator', label: 'Facilitator' }
  ];

  // Table columns
  const columns = [
    { id: 'id', label: 'ID' },
    { 
      id: 'full_name', 
      label: 'Name',
      format: (value, row) => {
        const names = [row.first_name, row.last_name];
        if (row.other_names) names.splice(1, 0, row.other_names);
        return names.join(' ');
      }
    },
    { id: 'email', label: 'Email' },
    { id: 'phone_number', label: 'Phone' },
    { 
      id: 'type', 
      label: 'Role',
      format: (value) => {
        const type = userTypes.find(t => t.value === value);
        return type ? type.label : value;
      }
    },
    { 
      id: 'scope_name', 
      label: 'Scope',
      format: (value, row) => {
        if (row.type === 'facilitator' && row.schools) {
          return `${row.schools.length} Schools`;
        }
        return value || 'N/A';
      }
    },
    { 
      id: 'created_at', 
      label: 'Created Date',
      format: (value) => new Date(value).toLocaleString()
    },
  ];

  // Fetch users on mount and pagination change
  useEffect(() => {
    fetchUsers();
    fetchRegions();
  }, [pagination.page, pagination.limit]);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/users?page=${pagination.page + 1}&limit=${pagination.limit}`;
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      if (filters.type) {
        url += `&type=${filters.type}`;
      }
      
      if (filters.school_id) {
        url += `&school_id=${filters.school_id}`;
      } else if (filters.circuit_id) {
        url += `&circuit_id=${filters.circuit_id}`;
      } else if (filters.district_id) {
        url += `&district_id=${filters.district_id}`;
      } else if (filters.region_id) {
        url += `&region_id=${filters.region_id}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
        setPagination({
          page: data.pagination.page - 1,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions
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

  // Fetch schools based on circuit
  const fetchSchools = async (circuitId = '') => {
    try {
      let url = '/api/schools?limit=100';
      if (circuitId) {
        url += `&circuit_id=${circuitId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.schools) {
        setSchools(data.schools);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
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
    fetchUsers();
  };

  // Show form for adding new user
  const handleAddClick = () => {
    setCurrentUser({ 
      type: '',
      first_name: '',
      last_name: '',
      other_names: '',
      email: '',
      phone_number: '',
      gender: '',
      scope_id: '',
      schools: []
    });
    setSelectedSchools([]);
    setFormMode('add');
    setResetPassword(false);
    setFormOpen(true);
  };

  // Show form for editing user
  const handleEditClick = (user) => {
    setCurrentUser({ ...user });
    setFormMode('edit');
    setResetPassword(false);
    setFormOpen(true);
    
    // For facilitators, prepare the selected schools array
    if (user.type === 'facilitator' && user.schools) {
      setSelectedSchools(user.schools);
    } else {
      setSelectedSchools([]);
    }
    
    // Load appropriate hierarchical data based on user type
    if (user.type === 'admin' && user.scope_id) {
      // For admin, fetch nothing else
    } else if (user.type === 'circuit_supervisor' && user.scope_id) {
      // For circuit supervisor, fetch districts for the specific region
      fetchDistricts();
    } else if (user.type === 'head_facilitator' && user.scope_id) {
      // For head facilitator, fetch all the way down to schools
      fetchSchools();
    } else if (user.type === 'facilitator' && user.schools && user.schools.length > 0) {
      // For facilitator, fetch schools
      fetchSchools();
    }
  };

  // Show confirmation for deleting user
  const handleDeleteClick = (ids) => {
    setUserToDelete(ids[0]); // Currently handling single delete
    setConfirmDeleteOpen(true);
  };

  // Handle form submission (add or edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let response;
      let userData = {
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        other_names: currentUser.other_names || null,
        email: currentUser.email,
        phone_number: currentUser.phone_number,
        gender: currentUser.gender || null,
      };
      
      if (currentUser.type !== 'facilitator') {
        userData.scope_id = currentUser.scope_id;
      } else {
        userData.schools = selectedSchools.map(school => school.id);
      }
      
      if (formMode === 'add') {
        // Create new user
        userData.type = currentUser.type;
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      } else {
        // Update existing user
        userData.id = currentUser.id;
        if (resetPassword) {
          userData.reset_password = true;
        }
        
        response = await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      }

      const data = await response.json();
      
      if (response.ok) {
        showAlert(
          formMode === 'add' ? 'User added successfully!' : 'User updated successfully!',
          'success'
        );
        setFormOpen(false);
        fetchUsers(); // Refresh the users list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showAlert('Failed to save user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user deletion
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/users?id=${userToDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showAlert('User deleted successfully!', 'success');
        fetchUsers(); // Refresh the users list
      } else {
        showAlert(data.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Failed to delete user', 'error');
    } finally {
      setConfirmDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser({ ...currentUser, [name]: value });
    
    // Handle cascading selects based on user type
    if (name === 'type') {
      setCurrentUser(prev => ({ 
        ...prev, 
        [name]: value,
        scope_id: '' // Reset scope when type changes
      }));
      setSelectedSchools([]); // Reset selected schools
      
      // Reset all hierarchical data
      setDistricts([]);
      setCircuits([]);
      setSchools([]);
      
      // Load the appropriate data based on user type
      if (value === 'admin') {
        // For admin, just fetch regions
        fetchRegions();
      } else if (value === 'circuit_supervisor') {
        // For circuit supervisor, fetch districts
        fetchRegions();
      } else if (value === 'head_facilitator') {
        // For head facilitator, fetch regions to start the hierarchy
        fetchRegions();
      } else if (value === 'facilitator') {
        // For facilitator, fetch regions to start the hierarchy
        fetchRegions();
      }
    }
    
    // Handle region selection
    if (name === 'region_id') {
      if (value) {
        fetchDistricts(value);
      } else {
        setDistricts([]);
      }
      setCircuits([]);
      setSchools([]);
    }
    
    // Handle district selection
    if (name === 'district_id') {
      if (value) {
        fetchCircuits(value);
      } else {
        setCircuits([]);
      }
      setSchools([]);
    }
    
    // Handle circuit selection
    if (name === 'circuit_id') {
      if (value) {
        fetchSchools(value);
      } else {
        setSchools([]);
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      setFilters({ type: value, region_id: '', district_id: '', circuit_id: '', school_id: '' });
      
      // Reset hierarchical dropdowns
      setDistricts([]);
      setCircuits([]);
      setSchools([]);
    } else if (name === 'region_id') {
      setFilters(prev => ({ ...prev, region_id: value, district_id: '', circuit_id: '', school_id: '' }));
      
      if (value) {
        fetchDistricts(value);
      } else {
        setDistricts([]);
      }
      setCircuits([]);
      setSchools([]);
    } else if (name === 'district_id') {
      setFilters(prev => ({ ...prev, district_id: value, circuit_id: '', school_id: '' }));
      
      if (value) {
        fetchCircuits(value);
      } else {
        setCircuits([]);
      }
      setSchools([]);
    } else if (name === 'circuit_id') {
      setFilters(prev => ({ ...prev, circuit_id: value, school_id: '' }));
      
      if (value) {
        fetchSchools(value);
      } else {
        setSchools([]);
      }
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    
    setPagination({ ...pagination, page: 0 });
  };

  // Add school to selected schools
  const handleAddSchool = (schoolId) => {
    const selectedSchool = schools.find(school => school.id === schoolId);
    if (!selectedSchool) return;
    
    // Check if already selected
    if (selectedSchools.some(school => school.id === schoolId)) {
      return; // Already selected
    }
    
    setSelectedSchools(prev => [...prev, selectedSchool]);
  };

  // Remove school from selected schools
  const handleRemoveSchool = (schoolId) => {
    setSelectedSchools(prev => prev.filter(school => school.id !== schoolId));
  };

  // Apply filters
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  // Display alert notification
  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
  };

  // Close alert
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Get appropriate scope label based on user type
  const getScopeLabel = (type) => {
    switch(type) {
      case 'admin':
        return 'Region';
      case 'circuit_supervisor':
        return 'District';
      case 'head_facilitator':
        return 'School';
      default:
        return 'Scope';
    }
  };

  // Get appropriate scope options based on user type
  const getScopeOptions = (type) => {
    switch(type) {
      case 'admin':
        return regions;
      case 'circuit_supervisor':
        return districts;
      case 'head_facilitator':
        return schools;
      default:
        return [];
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 4, pb: 2 }}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add, edit, and manage users across the system
        </Typography>
        
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Role</InputLabel>
              <Select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                label="Filter by Role"
              >
                <MenuItem value="">
                  <em>All Roles</em>
                </MenuItem>
                {userTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.district_id}>
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" disabled={!filters.circuit_id}>
              <InputLabel>Filter by School</InputLabel>
              <Select
                name="school_id"
                value={filters.school_id}
                onChange={handleFilterChange}
                label="Filter by School"
              >
                <MenuItem value="">
                  <em>All Schools</em>
                </MenuItem>
                {schools.map((school) => (
                  <MenuItem key={school.id} value={school.id}>
                    {school.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Users Table */}
      <DataTable
        title="Users"
        columns={columns}
        data={users}
        isLoading={loading}
        totalCount={pagination.total}
        page={pagination.page}
        rowsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearch={handleSearch}
        onRefresh={fetchUsers}
        onAdd={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        searchPlaceholder="Search users..."
      />

      {/* Add/Edit User Form */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'add' ? 'Add New User' : 'Edit User'}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      >
        <Grid container spacing={2}>
          {formMode === 'add' && (
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>User Role</InputLabel>
                <Select
                  name="type"
                  value={currentUser?.type || ''}
                  onChange={handleInputChange}
                  label="User Role"
                >
                  {userTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          <Grid item xs={12} md={6}>
            <TextField
              name="first_name"
              label="First Name"
              value={currentUser?.first_name || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="last_name"
              label="Last Name"
              value={currentUser?.last_name || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="other_names"
              label="Other Names"
              value={currentUser?.other_names || ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="email"
              label="Email Address"
              value={currentUser?.email || ''}
              onChange={handleInputChange}
              type="email"
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="phone_number"
              label="Phone Number"
              value={currentUser?.phone_number || ''}
              onChange={handleInputChange}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                name="gender"
                value={currentUser?.gender || ''}
                onChange={handleInputChange}
              >
                <FormControlLabel value="male" control={<Radio />} label="Male" />
                <FormControlLabel value="female" control={<Radio />} label="Female" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {currentUser?.type && currentUser.type !== 'facilitator' && (
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>{getScopeLabel(currentUser.type)}</InputLabel>
                <Select
                  name="scope_id"
                  value={currentUser?.scope_id || ''}
                  onChange={handleInputChange}
                  label={getScopeLabel(currentUser.type)}
                >
                  {getScopeOptions(currentUser.type).map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {currentUser?.type === 'facilitator' && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Assign Schools to Facilitator
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Schools
                      </Typography>
                      <FormControl fullWidth size="small" margin="normal">
                        <InputLabel>Select Region</InputLabel>
                        <Select
                          name="region_id"
                          value={currentUser?.region_id || ''}
                          onChange={handleInputChange}
                          label="Select Region"
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
                      
                      <FormControl fullWidth size="small" margin="normal" disabled={!currentUser?.region_id}>
                        <InputLabel>Select District</InputLabel>
                        <Select
                          name="district_id"
                          value={currentUser?.district_id || ''}
                          onChange={handleInputChange}
                          label="Select District"
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
                      
                      <FormControl fullWidth size="small" margin="normal" disabled={!currentUser?.district_id}>
                        <InputLabel>Select Circuit</InputLabel>
                        <Select
                          name="circuit_id"
                          value={currentUser?.circuit_id || ''}
                          onChange={handleInputChange}
                          label="Select Circuit"
                        >
                          <MenuItem value="">
                            <em>Select Circuit</em>
                          </MenuItem>
                          {circuits.map((circuit) => (
                            <MenuItem key={circuit.id} value={circuit.id}>
                              {circuit.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      {currentUser?.circuit_id && schools.length > 0 && (
                        <FormControl fullWidth size="small" margin="normal">
                          <InputLabel>Add School</InputLabel>
                          <Select
                            value=""
                            onChange={(e) => handleAddSchool(e.target.value)}
                            label="Add School"
                          >
                            <MenuItem value="">
                              <em>Select School</em>
                            </MenuItem>
                            {schools
                              .filter(school => !selectedSchools.some(s => s.id === school.id))
                              .map((school) => (
                                <MenuItem key={school.id} value={school.id}>
                                  {school.name}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      )}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Schools
                      </Typography>
                      {selectedSchools.length === 0 ? (
                        <Typography color="text.secondary" sx={{ my: 2 }}>
                          No schools selected yet. Please select schools from the left panel.
                        </Typography>
                      ) : (
                        <List dense>
                          {selectedSchools.map((school) => (
                            <ListItem key={school.id} disablePadding>
                              <ListItemText primary={school.name} />
                              <ListItemSecondaryAction>
                                <IconButton edge="end" onClick={() => handleRemoveSchool(school.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              {formMode === 'add' && selectedSchools.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    At least one school must be assigned to a facilitator.
                  </Alert>
                </Grid>
              )}
            </>
          )}
          
          {formMode === 'edit' && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={resetPassword} 
                    onChange={(e) => setResetPassword(e.target.checked)} 
                    color="primary" 
                  />
                }
                label="Reset password and send credentials to user"
              />
            </Grid>
          )}
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
          Are you sure you want to delete this user? This action cannot be undone.
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