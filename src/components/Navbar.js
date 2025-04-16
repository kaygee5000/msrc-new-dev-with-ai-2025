"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Container,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

// Fix the ElevationScroll component
const ElevationScroll = ({ children }) => {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  if (!React.isValidElement(children)) {
    return children;
  }

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    sx: {
      backgroundColor: trigger ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
      backdropFilter: trigger ? 'blur(8px)' : 'none',
      transition: 'all 0.3s ease-in-out',
      ...children.props.sx
    }
  });
};

export default function Navbar() {
  const [openDrawer, setOpenDrawer] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpenDrawer(open);
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const drawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton component="div">
                <ListItemText primary={item.name} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
        <ListItem disablePadding>
          <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
            <ListItemButton component="div">
              <ListItemText primary="Log In" />
            </ListItemButton>
          </Link>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <React.Fragment>
      <ElevationScroll>
        <AppBar position="sticky" color="default">
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {/* Logo/Brand */}
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '1.5rem',
                    color: 'primary.main'
                  }}
                >
                  MSRC
                </Typography>
              </Link>
              
              {/* Desktop Navigation */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                {navItems.map((item) => (
                  <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
                    <Typography 
                      component="div"
                      sx={{ 
                        mx: 2, 
                        color: 'text.primary',
                        '&:hover': { color: 'primary.main' },
                        transition: 'color 0.2s',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      {item.name}
                    </Typography>
                  </Link>
                ))}
                <Link href="/login" style={{ textDecoration: 'none', marginLeft: 2 }}>
                  <Button variant="outlined" color="primary" component="div">
                    Log In
                  </Button>
                </Link>
              </Box>
              
              {/* Mobile Navigation */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="end"
                onClick={toggleDrawer(true)}
                sx={{ display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
      </ElevationScroll>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={toggleDrawer(false)}
      >
        {drawerList}
      </Drawer>
    </React.Fragment>
  );
}