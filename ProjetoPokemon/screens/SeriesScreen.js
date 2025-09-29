import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import TCGdexService from '../services/TCGdexService';

const { width } = Dimensions.get('window');

const SeriesScreen = ({ navigation }) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [offlineSummary, setOfflineSummary] = useState(null);

  useEffect(() => {
    loadSeries();
    loadOfflineSummary();
  }, []);

  const loadSeries = async () => {
    try {
      setLoading(true);
      console.log('Carregando séries...');
      
      // Buscar configurações salvas específicas do idioma atual
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const languageKey = savedLanguage || 'pt';
      const seriesKey = `selectedSeries_${languageKey}`;
      const savedSeries = await AsyncStorage.getItem(seriesKey);
      
      let seriesData;
      if (savedSeries) {
        // Usar séries filtradas baseadas nas configurações do usuário
        const selectedSeriesIds = JSON.parse(savedSeries);
        const allSeries = await TCGdexService.getAllSeries();
        seriesData = allSeries.filter(series => selectedSeriesIds.includes(series.id));
        console.log('Séries filtradas baseadas nas configurações:', seriesData.length);
      } else {
        // Usar método padrão se não há configurações
        seriesData = await TCGdexService.getSeries();
        console.log('Séries padrão:', seriesData.length);
      }
      
      console.log('Dados recebidos:', seriesData.length, 'séries');
      
      // Ordenar por ordem cronológica (mais recentes primeiro)
      const sortedSeries = seriesData.sort((a, b) => {
        const order = ['sv', 'swsh', 'sm', 'xy', 'bw', 'col', 'hgss', 'dp', 'ex', 'base'];
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return bIndex - aIndex; // Mais recentes primeiro
      });
      
      setSeries(sortedSeries);
      
      if (sortedSeries.length === 0) {
        console.log('Nenhuma série encontrada');
      } else {
        console.log('Séries carregadas:', sortedSeries.map(s => s.name));
      }
    } catch (error) {
      console.error('Erro ao carregar séries:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar as séries. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeries();
    await loadOfflineSummary();
    setRefreshing(false);
  };

  const loadOfflineSummary = async () => {
    try {
      const summary = await TCGdexService.getOfflineSummary();
      setOfflineSummary(summary);
    } catch (error) {
      console.error('Erro ao carregar resumo offline:', error);
    }
  };

  const handleUpdateData = async () => {
    try {
      // Verificar rate limit (1 atualização por dia)
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const lastUpdateKey = 'lastUpdateCheck';
      const lastUpdate = await AsyncStorage.getItem(lastUpdateKey);
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
      
      if (lastUpdate && (now - parseInt(lastUpdate)) < oneDay) {
        const nextUpdate = new Date(parseInt(lastUpdate) + oneDay);
        Alert.alert(
          'Atualização Limitada',
          `Você já verificou atualizações hoje. Próxima verificação disponível em: ${nextUpdate.toLocaleDateString('pt-BR')} às ${nextUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      setUpdating(true);
      
      // Salvar timestamp da verificação
      await AsyncStorage.setItem(lastUpdateKey, now.toString());
      
      // Verificar atualizações
      const updateCheck = await TCGdexService.checkForUpdates();
      
      if (updateCheck.needsUpdate) {
        Alert.alert(
          'Atualizações Disponíveis',
          updateCheck.message,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Atualizar', 
              onPress: async () => {
                const result = await TCGdexService.updateOfflineData();
                if (result.success) {
                  await loadOfflineSummary();
                } else {
                  Alert.alert('Erro', result.message);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Atualizado', updateCheck.message);
      }
      
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      Alert.alert('Erro', 'Erro ao verificar atualizações');
    } finally {
      setUpdating(false);
    }
  };

  const getLogoUrl = (series) => {
    if (!series.logo) return null;
    
    // Se a URL já tem extensão, usar como está
    if (series.logo.includes('.webp') || series.logo.includes('.png') || series.logo.includes('.jpg')) {
      return series.logo;
    }
    
    // Se não tem extensão, adicionar .webp
    return series.logo + '.webp';
  };

  const getLocalLogo = (series) => {
    // Mapeamento de IDs das séries para logos locais
    // Só inclui os logos que realmente existem
    const localLogos = {
      // Adicione aqui os logos que você tiver
      // 'xy': require('../assets/series/xy.png'),
      // 'sm': require('../assets/series/sm.png'),
      // 'swsh': require('../assets/series/swsh.png'),
      // 'sv': require('../assets/series/sv.png'),
      // 'bw': require('../assets/series/bw.png'),
      // 'dp': require('../assets/series/dp.png'),
      // 'ex': require('../assets/series/ex.png'),
      // 'base': require('../assets/series/base.png'),
      // 'col': require('../assets/series/col.png'),
      // 'hgss': require('../assets/series/hgss.png'),
    };
    
    return localLogos[series.id] || null;
  };

  const handleSeriesPress = (series) => {
    navigation.navigate('Sets', { 
      seriesId: series.id, 
      seriesName: series.name 
    });
  };

  const renderSeriesItem = ({ item }) => {
    const itemWidth = (width - 60) / 2;
    
    // Debug para verificar dados da série
    console.log('Série:', item.name, 'Dados:', {
      releaseDate: item.releaseDate,
      release: item.release,
      date: item.date,
      launchDate: item.launchDate
    });
    
    return (
      <TouchableOpacity 
        style={[styles.seriesItem, { width: itemWidth }]} 
        onPress={() => handleSeriesPress(item)}
      >
        <View style={styles.logoContainer}>
          {getLogoUrl(item) ? (
            <Image 
              source={{ uri: getLogoUrl(item) }} 
              style={styles.seriesLogo}
              resizeMode="contain"
            />
          ) : getLocalLogo(item) ? (
            <Image 
              source={getLocalLogo(item)} 
              style={styles.seriesLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderText}>📖</Text>
            </View>
          )}
        </View>
        <View style={styles.seriesInfo}>
          <Text style={styles.seriesName}>{item.name}</Text>
          <Text style={styles.seriesDate}>
            {item.releaseDate || item.release || item.date || item.launchDate 
              ? new Date(item.releaseDate || item.release || item.date || item.launchDate).toLocaleDateString('pt-BR') 
              : 'Data não disponível'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
      {/* Header com botão de atualização */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Coleções</Text>
          <Text style={styles.headerSubtitle}>{series.length} coleções disponíveis</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.updateButton, updating && styles.updateButtonDisabled]} 
            onPress={handleUpdateData}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Verificar Atualizações</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => {
              Alert.alert(
                'Verificar Atualização',
                'O botão "Verificar Atualização" verifica se há novas coleções, expansões ou cartas disponíveis na API e baixa apenas o que é novo, mantendo seus dados sempre atualizados.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resumo dos dados offline */}
      {offlineSummary && offlineSummary.hasData && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Dados Offline</Text>
          <Text style={styles.summaryText}>
            {offlineSummary.counts.series} coleções • {offlineSummary.counts.sets} expansões • {offlineSummary.counts.cards} cartas
          </Text>
          <Text style={styles.summaryDate}>
            Última atualização: {new Date(offlineSummary.lastUpdate).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      )}

      <FlatList
        data={series}
        renderItem={renderSeriesItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  helpButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  row: {
    justifyContent: 'center',
    gap: 10,
  },
  seriesItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoContainer: {
    width: '100%',
    height: 80,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  seriesLogo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 24,
  },
  seriesInfo: {
    alignItems: 'center',
  },
  seriesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  seriesDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default SeriesScreen;
