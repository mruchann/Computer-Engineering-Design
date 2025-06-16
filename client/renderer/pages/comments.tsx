// components/CommentsFeedback.tsx
import { 
    useState,
    useEffect, 
} from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Rating,
  Divider,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  Snackbar,
  useTheme,
  CircularProgress,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { 
    Send as SendIcon, 
    Email as EmailIcon,
    Sort as SortIcon,
    Star as StarIcon,
    CalendarToday as CalendarIcon,
} 
from '@mui/icons-material';
import { 
    apiGet, 
    apiPut, 
    apiPost,
    api,
} from '../utils/api';
import Navbar from '../components/Navbar';


interface Feedback {
  id: string;
  text: string;
  rate: number;
  email: string;
  date: string;
}

export default function CommentsFeedback() {
  const theme = useTheme();
  const [feedbackText, setFeedbackText] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5; 
  const [sortBy, setSortBy] = useState<'date' | 'rate'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const paginatedFeedbacks = feedbacks.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Format the date from Django's auto_now_add DateTimeField
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loadFeedbacks = async () => {
    try {
      const queryData = {
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      };
      
      const response = await apiPost('/api/feedback/load/', queryData);
      
      if (response.data && Array.isArray(response.data)) {
        const formattedFeedbacks = response.data.map((feedback: Feedback) => ({
          ...feedback,
          date: formatDate(feedback.date),
        }));
        
        setFeedbacks(formattedFeedbacks); // This should trigger a re-render
      } else {
        console.error('Unexpected response format:', response);
        setFeedbacks([]); // Fallback to empty array
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      setFeedbacks([]); // Fallback to empty array
    }
  };
  

  const handleSortChange = (
    event: React.MouseEvent<HTMLElement>,
    newSortBy: 'date' | 'rate' | null,
  ) => {
    if (newSortBy !== null) {
      // If clicking the same sort button, toggle the order
      if (newSortBy === sortBy) {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // If clicking a different sort button, set to default order (desc)
        setSortBy(newSortBy);
        setSortOrder('desc');
      }
      setPage(1); // Reset to first page when sorting changes
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Basic validation
    if (!feedbackText.trim()) {
      setError('Please enter your feedback');
      setIsSubmitting(false);
      return;
    }
    
    if (!rate) {
      setError('Please provide a rating');
      setIsSubmitting(false);
      return;
    }
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email');
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare the data to send to the API
      const feedbackData = {
        text: feedbackText,
        rate: rate,
        email: email,
      };



      // Use your apiPost function to send the feedback
      const response = await apiPost('/api/feedback/', feedbackData);

      const newFeedback: Feedback = {
        ...response.data,
        date: formatDate(response.data.date),
      };

      setFeedbacks([newFeedback, ...feedbacks]);
      setFeedbackText('');
      setRate(null);
      setEmail('');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const sanitizeEmail = (email: string): string => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email; 
    
    const sanitizedName = name.charAt(0) + '*'.repeat(Math.max(0, name.length - 1));
    return `${sanitizedName}@${domain}`;
  };

  useEffect(() => {
    loadFeedbacks();
  }, [sortBy, sortOrder, page]);

  return (
    <Box 
    sx={{
        display: 'flex',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
    <Navbar/>

    <Box sx={{ p: 3, 
            maxWidth: 800,
            margin: '0 auto',
            flexGrow: 1,  
            mt: 8,
          width: { sm: `calc(100% - ${72}px)`} }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Feedback & Comments
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ mb: 3 }}>
        We value your feedback! Please share your thoughts about our service and help us improve.
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Share Your Feedback
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="Your Feedback"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography component="legend" sx={{ mb: 1 }}>
              Rating
            </Typography>
            <Rating
              name="feedback-rating"
              value={rate}
              onChange={(_, newValue) => setRate(newValue)}
              precision={0.5}
              size="large"
            />
          </Box>
          
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
            InputProps={{
              startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            endIcon={isSubmitting ? <CircularProgress size={24} /> : <SendIcon />}
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </Paper>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h5" gutterBottom>
        Recent Feedback
      </Typography>

      <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={handleSortChange}
            aria-label="sort by"
            size="small"
          >
            <ToggleButton value="date" aria-label="sort by date">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              {sortBy === 'date' ? (sortOrder === 'desc' ? 'Newest' : 'Oldest') : 'Date'}
            </ToggleButton>
            <ToggleButton value="rate" aria-label="sort by rating">
              <StarIcon fontSize="small" sx={{ mr: 1 }} />
              {sortBy === 'rate' ? (sortOrder === 'desc' ? 'Highest' : 'Lowest') : 'Rating'}
            </ToggleButton>
      </ToggleButtonGroup>

      

      {feedbacks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No feedback submitted yet. Be the first to share your thoughts!
        </Typography>
      ) : (
        <>
        <List sx={{ width: '100%' }}>
          {paginatedFeedbacks.map((feedback) => (
            <Paper key={feedback.id} elevation={2} sx={{ mb: 2 }}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {feedback.email.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight="bold">
                        {sanitizeEmail(feedback.email)}

                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {feedback.date}
                        </Typography>
                      </Box>
                      <Rating
                        value={feedback.rate}
                        precision={0.5}
                        readOnly
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </>
                  }
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'inline-block', mt: 1 }}
                    >
                      {feedback.text}
                    </Typography>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(feedbacks.length / itemsPerPage)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>
      </>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Thank you for your feedback!"
      />
    </Box>

    </Box>
  );
}