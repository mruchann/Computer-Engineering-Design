import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { api } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../constants/api';

interface PendingScan {
  id: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  status: string;
  created_at: string;
}

interface PendingScansProps {
  pendingScans?: PendingScan[];
}

export default function PendingScans({ pendingScans: propPendingScans }: PendingScansProps) {
  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If pendingScans are provided as props, use them
    if (propPendingScans && propPendingScans.length > 0) {
      setPendingScans(propPendingScans);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchPendingScans();
    }
    
    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchPendingScans, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [propPendingScans]);

  const fetchPendingScans = async () => {
    // Skip API call if we have pending scans from props
    if (propPendingScans && propPendingScans.length > 0) {
      return;
    }
    
    try {
      const response = await api.fetch(API_ENDPOINTS.VIRUS_SCAN);
      if (response.ok) {
        const data = await response.json();
        setPendingScans(data);
      } else {
        throw new Error('Failed to fetch pending scans');
      }
    } catch (error) {
      console.error('Error fetching pending scans:', error);
      setError('Failed to load pending scans');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if there are no pending scans
  if (!loading && pendingScans.length === 0 && (!propPendingScans || propPendingScans.length === 0)) {
    return null;
  }

  // Use prop pendingScans if available, otherwise use state
  const scansToDisplay = propPendingScans && propPendingScans.length > 0 
    ? propPendingScans 
    : pendingScans;

  return (
    <Paper sx={{ mt: 3, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Pending Virus Scans ({scansToDisplay.length})
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <List>
          {scansToDisplay.map((scan) => (
            <ListItem
              key={scan.id}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={scan.file_name}
                secondary={
                  <Box component="span">
                    <Box component="span" display="block">
                      Started: {new Date(scan.created_at).toLocaleString()}
                    </Box>
                    <Box component="span" display="block">
                      Path: {scan.file_path}
                    </Box>
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={scan.status}
                  color={scan.status === 'scanning' ? 'primary' : 'warning'}
                  size="small"
                  icon={scan.status === 'scanning' ? <CircularProgress size={16} /> : <WarningIcon />}
                />
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
} 