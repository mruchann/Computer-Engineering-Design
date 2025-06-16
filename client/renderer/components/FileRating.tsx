import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Rating, 
  Typography, 
  Tooltip, 
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useAuthStore, api } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../constants/api';

interface FileRatingProps {
  fileHash: string;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
  readOnly?: boolean;
}

const FileRating: React.FC<FileRatingProps> = ({ 
  fileHash, 
  showCount = true,
  size = 'medium',
  readOnly = false
}) => {
  const [value, setValue] = useState<number | null>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Determine star size based on prop
  const starSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';

  // Function to fetch the average rating
  const fetchAverageRating = async () => {
    try {
      const response = await api.fetch(`${API_ENDPOINTS.RATING_AVERAGE}${fileHash}`);
      if (response.ok) {
        const data = await response.json();
        setAverageRating(data.average);
        setRatingCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching average rating:', error);
    }
  };

  // Function to fetch the user's rating
  const fetchUserRating = async () => {
    try {
      const response = await api.fetch(API_ENDPOINTS.USER_RATINGS);
      if (response.ok) {
        const data = await response.json();
        // Find rating for this file
        const userFileRating = data.find((rating: any) => rating.file_hash === fileHash);
        if (userFileRating) {
          setUserRating(userFileRating.rating);
          setValue(userFileRating.rating);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  // Function to submit a rating
  const submitRating = async (newValue: number | null) => {
    if (newValue === null) return;

    setSubmitting(true);
    try {
      const response = await api.fetch(API_ENDPOINTS.RATINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_hash: fileHash,
          rating: newValue
        }),
      });

      if (response.ok) {
        setUserRating(newValue);
        // Refresh average rating
        await fetchAverageRating();
        
        setSnackbarMessage('Your rating has been submitted!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage('Failed to submit rating. Please try again.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSnackbarMessage('An error occurred while submitting your rating.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loadRatings = async () => {
      setLoading(true);
      await fetchAverageRating();
      if (!readOnly) {
        await fetchUserRating();
      }
      setLoading(false);
    };

    loadRatings();
  }, [fileHash, readOnly]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading ratings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      <Rating
        name={`rating-${fileHash}`}
        value={readOnly ? averageRating : value}
        precision={0.5}
        size={starSize as any}
        onChange={(event, newValue) => {
          if (!readOnly) {
            setValue(newValue);
            submitRating(newValue);
          }
        }}
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
        readOnly={readOnly || submitting}
      />
      
      {showCount && (
        <Tooltip title={`${ratingCount} rating${ratingCount !== 1 ? 's' : ''}`}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ ml: 1 }}
          >
            ({ratingCount})
          </Typography>
        </Tooltip>
      )}
      
      {submitting && <CircularProgress size={16} sx={{ ml: 1 }} />}
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileRating; 