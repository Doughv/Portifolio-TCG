import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService, { PokemonSet } from '../services/DatabaseService';

export default function SetsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { seriesId } = route.params as { seriesId: string };
  
  const [sets, setSets] = useState<PokemonSet[]>([]);

  useEffect(() => {
    loadSets();
  }, [seriesId]);

  const loadSets = async () => {
    try {
      const setsData = await DatabaseService.getSetsBySeries(seriesId);
      setSets(setsData);
    } catch (error) {
      console.error('Error loading sets:', error);
    }
  };

  const handleSetPress = (setId: string) => {
    navigation.navigate('Cards' as never, { setId } as never);
  };

  const renderSetItem = ({ item }: { item: PokemonSet }) => (
    <TouchableOpacity
      style={styles.setCard}
      onPress={() => handleSetPress(item.id)}
    >
      <Text style={styles.setName}>{item.name}</Text>
      <Text style={styles.setInfo}>
        {item.totalCards} cards • {new Date(item.releaseDate).getFullYear()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sets}
        renderItem={renderSetItem}
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
  setCard: {
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
  setName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  setInfo: {
    fontSize: 14,
    color: '#666',
  },
});

