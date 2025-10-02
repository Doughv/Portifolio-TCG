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

  // Verificar se os JSONs locais foram atualizados e precisam ser migrados
  async checkIfJSONsNeedUpdate(): Promise<{ shouldUpdate: boolean; reason?: string; currentStats?: any; newStats?: any }> {
    try {
      console.log('🔍 Verificando se JSONs precisam ser atualizados...');
      
      // 1. Obter estatísticas atuais do banco
      const currentDbStats = await DatabaseService.getStats();
      console.log('📊 Dados atuais no banco:', currentDbStats);
      
      // 2. Obter estatísticas dos JSONs
      const statsData = require('../data/stats.json');
      const jsonStats = {
        series: statsData.series || 0,
        sets: statsData.sets || 0,
        cards: statsData.cards || 0,
        processedAt: statsData.processedAt
      };
      console.log('📦 Dados nos JSONs:', jsonStats);
      
      // 3. Verificar se é primeira instalação
      if (currentDbStats.series === 0 && currentDbStats.sets === 0 && currentDbStats.cards === 0) {
        return {
          shouldUpdate: true,
          reason: 'Primeira instalação - banco vazio',
          currentStats: currentDbStats,
          newStats: jsonStats
        };
      }
      
      // 4. Comparar quantidade de dados (principal indicador de atualização)
      const hasMoreSeries = jsonStats.series > currentDbStats.series;
      const hasMoreSets = jsonStats.sets > currentDbStats.sets;
      const hasMoreCards = jsonStats.cards > currentDbStats.cards;
      
      if (hasMoreSeries || hasMoreSets || hasMoreCards) {
        const changes = [];
        if (hasMoreSeries) changes.push(`+${jsonStats.series - currentDbStats.series} séries`);
        if (hasMoreSets) changes.push(`+${jsonStats.sets - currentDbStats.sets} sets`);
        if (hasMoreCards) changes.push(`+${jsonStats.cards - currentDbStats.cards} cartas`);
        
        return {
          shouldUpdate: true,
          reason: `Novos dados detectados: ${changes.join(', ')}`,
          currentStats: currentDbStats,
          newStats: jsonStats
        };
      }
      
      // 5. Verificar se a data de processamento é mais recente (para atualizações de dados existentes)
      const currentProcessedAt = await DatabaseService.getDataProcessedAt();
      if (currentProcessedAt && jsonStats.processedAt && new Date(jsonStats.processedAt) > new Date(currentProcessedAt)) {
        return {
          shouldUpdate: true,
          reason: `Dados reprocessados em ${jsonStats.processedAt}`,
          currentStats: currentDbStats,
          newStats: jsonStats
        };
      }
      
      console.log('✅ Dados estão atualizados');
      return {
        shouldUpdate: false,
        reason: 'Dados já estão atualizados',
        currentStats: currentDbStats,
        newStats: jsonStats
      };
      
    } catch (error) {
      console.error('❌ Erro ao verificar JSONs:', error);
      // Em caso de erro, não atualizar para evitar problemas
      return {
        shouldUpdate: false,
        reason: `Erro na verificação: ${error}`
      };
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

  // Baixar dados completos da API e salvar em JSON temporário
  async downloadAPIDataToTemp(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('🔄 Baixando dados completos da API...');
      
      if (!this.tcgdex) {
        console.log('SDK não inicializado, tentando inicializar...');
        await this.initializeSDK(this.language);
      }

      if (!this.tcgdex) {
        throw new Error('Não foi possível inicializar o SDK TCGdex');
      }

      // 1. Baixar séries
      console.log('📚 Baixando séries...');
      const apiSeries = await this.tcgdex.serie.list();
      
      // 2. Baixar sets
      console.log('📦 Baixando sets...');
      const apiSets = await this.tcgdex.set.list();
      
      // 3. Baixar cards (em lotes para não sobrecarregar)
      console.log('🃏 Baixando cards...');
      let allCards: any[] = [];
      let page = 1;
      const pageSize = 1000;
      
      while (true) {
        const cards = await this.tcgdex.card.list({ 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        });
        
        if (cards.length === 0) break;
        
        allCards.push(...cards);
        page++;
        
        console.log(`📄 Página ${page}: ${cards.length} cards baixados (Total: ${allCards.length})`);
        
        // Limite de segurança
        if (page > 50) break;
      }

      // 4. Salvar em arquivos temporários
      const tempPath = '/tmp/pokemon_api_data';
      const fs = require('fs');
      const path = require('path');
      
      // Criar diretório temporário
      if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath, { recursive: true });
      }

      // Salvar séries
      fs.writeFileSync(
        path.join(tempPath, 'pokemon_series.json'),
        JSON.stringify(apiSeries, null, 2)
      );

      // Salvar sets
      fs.writeFileSync(
        path.join(tempPath, 'pokemon_sets.json'),
        JSON.stringify(apiSets, null, 2)
      );

      // Salvar cards
      fs.writeFileSync(
        path.join(tempPath, 'pokemon_cards_detailed.json'),
        JSON.stringify(allCards, null, 2)
      );

      const stats = {
        series: apiSeries.length,
        sets: apiSets.length,
        cards: allCards.length
      };

      console.log('✅ Dados da API salvos em arquivos temporários:', stats);

      return {
        success: true,
        message: `Dados baixados com sucesso! ${stats.series} séries, ${stats.sets} sets e ${stats.cards} cards.`,
        stats
      };

    } catch (error: any) {
      console.error('❌ Erro ao baixar dados da API:', error);
      return {
        success: false,
        message: `Erro ao baixar dados: ${error.message}`,
        stats: null
      };
    }
  }

  // Estratégia híbrida inteligente: Sincronização incremental + cache de imagens
  async syncIntelligent(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('🧠 Iniciando sincronização inteligente...');
      
      // Garantir que o banco esteja inicializado
      await DatabaseService.initialize();
      
      if (!this.tcgdex) {
        await this.initializeSDK(this.language);
      }

      if (!this.tcgdex) {
        throw new Error('SDK não inicializado');
      }

      let stats = { series: 0, sets: 0, cards: 0 };

      // 1. Verificar se há dados no banco
      const dbStats = await DatabaseService.getStats();
      console.log('📊 Estatísticas do banco:', dbStats);
      
      if (dbStats.series === 0 && dbStats.sets === 0 && dbStats.cards === 0) {
        console.log('📥 Banco vazio, migração inicial dos JSONs...');
        return await this.migrateFromJSONs();
      }

      console.log('🔄 Banco tem dados, iniciando sincronização incremental...');

      // 2. Sincronização incremental de séries
      console.log('📚 Verificando séries novas...');
      const apiSeries = await this.tcgdex.serie.list();
      const dbSeries = await DatabaseService.getAllSeries();
      const existingSeriesIds = new Set(dbSeries.map(s => s.id));
      
      const newSeries = apiSeries.filter((s: any) => !existingSeriesIds.has(s.id));
      
      for (const serie of newSeries) {
        await DatabaseService.insertSeries({
          id: serie.id,
          name: serie.name,
          logo: serie.logo || '',
          totalSets: 0 // Será atualizado quando sincronizarmos os sets
        });
        stats.series++;
      }

      // 3. Sincronização incremental de sets
      console.log('📦 Verificando sets novos...');
      const apiSets = await this.tcgdex.set.list();
      const dbSets = await DatabaseService.getAllSets();
      const existingSetIds = new Set(dbSets.map(s => s.id));
      
      const newSets = apiSets.filter((s: any) => !existingSetIds.has(s.id));
      
      for (const set of newSets) {
        let seriesId = set.serie || set.series;
        if (!seriesId) {
          seriesId = this.inferSeriesFromSetId(set.id);
        }
        
        await DatabaseService.insertSet({
          id: set.id,
          name: set.name,
          series: seriesId,
          releaseDate: set.releaseDate || new Date().toISOString(),
          totalCards: set.cardCount?.total || set.cardCount?.official || 0,
          symbol: set.symbol || '',
          logo: set.logo || ''
        });
        stats.sets++;
      }

      // 4. Sincronização incremental de cards (apenas novos)
      console.log('🃏 Verificando cards novos...');
      const dbCards = await DatabaseService.getAllCards();
      const existingCardIds = new Set(dbCards.map(c => c.id));
      
      console.log(`🔍 Debug: Total de cards no banco: ${dbCards.length}`);
      console.log(`🔍 Debug: Primeiros 5 IDs do banco:`, Array.from(existingCardIds).slice(0, 5));
      
      // Buscar cards em lotes menores para não sobrecarregar
      let allNewCards: any[] = [];
      let page = 1;
      const pageSize = 500;
      
      while (allNewCards.length < 1000) { // Limite de segurança
        const cards = await this.tcgdex.card.list({ 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        });
        
        if (cards.length === 0) break;
        
        console.log(`🔍 Debug: Lote ${page} da API: ${cards.length} cards`);
        console.log(`🔍 Debug: Primeiros 5 IDs da API:`, cards.slice(0, 5).map(c => c.id));
        
        const newCards = cards.filter((c: any) => !existingCardIds.has(c.id));
        allNewCards.push(...newCards);
        
        console.log(`🔍 Debug: Cards novos neste lote: ${newCards.length}`);
        if (newCards.length > 0) {
          console.log(`🔍 Debug: Primeiros 3 cards novos:`, newCards.slice(0, 3).map(c => `${c.name} (${c.id})`));
        }
        
        if (newCards.length === 0) break; // Não há mais cards novos
        
        page++;
        console.log(`📄 Lote ${page}: ${newCards.length} cartas novas encontradas`);
        console.log(`📊 Total acumulado: ${allNewCards.length} cartas`);
      }

      // Processar cards novos em lotes
      if (allNewCards.length > 0) {
        console.log(`🃏 Processando ${allNewCards.length} cartas em lotes...`);
        console.log(`🔍 Primeiras 5 cartas encontradas:`);
        allNewCards.slice(0, 5).forEach((card, index) => {
          console.log(`  ${index + 1}. ${card.name} (${card.id})`);
        });
        
        const batchSize = 100;
        for (let i = 0; i < allNewCards.length; i += batchSize) {
          const batch = allNewCards.slice(i, i + batchSize);
          const batchNumber = Math.floor(i / batchSize) + 1;
          console.log(`📦 Lote ${batchNumber}: Processando ${batch.length} cartas...`);
          
          // Mostrar algumas cartas do lote
          batch.slice(0, 3).forEach((card, index) => {
            console.log(`  ${index + 1}. ${card.name} - Coletada!`);
          });
          if (batch.length > 3) {
            console.log(`  ... e mais ${batch.length - 3} cartas`);
          }
          
          await this.processCardBatch(batch);
          stats.cards += batch.length;
          console.log(`✅ Lote ${batchNumber} concluído!`);
        }
        console.log(`🎉 ${stats.cards} cartas coletadas e armazenadas no Portfólio TCG!`);
      } else {
        console.log('✅ Nenhuma carta nova encontrada para sincronizar');
      }

      // 5. Atualizar totalSets das séries após sincronização
      console.log('🔄 Atualizando contadores de sets por série...');
      const allSeries = await DatabaseService.getAllSeries();
      for (const series of allSeries) {
        const seriesSets = await DatabaseService.getSetsBySeries(series.id);
        await DatabaseService.insertSeries({
          id: series.id,
          name: series.name,
          logo: series.logo,
          totalSets: seriesSets.length
        });
      }

      console.log('✅ Sincronização inteligente concluída:', stats);

      return {
        success: true,
        message: `Sincronização concluída! ${stats.series} séries, ${stats.sets} sets e ${stats.cards} cards novos.`,
        stats
      };

    } catch (error: any) {
      console.error('❌ Erro na sincronização inteligente:', error);
      return {
        success: false,
        message: `Erro na sincronização: ${error.message}`,
        stats: null
      };
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
        // Garantir que sempre temos uma série válida
        let seriesId = set.serie || set.series;
        if (!seriesId) {
          seriesId = this.inferSeriesFromSetId(set.id);
          console.log(`⚠️ Série não definida para set ${set.id}, inferindo: ${seriesId}`);
        }
        
        await DatabaseService.insertSet({
          id: set.id,
          name: set.name,
          series: seriesId,
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
    // Garantir que o banco esteja inicializado
    await DatabaseService.initialize();
    
    const processedCards: PokemonCard[] = cards.map(card => {
      // Garantir que sempre temos set e série válidos
      let setId = card.set?.id || 'Unknown';
      let seriesId = card.set?.serie || card.set?.series || 'Unknown';
      
      // Se não tem set definido, tentar inferir do ID do card
      if (setId === 'Unknown' && card.id) {
        const parts = card.id.split('-');
        if (parts.length >= 2) {
          setId = parts[0]; // bw1, base1, etc.
        }
      }
      
      // Se não tem série definida, inferir do set
      if (seriesId === 'Unknown' && setId !== 'Unknown') {
        seriesId = this.inferSeriesFromSetId(setId);
      }
      
      // Garantir que sempre temos uma série válida
      if (!seriesId || seriesId === 'Unknown') {
        seriesId = this.inferSeriesFromSetId(setId) || 'unknown';
      }
      
      // Garantir que sempre temos um set válido
      if (!setId || setId === 'Unknown') {
        setId = 'unknown';
      }
      
      // Debug: verificar se ainda há problemas
      if (!seriesId || !setId) {
        console.error(`❌ Erro na carta ${card.id}: setId=${setId}, seriesId=${seriesId}`);
        console.error(`❌ Card data:`, JSON.stringify(card, null, 2));
      }
      
      return {
        id: card.id,
        name: card.name,
        image: card.image || card.images?.large || card.images?.small || '',
        rarity: card.rarity || 'Unknown',
        set: setId,
        series: seriesId,
        price: this.extractPrice(card.cardmarket?.prices),
        localId: card.localId || this.extractLocalId(card.id),
        hp: this.extractHP(card.hp),
        types: this.extractTypes(card.types),
        attacks: this.extractAttacks(card.attacks),
        weaknesses: this.extractWeaknesses(card.weaknesses),
        resistances: this.extractResistances(card.resistances),
        // Novos campos expandidos
        category: card.category || null,
        illustrator: card.illustrator || null,
        dexId: card.dexId || null,
        stage: card.stage || null,
        retreat: card.retreat || null,
        legal: card.legal || null,
        variants: card.variants || null,
        variantsDetailed: card.variants_detailed || null,
        updated: card.updated || null,
        lastUpdated: new Date().toISOString()
      };
    });
    
    await DatabaseService.updateCardsBatch(processedCards);
  }

  // Extrair localId do ID da carta (ex: "bw1-1" -> "001", "base1-25" -> "025")
  private extractLocalId(cardId: string): string | null {
    if (!cardId) return null;
    
    const parts = cardId.split('-');
    if (parts.length >= 2) {
      const localId = parts[parts.length - 1]; // Pega a última parte
      // Verificar se é um número válido
      if (/^\d+$/.test(localId)) {
        // Formatar como número de 3 dígitos (001, 025, 100)
        return localId.padStart(3, '0');
      }
    }
    
    return null;
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

  // Executar script de população com dados da API
  async runPopulateScriptWithAPIData(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('🔄 Executando script de população com dados da API...');
      
      // 1. Baixar dados da API
      const downloadResult = await this.downloadAPIDataToTemp();
      if (!downloadResult.success) {
        return downloadResult;
      }

      // 2. Executar script de população
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      console.log('📝 Executando script de população...');
      const { stdout, stderr } = await execAsync('cd /home/douglasdsouza/ProjetosCursor/Portifolio-TCG && npm run populate-db');
      
      if (stderr) {
        console.warn('⚠️ Warnings do script:', stderr);
      }
      
      console.log('✅ Script executado:', stdout);

      // 3. Migrar para o banco
      console.log('💾 Migrando para o banco...');
      const migrationResult = await this.migrateFromJSONs();

      return {
        success: migrationResult.success,
        message: `Sincronização completa! ${downloadResult.message} ${migrationResult.message}`,
        stats: migrationResult.stats
      };

    } catch (error: any) {
      console.error('❌ Erro na sincronização completa:', error);
      return {
        success: false,
        message: `Erro na sincronização: ${error.message}`,
        stats: null
      };
    }
  }

  // Migrar dados dos JSONs para o banco (atalho inicial)
  async migrateFromJSONs(): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('Iniciando migração incremental dos JSONs para o banco...');
      
      // Implementação direta da migração
      let stats = {
        series: 0,
        sets: 0,
        cards: 0,
        errors: 0,
        updated: 0
      };

      // Obter estatísticas atuais para comparação
      const existingStats = await DatabaseService.getStats();
      console.log(`📊 Banco atual: ${existingStats.series} séries, ${existingStats.sets} sets, ${existingStats.cards} cards`);

      // Importar dados dos JSONs originais
      try {
        const seriesData = require('../../assets/data/pokemon_series.json');
        const setsData = require('../../assets/data/pokemon_sets.json');
        const cardsData = require('../../assets/data/pokemon_cards_detailed.json');

        // 1. Migrar séries (incremental)
        console.log('Migrando séries...');
        const existingSeries = await DatabaseService.getAllSeries();
        const existingSeriesIds = new Set(existingSeries.map(s => s.id));
        
        for (const series of seriesData) {
          try {
            // Calcular total de sets para esta série
            const seriesSets = setsData.filter((set: any) => {
              const inferredSeries = this.inferSeriesFromSetId(set.id);
              return inferredSeries === series.id;
            });
            
            const isNew = !existingSeriesIds.has(series.id);
            await DatabaseService.insertSeries({
              id: series.id,
              name: series.name,
              logo: series.logo || '',
              totalSets: seriesSets.length
            });
            
            if (isNew) {
              stats.series++;
              console.log(`✅ Nova série: ${series.name}`);
            } else {
              stats.updated++;
              console.log(`🔄 Atualizada série: ${series.name}`);
            }
          } catch (error) {
            console.error('Erro ao inserir série:', series.id, error);
            stats.errors++;
          }
        }

        // 2. Migrar sets (incremental)
        console.log('Migrando sets...');
        const existingSets = await DatabaseService.getAllSets();
        const existingSetIds = new Set(existingSets.map(s => s.id));
        
        for (const set of setsData) {
          try {
            // Inferir série baseada no ID do set se não tiver definida
            let seriesId = set.series;
            if (!seriesId || seriesId === 'base') {
              seriesId = this.inferSeriesFromSetId(set.id);
            }
            
            const isNew = !existingSetIds.has(set.id);
            await DatabaseService.insertSet({
              id: set.id,
              name: set.name,
              series: seriesId,
              releaseDate: set.releaseDate,
              totalCards: set.totalCards,
              symbol: set.symbol,
              logo: set.logo
            });
            
            if (isNew) {
              stats.sets++;
              console.log(`✅ Novo set: ${set.name}`);
            } else {
              stats.updated++;
              console.log(`🔄 Atualizado set: ${set.name}`);
            }
          } catch (error) {
            console.error('Erro ao inserir set:', set.id, error);
            stats.errors++;
          }
        }

        // 3. Migrar cards (incremental)
        console.log('Migrando cards...');
        const existingCards = await DatabaseService.getAllCards();
        const existingCardIds = new Set(existingCards.map(c => c.id));
        console.log(`📊 Cartas existentes no banco: ${existingCardIds.size}`);
        
        const batchSize = 100;
        let newCards = 0;
        let updatedCards = 0;
        
        for (let i = 0; i < cardsData.length; i += batchSize) {
          const batch = cardsData.slice(i, i + batchSize);
          try {
            // Processar cada card individualmente para garantir dados válidos
            const processedBatch = batch.map(card => {
              // Garantir que sempre temos set e série válidos
              let setId = card.set?.id || 'unknown';
              let seriesId = card.set?.serie || card.set?.series || 'unknown';
              
              // Se não tem set definido, tentar inferir do ID do card
              if (setId === 'unknown' && card.id) {
                const parts = card.id.split('-');
                if (parts.length >= 2) {
                  setId = parts[0]; // bw1, base1, etc.
                }
              }
              
              // Se não tem série definida, inferir do set
              if (seriesId === 'unknown' && setId !== 'unknown') {
                seriesId = this.inferSeriesFromSetId(setId) || 'unknown';
              }
              
              // Garantir que sempre temos uma série válida
              if (!seriesId || seriesId === 'unknown') {
                seriesId = this.inferSeriesFromSetId(setId) || 'unknown';
              }
              
              // Garantir que sempre temos um set válido
              if (!setId || setId === 'unknown') {
                setId = 'unknown';
              }
              
              return {
                ...card,
                set: setId,
                series: seriesId,
                localId: card.localId || this.extractLocalId(card.id)
              };
            });
            
            // Contar novas vs atualizadas
            for (const card of processedBatch) {
              if (existingCardIds.has(card.id)) {
                updatedCards++;
              } else {
                newCards++;
              }
            }
            
            await DatabaseService.updateCardsBatch(processedBatch);
            stats.cards += batch.length;
            
            if (stats.cards % 1000 === 0) {
              console.log(`Cards processados: ${stats.cards}/${cardsData.length} (Novos: ${newCards}, Atualizados: ${updatedCards})`);
            }
          } catch (error) {
            console.error('Erro ao inserir lote de cards:', error);
            stats.errors++;
          }
        }

        console.log('Migração incremental dos JSONs concluída:', stats);

        // Salvar estatísticas e data de processamento após migração bem-sucedida
        try {
          const statsData = require('../data/stats.json');
          await DatabaseService.saveDataStats(statsData);
          console.log('✅ Estatísticas dos dados salvas:', {
            series: statsData.series,
            sets: statsData.sets,
            cards: statsData.cards,
            processedAt: statsData.processedAt
          });
        } catch (error) {
          console.error('❌ Erro ao salvar estatísticas dos dados:', error);
        }

        return {
          success: true,
          message: `Migração incremental concluída! ${stats.series} séries novas, ${stats.sets} sets novos, ${stats.cards} cards processados (${newCards} novos, ${updatedCards} atualizados). ${stats.errors} erros.`,
          stats: {
            ...stats,
            newCards,
            updatedCards
          }
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
    if (setId.startsWith('me')) return 'me';   // Sets especiais (Mega Evolution, etc.)
    
    // Se não conseguir inferir, usar 'base' como padrão (silencioso)
    console.warn(`⚠️ Não foi possível inferir série para o set ${setId}, usando 'base' como padrão`);
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

  // Baixar detalhes das cartas que não têm informações completas
  async downloadCardDetails(setId?: string): Promise<{ success: boolean; message: string; stats: any }> {
    try {
      console.log('🔄 Iniciando download de detalhes das cartas...');
      
      // Garantir que o banco esteja inicializado
      await DatabaseService.initialize();
      
      if (!this.tcgdex) {
        await this.initializeSDK(this.language);
      }

      if (!this.tcgdex) {
        throw new Error('SDK não inicializado');
      }

      // Obter cartas do banco que precisam de detalhes
      let cardsToUpdate: PokemonCard[];
      if (setId) {
        cardsToUpdate = await DatabaseService.getCardsBySet(setId);
      } else {
        cardsToUpdate = await DatabaseService.getAllCards();
      }

      // Filtrar cartas que não têm detalhes completos
      const cardsNeedingDetails = cardsToUpdate.filter(card => {
        // Campos obrigatórios para todas as cartas
        const missingBasicFields = !card.category || !card.rarity || !card.image;
        
        // HP é obrigatório apenas para Pokémon (category === "Pokemon")
        const isPokemon = card.category === 'Pokemon';
        const missingHp = isPokemon && !card.hp;
        
        return missingBasicFields || missingHp;
      });

      console.log(`🔍 Total de cartas no banco: ${cardsToUpdate.length}`);
      console.log(`📥 Cartas que precisam de detalhes: ${cardsNeedingDetails.length}`);
      
      if (cardsNeedingDetails.length === 0) {
        console.log('✅ Todas as cartas já têm detalhes completos!');
        return {
          success: true,
          message: 'Todas as cartas já têm detalhes completos',
          stats: { updated: 0, total: cardsToUpdate.length }
        };
      }

      let updated = 0;
      let errors = 0;

      // Processar cartas em lotes para não sobrecarregar
      const batchSize = 10;
      for (let i = 0; i < cardsNeedingDetails.length; i += batchSize) {
        const batch = cardsNeedingDetails.slice(i, i + batchSize);
        
        console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(cardsNeedingDetails.length/batchSize)}`);
        console.log(`🔍 Cartas no lote: ${batch.map(c => c.name).join(', ')}`);
        
        await Promise.all(batch.map(async (card) => {
          try {
            console.log(`  🔍 Buscando detalhes: ${card.name} (${card.id})`);
            // Buscar detalhes completos da carta usando SDK
            const cardDetails = await this.tcgdex.card.get(card.id);
            
            // Atualizar carta no banco com detalhes completos
            await DatabaseService.insertCard({
              id: cardDetails.id,
              name: cardDetails.name,
              set: cardDetails.set?.id || card.set,
              series: cardDetails.set?.series || card.series,
              image: cardDetails.image || card.image,
              rarity: cardDetails.rarity || card.rarity,
              types: cardDetails.types || card.types,
              hp: cardDetails.hp || card.hp,
              attacks: cardDetails.attacks || card.attacks,
              weaknesses: cardDetails.weaknesses || card.weaknesses,
              resistances: cardDetails.resistances || card.resistances,
              price: cardDetails.price || card.price,
              lastUpdated: new Date().toISOString()
            });
            
            updated++;
            console.log(`✅ Detalhes atualizados: ${cardDetails.name}`);
            
          } catch (error) {
            console.error(`❌ Erro ao atualizar ${card.name}:`, error);
            errors++;
          }
        }));

        // Pequena pausa entre lotes para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Download de detalhes concluído: ${updated} atualizadas, ${errors} erros`);

      return {
        success: true,
        message: `Detalhes atualizados! ${updated} cartas atualizadas, ${errors} erros`,
        stats: { updated, errors, total: cardsNeedingDetails.length }
      };

    } catch (error: any) {
      console.error('❌ Erro no download de detalhes:', error);
      return {
        success: false,
        message: `Erro no download: ${error.message}`,
        stats: { updated: 0, errors: 1, total: 0 }
      };
    }
  }

  /**
   * Limpar banco de dados
   */
  async clearDatabase(): Promise<void> {
    try {
      console.log('🗑️ Limpando banco de dados...');
      
      // Garantir que o banco esteja inicializado
      await DatabaseService.initialize();
      
      await DatabaseService.clearAllData();
      
      console.log('✅ Banco de dados limpo com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao limpar banco:', error);
      throw error;
    }
  }

  /**
   * Função para investigar a estrutura do banco e campos das cartas
   */
  async investigateDatabaseStructure(): Promise<{
    success: boolean;
    message: string;
    investigation: {
      tableStructure: any;
      sampleCards: any[];
      fieldAnalysis: any;
    };
  }> {
    try {
      await DatabaseService.initialize();
      
      const investigation = {
        tableStructure: {},
        sampleCards: [] as any[],
        fieldAnalysis: {
          totalCards: 0,
          cardsWithTypes: 0,
          cardsWithRarity: 0,
          cardsWithHp: 0,
          cardsWithImage: 0,
          cardsWithLocalId: 0,
          cardsMissingFields: [] as any[]
        }
      };

      console.log('🔍 === INVESTIGAÇÃO DA ESTRUTURA DO BANCO ===');

      // 1. Verificar estrutura da tabela cards
      console.log('📋 Verificando estrutura da tabela cards...');
      try {
        const result = await DatabaseService.getTableStructure('cards');
        investigation.tableStructure = result;
        console.log('📋 Estrutura da tabela cards:', result);
      } catch (error) {
        console.log('❌ Erro ao verificar estrutura:', error);
        investigation.tableStructure = [];
      }

      // 2. Pegar algumas cartas de exemplo
      console.log('🃏 Coletando cartas de exemplo...');
      const sampleCards = await DatabaseService.getSampleCards(5);
      investigation.sampleCards = sampleCards;
      console.log('🃏 Cartas de exemplo:', sampleCards);

      // 3. Análise detalhada dos campos
      console.log('📊 Analisando campos das cartas...');
      const allCards = await DatabaseService.getAllCards();
      investigation.fieldAnalysis.totalCards = allCards.length;

      // Contar cartas com cada campo preenchido
      allCards.forEach(card => {
        if (card.types) investigation.fieldAnalysis.cardsWithTypes++;
        if (card.rarity) investigation.fieldAnalysis.cardsWithRarity++;
        if (card.hp) investigation.fieldAnalysis.cardsWithHp++;
        if (card.image) investigation.fieldAnalysis.cardsWithImage++;
        if (card.localId) investigation.fieldAnalysis.cardsWithLocalId++;
        
        // Identificar cartas com campos faltando (lógica corrigida)
        const missingFields = [];
        if (!card.category) missingFields.push('category');
        if (!card.rarity) missingFields.push('rarity');
        if (!card.image) missingFields.push('image');
        
        // HP é obrigatório apenas para Pokémon (category === "Pokemon")
        const isPokemon = card.category === 'Pokemon';
        if (isPokemon && !card.hp) missingFields.push('hp');
        
        if (missingFields.length > 0) {
          investigation.fieldAnalysis.cardsMissingFields.push({
            name: card.name,
            id: card.id,
            missingFields: missingFields
          });
        }
      });

      console.log('📊 Análise dos campos:');
      console.log(`  Total de cartas: ${investigation.fieldAnalysis.totalCards}`);
      console.log(`  Com types: ${investigation.fieldAnalysis.cardsWithTypes}`);
      console.log(`  Com rarity: ${investigation.fieldAnalysis.cardsWithRarity}`);
      console.log(`  Com hp: ${investigation.fieldAnalysis.cardsWithHp}`);
      console.log(`  Com image: ${investigation.fieldAnalysis.cardsWithImage}`);
      console.log(`  Com localId: ${investigation.fieldAnalysis.cardsWithLocalId}`);
      console.log(`  Com campos faltando: ${investigation.fieldAnalysis.cardsMissingFields.length}`);

      // Mostrar algumas cartas com campos faltando
      if (investigation.fieldAnalysis.cardsMissingFields.length > 0) {
        console.log('🔍 Primeiras cartas com campos faltando:');
        investigation.fieldAnalysis.cardsMissingFields.slice(0, 5).forEach(card => {
          console.log(`  ${card.name} (${card.id}): falta ${card.missingFields.join(', ')}`);
        });
      }

      console.log('🔍 === INVESTIGAÇÃO CONCLUÍDA ===');

      return {
        success: true,
        message: `Investigation completed: ${investigation.fieldAnalysis.cardsMissingFields.length} cards missing fields`,
        investigation
      };

    } catch (error: any) {
      console.error('❌ Erro na investigação:', error);
      return {
        success: false,
        message: `Erro na investigação: ${error.message}`,
        investigation: {
          tableStructure: {},
          sampleCards: [],
          fieldAnalysis: {
            totalCards: 0,
            cardsWithTypes: 0,
            cardsWithRarity: 0,
            cardsWithHp: 0,
            cardsWithImage: 0,
            cardsWithLocalId: 0,
            cardsMissingFields: []
          }
        }
      };
    }
  }

  /**
   * Função de DEBUG - apenas analisa o que precisa ser atualizado sem fazer alterações
   */
  async analyzeDatabaseStatus(): Promise<{
    success: boolean;
    message: string;
    analysis: {
      database: any;
      api: any;
      needsUpdate: {
        series: any[];
        sets: any[];
        cards: any[];
        cardDetails: any[];
      };
      recommendations: string[];
    };
  }> {
    try {
      await DatabaseService.initialize();
      
      const analysis = {
        database: await DatabaseService.getStats(),
        api: { series: 0, sets: 0, cards: 0 },
        needsUpdate: {
          series: [] as any[],
          sets: [] as any[],
          cards: [] as any[],
          cardDetails: [] as any[]
        },
        recommendations: [] as string[]
      };

      console.log('🔍 === ANÁLISE DE DEBUG INICIADA ===');
      console.log('📊 Estatísticas do banco:', analysis.database);

      // 1. Verificar se banco está vazio
      if (analysis.database.series === 0 && analysis.database.sets === 0 && analysis.database.cards === 0) {
        analysis.recommendations.push('🆕 Banco vazio - Recomendado: Migração completa dos JSONs');
        return {
          success: true,
          message: 'Banco vazio - precisa de migração inicial',
          analysis
        };
      }

      // 2. Analisar séries
      console.log('📚 Analisando séries...');
      const apiSeries = await this.tcgdex.serie.list();
      const dbSeries = await DatabaseService.getAllSeries();
      analysis.api.series = apiSeries.length;
      
      const existingSeriesIds = new Set(dbSeries.map((s: any) => s.id));
      const newSeries = apiSeries.filter((s: any) => !existingSeriesIds.has(s.id));
      analysis.needsUpdate.series = newSeries;
      
      if (newSeries.length > 0) {
        analysis.recommendations.push(`📚 ${newSeries.length} séries novas encontradas`);
        console.log(`📚 Séries novas: ${newSeries.map((s: any) => s.name).join(', ')}`);
      }

      // 3. Analisar sets
      console.log('📦 Analisando sets...');
      const apiSets = await this.tcgdex.set.list();
      const dbSets = await DatabaseService.getAllSets();
      analysis.api.sets = apiSets.length;
      
      const existingSetIds = new Set(dbSets.map((s: any) => s.id));
      const newSets = apiSets.filter((s: any) => !existingSetIds.has(s.id));
      analysis.needsUpdate.sets = newSets;
      
      if (newSets.length > 0) {
        analysis.recommendations.push(`📦 ${newSets.length} sets novos encontrados`);
        console.log(`📦 Sets novos: ${newSets.map((s: any) => s.name).join(', ')}`);
      }

      // 4. Analisar cards (primeira página apenas para debug)
      console.log('🃏 Analisando cards (primeira página)...');
      const apiCardsPage1 = await this.tcgdex.card.list({ page: 1, pageSize: 100 });
      const dbCards = await DatabaseService.getAllCards();
      analysis.api.cards = apiCardsPage1.total || 0;
      
      const existingCardIds = new Set(dbCards.map((c: any) => c.id));
      const newCards = apiCardsPage1.data?.filter((c: any) => !existingCardIds.has(c.id)) || [];
      analysis.needsUpdate.cards = newCards.slice(0, 10); // Apenas primeiras 10 para debug
      
      if (newCards.length > 0) {
        analysis.recommendations.push(`🃏 ${newCards.length} cartas novas encontradas (primeira página)`);
        console.log(`🃏 Primeiras cartas novas: ${newCards.slice(0, 5).map((c: any) => c.name).join(', ')}`);
      }

      // 5. Analisar cartas que precisam de detalhes
      console.log('🔍 Analisando cartas que precisam de detalhes...');
      const cardsNeedingDetails = dbCards.filter(card => {
        // Campos obrigatórios para todas as cartas
        const missingBasicFields = !card.category || !card.rarity || !card.image;
        
        // HP é obrigatório apenas para Pokémon (category === "Pokemon")
        const isPokemon = card.category === 'Pokemon';
        const missingHp = isPokemon && !card.hp;
        
        return missingBasicFields || missingHp;
      });
      analysis.needsUpdate.cardDetails = cardsNeedingDetails.slice(0, 20); // Apenas primeiras 20 para debug
      
      if (cardsNeedingDetails.length > 0) {
        analysis.recommendations.push(`🔍 ${cardsNeedingDetails.length} cartas precisam de detalhes`);
        console.log(`🔍 Cartas sem detalhes: ${cardsNeedingDetails.slice(0, 5).map(c => c.name).join(', ')}`);
      }

      // 6. Gerar resumo
      const totalUpdates = analysis.needsUpdate.series.length + 
                          analysis.needsUpdate.sets.length + 
                          analysis.needsUpdate.cards.length + 
                          analysis.needsUpdate.cardDetails.length;

      if (totalUpdates === 0) {
        analysis.recommendations.push('✅ Banco está atualizado - nenhuma atualização necessária');
      } else {
        analysis.recommendations.push(`⚠️ Total de atualizações necessárias: ${totalUpdates}`);
      }

      console.log('🔍 === ANÁLISE DE DEBUG CONCLUÍDA ===');
      console.log('📋 Recomendações:', analysis.recommendations);

      return {
        success: true,
        message: `Análise concluída: ${totalUpdates} atualizações necessárias`,
        analysis
      };

    } catch (error: any) {
      console.error('❌ Erro na análise de debug:', error);
      return {
        success: false,
        message: `Erro na análise: ${error.message}`,
        analysis: {
          database: { series: 0, sets: 0, cards: 0 },
          api: { series: 0, sets: 0, cards: 0 },
          needsUpdate: { series: [], sets: [], cards: [], cardDetails: [] },
          recommendations: [`❌ Erro: ${error.message}`]
        }
      };
    }
  }

  // Obter URL da imagem usando o SDK (baseado no projeto anterior)
  getImageURL(card: any, quality: string = 'high', extension: string = 'webp'): string {
    try {
      console.log('Debug getImageURL:', {
        cardName: card.name,
        cardId: card.id,
        hasImage: !!card.image,
        imageValue: card.image
      });
      
      // Se a carta já tem uma propriedade image, usar ela
      if (card && card.image) {
        // Verificar se a URL já tem qualidade e extensão
        let imageUrl = card.image;
        if (!imageUrl.includes('/high.webp') && !imageUrl.includes('/medium.webp') && !imageUrl.includes('/low.webp')) {
          // Adicionar qualidade e extensão se não tiver
          imageUrl = imageUrl.endsWith('/') ? imageUrl : imageUrl + '/';
          imageUrl += `${quality}.webp`;
        }
        console.log('Usando image da carta:', imageUrl);
        return imageUrl;
      }
      
      // Se tem método getImageURL do SDK, usar ele
      if (card && typeof card.getImageURL === 'function') {
        const url = card.getImageURL(quality, extension);
        console.log('URL do SDK:', url);
        return url;
      }
      
      // Fallback: construir URL manualmente
      const setId = card.set?.id || card.setId || card.id?.split('-')[0] || 'sv01';
      const cardNumber = card.localId || card.number || '1';
      const manualUrl = `https://assets.tcgdex.net/${this.language}/sv/${setId}/${cardNumber}/${quality}.webp`;
      console.log('URL manual:', manualUrl);
      return manualUrl;
    } catch (error) {
      console.error('Erro ao obter URL da imagem:', error);
      // Fallback para URL manual
      const setId = card.set?.id || card.setId || card.id?.split('-')[0] || 'sv01';
      const cardNumber = card.localId || card.number || '1';
      return `https://assets.tcgdex.net/${this.language}/sv/${setId}/${cardNumber}/${quality}.webp`;
    }
  }
}

export default new TCGdexService('pt');
