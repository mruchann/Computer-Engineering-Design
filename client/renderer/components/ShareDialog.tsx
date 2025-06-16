import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { api } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../constants/api';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  magnetLink: string;
  onShare: (users: string[], groups: string[]) => void;
  chosenFileName: string | null;
}

interface User {
  id: string;
  username: string;
}

interface Group {
  id: string;
  name: string;
}

interface File {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: Date;
}


export default function ShareDialog({ open, onClose, magnetLink, onShare, chosenFileName }: ShareDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);



  useEffect(() => {
    // Fetch users and groups when dialog opens
    if (open) {
      fetchUsers();
      fetchGroups();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const response = await api.fetch(API_ENDPOINTS.USERS);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.fetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleShare = async () => {
    // onShare(selectedUsers, selectedGroups);

    try {
      await Promise.all(
        selectedUsers.map(async (user) => {
          const responseFirst = await api.fetch(API_ENDPOINTS.MEMBERSHIP_ADD, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: user,
              group: selectedGroups[0],
            }),
          });

          if (!responseFirst.ok) {
            //alert(`User is already in this group!`); // alert debug için daha iyi 
            console.log(`Fail for ${user}`);
          } else {
            console.log(`Success for ${user}`);
          };
          

        })
      );

      console.log(`file: ${chosenFileName}`)
      window.electron.ipcRenderer.invoke('addAccess', selectedGroups[0], chosenFileName);
        
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share File</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Select users and/or groups to share with
          </Typography>
        </Box>
        
        {/* Users Selection */}
        <Typography variant="subtitle1" gutterBottom>
          Users
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            multiple
            value={selectedUsers}
            MenuProps={{
              autoFocus: false,
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              PaperProps: {
                style: {
                  maxHeight: 224,  // 8 items at 28px height
                  width: '200px',  // Fixed width for dropdown
                  marginTop: '8px', // Add some space between select and menu
                },
              },
              sx: {
                '& .MuiMenu-paper': {
                  boxShadow: '0px 5px 15px rgba(0,0,0,0.2)',
                }
              }
            }}
            onChange={(event: SelectChangeEvent<string[]>) => {
              setSelectedUsers(event.target.value as string[]);
            }}
            sx={{
              '& .MuiSelect-select': {
                minHeight: '56px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                alignItems: 'center',
                padding: '8px'
              }
            }}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={users.find(u => u.id === value)?.username}
                    size="small"
                    onDelete={() => {
                      setSelectedUsers(selectedUsers.filter(id => id !== value));
                    }}
                  />
                ))}
              </Box>
            )}
          >
            <MenuItem disabled value="">
              <em>Select users to share with</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Groups Selection */}
        <Typography variant="subtitle1" gutterBottom>
          Groups
        </Typography>
        <FormControl fullWidth>
          <Select
            multiple
            value={selectedGroups}
            MenuProps={{
              autoFocus: false,
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: '200px',
                  marginTop: '8px',
                },
              },
              sx: {
                '& .MuiMenu-paper': {
                  boxShadow: '0px 5px 15px rgba(0,0,0,0.2)',
                }
              }
            }}
            onChange={(event: SelectChangeEvent<string[]>) => {
              setSelectedGroups(event.target.value as string[]);
            }}
            sx={{
              '& .MuiSelect-select': {
                minHeight: '56px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                alignItems: 'center',
                padding: '8px'
              }
            }}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={groups.find(g => g.id === value)?.name}
                    size="small"
                    onDelete={() => {
                      setSelectedGroups(selectedGroups.filter(id => id !== value));
                    }}
                  />
                ))}
              </Box>
            )}
          >
            <MenuItem disabled value="">
              <em>Select groups to share with</em>
            </MenuItem>
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleShare}
          variant="contained"
          disabled={selectedUsers.length === 0 && selectedGroups.length === 0}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
} 