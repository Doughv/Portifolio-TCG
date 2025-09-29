import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TCGdexService from '../services/TCGdexService';
import DatabaseService from '../services/DatabaseService';
import FilterService, { FilterService as FilterServiceClass } from '../services/FilterService';

interface UpdateScreenProps {
  navigation: any;
}

export default function UpdateScreen({ navigation }: UpdateScreenProps) {
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [debugAnalysis, setDebugAnalysis] = useState<any>(null);
  const [investigationResult, setInvestigationResult] = useState<any>(null);
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const appState = useRef(AppState.currentState);
  const logScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadLastUpdate();
    loadSavedLogs();
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      const stats = await DatabaseService.getStats();
      setDatabaseStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadLastUpdate = async () => {
    try {
      const lastUpdateTime = await FilterServiceClass.getLastUpdateTime();
      if (lastUpdateTime) {
        setLastUpdate(new Date(lastUpdateTime).toLocaleString('pt-BR'));
      }
    } catch (error) {
      console.error('Erro ao carregar última atualização:', error);
      setLastUpdate('Nunca atualizado');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Manter apenas os últimos 50 logs para performance
      const limitedLogs = newLogs.slice(-50);
      // Salvar no AsyncStorage
      AsyncStorage.setItem('update_logs', JSON.stringify(limitedLogs));
      
      // Scroll automático para o final
      setTimeout(() => {
        if (logScrollRef.current) {
          logScrollRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
      return limitedLogs;
    });
  };

  // Carregar logs salvos ao inicializar
  const loadSavedLogs = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('update_logs');
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (error) {
      console.error('Erro ao carregar logs salvos:', error);
    }
  };

  // Hook para capturar logs do console em tempo real
  useEffect(() => {
    if (!isBackgroundRunning) return;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.join(' ');
      if (message.includes('📥') || message.includes('✅') || message.includes('❌') || 
          message.includes('📊') || message.includes('🃏') || message.includes('📦') ||
          message.includes('🎉') || message.includes('📡') || message.includes('🗑️') ||
          message.includes('📚') || message.includes('📄') || message.includes('🔄') ||
          message.includes('Migrando') || message.includes('Processando') || 
          message.includes('Iniciando') || message.includes('Concluída') ||
          message.includes('Lote') || message.includes('cartas') || message.includes('sets') ||
          message.includes('Cards migrados') || message.includes('/') ||
          message.includes('migrados') || message.includes('séries') ||
          message.includes('Limpando') || message.includes('Banco de dados')) {
        addLog(message);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.join(' ');
      if (message.includes('❌') || message.includes('Error')) {
        addLog(`❌ ${message}`);
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.join(' ');
      if (message.includes('⚠️') || message.includes('Warning')) {
        addLog(`⚠️ ${message}`);
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isBackgroundRunning]);

  const syncIntelligent = async () => {
    Alert.alert(
      'Sincronização Completa',
      'Esta operação irá:\n\n• Verificar se há dados no banco\n• Se vazio: migrar dos JSONs locais\n• Se há dados: sincronizar apenas novos da API\n• Baixar detalhes das cartas automaticamente\n• Executar em segundo plano\n\nDeseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sincronizar',
            onPress: async () => {
              setIsLoading(true);
              setIsBackgroundRunning(true);
              setSyncProgress(0);
              setLogs([]);
              setCurrentOperation('Sincronização Completa');
              addLog('🚀 Iniciando sincronização completa...');

              // Executar em background sem bloquear UI
              setTimeout(async () => {
                try {
                  // 1. Sincronização Inteligente
                  addLog('📡 Fase 1: Sincronização inteligente...');
                  setSyncProgress(10);
                  const syncResult = await TCGdexService.syncIntelligent();
                  
                  if (syncResult.success) {
                    addLog('✅ Sincronização concluída!');
                    addLog(`📊 ${syncResult.message}`);
                    setSyncProgress(50);
                    
                    // 2. Download de detalhes automaticamente
                    addLog('📥 Fase 2: Baixando detalhes das cartas...');
                    setCurrentOperation('Download de Detalhes');
                    setSyncProgress(60);
                    
                    const detailsResult = await TCGdexService.downloadCardDetails();
                    
                    if (detailsResult.success) {
                      addLog('✅ Download de detalhes concluído!');
                      addLog(`📊 ${detailsResult.message}`);
                      addLog(`📈 Estatísticas: ${JSON.stringify(detailsResult.stats)}`);
                      setSyncProgress(100);
                      setSyncStatus('Concluído!');
                    } else {
                      addLog(`⚠️ Aviso nos detalhes: ${detailsResult.message}`);
                      setSyncProgress(100);
                    }
                    
                    await FilterServiceClass.setLastUpdateTime(new Date().toISOString());
                    await loadLastUpdate();
                    await loadDatabaseStats();
                  } else {
                    addLog(`❌ Erro na sincronização: ${syncResult.message}`);
                  }
                } catch (error: any) {
                  addLog(`❌ Erro inesperado: ${error.message}`);
                } finally {
                  setIsLoading(false);
                  setIsBackgroundRunning(false);
                  setCurrentOperation('');
                  setSyncProgress(100);
                }
              }, 100);
            },
        },
      ]
    );
  };

  const runInvestigation = async () => {
    setLogs([]);
    setCurrentOperation('Investigação da Estrutura');
    addLog('🔍 Iniciando investigação da estrutura do banco...');

    try {
      const result = await TCGdexService.investigateDatabaseStructure();
      
      if (result.success) {
        setInvestigationResult(result.investigation);
        addLog('✅ Investigação concluída!');
        addLog(`📊 ${result.message}`);
        
        // Adicionar detalhes da estrutura
        addLog(`📋 Total de cartas: ${result.investigation.fieldAnalysis.totalCards}`);
        addLog(`📊 Com types: ${result.investigation.fieldAnalysis.cardsWithTypes}`);
        addLog(`📊 Com rarity: ${result.investigation.fieldAnalysis.cardsWithRarity}`);
        addLog(`📊 Com hp: ${result.investigation.fieldAnalysis.cardsWithHp}`);
        addLog(`📊 Com image: ${result.investigation.fieldAnalysis.cardsWithImage}`);
        addLog(`📊 Com localId: ${result.investigation.fieldAnalysis.cardsWithLocalId}`);
        addLog(`⚠️ Com campos faltando: ${result.investigation.fieldAnalysis.cardsMissingFields.length}`);
        
        // Mostrar algumas cartas com problemas
        if (result.investigation.fieldAnalysis.cardsMissingFields.length > 0) {
          addLog('🔍 Primeiras cartas com campos faltando:');
          result.investigation.fieldAnalysis.cardsMissingFields.slice(0, 5).forEach((card: any) => {
            addLog(`  ${card.name}: falta ${card.missingFields.join(', ')}`);
          });
        }
      } else {
        addLog(`❌ Erro na investigação: ${result.message}`);
      }
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message}`);
    } finally {
      setCurrentOperation('');
    }
  };

  const runDebugAnalysis = async () => {
    setIsLoading(true);
    setLogs([]);
    setCurrentOperation('Análise de Debug');
    addLog('🔍 Iniciando análise de debug...');

    try {
      const result = await TCGdexService.analyzeDatabaseStatus();
      
      if (result.success) {
        setDebugAnalysis(result.analysis);
        addLog('✅ Análise concluída!');
        addLog(`📊 ${result.message}`);
        
        // Adicionar recomendações aos logs
        result.analysis.recommendations.forEach(rec => {
          addLog(rec);
        });
        
        // Adicionar detalhes específicos
        if (result.analysis.needsUpdate.series.length > 0) {
          addLog(`📚 Séries novas: ${result.analysis.needsUpdate.series.map(s => s.name).join(', ')}`);
        }
        if (result.analysis.needsUpdate.sets.length > 0) {
          addLog(`📦 Sets novos: ${result.analysis.needsUpdate.sets.map(s => s.name).join(', ')}`);
        }
        if (result.analysis.needsUpdate.cards.length > 0) {
          addLog(`🃏 Cartas novas: ${result.analysis.needsUpdate.cards.map(c => c.name).join(', ')}`);
        }
        if (result.analysis.needsUpdate.cardDetails.length > 0) {
          addLog(`🔍 Cartas sem detalhes: ${result.analysis.needsUpdate.cardDetails.map(c => c.name).join(', ')}`);
        }
      } else {
        addLog(`❌ Erro na análise: ${result.message}`);
      }
    } catch (error: any) {
      addLog(`❌ Erro inesperado: ${error.message}`);
    } finally {
      setCurrentOperation('');
    }
  };

  const migrateFromJSONs = async () => {
    setLogs([]);
    setCurrentOperation('Migração dos JSONs Locais');
    setSyncProgress(0);
    addLog('📦 Iniciando migração dos JSONs locais...');

    Alert.alert(
      'Migração dos JSONs',
      'Isso irá migrar todos os dados dos arquivos JSON locais para o banco de dados. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            setIsBackgroundRunning(true);
            setSyncProgress(10);
            
            setTimeout(async () => {
              try {
                addLog('🔄 Chamando TCGdexService.migrateFromJSONs()...');
                const result = await TCGdexService.migrateFromJSONs();
                
                if (result.success) {
                  addLog('✅ Migração dos JSONs concluída!');
                  addLog(`📊 ${result.message}`);
                  setSyncProgress(100);
                  await loadDatabaseStats();
                } else {
                  addLog(`❌ Erro na migração: ${result.message}`);
                }
              } catch (error: any) {
                addLog(`❌ Erro na migração: ${error.message}`);
              } finally {
                setIsBackgroundRunning(false);
                setCurrentOperation('');
                setSyncProgress(0);
              }
            }, 100);
          }
        }
      ]
    );
  };

  const clearDatabase = async () => {
    setLogs([]);
    setCurrentOperation('Limpeza do Banco');
    setSyncProgress(0);
    addLog('🗑️ Iniciando limpeza do banco...');

    Alert.alert(
      '⚠️ Limpar Banco de Dados',
      'ATENÇÃO: Esta operação irá apagar TODOS os dados do banco de dados. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          onPress: async () => {
            setIsBackgroundRunning(true);
            setSyncProgress(10);
            
            setTimeout(async () => {
              try {
                await TCGdexService.clearDatabase();
                addLog('✅ Banco de dados limpo!');
                setSyncProgress(100);
                await loadDatabaseStats();
              } catch (error: any) {
                addLog(`❌ Erro ao limpar banco: ${error.message}`);
              } finally {
                setIsBackgroundRunning(false);
                setCurrentOperation('');
                setSyncProgress(0);
              }
            }, 100);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Atualização</Text>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Última atualização: {lastUpdate}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearDatabase}
            disabled={isBackgroundRunning}
          >
            <Text style={styles.buttonText}>
              🗑️ Limpar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.migrateButton]}
            onPress={migrateFromJSONs}
            disabled={isBackgroundRunning}
          >
            <Text style={styles.buttonText}>
              📦 Repopular JSON
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.syncButton]}
            onPress={syncIntelligent}
            disabled={isBackgroundRunning}
          >
            <Text style={styles.buttonText}>
              🔄 Atualizar API
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botões de Debug */}
        <View style={styles.debugButtons}>
          <TouchableOpacity
            style={[styles.button, styles.debugButton]}
            onPress={runDebugAnalysis}
            disabled={isBackgroundRunning}
          >
            <Text style={styles.buttonText}>
              🔍 Debug Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.investigateButton]}
            onPress={runInvestigation}
            disabled={isBackgroundRunning}
          >
            <Text style={styles.buttonText}>
              🔬 Investigar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Container de Estatísticas */}
        {databaseStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 Estatísticas do Banco</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{databaseStats.series}</Text>
                <Text style={styles.statLabel}>Séries</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{databaseStats.sets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{databaseStats.cards.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Cartas</Text>
              </View>
            </View>
          </View>
        )}

        {/* Barra de Progresso */}
        {isBackgroundRunning && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {currentOperation || 'Processando...'}
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(syncProgress)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${syncProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {syncStatus || 'Executando em segundo plano...'}
            </Text>
            {isBackgroundRunning && (
              <Text style={styles.backgroundNote}>
                💡 Você pode sair desta tela - a operação continuará em segundo plano
              </Text>
            )}
          </View>
        )}

        {/* Container de Logs */}
        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>📋 Log de Atividades</Text>
          <ScrollView style={styles.logScroll} nestedScrollEnabled ref={logScrollRef}>
            {logs.length === 0 ? (
              <Text style={styles.noLogs}>
                Nenhuma atividade registrada ainda.
              </Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logItem}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  debugButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  migrateButton: {
    backgroundColor: '#34C759',
  },
  debugButton: {
    backgroundColor: '#8E8E93',
  },
  investigateButton: {
    backgroundColor: '#FF9500',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  backgroundNote: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  logContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logScroll: {
    maxHeight: 300,
  },
  noLogs: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  logItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
