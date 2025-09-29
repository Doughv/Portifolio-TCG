import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ImageDownloadService from '../services/ImageDownloadService';

const DownloadButton = ({ set, cards, onDownloadComplete }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCard, setCurrentCard] = useState('');

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setProgress(0);
      setCurrentCard('');

      // Verificar espaço disponível
      const availableSpace = await ImageDownloadService.getAvailableSpace();
      const estimatedSize = cards.length * 0.5; // ~500KB por imagem
      
      if (availableSpace < estimatedSize * 1024 * 1024) {
        Alert.alert(
          'Espaço Insuficiente',
          'Não há espaço suficiente no dispositivo para baixar esta coleção.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Iniciar download
      const result = await ImageDownloadService.downloadSetImages(
        set.id,
        cards,
        (progressData) => {
          setProgress(progressData.progress);
          setCurrentCard(progressData.currentCard);
        }
      );

      Alert.alert(
        'Download Concluído!',
        `Coleção ${set.name} baixada com sucesso!\n${result.downloaded}/${result.total} imagens.`,
        [{ text: 'OK' }]
      );

      if (onDownloadComplete) {
        onDownloadComplete(set.id);
      }
    } catch (error) {
      console.error('Erro no download:', error);
      Alert.alert(
        'Erro no Download',
        'Ocorreu um erro ao baixar as imagens. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
      setProgress(0);
      setCurrentCard('');
    }
  };

  const getButtonText = () => {
    if (downloading) {
      return `Baixando... ${Math.round(progress)}%`;
    }
    return 'Download';
  };

  const getButtonColor = () => {
    if (downloading) {
      return '#FFA726'; // Laranja durante download
    }
    return '#4CAF50'; // Verde para baixar
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: getButtonColor() }]}
        onPress={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <View style={styles.downloadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>{getButtonText()}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        )}
      </TouchableOpacity>

      {downloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          {currentCard && (
            <Text style={styles.currentCardText}>
              Baixando: {currentCard}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  currentCardText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default DownloadButton;






