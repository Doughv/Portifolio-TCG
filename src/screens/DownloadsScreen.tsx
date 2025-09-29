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
import TCGdexService from '../services/TCGdexService';

const DownloadsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const dbStats = await TCGdexService.getStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      setLoading(true);
      const updateCheck = await TCGdexService.checkForUpdates();
      setUpdateInfo(updateCheck);
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      Alert.alert('Erro', 'Não foi possível verificar atualizações');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUpdates = async () => {
    if (!updateInfo?.hasUpdates) {
      Alert.alert('Sem Atualizações', 'Não há atualizações disponíveis para sincronizar.');
      return;
    }

    try {
      setLoading(true);
      const result = await TCGdexService.syncUpdatesOnly();
      
      if (result.success) {
        Alert.alert('Sucesso', result.message);
        await loadStats();
        setUpdateInfo(null);
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      Alert.alert('Erro', 'Não foi possível sincronizar as atualizações');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateJSONs = async () => {
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
                await loadStats();
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Locais</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Séries:</Text>
            <Text style={styles.statValue}>{stats.series || 0}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sets:</Text>
            <Text style={styles.statValue}>{stats.sets || 0}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cartas:</Text>
            <Text style={styles.statValue}>{stats.cards || 0}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verificação de Atualizações</Text>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCheckUpdates}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Verificando...' : '🔍 Verificar Atualizações'}
            </Text>
          </TouchableOpacity>
          
          {updateInfo && (
            <View style={styles.updateInfo}>
              {updateInfo.hasUpdates ? (
                <>
                  <Text style={styles.updateTitle}>Atualizações Disponíveis:</Text>
                  <Text style={styles.updateText}>• {updateInfo.newSeries || 0} séries novas</Text>
                  <Text style={styles.updateText}>• {updateInfo.newSets || 0} sets novos</Text>
                  <Text style={styles.updateText}>• {updateInfo.newCards || 0} cartas novas</Text>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleSyncUpdates}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? '⏳ Sincronizando...' : '📥 Baixar Atualizações'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.upToDateText}>✅ Todos os dados estão atualizados!</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carregamento Inicial</Text>
          <Text style={styles.description}>
            Se você está usando o app pela primeira vez, use a opção abaixo para carregar rapidamente os dados dos JSONs pré-processados.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={handleMigrateJSONs}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Migrando...' : '📦 Carregar Dados dos JSONs'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Text style={styles.infoText}>
            • O app funciona completamente offline após carregar os dados
          </Text>
          <Text style={styles.infoText}>
            • Use "Carregar Dados dos JSONs" para começar rapidamente
          </Text>
          <Text style={styles.infoText}>
            • Use "Verificar Atualizações" para sincronizar apenas dados novos
          </Text>
          <Text style={styles.infoText}>
            • As atualizações são baixadas apenas quando há conteúdo novo
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
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statRow: {
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: '#FF9500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  updateInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  updateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  upToDateText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default DownloadsScreen;
