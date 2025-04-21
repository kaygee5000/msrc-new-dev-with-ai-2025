'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function ConsolidatedChecklistList() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // List state
  const [loading, setLoading] = useState(false);
  const [checklists, setChecklists] = useState([]);
  const [error, setError] = useState(null);
  
  // Fetch checklist data
  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      try {
        // This would be an actual API call in production
        // For now using mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockChecklists = [
          {
            id: '1',
            school_name: 'Accra Primary School',
            district_name: 'Accra Metro',
            assessor_name: 'John Doe',
            assessment_date: '2025-04-15',
            itinerary_name: 'Q1 2025 Data Collection',
            created_at: '2025-04-15T10:30:00Z',
            status: 'completed'
          },
          {
            id: '2',
            school_name: 'Tema Model School',
            district_name: 'Tema Metro',
            assessor_name: 'Jane Smith',
            assessment_date: '2025-04-10',
            itinerary_name: 'Q1 2025 Data Collection',
            created_at: '2025-04-10T14:45:00Z',
            status: 'completed'
          },
          {
            id: '3',
            school_name: 'Ga East Primary',
            district_name: 'Ga East',
            assessor_name: 'David Johnson',
            assessment_date: '2025-04-12',
            itinerary_name: 'Q1 2025 Data Collection',
            created_at: '2025-04-12T11:20:00Z',
            status: 'draft'
          }
        ];
        
        setChecklists(mockChecklists);
      } catch (error) {
        console.error('Error fetching checklists:', error);
        setError('Failed to load checklists. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchChecklists();
    }
  }, [isAuthenticated]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Handle creating a new checklist
  const handleCreateNew = () => {
    router.push('/rtp/consolidated-checklist/new');
  };
  
  // Handle viewing a checklist
  const handleView = (id) => {
    router.push(`/rtp/consolidated-checklist/${id}`);
  };
  
  // Handle editing a checklist
  const handleEdit = (id) => {
    router.push(`/rtp/consolidated-checklist/${id}/edit`);
  };
  
  if (isLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading checklists...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}
            >
              <Button 
                onClick={() => router.push('/rtp')} 
                sx={{ minWidth: 'auto', p: 0, mr: 1, color: 'text.secondary', textTransform: 'none' }}
              >
                RTP
              </Button>
              {' / '}
              <span style={{ marginLeft: '4px' }}>Consolidated Checklists</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Consolidated Checklists
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
            >
              Create New Checklist
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        {checklists.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No checklists found
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You haven't submitted any consolidated checklists yet.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateNew}
                >
                  Create Your First Checklist
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>School</TableCell>
                  <TableCell>District</TableCell>
                  <TableCell>Assessor</TableCell>
                  <TableCell>Assessment Date</TableCell>
                  <TableCell>Itinerary</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist.id}>
                    <TableCell>{checklist.school_name}</TableCell>
                    <TableCell>{checklist.district_name}</TableCell>
                    <TableCell>{checklist.assessor_name}</TableCell>
                    <TableCell>{new Date(checklist.assessment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{checklist.itinerary_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={checklist.status.charAt(0).toUpperCase() + checklist.status.slice(1)} 
                        color={checklist.status === 'completed' ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton aria-label="view" onClick={() => handleView(checklist.id)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton aria-label="edit" onClick={() => handleEdit(checklist.id)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}