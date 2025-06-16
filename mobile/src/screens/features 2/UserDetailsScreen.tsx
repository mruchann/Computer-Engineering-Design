import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { FeatureStackParamList } from '../../navigation/types';

type UserDetailsScreenRouteProp = RouteProp<FeatureStackParamList, 'UserDetails'>;

const UserDetailsScreen = () => {
  const route = useRoute<UserDetailsScreenRouteProp>();
  const { userId, username } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>User Profile</Text>
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.subtitle}>This screen will be implemented soon.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  name: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserDetailsScreen; 