import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DatabaseService, { PokemonSeries } from '../services/DatabaseService';

export default function SeriesScreen() {
  const navigation = useNavigation();
  const [series, setSeries] = useState<PokemonSeries[]>([]);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const seriesData = await DatabaseService.getAllSeries();
      setSeries(seriesData);
    } catch (error) {
      console.error('Error loading series:', error);
    }
  };

  const handleSeriesPress = (seriesId: string) => {
    navigation.navigate('Sets' as never, { seriesId } as never);
  };

  const renderSeriesItem = ({ item }: { item: PokemonSeries }) => (
    <TouchableOpacity
      style={styles.seriesCard}
      onPress={() => handleSeriesPress(item.id)}
    >
      <Text style={styles.seriesName}>{item.name}</Text>
      <Text style={styles.seriesSets}>{item.totalSets} sets</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={series}
        renderItem={renderSeriesItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  seriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seriesName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  seriesSets: {
    fontSize: 14,
    color: '#666',
  },
});

