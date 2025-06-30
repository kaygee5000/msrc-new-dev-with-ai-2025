'use client';

import { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Box, 
  Typography, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useConnection } from '@/context/ConnectionContext';

export default function ConnectionStatus() {
  const { isOnline, lastOnline, hasDatabaseError, databaseErrorDetail, checkConnection } = useConnection();
  const [offlineAlertOpen, setOfflineAlertOpen] = useState(false);
  const [dbErrorAlertOpen, setDbErrorAlertOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Format the last online time
  const formatLastOnline = () => {
    if (!lastOnline) return 'Unknown';
    
    // If within the last minute, show "Just now"
    const diffMs = Date.now() - lastOnline.getTime();
    if (diffMs < 60000) return 'Just now';
    
    // If within the last hour, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise show time
    return lastOnline.toLocaleTimeString();
  };
  
  // Handle retry button click
  const handleRetry = () => {
    checkConnection();
  };
  
  // Show more details about status
  const handleShowDetails = () => {
    setDialogOpen(true);
  };
  
  // Update snackbar visibility when online status or database error status changes
  useEffect(() => {
    if (!isOnline) {
      setOfflineAlertOpen(true);
      setDbErrorAlertOpen(false);
    } else if (hasDatabaseError) {
      setOfflineAlertOpen(false);
      setDbErrorAlertOpen(true);
    } else {
      setOfflineAlertOpen(false);
      setDbErrorAlertOpen(false);
    }
  }, [isOnline, hasDatabaseError]);

  return (
    <>
      {/* Offline notification */}
      <Snackbar
        open={offlineAlertOpen}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ maxWidth: '100%', width: '100%' }}
      >
        <Alert 
          severity="warning" 
          variant="filled"
          icon={<WifiOffIcon />}
          sx={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          action={
            <Box>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleShowDetails}
                sx={{ mr: 1 }}
              >
                Details
              </Button>
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            </Box>
          }
        >
          <Typography variant="body1">
            You are currently offline. Some features may be unavailable.
          </Typography>
        </Alert>
      </Snackbar>
      
      {/* Database error notification */}
      <Snackbar
        open={dbErrorAlertOpen}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ maxWidth: '100%', width: '100%' }}
      >
        <Alert 
          severity="error" 
          variant="filled"
          icon={<StorageIcon />}
          sx={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          action={
            <Box>
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleShowDetails}
                sx={{ mr: 1 }}
              >
                Details
              </Button>
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
              >
                Retry
              </Button>
            </Box>
          }
        >
          <Typography variant="body1">
            Database connection error. Some data may be unavailable.
          </Typography>
        </Alert>
      </Snackbar>
      
      {/* Error details dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          {!isOnline ? (
            <WifiOffIcon sx={{ mr: 1, color: 'warning.main' }} />
          ) : hasDatabaseError ? (
            <StorageIcon sx={{ mr: 1, color: 'error.main' }} />
          ) : null}
          Connection Status
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" paragraph>
              {!isOnline ? (
                "The application is currently unable to connect to the server. This could be due to:"
              ) : hasDatabaseError ? (
                "The application is connected to the server, but there are database issues. This could be due to:"
              ) : (
                "Your connection is working normally."
              )}
            </Typography>
            
            {(!isOnline || hasDatabaseError) && (
              <ul>
                {!isOnline && (
                  <>
                    <li>Your device is offline</li>
                    <li>The server is down or unreachable</li>
                    <li>There are network connectivity issues</li>
                  </>
                )}
                {hasDatabaseError && (
                  <>
                    <li>The database server is experiencing issues</li>
                    <li>There&apos;s a connection error between the app server and database</li>
                    <li>A query failed due to SQL or other database errors</li>
                  </>
                )}
              </ul>
            )}
          </Box>
          
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Connection Details</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">Network Status:</Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                color={isOnline ? 'success.main' : 'error.main'}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">Database Status:</Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                color={!hasDatabaseError ? 'success.main' : 'error.main'}
              >
                {!hasDatabaseError ? 'Connected' : 'Error'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">Last Connected:</Typography>
              <Typography variant="body2">{formatLastOnline()}</Typography>
            </Box>
            
            {hasDatabaseError && databaseErrorDetail && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="error">Error Details:</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {databaseErrorDetail}
                </Typography>
              </Box>
            )}
          </Paper>
          
          <Typography variant="body2" color="text.secondary">
            {!isOnline ? (
              "While offline, you can still view cached data, but you won't be able to submit new data or see updates until your connection is restored."
            ) : hasDatabaseError ? (
              "Database errors may cause some features to be unavailable. The system will automatically try to recover when the database connection is restored."
            ) : (
              "Your connection is working normally. All features should be available."
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />} 
            onClick={() => {
              handleRetry();
              if (isOnline && !hasDatabaseError) {
                setDialogOpen(false);
              }
            }}
          >
            Check Connection
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}