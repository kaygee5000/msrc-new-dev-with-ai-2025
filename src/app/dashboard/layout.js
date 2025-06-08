"use client";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Toolbar, AppBar, IconButton, Typography, Divider, Box,
  Collapse, Button, Avatar, Menu, MenuItem, CircularProgress
} from '@mui/material';
import {
  Dashboard, Domain, LocationCity, Business, School, Groups, BarChart, Assessment, ListAlt, Settings, Menu as MenuIcon,
  ExpandLess, ExpandMore, SportsSoccer, CalendarMonth, Tune, ViewList, Person, Logout, ArrowDropDown, WaterDrop as WaterDropIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useSession, signOut } from "next-auth/react";
import { useAuth } from '@/context/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Regions', icon: <Domain />, path: '/dashboard/admin/regions' },
  { text: 'Districts', icon: <LocationCity />, path: '/dashboard/admin/districts' },
  { text: 'Circuits', icon: <Business />, path: '/dashboard/admin/circuits' },
  { text: 'Schools', icon: <School />, path: '/dashboard/admin/schools' },
  { text: 'Users', icon: <Groups />, path: '/dashboard/admin/users' },
  { text: 'Pregnancy & Re-entry', icon: <BarChart />, path: '/dashboard/admin/reentry' },
  { 
    text: 'Right to Play', 
    icon: <SportsSoccer />, 
    path: '/dashboard/admin/rtp',
    subItems: [
      { text: 'Overview', icon: <Dashboard />, path: '/dashboard/admin/rtp' },
      { text: 'Itineraries', icon: <CalendarMonth />, path: '/dashboard/admin/rtp/itineraries' },
      { text: 'Schools & Districts', icon: <Groups />, path: '/dashboard/admin/rtp/schools-districts' },
      { text: 'Gender Analysis', icon: <BarChart />, path: '/dashboard/admin/rtp/gender-analysis' },
      { text: 'RTP Configuration', icon: <Tune />, path: '/dashboard/admin/rtp/settings' }
    ]
  },
  { text: 'WASH Dashboard', icon: <WaterDropIcon />, path: '/dashboard/wash' },
  { text: 'TVET Dashboard', icon: <School />, path: '/dashboard/tvet' },
  // { text: 'Reports', icon: <Assessment />, path: '/dashboard/reports' },
  // { text: 'Analytics', icon: <BarChart />, path: '/dashboard/analytics' },
  // { text: 'Submissions', icon: <ListAlt />, path: '/dashboard/submissions' },
  // { text: 'Settings', icon: <Settings />, path: '/dashboard/settings' },
];

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  
  // Use our AuthContext for authentication
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  
  // Protect all dashboard routes
  useEffect(() => {
    // If authentication check is complete and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // Handle mobile drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle sub-menu expansion
  const handleExpandClick = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, don't render dashboard (will redirect in useEffect)
  if (!isAuthenticated) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render drawer content
  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          mSRC Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <div key={item.text}>
            {item.subItems ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleExpandClick(item.text)}
                    selected={pathname.startsWith(item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                    {expandedItems[item.text] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={expandedItems[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItem key={subItem.text} disablePadding>
                        <ListItemButton 
                          component={Link}
                          href={subItem.path}
                          selected={pathname === subItem.path}
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon>{subItem.icon}</ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding>
                <ListItemButton 
                  component={Link}
                  href={item.path}
                  selected={pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )}
          </div>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => pathname === item.path)?.text || 
             menuItems.find(item => item.subItems && item.subItems.some(sub => pathname === sub.path))?.text ||
             'Dashboard'}
          </Typography>
          
          {/* User profile menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              onClick={handleProfileMenuOpen}
              endIcon={<ArrowDropDown />}
              startIcon={
                <Avatar 
                  sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
                >
                  {user?.first_name?.[0] || user?.name?.[0] || 'U'}
                </Avatar>
              }
            >
              {user?.first_name || user?.name || 'User'}
            </Button>
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                router.push('/dashboard/profile');
              }}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                handleLogout();
              }}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '5px'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}


