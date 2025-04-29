'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SurveyDetailView from '../../../pages/SurveyDetailView';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function SurveyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // Extract parameters from URL
  const entityType = params?.entityType || '';
  const entityName = params?.entityName || '';
  
  // Additional parameters might be passed as query params
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  
  useEffect(() => {
    // Get query parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    setRegion(searchParams.get('region') || '');
    setDistrict(searchParams.get('district') || '');
    setIsLoading(false);
  }, []);
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading survey details...
        </Typography>
      </Box>
    );
  }
  
  return (
    <SurveyDetailView
      entityType={decodeURIComponent(entityType)}
      entityName={decodeURIComponent(entityName)}
      region={decodeURIComponent(region)}
      district={decodeURIComponent(district)}
      onBack={handleBack}
    />
  );
}
