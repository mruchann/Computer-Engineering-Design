import { useEffect, useState } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  TextField,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Grid,
  Chip,
  Tooltip,
  Paper,
  CircularProgress,
  Fade,
  Toolbar,
  Pagination,
  Autocomplete,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useRouter } from 'next/router';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { useTheme } from '@mui/material/styles';
import { API_ENDPOINTS } from '../constants/api';
import { getFileIcon } from '../utils/fileIcons';
import debounce from 'lodash/debounce';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorageIcon from '@mui/icons-material/Storage';
import React from 'react';
import FileRecommendations from '../components/FileRecommendations';
import FileRating from '../components/FileRating';
import FileReport from '../components/FileReport';
import {formatFileSize} from "../utils/formatters";

interface SearchResult {
  filename: string;
  timestamp: string;
  isDirectory: boolean;
  magnetLink: string;
  mimetype?: string;
  hash: string;
  owner_username: string;
  group: string;
  size: number;
}

interface SearchSuggestion {
  label: string;
  value: string;
}

// Define sort options
interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'filename_asc', label: 'Filename (A-Z)' },
  { value: 'filename_desc', label: 'Filename (Z-A)' },
  { value: 'timestamp_desc', label: 'Upload Date (Newest first)' },
  { value: 'timestamp_asc', label: 'Upload Date (Oldest first)' },
  { value: 'owner_username_asc', label: 'Owner (A-Z)' },
  { value: 'owner_username_desc', label: 'Owner (Z-A)' },
  { value: 'rating_desc', label: 'Rating (Highest first)' },
  { value: 'rating_asc', label: 'Rating (Lowest first)' },
];

export default function DashboardPage() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 items per page (2 rows x 3 columns)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sharerCounts, setSharerCounts] = useState<Record<string, number>>({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, boolean>>({});
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    hash: string;
    filename: string;
    magnetLink: string;
    result: any;
  } | null>(null);
  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [errorFetchingComments, setErrorFetchingComments] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  // Add sorting state
  const [sortBy, setSortBy] = useState<string>('timestamp_desc');
  // Add ratings state
  const [fileRatings, setFileRatings] = useState<Record<string, number>>({});
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (dialogOpen && dialogContent) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          const response = await api.fetch(`${API_ENDPOINTS.COMMENTS}?file_hash=${encodeURIComponent(dialogContent.hash)}`);
          const data = await response.json();
          console.log(data);
          setComments(data);
        } catch (error) {
          setErrorFetchingComments('Failed to load comments.');
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [dialogOpen, dialogContent]);

  const handlePostComment = async () => {
    if (newComment.trim()) {
      try {
        await api.fetch(API_ENDPOINTS.COMMENTS, {
          method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file_hash: dialogContent?.hash,
              comment: newComment,
            }),
          });

        setNewComment('');
        setLoadingComments(true);
        const response = await api.fetch(`${API_ENDPOINTS.COMMENTS}?file_hash=${encodeURIComponent(dialogContent.hash)}`);
        const data = await response.json();
        console.log(data);
        setComments(data);
        setLoadingComments(false);
      } catch (error) {
        console.error('Failed to post comment', error);
      }
    }
  };


  const handleDialogOpen = (hash: string, filename: string, magnetLink: string, result: any) => {
    setDialogContent({ hash, filename, magnetLink, result });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setError('');

    try {
      const response = await api.fetch(`${API_ENDPOINTS.SEARCH}?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = (await response.json()) as SearchResult[];
        const uniqueFiles = new Map<string, SearchResult>(data.map(item => [item.hash, item]));
        const uniqueResults: SearchResult[] = Array.from(uniqueFiles.values());
        setResults(uniqueResults);
        await fetchSharerCounts(uniqueResults);
        await fetchFileRatings(uniqueResults);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      setError('Failed to perform search');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await api.fetch(`${API_ENDPOINTS.SUGGESTIONS}?query=${encodeURIComponent(query)}`);
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

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const fetchFileRatings = async (files: SearchResult[]) => {
    const ratings: Record<string, number> = {};
    const counts: Record<string, number> = {};
    try {
      await Promise.all(
        files.map(async (file) => {
          if (file.hash) {
            const response = await api.fetch(`${API_ENDPOINTS.RATING_AVERAGE}${file.hash}`);
            if (response.ok) {
              const data = await response.json();
              ratings[file.hash] = data.average || 0;
              counts[file.hash] = data.count || 0;
            }
          }
        })
      );
      setFileRatings(ratings);
      setRatingCounts(counts);
    } catch (error) {
      console.error('Error fetching file ratings:', error);
    }
  };

  const fetchInitialSearchResults = async () => {
    setLoading(true);
    try {
      const response = await api.fetch(`${API_ENDPOINTS.SEARCH}?query=`);
      if (response.ok) {
        const data = await response.json() as SearchResult[];
        const uniqueFiles = new Map(data.map(item => [item.hash, item]));
        const uniqueResultsArray = Array.from(uniqueFiles.values());
        setAllResults(uniqueResultsArray);
        fetchSharerCounts(uniqueResultsArray, true);
        fetchFileRatings(uniqueResultsArray);
      }
    } catch (error) {
      console.error('Failed to fetch initial search results:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchSharerCounts = async (results: SearchResult[], firstSearch: boolean = false) => {
    const counts: Record<string, number> = {};
    try {
      if (firstSearch) {
        setFiltering(true);
      }
      
      await Promise.all(
        results.map(async (result) => {
          if (result.hash) {
            const response = await api.fetch(`${API_ENDPOINTS.SHARERS_COUNT}?file_hash=${result.hash}`);
            if (response.ok) {
              const data = await response.json();
              counts[result.hash] = data.count || 0;
            }
          }
        })
      );
      setSharerCounts(counts);
      
      if (firstSearch) {
        const filteredResults = results.filter(result => counts[result.hash] > 0);
        setResults(filteredResults);
      }
      
    } catch (error) {
      console.error('Error fetching sharer counts:', error);
    } finally {
      if (firstSearch) {
        setFiltering(false);
      }
    }
  };

  const handleDownload = (fileId: string, fileName: string, magnetLink: string) => {
    setDownloadingFiles(prev => ({
      ...prev,
      [fileId]: true
    }));
    
    setSnackbarMessage(`Download started: ${fileName}`);
    setOpenSnackbar(true);
    
    // Use type assertion to match the type defined in global.d.ts
    const electron = window.electron as typeof window.electron & { leechFile: (magnetLink: string) => void };
    if (electron && electron.leechFile) {
      electron.leechFile(magnetLink);
    } else {
      console.error('Electron API not available');
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const toggleShowAllFiles = () => {
    setShowAllFiles(!showAllFiles);
    if (!showAllFiles) {
      // Switching to show all files
      setResults(allResults);
    } else {
      // Switching to show only online files
      const onlineResults = allResults.filter(result => sharerCounts[result.hash] > 0);
      setResults(onlineResults);
    }
  };

  useEffect(() => {
    window.electron.ipcRenderer.on('torrent-download-finished', (message) => {
      setSnackbarMessage(`${message.name} successfully downloaded to ${message.path}`);
      setOpenSnackbar(true);
    });

    window.electron.ipcRenderer.on('test', (message) => {
      console.log("test");
    });

  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/');
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchInitialSearchResults();
    }
  }, [isInitialized, isAuthenticated]);

  // Add handleSortChange function for sorting
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  // Add sortFiles function to sort the files based on selected sort option
  const sortFiles = (filesToSort: SearchResult[]) => {
    const [field, direction] = sortBy.split('_');
    
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'filename':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'owner_username':
          comparison = a.owner_username.localeCompare(b.owner_username);
          break;
        case 'rating':
          // Use the fileRatings state to sort by rating
          const ratingA = fileRatings[a.hash] || 0;
          const ratingB = fileRatings[b.hash] || 0;
          
          if (ratingA === ratingB) {
            // If ratings are the same, sort by number of ratings (review count)
            const countA = ratingCounts[a.hash] || 0;
            const countB = ratingCounts[b.hash] || 0;
            return direction === 'asc' ? countA - countB : countB - countA;
          }
          
          comparison = ratingA - ratingB;
          break;
        default:
          comparison = 0;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  // Calculate pagination with sorted results
  const sortedResults = sortFiles(results);
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageResults = sortedResults.slice(startIndex, endIndex);

  const handleRecommendationDownload = (magnetLink: string, filename: string) => {
    // Use type assertion to match the type defined in global.d.ts
    const electron = window.electron as typeof window.electron & { leechFile: (magnetLink: string) => void };
    if (electron && electron.leechFile) {
      electron.leechFile(magnetLink);
    } else {
      console.error('Electron API not available');
    }
  };

  return (
    <Box sx={{ display: 'flex', transition: 'background-color 0.3s ease' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${72}px)` },
          backgroundColor: theme.palette.background.default,
          transition: 'background-color 0.3s ease',
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Typography 
              variant="h1" 
              component="div" 
              onClick={() => router.push('/')}
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #00bcd4 30%, #7c4dff 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                mb: 2 // Add margin below to create space before the search bar
              }}
            >
              PeerLink
            </Typography>
          </Box>

          {/* Recommendations Section */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Recommended for You
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Files recommended based on your ratings and similar users' preferences.
            </Typography>
            <FileRecommendations 
              maxItems={5}
              onFileDownload={handleRecommendationDownload}
            />
          </Paper>

          {/* Search Bar */}
          <Paper 
            component="form" 
            onSubmit={handleSearch}
            elevation={3}
            className="search-paper"
            sx={{ 
              p: 2, 
              mb: 4, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.12)' 
                : 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                freeSolo
                options={suggestions}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                  setInputValue(newInputValue);
                  setSearchQuery(newInputValue);
                  debouncedFetchSuggestions(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search for files..."
                    variant="outlined"
                    fullWidth
                    size="medium"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button 
                  variant="contained" 
                  type="submit"
                  size="medium"
                  sx={{ 
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    px: 3
                  }}
                >
                  Search
                </Button>
                
                {/* Add sort by dropdown */}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="sort-by-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    id="sort-by-select"
                    value={sortBy}
                    label="Sort By"
                    onChange={handleSortChange}
                    size="small"
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant={showAllFiles ? "contained" : "outlined"}
                  color={showAllFiles ? "primary" : "inherit"}
                  size="small"
                  onClick={toggleShowAllFiles}
                  sx={{ 
                    borderRadius: 1, 
                    textTransform: 'none',
                    px: 2
                  }}
                >
                  {showAllFiles ? "Showing All Files" : "Show Only Online Files"}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Results Area */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filtering ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Filtering online files...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ my: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : currentPageResults.length > 0 ? (
            <Box sx={{ position: 'relative', minHeight: 200 }}>
              <Fade in={loading || filtering}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <CircularProgress />
                  {filtering && (
                    <Typography variant="body1" color="text.secondary">
                      Finding online files...
                    </Typography>
                  )}
                </Box>
              </Fade>

              <Fade in={!loading && !filtering}>
                <Box>
                  <Grid container spacing={3}>
                    {currentPageResults.map((result, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                          elevation={2}
                          sx={{ 
                            height: '100%',
                            borderRadius: 2,
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 6,
                            },
                            cursor: 'pointer'
                          }}
                          onClick={() => handleDialogOpen(result.hash, result.filename, result.magnetLink, result)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              {getFileIcon(result.filename, result.isDirectory)}
                              <Typography variant="h6" noWrap sx={{ ml: 1 }}>
                                {result.filename}
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
                                <strong>Group:</strong> {result.group}
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
                                <strong>Owner:</strong> {result.owner_username}
                              </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <FileRating fileHash={result.hash} size="small" readOnly />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                {result.mimetype && (
                                  <Chip 
                                    label={result.mimetype.split('/')[1]} 
                                    size="small" 
                                    color={getMimetypeColor(result.mimetype)}
                                    sx={{ mr: 1 }}
                                  />
                                )}
                                <Chip 
                                  label={formatDate(result.timestamp)} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                <Tooltip title="Number of peers">
                                  <Chip
                                    icon={<PeopleAltIcon fontSize="small" />}
                                    label={sharerCounts[result.hash] || 0}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                  />
                                </Tooltip>
                                <Tooltip title="Size">
                                  <Chip
                                      icon={<StorageIcon fontSize="small" />}
                                      label={formatFileSize(result.size)}
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                  />
                                </Tooltip>
                              </Box>

                              <Tooltip title={downloadingFiles[result.hash] ? "Download started" : "Download"}>
                                <span>
                                  <IconButton 
                                    size="medium"
                                    color={downloadingFiles[result.hash] ? "success" : "primary"}
                                    sx={{ 
                                      bgcolor: 'action.hover',
                                      '&:hover': {
                                        bgcolor: 'action.selected',
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(result.hash, result.filename, result.magnetLink);
                                    }}
                                    disabled={downloadingFiles[result.hash]}
                                  >
                                    {downloadingFiles[result.hash] ? <CheckCircleIcon /> : <FileDownloadIcon />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Add pagination controls */}
                  {sortedResults.length > itemsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                      />
                    </Box>
                  )}
                </Box>
              </Fade>

              {!loading && sortedResults.length === 0 && searchQuery && (
                <Typography sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                  No results found
                </Typography>
              )}
            </Box>
          ) : (
            <Typography sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
              No results found
            </Typography>
          )}
        </Container>
      </Box>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="lg" fullWidth>
        <DialogTitle>Download File</DialogTitle>
        <DialogContent dividers>
          {dialogContent && (
            <>
              {/* Tab Switcher */}
              <ToggleButtonGroup
                value={activeTab}
                exclusive
                onChange={(e, newTab) => {
                  if (newTab !== null) setActiveTab(newTab);
                }}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="description">Description</ToggleButton>
                <ToggleButton value="comments">Comments</ToggleButton>
                <ToggleButton value="report">Report</ToggleButton>
              </ToggleButtonGroup>
              {activeTab === 'description' && (
                <>
                  <Typography gutterBottom>
                    You're about to download <strong>{dialogContent.filename}</strong>
                  </Typography>

                  {/* Add Rating Component */}
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Rate this file
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FileRating fileHash={dialogContent.hash} size="large" readOnly={false} />
                    </Box>
                  </Box>

                  {/* Metadata Section */}
                  {dialogContent.result && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        File Metadata
                      </Typography>
                      <Paper
                        sx={{
                          p: 0,
                          overflowX: 'auto',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <Box sx={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
                          {Object.entries(dialogContent.result).map(([key, value], index) => (
                            <Box
                              key={key}
                              sx={{
                                display: 'table-row',
                                backgroundColor:
                                  index % 2 === 0
                                    ? theme.palette.action.hover
                                    : theme.palette.background.default,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                transition: 'background-color 0.2s ease',
                                '&:hover': {
                                  backgroundColor: theme.palette.action.selected,
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'table-cell',
                                  padding: 2,
                                  verticalAlign: 'top',
                                  width: '30%',
                                  fontWeight: 'bold',
                                  color: theme.palette.text.secondary,
                                  borderRight: `1px solid ${theme.palette.divider}`,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Box>
                              <Box
                                sx={{
                                  display: 'table-cell',
                                  padding: 2,
                                  verticalAlign: 'top',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  color: theme.palette.text.primary,
                                }}
                              >
                                {String(value)}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                  )}
                </>
              )}


              {/* Comments View */}
              {activeTab === 'comments' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Comments
                  </Typography>

                  {loadingComments ? (
                    <CircularProgress />
                  ) : errorFetchingComments ? (
                    <Typography color="error">{errorFetchingComments}</Typography>
                  ) : (
                    <>
                      <Paper
                        sx={{
                          maxHeight: 200,
                          overflowY: 'auto',
                          mb: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <Box sx={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
                          {comments.length > 0 ? (
                            comments.map((comment, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: 'table-row',
                                  backgroundColor:
                                    index % 2 === 0
                                      ? theme.palette.action.hover
                                      : theme.palette.background.default,
                                  borderBottom: `1px solid ${theme.palette.divider}`,
                                  transition: 'background-color 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: theme.palette.action.selected,
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'table-cell',
                                    padding: 2,
                                    wordBreak: 'break-word',
                                    color: theme.palette.text.primary,
                                  }}
                                >
                                  <Typography variant="body2">{comment}</Typography>
                                </Box>
                              </Box>
                            ))
                          ) : (
                            <Box sx={{ display: 'table-row' }}>
                              <Box
                                sx={{
                                  display: 'table-cell',
                                  padding: 2,
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                <Typography variant="body2">No comments yet.</Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Paper>


                      <TextField
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        label="Add a Comment"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <Button
                        onClick={handlePostComment}
                        variant="contained"
                        color="primary"
                        fullWidth
                      >
                        Post Comment
                      </Button>
                    </>
                  )}
                </Box>
              )}

              {activeTab === 'report' && (
                <FileReport 
                  fileHash={dialogContent.hash} 
                  fileName={dialogContent.filename} 
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (dialogContent) {
                handleDownload(dialogContent.hash, dialogContent.filename, dialogContent.magnetLink);
                handleDialogClose();
              }
            }}
            variant="contained"
            color="primary"
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}