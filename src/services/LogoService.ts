import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogoCache {
  [key: string]: string; // key: seriesId ou setId, value: local file path
}

class LogoService {
  private static instance: LogoService;
  private logoCache: LogoCache = {};
  private cacheDirectory: string;

  constructor() {
    this.cacheDirectory = `${FileSystem.documentDirectory}logos/`;
    this.initializeCache();
  }

  static getInstance(): LogoService {
    if (!LogoService.instance) {
      LogoService.instance = new LogoService();
    }
    return LogoService.instance;
  }

  private async initializeCache() {
    try {
      // Criar diretório de logos se não existir
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
        console.log('📁 Diretório de logos criado:', this.cacheDirectory);
      }

      // Carregar cache do AsyncStorage
      const cachedLogos = await AsyncStorage.getItem('logoCache');
      if (cachedLogos) {
        this.logoCache = JSON.parse(cachedLogos);
        console.log('📋 Cache de logos carregado:', Object.keys(this.logoCache).length, 'logos');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar cache de logos:', error);
    }
  }

  private async saveCacheToStorage() {
    try {
      await AsyncStorage.setItem('logoCache', JSON.stringify(this.logoCache));
    } catch (error) {
      console.error('❌ Erro ao salvar cache de logos:', error);
    }
  }

  /**
   * Verifica se o logo está em cache local
   */
  async isLogoCached(id: string): Promise<boolean> {
    const localPath = this.logoCache[id];
    if (!localPath) return false;

    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      return fileInfo.exists;
    } catch {
      return false;
    }
  }

  /**
   * Obtém o caminho local do logo (se existir)
   */
  getLocalLogoPath(id: string): string | null {
    return this.logoCache[id] || null;
  }

  /**
   * Baixa e salva um logo da URL fornecida
   */
  async downloadLogo(id: string, logoUrl: string): Promise<string | null> {
    try {
      console.log(`🔽 Iniciando download de logo para ${id}`);
      console.log(`🔗 URL do logo:`, logoUrl);
      
      const fileName = `${id}.png`;
      const localPath = `${this.cacheDirectory}${fileName}`;
      console.log(`📁 Caminho local:`, localPath);

      // Verificar se já existe
      if (await this.isLogoCached(id)) {
        console.log(`✅ Logo já existe em cache para ${id}`);
        return this.logoCache[id];
      }

      console.log(`⬇️ Fazendo download de ${logoUrl} para ${localPath}`);
      
      // Baixar o arquivo
      const downloadResult = await FileSystem.downloadAsync(logoUrl, localPath);
      
      console.log(`📊 Status do download:`, downloadResult.status);
      console.log(`📊 URI resultante:`, downloadResult.uri);
      
      if (downloadResult.status === 200) {
        // Salvar no cache
        this.logoCache[id] = localPath;
        await this.saveCacheToStorage();
        
        console.log(`✅ Logo baixado com sucesso para ${id}:`, localPath);
        return localPath;
      } else {
        console.error(`❌ Erro HTTP ao baixar logo para ${id}:`, downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error(`❌ Exceção ao baixar logo para ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtém o logo de uma série com cache permanente
   */
  async getSeriesLogo(seriesId: string, logoUrl?: string): Promise<string | null> {
    // Verificar se já está em cache
    if (this.logoCache[seriesId]) {
      console.log(`💾 Logo de série em cache para ${seriesId}:`, this.logoCache[seriesId]);
      return this.logoCache[seriesId];
    }

    // Se tem URL de logo, processar e salvar no cache
    if (logoUrl) {
      console.log(`🔗 Processando logo de série para ${seriesId}:`, logoUrl);
      
      // Adicionar .webp se não tiver extensão
      let finalLogoUrl = logoUrl;
      if (!logoUrl.includes('.webp') && !logoUrl.includes('.png') && !logoUrl.includes('.jpg')) {
        finalLogoUrl = logoUrl + '.webp';
        console.log(`📎 Adicionando extensão .webp:`, finalLogoUrl);
      }
      
      // Salvar no cache permanente
      this.logoCache[seriesId] = finalLogoUrl;
      await this.saveCacheToStorage();
      
      console.log(`💾 Logo de série salvo no cache para ${seriesId}:`, finalLogoUrl);
      return finalLogoUrl;
    }

    console.log(`⚠️ Nenhum logo encontrado para série ${seriesId}`);
    return null;
  }

  /**
   * Obtém o logo de um set com cache permanente
   */
  async getSetLogo(setId: string, logoUrl?: string): Promise<string | null> {
    // Verificar se já está em cache
    if (this.logoCache[setId]) {
      console.log(`💾 Logo em cache para ${setId}:`, this.logoCache[setId]);
      return this.logoCache[setId];
    }

    // Se tem URL de logo, processar e salvar no cache
    if (logoUrl) {
      console.log(`🔗 Processando logo para ${setId}:`, logoUrl);
      
      // Adicionar .webp se não tiver extensão (como no projeto antigo)
      let finalLogoUrl = logoUrl;
      if (!logoUrl.includes('.webp') && !logoUrl.includes('.png') && !logoUrl.includes('.jpg')) {
        finalLogoUrl = logoUrl + '.webp';
        console.log(`📎 Adicionando extensão .webp:`, finalLogoUrl);
      }
      
      // Salvar no cache permanente
      this.logoCache[setId] = finalLogoUrl;
      await this.saveCacheToStorage();
      
      console.log(`💾 Logo salvo no cache para ${setId}:`, finalLogoUrl);
      return finalLogoUrl;
    }

    console.log(`⚠️ Nenhum logo encontrado para set ${setId}`);
    return null;
  }

  /**
   * Limpa o cache de logos
   */
  async clearCache(): Promise<void> {
    try {
      // Remover arquivos do diretório
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDirectory);
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }

      // Limpar cache em memória e storage
      this.logoCache = {};
      await AsyncStorage.removeItem('logoCache');
      
      console.log('🧹 Cache de logos limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache de logos:', error);
    }
  }

  /**
   * Obtém estatísticas do cache de logos
   */
  async getCacheStats(): Promise<{
    totalLogos: number;
    totalSizeMB: number;
    cacheDirectory: string;
  }> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!dirInfo.exists) {
        return { totalLogos: 0, totalSizeMB: 0, cacheDirectory: this.cacheDirectory };
      }

      const files = await FileSystem.readDirectoryAsync(this.cacheDirectory);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${this.cacheDirectory}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return {
        totalLogos: files.length,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        cacheDirectory: this.cacheDirectory,
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do cache de logos:', error);
      return { totalLogos: 0, totalSizeMB: 0, cacheDirectory: this.cacheDirectory };
    }
  }
}

export default LogoService.getInstance();
