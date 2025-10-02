import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TCGdexService from './TCGdexService';

interface DownloadedImage {
  cardId: string;
  setId: string;
  localPath: string;
  downloadedAt: string;
  cardName: string;
}

class ImageDownloadService {
  private storageKey = 'downloaded_images';

  // Verificar se uma imagem já foi baixada
  async isImageDownloaded(cardId: string): Promise<DownloadedImage | null> {
    try {
      const downloadedImages = await this.getDownloadedImages();
      return downloadedImages[cardId] || null;
    } catch (error) {
      console.error('Erro ao verificar imagem baixada:', error);
      return null;
    }
  }

  // Obter lista de imagens baixadas
  async getDownloadedImages(): Promise<{[key: string]: DownloadedImage}> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao obter imagens baixadas:', error);
      return {};
    }
  }

  // Salvar informação de imagem baixada
  async saveDownloadedImage(cardId: string, card: any, localPath: string): Promise<void> {
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

  // Obter URL da imagem usando o SDK
  getImageURL(card: any, quality: string = 'high', extension: string = 'webp'): string {
    try {
      // Se a carta já tem uma propriedade image, usar ela
      if (card && card.image) {
        let imageUrl = card.image;
        if (!imageUrl.includes('/high.webp') && !imageUrl.includes('/medium.webp') && !imageUrl.includes('/low.webp')) {
          imageUrl = imageUrl.endsWith('/') ? imageUrl : imageUrl + '/';
          imageUrl += `${quality}.webp`;
        }
        return imageUrl;
      }
      
      // Se tem método getImageURL do SDK, usar ele
      if (card && typeof card.getImageURL === 'function') {
        return card.getImageURL(quality, extension);
      }
      
      // Fallback: construir URL manualmente
      const setId = card.set?.id || card.setId || card.id?.split('-')[0] || 'sv01';
      const cardNumber = card.localId || card.number || '1';
      const language = TCGdexService.getCurrentLanguage();
      const manualUrl = `https://assets.tcgdex.net/${language}/sv/${setId}/${cardNumber}/${quality}.webp`;
      return manualUrl;
    } catch (error) {
      console.error('Erro ao obter URL da imagem:', error);
      return '';
    }
  }

  // Baixar uma imagem específica
  async downloadCardImage(card: any, setId?: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      console.log(`Baixando imagem para: ${card.name}`);
      
      // Verificar se já foi baixada
      const existing = await this.isImageDownloaded(card.id);
      if (existing) {
        console.log(`Imagem já existe: ${card.name}`);
        return existing.localPath;
      }

      // Usar setId fornecido ou tentar usar card.set.id
      const targetSetId = setId || card.set?.id || card.setId;
      if (!targetSetId) {
        throw new Error(`Carta ${card.name} não possui informações do set`);
      }

      // Criar diretório da coleção
      const collectionDir = `${FileSystem.documentDirectory}imagens_pokemon/${targetSetId}`;
      await FileSystem.makeDirectoryAsync(collectionDir, { intermediates: true });

      // URL da imagem usando o método do SDK
      const imageUrl = this.getImageURL(card, 'high', 'webp');
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
  async downloadSetImages(setId: string, cards: any[], onProgress?: (progress: number, currentCard: string) => void): Promise<void> {
    try {
      console.log(`Iniciando download da coleção: ${setId}`);
      
      let downloaded = 0;
      const total = cards.length;

      for (const card of cards) {
        try {
          await this.downloadCardImage(card, setId);
          downloaded++;
          
          if (onProgress) {
            onProgress((downloaded / total) * 100, card.name);
          }
        } catch (error) {
          console.error(`Erro ao baixar imagem de ${card.name}:`, error);
        }
      }

      console.log(`Download concluído: ${downloaded}/${total} imagens`);
    } catch (error) {
      console.error('Erro no download da coleção:', error);
      throw error;
    }
  }

  // Obter estatísticas de downloads
  async getDownloadStats(): Promise<{total: number; bySet: {[key: string]: number}}> {
    try {
      const downloadedImages = await this.getDownloadedImages();
      const stats = {
        total: Object.keys(downloadedImages).length,
        bySet: {} as {[key: string]: number}
      };

      Object.values(downloadedImages).forEach((image: DownloadedImage) => {
        stats.bySet[image.setId] = (stats.bySet[image.setId] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, bySet: {} };
    }
  }

  // Limpar cache de imagens
  async clearImageCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      
      // Tentar remover diretório de imagens
      const imagesDir = `${FileSystem.documentDirectory}imagens_pokemon`;
      const dirInfo = await FileSystem.getInfoAsync(imagesDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(imagesDir, { idempotent: true });
      }
      
      console.log('Cache de imagens limpo');
    } catch (error) {
      console.error('Erro ao limpar cache de imagens:', error);
    }
  }

  // Obter estatísticas do cache de imagens
  async getCacheStats(): Promise<{
    totalImages: number;
    totalSizeMB: number;
    cacheDirectory: string;
    imagesBySet: { [setId: string]: { count: number; sizeMB: number } };
  }> {
    try {
      const downloadedImages = await this.getDownloadedImages();
      const totalImages = Object.keys(downloadedImages).length;
      
      let totalSizeBytes = 0;
      const imagesBySet: { [setId: string]: { count: number; sizeMB: number } } = {};
      
      // Calcular tamanho de cada imagem
      for (const [cardId, imageInfo] of Object.entries(downloadedImages)) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageInfo.localPath);
          if (fileInfo.exists && fileInfo.size) {
            totalSizeBytes += fileInfo.size;
            
            const setId = imageInfo.setId;
            if (!imagesBySet[setId]) {
              imagesBySet[setId] = { count: 0, sizeMB: 0 };
            }
            imagesBySet[setId].count++;
            imagesBySet[setId].sizeMB += fileInfo.size / (1024 * 1024);
          }
        } catch (error) {
          console.log(`Erro ao obter info do arquivo ${imageInfo.localPath}:`, error);
        }
      }
      
      const totalSizeMB = totalSizeBytes / (1024 * 1024);
      const cacheDirectory = `${FileSystem.documentDirectory}imagens_pokemon`;
      
      return {
        totalImages,
        totalSizeMB: Math.round(totalSizeMB * 100) / 100, // Arredondar para 2 casas decimais
        cacheDirectory,
        imagesBySet
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error);
      return {
        totalImages: 0,
        totalSizeMB: 0,
        cacheDirectory: '',
        imagesBySet: {}
      };
    }
  }
}

export default new ImageDownloadService();
