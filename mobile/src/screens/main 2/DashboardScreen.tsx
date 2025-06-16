import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FeatureStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';

type FeatureScreenNavigationProp = NativeStackNavigationProp<FeatureStackParamList>;

const DashboardScreen = () => {
  const [loading, setLoading] = useState(false);
  const featureNavigation = useNavigation<FeatureScreenNavigationProp>();
  const { user } = useAuthStore();
  
  // Mock data for initial development
  const recentFiles = [
    { id: '1', name: 'CENG371_Lecture1.pdf', owner: 'prof_smith', type: 'pdf' },
    { id: '2', name: 'CENG382_Midterm.docx', owner: 'admin', type: 'doc' },
    { id: '3', name: 'Project_Guidelines.pptx', owner: 'department', type: 'ppt' },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pdf': return 'document-text-outline';
      case 'doc': return 'document-outline';
      case 'ppt': return 'easel-outline';
      default: return 'document-outline';
    }
  };

  const renderFileItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.fileCard}
      onPress={() => Alert.alert('Coming soon', 'This feature is under development')}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons name={getIconForType(item.type)} size={32} color="#2196F3" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileOwner}>Shared by: {item.owner}</Text>
      </View>
      <TouchableOpacity style={styles.downloadButton}>
        <Ionicons name="download-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>{user?.username || 'User'}</Text>
            <Text style={styles.subtitleText}>
              PeerLink Mobile is currently in development.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Files</Text>
          </View>
          
          <FlatList
            data={recentFiles}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id}
            style={styles.filesList}
          />
          
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => featureNavigation.navigate('Recent')}
          >
            <Text style={styles.browseButtonText}>Browse All Files</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filesList: {
    flex: 1,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  fileOwner: {
    fontSize: 12,
    color: '#666',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  browseButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DashboardScreen; 