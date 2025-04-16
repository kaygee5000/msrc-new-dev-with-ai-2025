'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Box, Paper, Typography, ButtonGroup, Button } from '@mui/material';

// Dynamically import ApexCharts with no SSR to avoid window reference errors
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

/**
 * Charts component for rendering various chart types using ApexCharts
 * 
 * @param {Object} props - Component props
 * @param {Object} props.options - Chart configuration options
 * @param {Array|Array[]} props.series - Data series for the chart
 * @param {string} props.type - Chart type (bar, line, pie, etc.)
 * @param {number} props.height - Chart height in pixels
 * @param {string} props.width - Chart width (can be percentage or pixels)
 * @returns {React.Component} - Chart component
 */
const Charts = ({ options, series, type, height = 350, width = '100%' }) => {
  return (
    <div className="chart-container">
      {typeof window !== 'undefined' && (
        <ReactApexChart
          options={options}
          series={series}
          type={type}
          height={height}
          width={width}
        />
      )}
    </div>
  );
};

export default Charts;

export function AttendanceChart({ title = "Attendance Trends" }) {
  const [period, setPeriod] = useState('weekly');
  
  // Sample data - would be fetched from API in production
  const series = {
    weekly: [
      {
        name: 'Student Attendance',
        data: [87, 85, 89, 86, 90, 88, 91, 88]
      },
      {
        name: 'Facilitator Attendance',
        data: [95, 96, 94, 97, 95, 96, 98, 97]
      }
    ],
    termly: [
      {
        name: 'Student Attendance',
        data: [88, 86, 89]
      },
      {
        name: 'Facilitator Attendance',
        data: [96, 95, 97]
      }
    ]
  };

  const options = {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      }
    },
    colors: ['#2196f3', '#4caf50'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: period === 'weekly' ? 
        ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'] : 
        ['Term 1', 'Term 2', 'Term 3'],
    },
    yaxis: {
      min: 60,
      max: 100,
      labels: {
        formatter: (value) => `${value}%`
      }
    },
    legend: {
      position: 'top',
    },
    tooltip: {
      y: {
        formatter: (value) => `${value}%`
      }
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <ButtonGroup size="small">
          <Button 
            variant={period === 'weekly' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </Button>
          <Button 
            variant={period === 'termly' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('termly')}
          >
            Termly
          </Button>
        </ButtonGroup>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Charts 
          options={options} 
          series={series[period]} 
          type="line" 
          height={300} 
        />
      </Box>
    </Paper>
  );
}

export function EnrollmentChart({ title = "Enrollment Changes" }) {
  const [period, setPeriod] = useState('termly');
  
  // Sample data - would be fetched from API in production
  const series = [
    {
      name: 'Boys',
      data: [1240, 1350, 1260, 1420, 1510]
    },
    {
      name: 'Girls',
      data: [1180, 1220, 1300, 1350, 1460]
    }
  ];

  const options = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4
      },
    },
    colors: ['#2196f3', '#ff4081'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['2023 Term 1', '2023 Term 2', '2023 Term 3', '2024 Term 1', '2024 Term 2'],
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} students`
      }
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <ButtonGroup size="small">
          <Button 
            variant={period === 'termly' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('termly')}
          >
            Termly
          </Button>
          <Button 
            variant={period === 'yearly' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('yearly')}
          >
            Yearly
          </Button>
        </ButtonGroup>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Charts 
          options={options} 
          series={series} 
          type="bar" 
          height={300} 
        />
      </Box>
    </Paper>
  );
}

export function RegionalComparisonChart({ title = "Regional Comparison" }) {
  // Sample data - would be fetched from API in production
  const series = [
    {
      name: 'Student Attendance',
      data: [87, 82, 89, 91, 86, 93, 84, 88, 90, 85]
    },
    {
      name: 'Facilitator Attendance',
      data: [95, 93, 97, 96, 94, 98, 92, 95, 96, 94]
    }
  ];

  const options = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top',
        },
      }
    },
    colors: ['#2196f3', '#4caf50'],
    dataLabels: {
      enabled: true,
      offsetX: 30,
      formatter: (val) => `${val}%`
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: [
        'Greater Accra',
        'Ashanti',
        'Eastern',
        'Western',
        'Central',
        'Northern',
        'Upper East',
        'Upper West',
        'Volta',
        'Brong Ahafo'
      ],
      labels: {
        formatter: (val) => `${val}%`
      }
    },
    yaxis: {
      title: {
        text: 'Regions'
      }
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}%`
      }
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Charts 
          options={options} 
          series={series} 
          type="bar" 
          height={350} 
        />
      </Box>
    </Paper>
  );
}

export function ReEntryChart({ title = "Pregnancy & Re-entry" }) {
  // Sample data - would be fetched from API in production
  const series = [{
    name: 'Cases',
    data: [44, 38, 35, 29, 33, 42]
  }, {
    name: 'Re-entries',
    data: [35, 30, 25, 22, 30, 37]
  }];

  const options = {
    chart: {
      type: 'line',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight',
      width: [3, 3],
      dashArray: [0, 5]
    },
    colors: ['#ff4081', '#2196f3'],
    markers: {
      size: 5,
    },
    xaxis: {
      categories: ['Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} students`
      }
    },
    legend: {
      position: 'top'
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Charts 
          options={options} 
          series={series} 
          type="line" 
          height={300} 
        />
      </Box>
    </Paper>
  );
}

export function SubmissionsDonut({ title = "Submissions This Week" }) {
  // Sample data - would be fetched from API in production
  const series = [142, 4, 12];

  const options = {
    chart: {
      type: 'donut',
    },
    colors: ['#4caf50', '#ff9800', '#f44336'],
    labels: ['Submitted', 'Incomplete', 'Missing'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%'
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    tooltip: {
      y: {
        formatter: (val) => `${val} schools`
      }
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>
      
      <Box sx={{ 
        mt: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexGrow: 1 
      }}>
        <Charts 
          options={options} 
          series={series} 
          type="donut" 
          height={280} 
          width="100%" 
        />
      </Box>
    </Paper>
  );
}