'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, Divider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function IndicatorCard({ indicator, onClick }) {
  // Use client-side rendering for the indicator value to prevent hydration errors
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // This effect will only run on the client, after hydration
    setIsClient(true);
  }, []);
  
  return (
    <Card 
      onClick={onClick} 
      sx={{ 
        m: 1, 
        minWidth: 240, 
        maxWidth: 280,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 6,
          borderColor: 'primary.main',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {indicator.name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 1 }}>
          <Typography variant="h3" color="primary" fontWeight="bold">
            {isClient ? (
              <>
                {indicator.value}
                {indicator.value !== undefined && 
                 typeof indicator.value === 'number' && 
                 !['oi1', 'oi5'].includes(indicator.id) ? '%' : ''}
              </>
            ) : (
              // During server rendering, use a placeholder
              <span style={{ visibility: 'hidden' }}>0</span>
            )}
          </Typography>
          
          {isClient && (
            <Chip 
              icon={<InfoIcon />}
              label="Details"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography 
          variant="caption" 
          sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}
        >
          <InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
          Click for details
        </Typography>
      </CardContent>
    </Card>
  );
}
