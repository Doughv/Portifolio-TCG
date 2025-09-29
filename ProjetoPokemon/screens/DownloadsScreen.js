import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import DownloadStats from '../components/DownloadStats';

const DownloadsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <DownloadStats />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default DownloadsScreen;
