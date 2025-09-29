import AsyncStorage from '@react-native-async-storage/async-storage';

class OptimizedStorageService {
  constructor() {
    this.cacheKeys = {
      series: 'optimized_series',
      sets: 'optimized_sets',
      cards: 'optimized_cards',
      summary: 'optimized_summary',
      lastUpdate: 'last_update_check'
    };
  }

  // Salvar dados otimizados
  async saveData(type, data, language = 'pt') {
    try {
      const key = `${this.cacheKeys[type]}_${language}`;
      const optimizedData = this.optimizeData(data);
      await AsyncStorage.setItem(key, JSON.stringify(optimizedData));
      console.log(`Dados ${type} salvos para ${language}:`, optimizedData.length);
    } catch (error) {
      console.error(`Erro ao salvar ${type}:`, error);
    }
  }

  // Carregar dados otimizados
  async loadData(type, language = 'pt') {
    try {
      const key = `${this.cacheKeys[type]}_${language}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erro ao carregar ${type}:`, error);
      return [];
    }
  }

  // Otimizar dados para armazenamento
  optimizeData(data) {
    if (!Array.isArray(data)) return data;
    
    return data.map(item => {
      // Manter apenas campos essenciais
      const optimized = {
        id: item.id,
        name: item.name,
        image: item.image,
        language: item.language || 'pt'
      };

      // Adicionar campos específicos por tipo
      if (item.logo) optimized.logo = item.logo;
      if (item.releaseDate) optimized.releaseDate = item.releaseDate;
      if (item.release) optimized.release = item.release;
      if (item.date) optimized.date = item.date;
      if (item.symbol) optimized.symbol = item.symbol;
      if (item.cardCount) optimized.cardCount = item.cardCount;
      if (item.serie) optimized.serie = item.serie;
      if (item.localId) optimized.localId = item.localId;
      if (item.rarity) optimized.rarity = item.rarity;
      if (item.category) optimized.category = item.category;
      if (item.hp) optimized.hp = item.hp;
      if (item.types) optimized.types = item.types;
      if (item.stage) optimized.stage = item.stage;
      if (item.suffix) optimized.suffix = item.suffix;
      if (item.dexId) optimized.dexId = item.dexId;
      if (item.illustrator) optimized.illustrator = item.illustrator;
      if (item.set) optimized.set = item.set;
      if (item.variants) optimized.variants = item.variants;
      if (item.attacks) optimized.attacks = item.attacks;
      if (item.weaknesses) optimized.weaknesses = item.weaknesses;
      if (item.resistances) optimized.resistances = item.resistances;

      return optimized;
    });
  }

  // Verificar atualizações
  async checkForUpdates(apiData, language = 'pt') {
    try {
      const localSeries = await this.loadData('series', language);
      const localSets = await this.loadData('sets', language);
      
      const apiSeriesIds = apiData.series?.map(s => s.id) || [];
      const apiSetsIds = apiData.sets?.map(s => s.id) || [];
      
      const localSeriesIds = localSeries.map(s => s.id);
      const localSetsIds = localSets.map(s => s.id);
      
      const newSeries = apiData.series?.filter(s => !localSeriesIds.includes(s.id)) || [];
      const newSets = apiData.sets?.filter(s => !localSetsIds.includes(s.id)) || [];
      
      return {
        hasUpdates: newSeries.length > 0 || newSets.length > 0,
        newSeries,
        newSets,
        counts: {
          series: newSeries.length,
          sets: newSets.length
        }
      };
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return { hasUpdates: false, newSeries: [], newSets: [], counts: { series: 0, sets: 0 } };
    }
  }

  // Atualizar dados
  async updateData(apiData, language = 'pt') {
    try {
      const updateCheck = await this.checkForUpdates(apiData, language);
      
      if (updateCheck.hasUpdates) {
        console.log('Atualizações encontradas:', updateCheck.counts);
        
        // Atualizar séries
        if (updateCheck.newSeries.length > 0) {
          const currentSeries = await this.loadData('series', language);
          const updatedSeries = [...currentSeries, ...updateCheck.newSeries];
          await this.saveData('series', updatedSeries, language);
        }
        
        // Atualizar sets
        if (updateCheck.newSets.length > 0) {
          const currentSets = await this.loadData('sets', language);
          const updatedSets = [...currentSets, ...updateCheck.newSets];
          await this.saveData('sets', updatedSets, language);
        }
        
        return {
          success: true,
          newCounts: updateCheck.counts,
          message: `Atualizadas ${updateCheck.counts.series} séries e ${updateCheck.counts.sets} expansões!`
        };
      } else {
        return {
          success: true,
          newCounts: { series: 0, sets: 0 },
          message: 'Dados já estão atualizados!'
        };
      }
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      return {
        success: false,
        message: `Erro ao atualizar: ${error.message}`
      };
    }
  }

  // Obter estatísticas
  async getStats(language = 'pt') {
    try {
      const series = await this.loadData('series', language);
      const sets = await this.loadData('sets', language);
      const cards = await this.loadData('cards', language);
      
      return {
        series: series.length,
        sets: sets.length,
        cards: cards.length
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { series: 0, sets: 0, cards: 0 };
    }
  }

  // Limpar dados por idioma
  async clearLanguageData(language = 'pt') {
    try {
      const keys = [
        `${this.cacheKeys.series}_${language}`,
        `${this.cacheKeys.sets}_${language}`,
        `${this.cacheKeys.cards}_${language}`,
        `${this.cacheKeys.summary}_${language}`
      ];
      
      await AsyncStorage.multiRemove(keys);
      console.log(`Dados do idioma ${language} limpos`);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }

  // Migrar dados do JSON (opcional)
  async migrateFromJSON(language = 'pt') {
    try {
      const seriesData = require('../assets/data/pokemon_series.json');
      const setsData = require('../assets/data/pokemon_sets.json');
      
      await this.saveData('series', seriesData, language);
      await this.saveData('sets', setsData, language);
      
      console.log(`Migração do JSON concluída para ${language}`);
      return { success: true, message: 'Migração concluída' };
    } catch (error) {
      console.error('Erro na migração:', error);
      return { success: false, message: error.message };
    }
  }
}

export default new OptimizedStorageService();
