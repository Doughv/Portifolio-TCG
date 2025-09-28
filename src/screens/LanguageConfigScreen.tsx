import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService from '../services/DatabaseService';
import SyncService from '../services/SyncService';
import PreloadedDataService from '../services/PreloadedDataService';

export default function LanguageConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { language } = route.params as { language: string };
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      Alert.alert(
        'Sincronizando Dados',
        'Isso pode demorar alguns minutos. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar', 
            onPress: async () => {
              try {
                await SyncService.syncAllData();
                Alert.alert('Sucesso', 'Dados sincronizados com sucesso!');
                navigation.goBack();
              } catch (error) {
                console.error('Erro na sincronização:', error);
                Alert.alert('Erro', 'Não foi possível sincronizar os dados');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao iniciar sincronização:', error);
      setIsLoading(false);
    }
  };

  const handlePopulateFromJSON = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se os dados pré-processados estão disponíveis
      if (!PreloadedDataService.isPreloadedDataAvailable()) {
        Alert.alert('Erro', 'Dados pré-processados não encontrados');
        setIsLoading(false);
        return;
      }

      const stats = PreloadedDataService.getPreloadedStats();
      if (!stats) {
        Alert.alert('Erro', 'Não foi possível obter estatísticas dos dados');
        setIsLoading(false);
        return;
      }

      Alert.alert(
        'Carregar Dados Iniciais',
        `Isso carregará ${stats.series} séries, ${stats.sets} sets e ${stats.cards} cards no banco local.\n\nDeseja continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar', 
            onPress: async () => {
              try {
                const result = await PreloadedDataService.loadPreloadedData();
                if (result.success) {
                  Alert.alert('Sucesso', result.message);
                  navigation.goBack();
                } else {
                  Alert.alert('Erro', result.message);
                }
              } catch (error) {
                console.error('Erro ao carregar dados:', error);
                Alert.alert('Erro', 'Não foi possível carregar os dados');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao iniciar carregamento de dados:', error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Configurações de Idioma
        </Text>
        <Text style={styles.subtitle}>
          Idioma selecionado: {language === 'pt' ? 'Português (Brasil)' : 'English'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados Iniciais</Text>
          <Text style={styles.sectionDescription}>
            Para usar o app pela primeira vez, você precisa carregar os dados das cartas Pokémon.
          </Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePopulateFromJSON}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              📦 Carregar Dados Iniciais (Rápido)
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.buttonDescription}>
            Carrega dados pré-baixados para uso imediato
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sincronização Online</Text>
          <Text style={styles.sectionDescription}>
            Baixa os dados mais recentes diretamente da API oficial.
          </Text>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSyncData}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '⏳ Sincronizando...' : '🔄 Sincronizar Online'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.buttonDescription}>
            Pode demorar alguns minutos na primeira vez
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • O app funciona completamente offline após carregar os dados
            </Text>
            <Text style={styles.infoText}>
              • Use "Carregar Dados Iniciais" para começar rapidamente
            </Text>
            <Text style={styles.infoText}>
              • Use "Sincronizar Online" para dados mais recentes
            </Text>
            <Text style={styles.infoText}>
              • As imagens são baixadas conforme necessário
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    marginBottom: 8,
  },
  subtitle: {
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDescription: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
