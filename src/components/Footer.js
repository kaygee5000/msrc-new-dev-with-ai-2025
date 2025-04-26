"use client";

import Link from 'next/link';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  IconButton,
  Stack,
  useTheme 
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

export default function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: 'grey.900', 
        color: 'white',
        pt: 6,
        pb: 4,
        position: 'relative',
        zIndex: 10, // Ensure footer is above sidebar
        width: '100%', // Full width
        mt: 'auto' // Push to bottom of flex container
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Column */}
          <Grid item xs={12} md={3}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              MSRC
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Mobile School Report Card: Enhancing education monitoring and data-driven decision making across Ghana.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton sx={{ color: '#1877F2', bgcolor: 'white', '&:hover': { bgcolor: 'grey.200' } }}>
                <FacebookIcon />
              </IconButton>
              <IconButton sx={{ color: '#1DA1F2', bgcolor: 'white', '&:hover': { bgcolor: 'grey.200' } }}>
                <TwitterIcon />
              </IconButton>
              <IconButton sx={{ color: '#E4405F', bgcolor: 'white', '&:hover': { bgcolor: 'grey.200' } }}>
                <InstagramIcon />
              </IconButton>
              <IconButton sx={{ color: '#FF0000', bgcolor: 'white', '&:hover': { bgcolor: 'grey.200' } }}>
                <YouTubeIcon />
              </IconButton>
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Links
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    Home
                  </Typography>
                </Link>
              </ListItem>
              <ListItem disableGutters>
                <Link href="/about" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    About
                  </Typography>
                </Link>
              </ListItem>
              <ListItem disableGutters>
                <Link href="/contact" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    Contact
                  </Typography>
                </Link>
              </ListItem>
              <ListItem disableGutters>
                <Link href="/login" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    Log In
                  </Typography>
                </Link>
              </ListItem>
            </List>
          </Grid>

          {/* Resources */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Resources
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <Link href="#" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    User Guide
                  </Typography>
                </Link>
              </ListItem>
              <ListItem disableGutters>
                <Link href="#" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    FAQ
                  </Typography>
                </Link>
              </ListItem>
              <ListItem disableGutters>
                <Link href="#" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    Data Policy
                  </Typography>
                </Link>
              </ListItem>
              <ListItem disableGutters>
                <Link href="#" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography variant="body2" sx={{ '&:hover': { color: theme.palette.primary.light } }}>
                    Reports
                  </Typography>
                </Link>
              </ListItem>
            </List>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} md={3}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Contact
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <Typography variant="body2">
                  Ghana Education Service
                </Typography>
              </ListItem>
              <ListItem disableGutters>
                <Typography variant="body2">
                  P.O. Box M.45
                </Typography>
              </ListItem>
              <ListItem disableGutters>
                <Typography variant="body2">
                  Accra, Ghana
                </Typography>
              </ListItem>
              <ListItem disableGutters>
                <Typography variant="body2">
                  Email: info@msrcghana.org
                </Typography>
              </ListItem>
              <ListItem disableGutters>
                <Typography variant="body2">
                  Phone: +233 (0) 30 298 2000
                </Typography>
              </ListItem>
            </List>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.800' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="grey.400">
            © {currentYear} Mobile School Report Card. All rights reserved.
          </Typography>
          <Typography variant="caption" color="grey.500" sx={{ mt: 1, display: 'block' }}>
            A project of the Ghana Education Service
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}