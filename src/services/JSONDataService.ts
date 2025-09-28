import DatabaseService, { PokemonCard, PokemonSet, PokemonSeries } from './DatabaseService';

// Importar os JSONs (vamos copiar do projeto antigo)
const pokemonSeries = require('../../assets/data/pokemon_series.json');
const pokemonSets = require('../../assets/data/pokemon_sets.json');
const pokemonList = require('../../assets/data/pokemon_list.json');
const pokemonCardsDetailed = require('../../assets/data/pokemon_cards_detailed.json');

class JSONDataService {
  
  async populateDatabaseFromJSON(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('Iniciando população do banco de dados com JSONs...');
      
      let stats = {
        series: 0,
        sets: 0,
        cards: 0,
        errors: 0
      };

      // 1. Popular Séries
      console.log('Populando séries...');
      const seriesData = this.processSeriesData(pokemonSeries);
      for (const series of seriesData) {
        try {
          await DatabaseService.insertSeries(series);
          stats.series++;
        } catch (error) {
          console.error('Erro ao inserir série:', series.id, error);
          stats.errors++;
        }
      }

      // 2. Popular Sets
      console.log('Populando sets...');
      const setsData = this.processSetsData(pokemonSets);
      for (const set of setsData) {
        try {
          await DatabaseService.insertSet(set);
          stats.sets++;
        } catch (error) {
          console.error('Erro ao inserir set:', set.id, error);
          stats.errors++;
        }
      }

      // 3. Popular Cards (em lotes para performance)
      console.log('Populando cards...');
      const cardsData = this.processCardsData(pokemonCardsDetailed);
      const batchSize = 50;
      
      for (let i = 0; i < cardsData.length; i += batchSize) {
        const batch = cardsData.slice(i, i + batchSize);
        try {
          await DatabaseService.updateCardsBatch(batch);
          stats.cards += batch.length;
          
          // Log de progresso a cada 100 cards
          if (stats.cards % 100 === 0) {
            console.log(`Cards processados: ${stats.cards}/${cardsData.length}`);
          }
        } catch (error) {
          console.error('Erro ao inserir lote de cards:', error);
          stats.errors += batch.length;
        }
      }

      console.log('População do banco concluída:', stats);

      return {
        success: true,
        message: `Banco populado com sucesso! Séries: ${stats.series}, Sets: ${stats.sets}, Cards: ${stats.cards}`,
        stats
      };

    } catch (error: any) {
      console.error('Erro ao popular banco de dados:', error);
      return {
        success: false,
        message: `Erro ao popular banco: ${error?.message || 'Erro desconhecido'}`,
        stats: null
      };
    }
  }

  private processSeriesData(jsonData: any[]): PokemonSeries[] {
    // Agrupar sets por série
    const seriesMap = new Map<string, PokemonSeries>();
    
    jsonData.forEach((item: any) => {
      const seriesId = item.series || 'Unknown';
      if (!seriesMap.has(seriesId)) {
        seriesMap.set(seriesId, {
          id: seriesId,
          name: seriesId,
          logo: item.logo || '',
          totalSets: 0
        });
      }
      seriesMap.get(seriesId)!.totalSets++;
    });

    return Array.from(seriesMap.values());
  }

  private processSetsData(jsonData: any[]): PokemonSet[] {
    return jsonData.map((item: any) => ({
      id: item.id,
      name: item.name,
      series: item.series || 'Unknown',
      releaseDate: item.releaseDate || new Date().toISOString(),
      totalCards: item.total || 0,
      symbol: item.symbol || '',
      logo: item.logo || ''
    }));
  }

  private processCardsData(jsonData: any[]): PokemonCard[] {
    return jsonData.map((item: any) => ({
      id: item.id,
      name: item.name,
      image: item.image || item.images?.large || item.images?.small || '',
      rarity: item.rarity || 'Unknown',
      set: item.set?.id || 'Unknown',
      series: item.set?.series || 'Unknown',
      price: this.extractPrice(item.cardmarket?.prices),
      hp: this.extractHP(item.hp),
      types: this.extractTypes(item.types),
      attacks: this.extractAttacks(item.attacks),
      weaknesses: this.extractWeaknesses(item.weaknesses),
      resistances: this.extractResistances(item.resistances),
      lastUpdated: new Date().toISOString()
    }));
  }

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

  // Método para verificar se os JSONs existem
  async checkJSONAvailability(): Promise<boolean> {
    try {
      // Verificar se os arquivos JSON existem
      return pokemonSeries && pokemonSets && pokemonList && pokemonCardsDetailed;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade dos JSONs:', error);
      return false;
    }
  }

  // Método para obter estatísticas dos JSONs
  getJSONStats(): any {
    return {
      series: pokemonSeries?.length || 0,
      sets: pokemonSets?.length || 0,
      cards: pokemonCardsDetailed?.length || 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

export default new JSONDataService();
