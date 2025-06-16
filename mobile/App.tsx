import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed from React Native',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

export default function App() {
  return (
    <>
      <RootNavigator />
      <Toast />
    </>
  );
}
