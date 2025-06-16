import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Container,
  Toolbar,
  useTheme,
  Fade,
  Alert,
  Snackbar,
} from '@mui/material';
import Navbar from '../components/Navbar';
import { externalApiGet } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'next/router';

interface Stats {
  totalTorrents: number;
  activeTorrents: number;
  connectedPeers: number;
  seedingOnlyPeers: number;
  leechingOnlyPeers: number;
  seedingAndLeechingPeers: number;
  ipv4Peers: number;
  ipv6Peers: number;
  clients: {
    [key: string]: number;
  };
}

const StatsPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await externalApiGet('/api/stats');
        // Parse the HTML response to extract stats
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        
        const statsText = doc.body.textContent || '';
        
        // Extract numbers using regex
        const totalTorrents = parseInt(statsText.match(/(\d+) torrents/)?.[1] || '0');
        const activeTorrents = parseInt(statsText.match(/\((\d+) active\)/)?.[1] || '0');
        const connectedPeers = parseInt(statsText.match(/Connected Peers: (\d+)/)?.[1] || '0');
        const seedingOnlyPeers = parseInt(statsText.match(/Peers Seeding Only: (\d+)/)?.[1] || '0');
        const leechingOnlyPeers = parseInt(statsText.match(/Peers Leeching Only: (\d+)/)?.[1] || '0');
        const seedingAndLeechingPeers = parseInt(statsText.match(/Peers Seeding & Leeching: (\d+)/)?.[1] || '0');
        const ipv4Peers = parseInt(statsText.match(/IPv4 Peers: (\d+)/)?.[1] || '0');
        const ipv6Peers = parseInt(statsText.match(/IPv6 Peers: (\d+)/)?.[1] || '0');

        // Extract client information
        const clients: { [key: string]: number } = {};
        const clientRegex = /\*\*([^*]+)\*\* (\d+(?:\.\d+)*) : (\d+)/g;
        let match;
        while ((match = clientRegex.exec(statsText)) !== null) {
          clients[match[1].trim()] = parseInt(match[3]);
        }

        setStats({
          totalTorrents,
          activeTorrents,
          connectedPeers,
          seedingOnlyPeers,
          leechingOnlyPeers,
          seedingAndLeechingPeers,
          ipv4Peers,
          ipv6Peers,
          clients,
        });
        
        setSnackbar({
          open: true,
          message: 'Statistics updated successfully',
          severity: 'success',
        });
      } catch (err) {
        setError('Failed to fetch stats');
        console.error('Error fetching stats:', err);
        setSnackbar({
          open: true,
          message: 'Failed to fetch statistics',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const StatCard = ({ title, value, subtitle, color = 'primary' }: { 
    title: string; 
    value: number | string; 
    subtitle?: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  }) => (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[10],
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={color}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (!isInitialized || !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          ml: { xs: '72px', sm: '240px' }, // Add margin for drawer width
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Container 
          maxWidth="lg" 
          sx={{ 
            flexGrow: 1, 
            py: 4,
            px: { xs: 2, sm: 3 }, // Responsive padding
          }}
        >
          <Fade in={true} timeout={500}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #00bcd4 30%, #7c4dff 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                }}
              >
                System Statistics
              </Typography>
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Total Torrents"
                    value={stats?.totalTorrents || 0}
                    subtitle={`${stats?.activeTorrents || 0} active`}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Connected Peers"
                    value={stats?.connectedPeers || 0}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Seeding Only"
                    value={stats?.seedingOnlyPeers || 0}
                    color="info"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Leeching Only"
                    value={stats?.leechingOnlyPeers || 0}
                    color="warning"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="Seeding & Leeching"
                    value={stats?.seedingAndLeechingPeers || 0}
                    color="secondary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="IPv4 Peers"
                    value={stats?.ipv4Peers || 0}
                    color="primary"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <StatCard
                    title="IPv6 Peers"
                    value={stats?.ipv6Peers || 0}
                    color="info"
                  />
                </Grid>
              </Grid>

              <Typography 
                variant="h5" 
                sx={{ 
                  mt: 4, 
                  mb: 2,
                  fontWeight: 'bold',
                }}
              >
                Client Distribution
              </Typography>
              <Grid container spacing={3}>
                {stats?.clients && Object.entries(stats.clients).map(([client, count], index) => (
                  <Grid item xs={12} sm={6} md={4} key={client}>
                    <StatCard
                      title={client}
                      value={count}
                      color={index % 2 === 0 ? 'primary' : 'secondary'}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Container>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatsPage; 