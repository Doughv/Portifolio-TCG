import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TCGdexService from './TCGdexService';

class ImageDownloadService {
  constructor() {
    this.storageKey = 'downloaded_images';
  }

  // Verificar se uma imagem já foi baixada
  async isImageDownloaded(cardId) {
    try {
      const downloadedImages = await this.getDownloadedImages();
      return downloadedImages[cardId] || null;
    } catch (error) {
      console.error('Erro ao verificar imagem baixada:', error);
      return null;
    }
  }

  // Obter lista de imagens baixadas
  async getDownloadedImages() {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao obter imagens baixadas:', error);
      return {};
    }
  }

  // Salvar informação de imagem baixada
  async saveDownloadedImage(cardId, card, localPath) {
    try {
      const downloadedImages = await this.getDownloadedImages();
      downloadedImages[cardId] = {
        cardId,
        setId: card.setId || card.set?.id,
        localPath,
        downloadedAt: new Date().toISOString(),
        cardName: card.name
      };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(downloadedImages));
    } catch (error) {
      console.error('Erro ao salvar imagem baixada:', error);
    }
  }

  // Baixar uma imagem específica
  async downloadCardImage(card, setId = null, onProgress) {
    try {
      console.log(`Baixando imagem para: ${card.name}`);
      
      // Verificar se já foi baixada
      const existing = await this.isImageDownloaded(card.id);
      if (existing) {
        console.log(`Imagem já existe: ${card.name}`);
        return existing.localPath;
      }

      // Usar setId fornecido ou tentar usar card.set.id
      const targetSetId = setId || card.set?.id;
      if (!targetSetId) {
        throw new Error(`Carta ${card.name} não possui informações do set`);
      }

      // Criar diretório da coleção
      const collectionDir = `${FileSystem.documentDirectory}imagens_pokemon/${targetSetId}`;
      await FileSystem.makeDirectoryAsync(collectionDir, { intermediates: true });

      // URL da imagem usando o método do SDK
      const imageUrl = TCGdexService.getImageURL(card, 'high', 'png');
      const localPath = `${collectionDir}/${card.id}.webp`;

      // Baixar imagem
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
      
      if (downloadResult.status === 200) {
        // Salvar informação com setId correto
        const cardWithSetId = { ...card, setId: targetSetId };
        await this.saveDownloadedImage(card.id, cardWithSetId, localPath);

        console.log(`Imagem baixada com sucesso: ${card.name}`);
        return localPath;
      } else {
        throw new Error(`Erro ao baixar imagem: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error(`Erro ao baixar imagem de ${card.name}:`, error);
      throw error;
    }
  }

  // Baixar todas as imagens de uma coleção
  async downloadSetImages(setId, cards, onProgress) {
    try {
      console.log(`Iniciando download da coleção: ${setId}`);
      
      let downloaded = 0;
      const total = cards.length;

      for (const card of cards) {
        try {
          await this.downloadCardImage(card, setId);
          downloaded++;
          
          if (onProgress) {
            onProgress({
              downloaded,
              total,
              currentCard: card.name,
              progress: (downloaded / total) * 100
            });
          }
        } catch (error) {
          console.error(`Erro ao baixar ${card.name}:`, error);
        }
      }

      // Log de conclusão
      console.log(`✅ Download da coleção ${setId} concluído: ${downloaded}/${total} imagens`);

      console.log(`Download da coleção ${setId} concluído: ${downloaded}/${total}`);
      return { downloaded, total };
    } catch (error) {
      console.error(`Erro ao baixar coleção ${setId}:`, error);
      throw error;
    }
  }

  // Obter caminho local da imagem
  async getLocalImagePath(cardId, setId) {
    const existing = await this.isImageDownloaded(cardId);
    if (existing) {
      return existing.localPath;
    }
    return null;
  }

  // Verificar espaço disponível
  async getAvailableSpace() {
    try {
      // Usar método legacy do FileSystem
      const info = await FileSystem.getFreeDiskStorageAsync();
      return info || 1000000000; // Retornar 1GB como fallback
    } catch (error) {
      console.error('Erro ao verificar espaço:', error);
      return 1000000000; // Retornar 1GB como fallback
    }
  }

  // Limpar imagens baixadas
  async clearDownloadedImages() {
    try {
      const collectionDir = `${FileSystem.documentDirectory}imagens_pokemon/`;
      await FileSystem.deleteAsync(collectionDir, { idempotent: true });
      
      await AsyncStorage.removeItem(this.storageKey);

      console.log('Imagens baixadas removidas');
    } catch (error) {
      console.error('Erro ao limpar imagens:', error);
    }
  }

  // Log de notificação (sem notificações push no Expo Go)
  async sendNotification(title, body) {
    console.log(`📱 ${title}: ${body}`);
  }

  // Obter estatísticas de download
  async getDownloadStats() {
    try {
      const downloadedImages = await this.getDownloadedImages();
      const total = Object.keys(downloadedImages).length;
      
      const sets = {};
      Object.values(downloadedImages).forEach(image => {
        if (sets[image.setId]) {
          sets[image.setId]++;
        } else {
          sets[image.setId] = 1;
        }
      });
      
      return { total, sets };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, sets: {} };
    }
  }
}

export default new ImageDownloadService();

