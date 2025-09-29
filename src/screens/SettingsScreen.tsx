import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CacheService from '../services/CacheService';
import TCGdexService from '../services/TCGdexService';
import DatabaseService from '../services/DatabaseService';

const SettingsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<any>({});
  const [dbStats, setDbStats] = useState<any>({});

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      setLoading(true);
      const info = await CacheService.getCacheInfo();
      const stats = await TCGdexService.getStats();
      setCacheInfo(info);
      setDbStats(stats);
    } catch (error) {
      console.error('Erro ao carregar informações do cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache',
      'Isso irá remover todos os dados em cache. Você terá que baixar novamente as imagens e dados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await CacheService.clearAllCache();
              await loadCacheInfo();
              Alert.alert('Sucesso', 'Cache limpo com sucesso!');
            } catch (error) {
              console.error('Erro ao limpar cache:', error);
              Alert.alert('Erro', 'Não foi possível limpar o cache');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearDatabase = () => {
    Alert.alert(
      'Limpar Banco de Dados',
      'Isso irá remover TODOS os dados do banco de dados (séries, sets e cartas). Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Limpar banco de dados
              await DatabaseService.clearAllData();
              await loadCacheInfo();
              Alert.alert('Sucesso', 'Banco de dados limpo com sucesso!');
            } catch (error) {
              console.error('Erro ao limpar banco:', error);
              Alert.alert('Erro', 'Não foi possível limpar o banco de dados');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCheckUpdates = async () => {
    try {
      setLoading(true);
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
                try {
                  const result = await TCGdexService.syncUpdatesOnly();
                  if (result.success) {
                    Alert.alert('Sucesso', result.message);
                    await loadCacheInfo();
                  } else {
                    Alert.alert('Erro', result.message);
                  }
                } catch (error) {
                  console.error('Erro na sincronização:', error);
                  Alert.alert('Erro', 'Não foi possível sincronizar as atualizações');
                } finally {
                  setLoading(false);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Atualizado', 'Todos os dados estão atualizados! Não há novas informações disponíveis.');
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      Alert.alert('Erro', 'Não foi possível verificar atualizações');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateFromJSON = () => {
    Alert.alert(
      'Migrar Dados dos JSONs',
      'Isso irá carregar os dados pré-processados dos JSONs para o banco de dados. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Migrar', 
          onPress: async () => {
            try {
              setLoading(true);
              const result = await TCGdexService.migrateFromJSONs();
              if (result.success) {
                Alert.alert('Sucesso', result.message);
                await loadCacheInfo();
              } else {
                Alert.alert('Erro', result.message);
              }
            } catch (error) {
              console.error('Erro na migração:', error);
              Alert.alert('Erro', 'Não foi possível migrar os dados');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banco de Dados</Text>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Séries:</Text>
            <Text style={styles.statValue}>{dbStats.series || 0}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sets:</Text>
            <Text style={styles.statValue}>{dbStats.sets || 0}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cartas:</Text>
            <Text style={styles.statValue}>{dbStats.cards || 0}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache</Text>
          
          {Object.entries(cacheInfo).map(([key, info]: [string, any]) => (
            <View key={key} style={styles.cacheCard}>
              <Text style={styles.cacheLabel}>{key}:</Text>
              <Text style={styles.cacheValue}>
                {info.exists ? formatBytes(info.size) : 'Nenhum'}
              </Text>
              <Text style={styles.cacheStatus}>
                {info.isValid ? '✅ Válido' : '❌ Expirado'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCheckUpdates}
          >
            <Text style={styles.actionButtonText}>🔄 Verificar Atualizações</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMigrateFromJSON}
          >
            <Text style={styles.actionButtonText}>📦 Migrar Dados dos JSONs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.warningButton]}
            onPress={handleClearCache}
          >
            <Text style={styles.actionButtonText}>🗑️ Limpar Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearDatabase}
          >
            <Text style={styles.actionButtonText}>⚠️ Limpar Banco de Dados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Text style={styles.infoText}>
            • Use "Verificar Atualizações" para sincronizar apenas dados novos
          </Text>
          <Text style={styles.infoText}>
            • Use "Migrar Dados dos JSONs" para carregar dados pré-processados
          </Text>
          <Text style={styles.infoText}>
            • O cache é limpo automaticamente quando expira
          </Text>
          <Text style={styles.infoText}>
            • Limpar o banco de dados remove TODOS os dados permanentemente
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cacheCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cacheLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cacheValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  cacheStatus: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SettingsScreen;
