import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineService {
  constructor() {
    this.dataPath = '../assets/data/';
    this.cacheKeys = {
      series: 'offline_series',
      sets: 'offline_sets', 
      cards: 'offline_cards',
      lastUpdate: 'last_offline_update',
      summary: 'offline_summary'
    };
  }

  // Carregar dados JSON locais
  async loadLocalData() {
    try {
      console.log('📁 Carregando dados offline...');
      
      // Carregar séries
      const seriesData = require('../assets/data/pokemon_series.json');
      console.log('✅ Séries carregadas:', seriesData.length);
      
      // Carregar sets
      const setsData = require('../assets/data/pokemon_sets.json');
      console.log('✅ Sets carregados:', setsData.length);
      
      // Carregar cards (apenas resumo para performance)
      const cardsData = require('../assets/data/pokemon_cards_detailed.json');
      console.log('✅ Cards carregados:', cardsData.length);
      
      // Criar resumo para comparação (sem salvar cards no cache)
      const summary = {
        series: seriesData.map(s => s.id),
        sets: setsData.map(s => s.id),
        cards: cardsData.map(c => c.id),
        lastUpdate: new Date().toISOString(),
        counts: {
          series: seriesData.length,
          sets: setsData.length,
          cards: cardsData.length
        }
      };
      
      // Salvar no cache (apenas séries e sets - cards ficam no JSON)
      await this.saveToCache('series', seriesData);
      await this.saveToCache('sets', setsData);
      // NÃO salvar cards no cache - muito grande (26MB)
      await this.saveToCache('summary', summary);
      
      console.log('✅ Dados offline carregados e salvos no cache');
      return { series: seriesData, sets: setsData, cards: cardsData, summary };
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados offline:', error);
      throw error;
    }
  }

  // Salvar dados no cache
  async saveToCache(key, data) {
    try {
      const cacheKey = this.cacheKeys[key];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`✅ ${key} salvo no cache`);
    } catch (error) {
      console.error(`❌ Erro ao salvar ${key} no cache:`, error);
    }
  }

  // Carregar dados do cache
  async loadFromCache(key) {
    try {
      const cacheKey = this.cacheKeys[key];
      const data = await AsyncStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Erro ao carregar ${key} do cache:`, error);
      return null;
    }
  }

  // Verificar se dados offline estão disponíveis
  async hasOfflineData() {
    try {
      const summary = await this.loadFromCache('summary');
      return summary !== null;
    } catch (error) {
      console.error('❌ Erro ao verificar dados offline:', error);
      return false;
    }
  }

  // Obter resumo dos dados offline
  async getOfflineSummary() {
    try {
      const summary = await this.loadFromCache('summary');
      if (summary) {
        return {
          hasData: true,
          lastUpdate: summary.lastUpdate,
          counts: summary.counts,
          series: summary.series,
          sets: summary.sets,
          cards: summary.cards
        };
      }
      return { hasData: false };
    } catch (error) {
      console.error('❌ Erro ao obter resumo offline:', error);
      return { hasData: false };
    }
  }

  // Verificar atualizações comparando com API
  async checkForUpdates(apiData) {
    try {
      console.log('Verificando atualizações...');
      
      const offlineSummary = await this.getOfflineSummary();
      if (!offlineSummary.hasData) {
        console.log('❌ Nenhum dado offline encontrado');
        return { needsUpdate: true, reason: 'No offline data' };
      }

      // Comparar contagens
      const apiCounts = {
        series: apiData.series?.length || 0,
        sets: apiData.sets?.length || 0,
        cards: apiData.cards?.length || 0
      };

      const offlineCounts = offlineSummary.counts;

      console.log('Comparando contagens:');
      console.log('  API:', apiCounts);
      console.log('  Offline:', offlineCounts);

      // Verificar se há diferenças
      const differences = {
        series: apiCounts.series - offlineCounts.series,
        sets: apiCounts.sets - offlineCounts.sets,
        cards: apiCounts.cards - offlineCounts.cards
      };

      const hasUpdates = Object.values(differences).some(diff => diff > 0);

      if (hasUpdates) {
        console.log('Atualizações encontradas:', differences);
        return {
          needsUpdate: true,
          differences,
          newItems: {
            series: differences.series,
            sets: differences.sets,
            cards: differences.cards
          }
        };
      }

      console.log('✅ Dados estão atualizados');
      return { needsUpdate: false };

    } catch (error) {
      console.error('❌ Erro ao verificar atualizações:', error);
      return { needsUpdate: true, reason: 'Error checking updates' };
    }
  }

  // Atualizar dados offline
  async updateOfflineData(newData) {
    try {
      console.log('Atualizando dados offline...');
      
      // Carregar dados atuais
      const currentSeries = await this.loadFromCache('series') || [];
      const currentSets = await this.loadFromCache('sets') || [];
      // Cards não são salvos no cache - ficam no JSON

      // Mesclar novos dados
      const updatedSeries = [...currentSeries, ...(newData.series || [])];
      const updatedSets = [...currentSets, ...(newData.sets || [])];
      // Cards ficam no JSON original - não atualizamos via cache

      // Salvar dados atualizados (apenas séries e sets)
      await this.saveToCache('series', updatedSeries);
      await this.saveToCache('sets', updatedSets);
      // NÃO salvar cards no cache - muito grande

      // Atualizar resumo (cards vêm do JSON original)
      const cardsData = require('../assets/data/pokemon_cards_detailed.json');
      const newSummary = {
        series: updatedSeries.map(s => s.id),
        sets: updatedSets.map(s => s.id),
        cards: cardsData.map(c => c.id), // Sempre do JSON original
        lastUpdate: new Date().toISOString(),
        counts: {
          series: updatedSeries.length,
          sets: updatedSets.length,
          cards: cardsData.length // Sempre do JSON original
        }
      };

      await this.saveToCache('summary', newSummary);

      console.log('✅ Dados offline atualizados');
      return {
        success: true,
        newCounts: newSummary.counts
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar dados offline:', error);
      return { success: false, error: error.message };
    }
  }

  // Carregar cards do JSON (quando necessário)
  async loadCardsFromJSON() {
    try {
      console.log('📁 Carregando cards do JSON...');
      const cardsData = require('../assets/data/pokemon_cards_detailed.json');
      console.log('✅ Cards carregados do JSON:', cardsData.length);
      return cardsData;
    } catch (error) {
      console.error('❌ Erro ao carregar cards do JSON:', error);
      return [];
    }
  }

  // Limpar dados offline
  async clearOfflineData() {
    try {
      console.log('Limpando dados offline...');
      
      const keys = Object.values(this.cacheKeys);
      await AsyncStorage.multiRemove(keys);
      
      console.log('✅ Dados offline limpos');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao limpar dados offline:', error);
      return { success: false, error: error.message };
    }
  }
}

// Criar instância única do serviço
const offlineService = new OfflineService();

export default offlineService;
