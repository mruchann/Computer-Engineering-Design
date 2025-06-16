import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FeatureStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { API_ENDPOINTS } from '../../constants/api';

type FileDetailsScreenRouteProp = RouteProp<FeatureStackParamList, 'FileDetails'>;
type FileDetailsScreenNavigationProp = NativeStackNavigationProp<FeatureStackParamList>;

interface FileDetails {
  hash: string;
  filename: string;
  timestamp: string;
  owner_username: string;
  magnetLink: string;
  mimetype?: string;
}

const FileDetailsScreen = () => {
  const route = useRoute<FileDetailsScreenRouteProp>();
  const navigation = useNavigation<FileDetailsScreenNavigationProp>();
  const { fileHash, fileName, magnetLink } = route.params;

  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [sharerCount, setSharerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [currentlySharing, setCurrentlySharing] = useState<boolean>(false);
  const [rating, setRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    fetchFileDetails();
    fetchSharerCount();
    fetchRating();
  }, []);

  const fetchFileDetails = async () => {
    try {
      // In a real app, you would fetch detailed file info
      // Here we're creating a placeholder since we have basic info from params
      setFileDetails({
        hash: fileHash,
        filename: fileName,
        timestamp: new Date().toISOString(),
        owner_username: 'Unknown', // This would come from the API
        magnetLink: magnetLink,
        mimetype: guessMimetypeFromFilename(fileName),
      });
    } catch (error) {
      console.error('Error fetching file details:', error);
      Alert.alert('Error', 'Failed to load file details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharerCount = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.SHARERS_COUNT}?file_hash=${fileHash}`);
      if (response.data && response.data.count !== undefined) {
        setSharerCount(response.data.count);
        
        // Also check if the current user is sharing this file
        if (response.data.currently_sharing !== undefined) {
          setCurrentlySharing(response.data.currently_sharing);
        }
      }
    } catch (error) {
      console.error('Error fetching sharer count:', error);
    }
  };

  const fetchRating = async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.RATINGS}?file_hash=${fileHash}`);
      if (response.data) {
        if (response.data.user_rating !== undefined) {
          setRating(response.data.user_rating);
        }
        if (response.data.average_rating !== undefined) {
          setAvgRating(response.data.average_rating);
        }
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await apiClient.post(API_ENDPOINTS.MAGNET, {
        magnet_link: magnetLink,
        file_name: fileName,
      });
      Alert.alert('Success', `Started downloading ${fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to start download');
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleSharing = async () => {
    try {
      if (currentlySharing) {
        await apiClient.post(API_ENDPOINTS.SHARED_LEAVE, {
          file_hash: fileHash,
        });
        setCurrentlySharing(false);
        setSharerCount(Math.max(0, sharerCount - 1));
        Alert.alert('Success', 'You are no longer sharing this file');
      } else {
        await apiClient.post(API_ENDPOINTS.SHARED_JOIN, {
          file_hash: fileHash,
          file_name: fileName,
          magnet_link: magnetLink,
        });
        setCurrentlySharing(true);
        setSharerCount(sharerCount + 1);
        Alert.alert('Success', 'You are now sharing this file');
      }
    } catch (error) {
      console.error('Error toggling sharing status:', error);
      Alert.alert('Error', 'Failed to update sharing status');
    }
  };

  const handleRating = async (value: number) => {
    try {
      await apiClient.post(API_ENDPOINTS.RATINGS, {
        file_hash: fileHash,
        rating: value,
      });
      setRating(value);
      Alert.alert('Success', 'Rating submitted');
      fetchRating(); // Refresh the average rating
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleViewComments = () => {
    navigation.navigate('Comments', {
      fileHash,
      fileName,
    });
  };

  const guessMimetypeFromFilename = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (!extension) return undefined;
    
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
      zip: 'application/zip',
      mp3: 'audio/mpeg',
      mp4: 'video/mp4',
    };
    
    return mimeTypes[extension];
  };

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return 'document-outline';
    if (mimetype.includes('image')) return 'image-outline';
    if (mimetype.includes('video')) return 'videocam-outline';
    if (mimetype.includes('audio')) return 'musical-notes-outline';
    if (mimetype.includes('pdf')) return 'document-text-outline';
    if (mimetype.includes('text')) return 'document-text-outline';
    return 'document-outline';
  };

  const renderRatingStars = () => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={rating && star <= rating ? 'star' : 'star-outline'}
              size={24}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </SafeAreaView>
    );
  }

  if (!fileDetails) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load file details</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.fileIconContainer}>
          <Ionicons 
            name={getFileIcon(fileDetails.mimetype)} 
            size={60} 
            color="#2196F3"
          />
        </View>
        
        <Text style={styles.fileName}>{fileDetails.filename}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shared by:</Text>
          <Text style={styles.infoValue}>{fileDetails.owner_username}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Active sharers:</Text>
          <Text style={styles.infoValue}>{sharerCount}</Text>
        </View>

        {avgRating !== null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Average rating:</Text>
            <View style={styles.averageRatingContainer}>
              <Text style={styles.infoValue}>{avgRating.toFixed(1)}</Text>
              <Ionicons name="star" size={16} color="#FFD700" style={styles.starIcon} />
            </View>
          </View>
        )}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              currentlySharing ? styles.stopSharingButton : styles.startSharingButton
            ]}
            onPress={handleToggleSharing}
          >
            <Ionicons 
              name={currentlySharing ? 'stop-circle-outline' : 'share-outline'} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {currentlySharing ? 'Stop Sharing' : 'Start Sharing'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Rate this file</Text>
          {renderRatingStars()}
        </View>
        
        <TouchableOpacity 
          style={styles.commentsButton}
          onPress={handleViewComments}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
          <Text style={styles.commentsButtonText}>View Comments</Text>
        </TouchableOpacity>
        
        <View style={styles.magnetLinkContainer}>
          <Text style={styles.sectionTitle}>Magnet Link</Text>
          <Text style={styles.magnetLink} numberOfLines={2} ellipsizeMode="middle">
            {fileDetails.magnetLink}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fileIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    backgroundColor: '#f0f7ff',
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  fileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  startSharingButton: {
    backgroundColor: '#4CAF50',
  },
  stopSharingButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ratingSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: 5,
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    marginBottom: 20,
  },
  commentsButtonText: {
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 8,
  },
  magnetLinkContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  magnetLink: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default FileDetailsScreen; 