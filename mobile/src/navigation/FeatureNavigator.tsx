import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeatureStackParamList } from './types';

// Import screens (placeholders for now)
import FileDetailsScreen from '../screens/features/FileDetailsScreen';
import CommentsScreen from '../screens/features/CommentsScreen';
import GroupDetailsScreen from '../screens/features/GroupDetailsScreen';
import UserDetailsScreen from '../screens/features/UserDetailsScreen';
import SettingsScreen from '../screens/features/SettingsScreen';
import StatisticsScreen from '../screens/features/StatisticsScreen';
import SharedScreen from '../screens/features/SharedScreen';
import RecentScreen from '../screens/features/RecentScreen';
import RecommendationsScreen from '../screens/features/RecommendationsScreen';

const Stack = createNativeStackNavigator<FeatureStackParamList>();

const FeatureNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="FileDetails" component={FileDetailsScreen} />
      <Stack.Screen name="Comments" component={CommentsScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="Shared" component={SharedScreen} />
      <Stack.Screen name="Recent" component={RecentScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
    </Stack.Navigator>
  );
};

export default FeatureNavigator; 