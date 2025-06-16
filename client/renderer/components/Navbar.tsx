import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip,
  Badge,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Popover,
  Link
} from '@mui/material';
import {
  Menu as MenuIcon,
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Share as ShareIcon,
  Search as SearchIcon,
  Groups as GroupsIcon,
  FolderOpen as FolderOpenIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Recommend as RecommendIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Help as HelpIcon,
  Comment as CommentIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeContext } from '../contexts/ThemeContext';
import { useNotificationStore } from '../components/NotificationStore';

export default function Navbar() {
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [reachUsAnchor, setReachUsAnchor] = useState<null | HTMLElement>(null);
  const { mode, toggleColorMode } = useThemeContext();
  const { notifications, clearNotifications } = useNotificationStore();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleReachUsClick = (event: React.MouseEvent<HTMLElement>) => {
    setReachUsAnchor(event.currentTarget);
  };

  const handleReachUsClose = () => {
    setReachUsAnchor(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    handleClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleClearAllNotifications = () => {
    clearNotifications();
  };

  const drawerItems = [
    { text: 'Search', icon: <SearchIcon />, path: '/dashboard' },
    { text: 'Browse', icon: <FolderOpenIcon />, path: '/browse' },
    { text: 'Groups', icon: <GroupsIcon />, path: '/groups' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
    { text: 'Upload', icon: <CloudUploadIcon />, path: '/upload' },
    { text: 'Recent', icon: <HistoryIcon />, path: '/recent' },
    { text: 'Shared Files', icon: <ShareIcon />, path: '/shared' },
    { text: 'Recommendations', icon: <RecommendIcon />, path: '/recommendations' },
  ];

  const settingsItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Statistics', icon: <BarChartIcon />, path: '/stats' },
    { text: 'Feedbacks', icon: <CommentIcon />, path: '/comments' }, // Added Comments item
  ];

  const settingsMenuItems = [
    { text: 'Profile', path: '/profile' },
    { text: 'Statistics', path: '/stats' },
    { text: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography 
              variant="h5" 
              component="div" 
              onClick={() => router.push('/')}
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #00bcd4 30%, #7c4dff 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
                cursor: 'pointer'
              }}
            >
              PeerLink
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              startIcon={<CloudUploadIcon />}
              onClick={() => router.push('/upload')}
            >
              Upload
            </Button>

            <Tooltip title="Reach Us">
              <Button
                color="inherit"
                startIcon={<HelpIcon />}
                onClick={handleReachUsClick}
              >
                Reach Us
              </Button>
            </Tooltip>

            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotificationsClick}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Account">
              <IconButton onClick={handleMenu} color="inherit">
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? 240 : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? 240 : 72,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${
              theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.12)' 
                : 'rgba(255, 255, 255, 0.12)'
            }`,
            transition: theme.transitions.create(
              ['width', 'background-color', 'border-color'],
              {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }
            ),
            ...(!drawerOpen && {
              overflowX: 'hidden',
              width: 72,
              transition: theme.transitions.create(
                ['width', 'background-color', 'border-color'],
                {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }
              ),
            }),
          },
        }}
      >
        <Toolbar />
        <List>
          {drawerItems.map((item, index) => (
            <ListItem
              button
              key={index}
              onClick={() => {
                console.log(item.path);
                handleNavigation(item.path);
              }}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: theme.palette.mode === 'light' ? '#2c3e50' : '#ffffff',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: drawerOpen ? 1 : 0,
                  color: theme.palette.mode === 'light' ? '#2c3e50' : '#ffffff',
                }}
              />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ 
          borderColor: theme.palette.mode === 'light'
            ? 'rgba(0, 0, 0, 0.12)'
            : 'rgba(255, 255, 255, 0.12)'
        }} />
        <List>
          {settingsItems.map((item, index) => (
            <ListItem
              button
              key={index}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  color: theme.palette.mode === 'light' ? '#2c3e50' : '#ffffff',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: drawerOpen ? 1 : 0,
                  color: theme.palette.mode === 'light' ? '#2c3e50' : '#ffffff',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
      >
        {settingsMenuItems.map((item) => (
          <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
            {item.text}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        onClick={handleNotificationsClose}
        PaperProps={{
          sx: { width: 320 }
        }}
      >
        {notifications.map((notification, index) => (
          <MenuItem key={index}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1">{notification.text}</Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <Button
          color="primary"
          onClick={handleClearAllNotifications}
          disabled={notifications.length === 0}
        >
          Clear All Notifications
        </Button>
      </Menu>

      {/* Reach Us Popover */}
      <Popover
        open={Boolean(reachUsAnchor)}
        anchorEl={reachUsAnchor}
        onClose={handleReachUsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 300,
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Contact Us
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmailIcon color="primary" />
            <Link href="mailto:support@peerlink.com" underline="hover">
              support@peerlink.com
            </Link>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PhoneIcon color="primary" />
            <Link href="tel:+18005551234" underline="hover">
              +1 (800) 555-1234
            </Link>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <LocationIcon color="primary" sx={{ mt: 0.5 }} />
            <Typography>
              123 Tech Street<br />
              Silicon Valley, CA 94025<br />
              United States
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PublicIcon color="primary" /> {/* Import from @mui/icons-material */}
            <Link href="https://senior.ceng.metu.edu.tr/2025/PeerLink/" underline="hover" target="_blank" rel="noopener noreferrer">
              www.peerlink.com
            </Link>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="body2" color="text.secondary">
            Our support team is available 24/7 to assist you with any questions or issues.
          </Typography>
        </Box>
      </Popover>
    </>
  );
}