import { NavigatorScreenParams } from '@react-navigation/native';

// Define the parameter list for each navigator

// Main Tab Navigator screens
export type MainTabParamList = {
  Dashboard: undefined;
  Browse: undefined;
  Groups: undefined;
  Upload: undefined;
  Profile: undefined;
};

// Auth Navigator screens
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Feature Navigator screens
export type FeatureStackParamList = {
  FileDetails: { fileHash: string; fileName: string; magnetLink: string };
  Comments: { fileHash: string; fileName: string };
  GroupDetails: { groupId: string; groupName: string };
  UserDetails: { userId: string; username: string };
  Settings: undefined;
  Statistics: undefined;
  Shared: undefined;
  Recent: undefined;
  Recommendations: undefined;
};

// Root Navigator - combines all navigators
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainApp: NavigatorScreenParams<MainTabParamList>;
  Feature: NavigatorScreenParams<FeatureStackParamList>;
};

// Declare the navigation type for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 