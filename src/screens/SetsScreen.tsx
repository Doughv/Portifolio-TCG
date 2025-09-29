import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService, { PokemonSet } from '../services/DatabaseService';
import FilterService from '../services/FilterService';
import TCGdexService from '../services/TCGdexService';
import ImageDownloadService from '../services/ImageDownloadService';

export default function SetsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { seriesId } = route.params as { seriesId: string };

  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSets();
  }, [seriesId]);

  const loadSets = async () => {
    try {
      setLoading(true);
      console.log(`Carregando sets filtrados da série ${seriesId} do banco de dados...`);
      const setsData = await FilterService.getFilteredSetsBySeries(seriesId);
      setSets(setsData);
      console.log(`${setsData.length} sets carregados (com filtros aplicados)`);
    } catch (error) {
      console.error('Error loading filtered sets:', error);
      Alert.alert('Erro', 'Não foi possível carregar os sets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromAPI = async () => {
    try {
      setUpdating(true);
      
      Alert.alert(
        'Atualizar da API',
        'Isso verificará atualizações disponíveis na API e baixará dados novos. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Atualizar', 
            onPress: async () => {
              try {
                // Verificar atualizações
                const updateCheck = await TCGdexService.checkForUpdates();
                
                if (updateCheck.hasUpdates) {
                  Alert.alert(
                    'Atualizações Disponíveis',
                    `Há atualizações disponíveis:\n• ${updateCheck.newSeries || 0} séries novas\n• ${updateCheck.newSets || 0} sets novos\n• ${updateCheck.newCards || 0} cartas novas\n\nDeseja sincronizar agora?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Sincronizar', 
                        onPress: async () => {
                          const result = await TCGdexService.syncUpdatesOnly();
                          if (result.success) {
                            Alert.alert('Sucesso', result.message);
                            await loadSets(); // Recarregar dados
                          } else {
                            Alert.alert('Erro', result.message);
                          }
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert('Atualizado', 'Todos os dados estão atualizados!');
                }
              } catch (error) {
                console.error('Erro na verificação:', error);
                Alert.alert('Erro', 'Não foi possível verificar atualizações');
              } finally {
                setUpdating(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao iniciar verificação:', error);
      setUpdating(false);
    }
  };

  const handleSetPress = (setId: string) => {
    navigation.navigate('Cards' as never, { setId } as never);
  };

  const renderSetItem = ({ item }: { item: PokemonSet }) => (
    <TouchableOpacity
      style={styles.setItem}
      onPress={() => handleSetPress(item.id)}
    >
      <Text style={styles.setName}>{item.name}</Text>
      <Text style={styles.setInfo}>
        {item.totalCards} cards
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando sets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Expansões</Text>
          <Text style={styles.subtitle}>
            {sets.length} expansões disponíveis
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={handleUpdateFromAPI}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Atualizar</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={sets}
        renderItem={renderSetItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  gridContainer: {
    padding: 16,
    gap: 12,
  },
  setItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80,
    justifyContent: 'center',
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

