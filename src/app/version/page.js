'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function VersionPage() {
  const [versionInfo, setVersionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // In a real app, use a more secure method for authentication
  const correctPassword = process.env.NEXT_PUBLIC_VERSION_PAGE_PASSWORD || 'dev123';

  const fetchVersionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/version', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch version info');
      }
      
      const data = await response.json();
      setVersionInfo(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setAuthenticated(true);
      fetchVersionInfo();
    } else {
      setError('Incorrect password');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!authenticated) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <Paper elevation={3} sx={{ p: 4, width: 400, maxWidth: '90%' }}>
          <Typography variant="h5" gutterBottom>
            Version Information
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Enter the password to view version information
          </Typography>
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              View Version Info
            </Button>
          </form>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Version Information</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchVersionInfo}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <List>
            {versionInfo && Object.entries(versionInfo).map(([key, value]) => (
              <ListItem 
                key={key} 
                divider
                secondaryAction={
                  <Tooltip title="Copy to clipboard">
                    <IconButton 
                      edge="end" 
                      onClick={() => copyToClipboard(String(value))}
                      size="small"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {String(value)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Box mt={4} textAlign="center">
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => {
            setAuthenticated(false);
            setPassword('');
          }}
        >
          Lock
        </Button>
      </Box>
    </Box>
  );
}
