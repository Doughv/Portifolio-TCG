import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheService {
  private cacheKeys = {
    series: 'cached_series',
    sets: 'cached_sets',
    cards: 'cached_cards',
    lastUpdate: 'last_cache_update',
    exchangeRate: 'cached_exchange_rate'
  };
  
  // Duração do cache em milissegundos
  private cacheDuration = {
    series: 7 * 24 * 60 * 60 * 1000, // 7 dias
    sets: 7 * 24 * 60 * 60 * 1000,    // 7 dias
    cards: 24 * 60 * 60 * 1000,        // 1 dia
    exchangeRate: 24 * 60 * 60 * 1000 // 1 dia
  };

  // Verificar se o cache está válido
  async isCacheValid(key: string, duration: number): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(`${key}_timestamp`);
      if (!lastUpdate) return false;
      
      const timeDiff = Date.now() - parseInt(lastUpdate);
      return timeDiff < duration;
    } catch (error) {
      console.error('Erro ao verificar validade do cache:', error);
      return false;
    }
  }

  // Limpar referências circulares dos objetos
  private cleanCircularReferences(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (seen.has(obj)) {
      return '[Circular Reference]';
    }
    
    seen.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanCircularReferences(item, seen));
    }
    
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cleaned[key] = this.cleanCircularReferences(obj[key], seen);
      }
    }
    
    return cleaned;
  }

  // Salvar dados no cache
  async setCache(key: string, data: any, duration?: number): Promise<void> {
    try {
      const cacheKey = this.cacheKeys[key as keyof typeof this.cacheKeys] || key;
      const cacheDuration = duration || this.cacheDuration[key as keyof typeof this.cacheDuration] || this.cacheDuration.series;
      
      // Limpar referências circulares
      const cleanedData = this.cleanCircularReferences(data);
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cleanedData));
      await AsyncStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      
      console.log(`Cache salvo para ${key}:`, cleanedData?.length || 'objeto');
    } catch (error) {
      console.error(`Erro ao salvar cache para ${key}:`, error);
    }
  }

  // Recuperar dados do cache
  async getCache(key: string): Promise<any> {
    try {
      const cacheKey = this.cacheKeys[key as keyof typeof this.cacheKeys] || key;
      const data = await AsyncStorage.getItem(cacheKey);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error(`Erro ao recuperar cache para ${key}:`, error);
      return null;
    }
  }

  // Verificar e recuperar cache se válido
  async getValidCache(key: string): Promise<any> {
    try {
      const cacheKey = this.cacheKeys[key as keyof typeof this.cacheKeys] || key;
      const duration = this.cacheDuration[key as keyof typeof this.cacheDuration] || this.cacheDuration.series;
      
      if (await this.isCacheValid(cacheKey, duration)) {
        return await this.getCache(key);
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao verificar cache válido para ${key}:`, error);
      return null;
    }
  }

  // Limpar cache específico
  async clearCache(key: string): Promise<void> {
    try {
      const cacheKey = this.cacheKeys[key as keyof typeof this.cacheKeys] || key;
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(`${cacheKey}_timestamp`);
      
      console.log(`Cache limpo para ${key}`);
    } catch (error) {
      console.error(`Erro ao limpar cache para ${key}:`, error);
    }
  }

  // Limpar cache de um idioma específico
  async clearLanguageCache(language: string): Promise<void> {
    try {
      console.log(`Limpando cache do idioma ${language}...`);
      
      const keys = Object.values(this.cacheKeys).map(key => `${key}_${language}`);
      await AsyncStorage.multiRemove(keys);
      
      console.log(`Cache do idioma ${language} limpo`);
    } catch (error) {
      console.error(`Erro ao limpar cache do idioma ${language}:`, error);
    }
  }

  // Limpar todo o cache
  async clearAllCache(): Promise<void> {
    try {
      console.log('Limpando todo o cache...');
      
      const keys = Object.values(this.cacheKeys);
      const timestampKeys = keys.map(key => `${key}_timestamp`);
      
      await AsyncStorage.multiRemove([...keys, ...timestampKeys]);
      
      console.log('Todo o cache foi limpo');
    } catch (error) {
      console.error('Erro ao limpar todo o cache:', error);
    }
  }

  // Obter informações do cache
  async getCacheInfo(): Promise<any> {
    try {
      const info: any = {};
      
      for (const [key, cacheKey] of Object.entries(this.cacheKeys)) {
        const data = await AsyncStorage.getItem(cacheKey);
        const timestamp = await AsyncStorage.getItem(`${cacheKey}_timestamp`);
        
        info[key] = {
          exists: !!data,
          size: data ? data.length : 0,
          lastUpdate: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Nunca',
          isValid: timestamp ? await this.isCacheValid(cacheKey, this.cacheDuration[key as keyof typeof this.cacheDuration]) : false
        };
      }
      
      return info;
    } catch (error) {
      console.error('Erro ao obter informações do cache:', error);
      return {};
    }
  }

  // Obter tamanho total do cache
  async getCacheSize(): Promise<number> {
    try {
      let totalSize = 0;
      
      for (const cacheKey of Object.values(this.cacheKeys)) {
        const data = await AsyncStorage.getItem(cacheKey);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Erro ao calcular tamanho do cache:', error);
      return 0;
    }
  }

  // Verificar se há espaço suficiente para o cache
  async hasEnoughSpace(requiredSize: number): Promise<boolean> {
    try {
      const currentSize = await this.getCacheSize();
      const availableSpace = 50 * 1024 * 1024; // 50MB (estimativa)
      
      return (currentSize + requiredSize) < availableSpace;
    } catch (error) {
      console.error('Erro ao verificar espaço do cache:', error);
      return false;
    }
  }

  // Otimizar cache (remover dados antigos)
  async optimizeCache(): Promise<void> {
    try {
      console.log('Otimizando cache...');
      
      for (const [key, cacheKey] of Object.entries(this.cacheKeys)) {
        const duration = this.cacheDuration[key as keyof typeof this.cacheDuration];
        
        if (!(await this.isCacheValid(cacheKey, duration))) {
          await this.clearCache(key);
          console.log(`Cache expirado removido: ${key}`);
        }
      }
      
      console.log('Cache otimizado');
    } catch (error) {
      console.error('Erro ao otimizar cache:', error);
    }
  }
}

export default new CacheService();
