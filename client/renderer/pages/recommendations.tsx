import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Toolbar, 
  Paper,
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import FileRecommendations from '../components/FileRecommendations';
import { getFileIcon } from '../utils/fileIcons';

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const electron = (typeof window !== 'undefined' && window.electron ? window.electron : null) as any;

  const handleDownload = (magnetLink: string, filename: string) => {
    if (window.electron && window.electron.leechFile) {
      window.electron.leechFile(magnetLink);
    } else {
      console.error('Download functionality not available');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${72}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            Recommended Files
          </Typography>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Personalized for You
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              These files are recommended based on your ratings and what similar users have rated highly.
              Rate more files to improve your recommendations.
            </Typography>
            
            <FileRecommendations
              maxItems={20}
              onFileDownload={handleDownload}
            />
          </Paper>
        </Container>
      </Box>
    </Box>
  );
} 