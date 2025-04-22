"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Box,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import { useSession } from "next-auth/react";

/**
 * Program Selector Modal
 * Shown after login for users with multiple program access
 */
export default function ProgramSelector({ open, onClose, onSelect }) {
  const { data: session } = useSession();
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const router = useRouter();

  // Helper function to check if user has a specific program role
  const hasProgramRole = (programCode, role) => {
    if (!user?.programRoles) return false;
    
    return user.programRoles.some(
      pr => pr.program_code === programCode && pr.role === role
    );
  };

  // Fetch available programs for the user
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!user || !user.id || !open) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/user-program-roles?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.userProgramRoles) {
          // Process and group by program
          const programMap = {};
          
          data.userProgramRoles.forEach(role => {
            if (!programMap[role.program_code]) {
              programMap[role.program_code] = {
                id: role.program_id,
                code: role.program_code,
                name: role.program_name,
                roles: []
              };
            }
            
            programMap[role.program_code].roles.push({
              id: role.id,
              role: role.role,
              scopeType: role.scope_type,
              scopeId: role.scope_id
            });
          });
          
          setPrograms(Object.values(programMap));
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [user, open]);

  // Handle program selection
  const handleProgramSelect = (program) => {
    if (onSelect) {
      onSelect(program);
    }
    
    localStorage.setItem('msrc_current_program', JSON.stringify(program));
    
    // Direct to the appropriate dashboard based on role
    const isAdmin = program.roles.some(r => r.role === 'admin');
    
    if (isAdmin) {
      switch (program.code) {
        case 'rtp':
          router.push('/dashboard/admin/rtp');
          break;
        case 'reentry':
          router.push('/dashboard/admin/reentry');
          break;
        default:
          router.push('/dashboard');
      }
    } else {
      // Data collector routes
      switch (program.code) {
        case 'rtp':
          router.push('/rtp');
          break;
        case 'reentry':
          router.push('/reentry');
          break;
        default:
          router.push('/dashboard');
      }
    }
    
    onClose();
  };

  // Get icon for program
  const getProgramIcon = (programCode) => {
    switch (programCode) {
      case 'rtp':
        return <DataUsageIcon color="primary" />;
      case 'reentry':
        return <SchoolIcon color="secondary" />;
      default:
        return <DashboardIcon color="info" />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Select Program to Access
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              You have access to multiple programs. Please select which program you would like to access:
            </Typography>
            
            <List sx={{ mt: 2 }}>
              {programs.map((program) => (
                <Paper 
                  key={program.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 2, 
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <ListItem 
                    button 
                    onClick={() => handleProgramSelect(program)}
                    sx={{ py: 2 }}
                  >
                    <ListItemIcon>
                      {getProgramIcon(program.code)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="h6" component="div">
                          {program.name}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {program.roles.map((role, idx) => (
                            <Chip
                              key={idx}
                              label={role.role === 'admin' ? 'Administrator' : 'Data Collector'}
                              size="small"
                              color={role.role === 'admin' ? 'primary' : 'secondary'}
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                          {program.roles.some(r => r.scopeType) && (
                            <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 0.5 }}>
                              {program.roles.map((role, idx) => (
                                role.scopeType && 
                                <span key={idx}>
                                  {role.scopeType === 'national' 
                                    ? 'National Access' 
                                    : `${role.scopeType.charAt(0).toUpperCase() + role.scopeType.slice(1)}: ${role.scopeName || role.scopeId}`}
                                  {idx < program.roles.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
