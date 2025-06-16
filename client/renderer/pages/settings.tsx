import React, 
    { useState, 
    useEffect 
} from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  IconButton,
  Divider,
  Snackbar,
  Alert,
  AlertColor,
  CircularProgress,
  DialogContent,
  DialogActions,
  Dialog,
  DialogTitle,
  DialogContentText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Navbar from '../components/Navbar';
import { apiGet, apiPut, api } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import 
  {
    Visibility, 
  VisibilityOff 
  } 
from '@mui/icons-material';

const Settings = () => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [photo, setPhoto] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError(null);

    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Unsupported format (only jpg/jpeg/png allowed)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2000000) {
      setError('File too large (max 2MB)');
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
    setPhoto(file);

    console.log("File URL", event.target.files[0].path);

  };

  const handleFileUpload = async () => {
    if (!previewImage) return;

    setIsUploading(true);
    try {
      // Here you would typically upload to your API
      // For demo, we'll just use the preview image

      const formData = new FormData();
      formData.append('photo', photo);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      await apiPut('/api/users/updatePhoto/', formData);

      setSnackbar({
        open: true,
        message: 'Changes saved successfully!',
        severity: 'success'
      });

      //onPhotoUpdate(previewImage);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save changes',
        severity: 'error'
      });
      console.error('Error updating user:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const [user, setUser] = useState({
    username: '',
    bio: '',
    email: '',
    location: '',
    photo: '',
  });

  const [editMode, setEditMode] = useState({
    name : false,
    username: false,
    bio: false,
    email: false,
    location: false,
  });

  const [tempValues, setTempValues] = useState({
    username: '',
    bio: '',
    email: '',
    location: '',
    photo: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState(''); 

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmDelete = () => {
    handleClose();
    handleDelete();
  };

  const { logout } = useAuthStore();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await apiGet('/api/users/me/');
        response.data.photo = api.defaults.baseURL + "/api" + response.data.photo;

        setUser(response.data);
        setTempValues({
          username: response.data.username,
          bio: response.data.bio || '',
          email: response.data.email,
          location: response.data.location || '',
          photo: response.data.photo || '',
        });
        console.log("Received photo:" + response.data.photo);
        // console.log("Received photo:" + tempValues.photo);
        // console.log("user photo:" + user.photo);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEditClick = (field) => {
    setEditMode(prev => ({ ...prev, [field]: true }));
  };

  const handleCancelEdit = (field) => {
    setEditMode(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => ({ ...prev, [field]: user[field] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempValues(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    try {
        console.log(user.username);
        await apiPut('/api/users/deleteUser/', user.username);
        setSnackbar({
            open: true,
            message: 'Changes saved successfully!',
            severity: 'success'
          });
        setTimeout(() => {
            logout();
        } , 3000);
    }
    catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to save changes',
          severity: 'error'
        });
        console.error('Error updating user:', err);
      }
  }

  const handleNameSave = async (field) => {
    try {
        const updatedUser = { ...user, [field]: tempValues[field] };
        console.log(updatedUser.username);
        await apiPut('/api/users/updateName/', {new_name:updatedUser.username});
        setUser(updatedUser);
        setEditMode(prev => ({ ...prev, [field]: false }));
        setSnackbar({
          open: true,
          message: 'Changes saved successfully!',
          severity: 'success'
        });
      } 
      catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to save changes',
          severity: 'error'
        });
        console.error('Error updating user:', err);
      }
  }

  const handleEmailSave = async (field) => {
    try {
        const updatedUser = { ...user, [field]: tempValues[field] };
        console.log(updatedUser.email);
        await apiPut('/api/users/updateEmail/', {new_email:updatedUser.email});
        setUser(updatedUser);
        setEditMode(prev => ({ ...prev, [field]: false }));
        setSnackbar({
          open: true,
          message: 'Changes saved successfully!',
          severity: 'success'
        });
      } 
      catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to save changes',
          severity: 'error'
        });
        console.error('Error updating user:', err);
      }
  }

  const handleBioSave = async (field) => {
    try {
      const updatedUser = { ...user, [field]: tempValues[field] };
      console.log(updatedUser.username);
      await apiPut('/api/users/updateBio/', {new_bio:updatedUser.bio});
      setUser(updatedUser);
      setEditMode(prev => ({ ...prev, [field]: false }));
      setSnackbar({
        open: true,
        message: 'Changes saved successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save changes',
        severity: 'error'
      });
      console.error('Error updating user:', err);
    }
  };

  const handleLocationSave = async (field) => {
    try {
      const updatedUser = { ...user, [field]: tempValues[field] };
      console.log(updatedUser.location);
      await apiPut('/api/users/updateLocation/', {new_location:updatedUser.location});
      setUser(updatedUser);
      setEditMode(prev => ({ ...prev, [field]: false }));
      setSnackbar({
        open: true,
        message: 'Changes saved successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save changes',
        severity: 'error'
      });
      console.error('Error updating user:', err);
    }
  };

  const handleSave = async (field) => {
    try {
      const updatedUser = { ...user, [field]: tempValues[field] };
      console.log(updatedUser.username);
      await apiPut('/api/users/me/', updatedUser);
      setUser(updatedUser);
      setEditMode(prev => ({ ...prev, [field]: false }));
      setSnackbar({
        open: true,
        message: 'Changes saved successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save changes',
        severity: 'error'
      });
      console.error('Error updating user:', err);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePasswordChangeClick = () => {
    setPasswordDialogOpen(true);
    setPasswordData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      showOldPassword: false,
      showNewPassword: false,
      showConfirmPassword: false
    });
    setPasswordError('');
  };

  const handlePasswordChangeSubmit = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
  
    try {
      await apiPut('api/auth/change-password/', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword
      });
  
      setPasswordDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Password changed successfully!',
        severity: 'success'
      });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
      console.error('Error changing password:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6" color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box 
    sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <Navbar />
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, p: 5}}>
        <Paper elevation={3} sx={{ padding: '40px', borderRadius: '15px', maxWidth: '800px', width: '100%' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
            Account Settings
          </Typography>

          {/* Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
      <Avatar
        alt={user.username}
        src={previewImage ||  user.photo}
        sx={{ width: 100, height: 100, mr: 3 }}
      />
      
      <Box>
        <input
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          id="profile-photo-upload"
          type="file"
          onChange={handleFileChange}
        />
        
        <label htmlFor="profile-photo-upload">
          <Button
            variant="contained"
            color="primary"
            component="span"
            disabled={isUploading}
          >
            Change Profile Photo
          </Button>
        </label>
        
        {previewImage && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleFileUpload}
              disabled={isUploading}
              sx={{ mt: 1 }}
            >
              {isUploading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Upload Photo'
              )}
            </Button>
          </Box>
        )}
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
      

          <Divider sx={{ my: 3 }} />

          {/* Editable Fields */}
          <Grid container spacing={3}>
            {/* Name Field */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ mr: 2, minWidth: '100px' }}>
                  Name:
                </Typography>
                {editMode.username ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <TextField
                      name="username"
                      value={tempValues.username}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                    />
                    <IconButton color="primary" onClick={() => handleNameSave('username')}>
                      <SaveIcon />
                    </IconButton>
                    <Button onClick={() => handleCancelEdit('username')}>Cancel</Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {user.username}
                    </Typography>
                    <IconButton onClick={() => handleEditClick('username')}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Email Field */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ mr: 2, minWidth: '100px' }}>
                  Email:
                </Typography>
                {editMode.email ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <TextField
                      name="email"
                      value={tempValues.email}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      type="email"
                    />
                    <IconButton color="primary" onClick={() => handleEmailSave('email')}>
                      <SaveIcon />
                    </IconButton>
                    <Button onClick={() => handleCancelEdit('email')}>Cancel</Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {user.email}
                    </Typography>
                    <IconButton onClick={() => handleEditClick('email')}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Location Field */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ mr: 2, minWidth: '100px' }}>
                  Location:
                </Typography>
                {editMode.location ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <TextField
                      name="location"
                      value={tempValues.location}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                    />
                    <IconButton color="primary" onClick={() => handleLocationSave('location')}>
                      <SaveIcon />
                    </IconButton>
                    <Button onClick={() => handleCancelEdit('location')}>Cancel</Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      {user.location || '-'}
                    </Typography>
                    <IconButton onClick={() => handleEditClick('location')}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Bio Field */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Typography variant="subtitle1" sx={{ mr: 2, minWidth: '100px', mt: 1 }}>
                  Bio:
                </Typography>
                {editMode.bio ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <TextField
                      name="bio"
                      value={tempValues.bio}
                      onChange={handleInputChange}
                      fullWidth
                      multiline
                      rows={4}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button 
                        startIcon={<SaveIcon />} 
                        onClick={() => handleBioSave('bio')}
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button onClick={() => handleCancelEdit('bio')}>Cancel</Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1, whiteSpace: 'pre-wrap' }}>
                      {user.bio || '-'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton onClick={() => handleEditClick('bio')}>
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Account Actions Section */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Account Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handlePasswordChangeClick}
          >
            Change Password
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleClickOpen}>
            Delete Account
          </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
        
      </Snackbar>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
  <DialogTitle>Change Password</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Please enter your current password and your new password.
    </DialogContentText>
    
    {/* Current Password */}
    <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
      <TextField
        autoFocus
        margin="dense"
        label="Current Password"
        type={passwordData.showOldPassword ? "text" : "password"}
        fullWidth
        variant="standard"
        value={passwordData.oldPassword}
        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
      />
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => setPasswordData({...passwordData, showOldPassword: !passwordData.showOldPassword})}
        edge="end"
      >
        {passwordData.showOldPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </Box>
    
    {/* New Password */}
    <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
      <TextField
        margin="dense"
        label="New Password"
        type={passwordData.showNewPassword ? "text" : "password"}
        fullWidth
        variant="standard"
        value={passwordData.newPassword}
        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
      />
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => setPasswordData({...passwordData, showNewPassword: !passwordData.showNewPassword})}
        edge="end"
      >
        {passwordData.showNewPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </Box>
    
    {/* Confirm New Password */}
    <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
      <TextField
        margin="dense"
        label="Confirm New Password"
        type={passwordData.showConfirmPassword ? "text" : "password"}
        fullWidth
        variant="standard"
        value={passwordData.confirmPassword}
        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
      />
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => setPasswordData({...passwordData, showConfirmPassword: !passwordData.showConfirmPassword})}
        edge="end"
      >
        {passwordData.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </Box>
    
    {passwordError && (
      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
        {passwordError}
      </Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
    <Button onClick={handlePasswordChangeSubmit}>Change Password</Button>
  </DialogActions>
</Dialog>

<Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Account Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete your account? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Settings;