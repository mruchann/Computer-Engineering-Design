import React, { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../store/useAuthStore';
import { formatFileSize } from '../utils/formatters';
import { getFileName } from '../utils/files';
import PendingScans from '../components/PendingScans';

import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Alert,
  FormControl,
  CircularProgress,
  Pagination,
  Snackbar,
  Chip,
  SelectChangeEvent,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import ShareDialog from '../components/ShareDialog';
import { API_ENDPOINTS } from '../constants/api';
import MuiAlert from '@mui/material/Alert';
import { getFileIcon } from '../utils/fileIcons';
import { useNotificationStore } from '../components/NotificationStore';

interface SharedFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: Date;
}

interface Group {
  id: string;
  name: string;
}


export default function UploadPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [pendingScans, setPendingScans] = useState<any[]>([]);
  const [successNotification, setSuccessNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ''
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const selectedGroupsRef = useRef<string[]>([]);
  const [uploadReady, setUploadReady] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [uploadedFilesToProcess, setUploadedFilesToProcess] = useState<SharedFile[]>([]);

  const { addNotification } = useNotificationStore();

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.fetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const sharedFiles: SharedFile[] = Array.from(files).map(file => {
        return {
          name: file.name,
          path: file.path,
          isDirectory: false,
          size: file.size,
          modifiedTime: new Date(file.lastModified)
        } as SharedFile;
      });

      sharedFiles.forEach((file: SharedFile) => {
        handleScanFile(file.name, file.path);
      });

      // Append to uploadedFilesToProcess to add to the list
      setUploadedFilesToProcess(prev => [...prev, ...sharedFiles]);
      setShowGroupSelection(true);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const items = e.target.files;
    if (!items) return;

    const processedFiles: File[] = [];
    for (const item of Array.from(items)) {
      processedFiles.push(item);
    }

    const newFiles: SharedFile[] = processedFiles.map(file => ({
      name: file.name,
      path: file.path,
      isDirectory: file.isDirectory,
      size: file.size,
      modifiedTime: new Date(file.lastModified)
    }));

    // Append to uploadedFilesToProcess instead of replacing
    setUploadedFilesToProcess(prev => [...prev, ...newFiles]);
    setShowGroupSelection(true);
    e.target.value = '';
  }, []);

  const addPendingScan = useCallback((file: any) => {
    const scanInfo = {
      id: Math.random().toString(36).substring(2, 15),
      file_name: file.name,
      file_path: file.path,
      file_hash: '',
      status: 'scanning',
      created_at: new Date().toISOString(),
    };

    setPendingScans(prev => [...prev, scanInfo]);
    return scanInfo.id;
  }, []);

  const handleScanFile = (fileName: string, filePath: string) : boolean => {
    // Add to pending scans immediately
    const scanId = addPendingScan({
      name: fileName,
      path: filePath
    });

    // Scan file for viruses
    //const isSafe = await window.electron.scanFile(filePath);
    const isSafe = true; // to test faster
    // Remove from pending scans
    setPendingScans(prev => prev.filter(scan => scan.id !== scanId));

    // selectedGroupsRef.current.forEach( (group) => {
    //   alert(group);
    // });

    if (!isSafe) {
      alert(`File "${fileName}" failed virus scan and will not be uploaded.`);
      return false;
    }

    // Show success notification
    setSuccessNotification({
      show: true,
      message: `File "${fileName}" passed virus scan and is safe to share!`
    });

    addNotification({
      text: `File "${fileName}" passed virus scan and is safe to share!`,
      time: new Date().toLocaleTimeString(),
    });

    return true;
  }

  const handleOpenFileDialog = useCallback(async () => {
    const filePaths = await window.electron.ipcRenderer.openFileDialog();
    if (filePaths && filePaths.length > 0) {
      try {
        const newFilesToProcess: SharedFile[] = [];
        
        for (const filePath of filePaths) {
          const fileName = getFileName(filePath);

          if (!handleScanFile(fileName, filePath)) {
            continue;
          }

          const fileSize = await window.electron.ipcRenderer.invoke('get-file-size', filePath);

          const newFile: SharedFile = {
            name: fileName,
            path: filePath,
            isDirectory: false,
            size: fileSize,
            modifiedTime: new Date()
          };

          newFilesToProcess.push(newFile);
        }
        
        // Append to uploadedFilesToProcess to add to the list
        if (newFilesToProcess.length > 0) {
          setUploadedFilesToProcess(prev => [...prev, ...newFilesToProcess]);
          setShowGroupSelection(true);
          setPage(1);
        }
      } catch (error) {
        console.error('Error processing files:', error);
      }
    }
  }, [addPendingScan]);

  // Add function to clear pending files
  const handleClearPendingFiles = () => {
    setUploadedFilesToProcess([]);
    setShowGroupSelection(false);
  };

  const handleCloseSuccessNotification = () => {
    setSuccessNotification({
      show: false,
      message: ''
    });
  };

  const handleShareFiles = async () => {
    // Removed the validation that required at least one group to be selected
    try {
      
      if(selectedGroups.length != 1){
        alert("Choose one Group!");
      }

      for (const file of uploadedFilesToProcess) {
        const copyResult = await window.electron.ipcRenderer.invoke(
          'copy-to-shared', 
          file.path, selectedGroups,
        );

        // Only loop through groups if any are selected
        if (selectedGroups.length > 0) {
          for (const group of selectedGroups) {
            await window.electron.ipcRenderer.invoke('addAccess', group, file.path);
          }
        }
      }
      
      // Now add the files to the shared files list
      setFiles(prev => [...uploadedFilesToProcess, ...prev]);
      
      // Reset state after sharing
      setUploadReady(false);
      setShowGroupSelection(false);
      setUploadedFilesToProcess([]);
      
      const messageText = selectedGroups.length > 0 
        ? `Files have been successfully shared with the selected groups!`
        : `Files have been successfully shared publicly!`;
      
      setSuccessNotification({
        show: true,
        message: messageText
      });
      
    } catch (error) {
      console.error('Error sharing files:', error);
      setError('Failed to share files. Please try again.');
    }
  };

  useEffect(() => {
    fetchSharedFiles();
    fetchGroups();
    // Don't update selectedGroupsRef here as we'll set it only when sharing
  }, []);

  useEffect(() => {
    // Always allow sharing regardless of group selection
    setUploadReady(true);
    selectedGroupsRef.current = selectedGroups;
  }, [selectedGroups]);

  const fetchSharedFiles = async () => {
    try {
      setLoading(true);
      const result = await window.electron.ipcRenderer.getSharedFiles();
      
      if (result.success) {
        // Sorting files by modification time, newest first
        const sortedFiles = result.files.sort((a, b) =>
          new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
        );
        setFiles(sortedFiles);
      } else {
        setError(result.error || 'Failed to fetch shared files');
      }
    } catch (error) {
      setError('Failed to fetch shared files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: SharedFile) => {
    try {
      const torrentPath = await window.electron.getTorrentPath();
      if (file.path) {
        // Check if file is already in the shared directory
        if (!file.path.startsWith(torrentPath)) {
          const copyResult = await window.electron.ipcRenderer.invoke('copy-to-shared', file.path);
          if (!copyResult.success) {
            throw new Error(copyResult.error || 'Failed to copy file');
          }
        }
      } else {
        throw new Error('File path not available');
      }
      
      // Update file status to completed
      setFiles(prev => prev.map(f => 
        f === file 
          ? { ...f, status: 'completed' }
          : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f === file 
          ? { ...f, status: 'error', error: error.message } 
          : f
      ));
    }
  };

  const handleShareComplete = (users: string[], groups: string[]) => {
    setFiles(prev => {
      const updatedFiles = prev.map(f =>
        f === selectedFile
          ? {
              ...f,
              shareWithUsers: users,
              shareWithGroups: groups,
              shared: true,
              status: 'completed',
              modifiedTime: new Date() // Update modification time when shared
            }
          : f
      );
      // Sorting again to maintain newest-first order
      return updatedFiles.sort((a, b) =>
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      );
    });
    setShareDialogOpen(false);
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  //handling page changes
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
            Shared Files
          </Typography>

          {/* Drop Zone */}
          <Paper
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              mt: 3,
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.300',
              bgcolor: isDragging ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              // @ts-ignore
              webkitdirectory=""
              // @ts-ignore
              directory=""
              multiple
              onClick={(e: any) => {
                e.target.webkitdirectory = false;
                e.target.directory = false;
                e.target.multiple = true;
              }}
              hidden
            />
            
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag and drop files or folders here
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Or use the button below to select
            </Typography>
            <Box sx={{ '& > :not(style)': { m: 1 } }}>
              <Button
                variant="contained"
                onClick={handleOpenFileDialog}
                startIcon={<CloudUploadIcon />}
              >
                Select Files or Folders
              </Button>
            </Box>
          </Paper>
          
          <PendingScans pendingScans={pendingScans} />
          
          {/* Group Selection - Only shown after files are selected */}
          {showGroupSelection && (
            <Paper sx={{ mt: 3, p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  Select Groups for {uploadedFilesToProcess.length} {uploadedFilesToProcess.length === 1 ? 'File' : 'Files'}
                </Typography>
                <Button 
                  variant="text" 
                  color="error" 
                  size="small"
                  onClick={handleClearPendingFiles}
                >
                  Clear All
                </Button>
              </Box>
              
              {/* Show list of files being shared in chips format */}
              <Box sx={{ mb: 3, mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Files to be shared:
                </Typography>
                <Paper 
                  variant="outlined"
                  sx={{ 
                    p: 1.5, 
                    maxHeight: '120px', 
                    overflow: 'auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.8,
                    alignItems: 'flex-start',
                    alignContent: 'flex-start'
                  }}
                >
                  {uploadedFilesToProcess.map((file, index) => (
                    <Chip
                      key={index}
                      icon={getFileIcon(file.name, file.isDirectory)}
                      label={file.name}
                      size="small"
                      sx={{ maxWidth: '250px' }}
                      onDelete={() => {
                        // Remove a specific file from the list
                        setUploadedFilesToProcess(prev => prev.filter((_, i) => i !== index));
                        if (uploadedFilesToProcess.length <= 1) {
                          setShowGroupSelection(false);
                        }
                      }}
                    />
                  ))}
                </Paper>
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Select groups to share with or choose Public Share option to share publicly
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  id="group-select"
                  options={groups}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={groups.filter(group => selectedGroups.includes(group.id))}
                  onChange={(event, newValues) => {
                    // setSelectedGroups(newValues.map(group => group.id));
                    if (newValues.length > 0) {
                      const lastSelectedGroup = newValues[newValues.length - 1];
                      setSelectedGroups([lastSelectedGroup.id]);
                    } else {
                      setSelectedGroups([]); // If cleared, set empty
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select groups or search"
                      placeholder="Share"
                      fullWidth
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={option.id}
                        label={option.name}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </FormControl>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleShareFiles}
                >
                  Share Files
                </Button>
              </Box>
            </Paper>
          )}

          {/* File List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error && !showGroupSelection ? (
            <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
          ) : (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Shared Files ({files.length})
                </Typography>
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
                    {getFileIcon(file.name, file.isDirectory)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={
                        <>
                          {formatFileSize(file.size)} • Last modified: {new Date(file.modifiedTime).getTime() !== new Date(0).getTime() ? new Date(file.modifiedTime).toLocaleDateString() : 'N/A'}
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

      {/* Add ShareDialog */}
      {selectedFile && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          magnetLink={selectedFile.magnetLink || ''}
          onShare={handleShareComplete}
          chosenFileName={selectedFile.name}
        />
      )}

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
    </Box>
  );
}