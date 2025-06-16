import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
} from '@mui/material';
import {
  PersonRemove as PersonRemoveIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import GroupChat from './GroupChat';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface GroupDetailDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  members: User[];
  allUsers: User[];
  onAddMembers: (users: User[]) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onlineUsers: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`group-tabpanel-${index}`}
      aria-labelledby={`group-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function GroupDetailDialog({
  open,
  onClose,
  group,
  members,
  allUsers,
  onAddMembers,
  onRemoveMember,
  onlineUsers,
}: GroupDetailDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reset selected users when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setSearchTerm('');
      // Don't reset tab value to preserve last selected tab
    }
  }, [open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      await onAddMembers(selectedUsers);
      setSelectedUsers([]);
      setTabValue(0); // Switch back to members tab
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setLoading(true);
    try {
      await onRemoveMember(userId);
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredUsers = allUsers.filter(user => 
    !members.some(member => member.id === user.id) && // Exclude existing members
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 700
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {group.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {group.description}
        </Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<ChatIcon />} label="Chat" />
          <Tab icon={<GroupIcon />} label={`Members (${members.length})`} />
          <Tab icon={<PersonAddIcon />} label="Add Members" />
        </Tabs>
      </Box>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}

        <TabPanel value={tabValue} index={0}>
          <GroupChat groupId={group.id} groupName={group.name} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List>
            {members.map((member) => {
              const isOnline = onlineUsers.includes(member.id);
              
              return (
                <ListItem key={member.id}>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        {member.username}
                        {isOnline && (
                          <Chip 
                            size="small"
                            label="Online" 
                            color="success" 
                            icon={<CheckCircleIcon />} 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={member.email}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="remove"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                    >
                      <PersonRemoveIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
            {members.length === 0 && (
              <Typography color="text.secondary" align="center">
                No members in this group
              </Typography>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {selectedUsers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected users:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedUsers.map((user) => (
                  <Chip
                    key={user.id}
                    label={user.username}
                    onDelete={() => toggleUserSelection(user)}
                  />
                ))}
              </Box>
            </Box>
          )}

          <List>
            {filteredUsers.map((user) => (
              <ListItem
                key={user.id}
                onClick={() => toggleUserSelection(user)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: selectedUsers.some(u => u.id === user.id) ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUserSelection(user);
                    }}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {filteredUsers.length === 0 && (
              <Typography color="text.secondary" align="center">
                {searchTerm ? "No users match your search" : "No available users to add"}
              </Typography>
            )}
          </List>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        {tabValue === 2 && selectedUsers.length > 0 && (
          <Button
            onClick={handleAddMembers}
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            disabled={loading}
          >
            Add Selected Users
          </Button>
        )}
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 