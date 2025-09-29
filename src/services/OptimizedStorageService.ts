import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService, { PokemonCard, PokemonSet, PokemonSeries } from './DatabaseService';

class OptimizedStorageService {
  private cacheKeys = {
    series: 'optimized_series',
    sets: 'optimized_sets',
    cards: 'optimized_cards',
    summary: 'optimized_summary',
    lastUpdate: 'last_update_check'
  };

  // Salvar dados otimizados no banco SQLite
  async saveData(type: string, data: any[], language = 'pt'): Promise<void> {
    try {
      console.log(`Salvando dados ${type} para ${language}:`, data.length);
      
      switch (type) {
        case 'series':
          for (const serie of data) {
            await DatabaseService.insertSeries({
              id: serie.id,
              name: serie.name,
              logo: serie.logo || '',
              totalSets: serie.totalSets || 0
            });
          }
          break;
          
        case 'sets':
          for (const set of data) {
            await DatabaseService.insertSet({
              id: set.id,
              name: set.name,
              series: set.serie || set.series,
              releaseDate: set.releaseDate || set.release || set.date || null,
              totalCards: set.cardCount?.total || set.cardCount?.official || 0,
              symbol: set.symbol || '',
              logo: set.logo || ''
            });
          }
          break;
          
        case 'cards':
          // Processar cards em lotes para não sobrecarregar
          const batchSize = 100;
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            const processedCards = batch.map(card => ({
              id: card.id,
              name: card.name,
              image: card.image || card.images?.large || card.images?.small || '',
              rarity: card.rarity || 'Unknown',
              set: card.set?.id || 'Unknown',
              series: card.set?.serie || card.set?.series || 'Unknown',
              price: this.extractPrice(card.cardmarket?.prices),
              hp: this.extractHP(card.hp),
              types: this.extractTypes(card.types),
              attacks: this.extractAttacks(card.attacks),
              weaknesses: this.extractWeaknesses(card.weaknesses),
              resistances: this.extractResistances(card.resistances),
              lastUpdated: new Date().toISOString()
            }));
            
            await DatabaseService.updateCardsBatch(processedCards);
            
            console.log(`Processados ${Math.min(i + batchSize, data.length)}/${data.length} cards`);
          }
          break;
      }
      
      console.log(`Dados ${type} salvos no banco para ${language}:`, data.length);
      
    } catch (error) {
      console.error(`Erro ao salvar ${type}:`, error);
      throw error;
    }
  }

  // Carregar dados do banco SQLite
  async loadData(type: string, language = 'pt'): Promise<any[]> {
    try {
      switch (type) {
        case 'series':
          return await DatabaseService.getAllSeries();
          
        case 'sets':
          // Retornar todos os sets (sem filtro por série)
          const allSets = await DatabaseService.getAllSets();
          return allSets;
          
        case 'cards':
          // Retornar todos os cards (sem filtro por set)
          const allCards = await DatabaseService.getAllCards();
          return allCards;
          
        default:
          return [];
      }
    } catch (error) {
      console.error(`Erro ao carregar ${type}:`, error);
      return [];
    }
  }

  // Migrar dados dos JSONs para o banco (atalho inicial)
  async migrateFromJSON(language = 'pt'): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('Iniciando migração dos JSONs para o banco...');
      
      let stats = {
        series: 0,
        sets: 0,
        cards: 0,
        errors: 0
      };

      // Verificar se já temos dados no banco
      const existingStats = await DatabaseService.getStats();
      if (existingStats.series > 0 || existingStats.sets > 0 || existingStats.cards > 0) {
        return {
          success: true,
          message: `Dados já existem no banco: ${existingStats.series} séries, ${existingStats.sets} sets, ${existingStats.cards} cards`,
          stats: existingStats
        };
      }

      // Importar dados dos JSONs processados
      try {
        const seriesData = require('../data/series.json');
        const setsData = require('../data/sets.json');
        const cardsData = require('../data/cards.json');

        // 1. Migrar séries
        console.log('Migrando séries...');
        for (const series of seriesData) {
          try {
            await DatabaseService.insertSeries({
              id: series.id,
              name: series.name,
              logo: series.logo || '',
              totalSets: 0 // Será atualizado quando migrarmos os sets
            });
            stats.series++;
          } catch (error) {
            console.error('Erro ao inserir série:', series.id, error);
            stats.errors++;
          }
        }

        // 2. Migrar sets
        console.log('Migrando sets...');
        for (const set of setsData) {
          try {
            await DatabaseService.insertSet({
              id: set.id,
              name: set.name,
              series: set.series,
              releaseDate: set.releaseDate,
              totalCards: set.totalCards,
              symbol: set.symbol,
              logo: set.logo
            });
            stats.sets++;
          } catch (error) {
            console.error('Erro ao inserir set:', set.id, error);
            stats.errors++;
          }
        }

        // 3. Migrar cards (em lotes)
        console.log('Migrando cards...');
        const batchSize = 100;
        for (let i = 0; i < cardsData.length; i += batchSize) {
          const batch = cardsData.slice(i, i + batchSize);
          try {
            await DatabaseService.updateCardsBatch(batch);
            stats.cards += batch.length;
            
            // Log de progresso a cada 1000 cards
            if (stats.cards % 1000 === 0) {
              console.log(`Cards migrados: ${stats.cards}/${cardsData.length}`);
            }
          } catch (error) {
            console.error('Erro ao inserir lote de cards:', error);
            stats.errors++;
          }
        }

        console.log('Migração dos JSONs concluída:', stats);

        return {
          success: true,
          message: `Migração concluída! ${stats.series} séries, ${stats.sets} sets e ${stats.cards} cards migrados. ${stats.errors} erros.`,
          stats
        };

      } catch (error) {
        console.error('Erro ao carregar JSONs:', error);
        return {
          success: false,
          message: `Erro ao carregar JSONs: ${error.message}`,
          stats: null
        };
      }
      
    } catch (error) {
      console.error('Erro na migração dos JSONs:', error);
      return {
        success: false,
        message: `Erro na migração: ${error.message}`,
        stats: null
      };
    }
  }

  // Verificar se há atualizações disponíveis
  async checkForUpdates(apiData: any, language = 'pt'): Promise<{ hasUpdates: boolean; newSeries: any[]; newSets: any[]; counts: any }> {
    try {
      const localSeries = await this.loadData('series', language);
      const localSets = await this.loadData('sets', language);
      
      const apiSeriesIds = apiData.series?.map((s: any) => s.id) || [];
      const apiSetsIds = apiData.sets?.map((s: any) => s.id) || [];
      
      const localSeriesIds = localSeries.map(s => s.id);
      const localSetsIds = localSets.map(s => s.id);
      
      const newSeries = apiData.series?.filter((s: any) => !localSeriesIds.includes(s.id)) || [];
      const newSets = apiData.sets?.filter((s: any) => !localSetsIds.includes(s.id)) || [];
      
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
      return {
        hasUpdates: false,
        newSeries: [],
        newSets: [],
        counts: { series: 0, sets: 0 }
      };
    }
  }

  // Obter estatísticas do banco
  async getStats(language = 'pt'): Promise<any> {
    try {
      return await DatabaseService.getStats();
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { series: 0, sets: 0, cards: 0 };
    }
  }

  // Limpar cache de um idioma específico
  async clearLanguageCache(language: string): Promise<void> {
    try {
      console.log(`Limpando cache do idioma ${language}...`);
      
      // Limpar dados do banco se necessário
      // Por enquanto, mantemos os dados no banco pois são universais
      
      // Limpar cache do AsyncStorage
      const keys = Object.values(this.cacheKeys).map(key => `${key}_${language}`);
      await AsyncStorage.multiRemove(keys);
      
      console.log(`Cache do idioma ${language} limpo`);
      
    } catch (error) {
      console.error(`Erro ao limpar cache do idioma ${language}:`, error);
    }
  }

  // Limpar todos os dados
  async clearAllData(): Promise<void> {
    try {
      console.log('Limpando todos os dados...');
      
      // Limpar banco de dados
      await DatabaseService.clearAllData();
      
      // Limpar AsyncStorage
      const keys = Object.values(this.cacheKeys);
      await AsyncStorage.multiRemove(keys);
      
      console.log('Todos os dados foram limpos');
      
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }

  // Métodos auxiliares para extrair dados
  private extractPrice(prices: any): number {
    if (!prices) return 0;
    return prices.low || prices.mid || prices.high || prices.market || prices.directLow || 0;
  }

  private extractHP(hp: any): number | undefined {
    if (typeof hp === 'string') {
      const match = hp.match(/\d+/);
      return match ? parseInt(match[0]) : undefined;
    }
    return typeof hp === 'number' ? hp : undefined;
  }

  private extractTypes(types: any): string[] {
    return Array.isArray(types) ? types : [];
  }

  private extractAttacks(attacks: any): Array<{
    name: string;
    cost: string[];
    damage?: string;
    text?: string;
  }> {
    if (!Array.isArray(attacks)) return [];
    
    return attacks.map(attack => ({
      name: attack.name || '',
      cost: attack.cost || [],
      damage: attack.damage || undefined,
      text: attack.text || undefined
    }));
  }

  private extractWeaknesses(weaknesses: any): Array<{
    type: string;
    value: string;
  }> {
    if (!Array.isArray(weaknesses)) return [];
    
    return weaknesses.map(weakness => ({
      type: weakness.type || '',
      value: weakness.value || ''
    }));
  }

  private extractResistances(resistances: any): Array<{
    type: string;
    value: string;
  }> {
    if (!Array.isArray(resistances)) return [];
    
    return resistances.map(resistance => ({
      type: resistance.type || '',
      value: resistance.value || ''
    }));
  }
}

export default new OptimizedStorageService();
