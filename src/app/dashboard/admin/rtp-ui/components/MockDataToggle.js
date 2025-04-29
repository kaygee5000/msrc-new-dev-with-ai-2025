'use client';
import React from 'react';
import { useMockDataContext } from './MockDataContext';
import { Paper, FormControlLabel, Switch, Typography, Box, Tooltip } from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CloudIcon from '@mui/icons-material/Cloud';

export default function MockDataToggle() {
  const { useMockData, setUseMockData } = useMockDataContext();
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        borderRadius: 2,
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          {useMockData ? 
            <DataObjectIcon color="primary" fontSize="small" /> : 
            <CloudIcon color="info" fontSize="small" />
          }
          <Typography variant="body2" fontWeight="medium" sx={{ ml: 1 }}>
            {useMockData ? 'Demo Mode' : 'Live Data'}
          </Typography>
        </Box>
        
        <Tooltip title={useMockData ? "Using realistic mock data" : "Using live API data"}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography variant="caption">Mock</Typography>}
            labelPlacement="start"
            sx={{ m: 0 }}
          />
        </Tooltip>
      </Box>
    </Paper>
  );
}
