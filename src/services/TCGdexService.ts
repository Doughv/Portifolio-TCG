// Importar polyfills primeiro
import '../polyfills';
import TCGdex from '@tcgdex/sdk';
import DatabaseService, { PokemonCard, PokemonSet, PokemonSeries } from './DatabaseService';
// import CacheService from './CacheService';
// import OptimizedStorageService from './OptimizedStorageService';

// Polyfills são carregados no arquivo polyfills.ts

class TCGdexService {
  private language: string;
  private baseUrl: string;
  private tcgdex: any = null;
  private lastUpdateCheck: string = '';
  
  constructor(language: string) {
    this.language = language;
    this.baseUrl = `https://api.tcgdex.net/v2/${language}`;
    
    // Inicializar SDK de forma assíncrona para evitar bloqueios
    this.initializeSDK(language);
  }

  async initializeSDK(language: string): Promise<void> {
    try {
      console.log('Tentando inicializar SDK TCGdex com idioma:', language);
      this.tcgdex = new TCGdex(language as any);
      console.log('SDK TCGdex inicializado com sucesso');
      
      // Debug detalhado do SDK
      if (this.tcgdex) {
        console.log('Propriedades do SDK:', Object.keys(this.tcgdex));
        console.log('SDK serie (singular):', !!this.tcgdex?.serie);
        console.log('SDK set:', !!this.tcgdex?.set);
        console.log('SDK card:', !!this.tcgdex?.card);
      }
      
    } catch (error) {
      console.error('Erro ao inicializar SDK TCGdex:', error);
      this.tcgdex = null;
    }
  }

  // Método para alterar idioma dinamicamente
  async setLanguage(language: string): Promise<void> {
    const previousLanguage = this.language;
    this.language = language;
    this.baseUrl = `https://api.tcgdex.net/v2/${language}`;
    
    console.log(`Alterando idioma de ${previousLanguage} para ${language}`);
    
    // Reinicializar SDK com novo idioma
    await this.initializeSDK(language);
    
      // Limpar cache do idioma anterior se necessário
      if (previousLanguage !== language) {
        console.log('Limpando cache do idioma anterior...');
        // await CacheService.clearLanguageCache(previousLanguage);
      }
  }

  // Verificar se há atualizações disponíveis na API
  async checkForUpdates(): Promise<{ hasUpdates: boolean; lastUpdate?: string; newSeries?: number; newSets?: number; newCards?: number }> {
    try {
      if (!this.tcgdex) {
        console.log('SDK não inicializado, tentando inicializar...');
        await this.initializeSDK(this.language);
      }

      if (!this.tcgdex) {
        throw new Error('Não foi possível inicializar o SDK TCGdex');
      }

      console.log('Verificando atualizações na API...');
      
      // Obter dados atuais do banco
      const dbStats = await DatabaseService.getStats();
      
      // Buscar dados da API para comparar
      const apiSeries = await this.tcgdex.serie.list();
      const apiSets = await this.tcgdex.set.list();
      const apiCards = await this.tcgdex.card.list({ limit: 1000 }); // Limitar para não sobrecarregar
      
      // Calcular diferenças
      const newSeries = Math.max(0, apiSeries.length - dbStats.series);
      const newSets = Math.max(0, apiSets.length - dbStats.sets);
      const newCards = Math.max(0, apiCards.length - dbStats.cards);
      
      const hasUpdates = newSeries > 0 || newSets > 0 || newCards > 0;
      
      console.log('Verificação de atualizações:', {
        api: { series: apiSeries.length, sets: apiSets.length, cards: apiCards.length },
        local: { series: dbStats.series, sets: dbStats.sets, cards: dbStats.cards },
        new: { series: newSeries, sets: newSets, cards: newCards },
        hasUpdates
      });
      
      return {
        hasUpdates,
        lastUpdate: apiSeries[0]?.releaseDate || apiSets[0]?.releaseDate,
        newSeries,
        newSets,
        newCards
      };
      
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return { hasUpdates: false };
    }
  }

  // Sincronizar apenas dados novos (não tudo)
  async syncUpdatesOnly(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('Iniciando sincronização de atualizações...');
      
      const updateCheck = await this.checkForUpdates();
      
      if (!updateCheck.hasUpdates) {
        return {
          success: true,
          message: 'Não há atualizações disponíveis. Todos os dados estão atualizados!',
          stats: { series: 0, sets: 0, cards: 0 }
        };
      }
      
      let stats = { series: 0, sets: 0, cards: 0 };
      
      // Sincronizar apenas séries novas se necessário
      if (updateCheck.newSeries && updateCheck.newSeries > 0) {
        console.log(`Sincronizando ${updateCheck.newSeries} séries novas...`);
        const seriesResult = await this.syncNewSeries();
        stats.series = seriesResult;
      }
      
      // Sincronizar apenas sets novos se necessário
      if (updateCheck.newSets && updateCheck.newSets > 0) {
        console.log(`Sincronizando ${updateCheck.newSets} sets novos...`);
        const setsResult = await this.syncNewSets();
        stats.sets = setsResult;
      }
      
      // Sincronizar apenas cards novos se necessário
      if (updateCheck.newCards && updateCheck.newCards > 0) {
        console.log(`Sincronizando ${updateCheck.newCards} cards novos...`);
        const cardsResult = await this.syncNewCards();
        stats.cards = cardsResult;
      }
      
      // Atualizar timestamp da última verificação
      this.lastUpdateCheck = new Date().toISOString();
      
      return {
        success: true,
        message: `Atualizações sincronizadas! ${stats.series} séries, ${stats.sets} sets e ${stats.cards} cards novos.`,
        stats
      };
      
    } catch (error: any) {
      console.error('Erro na sincronização de atualizações:', error);
      return {
        success: false,
        message: `Erro ao sincronizar atualizações: ${error.message}`,
        stats: null
      };
    }
  }

  // Sincronizar séries novas
  private async syncNewSeries(): Promise<number> {
    try {
      if (!this.tcgdex) throw new Error('SDK não inicializado');
      
      console.log('Buscando séries da API...');
      const apiSeries = await this.tcgdex.serie.list();
      
      console.log('Obtendo séries existentes do banco...');
      const dbSeries = await DatabaseService.getAllSeries();
      const existingIds = new Set(dbSeries.map(s => s.id));
      
      const newSeries = apiSeries.filter((s: any) => !existingIds.has(s.id));
      
      console.log(`Encontradas ${newSeries.length} séries novas para sincronizar`);
      
      for (const serie of newSeries) {
        await DatabaseService.insertSeries({
          id: serie.id,
          name: serie.name,
          logo: serie.logo || '',
          totalSets: 0 // Será atualizado quando sincronizarmos os sets
        });
      }
      
      console.log(`${newSeries.length} séries novas sincronizadas no banco`);
      return newSeries.length;
      
    } catch (error) {
      console.error('Erro ao sincronizar séries:', error);
      return 0;
    }
  }

  // Sincronizar sets novos
  private async syncNewSets(): Promise<number> {
    try {
      if (!this.tcgdex) throw new Error('SDK não inicializado');
      
      console.log('Buscando sets da API...');
      const apiSets = await this.tcgdex.set.list();
      
      console.log('Obtendo sets existentes do banco...');
      const dbSets = await DatabaseService.getAllSets();
      const existingIds = new Set(dbSets.map(s => s.id));
      
      const newSets = apiSets.filter((s: any) => !existingIds.has(s.id));
      
      console.log(`Encontrados ${newSets.length} sets novos para sincronizar`);
      
      for (const set of newSets) {
        await DatabaseService.insertSet({
          id: set.id,
          name: set.name,
          series: set.serie || set.series,
          releaseDate: set.releaseDate || new Date().toISOString(),
          totalCards: set.cardCount?.total || set.cardCount?.official || 0,
          symbol: set.symbol || '',
          logo: set.logo || ''
        });
      }
      
      console.log(`${newSets.length} sets novos sincronizados no banco`);
      return newSets.length;
      
    } catch (error) {
      console.error('Erro ao sincronizar sets:', error);
      return 0;
    }
  }

  // Sincronizar cards novos
  private async syncNewCards(): Promise<number> {
    try {
      if (!this.tcgdex) throw new Error('SDK não inicializado');
      
      console.log('Buscando cards da API...');
      
      // Buscar cards em lotes para não sobrecarregar
      let allCards: any[] = [];
      let page = 1;
      const pageSize = 100;
      
      while (true) {
        const cards = await this.tcgdex.card.list({ 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        });
        
        if (cards.length === 0) break;
        
        allCards.push(...cards);
        page++;
        
        // Limite de segurança para evitar loops infinitos
        if (page > 50) break; // Reduzido para não sobrecarregar
      }
      
      console.log(`Encontrados ${allCards.length} cards na API`);
      
      console.log('Obtendo cards existentes do banco...');
      const dbCards = await DatabaseService.getAllCards();
      const existingIds = new Set(dbCards.map(c => c.id));
      
      const newCards = allCards.filter(c => !existingIds.has(c.id));
      
      console.log(`Encontrados ${newCards.length} cards novos para sincronizar`);
      
      // Processar em lotes para não sobrecarregar o banco
      const batchSize = 50;
      for (let i = 0; i < newCards.length; i += batchSize) {
        const batch = newCards.slice(i, i + batchSize);
        await this.processCardBatch(batch);
        
        console.log(`Processados ${Math.min(i + batchSize, newCards.length)}/${newCards.length} cards novos`);
      }
      
      console.log(`${newCards.length} cards novos sincronizados no banco`);
      return newCards.length;
      
    } catch (error) {
      console.error('Erro ao sincronizar cards:', error);
      return 0;
    }
  }

  // Processar lote de cards
  private async processCardBatch(cards: any[]): Promise<void> {
    const processedCards: PokemonCard[] = cards.map(card => ({
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

  // Migrar dados dos JSONs para o banco (atalho inicial)
  async migrateFromJSONs(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('Iniciando migração dos JSONs para o banco...');
      
      // Implementação direta da migração
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
              totalSets: 0
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
            // Inferir série baseada no ID do set se não tiver definida
            let seriesId = set.series;
            if (!seriesId || seriesId === 'base') {
              seriesId = this.inferSeriesFromSetId(set.id);
            }
            
            await DatabaseService.insertSet({
              id: set.id,
              name: set.name,
              series: seriesId,
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

      } catch (error: any) {
        console.error('Erro ao carregar JSONs:', error);
        return {
          success: false,
          message: `Erro ao carregar JSONs: ${error.message}`,
          stats: null
        };
      }
      
    } catch (error: any) {
      console.error('Erro na migração dos JSONs:', error);
      return {
        success: false,
        message: `Erro na migração: ${error.message}`,
        stats: null
      };
    }
  }

  // Obter idioma atual
  getCurrentLanguage(): string {
    return this.language;
  }

  // Obter detalhes completos de uma carta via SDK
  async getCardDetailsFromAPI(cardId: string): Promise<any> {
    try {
      if (!this.tcgdex) {
        console.log('SDK não inicializado, tentando inicializar...');
        await this.initializeSDK(this.language);
      }

      if (!this.tcgdex || !this.tcgdex.card) {
        throw new Error('SDK de cards não disponível');
      }

      console.log(`Buscando detalhes da carta ${cardId} na API...`);
      const cardDetails = await this.tcgdex.card.fetch(cardId);
      
      if (cardDetails) {
        console.log(`Detalhes da carta ${cardId} obtidos da API`);
        return cardDetails;
      } else {
        throw new Error('Carta não encontrada na API');
      }
    } catch (error: any) {
      console.error(`Erro ao buscar detalhes da carta ${cardId}:`, error);
      throw error;
    }
  }

  // Obter detalhes completos de um set via SDK
  async getSetDetailsFromAPI(setId: string): Promise<any> {
    try {
      if (!this.tcgdex) {
        console.log('SDK não inicializado, tentando inicializar...');
        await this.initializeSDK(this.language);
      }

      if (!this.tcgdex || !this.tcgdex.set) {
        throw new Error('SDK de sets não disponível');
      }

      console.log(`Buscando detalhes do set ${setId} na API...`);
      const setDetails = await this.tcgdex.set.fetch(setId);
      
      if (setDetails) {
        console.log(`Detalhes do set ${setId} obtidos da API`);
        return setDetails;
      } else {
        throw new Error('Set não encontrado na API');
      }
    } catch (error: any) {
      console.error(`Erro ao buscar detalhes do set ${setId}:`, error);
      throw error;
    }
  }

  // Obter estatísticas DO BANCO DE DADOS (não da API)
  async getStats(): Promise<any> {
    try {
      console.log('Obtendo estatísticas do banco de dados...');
      return await DatabaseService.getStats();
    } catch (error: any) {
      console.error('Erro ao obter estatísticas do banco:', error);
      return { series: 0, sets: 0, cards: 0 };
    }
  }

  // Obter séries da API/SDK (como no projeto antigo)
  async getSeries(): Promise<PokemonSeries[]> {
    try {
      console.log('Buscando séries via SDK...');
      
      if (this.tcgdex && this.tcgdex.serie && typeof this.tcgdex.serie.list === 'function') {
        const allSeries = await this.tcgdex.serie.list();
        console.log(`Séries encontradas via SDK: ${allSeries.length}`);
        
        // Converter para o formato esperado
        return allSeries.map((serie: any) => ({
          id: serie.id,
          name: serie.name,
          logo: serie.logo || '',
          totalSets: serie.totalSets || 0
        }));
      } else {
        console.error('SDK não inicializado ou método serie.list não disponível');
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar séries via SDK:', error);
      return [];
    }
  }

  // Obter sets por série (banco primeiro, depois SDK)
  async getSetsBySeries(seriesId: string): Promise<PokemonSet[]> {
    try {
      console.log(`Obtendo sets da série ${seriesId}...`);
      
      // Tentar buscar do banco primeiro (direto, sem filtros)
      const dbSets = await DatabaseService.getSetsBySeries(seriesId);
      console.log(`DatabaseService retornou ${dbSets.length} sets para ${seriesId}`);
      
      if (dbSets.length > 0) {
        console.log(`✅ ${dbSets.length} sets encontrados no banco`);
        return dbSets;
      }
      
      // Se não há no banco, buscar via SDK
      console.log('Nenhum set no banco, tentando SDK...');
      if (this.tcgdex && this.tcgdex.serie && typeof this.tcgdex.serie.get === 'function') {
        console.log('Buscando sets via SDK...');
        const serie = await this.tcgdex.serie.get(seriesId);
        if (serie && serie.sets) {
          const sets = serie.sets.map((set: any) => ({
            id: set.id,
            name: set.name,
            series: set.serie?.id || seriesId,
            releaseDate: set.releaseDate || '',
            totalCards: set.totalCards || 0,
            symbol: set.symbol || '',
            logo: set.logo || ''
          }));
          console.log(`✅ ${sets.length} sets encontrados via SDK`);
          return sets;
        }
      }
      
      console.log(`❌ Nenhum set encontrado para ${seriesId}`);
      return [];
    } catch (error) {
      console.error(`❌ Erro ao obter sets da série ${seriesId}:`, error);
      return [];
    }
  }

  // Obter cards por set FILTRADOS DO BANCO DE DADOS
  async getCardsBySet(setId: string): Promise<PokemonCard[]> {
    try {
      console.log(`Obtendo cards filtrados do set ${setId} do banco de dados...`);
      const FilterService = (await import('./FilterService')).default;
      return await FilterService.getFilteredCardsBySet(setId);
    } catch (error) {
      console.error('Erro ao obter cards filtrados do banco:', error);
      return [];
    }
  }

  // Inferir série baseada no ID do set
  private inferSeriesFromSetId(setId: string): string {
    // Lógica para inferir série baseada no ID do set
    
    // Séries principais
    if (setId.startsWith('base')) return 'base';
    if (setId.startsWith('ex')) return 'ex';
    if (setId.startsWith('dp')) return 'dp';
    if (setId.startsWith('pl')) return 'pl';
    if (setId.startsWith('hgss')) return 'hgss';
    if (setId.startsWith('bw')) return 'bw';
    if (setId.startsWith('xy')) return 'xy';
    if (setId.startsWith('sm')) return 'sm';
    if (setId.startsWith('swsh')) return 'swsh';
    if (setId.startsWith('sv')) return 'sv';
    
    // Sets especiais - inferir baseado no contexto correto
    if (setId.startsWith('col')) return 'col';  // Chamado das Lendas
    if (setId.startsWith('dv')) return 'bw';   // Cofre do Dragão (Black & White)
    if (setId.startsWith('dc')) return 'base'; // Desafio dos Campeões (Base)
    if (setId.startsWith('g')) return 'base';  // Gym (Base)
    if (setId.startsWith('det')) return 'sm';  // Detective Pikachu (Sol e Lua)
    if (setId.startsWith('cel')) return 'sm';  // Celestial Storm (Sol e Lua)
    if (setId.startsWith('A')) return 'tcgp';  // Sets especiais (Pokémon Estampas Ilustradas Pocket)
    if (setId.startsWith('P-')) return 'base'; // Sets promocionais (Base)
    
    // Se não conseguir inferir, usar 'base' como padrão (silencioso)
    return 'base';
  }

  // Buscar cards DO BANCO DE DADOS (não da API)
  async searchCards(query: string): Promise<PokemonCard[]> {
    try {
      console.log(`Buscando cards "${query}" no banco de dados...`);
      return await DatabaseService.searchCards(query);
    } catch (error) {
      console.error('Erro na busca no banco:', error);
      return [];
    }
  }
}

export default new TCGdexService('pt');
