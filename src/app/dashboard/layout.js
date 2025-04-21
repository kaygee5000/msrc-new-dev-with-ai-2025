"use client";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Toolbar, AppBar, IconButton, Typography, Divider, Box,
  Collapse, Button, Avatar, Menu, MenuItem
} from '@mui/material';
import {
  Dashboard, Domain, LocationCity, Business, School, Groups, BarChart, Assessment, ListAlt, Settings, Menu as MenuIcon,
  ExpandLess, ExpandMore, SportsSoccer, CalendarMonth, Tune, ViewList, Person, Logout, ArrowDropDown
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/utils/auth';

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
  { text: 'Reports', icon: <Assessment />, path: '/dashboard/reports' },
  { text: 'Analytics', icon: <BarChart />, path: '/dashboard/analytics' },
  { text: 'Submissions', icon: <ListAlt />, path: '/dashboard/submissions' },
  { text: 'Settings', icon: <Settings />, path: '/dashboard/settings' },
];

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Initialize expanded state based on current path
  useEffect(() => {
    const newExpandedState = {};
    
    menuItems.forEach(item => {
      if (item.subItems) {
        // Check if current path matches this item or any of its subitems
        const isActive = pathname === item.path || 
          item.subItems.some(subItem => pathname.startsWith(subItem.path));
        
        if (isActive) {
          newExpandedState[item.text] = true;
        }
      }
    });
    
    setExpandedItems(newExpandedState);
  }, [pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleExpandClick = (itemText) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }));
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    router.push('/login');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    return user.name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          MSRC Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Box key={item.text}>
            {item.subItems ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => handleExpandClick(item.text)}
                    selected={pathname === item.path}
                    component={pathname === item.path ? Link : 'div'}
                    href={pathname === item.path ? item.path : undefined}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                    {expandedItems[item.text] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={expandedItems[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map(subItem => (
                      <Link 
                        href={subItem.path} 
                        key={subItem.text} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <ListItemButton 
                          selected={pathname === subItem.path}
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      </Link>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ListItemButton selected={pathname === item.path}>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Link>
            )}
          </Box>
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
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Dashboard
            </Typography>
          </Box>
          
          {/* Profile and Logout Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit"
              startIcon={<Person />}
              onClick={handleProfileMenuOpen}
              endIcon={<ArrowDropDown />}
            >
              Profile
            </Button>
            
            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                router.push('/dashboard/profile');
              }}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => {
                handleProfileMenuClose();
                router.push('/dashboard/settings');
              }}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
            
            <Avatar 
              sx={{ 
                ml: 1, 
                bgcolor: 'primary.dark',
                cursor: 'pointer'
              }}
              onClick={handleProfileMenuOpen}
            >
              {getUserInitials()}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
