import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tcgdexService from '../services/TCGdexService';

const { width } = Dimensions.get('window');

const LanguageConfigScreen = ({ navigation, route }) => {
  const { language } = route.params || { language: 'pt' };
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [expansions, setExpansions] = useState({});
  const [selectedExpansions, setSelectedExpansions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExpansions, setLoadingExpansions] = useState(false);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      loadSeries();
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedSeries.length > 0) {
      loadExpansions();
    }
  }, [selectedSeries]);

  const loadSavedSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
        
        // Carregar configurações específicas do idioma atual
        const languageKey = `selectedSeries_${savedLanguage}`;
        const expansionsKey = `selectedExpansions_${savedLanguage}`;
        
        const savedSeries = await AsyncStorage.getItem(languageKey);
        const savedExpansions = await AsyncStorage.getItem(expansionsKey);

        if (savedSeries) {
          setSelectedSeries(JSON.parse(savedSeries));
        }
        if (savedExpansions) {
          setSelectedExpansions(JSON.parse(savedExpansions));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações salvas:', error);
    }
  };

  const loadSeries = async () => {
    setLoading(true);
    try {
      // Alterar idioma do serviço
      await tcgdexService.setLanguage(selectedLanguage);
      
      // Buscar TODAS as séries disponíveis (sem filtros)
      const seriesData = await tcgdexService.getAllSeries();
      setSeries(seriesData);
      console.log('Todas as séries carregadas:', seriesData.length);
    } catch (error) {
      console.error('Erro ao carregar séries:', error);
      Alert.alert('Erro', 'Não foi possível carregar as séries. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadExpansions = async () => {
    setLoadingExpansions(true);
    try {
      const expansionsData = {};
      
      for (const seriesId of selectedSeries) {
        try {
          // Buscar TODAS as expansões da série (sem filtros)
          const seriesExpansions = await tcgdexService.getSetsBySeries(seriesId);
          expansionsData[seriesId] = seriesExpansions;
        } catch (error) {
          console.error(`Erro ao carregar expansões da série ${seriesId}:`, error);
          expansionsData[seriesId] = [];
        }
      }
      
      setExpansions(expansionsData);
      console.log('Todas as expansões carregadas:', Object.keys(expansionsData).length);
    } catch (error) {
      console.error('Erro ao carregar expansões:', error);
      Alert.alert('Erro', 'Não foi possível carregar as expansões. Tente novamente.');
    } finally {
      setLoadingExpansions(false);
    }
  };

  const toggleSeries = (seriesId) => {
    setSelectedSeries(prev => {
      if (prev.includes(seriesId)) {
        // Remove série e suas expansões
        const newExpansions = { ...expansions };
        delete newExpansions[seriesId];
        setExpansions(newExpansions);
        
        // Remove expansões selecionadas desta série
        setSelectedExpansions(prev => 
          prev.filter(expId => !expId.startsWith(seriesId))
        );
        
        return prev.filter(id => id !== seriesId);
      } else {
        return [...prev, seriesId];
      }
    });
  };

  const toggleExpansion = (expansionId) => {
    setSelectedExpansions(prev => {
      if (prev.includes(expansionId)) {
        return prev.filter(id => id !== expansionId);
      } else {
        return [...prev, expansionId];
      }
    });
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
      
      // Salvar configurações específicas do idioma atual
      const languageKey = `selectedSeries_${selectedLanguage}`;
      const expansionsKey = `selectedExpansions_${selectedLanguage}`;
      
      await AsyncStorage.setItem(languageKey, JSON.stringify(selectedSeries));
      await AsyncStorage.setItem(expansionsKey, JSON.stringify(selectedExpansions));
      
      // Salvar silenciosamente sem alerta
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    }
  };

  const getSeriesName = (seriesId) => {
    const seriesData = series.find(s => s.id === seriesId);
    return seriesData ? seriesData.name : seriesId;
  };

  const selectAllSeries = () => {
    const allSeriesIds = series.map(s => s.id);
    setSelectedSeries(allSeriesIds);
  };

  const selectNoneSeries = () => {
    setSelectedSeries([]);
    setExpansions({});
    setSelectedExpansions([]);
  };

  const selectAllExpansions = () => {
    const allExpansionIds = [];
    Object.values(expansions).forEach(seriesExpansions => {
      seriesExpansions.forEach(expansion => {
        allExpansionIds.push(expansion.id);
      });
    });
    setSelectedExpansions(allExpansionIds);
  };

  const selectNoneExpansions = () => {
    setSelectedExpansions([]);
  };

  const renderSeriesItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        selectedSeries.includes(item.id) && styles.selectedGridItem
      ]}
      onPress={() => toggleSeries(item.id)}
    >
      <Text style={[
        styles.gridItemText,
        selectedSeries.includes(item.id) && styles.selectedGridItemText
      ]}>
        {item.name}
      </Text>
      {selectedSeries.includes(item.id) && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const renderExpansionItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        selectedExpansions.includes(item.id) && styles.selectedGridItem
      ]}
      onPress={() => toggleExpansion(item.id)}
    >
      <Text style={[
        styles.gridItemText,
        selectedExpansions.includes(item.id) && styles.selectedGridItemText
      ]}>
        {item.name}
      </Text>
      {selectedExpansions.includes(item.id) && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  // Preparar dados das expansões para o FlatList
  const allExpansions = [];
  selectedSeries.forEach(seriesId => {
    if (expansions[seriesId]) {
      expansions[seriesId].forEach(expansion => {
        allExpansions.push({ ...expansion, seriesId });
      });
    }
  });


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Fixo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Configurações</Text>
          <TouchableOpacity onPress={saveSettings} style={styles.saveButtonHeader}>
            <Text style={styles.saveButtonTextHeader}>Salvar</Text>
          </TouchableOpacity>
        </View>

      <ScrollView style={styles.content}>
        {/* Seleção de Idioma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma Selecionado</Text>
          <View style={styles.languageDisplay}>
            <Text style={styles.currentLanguageText}>
              {selectedLanguage === 'pt' ? 'Português (BR)' : 'English (EN)'}
            </Text>
            <Text style={styles.languageNote}>
              Para alterar o idioma, use os botões TCG BR / EN TCG na tela principal
            </Text>
          </View>
        </View>

        {/* Seleção de Séries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coleções</Text>
            <View style={styles.selectButtons}>
              <TouchableOpacity style={styles.selectButton} onPress={selectAllSeries}>
                <Text style={styles.selectButtonText}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectButton} onPress={selectNoneSeries}>
                <Text style={styles.selectButtonText}>Nenhum</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Escolha as coleções que deseja visualizar
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando coleções...</Text>
            </View>
          ) : (
            <FlatList
              data={series}
              renderItem={renderSeriesItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContainer}
            />
          )}
        </View>

        {/* Seleção de Expansões */}
        {selectedSeries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expansões</Text>
              <View style={styles.selectButtons}>
                <TouchableOpacity style={styles.selectButton} onPress={selectAllExpansions}>
                  <Text style={styles.selectButtonText}>Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectButton} onPress={selectNoneExpansions}>
                  <Text style={styles.selectButtonText}>Nenhum</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Escolha as expansões específicas de cada coleção
            </Text>
            
            {loadingExpansions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando expansões...</Text>
              </View>
            ) : (
              <FlatList
                data={allExpansions}
                renderItem={renderExpansionItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.gridContainer}
              />
            )}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButtonHeader: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonTextHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  selectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  languageDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  currentLanguageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  languageNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  gridContainer: {
    gap: 10,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  selectedGridItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  selectedGridItemText: {
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default LanguageConfigScreen;
