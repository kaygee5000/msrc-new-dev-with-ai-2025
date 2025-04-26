"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FormDialog from '@/components/FormDialog';

/**
 * Component for managing a user's program role assignments
 */
export default function ProgramRoleAssignment({ 
  userId, 
  onProgramRolesChange,
  initialProgramRoles = [],
  readOnly = false
}) {
  const [programs, setPrograms] = useState([]);
  const [userProgramRoles, setUserProgramRoles] = useState(initialProgramRoles);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]); // Add circuits state
  const [schools, setSchools] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Available roles
  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'data_collector', label: 'Data Collector' }
  ];

  // Load user program roles if userId is provided
  useEffect(() => {
    const loadUserProgramRoles = async () => {
      if (!userId) {
        setInitialLoading(false);
        return;
      }
      
      try {
        setInitialLoading(true);
        const response = await fetch(`/api/user-program-roles?userId=${userId}`);
        const data = await response.json();
        
        if (data.success && data.userProgramRoles) {
          setUserProgramRoles(data.userProgramRoles);
          
          // Notify parent component
          if (onProgramRolesChange) {
            onProgramRolesChange(data.userProgramRoles);
          }
        }
      } catch (error) {
        console.error('Error loading user program roles:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    // if (initialProgramRoles.length === 0) {
    //   loadUserProgramRoles();
    // } else {
    //   setInitialLoading(false);
    // }
  }, [userId, initialProgramRoles]);

  // Fetch available programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs');//?active=true
        
        // First check if the response is ok before attempting to parse JSON
        if (!response.ok) {
          console.error('Error fetching programs: Server returned', response.status, response.statusText);
          return;
        }
        
        // Get the text response first to debug potential JSON issues
        const text = await response.text();
        
        // Handle empty responses
        if (!text || text.trim() === '') {
          console.error('Error fetching programs: Empty response');
          return;
        }
        
        // Try to parse the JSON with error handling
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error('Error parsing programs JSON:', jsonError);
          console.error('Response text was:', text);
          return;
        }
        
        if (data.success && data.programs) {
          setPrograms(data.programs);
        } else {
          console.error('Programs API returned unexpected format:', data);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      }
    };

    fetchPrograms();
  }, []);

  // Fetch regions for scope selection
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/regions?limit=16');
        const data = await response.json();
        
        if (data.success && data.data) {
          setRegions(data.data);
        }
      } catch (error) {
        console.error('Error fetching regions:', error);
      }
    };

    fetchRegions();
  }, []);

  // Handle opening add dialog
  const handleAddRole = () => {
    setCurrentRole({
      programId: '',
      role: '',
      scopeType: '',
      scopeId: ''
    });
    setDialogMode('add');
    setDialogOpen(true);
  };

  // Handle opening edit dialog
  const handleEditRole = (role) => {
    setCurrentRole({
      id: role.id,
      programId: role.program_id,
      role: role.role,
      scopeType: role.scope_type || '',
      scopeId: role.scope_id || ''
    });
    setDialogMode('edit');
    setDialogOpen(true);
    
    // Load hierarchical data if needed
    if (role.scope_type === 'regional_admin' && role.scope_id) {
      // Already have regions
    } else if (role.scope_type === 'district_admin' && role.scope_id) {
      // Need to find which region this district belongs to
      fetchDistrictRegion(role.scope_id);
    } else if (role.scope_type === 'circuit_supervisor' && role.scope_id) {
      // Need to find district and region for this school
      fetchSchoolHierarchy(role.scope_id);
    }
  };
  
  // Fetch the region for a district
  const fetchDistrictRegion = async (districtId) => {
    try {
      const response = await fetch(`/api/districts?id=${districtId}`);
      const data = await response.json();
      
      if (data.districts && data.districts.length > 0) {
        const district = data.districts[0];
        
        // Set current role region
        setCurrentRole(prev => ({
          ...prev,
          regionId: district.region_id
        }));
        
        // Fetch districts for this region
        fetchDistricts(district.region_id);
      }
    } catch (error) {
      console.error('Error fetching district region:', error);
    }
  };
  
  // Fetch the district and region for a school
  const fetchSchoolHierarchy = async (schoolId) => {
    try {
      const response = await fetch(`/api/schools?id=${schoolId}`);
      const data = await response.json();
      
      if (data.schools && data.schools.length > 0) {
        const school = data.schools[0];
        
        // Set current role district
        setCurrentRole(prev => ({
          ...prev,
          districtId: school.district_id
        }));
        
        // Fetch district info to get region
        const districtResponse = await fetch(`/api/districts?id=${school.district_id}`);
        const districtData = await districtResponse.json();
        
        if (districtData.districts && districtData.districts.length > 0) {
          const district = districtData.districts[0];
          
          // Set current role region
          setCurrentRole(prev => ({
            ...prev,
            regionId: district.region_id
          }));
          
          // Fetch districts for this region
          fetchDistricts(district.region_id);
          
          // Fetch schools for this district
          fetchSchools(school.district_id);
        }
      }
    } catch (error) {
      console.error('Error fetching school hierarchy:', error);
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to remove this program role?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/user-program-roles?id=${roleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        const updatedRoles = userProgramRoles.filter(role => role.id !== roleId);
        setUserProgramRoles(updatedRoles);
        
        // Notify parent component
        if (onProgramRolesChange) {
          onProgramRolesChange(updatedRoles);
        }
      }
    } catch (error) {
      console.error('Error deleting program role:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRole(prev => ({ ...prev, [name]: value }));
    
    // Fetch districts when region is selected
    if (name === 'regionId' && value) {
      fetchDistricts(value);
    } else if (name === 'regionId') {
      setDistricts([]);
      setSchools([]);
    }
    
    // Fetch schools when district is selected
    if (name === 'districtId' && value) {
      fetchSchools(value);
    } else if (name === 'districtId') {
      setSchools([]);
    }
    
    // Reset scopeId when scopeType changes
    if (name === 'scopeType') {
      setCurrentRole(prev => ({ ...prev, scopeId: '' }));
    }
  };

  // Fetch districts based on region
  const fetchDistricts = async (regionId) => {
    try {
      const response = await fetch(`/api/districts?region_id=${regionId}&limit=100`);
      const data = await response.json();
      
      if (data.districts) {
        setDistricts(data.districts);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Fetch schools based on district
  const fetchSchools = async (districtId) => {
    try {
      const response = await fetch(`/api/schools?district_id=${districtId}&limit=100`);
      const data = await response.json();
      
      if (data.schools) {
        setSchools(data.schools);
      }
      
      // Also fetch circuits for this district
      const circuitsResponse = await fetch(`/api/circuits?district_id=${districtId}&limit=100`);
      const circuitsData = await circuitsResponse.json();
      
      if (circuitsData.circuits) {
        setCircuits(circuitsData.circuits);
      }
    } catch (error) {
      console.error('Error fetching schools and circuits:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Please save the user first before assigning program roles');
      setDialogOpen(false);
      return;
    }
    
    if (!currentRole.programId || !currentRole.role) {
      alert('Please select a program and role');
      return;
    }
    
    try {
      setLoading(true);
      
      let scopeId = null;
      let scopeType = null;
      
      // Determine scope based on selection
      if (currentRole.scopeType === 'region' && currentRole.regionId) {
        scopeId = currentRole.regionId;
        scopeType = 'region';
      } else if (currentRole.scopeType === 'district' && currentRole.districtId) {
        scopeId = currentRole.districtId;
        scopeType = 'district';
      } else if (currentRole.scopeType === 'circuit' && currentRole.circuitId) {
        scopeId = currentRole.circuitId;
        scopeType = 'circuit';
      } else if (currentRole.scopeType === 'school' && currentRole.schoolId) {
        scopeId = currentRole.schoolId;
        scopeType = 'school';
      } else if (currentRole.scopeType === 'national') {
        scopeType = 'national';
      }
      
      console.log('Submitting role with scope:', { scopeType, scopeId });
      
      const roleData = {
        userId,
        programId: currentRole.programId,
        role: currentRole.role,
        scopeType,
        scopeId
      };
      
      let response;
      
      if (dialogMode === 'add') {
        response = await fetch('/api/user-program-roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(roleData)
        });
      } else {
        response = await fetch('/api/user-program-roles', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: currentRole.id,
            role: currentRole.role,
            scopeType,
            scopeId
          })
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        let updatedRoles;
        
        if (dialogMode === 'add') {
          updatedRoles = [...userProgramRoles, data.userProgramRole];
        } else {
          updatedRoles = userProgramRoles.map(role => 
            role.id === currentRole.id ? data.userProgramRole : role
          );
        }
        
        setUserProgramRoles(updatedRoles);
        
        // Notify parent component
        if (onProgramRolesChange) {
          onProgramRolesChange(updatedRoles);
        }
        
        // Close dialog
        setDialogOpen(false);
      } else {
        console.error('API Error:', data);
        alert(data.error || 'Failed to save program role');
      }
    } catch (error) {
      console.error('Error saving program role:', error);
      alert('An error occurred while saving the program role');
    } finally {
      setLoading(false);
    }
  };

  // Get scope options based on scopeType
  const getScopeOptions = () => {
    const scopeType = currentRole?.scopeType;
    
    switch(scopeType) {
      case 'region':
        return regions.map(region => ({ id: region.id, name: region.name }));
      case 'district':
        return districts.map(district => ({ id: district.id, name: district.name }));
      case 'school':
        return schools.map(school => ({ id: school.id, name: school.name }));
      default:
        return [];
    }
  };

  // Helper to get program name by ID
  const getProgramName = (programId) => {
    const program = programs.find(p => p.id === programId);
    return program ? program.name : programId;
  };

  // Determine appropriate scope types for the selected role
  const getScopeTypes = () => {
    const role = currentRole?.role;
    
    if (role === 'admin') {
      return [
        { value: 'region', label: 'Region' },
        { value: 'district', label: 'District' },
        { value: 'circuit', label: 'Circuit' }
      ];
    }
    
    if (role === 'data_collector') {
      return [
        { value: 'district', label: 'District' },
        { value: 'circuit', label: 'Circuit' },
        { value: 'school', label: 'School' }
      ];
    }
    
    return [
      { value: 'region', label: 'Region' },
      { value: 'district', label: 'District' },
      { value: 'circuit', label: 'Circuit' },
      { value: 'school', label: 'School' }
    ];
  };

  // Render loading state
  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Program Access</Typography>
        {!readOnly && (
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={handleAddRole}
            disabled={loading}
          >
            Add Program Role
          </Button>
        )}
      </Box>
      
      {userProgramRoles.length === 0 ? (
        <Alert severity="info">
          This user doesn't have access to any programs yet. {!readOnly && 'Click "Add Program Role" to grant program access.'}
        </Alert>
      ) : (
        <List>
          {userProgramRoles.map((role) => (
            <ListItem 
              key={role.id} 
              divider
              secondaryAction={
                !readOnly && (
                  <Box>
                    <IconButton edge="end" onClick={() => handleEditRole(role)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteRole(role.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {role.program_name || getProgramName(role.program_id)}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={role.role === 'admin' ? 'Administrator' : 'Data Collector'} 
                      color={role.role === 'admin' ? 'primary' : 'secondary'}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {role.scope_type ? `${role.scope_type.charAt(0).toUpperCase() + role.scope_type.slice(1)}: ${role.scope_name || role.scope_id}` : 'National (All)'}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Add/Edit Program Role Dialog */}
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogMode === 'add' ? 'Add Program Role' : 'Edit Program Role'}
        onSubmit={handleSubmit}
        isSubmitting={loading}
        maxWidth="md"
        fullWidth={true}
      >
        <Grid container spacing={3}>
          <Grid size={{xs:12, md:4}}>
            <FormControl fullWidth required disabled={dialogMode === 'edit'}>
              <InputLabel>Program</InputLabel>
              <Select
                name="programId"
                value={currentRole?.programId || ''}
                onChange={handleInputChange}
                label="Program"
              >
                {programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid  size={{xs:12, md:4}}>
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={currentRole?.role || ''}
                onChange={handleInputChange}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{xs:12, md:4}}>
            <FormControl fullWidth>
              <InputLabel>Scope Type</InputLabel>
              <Select
                name="scopeType"
                value={currentRole?.scopeType || ''}
                onChange={handleInputChange}
                label="Scope Type"
              >
                <MenuItem value="national">
                  National
                </MenuItem>
                {getScopeTypes().map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {currentRole?.scopeType === 'region' && (
            <Grid size={{xs:12, md:4}}>
              <FormControl fullWidth required>
                <InputLabel>Region</InputLabel>
                <Select
                  name="regionId"
                  value={currentRole?.regionId || ''}
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
          )}
          
          {currentRole?.scopeType === 'district' && (
            <>
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required>
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="regionId"
                    value={currentRole?.regionId || ''}
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
              
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required disabled={!currentRole?.regionId}>
                  <InputLabel>District</InputLabel>
                  <Select
                    name="districtId"
                    value={currentRole?.districtId || ''}
                    onChange={handleInputChange}
                    label="District"
                  >
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
          
          {currentRole?.scopeType === 'school' && (
            <>
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required>
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="regionId"
                    value={currentRole?.regionId || ''}
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
              
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required disabled={!currentRole?.regionId}>
                  <InputLabel>District</InputLabel>
                  <Select
                    name="districtId"
                    value={currentRole?.districtId || ''}
                    onChange={handleInputChange}
                    label="District"
                  >
                    {districts.map((district) => (
                      <MenuItem key={district.id} value={district.id}>
                        {district.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required disabled={!currentRole?.districtId}>
                  <InputLabel>School</InputLabel>
                  <Select
                    name="schoolId"
                    value={currentRole?.schoolId || ''}
                    onChange={handleInputChange}
                    label="School"
                  >
                    {schools.map((school) => (
                      <MenuItem key={school.id} value={school.id}>
                        {school.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {currentRole?.scopeType === 'circuit' && (
            <>
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required>
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="regionId"
                    value={currentRole?.regionId || ''}
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
              
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required disabled={!currentRole?.regionId}>
                  <InputLabel>District</InputLabel>
                  <Select
                    name="districtId"
                    value={currentRole?.districtId || ''}
                    onChange={handleInputChange}
                    label="District"
                  >
                    {districts.map((district) => (
                      <MenuItem key={district.id} value={district.id}>
                        {district.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{xs:12, md:4}}>
                <FormControl fullWidth required disabled={!currentRole?.districtId}>
                  <InputLabel>Circuit</InputLabel>
                  <Select
                    name="circuitId"
                    value={currentRole?.circuitId || ''}
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
            </>
          )}
        </Grid>
      </FormDialog>
    </Box>
  );
}
