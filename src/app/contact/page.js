"use client";

import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Stack,
  List,
  ListItem,
  Paper,
  IconButton
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
    }, 1500);
  };

  return (
    <>
      {/* Page Header */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: 'white',
          py: 12,
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Contact Us
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: '800px', opacity: 0.9 }}>
            Get in touch with our team for support, inquiries, or feedback about the MSRC platform.
          </Typography>
        </Container>
      </Box>
      
      {/* Contact Content */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Contact Information */}
            <Grid item xs={12} lg={4}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, color: 'text.primary' }}>
                Get In Touch
              </Typography>
              
              <Stack spacing={4}>
                <Box sx={{ display: 'flex' }}>
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.50', 
                      p: 1.5, 
                      borderRadius: '50%', 
                      mr: 2,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PhoneIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      Phone
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      +233 (0) 30 298 2000
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mon-Fri, 8:00 AM - 5:00 PM GMT
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex' }}>
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.50', 
                      p: 1.5, 
                      borderRadius: '50%', 
                      mr: 2,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <EmailIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      support@msrcghana.org
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      info@gesghana.gov.gh
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex' }}>
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.50', 
                      p: 1.5, 
                      borderRadius: '50%', 
                      mr: 2,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <LocationOnIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      Address
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ghana Education Service
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ministry of Education
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      P.O. Box M.45
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accra, Ghana
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex' }}>
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.50', 
                      p: 1.5, 
                      borderRadius: '50%', 
                      mr: 2,
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PublicIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      Website
                    </Typography>
                    <Typography variant="body2">
                      <a 
                        href="https://ges.gov.gh" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          color: '#2196f3',
                          textDecoration: 'none'
                        }}
                      >
                        https://ges.gov.gh
                      </a>
                    </Typography>
                  </Box>
                </Box>
              </Stack>
              
              {/* Social Media */}
              <Box sx={{ mt: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Follow Us
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton sx={{ color: 'white', bgcolor: '#1877F2', '&:hover': { bgcolor: '#166FE5' } }}>
                    <FacebookIcon />
                  </IconButton>
                  <IconButton sx={{ color: 'white', bgcolor: '#1DA1F2', '&:hover': { bgcolor: '#1A8CD8' } }}>
                    <TwitterIcon />
                  </IconButton>
                  <IconButton sx={{ 
                    color: 'white', 
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', 
                    '&:hover': { 
                      background: 'linear-gradient(45deg, #da7e2b 0%, #cc5d35 25%, #c4243b 50%, #b01f5a 75%, #a6157a 100%)' 
                    } 
                  }}>
                    <InstagramIcon />
                  </IconButton>
                  <IconButton sx={{ color: 'white', bgcolor: '#FF0000', '&:hover': { bgcolor: '#E60000' } }}>
                    <YouTubeIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Grid>
            
            {/* Contact Form */}
            <Grid item xs={12} lg={8}>
              <Card elevation={3}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                    Send us a Message
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Have questions or feedback about the MSRC platform? Fill out the form below and our team will get back to you as soon as possible.
                  </Typography>
                  
                  {formSubmitted ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Thank you for your message! We'll get back to you soon.
                    </Alert>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="First Name"
                            fullWidth
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Last Name"
                            fullWidth
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Email Address"
                            fullWidth
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Phone Number"
                            fullWidth
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Subject"
                            fullWidth
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Your Message"
                            fullWidth
                            multiline
                            rows={6}
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            size="large"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Sending..." : "Send Message"}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Map Section */}
      <Box sx={{ height: '400px', bgcolor: 'grey.200', width: '100%' }}>
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'grey.100'
          }}
        >
          <Typography variant="h5" color="text.secondary">
            Google Maps Integration Placeholder
          </Typography>
        </Box>
      </Box>
    </>
  );
}