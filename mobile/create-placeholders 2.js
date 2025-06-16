const fs = require('fs');
const path = require('path');

// Placeholder screens to create
const screens = [
  {
    name: 'SettingsScreen',
    path: 'src/screens/features/SettingsScreen.tsx',
    title: 'Settings',
    subtitle: 'App settings will be available here.',
    hasParams: false
  },
  {
    name: 'StatisticsScreen',
    path: 'src/screens/features/StatisticsScreen.tsx',
    title: 'Statistics',
    subtitle: 'File sharing statistics will be displayed here.',
    hasParams: false
  },
  {
    name: 'SharedScreen',
    path: 'src/screens/features/SharedScreen.tsx',
    title: 'Shared Files',
    subtitle: 'Your shared files will appear here.',
    hasParams: false
  },
  {
    name: 'RecentScreen',
    path: 'src/screens/features/RecentScreen.tsx',
    title: 'Recent Files',
    subtitle: 'Recently shared files will appear here.',
    hasParams: false
  },
  {
    name: 'RecommendationsScreen',
    path: 'src/screens/features/RecommendationsScreen.tsx',
    title: 'Recommendations',
    subtitle: 'File recommendations will appear here.',
    hasParams: false
  }
];

// Template for screens without params
const simpleScreenTemplate = (name, title, subtitle) => `import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const ${name} = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>${title}</Text>
        <Text style={styles.subtitle}>${subtitle}</Text>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ${name};
`;

// Create each file
screens.forEach(screen => {
  const filePath = path.resolve(__dirname, screen.path);
  const content = simpleScreenTemplate(
    screen.name,
    screen.title,
    screen.subtitle
  );
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created ${screen.path}`);
  } else {
    console.log(`File already exists: ${screen.path}`);
  }
});

console.log('All placeholder screens created successfully!'); 