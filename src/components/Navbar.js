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
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Container,
  useScrollTrigger,
  Divider,
  Menu,
  MenuItem,
  Avatar
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import { useSession } from "next-auth/react";
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ProgramSwitcher from '@/components/ProgramSelector/index';
import { useAuth } from '@/context/AuthContext';

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
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { user, logout } = useAuth();
  const isAuthenticated = session !== null;
  
  // Handle client-side authenticated rendering to avoid hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpenDrawer(open);
  };

  // Base navigation items - shown to all users
  const publicNavItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Dashboard menu items - only shown when logged in
  const dashboardItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Reentry and Pregnancy', path: '/reentry' },
    { name: 'Right to Play', path: '/rtp' },
  ];

  // Admin menu items - only shown for admin users
  const adminItems = user?.role === 'admin' ? [
    { name: 'Admin Dashboard', path: '/dashboard/admin' },
    { name: 'RTP Dashboard', path: '/dashboard/admin/rtp' },
  ] : [];

  // Profile menu items - only shown when logged in
  const profileItems = [
    { name: 'Profile', path: '/dashboard/profile', icon: <PersonIcon fontSize="small" /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <SettingsIcon fontSize="small" /> },
  ];

  const handleDashboardMenuOpen = (event) => {
    setDashboardMenuAnchor(event.currentTarget);
  };

  const handleDashboardMenuClose = () => {
    setDashboardMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    
    try {
      // Use our centralized logout function from AuthContext
      await logout();
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: redirect anyway
      window.location.href = '/';
    }
  };

  // Determine which nav items to show based on authentication
  const navItems = isAuthenticated ? publicNavItems : publicNavItems;

  // Combined drawer list with conditional elements
  const drawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton key={item.path} component="div">
                <ListItemText primary={item.name} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
        
        {isClient && (
          <>
            {isAuthenticated ? (
              <>
                <Divider sx={{ my: 1 }} />
                {dashboardItems.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }}>
                      <ListItemButton 
                        key={item.path} 
                        component="div"
                        selected={pathname === item.path}
                      >
                        <ListItemText primary={item.name} />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
                
                {user?.role === 'admin' && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <ListItem>
                      <ListItemText primary="Admin" sx={{ fontWeight: 'bold' }} />
                    </ListItem>
                    {adminItems.map((item) => (
                      <ListItem key={item.path} disablePadding>
                        <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }}>
                          <ListItemButton 
                            key={item.path} 
                            component="div"
                            selected={pathname === item.path}
                          >
                            <ListItemText primary={item.name} />
                          </ListItemButton>
                        </Link>
                      </ListItem>
                    ))}
                  </>
                )}
                
                <Divider sx={{ my: 1 }} />
                {profileItems.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }}>
                      <ListItemButton 
                        key={item.path} 
                        component="div"
                        selected={pathname === item.path}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.name} />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                ))}
                
                <ListItem disablePadding>
                  <ListItemButton component="div" onClick={handleLogout}>
                    <ListItemText primary="Log Out" />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <ListItem disablePadding>
                <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
                  <ListItemButton component="div">
                    <ListItemText primary="Log In" />
                  </ListItemButton>
                </Link>
              </ListItem>
            )}
          </>
        )}
        
        {/* Show static items during SSR to prevent hydration errors */}
        {!isClient && (
          <ListItem disablePadding>
            <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton component="div">
                <ListItemText primary="Log In" />
              </ListItemButton>
            </Link>
          </ListItem>
        )}
      </List>
    </Box>
  );

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.first_name || !user.last_name) return "U";
    return user.first_name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <React.Fragment>
      <ElevationScroll>
        <AppBar position="sticky" color="default">
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {/* Logo/Brand */}
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Image
                    src="/assets/msrc-logo.70a4620a.png" 
                    alt="MSRC Logo" 
                    width={135} // Approximate width based on 40px height and typical logo aspect ratio
                    height={40}
                    style={{ 
                      marginRight: '8px' 
                    }} 
                  />
                  {/* <Typography
                    variant="h6"
                    component="div"
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: '1.5rem',
                      color: 'primary.main'
                    }}
                  >
                    mSRC
                  </Typography> */}
                </Box>
              </Link>
              
              {/* Desktop Navigation */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                {/* Program Switcher - Only shown when authenticated */}
                {isClient && isAuthenticated && (
                  <ProgramSwitcher />
                )}
                
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
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
                
                {isClient && (
                  <>
                    {isAuthenticated ? (
                      <>
                        <Button 
                          onClick={handleDashboardMenuOpen}
                          endIcon={<ArrowDropDownIcon />}
                          sx={{ mx: 2 }}
                        >
                          Dashboard
                        </Button>
                        <Menu
                          anchorEl={dashboardMenuAnchor}
                          open={Boolean(dashboardMenuAnchor)}
                          onClose={handleDashboardMenuClose}
                        >
                          {[
                            ...dashboardItems.map((item) => (
                              <MenuItem 
                                key={item.path} 
                                onClick={handleDashboardMenuClose}
                                selected={pathname === item.path}
                              >
                                <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                                  {item.name}
                                </Link>
                              </MenuItem>
                            )),
                            ...(user?.role === 'admin' && adminItems.length > 0
                              ? [
                                  <Divider key="divider" />,
                                  ...adminItems.map((item) => (
                                    <MenuItem 
                                      key={item.path} 
                                      onClick={handleDashboardMenuClose}
                                      selected={pathname === item.path}
                                    >
                                      <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {item.name}
                                      </Link>
                                    </MenuItem>
                                  ))
                                ]
                              : [])
                          ]}
                        </Menu>
                        
                        {/* Profile Avatar and Menu */}
                        <IconButton 
                          onClick={handleProfileMenuOpen}
                          size="small"
                          sx={{ ml: 2 }}
                          aria-controls={Boolean(profileMenuAnchor) ? 'profile-menu' : undefined}
                          aria-haspopup="true"
                          aria-expanded={Boolean(profileMenuAnchor) ? 'true' : undefined}
                        >
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: 'primary.main',
                              fontSize: '1rem'
                            }}
                          >
                            {getUserInitials()}
                          </Avatar>
                        </IconButton>
                        <Menu
                          id="profile-menu"
                          anchorEl={profileMenuAnchor}
                          open={Boolean(profileMenuAnchor)}
                          onClose={handleProfileMenuClose}
                          PaperProps={{
                            elevation: 0,
                            sx: {
                              minWidth: 180,
                              overflow: 'visible',
                              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                              mt: 1.5
                            },
                          }}
                          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                          {user && (
                            <Box sx={{ px: 2, py: 1.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {user.first_name + ' ' + user.last_name || 'User'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email || ''}
                              </Typography>
                            </Box>
                          )}
                          <Divider />
                          {profileItems.map((item) => (
                            <MenuItem 
                              key={item.path} 
                              onClick={handleProfileMenuClose}
                            >
                              <ListItemIcon>{item.icon}</ListItemIcon>
                              <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {item.name}
                              </Link>
                            </MenuItem>
                          ))}
                          <Divider />
                          <MenuItem onClick={handleLogout}>
                            Log out
                          </MenuItem>
                        </Menu>
                      </>
                    ) : (
                      <Button
                        variant="outlined"
                        color="primary"
                        component={Link}
                        href="/login"
                        sx={{ ml: 2 }}
                      >
                        Log In
                      </Button>
                    )}
                  </>
                )}
                
                {/* Show static button during SSR to prevent hydration error */}
                {!isClient && (
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ ml: 2 }}
                  >
                    Log In
                  </Button>
                )}
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