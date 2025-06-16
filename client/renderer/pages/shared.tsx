import React, { useState, useEffect } from 'react';
import {api, useAuthStore} from '../store/useAuthStore';
import { formatFileSize } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';

import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import Navbar from '../components/Navbar';
import {API_ENDPOINTS} from "../constants/api";

interface SharedFile {
  filename: string;
  path: string;
  isDirectory: boolean;
  size: number;
  timestamp: string;
}

// Define sort options
interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'name_asc', label: 'Filename (A-Z)' },
  { value: 'name_desc', label: 'Filename (Z-A)' },
  { value: 'size_asc', label: 'Size (Smallest first)' },
  { value: 'size_desc', label: 'Size (Largest first)' },
  { value: 'modifiedTime_desc', label: 'Modified Date (Newest first)' },
  { value: 'modifiedTime_asc', label: 'Modified Date (Oldest first)' },
];

export default function SharedFilesPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(4);
  // Add sort state
  const [sortBy, setSortBy] = useState<string>('modifiedTime_desc');

  const fetchSharedFiles = async () => {
    try {
      setLoading(true);
      const response = await api.fetch(API_ENDPOINTS.USERS_FILES);
      if (response.ok) {
        const files = await response.json();
        setFiles(files);
      } else {
        console.error("API call failed in shared.tsx::fetchSharedFiles")
        setError('Failed to fetch shared files');
      }
    } catch (error) {
      setError('Failed to fetch shared files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  // Add handleSortChange function for sorting
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  // Sort files function
  const sortFiles = (filesToSort: SharedFile[]) => {
    const [field, direction] = sortBy.split('_');
    
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modifiedTime':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  // Handling page changes
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Sort files first, then paginate
  const sortedFiles = sortFiles(files);
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageFiles = sortedFiles.slice(startIndex, endIndex);

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${72}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            Shared Files
          </Typography>

          {/* File List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
          ) : (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs>
                    <Typography variant="h6">
                      Shared Files ({files.length})
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="sort-by-label">Sort By</InputLabel>
                      <Select
                        labelId="sort-by-label"
                        id="sort-by-select"
                        value={sortBy}
                        label="Sort By"
                        onChange={handleSortChange}
                      >
                        {sortOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <List>
                {currentPageFiles.map((file, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon>
                      {getFileIcon(file.filename, file.isDirectory)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.filename}
                      secondary={
                        <>
                          {formatFileSize(file.size)} • Last modified: {new Date(file.timestamp).getTime() !== new Date(0).getTime() ? new Date(file.timestamp).toLocaleDateString() : 'N/A'}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {/* Pagination controlling*/}
              {files.length > itemsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
}
