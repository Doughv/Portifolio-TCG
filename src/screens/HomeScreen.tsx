import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DatabaseService, { PokemonSeries } from '../services/DatabaseService';
import SyncService from '../services/SyncService';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [series, setSeries] = useState<PokemonSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setIsLoading(true);
      const seriesData = await DatabaseService.getAllSeries();
      setSeries(seriesData);
    } catch (error) {
      console.error('Error loading series:', error);
      Alert.alert('Erro', 'Não foi possível carregar as séries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await SyncService.syncAllData();
      await loadSeries();
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os dados');
    } finally {
      setIsRefreshing(false);
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
      <View style={styles.seriesContent}>
        <Text style={styles.seriesName}>{item.name}</Text>
        <Text style={styles.seriesSets}>{item.totalSets} sets</Text>
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (series.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Nenhuma série encontrada</Text>
        <Text style={styles.emptyText}>
          Toque no botão abaixo para sincronizar os dados do Pokemon TCG
        </Text>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.syncButtonText}>
            {isRefreshing ? 'Sincronizando...' : 'Sincronizar Dados'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon TCG Collection</Text>
        <Text style={styles.subtitle}>
          {series.length} séries disponíveis
        </Text>
      </View>

      <TouchableOpacity
        style={styles.syncButton}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        <Text style={styles.syncButtonText}>
          {isRefreshing ? 'Sincronizando...' : 'Sincronizar Dados'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={series}
        renderItem={renderSeriesItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  seriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seriesContent: {
    flex: 1,
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
  arrowContainer: {
    padding: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});
