import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import SetItem from '../components/SetItem';
import TCGdexService from '../services/TCGdexService';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 40) / numColumns;

const SetsScreen = ({ navigation, route }) => {
  const { seriesId, seriesName } = route.params;
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: seriesName || 'Expansões' });
    loadSets();
  }, [seriesId]);

  const loadSets = async () => {
    try {
      setLoading(true);
      console.log('Carregando expansões da série:', seriesName);
      
      // Buscar configurações salvas específicas do idioma atual
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const languageKey = savedLanguage || 'pt';
      const expansionsKey = `selectedExpansions_${languageKey}`;
      const savedExpansions = await AsyncStorage.getItem(expansionsKey);
      
      let setsData;
      if (savedExpansions) {
        // Usar expansões filtradas baseadas nas configurações do usuário
        const selectedExpansionIds = JSON.parse(savedExpansions);
        const allSets = await TCGdexService.getAllSets();
        
        // Filtrar apenas expansões da série atual que estão nas configurações
        setsData = allSets.filter(set => 
          set.id.startsWith(seriesId) && selectedExpansionIds.includes(set.id)
        );
        console.log('Expansões filtradas baseadas nas configurações:', setsData.length);
      } else {
        // Usar método padrão se não há configurações
        setsData = await TCGdexService.getSetsBySeries(seriesId);
        console.log('Expansões padrão:', setsData.length);
      }
      
      console.log('Dados recebidos:', setsData.length, 'expansões');
      
      setSets(setsData);
    } catch (error) {
      console.error('Erro ao carregar coleções:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar as coleções. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSets();
    setRefreshing(false);
  };

  const handleSetPress = (set) => {
    console.log('Navegando para coleção:', set.name);
    navigation.navigate('Cards', { 
      setId: set.id, 
      setName: set.name,
      setCardCount: set.cardCount?.total || 0
    });
  };

  const renderSetItem = ({ item }) => (
    <SetItem set={item} onPress={handleSetPress} itemWidth={itemWidth} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando coleções...</Text>
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
          style={styles.downloadsButton}
          onPress={() => navigation.navigate('Downloads')}
        >
          <Text style={styles.downloadsButtonText}>Downloads</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={sets}
        renderItem={renderSetItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

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
  listContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  downloadsButton: {
    backgroundColor: '#6c757d',
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
  downloadsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SetsScreen;