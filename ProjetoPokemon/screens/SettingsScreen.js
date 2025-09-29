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
import CacheService from '../services/CacheService';

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState({});

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      setLoading(true);
      const info = await CacheService.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('Erro ao carregar informações do cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async () => {
    try {
      Alert.alert(
        'Atualizar Cache',
        'Isso irá baixar todos os dados novamente da API. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Atualizar',
            onPress: async () => {
              setLoading(true);
              await CacheService.forceRefreshCache();
              await loadCacheInfo();
              setLoading(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o cache.');
    }
  };

  const clearCache = async () => {
    try {
      Alert.alert(
        'Limpar Cache',
        'Isso irá remover todos os dados salvos localmente. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Limpar',
            style: 'destructive',
            onPress: async () => {
              await CacheService.clearAllCache();
              await loadCacheInfo();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      Alert.alert('Erro', 'Não foi possível limpar o cache.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>
            Gerencie os dados do aplicativo
          </Text>
        </View>

        <View style={styles.cacheSection}>
          <Text style={styles.sectionTitle}>Cache Local</Text>
          <Text style={styles.sectionSubtitle}>
            Gerencie os dados salvos no dispositivo
          </Text>
          
          <View style={styles.cacheInfo}>
            <Text style={styles.cacheInfoText}>
              Séries: {cacheInfo.series?.exists ? `${cacheInfo.series.ageHours}h atrás` : 'Não salvo'}
            </Text>
            <Text style={styles.cacheInfoText}>
              Expansões: {cacheInfo.sets?.exists ? `${cacheInfo.sets.ageHours}h atrás` : 'Não salvo'}
            </Text>
            <Text style={styles.cacheInfoText}>
              Taxa de câmbio: {cacheInfo.exchangeRate?.exists ? `${cacheInfo.exchangeRate.ageHours}h atrás` : 'Não salvo'}
            </Text>
          </View>
          
          <View style={styles.cacheButtons}>
            <TouchableOpacity style={styles.cacheButton} onPress={refreshCache}>
              <Text style={styles.cacheButtonText}>Atualizar Cache</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.cacheButton, styles.clearButton]} onPress={clearCache}>
              <Text style={styles.cacheButtonText}>Limpar Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.infoText}>
            Pokémon TCG V2 - Seu guia completo para cartas Pokémon
          </Text>
          <Text style={styles.infoText}>
            Versão 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
  cacheSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cacheInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cacheInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cacheButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cacheButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  cacheButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default SettingsScreen;