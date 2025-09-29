import AsyncStorage from '@react-native-async-storage/async-storage';

class CacheService {
  constructor() {
    this.cacheKeys = {
      series: 'cached_series',
      sets: 'cached_sets',
      cards: 'cached_cards',
      lastUpdate: 'last_cache_update',
      exchangeRate: 'cached_exchange_rate'
    };
    
    // Duração do cache em milissegundos
    this.cacheDuration = {
      series: 7 * 24 * 60 * 60 * 1000, // 7 dias
      sets: 7 * 24 * 60 * 60 * 1000,    // 7 dias
      cards: 24 * 60 * 60 * 1000,        // 1 dia
      exchangeRate: 24 * 60 * 60 * 1000 // 1 dia
    };
  }

  // Verificar se o cache está válido
  async isCacheValid(key, duration) {
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
  cleanCircularReferences(obj, seen = new WeakSet()) {
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
    
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cleaned[key] = this.cleanCircularReferences(obj[key], seen);
      }
    }
    
    return cleaned;
  }

  // Salvar dados no cache
  async setCache(key, data) {
    try {
      const timestamp = Date.now().toString();
      const cleanedData = this.cleanCircularReferences(data);
      await AsyncStorage.setItem(key, JSON.stringify(cleanedData));
      await AsyncStorage.setItem(`${key}_timestamp`, timestamp);
      console.log(`✅ Cache salvo: ${key}`);
    } catch (error) {
      console.error(`❌ Erro ao salvar cache ${key}:`, error);
    }
  }

  // Recuperar dados do cache
  async getCache(key) {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (cachedData) {
        console.log(`✅ Cache recuperado: ${key}`);
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error(`❌ Erro ao recuperar cache ${key}:`, error);
      return null;
    }
  }

  // Cache para séries (com suporte a idioma)
  async getCachedSeries(language = 'pt') {
    const key = `${this.cacheKeys.series}_${language}`;
    const isValid = await this.isCacheValid(key, this.cacheDuration.series);
    if (isValid) {
      return await this.getCache(key);
    }
    return null;
  }

  async setCachedSeries(series, language = 'pt') {
    const key = `${this.cacheKeys.series}_${language}`;
    await this.setCache(key, series);
  }

  // Cache para sets/expansões (com suporte a idioma)
  async getCachedSets(language = 'pt') {
    const key = `${this.cacheKeys.sets}_${language}`;
    const isValid = await this.isCacheValid(key, this.cacheDuration.sets);
    if (isValid) {
      return await this.getCache(key);
    }
    return null;
  }

  async setCachedSets(sets, language = 'pt') {
    const key = `${this.cacheKeys.sets}_${language}`;
    await this.setCache(key, sets);
  }

  // Cache para cartas de um set específico (com suporte a idioma)
  async getCachedCards(setId, language = 'pt') {
    const key = `${this.cacheKeys.cards}_${setId}_${language}`;
    const isValid = await this.isCacheValid(key, this.cacheDuration.cards);
    if (isValid) {
      return await this.getCache(key);
    }
    return null;
  }

  async setCachedCards(setId, cards, language = 'pt') {
    const key = `${this.cacheKeys.cards}_${setId}_${language}`;
    await this.setCache(key, cards);
  }

  // Cache para taxa de câmbio
  async getCachedExchangeRate() {
    const isValid = await this.isCacheValid(this.cacheKeys.exchangeRate, this.cacheDuration.exchangeRate);
    if (isValid) {
      return await this.getCache(this.cacheKeys.exchangeRate);
    }
    return null;
  }

  async setCachedExchangeRate(rateData) {
    await this.setCache(this.cacheKeys.exchangeRate, rateData);
  }

  // Limpar todo o cache
  async clearAllCache() {
    try {
      const keys = Object.values(this.cacheKeys);
      const allKeys = [];
      
      // Adicionar todas as chaves de cache
      for (const key of keys) {
        allKeys.push(key);
        allKeys.push(`${key}_timestamp`);
      }
      
      // Adicionar chaves de cartas específicas (buscar todas)
      const allStorageKeys = await AsyncStorage.getAllKeys();
      const cardKeys = allStorageKeys.filter(key => key.startsWith(`${this.cacheKeys.cards}_`));
      allKeys.push(...cardKeys);
      
      await AsyncStorage.multiRemove(allKeys);
      console.log('✅ Cache limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  // Obter informações do cache
  async getCacheInfo() {
    try {
      const info = {};
      
      for (const [name, key] of Object.entries(this.cacheKeys)) {
        const timestamp = await AsyncStorage.getItem(`${key}_timestamp`);
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const ageHours = Math.floor(age / (1000 * 60 * 60));
          info[name] = {
            exists: true,
            ageHours: ageHours,
            isValid: age < this.cacheDuration[name] || this.cacheDuration[name] === undefined
          };
        } else {
          info[name] = { exists: false };
        }
      }
      
      return info;
    } catch (error) {
      console.error('❌ Erro ao obter informações do cache:', error);
      return {};
    }
  }

  // Forçar atualização do cache
  async forceRefreshCache() {
    await this.clearAllCache();
    console.log('🔄 Cache forçado a atualizar');
  }

  // Limpar cache de um idioma específico
  async clearLanguageCache(language) {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const languageKeys = allKeys.filter(key => 
        key.includes(`_${language}`) || 
        key.includes(`_${language}_`)
      );
      
      if (languageKeys.length > 0) {
        await AsyncStorage.multiRemove(languageKeys);
        console.log(`✅ Cache do idioma ${language} limpo:`, languageKeys.length, 'itens');
      }
    } catch (error) {
      console.error(`❌ Erro ao limpar cache do idioma ${language}:`, error);
    }
  }
}

// Criar instância única do serviço
const cacheService = new CacheService();

export default cacheService;
