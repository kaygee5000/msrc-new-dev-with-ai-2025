"use client";

import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent,
  Stack,
  Paper
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BarChartIcon from '@mui/icons-material/BarChart';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import GroupsIcon from '@mui/icons-material/Groups';

// Mark this page as statically generated
export const dynamic = 'force-static';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{xs:12, md:6}}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                {/* <Image
                  src="/assets/msrc-logo.70a4620a.png"
                  width={80}
                  height={80}
                  alt="MSRC Logo"
                  style={{ marginRight: '16px' }}
                /> */}
                <Typography variant="h1" gutterBottom>
                  Mobile School Report Card
                </Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ mb: 4, opacity: 0.9 }}>
                A comprehensive data collection and analytics platform supporting education 
                decision-making for the Ghana Education Service.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Link href="/login" passHref style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/about" passHref style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="large"
                  >
                    Learn More
                  </Button>
                </Link>
              </Stack>
            </Grid>
            <Grid size={{xs:12, md:6}} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', height: 400, width: '100%' }}>
                <Image
                  src="/assets/msrc-image.698282c4.jpg"
                  fill
                  alt="MSRC Hero Image"
                  style={{ objectFit: 'cover', borderRadius: '8px' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Decorative elements */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -100, 
            right: -100, 
            width: 300, 
            height: 300, 
            borderRadius: '50%', 
            bgcolor: 'primary.light', 
            opacity: 0.3 
          }}
        />
        <Box 
          sx={{ 
            position: 'absolute',
            bottom: -100, 
            left: -100, 
            width: 200, 
            height: 200, 
            borderRadius: '50%',
            bgcolor: 'primary.dark',
            opacity: 0.3
          }}
        />
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" gutterBottom>
              Key Features
            </Typography>
            <Typography variant="subtitle1" sx={{ maxWidth: 600, mx: 'auto', color: 'text.secondary' }}>
              MSRC provides essential tools for education data monitoring and analysis,
              enabling better decision-making at all levels.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Feature 1 */}
            <Grid size={{xs:12, md:4}}>
              <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                <CardContent sx={{ p: 4 }}>
                  <Box 
                    sx={{ 
                      mb: 3, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.light',
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      color: 'white'
                    }}
                  >
                    <BarChartIcon fontSize="large" />
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Analytics Dashboard
                  </Typography>
                  <Typography color="text.secondary">
                    Visualize key performance indicators with interactive charts and drill-down 
                    capabilities from national to school level.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 2 */}
            <Grid size={{xs:12, md:4}}>
              <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                <CardContent sx={{ p: 4 }}>
                  <Box 
                    sx={{ 
                      mb: 3, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.light',
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      color: 'white'
                    }}
                  >
                    <NoteAddIcon fontSize="large" />
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Data Collection
                  </Typography>
                  <Typography color="text.secondary">
                    Simple mobile-friendly forms for weekly and termly submissions with 
                    validation and offline capabilities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 3 */}
            <Grid size={{xs:12, md:4}}>
              <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                <CardContent sx={{ p: 4 }}>
                  <Box 
                    sx={{ 
                      mb: 3, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'primary.light',
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      color: 'white'
                    }}
                  >
                    <GroupsIcon fontSize="large" />
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Role-Based Access
                  </Typography>
                  <Typography color="text.secondary">
                    Secure access controls that limit data visibility based on user role from 
                    School to National levels.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 8, bgcolor: 'grey.100' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center">
            <Grid size={{xs:6, sm:3}}>
              <Paper sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>16</Typography>
                <Typography variant="body2" color="text.secondary">Regions</Typography>
              </Paper>
            </Grid>
            <Grid size={{xs:6, sm:3}}>
              <Paper sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>260</Typography>
                <Typography variant="body2" color="text.secondary">Districts</Typography>
              </Paper>
            </Grid>
            <Grid size={{xs:6, sm:3}}>
              <Paper sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>38K+</Typography>
                <Typography variant="body2" color="text.secondary">Schools</Typography>
              </Paper>
            </Grid>
            <Grid size={{xs:6, sm:3}}>
              <Paper sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>9M+</Typography>
                <Typography variant="body2" color="text.secondary">Students</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="subtitle1" sx={{ maxWidth: 600, mx: 'auto', color: 'text.secondary' }}>
              MSRC simplifies educational data management through a clear, step-by-step process.
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {/* Step 1 */}
            <Grid size={{xs:12, md:4}}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  1
                </Box>
                <Typography variant="h5" gutterBottom>
                  Data Collection
                </Typography>
                <Typography color="text.secondary">
                  School facilitators submit weekly and termly reports through simple mobile-friendly forms.
                </Typography>
              </Box>
            </Grid>

            {/* Step 2 */}
            <Grid size={{xs:12, md:4}}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  2
                </Box>
                <Typography variant="h5" gutterBottom>
                  Data Processing
                </Typography>
                <Typography color="text.secondary">
                  Information is securely processed and stored for analysis, with validation to ensure quality.
                </Typography>
              </Box>
            </Grid>

            {/* Step 3 */}
            <Grid size={{xs:12, md:4}}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    mb: 2,
                    mx: 'auto'
                  }}
                >
                  3
                </Box>
                <Typography variant="h5" gutterBottom>
                  Decision Making
                </Typography>
                <Typography color="text.secondary">
                  Education officials access insights through dashboards to make informed policy decisions.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10, bgcolor: 'primary.dark', color: 'white' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography sx={{ mb: 6, opacity: 0.9 }}>
            Join thousands of education professionals already using MSRC to track, analyze, and improve
            educational outcomes across Ghana.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Link href="/login" passHref style={{ textDecoration: 'none' }}>
              <Button 
                variant="contained" 
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.dark',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                Sign In Now
              </Button>
            </Link>
            <Link href="/contact" passHref style={{ textDecoration: 'none' }}>
              <Button 
                variant="outlined" 
                color="inherit" 
                size="large"
              >
                Contact Support
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>
    </>
  );
}