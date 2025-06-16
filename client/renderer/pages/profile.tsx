import React, { useEffect, useState } from 'react';
import { 
  Box, 
    Typography, 
    Avatar, 
    Paper, 
  Grid, 
  Button, 
  TextField, 
  IconButton, 
  Divider,
  Link,
  CircularProgress,
  Chip,
  Container,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Close as CloseIcon,
  GitHub as GitHubIcon,
  Twitter as TwitterIcon,
  Language as WebsiteIcon
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { apiGet, apiPost, apiPut, apiDelete, api } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

const Profile = () => {
  // States for edit mode of different profile sections
  const [editingBio, setEditingBio] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [editingGithub, setEditingGithub] = useState(false);
  const [editingTwitter, setEditingTwitter] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);

  // Temporary states for editing
  const [tempBio, setTempBio] = useState('');
  const [tempLocation, setTempLocation] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [tempWebsite, setTempWebsite] = useState('');
  const [tempGithub, setTempGithub] = useState('');
  const [tempTwitter, setTempTwitter] = useState('');
  const [tempInterests, setTempInterests] = useState('');

  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  const [user, setUser] = useState({
    name: '',
    username: '',
    bio: '',
    email: '',
    location: '',
    photo: '',
    date_joined: '',
    title: '',
    website: '',
    github: '',
    twitter: '',
    interests: '',
  });

  const { accessToken, isAuthenticated } = useAuthStore();

  // State to handle loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Loading states for saving operations
  const [savingBio, setSavingBio] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [savingGithub, setSavingGithub] = useState(false);
  const [savingTwitter, setSavingTwitter] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);

  // Handle alert close
  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  // Show alert function
  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile data
        const response = await apiGet('/api/users/me/');

        if (response.data.photo) {
        response.data.photo = api.defaults.baseURL + "/api" + response.data.photo;
        }

        const cur_user = response.data;

        // Format date for display
        const formattedDate = new Date(cur_user.date_joined).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
          
        cur_user.date_joined = formattedDate;
        setUser(cur_user);
        
        // Set temp values for editing
        setTempBio(cur_user.bio || '');
        setTempLocation(cur_user.location || '');
        setTempTitle(cur_user.title || '');
        setTempWebsite(cur_user.website || '');
        setTempGithub(cur_user.github || '');
        setTempTwitter(cur_user.twitter || '');
        setTempInterests(cur_user.interests || '');
        
      } catch (err) {
        setError(err.message);
        showAlert('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Save bio handler
  const handleSaveBio = async () => {
    try {
      setSavingBio(true);
      await apiPut('/api/users/updateBio/', { new_bio: tempBio });
      setUser(prev => ({ ...prev, bio: tempBio }));
      setEditingBio(false);
      showAlert('Bio updated successfully', 'success');
    } catch (err) {
      console.error('Error updating bio:', err);
      showAlert('Failed to update bio', 'error');
    } finally {
      setSavingBio(false);
    }
  };

  // Save location handler
  const handleSaveLocation = async () => {
    try {
      setSavingLocation(true);
      await apiPut('/api/users/updateLocation/', { new_location: tempLocation });
      setUser(prev => ({ ...prev, location: tempLocation }));
      setEditingLocation(false);
      showAlert('Location updated successfully', 'success');
    } catch (err) {
      console.error('Error updating location:', err);
      showAlert('Failed to update location', 'error');
    } finally {
      setSavingLocation(false);
    }
  };

  // Save title handler
  const handleSaveTitle = async () => {
    try {
      setSavingTitle(true);
      await apiPut('/api/users/updateTitle/', { new_title: tempTitle });
      setUser(prev => ({ ...prev, title: tempTitle }));
      setEditingTitle(false);
      showAlert('Title updated successfully', 'success');
    } catch (err) {
      console.error('Error updating title:', err);
      showAlert('Failed to update title', 'error');
    } finally {
      setSavingTitle(false);
    }
  };

  // Save website handler
  const handleSaveWebsite = async () => {
    try {
      setSavingWebsite(true);
      await apiPut('/api/users/updateWebsite/', { new_website: tempWebsite });
      setUser(prev => ({ ...prev, website: tempWebsite }));
      setEditingWebsite(false);
      showAlert('Website updated successfully', 'success');
    } catch (err) {
      console.error('Error updating website:', err);
      showAlert('Failed to update website', 'error');
    } finally {
      setSavingWebsite(false);
    }
  };

  // Save github handler
  const handleSaveGithub = async () => {
    try {
      setSavingGithub(true);
      await apiPut('/api/users/updateGithub/', { new_github: tempGithub });
      setUser(prev => ({ ...prev, github: tempGithub }));
      setEditingGithub(false);
      showAlert('GitHub profile updated successfully', 'success');
    } catch (err) {
      console.error('Error updating GitHub:', err);
      showAlert('Failed to update GitHub profile', 'error');
    } finally {
      setSavingGithub(false);
    }
  };

  // Save twitter handler
  const handleSaveTwitter = async () => {
    try {
      setSavingTwitter(true);
      await apiPut('/api/users/updateTwitter/', { new_twitter: tempTwitter });
      setUser(prev => ({ ...prev, twitter: tempTwitter }));
      setEditingTwitter(false);
      showAlert('Twitter profile updated successfully', 'success');
    } catch (err) {
      console.error('Error updating Twitter:', err);
      showAlert('Failed to update Twitter profile', 'error');
    } finally {
      setSavingTwitter(false);
    }
  };

  // Save interests handler
  const handleSaveInterests = async () => {
    try {
      setSavingInterests(true);
      await apiPut('/api/users/updateInterests/', { new_interests: tempInterests });
      setUser(prev => ({ ...prev, interests: tempInterests }));
      setEditingInterests(false);
      showAlert('Interests updated successfully', 'success');
    } catch (err) {
      console.error('Error updating interests:', err);
      showAlert('Failed to update interests', 'error');
    } finally {
      setSavingInterests(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Display error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 5 }}>
        <Paper 
          elevation={1} 
    sx={{
            p: 3, 
            borderRadius: 2,
      display: 'flex',
            flexDirection: 'column',
      alignItems: 'center',
            mb: 3
          }}
        >
      <Avatar
        alt={user.name}
        src={user.photo}
        sx={{
              width: 150,
              height: 150,
              mb: 2,
              border: '3px solid #1976d2',
            }}
          />
          
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
        {user.name}
      </Typography>

          {/* Title/Occupation */}
          {editingTitle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', maxWidth: '500px' }}>
              <TextField
                fullWidth
                size="small"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="Your title/occupation"
                disabled={savingTitle}
              />
              <IconButton color="primary" onClick={handleSaveTitle} disabled={savingTitle}>
                {savingTitle ? <CircularProgress size={20} /> : <SaveIcon />}
              </IconButton>
              <IconButton onClick={() => setEditingTitle(false)} disabled={savingTitle}>
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                {user.title || 'Add your title/occupation'}
              </Typography>
              <IconButton size="small" onClick={() => setEditingTitle(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        @{user.username}
      </Typography>

          <Divider sx={{ width: '100%', maxWidth: '700px', my: 2 }} />
          
          <Grid container spacing={3} sx={{ maxWidth: '700px' }}>
            {/* Bio */}
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                
                {editingBio ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      placeholder="Write something about yourself"
                      sx={{ mb: 1 }}
                      disabled={savingBio}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        startIcon={savingBio ? <CircularProgress size={20} /> : <SaveIcon />} 
                        variant="contained" 
                        size="small" 
                        onClick={handleSaveBio}
                        sx={{ mr: 1 }}
                        disabled={savingBio}
                      >
                        {savingBio ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        startIcon={<CloseIcon />} 
                        variant="outlined" 
                        size="small" 
                        onClick={() => setEditingBio(false)}
                        disabled={savingBio}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="body1" sx={{ fontStyle: user.bio ? 'normal' : 'italic' }}>
                      {user.bio || 'Add a bio to tell people about yourself'}
                    </Typography>
                    <IconButton size="small" onClick={() => setEditingBio(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Location */}
            <Grid item xs={12} md={6}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Location
                </Typography>
                
                {editingLocation ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={tempLocation}
                      onChange={(e) => setTempLocation(e.target.value)}
                      placeholder="Your location"
                      disabled={savingLocation}
                    />
                    <IconButton color="primary" onClick={handleSaveLocation} disabled={savingLocation}>
                      {savingLocation ? <CircularProgress size={20} /> : <SaveIcon />}
                    </IconButton>
                    <IconButton onClick={() => setEditingLocation(false)} disabled={savingLocation}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontStyle: user.location ? 'normal' : 'italic' }}>
                      {user.location || 'Add your location'}
                    </Typography>
                    <IconButton size="small" onClick={() => setEditingLocation(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Email */}
            <Grid item xs={12} md={6}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </Box>
            </Grid>
            
            {/* Member Since */}
            <Grid item xs={12} md={6}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Member Since
                </Typography>
                <Typography variant="body1">
        {user.date_joined}
      </Typography>
              </Box>
            </Grid>
            
            {/* Interests */}
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Interests
      </Typography>

                {editingInterests ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={tempInterests}
                      onChange={(e) => setTempInterests(e.target.value)}
                      placeholder="Your interests (comma separated)"
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        startIcon={savingInterests ? <CircularProgress size={20} /> : <SaveIcon />} 
                        variant="contained" 
                        size="small" 
                        onClick={handleSaveInterests}
                        sx={{ mr: 1 }}
                        disabled={savingInterests}
                      >
                        {savingInterests ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        startIcon={<CloseIcon />} 
                        variant="outlined" 
                        size="small" 
                        onClick={() => setEditingInterests(false)}
                        disabled={savingInterests}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      {user.interests ? (
                        user.interests.split(',').map((interest, index) => (
                          <Chip 
                            key={index} 
                            label={interest.trim()} 
                            sx={{ m: 0.5 }} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          Add your interests
          </Typography>
                      )}
                    </Box>
                    <IconButton size="small" onClick={() => setEditingInterests(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
        </Grid>
            
            {/* Social profiles */}
        <Grid item xs={12}>
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Social Profiles
                </Typography>
                
                {/* Website */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WebsiteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  
                  {editingWebsite ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={tempWebsite}
                        onChange={(e) => setTempWebsite(e.target.value)}
                        placeholder="Your website URL"
                        disabled={savingWebsite}
                      />
                      <IconButton color="primary" onClick={handleSaveWebsite} disabled={savingWebsite}>
                        {savingWebsite ? <CircularProgress size={20} /> : <SaveIcon />}
                      </IconButton>
                      <IconButton onClick={() => setEditingWebsite(false)} disabled={savingWebsite}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      {user.website ? (
                        <Link href={user.website} target="_blank" rel="noopener" sx={{ flexGrow: 1 }}>
                          {user.website}
                        </Link>
                      ) : (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', flexGrow: 1 }}>
                          Add your website
                        </Typography>
                      )}
                      <IconButton size="small" onClick={() => setEditingWebsite(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
                
                {/* GitHub */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GitHubIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  
                  {editingGithub ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={tempGithub}
                        onChange={(e) => setTempGithub(e.target.value)}
                        placeholder="Your GitHub profile URL"
                        disabled={savingGithub}
                      />
                      <IconButton color="primary" onClick={handleSaveGithub} disabled={savingGithub}>
                        {savingGithub ? <CircularProgress size={20} /> : <SaveIcon />}
                      </IconButton>
                      <IconButton onClick={() => setEditingGithub(false)} disabled={savingGithub}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      {user.github ? (
                        <Link href={user.github} target="_blank" rel="noopener" sx={{ flexGrow: 1 }}>
                          {user.github}
                        </Link>
                      ) : (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', flexGrow: 1 }}>
                          Add your GitHub profile
                        </Typography>
                      )}
                      <IconButton size="small" onClick={() => setEditingGithub(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
                
                {/* Twitter */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TwitterIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  
                  {editingTwitter ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={tempTwitter}
                        onChange={(e) => setTempTwitter(e.target.value)}
                        placeholder="Your Twitter profile URL"
                        disabled={savingTwitter}
                      />
                      <IconButton color="primary" onClick={handleSaveTwitter} disabled={savingTwitter}>
                        {savingTwitter ? <CircularProgress size={20} /> : <SaveIcon />}
                      </IconButton>
                      <IconButton onClick={() => setEditingTwitter(false)} disabled={savingTwitter}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      {user.twitter ? (
                        <Link href={user.twitter} target="_blank" rel="noopener" sx={{ flexGrow: 1 }}>
                          {user.twitter}
                        </Link>
                      ) : (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', flexGrow: 1 }}>
                          Add your Twitter profile
        </Typography>
                      )}
                      <IconButton size="small" onClick={() => setEditingTwitter(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
        </Grid>
      </Grid>
    </Paper>
      </Container>
      
      {/* Alert Snackbar */}
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={4000} 
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertSeverity} 
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;