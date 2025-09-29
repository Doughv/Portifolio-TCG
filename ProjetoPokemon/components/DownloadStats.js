import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ImageDownloadService from '../services/ImageDownloadService';

const DownloadStats = ({ onStatsUpdate }) => {
  const [stats, setStats] = useState({ total: 0, sets: {} });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const downloadStats = await ImageDownloadService.getDownloadStats();
      setStats(downloadStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Limpar Downloads',
      'Tem certeza que deseja remover todas as imagens baixadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await ImageDownloadService.clearDownloadedImages();
            await loadStats();
            if (onStatsUpdate) {
              onStatsUpdate();
            }
            // Imagens removidas silenciosamente
          }
        }
      ]
    );
  };

  const getTotalSize = () => {
    // Estimativa: ~500KB por imagem
    const estimatedSize = stats.total * 0.5;
    if (estimatedSize < 1) {
      return `${(estimatedSize * 1024).toFixed(0)} KB`;
    }
    return `${estimatedSize.toFixed(1)} MB`;
  };

  if (stats.total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.emptyText}>
          Nenhuma imagem baixada ainda{'\n'}
          <Text style={styles.emptySubtext}>
            Use o botão "Baixar Coleção" para baixar imagens
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <TouchableOpacity onPress={handleClearDownloads} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>🗑</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Imagens</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{getTotalSize()}</Text>
          <Text style={styles.statLabel}>Espaço</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Object.keys(stats.sets).length}</Text>
          <Text style={styles.statLabel}>Coleções</Text>
        </View>
      </View>

      {Object.keys(stats.sets).length > 0 && (
        <View style={styles.setsContainer}>
          <Text style={styles.setsTitle}>Por Coleção:</Text>
          {Object.entries(stats.sets).map(([setId, count]) => (
            <View key={setId} style={styles.setItem}>
              <Text style={styles.setId}>{setId}</Text>
              <Text style={styles.setCount}>{count} imagens</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'normal',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  setsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  setId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  setCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default DownloadStats;




