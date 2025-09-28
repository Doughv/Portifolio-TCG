import axios from 'axios';
import DatabaseService, { PokemonCard, PokemonSet, PokemonSeries } from './DatabaseService';

const API_BASE_URL = 'https://api.pokemontcg.io/v2';

class SyncService {
  private apiKey: string = ''; // Adicione sua API key aqui se necessário

  async syncAllData(): Promise<void> {
    try {
      console.log('Starting data sync...');
      
      // 1. Sincronizar séries
      await this.syncSeries();
      
      // 2. Sincronizar sets
      await this.syncSets();
      
      // 3. Sincronizar cards (em lotes para não sobrecarregar)
      await this.syncCards();
      
      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Error during data sync:', error);
      throw error;
    }
  }

  async syncSeries(): Promise<void> {
    try {
      console.log('Syncing series...');
      
      const response = await axios.get(`${API_BASE_URL}/sets`, {
        params: {
          pageSize: 250, // Máximo permitido
          orderBy: 'releaseDate'
        }
      });

      // Agrupar sets por série
      const seriesMap = new Map<string, PokemonSeries>();
      
      response.data.data.forEach((set: any) => {
        const seriesId = set.series;
        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            id: seriesId,
            name: seriesId,
            logo: set.images?.logo || '',
            totalSets: 0
          });
        }
        seriesMap.get(seriesId)!.totalSets++;
      });

      // Salvar séries no banco
      for (const series of seriesMap.values()) {
        await DatabaseService.insertSeries(series);
      }

      console.log(`Synced ${seriesMap.size} series`);
    } catch (error) {
      console.error('Error syncing series:', error);
      throw error;
    }
  }

  async syncSets(): Promise<void> {
    try {
      console.log('Syncing sets...');
      
      let page = 1;
      let hasMore = true;
      let totalSets = 0;

      while (hasMore) {
        const response = await axios.get(`${API_BASE_URL}/sets`, {
          params: {
            page: page,
            pageSize: 250,
            orderBy: 'releaseDate'
          }
        });

        const sets: PokemonSet[] = response.data.data.map((set: any) => ({
          id: set.id,
          name: set.name,
          series: set.series,
          releaseDate: set.releaseDate,
          totalCards: set.total,
          symbol: set.images?.symbol || '',
          logo: set.images?.logo || ''
        }));

        // Salvar sets no banco
        for (const set of sets) {
          await DatabaseService.insertSet(set);
        }

        totalSets += sets.length;
        hasMore = sets.length === 250; // Se retornou menos que 250, não há mais páginas
        page++;

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Synced ${totalSets} sets`);
    } catch (error) {
      console.error('Error syncing sets:', error);
      throw error;
    }
  }

  async syncCards(): Promise<void> {
    try {
      console.log('Syncing cards...');
      
      // Primeiro, buscar apenas IDs e metadados básicos
      let page = 1;
      let hasMore = true;
      let totalCards = 0;
      const cardIds: string[] = [];

      // Fase 1: Coletar todos os IDs
      while (hasMore) {
        const response = await axios.get(`${API_BASE_URL}/cards`, {
          params: {
            page: page,
            pageSize: 250,
            select: 'id,name,set,rarity,images,cardmarket' // Apenas campos essenciais
          }
        });

        const cards = response.data.data;
        cardIds.push(...cards.map((card: any) => card.id));
        
        totalCards += cards.length;
        hasMore = cards.length === 250;
        page++;

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Found ${totalCards} cards, starting detailed sync...`);

      // Fase 2: Buscar detalhes em lotes
      const batchSize = 50; // Processar 50 cards por vez
      for (let i = 0; i < cardIds.length; i += batchSize) {
        const batch = cardIds.slice(i, i + batchSize);
        await this.syncCardBatch(batch);
        
        console.log(`Synced ${Math.min(i + batchSize, cardIds.length)}/${cardIds.length} cards`);
        
        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`Synced ${totalCards} cards`);
    } catch (error) {
      console.error('Error syncing cards:', error);
      throw error;
    }
  }

  private async syncCardBatch(cardIds: string[]): Promise<void> {
    try {
      const promises = cardIds.map(id => this.fetchCardDetails(id));
      const cards = await Promise.all(promises);
      
      // Filtrar cards válidos e salvar no banco
      const validCards = cards.filter(card => card !== null) as PokemonCard[];
      await DatabaseService.updateCardsBatch(validCards);
      
    } catch (error) {
      console.error('Error syncing card batch:', error);
      // Continuar mesmo se um lote falhar
    }
  }

  private async fetchCardDetails(cardId: string): Promise<PokemonCard | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/cards/${cardId}`);
      const data = response.data.data;

      return {
        id: data.id,
        name: data.name,
        image: data.images?.large || data.images?.small || '',
        rarity: data.rarity || 'Unknown',
        set: data.set.id,
        series: data.set.series,
        price: this.extractPrice(data.cardmarket?.prices),
        hp: this.extractHP(data.hp),
        types: this.extractTypes(data.types),
        attacks: this.extractAttacks(data.attacks),
        weaknesses: this.extractWeaknesses(data.weaknesses),
        resistances: this.extractResistances(data.resistances),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching card ${cardId}:`, error);
      return null;
    }
  }

  private extractPrice(prices: any): number {
    if (!prices) return 0;
    
    // Tentar diferentes campos de preço
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

  // Método para sincronização incremental (apenas dados novos)
  async syncIncremental(lastSync: string): Promise<void> {
    try {
      console.log('Starting incremental sync...');
      
      // Verificar se há novos sets
      const setsResponse = await axios.get(`${API_BASE_URL}/sets`, {
        params: {
          pageSize: 250,
          orderBy: 'releaseDate'
        }
      });

      // Verificar se há novos cards
      const cardsResponse = await axios.get(`${API_BASE_URL}/cards`, {
        params: {
          pageSize: 250,
          orderBy: 'updatedAt',
          select: 'id,updatedAt'
        }
      });

      // Implementar lógica para sincronizar apenas dados novos
      // baseado na data da última sincronização
      
      console.log('Incremental sync completed');
    } catch (error) {
      console.error('Error during incremental sync:', error);
      throw error;
    }
  }

  // Método para verificar se há atualizações disponíveis
  async checkForUpdates(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sets`, {
        params: {
          pageSize: 1,
          orderBy: 'releaseDate'
        }
      });

      if (response.data.data.length > 0) {
        const latestSet = response.data.data[0];
        // Verificar se já temos este set no banco
        const existingSets = await DatabaseService.getSetsBySeries(latestSet.series);
        return !existingSets.some(set => set.id === latestSet.id);
      }

      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }
}

export default new SyncService();

