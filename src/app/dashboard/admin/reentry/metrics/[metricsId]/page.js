'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Collapse,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AssignmentReturn as ReturnIcon,
  BarChart as BarChartIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Chart from 'react-apexcharts';

// Mock data for different metrics
const METRICS = {
  'pregnant-in-school': {
    id: 'pregnant-in-school',
    name: 'Pregnant Students in School',
    description: 'Number of pregnant students who are currently attending school',
    icon: <SchoolIcon color="success" />,
    color: 'success',
    value: 1234,
    change: 12,
    trend: 'up',
    chartColor: '#4CAF50'
  },
  'pregnant-out-of-school': {
    id: 'pregnant-out-of-school',
    name: 'Pregnant Students Out of School',
    description: 'Number of pregnant students who are currently not attending school',
    icon: <PersonIcon color="error" />,
    color: 'error',
    value: 567,
    change: -5,
    trend: 'down',
    chartColor: '#F44336'
  },
  'reentry-count': {
    id: 'reentry-count',
    name: 'Re-entry Count',
    description: 'Total number of students who have returned to school after pregnancy',
    icon: <ReturnIcon color="info" />,
    color: 'info',
    value: 789,
    change: 8,
    trend: 'up',
    chartColor: '#2196F3'
  },
  'reentry-rate': {
    id: 'reentry-rate',
    name: 'Re-entry Rate',
    description: 'Percentage of eligible students who have returned to school after pregnancy',
    icon: <BarChartIcon color="warning" />,
    color: 'warning',
    value: 89,
    change: 2,
    trend: 'up',
    chartColor: '#FF9800',
    isPercentage: true
  }
};

// Mock hierarchical data for regions, districts, circuits, schools
const mockHierarchicalData = [
  {
    id: 1,
    name: 'Greater Accra',
    type: 'region',
    value: 450,
    percentOfTotal: 36.5,
    trend: 'up',
    change: 5,
    children: [
      {
        id: 101,
        name: 'Accra Metro',
        type: 'district',
        value: 250,
        percentOfTotal: 20.3,
        trend: 'up',
        change: 8,
        children: [
          {
            id: 1001,
            name: 'Accra Central Circuit',
            type: 'circuit',
            value: 120,
            percentOfTotal: 9.7,
            trend: 'up',
            change: 10,
            children: [
              {
                id: 10001,
                name: 'Accra Girls SHS',
                type: 'school',
                value: 45,
                percentOfTotal: 3.6,
                trend: 'up',
                change: 12
              },
              {
                id: 10002,
                name: 'Holy Trinity SHS',
                type: 'school',
                value: 35,
                percentOfTotal: 2.8,
                trend: 'up',
                change: 5
              },
              {
                id: 10003,
                name: 'St. Mary\'s SHS',
                type: 'school',
                value: 40,
                percentOfTotal: 3.2,
                trend: 'up',
                change: 15
              }
            ]
          },
          {
            id: 1002,
            name: 'Accra East Circuit',
            type: 'circuit',
            value: 130,
            percentOfTotal: 10.5,
            trend: 'up',
            change: 6,
            children: [
              {
                id: 10004,
                name: 'Labone SHS',
                type: 'school',
                value: 50,
                percentOfTotal: 4.1,
                trend: 'up',
                change: 8
              },
              {
                id: 10005,
                name: 'Accra Academy',
                type: 'school',
                value: 45,
                percentOfTotal: 3.6,
                trend: 'down',
                change: -2
              },
              {
                id: 10006,
                name: 'Wesley Grammar School',
                type: 'school',
                value: 35,
                percentOfTotal: 2.8,
                trend: 'up',
                change: 10
              }
            ]
          }
        ]
      },
      {
        id: 102,
        name: 'Tema Metro',
        type: 'district',
        value: 200,
        percentOfTotal: 16.2,
        trend: 'up',
        change: 3,
        children: [
          {
            id: 1003,
            name: 'Tema Central Circuit',
            type: 'circuit',
            value: 110,
            percentOfTotal: 8.9,
            trend: 'up',
            change: 5,
            children: [
              {
                id: 10007,
                name: 'Tema SHS',
                type: 'school',
                value: 60,
                percentOfTotal: 4.9,
                trend: 'up',
                change: 7
              },
              {
                id: 10008,
                name: 'Tema Technical Institute',
                type: 'school',
                value: 50,
                percentOfTotal: 4.1,
                trend: 'up',
                change: 3
              }
            ]
          },
          {
            id: 1004,
            name: 'Tema East Circuit',
            type: 'circuit',
            value: 90,
            percentOfTotal: 7.3,
            trend: 'down',
            change: -2,
            children: [
              {
                id: 10009,
                name: 'Our Lady of Mercy SHS',
                type: 'school',
                value: 45,
                percentOfTotal: 3.6,
                trend: 'down',
                change: -5
              },
              {
                id: 10010,
                name: 'Tema Methodist SHS',
                type: 'school',
                value: 45,
                percentOfTotal: 3.6,
                trend: 'up',
                change: 2
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Ashanti',
    type: 'region',
    value: 380,
    percentOfTotal: 30.8,
    trend: 'up',
    change: 7,
    children: [
      {
        id: 201,
        name: 'Kumasi Metro',
        type: 'district',
        value: 220,
        percentOfTotal: 17.8,
        trend: 'up',
        change: 9,
        children: []
      },
      {
        id: 202,
        name: 'Oforikrom',
        type: 'district',
        value: 160,
        percentOfTotal: 13.0,
        trend: 'up',
        change: 4,
        children: []
      }
    ]
  },
  {
    id: 3,
    name: 'Northern',
    type: 'region',
    value: 210,
    percentOfTotal: 17.0,
    trend: 'down',
    change: -2,
    children: []
  },
  {
    id: 4,
    name: 'Central',
    type: 'region',
    value: 194,
    percentOfTotal: 15.7,
    trend: 'up',
    change: 3,
    children: []
  }
];

// Chart options for trend data
const trendChartOptions = {
  chart: {
    type: 'line',
    toolbar: {
      show: true,
    },
    zoom: {
      enabled: true
    }
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  xaxis: {
    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
  },
  legend: {
    position: 'top'
  },
  title: {
    text: 'Trend Over Time',
    align: 'left'
  }
};

// Function to render expandable row
function ExpandableRow({ item, level = 0, metric }) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const indentPadding = level * 20;

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ pl: `${indentPadding + 16}px` }}>
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              sx={{ mr: 1 }}
            >
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          ) : (
            <Box component="span" sx={{ width: 28, display: 'inline-block' }} />
          )}
          {item.name}
          <Chip 
            size="small" 
            label={item.type} 
            sx={{ ml: 1, textTransform: 'capitalize' }} 
            variant="outlined" 
          />
        </TableCell>
        <TableCell align="right">
          {metric.isPercentage ? `${item.value}%` : item.value.toLocaleString()}
        </TableCell>
        <TableCell align="right">{item.percentOfTotal.toFixed(1)}%</TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {item.trend === 'up' ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography 
              variant="body2" 
              color={item.change > 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {item.change > 0 ? '+' : ''}{item.change}%
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          {item.type !== 'school' && (
            <Tooltip title="View Details">
              <IconButton 
                size="small" 
                component={Link}
                href={`/dashboard/admin/reentry/${item.type}s/${item.id}`}
              >
                <BarChartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {hasChildren && open && (
        <TableRow>
          <TableCell colSpan={5} sx={{ py: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ py: 2 }}>
                {item.children.map(child => (
                  <ExpandableRow key={child.id} item={child} level={level + 1} metric={metric} />
                ))}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function MetricDetailPage({ params }) {
  const router = useRouter();
  const { metricId } = params;
  const [metric, setMetric] = useState(null);
  const [hierarchicalData, setHierarchicalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendData, setTrendData] = useState([]);

  // Fetch metric data on component mount
  useEffect(() => {
    // Simulate API call
    setLoading(true);
    
    setTimeout(() => {
      // Check if metric exists
      const foundMetric = METRICS[metricId];
      if (foundMetric) {
        setMetric(foundMetric);
        setHierarchicalData(mockHierarchicalData);
        
        // Generate trend data for this metric
        setTrendData([{
          name: foundMetric.name,
          data: [800, 820, 850, 900, 950, 1000, 1050, 1100, 1150, 1200, 1220, foundMetric.value]
        }]);
        
        setLoading(false);
      } else {
        setError('Metric not found');
        setLoading(false);
      }
    }, 1000);
  }, [metricId]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !metric) {
    return (
      <Container maxWidth="xl">
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main', my: 5 }}>
          {error || 'Metric not found'}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink component={Link} href="/dashboard/admin" color="inherit">
              Dashboard
            </MuiLink>
            <MuiLink component={Link} href="/dashboard/admin/reentry" color="inherit">
              Reentry
            </MuiLink>
            <Typography color="text.primary">{metric.name}</Typography>
          </Breadcrumbs>
        </Box>

        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>

        {/* Metric Summary Card */}
        <Card sx={{ mb: 3, borderLeft: `4px solid ${metric.chartColor}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {metric.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {metric.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h3">
                    {metric.isPercentage ? `${metric.value}%` : metric.value.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    {metric.trend === 'up' ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                    <Typography 
                      variant="body1" 
                      color={metric.change > 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ bgcolor: `${metric.color}.light`, p: 2, borderRadius: 2 }}>
                {metric.icon}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Chart
            options={{
              ...trendChartOptions,
              colors: [metric.chartColor]
            }}
            series={trendData}
            type="line"
            height={300}
          />
        </Paper>

        {/* Hierarchical Data Table */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {metric.name} by Region, District, Circuit, and School
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">% of Total</TableCell>
                  <TableCell align="right">Change</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hierarchicalData.map(item => (
                  <ExpandableRow key={item.id} item={item} metric={metric} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
}