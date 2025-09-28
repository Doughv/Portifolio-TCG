import DatabaseService, { PokemonCard, PokemonSet, PokemonSeries } from './DatabaseService';

// Importar dados pré-processados
const seriesData = require('../data/series.json');
const setsData = require('../data/sets.json');
const cardsData = require('../data/cards.json');
const cardsIndex = require('../data/cards_index.json');

class PreloadedDataService {
  
  async loadPreloadedData(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('Iniciando carregamento de dados pré-processados...');
      
      let stats = {
        series: 0,
        sets: 0,
        cards: 0,
        errors: 0
      };

      // 1. Carregar Séries
      console.log('Carregando séries...');
      for (const series of seriesData) {
        try {
          await DatabaseService.insertSeries(series);
          stats.series++;
        } catch (error) {
          console.error('Erro ao inserir série:', series.id, error);
          stats.errors++;
        }
      }

      // 2. Carregar Sets
      console.log('Carregando sets...');
      for (const set of setsData) {
        try {
          await DatabaseService.insertSet(set);
          stats.sets++;
        } catch (error) {
          console.error('Erro ao inserir set:', set.id, error);
          stats.errors++;
        }
      }

      // 3. Carregar Cards (arquivo único)
      console.log('Carregando cards...');
      
      // Processar em lotes menores para não sobrecarregar
      const batchSize = 100;
      for (let i = 0; i < cardsData.length; i += batchSize) {
        const batch = cardsData.slice(i, i + batchSize);
        await DatabaseService.updateCardsBatch(batch);
        stats.cards += batch.length;
        
        // Log de progresso a cada 1000 cards
        if (stats.cards % 1000 === 0) {
          console.log(`Cards processados: ${stats.cards}/${cardsData.length}`);
        }
      }

      console.log('Carregamento de dados pré-processados concluído:', stats);

      return {
        success: true,
        message: `Dados carregados com sucesso! Séries: ${stats.series}, Sets: ${stats.sets}, Cards: ${stats.cards}`,
        stats
      };

    } catch (error) {
      console.error('Erro ao carregar dados pré-processados:', error);
      return {
        success: false,
        message: `Erro ao carregar dados: ${error.message}`,
        stats: null
      };
    }
  }

  // Verificar se os dados pré-processados estão disponíveis
  isPreloadedDataAvailable(): boolean {
    try {
      return seriesData && setsData && cardsIndex;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade dos dados:', error);
      return false;
    }
  }

  // Obter estatísticas dos dados pré-processados
  getPreloadedStats(): any {
    try {
      return {
        series: seriesData?.length || 0,
        sets: setsData?.length || 0,
        cards: cardsIndex?.totalCards || 0,
        chunks: cardsIndex?.chunks || 0,
        lastUpdated: cardsIndex?.lastUpdated || 'Unknown'
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

export default new PreloadedDataService();
