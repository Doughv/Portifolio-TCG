import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TCGdexService from '../services/TCGdexService';
import DatabaseService, { PokemonSeries, PokemonSet } from '../services/DatabaseService';
import FilterService from '../services/FilterService';

const { width } = Dimensions.get('window');

export default function LanguageConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { language } = route.params as { language: string };
  
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [series, setSeries] = useState<PokemonSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [expansions, setExpansions] = useState<{[key: string]: PokemonSet[]}>({});
  const [selectedExpansions, setSelectedExpansions] = useState<string[]>([]);
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
        } else {
          // Se não há configurações salvas, selecionar TODAS as séries por padrão
          console.log('Nenhuma configuração salva, selecionando todas as séries por padrão');
          // Isso será definido após carregar as séries em loadSeries
        }
        
        if (savedExpansions) {
          setSelectedExpansions(JSON.parse(savedExpansions));
        } else {
          // Se não há configurações salvas, selecionar TODAS as expansões por padrão
          console.log('Nenhuma configuração salva, selecionando todas as expansões por padrão');
          // Isso será definido após carregar as expansões
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações salvas:', error);
    }
  };

  const loadSeries = async () => {
    setLoading(true);
    try {
      // Carregar configurações do idioma atual
      await FilterService.loadSettings(selectedLanguage);
      
      // Para a tela de configurações, mostrar TODAS as séries do banco (não filtradas)
      const seriesData = await DatabaseService.getAllSeries();
      setSeries(seriesData);
      console.log(`Todas as séries disponíveis no banco para configuração:`, seriesData.length);
      
      // Se não há séries selecionadas, selecionar TODAS por padrão
      if (selectedSeries.length === 0) {
        const allSeriesIds = seriesData.map(series => series.id);
        setSelectedSeries(allSeriesIds);
        console.log('Selecionando todas as séries por padrão:', allSeriesIds.length);
      }
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
      const expansionsData: {[key: string]: PokemonSet[]} = {};
      
      for (const seriesId of selectedSeries) {
        try {
          console.log(`Carregando expansões da série ${seriesId} do banco...`);
          
          // Buscar APENAS do banco (sem SDK)
          const seriesExpansions = await DatabaseService.getSetsBySeries(seriesId);
          
          expansionsData[seriesId] = seriesExpansions;
          console.log(`✅ ${seriesExpansions.length} expansões encontradas no banco para ${seriesId}`);
        } catch (error) {
          console.error(`❌ Erro ao carregar expansões da série ${seriesId}:`, error);
          expansionsData[seriesId] = [];
        }
      }
      
      setExpansions(expansionsData);
      console.log('Todas as expansões carregadas do banco:', Object.keys(expansionsData).length);
      
      // Se não há expansões selecionadas, selecionar TODAS por padrão
      if (selectedExpansions.length === 0) {
        const allExpansionIds: string[] = [];
        Object.values(expansionsData).forEach(expansions => {
          expansions.forEach(expansion => {
            allExpansionIds.push(expansion.id);
          });
        });
        setSelectedExpansions(allExpansionIds);
        console.log('Selecionando todas as expansões por padrão:', allExpansionIds.length);
      }
    } catch (error) {
      console.error('Erro ao carregar expansões:', error);
      Alert.alert('Erro', 'Não foi possível carregar as expansões. Tente novamente.');
    } finally {
      setLoadingExpansions(false);
    }
  };

  const toggleSeries = (seriesId: string) => {
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

  const toggleExpansion = (expansionId: string) => {
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
      
      // Recarregar filtros no serviço
      await FilterService.loadSettings(selectedLanguage);
      
      // Salvar silenciosamente sem alerta
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    }
  };

  const showDatabaseInfo = async () => {
    try {
      setLoading(true);
      
      // 1. Estatísticas gerais do banco
      const stats = await DatabaseService.getStats();
      
      // 2. Todas as séries do banco
      const allSeries = await DatabaseService.getAllSeries();
      
      // 3. Primeiras 5 séries como exemplo
      const sampleSeries = allSeries.slice(0, 5);
      
      // 4. Verificar se há séries com prefixo 'en-'
      const englishSeries = allSeries.filter(series => series.id.startsWith('en-'));
      const portugueseSeries = allSeries.filter(series => !series.id.startsWith('en-'));
      
      const debugInfo = `
📊 ESTATÍSTICAS DO BANCO:
• Séries: ${stats.series}
• Sets: ${stats.sets}
• Cards: ${stats.cards}

📚 ANÁLISE DAS SÉRIES:
• Total de séries: ${allSeries.length}
• Séries em português: ${portugueseSeries.length}
• Séries em inglês: ${englishSeries.length}

🔍 PRIMEIRAS 5 SÉRIES:
${sampleSeries.map(s => `• ${s.id} - ${s.name}`).join('\n')}

${englishSeries.length > 0 ? `
⚠️ SÉRIES EM INGLÊS ENCONTRADAS:
${englishSeries.map(s => `• ${s.id} - ${s.name}`).join('\n')}
` : '✅ Nenhuma série em inglês encontrada'}
      `;
      
      Alert.alert('Debug - Banco de Dados', debugInfo, [
        { text: 'OK' }
      ]);
      
    } catch (error) {
      console.error('Erro ao obter informações do banco:', error);
      Alert.alert('Erro', 'Não foi possível obter informações do banco');
    } finally {
      setLoading(false);
    }
  };

  const testSDK = async () => {
    try {
      setLoading(true);
      
      // Testar SDK diretamente
      const sdkSeries = await TCGdexService.getSeries();
      
      // Primeiras 5 séries do SDK
      const sampleSDKSeries = sdkSeries.slice(0, 5);
      
      // Comparar com banco
      const dbSeries = await DatabaseService.getAllSeries();
      const sampleDBSeries = dbSeries.slice(0, 5);
      
      const debugInfo = `
🔧 TESTE DO SDK:

📱 SDK retorna ${sdkSeries.length} séries:
${sampleSDKSeries.map(s => `• ${s.id} - ${s.name}`).join('\n')}

💾 Banco tem ${dbSeries.length} séries:
${sampleDBSeries.map(s => `• ${s.id} - ${s.name}`).join('\n')}

🔍 PROBLEMA IDENTIFICADO:
${sdkSeries.length !== dbSeries.length ? 
  `❌ Quantidades diferentes: SDK=${sdkSeries.length}, Banco=${dbSeries.length}` :
  `✅ Quantidades iguais: ${sdkSeries.length}`
}

${sampleSDKSeries.some(s => s.name.includes('Black & White') || s.name.includes('&')) ? 
  '⚠️ SDK retorna dados em INGLÊS (Black & White, etc.)' :
  '✅ SDK retorna dados em português'
}
      `;
      
      Alert.alert('Teste SDK vs Banco', debugInfo, [
        { text: 'OK' }
      ]);
      
    } catch (error) {
      console.error('Erro ao testar SDK:', error);
      Alert.alert('Erro', 'Não foi possível testar o SDK');
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    try {
      setLoading(true);

      Alert.alert(
        'Reset do Banco de Dados',
        'Isso vai limpar TODOS os dados do banco e recarregar apenas os dados corretos dos JSONs. Tem certeza?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Resetar',
            style: 'destructive',
            onPress: async () => {
              try {
                // 1. Limpar banco completamente
                await DatabaseService.clearAllData();
                console.log('Banco limpo com sucesso');
                
                // 2. Recarregar dados dos JSONs (apenas dados corretos)
                const migrationResult = await TCGdexService.migrateFromJSONs();
                
                if (migrationResult.success) {
                  Alert.alert(
                    'Sucesso!', 
                    `Banco resetado com sucesso!\n\n${migrationResult.message}`,
                    [
                      {
                        text: 'OK',
                        onPress: async () => {
                          // Recarregar séries na tela
                          await loadSeries();
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert('Erro', migrationResult.message);
                }
                
              } catch (error) {
                console.error('Erro no reset:', error);
                Alert.alert('Erro', 'Falha ao resetar o banco');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Erro ao resetar banco:', error);
      Alert.alert('Erro', 'Não foi possível resetar o banco');
    } finally {
      setLoading(false);
    }
  };

  const debugSets = async () => {
    try {
      setLoading(true);
      
      // Pegar a primeira série selecionada para teste
      const testSeriesId = selectedSeries[0] || series[0]?.id;
      
      if (!testSeriesId) {
        Alert.alert('Erro', 'Nenhuma série selecionada para teste');
        return;
      }
      
      // 1. Testar DatabaseService diretamente
      const dbSets = await DatabaseService.getSetsBySeries(testSeriesId);
      
      // 2. Testar TCGdexService
      const tcgdexSets = await TCGdexService.getSetsBySeries(testSeriesId);
      
      // 3. Verificar se há sets no banco para qualquer série
      const allSets = await DatabaseService.getAllSets();
      
      // 4. Verificar relacionamentos
      const seriesStats = await DatabaseService.getStats();
      
      // 5. Verificar dados brutos dos sets
      const sampleSets = allSets.slice(0, 3);
      const setsWithSeriesId = allSets.filter(set => set.series);
      
      const debugInfo = `
🔍 DEBUG SETS - Série: ${testSeriesId}

📊 ESTATÍSTICAS GERAIS:
• Total de sets no banco: ${allSets.length}
• Total de séries no banco: ${seriesStats.series}
• Total de cards no banco: ${seriesStats.cards}

🔍 DADOS BRUTOS DOS SETS:
• Sets com series_id: ${setsWithSeriesId.length}/${allSets.length}
${sampleSets.map(set => `  • ${set.id} - series: "${set.series}"`).join('\n')}

🔧 TESTE DATABASE SERVICE:
• Sets encontrados via DatabaseService: ${dbSets.length}
${dbSets.slice(0, 3).map(set => `  • ${set.id} - ${set.name}`).join('\n')}

🔧 TESTE TCGDEX SERVICE:
• Sets encontrados via TCGdexService: ${tcgdexSets.length}
${tcgdexSets.slice(0, 3).map(set => `  • ${set.id} - ${set.name}`).join('\n')}

🔍 ANÁLISE:
${dbSets.length === 0 ? '❌ DatabaseService retorna 0 sets' : '✅ DatabaseService funciona'}
${tcgdexSets.length === 0 ? '❌ TCGdexService retorna 0 sets' : '✅ TCGdexService funciona'}
${allSets.length === 0 ? '❌ Nenhum set no banco' : `✅ ${allSets.length} sets no banco`}
${setsWithSeriesId.length < allSets.length ? '⚠️ Alguns sets não têm series_id' : '✅ Todos os sets têm series_id'}
      `;
      
      Alert.alert('Debug Sets', debugInfo, [
        { text: 'OK' }
      ]);
      
    } catch (error) {
      console.error('Erro no debug sets:', error);
      Alert.alert('Erro', 'Falha no debug sets');
    } finally {
      setLoading(false);
    }
  };

  const debugRawData = async () => {
    try {
      setLoading(true);
      
      // 1. Verificar dados dos JSONs
      const seriesData = require('../data/series.json');
      const setsData = require('../data/sets.json');
      
      // 2. Verificar dados do banco
      const dbSeries = await DatabaseService.getAllSeries();
      const dbSets = await DatabaseService.getAllSets();
      
      // 3. Verificar relacionamentos
      const sampleSets = setsData.slice(0, 5);
      const sampleDbSets = dbSets.slice(0, 5);
      
      // 4. Verificar se series_id está correto
      const setsWithSeriesId = dbSets.filter(set => set.series && set.series.trim() !== '');
      const uniqueSeriesIds = [...new Set(dbSets.map(set => set.series).filter(Boolean))];
      
      const debugInfo = `
🗃️ DADOS BRUTOS - Análise Completa

📁 JSONS:
• Séries no JSON: ${seriesData.length}
• Sets no JSON: ${setsData.length}
• Primeiros sets JSON: ${sampleSets.map((s: any) => `${s.id}→${s.series}`).join(', ')}

💾 BANCO:
• Séries no banco: ${dbSeries.length}
• Sets no banco: ${dbSets.length}
• Sets com series_id: ${setsWithSeriesId.length}/${dbSets.length}
• Series IDs únicos: ${uniqueSeriesIds.length}

🔍 RELACIONAMENTOS:
• Series IDs no banco: ${uniqueSeriesIds.slice(0, 5).join(', ')}
• Primeiros sets DB: ${sampleDbSets.map(s => `${s.id}→"${s.series}"`).join(', ')}

📊 ANÁLISE:
${setsWithSeriesId.length === dbSets.length ? '✅ Todos os sets têm series_id' : `❌ ${dbSets.length - setsWithSeriesId.length} sets sem series_id`}
${uniqueSeriesIds.length > 0 ? '✅ Há series_ids no banco' : '❌ Nenhum series_id no banco'}
${dbSeries.length > 0 ? '✅ Há séries no banco' : '❌ Nenhuma série no banco'}
      `;
      
      Alert.alert('Dados Brutos', debugInfo, [
        { text: 'OK' }
      ]);
      
    } catch (error) {
      console.error('Erro no debug raw data:', error);
      Alert.alert('Erro', 'Falha no debug raw data');
    } finally {
      setLoading(false);
    }
  };

  const getSeriesName = (seriesId: string) => {
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
    const allExpansionIds: string[] = [];
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

  const renderSeriesItem = ({ item }: { item: PokemonSeries }) => (
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

  const renderExpansionItem = ({ item }: { item: PokemonSet & { seriesId: string } }) => (
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
  const allExpansions: (PokemonSet & { seriesId: string })[] = [];
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
        {/* Idioma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma</Text>
          <View style={styles.languageDisplay}>
            <Text style={styles.currentLanguageText}>
              Português (BR)
            </Text>
            <Text style={styles.languageNote}>
              App configurado para português brasileiro
          </Text>
          </View>
        </View>

        {/* Debug - Informações do Banco */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug - Banco de Dados</Text>
          <View style={styles.debugButtonsContainer}>
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={showDatabaseInfo}
            >
              <Text style={styles.debugButtonText}>Ver Banco</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.debugButton, { backgroundColor: '#34C759' }]} 
              onPress={testSDK}
            >
              <Text style={styles.debugButtonText}>Testar SDK</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#FF3B30' }]} 
            onPress={resetDatabase}
          >
            <Text style={styles.debugButtonText}>🔄 Reset Banco (SDK → JSON)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.debugButton, { backgroundColor: '#5856D6' }]} 
            onPress={debugSets}
          >
            <Text style={styles.debugButtonText}>🔍 Debug Sets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.debugButton, { backgroundColor: '#FF2D92' }]} 
            onPress={debugRawData}
          >
            <Text style={styles.debugButtonText}>🗃️ Dados Brutos</Text>
          </TouchableOpacity>
          <Text style={styles.debugNote}>
            Testa o que o SDK retorna vs o que está no banco
          </Text>
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
              keyExtractor={(item) => `series-${item.id}`}
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
                keyExtractor={(item) => `expansion-${item.seriesId}-${item.id}`}
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
}

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
  debugButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  debugButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
