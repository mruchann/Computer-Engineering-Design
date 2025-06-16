import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress,
  CardActionArea,
  IconButton,
  Tooltip
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuthStore, api } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../constants/api';
import { getFileIcon } from '../utils/fileIcons';
import FileRating from './FileRating';

interface FileRecommendation {
  id: string;
  filename: string;
  hash: string;
  owner_username: string;
  timestamp: string;
  magnetLink: string;
  mimetype?: string;
  group: string;
}

interface FileRecommendationsProps {
  maxItems?: number;
  onFileDownload?: (magnetLink: string, filename: string) => void;
}

const FileRecommendations: React.FC<FileRecommendationsProps> = ({ 
  maxItems = 5,
  onFileDownload
}) => {
  const [recommendations, setRecommendations] = useState<FileRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const electron = (typeof window !== 'undefined' && window.electron ? window.electron : null) as any;

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.fetch(API_ENDPOINTS.RECOMMENDATIONS);
        if (response.ok) {
          const data = await response.json();
          
          // Filter out duplicates by hash
          const uniqueFiles = new Map<string, FileRecommendation>();
          data.forEach((file: FileRecommendation) => {
            // Only add if not already present or replace with more details
            if (!uniqueFiles.has(file.hash) || file.id) {
              uniqueFiles.set(file.hash, file);
            }
          });
          
          // Convert back to array and limit to maxItems
          const uniqueRecommendations = Array.from(uniqueFiles.values()).slice(0, maxItems);
          setRecommendations(uniqueRecommendations);
        } else {
          setError('Failed to fetch recommendations');
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setError('An error occurred while fetching recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [maxItems]);

  const handleDownload = (magnetLink: string, filename: string) => {
    if (onFileDownload) {
      onFileDownload(magnetLink, filename);
    } else if (window.electron && window.electron.leechFile) {
      // Use the correctly exposed API from preload.ts
      window.electron.leechFile(magnetLink);
    } else {
      console.error('Download functionality not available');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        {error}
      </Typography>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No recommendations available yet. Rate more files to get personalized recommendations.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {recommendations.map((file) => (
        <Grid item xs={12} key={file.id || file.hash}>
          <Card 
            elevation={1}
            sx={{ 
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              }
            }}
          >
            <CardActionArea>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getFileIcon(file.filename, false)}
                    <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }} noWrap>
                      {file.filename}
                    </Typography>
                  </Box>
                  
                  <Tooltip title="Download file">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file.magnetLink, file.filename);
                      }}
                    >
                      <FileDownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Shared in: {file.group}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Shared by: {file.owner_username}
                </Typography>
                
                <FileRating fileHash={file.hash} size="small" readOnly />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default FileRecommendations; 