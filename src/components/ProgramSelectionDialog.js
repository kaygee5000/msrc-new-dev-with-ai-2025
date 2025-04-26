'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box,
  Button,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { FolderSpecial, Dashboard, School, Group, Assignment } from '@mui/icons-material';

/**
 * Program selection dialog that appears after login
 * when a user has multiple program roles
 */
export default function ProgramSelectionDialog({ open, user, onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  if (!user || !user.programRoles || user.programRoles.length === 0) {
    return null;
  }
  
  // Filter active programs based on status field
  const activePrograms = user.programRoles.filter(role => role.program_status === 'active');
  
  // If no active programs, don't render the dialog
  if (activePrograms.length === 0) {
    return null;
  }
  
  // Get icon based on program code
  const getProgramIcon = (programCode) => {
    const iconsMap = {
      'RTP': <School color="primary" />,
      'REENTRY': <Assignment color="primary" />,
      'ADMIN': <Dashboard color="primary" />,
      'PIP': <Group color="primary" />
    };
    
    return iconsMap[programCode] || <FolderSpecial color="primary" />;
  };
  
  // Handle program selection
  const handleSelectProgram = (programRole) => {
    setSelectedProgram(programRole);
    setLoading(true);
    
    // Determine route based on role and program
    let route = '/dashboard';
    
    if (programRole.program_code === 'RTP') {
      route = '/rtp/dashboard';
    } else if (programRole.program_code === 'REENTRY') {
      route = '/reentry/dashboard';
    } else if (programRole.role === 'admin' || programRole.role === 'superadmin') {
      route = '/dashboard'; // Admin dashboard
    } else {
      route = '/dashboard'; // Default dashboard
    }
    
    // Store selected program in localStorage to remember the choice
    localStorage.setItem('lastSelectedProgram', JSON.stringify(programRole));
    
    // Redirect to appropriate dashboard
    setTimeout(() => {
      router.push(route);
      
      // Close dialog after navigation
      if (onClose) {
        onClose();
      }
    }, 500);
  };
  
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Select Program
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select which program you want to access:
          </Typography>
        </Box>
        {loading && <CircularProgress size={24} />}
      </DialogTitle>
      
      <DialogContent>
        <List sx={{ pt: 1 }}>
          {activePrograms.map((programRole) => (
            <ListItem key={`${programRole.program_id}-${programRole.role}`} disablePadding>
              <ListItemButton 
                onClick={() => handleSelectProgram(programRole)}
                disabled={loading}
                selected={selectedProgram?.program_id === programRole.program_id}
                sx={{ 
                  borderRadius: 1,
                  mb: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  },
                  position: 'relative'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main' }}>
                    {getProgramIcon(programRole.program_code)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={programRole.program_name}
                  secondary={`Role: ${programRole.role.charAt(0).toUpperCase() + programRole.role.slice(1)}`}
                />
                {loading && selectedProgram?.program_id === programRole.program_id && (
                  <CircularProgress 
                    size={16} 
                    sx={{ 
                      position: 'absolute',
                      right: 16,
                      color: 'primary.main'
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}