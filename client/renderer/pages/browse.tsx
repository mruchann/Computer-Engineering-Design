import React, { useEffect, useState } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Toolbar,
  TextField,
  Paper,
  Chip,
  SelectChangeEvent,
  InputAdornment,
  Autocomplete,
  Pagination,
  Snackbar,
  Alert,
  DialogTitle,
  DialogContent,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  DialogActions,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  PeopleAlt as PeopleAltIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import { API_ENDPOINTS } from '../constants/api';
import { useTheme } from '@mui/material/styles';
import { getFileIcon } from '../utils/fileIcons';
import debounce from 'lodash/debounce';
import FileRating from '../components/FileRating';
import FileReport from '../components/FileReport';
import StorageIcon from "@mui/icons-material/Storage";
import {formatFileSize} from "../utils/formatters";

interface Group {
  id: string;
  name: string;
}

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
  group: string;
}

interface SearchFilter {
  type: string;
  label: string;
}

interface SearchSuggestion {
  label: string;
  value: string;
}

// Define sort options for the sort feature
interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'filename_asc', label: 'Filename (A-Z)' },
  { value: 'filename_desc', label: 'Filename (Z-A)' },
  { value: 'size_asc', label: 'Size (Smallest first)' },
  { value: 'size_desc', label: 'Size (Largest first)' },
  { value: 'timestamp_desc', label: 'Upload Date (Newest first)' },
  { value: 'timestamp_asc', label: 'Upload Date (Oldest first)' },
  { value: 'owner_username_asc', label: 'Owner (A-Z)' },
  { value: 'owner_username_desc', label: 'Owner (Z-A)' },
  { value: 'rating_desc', label: 'Rating (Highest first)' },
  { value: 'rating_asc', label: 'Rating (Lowest first)' },
];

const searchFilters: SearchFilter[] = [
  { type: 'filename', label: 'Filename' },
  { type: 'owner_username', label: 'Owner' },
  { type: 'mimetype', label: 'MIME Type' },
  { type: 'embedded filename', label: 'Embedded Filename' },
  { type: 'comment', label: 'Comment' },
  { type: 'title', label: 'Title' },
  { type: 'book title', label: 'Book Title' },
  { type: 'book edition', label: 'Book Edition' },
  { type: 'book chapter', label: 'Book Chapter' },
  { type: 'journal name', label: 'Journal Name' },
  { type: 'journal volume', label: 'Journal Volume' },
  { type: 'journal number', label: 'Journal Number' },
  { type: 'page count', label: 'Page Count' },
  { type: 'page range', label: 'Page Range' },
  { type: 'author name', label: 'Author Name' },
  { type: 'author email', label: 'Author Email' },
  { type: 'author institution', label: 'Author Institution' },
  { type: 'publisher', label: 'Publisher' },
  { type: 'publisher\'s address', label: "Publisher's Address" },
  { type: 'publishing institution', label: 'Publishing Institution' },
  { type: 'publication series', label: 'Publication Series' },
  { type: 'publication type', label: 'Publication Type' },
  { type: 'publication year', label: 'Publication Year' },
  { type: 'publication month', label: 'Publication Month' },
  { type: 'publication day', label: 'Publication Day' },
  { type: 'publication date', label: 'Publication Date' },
  { type: 'bibtex eprint', label: 'BibTeX EPrint' },
  { type: 'bibtex entry type', label: 'BibTeX Entry Type' },
  { type: 'language', label: 'Language' },
  { type: 'creation time', label: 'Creation Time' },
  { type: 'URL', label: 'URL' },
  { type: 'URI', label: 'URI' },
  { type: 'international standard recording code', label: 'International Standard Recording Code' },
  { type: 'MD4', label: 'MD4' },
  { type: 'MD5', label: 'MD5' },
  { type: 'SHA-0', label: 'SHA-0' },
  { type: 'SHA-1', label: 'SHA-1' },
  { type: 'RipeMD160', label: 'RipeMD160' },
  { type: 'GPS latitude ref', label: 'GPS Latitude Ref' },
  { type: 'GPS latitude', label: 'GPS Latitude' },
  { type: 'GPS longitude ref', label: 'GPS Longitude Ref' },
  { type: 'GPS longitude', label: 'GPS Longitude' },
  { type: 'city', label: 'City' },
  { type: 'sublocation', label: 'Sublocation' },
  { type: 'country', label: 'Country' },
  { type: 'country code', label: 'Country Code' },
  { type: 'unknown', label: 'Unknown' },
  { type: 'description', label: 'Description' },
  { type: 'copyright', label: 'Copyright' },
  { type: 'rights', label: 'Rights' },
  { type: 'keywords', label: 'Keywords' },
  { type: 'abstract', label: 'Abstract' },
  { type: 'summary', label: 'Summary' },
  { type: 'subject', label: 'Subject' },
  { type: 'creator', label: 'Creator' },
  { type: 'format', label: 'Format' },
  { type: 'format version', label: 'Format Version' },
  { type: 'created by software', label: 'Created by Software' },
  { type: 'unknown date', label: 'Unknown Date' },
  { type: 'creation date', label: 'Creation Date' },
  { type: 'modification date', label: 'Modification Date' },
  { type: 'last printed', label: 'Last Printed' },
  { type: 'last saved by', label: 'Last Saved By' },
  { type: 'total editing time', label: 'Total Editing Time' },
  { type: 'editing cycles', label: 'Editing Cycles' },
  { type: 'modified by software', label: 'Modified by Software' },
  { type: 'revision history', label: 'Revision History' },
  { type: 'embedded file size', label: 'Embedded File Size' },
  { type: 'file type', label: 'File Type' },
  { type: 'package name', label: 'Package Name' },
  { type: 'package version', label: 'Package Version' },
  { type: 'section', label: 'Section' },
  { type: 'upload priority', label: 'Upload Priority' },
  { type: 'dependencies', label: 'Dependencies' },
  { type: 'conflicting packages', label: 'Conflicting Packages' },
  { type: 'replaced packages', label: 'Replaced Packages' },
  { type: 'provides', label: 'Provides' },
  { type: 'recommendations', label: 'Recommendations' },
  { type: 'suggestions', label: 'Suggestions' },
  { type: 'maintainer', label: 'Maintainer' },
  { type: 'installed size', label: 'Installed Size' },
  { type: 'source', label: 'Source' },
  { type: 'is essential', label: 'Is Essential' },
  { type: 'target architecture', label: 'Target Architecture' },
  { type: 'pre dependency', label: 'Pre-Dependency' },
  { type: 'license', label: 'License' },
  { type: 'distribution', label: 'Distribution' },
  { type: 'build host', label: 'Build Host' },
  { type: 'vendor', label: 'Vendor' },
  { type: 'target operating system', label: 'Target Operating System' },
  { type: 'software version', label: 'Software Version' },
  { type: 'target platform', label: 'Target Platform' },
  { type: 'resource type', label: 'Resource Type' },
  { type: 'library search path', label: 'Library Search Path' },
  { type: 'library dependency', label: 'Library Dependency' },
  { type: 'camera make', label: 'Camera Make' },
  { type: 'camera model', label: 'Camera Model' },
  { type: 'exposure', label: 'Exposure' },
  { type: 'aperture', label: 'Aperture' },
  { type: 'exposure bias', label: 'Exposure Bias' },
  { type: 'flash', label: 'Flash' },
  { type: 'flash bias', label: 'Flash Bias' },
  { type: 'focal length', label: 'Focal Length' },
  { type: 'focal length 35mm', label: 'Focal Length 35mm' },
  { type: 'iso speed', label: 'ISO Speed' },
  { type: 'exposure mode', label: 'Exposure Mode' },
  { type: 'metering mode', label: 'Metering Mode' },
  { type: 'macro mode', label: 'Macro Mode' },
  { type: 'image quality', label: 'Image Quality' },
  { type: 'white balance', label: 'White Balance' },
  { type: 'orientation', label: 'Orientation' },
  { type: 'magnification', label: 'Magnification' },
  { type: 'image dimensions', label: 'Image Dimensions' },
  { type: 'produced by software', label: 'Produced by Software' },
  { type: 'thumbnail', label: 'Thumbnail' },
  { type: 'image resolution', label: 'Image Resolution' },
  { type: 'character set', label: 'Character Set' },
  { type: 'line count', label: 'Line Count' },
  { type: 'paragraph count', label: 'Paragraph Count' },
  { type: 'word count', label: 'Word Count' },
  { type: 'character count', label: 'Character Count' },
  { type: 'page orientation', label: 'Page Orientation' },
  { type: 'paper size', label: 'Paper Size' },
  { type: 'template', label: 'Template' },
  { type: 'company', label: 'Company' },
  { type: 'manager', label: 'Manager' },
  { type: 'revision number', label: 'Revision Number' },
  { type: 'duration', label: 'Duration' },
  { type: 'album', label: 'Album' },
  { type: 'artist', label: 'Artist' },
  { type: 'genre', label: 'Genre' },
  { type: 'track number', label: 'Track Number' },
  { type: 'disk number', label: 'Disk Number' },
  { type: 'performer', label: 'Performer' },
  { type: 'contact', label: 'Contact' },
  { type: 'song version', label: 'Song Version' },
  { type: 'picture', label: 'Picture' },
  { type: 'cover picture', label: 'Cover Picture' },
  { type: 'contributor picture', label: 'Contributor Picture' },
  { type: 'event picture', label: 'Event Picture' },
  { type: 'logo', label: 'Logo' },
  { type: 'broadcast television system', label: 'Broadcast Television System' },
  { type: 'source device', label: 'Source Device' },
  { type: 'disclaimer', label: 'Disclaimer' },
  { type: 'warning', label: 'Warning' },
  { type: 'page order', label: 'Page Order' },
  { type: 'writer', label: 'Writer' },
  { type: 'product version', label: 'Product Version' },
  { type: 'contributor', label: 'Contributor' },
  { type: 'movie director', label: 'Movie Director' },
  { type: 'network', label: 'Network' },
  { type: 'show', label: 'Show' },
  { type: 'chapter name', label: 'Chapter Name' },
  { type: 'song count', label: 'Song Count' },
  { type: 'starting song', label: 'Starting Song' },
  { type: 'play counter', label: 'Play Counter' },
  { type: 'conductor', label: 'Conductor' },
  { type: 'interpretation', label: 'Interpretation' },
  { type: 'composer', label: 'Composer' },
  { type: 'beats per minute', label: 'Beats per Minute' },
  { type: 'encoded by', label: 'Encoded By' },
  { type: 'original title', label: 'Original Title' },
  { type: 'original artist', label: 'Original Artist' },
  { type: 'original writer', label: 'Original Writer' },
  { type: 'original release year', label: 'Original Release Year' },
  { type: 'original performer', label: 'Original Performer' },
  { type: 'lyrics', label: 'Lyrics' },
  { type: 'popularity', label: 'Popularity' },
  { type: 'licensee', label: 'Licensee' },
  { type: 'musician credit list', label: 'Musician Credit List' },
  { type: 'mood', label: 'Mood' },
  { type: 'subtitle', label: 'Subtitle' },
  { type: 'display type', label: 'Display Type' },
  { type: 'full data', label: 'Full Data' },
  { type: 'rating', label: 'Rating' },
  { type: 'organization', label: 'Organization' },
  { type: 'ripper', label: 'Ripper' },
  { type: 'producer', label: 'Producer' },
  { type: 'group', label: 'Group' },
  { type: 'original filename', label: 'Original Filename' },
  { type: 'disc count', label: 'Disc Count' },
  { type: 'codec', label: 'Codec' },
  { type: 'video codec', label: 'Video Codec' },
  { type: 'audio codec', label: 'Audio Codec' },
  { type: 'subtitle codec', label: 'Subtitle Codec' },
  { type: 'container format', label: 'Container Format' },
  { type: 'bitrate', label: 'Bitrate' },
  { type: 'nominal bitrate', label: 'Nominal Bitrate' },
  { type: 'minimum bitrate', label: 'Minimum Bitrate' },
  { type: 'maximum bitrate', label: 'Maximum Bitrate' },
  { type: 'serial', label: 'Serial' },
  { type: 'encoder', label: 'Encoder' },
  { type: 'encoder version', label: 'Encoder Version' },
  { type: 'track gain', label: 'Track Gain' },
  { type: 'track peak', label: 'Track Peak' },
  { type: 'album gain', label: 'Album Gain' },
  { type: 'album peak', label: 'Album Peak' },
  { type: 'reference level', label: 'Reference Level' },
  { type: 'location name', label: 'Location Name' },
  { type: 'location elevation', label: 'Location Elevation' },
  { type: 'location horizontal error', label: 'Location Horizontal Error' },
  { type: 'location movement speed', label: 'Location Movement Speed' },
  { type: 'location movement direction', label: 'Location Movement Direction' },
  { type: 'location capture direction', label: 'Location Capture Direction' },
  { type: 'show episode number', label: 'Show Episode Number' },
  { type: 'show season number', label: 'Show Season Number' },
  { type: 'grouping', label: 'Grouping' },
  { type: 'device manufacturer', label: 'Device Manufacturer' },
  { type: 'device model', label: 'Device Model' },
  { type: 'audio language', label: 'Audio Language' },
  { type: 'channels', label: 'Channels' },
  { type: 'sample rate', label: 'Sample Rate' },
  { type: 'audio depth', label: 'Audio Depth' },
  { type: 'audio bitrate', label: 'Audio Bitrate' },
  { type: 'maximum audio bitrate', label: 'Maximum Audio Bitrate' },
  { type: 'video dimensions', label: 'Video Dimensions' },
  { type: 'video depth', label: 'Video Depth' },
  { type: 'frame rate', label: 'Frame Rate' },
  { type: 'pixel aspect ratio', label: 'Pixel Aspect Ratio' },
  { type: 'video bitrate', label: 'Video Bitrate' },
  { type: 'maximum video bitrate', label: 'Maximum Video Bitrate' },
  { type: 'subtitle language', label: 'Subtitle Language' },
  { type: 'video language', label: 'Video Language' },
  { type: 'table of contents', label: 'Table of Contents' },
  { type: 'video duration', label: 'Video Duration' },
  { type: 'audio duration', label: 'Audio Duration' },
  { type: 'subtitle duration', label: 'Subtitle Duration' },
  { type: 'audio preview', label: 'Audio Preview' },
  { type: 'narinfo', label: 'Narinfo' },
  { type: 'nar', label: 'Nar' },
  { type: 'last', label: 'Last' },
].sort((a, b) => a.label.localeCompare(b.label));

export default function BrowsePage() {
  const theme = useTheme();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchFilter['type']>('filename');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sharerCounts, setSharerCounts] = useState<Record<string, number>>({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    hash: string;
    filename: string;
    magnetLink: string;
    file: any;
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


  const handleDialogOpen = (hash: string, filename: string, magnetLink: string, file: any) => {
    setDialogContent({ hash, filename, magnetLink, file });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const fetchGroups = async () => {
    try {
      const response = await api.fetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

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

  // Fetch ratings for files
  const fetchFileRatings = async (files: File[]) => {
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
  
  const searchFiles = async (query: string, groupId: string, filter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query,
        group: groupId,
        filter,
      });
      
      const response = await api.fetch(`${API_ENDPOINTS.SEARCH}?${params}`);
      const data = await response.json();
      
      // Filter out duplicates by hash
      const uniqueFiles = new Map();
      data.forEach(file => {
        // Only add if not already present or replace with more details
        if (!uniqueFiles.has(file.hash) || file.id) {
          uniqueFiles.set(file.hash, file);
        }
      });
      
      // Convert back to array
      const uniqueFileArray = Array.from(uniqueFiles.values());
      setFiles(uniqueFileArray);
      await fetchSharerCounts(uniqueFileArray);
      await fetchFileRatings(uniqueFileArray);
    } catch (error) {
      console.error('Error searching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((query: string, groupId: string, filter: string) => {
    searchFiles(query, groupId, filter);
  }, 300);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        query: encodeURIComponent(query),
        filter: selectedFilter
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

  useEffect(() => {
    window.electron.ipcRenderer.on('torrent-download-finished', (message) => {
      setSnackbarMessage(`${message.name} successfully downloaded to ${message.path}`);
      setOpenSnackbar(true);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroups();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedGroup) {
      debouncedSearch(searchQuery, selectedGroup, selectedFilter);
    }
  }, [searchQuery, selectedGroup, selectedFilter]);

  // Add handleSortChange function for sorting
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  // Add sortFiles function to sort the files based on selected sort option
  const sortFiles = (filesToSort: File[]) => {
    const [field, direction] = sortBy.split('_');
    
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'filename':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
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
  const totalPages = Math.ceil(files.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sortedFiles = sortFiles(files);
  const currentPageResults = sortedFiles.slice(startIndex, endIndex);

  // Add handlePageChange function
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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

  const handleDownload = (fileId: string, fileName: string, magnetLink: string) => {
    setDownloadingFiles(prev => ({
      ...prev,
      [fileId]: true
    }));
    
    setSnackbarMessage(`Download started: ${fileName}`);
    setOpenSnackbar(true);
    
    // Fix the electron API call - leechFile is exposed directly, not on ipcRenderer
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

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
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
            Browse Files
          </Typography>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Autocomplete
                  fullWidth
                  options={groups}
                  getOptionLabel={(option) => option.name}
                  value={groups.find(group => group.id === selectedGroup) || null}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setSelectedGroup(newValue.id);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Group"
                      placeholder="Type to find group..."
                    />
                  )}
                />
              </Grid>
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
              <Grid item xs={12} md={2}>
                <Autocomplete
                  fullWidth
                  disableClearable
                  options={searchFilters}
                  getOptionLabel={(option) => option.label}
                  value={searchFilters.find(filter => filter.type === selectedFilter) || searchFilters[0]}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setSelectedFilter(newValue.type);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter Type"
                      placeholder="Choose filter type..."
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
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
                        },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDialogOpen(file.hash, file.filename, file.magnetLink, file)}
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
                                sx={{ mr: 1 }}
                              />
                            </Tooltip>
                            <Tooltip title="Size">
                              <Chip
                                  icon={<StorageIcon fontSize="small" />}
                                  label={formatFileSize(file.size)}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                              />
                            </Tooltip>
                          </Box>
                          
                          <Tooltip title={downloadingFiles[file.hash] ? "Download started" : "Download"}>
                            <span>
                              <IconButton 
                                size="medium"
                                color={downloadingFiles[file.hash] ? "success" : "primary"}
                                sx={{ 
                                  bgcolor: 'action.hover',
                                  '&:hover': {
                                    bgcolor: 'action.selected',
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file.hash, file.filename, file.magnetLink);
                                }}
                                disabled={downloadingFiles[file.hash]}
                              >
                                {downloadingFiles[file.hash] ? <CheckCircleIcon /> : <FileDownloadIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
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

              {/* Add pagination controls */}
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
                  {dialogContent.file && (
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
                          {Object.entries(dialogContent.file).map(([key, value], index) => (
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