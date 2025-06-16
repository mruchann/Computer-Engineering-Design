import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import Navbar from '../components/Navbar';
import { apiGet, api } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

interface User {
  id: number;
  username: string;
  photo?: string;
  bio?: string;
  location?: string;
  email?: string;
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  // Load all users initially
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiGet('/api/users/');
        
        if (response && response.data) {
          
          const processedUsers = response.data.map(user => {
            
            //photo url format is different from get /users/me
            const formattedPhoto = user.photo ? user.photo.replace("8000/", "8000/api/") : null;;
            console.log("Formatted photo URL:", formattedPhoto);
            
            return {
              ...user,
              photo: formattedPhoto
            };
          });
          
          setUsers(processedUsers);
          setFilteredUsers(processedUsers);
          setError(null);
        } else {
          setError('Failed to retrieve users, please try again');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to retrieve users, please try again');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // search by username
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredUsers(users);
  };

  // Show user details in dialog
  const handleViewDetails = (user: User) => {
    console.log("User details clicked - Photo URL:", user.photo);
    
    setSelectedUser(user);
    setUserPhotoUrl(user.photo);
    
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: { sm: 8 },
          width: { sm: `calc(100% - 240px)` }
        }}
      >
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Users
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 3, mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          {filteredUsers.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No users found matching your search criteria.
            </Typography>
          ) : (
            <List sx={{ width: '100%' }}>
              {filteredUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar 
                        alt={user.username} 
                        src={user.photo}
                        sx={{ width: 56, height: 56, mr: 1 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="h6" component="span">
                          {user.username}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          {user.location && (
                            <Typography variant="body2" component="span">
                              {user.location}
                            </Typography>
                          )}
                          {user.bio && (
                            <Typography 
                              variant="body2" 
                              color="textSecondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mt: 0.5
                              }}
                            >
                              {user.bio}
                            </Typography>
                          )}
                          <Box sx={{ mt: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<InfoIcon />}
                              onClick={() => handleViewDetails(user)}
                            >
                              Details
                            </Button>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredUsers.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* User Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={handleCloseDetails}
          maxWidth="sm"
          fullWidth
        >
          {selectedUser && (
            <>
              <DialogTitle>
                User Details
                <IconButton
                  aria-label="close"
                  onClick={handleCloseDetails}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={4}>
                    <Avatar
                      alt={selectedUser.username}
                      src={userPhotoUrl}
                      sx={{ width: 120, height: 120, mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="h5" gutterBottom>
                      {selectedUser.username}
                    </Typography>
                    
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      {selectedUser.email}
                    </Typography>
                    
                    {selectedUser.location && (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        <strong>Location:</strong> {selectedUser.location}
                      </Typography>
                    )}
                    
                    {selectedUser.bio && (
                      <>
                        <Typography variant="body1" sx={{ mt: 2 }}>
                          <strong>Bio:</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {selectedUser.bio}
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDetails}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
};

export default Users;