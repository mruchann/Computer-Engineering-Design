import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
  Toolbar,
  Paper,
  Container,
  Grid,
  Autocomplete,
  Card,
  CardContent,
  Pagination,
  Tooltip,
} from '@mui/material';
import {
  PersonRemove as PersonRemoveIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  PersonAdd as AddIcon,
  InsertDriveFile as FileDownloadIcon,
  PeopleAlt as PeopleAltIcon,
} from '@mui/icons-material';
import GroupChat from './GroupChat';
import { getCurrentUser } from '../utils/userUtils';
import {apiGet} from "../utils/api";
import { getFileIcon } from '../utils/fileIcons';
import { useTheme } from '@mui/material/styles';
import {api} from "../store/useAuthStore";
import {API_ENDPOINTS} from "../constants/api";
import debounce from 'lodash/debounce';
import FileRating from "./FileRating";
import {format} from "date-fns";


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

interface GroupManagementDialogProps {
  open: boolean;
  onClose: () => void;
  group: Group;
  members: User[];
  allUsers: User[];
  onAddMembers: (users: User[]) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SearchSuggestion {
  label: string;
  value: string;
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

export default function GroupManagementDialog({
  open,
  onClose,
  group,
  members,
  allUsers,
  onAddMembers,
  onRemoveMember,
}: GroupManagementDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Reset selected users when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
      setSearchTerm('');
      setTabValue(0);
    }
  }, [open]);

  // Set current user from the members array based on the stored user data
  useEffect(() => {
    if (members.length > 0) {
      const storedUser = getCurrentUser();
      if (storedUser) {
        const foundUser = members.find(member => member.id === storedUser.id);
        setCurrentUser(foundUser || storedUser);
      }
    }
  }, [members]);

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
          maxHeight: 600
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {group.name} - Group Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {group.description}
        </Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<GroupIcon />} label={`Members (${members.length})`} />
          <Tab icon={<AddIcon />} label="Add Members" />
          <Tab icon={<ChatIcon />} label="Group Chat" />
          <Tab icon={<FileDownloadIcon />} label={"Files"} />
        </Tabs>
      </Box>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}

        <TabPanel value={tabValue} index={0}>
          <List>
            {members.map((member) => (
              <ListItem key={member.id}>
                <ListItemText
                  primary={member.username}
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
            ))}
            {members.length === 0 && (
              <Typography color="text.secondary" align="center">
                No members in this group
              </Typography>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
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
                button
                onClick={() => toggleUserSelection(user)}
                selected={selectedUsers.some(u => u.id === user.id)}
              >
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="add"
                    onClick={() => toggleUserSelection(user)}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {filteredUsers.length === 0 && (
              <Typography color="text.secondary" align="center">
                {searchTerm ? "No users found matching your search" : "No users available to add"}
              </Typography>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ height: '400px' }}>
            <GroupChat 
              groupId={group.id} 
              groupName={group.name} 
              currentUser={currentUser} 
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ height: '400px', overflowY: 'auto' }}>
            {(() => {
              const [files, setFiles] = useState([]);
              const [loading, setLoading] = useState(true);
              const [searchQuery, setSearchQuery] = useState('');
              const theme = useTheme();
              const [inputValue, setInputValue] = useState('');
              const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
              const [page, setPage] = useState(1);
              const [itemsPerPage] = useState(6);
              const [sharerCounts, setSharerCounts] = useState<Record<string, number>>({});

              const searchFiles = async (query: string) => {
                setLoading(true);
                try {
                  const params = new URLSearchParams({
                    query,
                    group: group.id,
                  });

                  const response = await api.fetch(`${API_ENDPOINTS.SEARCH}?${params}`);
                  const data = await response.json();

                  const uniqueFiles = new Map();
                  data.forEach(file => {
                    if (!uniqueFiles.has(file.hash) || file.id) {
                      uniqueFiles.set(file.hash, file);
                    }
                  });

                  const uniqueFileArray = Array.from(uniqueFiles.values());
                  setFiles(uniqueFileArray);
                  await fetchSharerCounts(uniqueFileArray);
                } catch (error) {
                  console.error('Error searching files:', error);
                } finally {
                  setLoading(false);
                }
              };

              const debouncedSearch = debounce((query: string) => {
                searchFiles(query);
              }, 300);

              const fetchSharerCounts = async (files: File[]) => {
                const counts: Record<string, number> = {};
                try {
                  await Promise.all(
                      files.map(async (file) => {
                        if (file.hash) {
                          const response = await api.fetch(`${API_ENDPOINTS.SHARERS_COUNT}?file_hash=${file.hash}`);
                          if (response.ok) {
                            const data = await response.json();
                            counts[file.hash] = data.count || 0;
                          }
                        }
                      })
                  );
                  setSharerCounts(counts);
                } catch (error) {
                  console.error('Error fetching sharer counts:', error);
                }
              };

              const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
                setPage(value);
              };

              const fetchSuggestions = async (query: string) => {
                if (!query.trim()) {
                  setSuggestions([]);
                  return;
                }

                try {
                  const params = new URLSearchParams({
                    query: encodeURIComponent(query),
                    group: group.id,
                  });
                  const response = await api.fetch(`${API_ENDPOINTS.SUGGESTIONS}?${params}`);
                  if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.map((item: string) => ({
                      label: item,
                      value: item
                    })));
                  }
                } catch (error) {
                  console.error('Failed to fetch suggestions:', error);
                }
              };

              const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

              const getMimetypeColor = (mimetype?: string) => {
                if (!mimetype) return 'default';
                if (mimetype.includes('image')) return 'success';
                if (mimetype.includes('video')) return 'error';
                if (mimetype.includes('audio')) return 'warning';
                if (mimetype.includes('pdf')) return 'error';
                if (mimetype.includes('text')) return 'info';
                return 'default';
              };

              const formatDate = (dateString: string) => {
                try {
                  return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
                } catch {
                  return 'Invalid date';
                }
              };

              const totalPages = Math.ceil(files.length / itemsPerPage);
              const startIndex = (page - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentPageResults = files.slice(startIndex, endIndex);

              useEffect(() => {
                debouncedSearch(searchQuery);
              }, []);

              useEffect(() => {
                debouncedSearch(searchQuery);
              }, [searchQuery]);

              return (
                  <Box sx={{ display: "flex" }}>
                    <Box
                        component="main"
                        sx={{
                          flexGrow: 1,
                          p: 3,
                          width: { sm: `calc(100% - ${72}px)` },
                          backgroundColor: theme.palette.background.default,
                        }}
                    >
                      <Toolbar />
                      <Container maxWidth="lg">
                        <Typography variant="h4" sx={{ mb: 4 }}>
                          Files in this group
                        </Typography>

                        <Paper sx={{ p: 3, mb: 4 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={5}>
                              <Autocomplete
                                  freeSolo
                                  fullWidth
                                  options={suggestions}
                                  inputValue={inputValue}
                                  onInputChange={(event, newInputValue) => {
                                    setInputValue(newInputValue);
                                    debouncedFetchSuggestions(newInputValue);
                                  }}
                                  onChange={(event, newValue: string | SearchSuggestion | null) => {
                                    const value = typeof newValue === 'string' ? newValue : newValue?.value || '';
                                    setSearchQuery(value);
                                  }}
                                  renderInput={(params) => (
                                      <TextField
                                          {...params}
                                          label="Search"
                                          placeholder="Search for files..."
                                          InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                  <InputAdornment position="start">
                                                    <SearchIcon />
                                                  </InputAdornment>
                                                  {params.InputProps.startAdornment}
                                                </>
                                            )
                                          }}
                                      />
                                  )}
                              />
                            </Grid>
                          </Grid>
                        </Paper>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                              <CircularProgress />
                            </Box>
                        ) : (
                            <>
                              <Grid container spacing={2}>
                                {currentPageResults.map((file) => (
                                    <Grid item xs={12} sm={6} md={4} key={file.id}>
                                      <Card
                                          elevation={2}
                                          sx={{
                                            height: '100%',
                                            borderRadius: 2,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                              transform: 'translateY(-4px)',
                                              boxShadow: 6,
                                            }
                                          }}
                                      >
                                        <CardContent>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            {getFileIcon(file.filename, false)}
                                            <Typography variant="h6" noWrap sx={{ ml: 1 }}>
                                              {file.filename}
                                            </Typography>
                                          </Box>

                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                }}
                                                noWrap
                                            >
                                              <strong>Group:</strong> {file.group}
                                            </Typography>
                                          </Box>

                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                }}
                                                noWrap
                                            >
                                              <strong>Owner:</strong> {file.owner_username}
                                            </Typography>
                                          </Box>

                                          <Box sx={{ mb: 2 }}>
                                            <FileRating fileHash={file.hash} size="small" readOnly />
                                          </Box>

                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                              {file.mimetype && (
                                                  <Chip
                                                      label={file.mimetype.split('/')[1]}
                                                      size="small"
                                                      color={getMimetypeColor(file.mimetype)}
                                                      sx={{ mr: 1 }}
                                                  />
                                              )}
                                              <Chip
                                                  label={formatDate(file.timestamp)}
                                                  size="small"
                                                  variant="outlined"
                                                  sx={{ mr: 1 }}
                                              />
                                              <Tooltip title="Number of peers">
                                                <Chip
                                                    icon={<PeopleAltIcon fontSize="small" />}
                                                    label={sharerCounts[file.hash] || 0}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                />
                                              </Tooltip>
                                            </Box>
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                ))}

                                {!loading && files.length === 0 && (
                                    <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
                                      <Typography color="textSecondary">
                                        {searchQuery
                                            ? 'No files found matching your search criteria'
                                            : 'No files available in this group'}
                                      </Typography>
                                    </Box>
                                )}
                              </Grid>

                              {files.length > itemsPerPage && (
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
                      </Container>
                    </Box>
                  </Box>
              );
            })()}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        {tabValue === 1 && selectedUsers.length > 0 && (
          <Button 
            onClick={handleAddMembers}
            variant="contained"
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