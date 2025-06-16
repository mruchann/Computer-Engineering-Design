import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
  Toolbar,
  Alert,
  Pagination,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { apiGet } from '../utils/api';
import { getFileIcon } from '../utils/fileIcons';
import { formatFileSize } from '../utils/formatters';
import { API_ENDPOINTS } from '../constants/api';

interface File {
  id: string;
  filename: string;
  author: string;
  fileType: string;
  size: number;
  timestamp: string;
  magnetLink: string;
  mimetype?: string;
  owner_username: string;
  hash: string;
  group_id?: string;
  group: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function RecentPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const { accessToken } = useAuthStore();

  const fetchRecentFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch user's groups
      const groupsResponse = await apiGet(API_ENDPOINTS.GROUPS);
      const groups: Group[] = groupsResponse.data.filter((group: Group) => group.name !== "Public Share");
      
      // Fetch files from each group using search endpoint
      const filesPromises = groups.map(group => 
        apiGet(`${API_ENDPOINTS.SEARCH}?group=${group.id}`)
      );
      
      const groupFilesResponses = await Promise.all(filesPromises);
      
      // Combine and process all files
      let allFiles: File[] = [];
      const seenHashes = new Set<string>();
      
      groupFilesResponses.forEach((response, index) => {
        const groupFiles = response.data || [];
        // Add group_id to each file and filter duplicates by hash
        const filesWithGroup = groupFiles
          .filter((file: File) => {
            if (seenHashes.has(file.hash)) {
              return false;
            }
            seenHashes.add(file.hash);
            return true;
          })
          .map((file: File) => ({
            ...file,
            group_id: groups[index].id
          }));
        allFiles = [...allFiles, ...filesWithGroup];
      });
      
      // Sort files by timestamp (most recent first)
      allFiles.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setFiles(allFiles);
      
    } catch (error) {
      console.error('Error fetching recent files:', error);
      setError('Failed to fetch recent files');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchRecentFiles();
    }
  }, [accessToken]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleDownload = (fileId: string, fileName: string, magnetLink: string) => {
    window.electron.leechFile(magnetLink);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Calculate pagination
  const totalPages = Math.ceil(files.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageFiles = files.slice(startIndex, endIndex);

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
            Recent Files
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
          ) : (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Recent Files ({files.length})
                </Typography>
              </Box>

              <List>
                {currentPageFiles.map((file) => (
                  <ListItem
                    key={file.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon>
                      {getFileIcon(file.filename, false)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.filename}
                      secondary={
                        <>
                        Shared in {file.group} • Uploaded by {file.owner_username} • {formatDate(file.timestamp)}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(file.id, file.filename, file.magnetLink)}
                          size="small"
                          sx={{ color: 'primary.main' }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

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