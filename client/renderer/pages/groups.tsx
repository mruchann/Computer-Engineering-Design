import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Paper, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Snackbar,
  Alert,
  Pagination,
  Avatar
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { 
  Add as AddIcon, 
  Group as GroupIcon, 
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
    CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/useAuthStore';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import Navbar from '../components/Navbar';
import { useNotificationStore } from '../components/NotificationStore';
import GroupManagementDialog from '../components/GroupManagementDialog';
import GroupChat from '../components/GroupChat';

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Membership {
  id: string;
  user: User;
  group: Group;
  date_joined: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, User[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // Add state for online users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [successNotification, setSuccessNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ''
  });
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [openManageDialog, setOpenManageDialog] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChatGroup, setSelectedChatGroup] = useState<Group | null>(null);

  const { addNotification } = useNotificationStore();

  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      fetchGroups();
      fetchUsers();
      fetchCurrentUser();
    }
  }, [accessToken]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/groups/my-groups/');

      const groups = response.data.filter((group : Group) => group.name != "Public Share") ;

      setGroups(groups);
      groups.forEach((group : Group) => {
        console.log("group:"+ group.name);
      }); 
      
      // Fetch members for each group
      groups.forEach((group: Group) => {
        fetchGroupMembers(group.id);
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to fetch groups');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiGet('/api/users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await apiGet('/api/users/me/');
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
      // If we can't get the current user, we'll try to add them to the group later
      // using the user ID from the membership response
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      // First get all memberships
      const membershipsResponse = await apiGet('/api/memberships/');
      console.log('Memberships response:', membershipsResponse.data);
      
      // Filter memberships for this group - handle both string and object group references
      const memberships = membershipsResponse.data.filter(
        (membership: any) => {
          // Check if the group is a string ID or an object with an id property
          const membershipGroupId = typeof membership.group === 'string' 
            ? membership.group 
            : membership.group.id;
          
          //console.log(`Comparing group IDs: ${membershipGroupId} vs ${groupId}`);
          return membershipGroupId === groupId;
        }
      );
      
      //console.log(`Memberships for group ${groupId}:`, memberships);
      
      if (memberships.length === 0) {
        console.log(`No members found for group ${groupId}`);
        setGroupMembers(prev => ({
          ...prev,
          [groupId]: []
        }));
        return;
      }
      
      // Extract user IDs from memberships
      const memberUserIds = memberships.map((membership: any) => 
        typeof membership.user === 'string' ? membership.user : membership.user.id
      );
      console.log('Member user IDs:', memberUserIds);
      
      // Fetch all users to get their details
      const usersResponse = await apiGet('/api/users/');
      console.log('All users response:', usersResponse.data);
      
      // Filter users that are members of this group
      const groupMemberUsers = usersResponse.data.filter((user: User) => 
        memberUserIds.includes(user.id)
      );
      console.log('Filtered group members:', groupMemberUsers);
      
      setGroupMembers(prev => ({
        ...prev,
        [groupId]: groupMemberUsers
      }));
    } catch (err) {
      console.error(`Error fetching members for group ${groupId}:`, err);
      // Set empty array for this group to avoid loading indicator showing indefinitely
      setGroupMembers(prev => ({
        ...prev,
        [groupId]: []
      }));
    }
  };

  // fetching online users
  const fetchOnlineUsers = async () => {
    try {
      const response = await apiGet('/api/users/online/');
      if (response && response.data) {
        console.log('Online users response:', response.data);
        setOnlineUsers(response.data);
      }
    } catch (err) {
      console.error('Error fetching online users:', err);
    }
  };

  
  useEffect(() => {
    if (accessToken) {
      fetchOnlineUsers();
      
      // Poll for online users every 10 seconds
      const interval = setInterval(() => {
        fetchOnlineUsers();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  const handleCreateGroup = async () => {
    try {
      // Generate a random AES key (32 characters)
      const aes_key = Array.from(Array(32), () => Math.floor(Math.random() * 36).toString(36)).join('');
      
      // First create the group
      const groupResponse = await apiPost('/api/groups/', {
        name: newGroupName,
        description: newGroupDescription,
        aes_key: aes_key
      });
      
      const newGroup = groupResponse.data;
      setGroups([...groups, newGroup]);
      
      // Add the current user as a member of the new group
      try {
        // If we don't have current user info, fetch it first
        let username;
        if (!currentUser) {
          const userResponse = await apiGet('/api/users/me/');
          setCurrentUser(userResponse.data);
          username = userResponse.data.username;
        } else {
          username = currentUser.username;
        }
        
        // Add user to the group
        await apiPost('/api/memberships/add/', {
          username: username,
          group: newGroup.name
        });
        
        // Update the group members
        fetchGroupMembers(newGroup.id);
        
        setOpenCreateDialog(false);
        setNewGroupName('');
        setNewGroupDescription('');
        showSnackbar('Group created successfully', 'success');
        addNotification({
          text: `Group ${newGroup.name} has been created successfully!`,
          time: new Date().toLocaleTimeString(),
        });
        
      } catch (membershipErr) {
        console.error('Error adding creator to group:', membershipErr);
        // Still show success since the group was created
        setOpenCreateDialog(false);
        setNewGroupName('');
        setNewGroupDescription('');
        showSnackbar('Group created, but there was an issue adding you as a member', 'warning');
      }
    } catch (err: any) {
      console.error('Error creating group:', err);
      
      // Check if it's a unique constraint violation
      if (err.response && err.response.status === 500) {
        showSnackbar('A group with this name or description already exists', 'error');
      } else {
        showSnackbar('Failed to create group: ' + (err.response?.data?.detail || 'Unknown error'), 'error');
      }
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // First, check if the group has members other than the current user
      const membershipsResponse = await apiGet('/api/memberships/');
      
      // Filter memberships for this group
      const groupMemberships = membershipsResponse.data.filter(
        (membership: any) => {
          const membershipGroupId = typeof membership.group === 'string' 
            ? membership.group 
            : membership.group.id;
          
          return membershipGroupId === groupId;
        }
      );
      
      console.log(`Memberships for group ${groupId}:`, groupMemberships);
      
      // Extract user IDs from memberships
      const memberUserIds = groupMemberships.map((membership: any) => 
        typeof membership.user === 'string' ? membership.user : membership.user.id
      );
      
      // Check if there are members other than the current user
      const otherMembers = memberUserIds.filter(id => id !== currentUser?.id);
      
      if (otherMembers.length > 0) {
        showSnackbar('Cannot delete group with other members. Remove all members first.', 'error');
        return;
      }
      
      // If the current user is a member, remove them from the group
      if (memberUserIds.includes(currentUser?.id)) {
        await apiPost('/api/memberships/delete/', {
          user: currentUser?.id,
          group: groupId
        });
        console.log(`Removed current user from group ${groupId}`);
      }
      
      // Now delete the empty group
      await apiDelete(`/api/groups/${groupId}/`);
      
      // Update the UI
      setGroups(groups.filter(group => group.id !== groupId));
      showSnackbar('Group deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting group:', err);
      
      if (err.response && err.response.status === 404) {
        // If the group is already deleted, still remove it from the UI
        setGroups(groups.filter(group => group.id !== groupId));
        showSnackbar('Group already deleted', 'success');
      } else {
        showSnackbar('Failed to delete group: ' + (err.response?.data?.detail || 'Unknown error'), 'error');
      }
    }
  };

  const handleCloseSuccessNotification = () => {
    setSuccessNotification({
      show: false,
      message: ''
    });
  };

  const handleAddUser = async (user: User) => {
    try {
      console.log(`Adding user ${user.username} (${user.id}) to group ${selectedGroup?.name} (${selectedGroup?.id})`);
      
      await apiPost('/api/memberships/add/', {
        username: user.username,
        group: selectedGroup?.name
      });
      
      // Update the group members
      fetchGroupMembers(selectedGroup?.id || '');
      setOpenAddUserDialog(false);
      setSelectedUsers([]);
      
      showSnackbar(`Successfully added ${user.username} to the group`, 'success');
      setSuccessNotification({
        show: true,
        message: `Added ${user.username} to the group ${selectedGroup?.name}`
      });
      addNotification({
        text: `Added ${user.username} to the group ${selectedGroup?.name}`,
        time: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error(`Error adding user ${user.username} to group:`, err);
      showSnackbar('Failed to add user: ' + (err.response?.data?.detail || 'Unknown error'), 'error');
    }
  };

  const handleRemoveUser = async (groupId: string, userId: string) => {
    try {
      console.log(`Removing user ${userId} from group ${groupId}`);
      
      await apiPost('/api/memberships/delete/', {
        user: userId,
        group: groupId
      });
      
      // Update the group members
      fetchGroupMembers(groupId);
      showSnackbar('User removed from group successfully', 'success');
    } catch (err: any) {
      console.error('Error removing user from group:', err);
      
      if (err.response && err.response.status === 400) {
        // If the membership is not found, still update the UI
        fetchGroupMembers(groupId);
        showSnackbar('User is not a member of this group', 'info');
      } else {
        showSnackbar('Failed to remove user: ' + (err.response?.data?.detail || 'Unknown error'), 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageGroups = groups.slice(startIndex, endIndex);

  // Add function to toggle user selection
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleOpenManageDialog = (group: Group) => {
    setSelectedGroup(group);
    setOpenManageDialog(true);
  };

  const handleCloseManageDialog = () => {
    setOpenManageDialog(false);
    setSelectedGroup(null);
  };

  const handleOpenChat = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation(); // Prevent the card click from opening the management dialog
    setSelectedChatGroup(group);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedChatGroup(null);
  };

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

      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        {!isAuthenticated ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">Authentication Required</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
              Please log in to view and manage your groups
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </Paper>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                My Groups
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
              >
                Create Group
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : groups.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6">You don't have any groups yet</Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                  Create a group to start sharing files with team members
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  sx={{ mt: 2 }}
                  onClick={() => setOpenCreateDialog(true)}
                >
                  Create Your First Group
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={3}>
                  {currentPageGroups.map((group) => (
                    <Grid item xs={12} md={6} key={group.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 6,
                          },
                        }}
                        onClick={() => handleOpenManageDialog(group)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" component="div">
                              {group.name}
                            </Typography>
                            <IconButton size="small">
                              <SettingsIcon />
                            </IconButton>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {group.description}
                          </Typography>
                          
                          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                            Members:
                          </Typography>
                          
                          {groupMembers[group.id] ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {groupMembers[group.id]
                              .slice()
                              .sort((a, b) => {
                                const aIsOnline = onlineUsers.includes(typeof a === 'string' ? a : a.id);
                                const bIsOnline = onlineUsers.includes(typeof b === 'string' ? b : b.id);

                                //putting online users first
                                if (aIsOnline && !bIsOnline) return -1;
                                if (!aIsOnline && bIsOnline) return 1;
                                return 0;
                              })
                              .slice(0, 5).map((member) => {
                                const userId = typeof member === 'string' ? member : member.id;
                                const username = typeof member === 'string' 
                                  ? member 
                                  : member.username || 'Unknown User';
                                
                                // Check if user is online
                                const isOnline = onlineUsers.includes(userId);
                                
                                return (
                                  <Chip
                                    key={userId}
                                    label={username}
                                    size="small"
                                    avatar={
                                      isOnline ? 
                                        <Avatar 
                                          sx={{ 
                                            bgcolor: '#4caf50', 
                                            width: 24, 
                                            height: 24,
                                            border: '2px solid #2e7d32'
                                          }}
                                        >
                                          <CheckCircleIcon fontSize="small" />
                                        </Avatar> 
                                        : undefined
                                    }
                                    sx={{
                                      bgcolor: isOnline ? 'rgba(76, 175, 80, 0.15)' : undefined,
                                      border: isOnline ? '1px solid #4caf50' : undefined,
                                      fontWeight: isOnline ? 'bold' : 'normal',
                                      '& .MuiChip-avatar': {
                                        color: 'white',
                                        marginLeft: '2px',
                                        marginRight: '-4px'
                                      },
                                      position: 'relative',
                                      pl: isOnline ? 0.5 : undefined,
                                      '&::after': isOnline ? {
                                        content: '""',
                                        position: 'absolute',
                                        right: -3,
                                        top: -3,
                                        width: 8,
                                        height: 8,
                                        bgcolor: '#4caf50',
                                        borderRadius: '50%',
                                        border: '1px solid white'
                                      } : undefined
                                    }}
                                  />
                                );
                              })}
                              {groupMembers[group.id].length > 5 && (
                                <Chip
                                  label={`+${groupMembers[group.id].length - 5} more`}
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </Box>
                          ) : (
                            <CircularProgress size={20} />
                          )}
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            color="primary" 
                            startIcon={<ChatIcon />}
                            onClick={(e) => handleOpenChat(e, group)}
                            sx={{ mr: 'auto' }}
                          >
                            Chat
                          </Button>
                          <Button 
                            size="small" 
                            color="error" 
                            startIcon={<DeleteIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                          >
                            Delete Group
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {groups.length > itemsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}

            {/* Create Group Dialog */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Group Name"
                  fullWidth
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <TextField
                  margin="dense"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateGroup} 
                  variant="contained"
                  disabled={!newGroupName || !newGroupDescription}
                >
                  Create
                </Button>
              </DialogActions>
            </Dialog>

            {/* Group Management Dialog */}
            {selectedGroup && (
              <GroupManagementDialog
                open={openManageDialog}
                onClose={handleCloseManageDialog}
                group={selectedGroup}
                members={groupMembers[selectedGroup.id] || []}
                allUsers={users}
                onAddMembers={async (users) => {
                  for (const user of users) {
                    await handleAddUser(user);
                  }
                }}
                onRemoveMember={(userId) => handleRemoveUser(selectedGroup.id, userId)}
              />
            )}

            {/* Snackbar for notifications */}
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={() => setSnackbarOpen(false)}
            >
              <Alert 
                onClose={() => setSnackbarOpen(false)} 
                severity={snackbarSeverity}
                sx={{ width: '100%' }}
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>

            <Snackbar
              open={successNotification.show}
              autoHideDuration={10000}
              onClose={handleCloseSuccessNotification}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <MuiAlert
                elevation={6}
                variant="filled"
                severity="success"
                onClose={handleCloseSuccessNotification}
              >
                {successNotification.message}
              </MuiAlert>
            </Snackbar>

            {/* Direct Chat Dialog */}
            {selectedChatGroup && chatOpen && (
              <Dialog
                open={chatOpen}
                onClose={handleCloseChat}
                maxWidth="md"
                fullWidth
                PaperProps={{
                  sx: {
                    height: '80vh',
                    maxHeight: 600
                  }
                }}
              >
                <DialogTitle>
                  <Typography variant="h6" component="div">
                    {selectedChatGroup.name} - Chat
                  </Typography>
                </DialogTitle>
                <DialogContent dividers>
                  <Box sx={{ height: '450px' }}>
                    <GroupChat 
                      groupId={selectedChatGroup.id} 
                      groupName={selectedChatGroup.name} 
                      currentUser={currentUser} 
                    />
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseChat}>Close</Button>
                </DialogActions>
              </Dialog>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}