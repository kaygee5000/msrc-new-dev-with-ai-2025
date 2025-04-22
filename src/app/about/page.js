"use client";

import { 
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import Image from 'next/image';

export default function About() {
  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: 'white',
          py: 12,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 900 }}>
            <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
              About MSRC
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 700 }}>
              Building a better future for education in Ghana through data-driven decision making
            </Typography>
          </Box>
        </Container>
      </Box>
      
      {/* Mission and Vision */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8}>
            <Grid item xs={12} lg={6}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 4, color: 'text.primary' }}>
                Our Mission
              </Typography>
              <Typography sx={{ mb: 4, fontSize: '1.1rem', color: 'text.secondary' }}>
                The Mobile School Report Card (MSRC) aims to revolutionize education data 
                management in Ghana by providing a robust platform for collecting, analyzing, 
                and visualizing key education indicators from the school level to the national level.
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                We believe that timely, accurate data is essential for making informed decisions 
                that improve educational outcomes for all students. By empowering education 
                stakeholders with actionable insights, we contribute to the development of Ghana&apos;s 
                education system.
              </Typography>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 4, color: 'text.primary' }}>
                Our Vision
              </Typography>
              <Typography sx={{ mb: 4, fontSize: '1.1rem', color: 'text.secondary' }}>
                We envision a Ghana where every educational decision, from the classroom to the 
                ministry, is informed by high-quality, real-time data. Our platform serves as the 
                backbone of this vision, connecting thousands of schools across the country.
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                Through our partnership with the Ghana Education Service, we&apos;re working toward a 
                future where educational resources are optimally allocated, interventions are 
                data-driven, and every Ghanaian child has access to quality education.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Our Story */}
      <Box sx={{ py: 10, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Our Story
            </Typography>
          </Box>
          
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', height: 450, width: '100%' }}>
                <Image
                  src="/globe.svg"
                  fill
                  alt="Education in Ghana"
                  style={{ objectFit: 'contain' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ mb: 3, fontSize: '1.1rem', color: 'text.secondary' }}>
                MSRC was born out of a collaboration between the Ghana Education Service and 
                education technology experts who identified a critical gap in data collection 
                and management within Ghana&apos;s education system.
              </Typography>
              <Typography sx={{ mb: 3, fontSize: '1.1rem', color: 'text.secondary' }}>
                In 2019, a pilot program was launched in three regions to test the concept of a 
                mobile-first data collection platform for schools. The results were promising, 
                showing dramatic improvements in data accuracy, submission rates, and usability 
                compared to paper-based systems.
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                By 2023, the platform had expanded nationwide, becoming an integral part of 
                educational administration in Ghana. Today, MSRC continues to evolve, adding new 
                features and capabilities based on feedback from users across the country.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Our Impact */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
              Our Impact
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              MSRC is making a difference in Ghana&apos;s education system
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                    98%
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2, color: 'text.primary' }}>
                    Data Submission Rate
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    Up from 65% with paper-based systems, ensuring more complete educational data.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                    75%
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2, color: 'text.primary' }}>
                    Reduction in Reporting Time
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    Schools can now submit reports in minutes instead of hours, saving valuable time.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                    3X
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 2, color: 'text.primary' }}>
                    Increase in Data-Driven Decisions
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    District officers report making more informed decisions using MSRC data.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Our Partners */}
      <Box sx={{ py: 10, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
              Our Partners
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Working together to improve education in Ghana
            </Typography>
          </Box>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', height: 100, alignItems: 'center' }}>
                <Box sx={{ position: 'relative', height: 60, width: '100%' }}>
                  <Image
                    src="/window.svg"
                    fill
                    alt="Ghana Education Service"
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', height: 100, alignItems: 'center' }}>
                <Box sx={{ position: 'relative', height: 60, width: '100%' }}>
                  <Image
                    src="/globe.svg"
                    fill
                    alt="Ministry of Education"
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', height: 100, alignItems: 'center' }}>
                <Box sx={{ position: 'relative', height: 60, width: '100%' }}>
                  <Image
                    src="/file.svg"
                    fill
                    alt="UNICEF Ghana"
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', height: 100, alignItems: 'center' }}>
                <Box sx={{ position: 'relative', height: 60, width: '100%' }}>
                  <Image
                    src="/vercel.svg"
                    fill
                    alt="World Bank"
                    style={{ objectFit: 'contain' }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}