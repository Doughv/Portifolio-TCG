#!/usr/bin/env node

/**
 * Script simples para atualizar JSONs via chamadas HTTP diretas
 * 
 * URLs:
 * - https://api.tcgdex.net/v2/pt/sets (expansões)
 * - https://api.tcgdex.net/v2/pt/series (coleções)  
 * - https://api.tcgdex.net/v2/pt/cards (cartas básicas)
 */

const fs = require('fs').promises;
const path = require('path');

class SimpleUpdater {
  constructor(dataDir = 'assets/data') {
    this.dataDir = path.resolve(dataDir);
    
    // Arquivos
    this.seriesFile = path.join(this.dataDir, 'pokemon_series.json');
    this.setsFile = path.join(this.dataDir, 'pokemon_sets.json');
    this.cardsListFile = path.join(this.dataDir, 'pokemon_list.json');
    
    // URLs da API
    this.urls = {
      series: 'https://api.tcgdex.net/v2/pt/series',
      sets: 'https://api.tcgdex.net/v2/pt/sets',
      cards: 'https://api.tcgdex.net/v2/pt/cards'
    };
    
    this.stats = {
      series: { total: 0 },
      sets: { total: 0 },
      cards: { total: 0 }
    };
  }
  
  async makeRequest(url, timeout = 60000) {
    console.log(`🌐 Fazendo requisição para: ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Pokemon-TCG-Updater/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Resposta recebida: ${Array.isArray(data) ? data.length : 'objeto'} itens`);
      
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout após ${timeout/1000} segundos`);
      }
      throw error;
    }
  }
  
  async updateSeries() {
    console.log('\n📚 === ATUALIZANDO SÉRIES ===');
    
    try {
      const apiSeries = await this.makeRequest(this.urls.series);
      
      // Processar dados das séries
      const processedSeries = apiSeries.map(serie => ({
        id: serie.id,
        name: serie.name,
        logo: serie.logo || ''
      }));
      
      this.stats.series.total = processedSeries.length;
      
      // Salvar séries
      await fs.writeFile(this.seriesFile, JSON.stringify(processedSeries, null, 2), 'utf8');
      console.log(`💾 ${processedSeries.length} séries salvas em: ${this.seriesFile}`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar séries:', error.message);
      throw error;
    }
  }
  
  async inferSeriesFromAPI() {
    console.log('🔍 Analisando relacionamentos série-set da API...');
    
    try {
      // Buscar dados de séries e sets da API
      const [apiSeries, apiSets] = await Promise.all([
        this.makeRequest(this.urls.series),
        this.makeRequest(this.urls.sets)
      ]);
      
      // Criar mapa de relacionamentos baseado nos dados reais da API
      const seriesMap = new Map();
      
      // 1. Primeiro, usar os relacionamentos explícitos da API
      apiSets.forEach(set => {
        if (set.serie || set.series) {
          const seriesId = set.serie || set.series;
          seriesMap.set(set.id, seriesId);
        }
      });
      
      // 2. Para sets sem série explícita, inferir baseado em padrões comuns
      const patterns = this.detectSeriesPatterns(apiSets);
      
      apiSets.forEach(set => {
        if (!seriesMap.has(set.id)) {
          const inferredSeries = this.inferFromPatterns(set.id, patterns);
          if (inferredSeries) {
            seriesMap.set(set.id, inferredSeries);
            console.log(`🔗 Inferido: ${set.id} → ${inferredSeries}`);
          }
        }
      });
      
      console.log(`📊 Mapeamento criado para ${seriesMap.size} sets`);
      return seriesMap;
      
    } catch (error) {
      console.error('❌ Erro ao analisar API:', error.message);
      return new Map();
    }
  }
  
  detectSeriesPatterns(sets) {
    const patterns = new Map();
    
    // Analisar padrões de IDs para detectar séries automaticamente
    sets.forEach(set => {
      if (set.serie || set.series) {
        const seriesId = set.serie || set.series;
        const setId = set.id;
        
        // Extrair prefixo do ID do set
        const prefix = setId.split(/[-_]/)[0]; // bw1, xy4, sv07, etc.
        const basePrefix = prefix.replace(/\d+$/, ''); // bw, xy, sv, etc.
        
        if (!patterns.has(basePrefix)) {
          patterns.set(basePrefix, seriesId);
        }
      }
    });
    
    console.log('🎯 Padrões detectados:', Object.fromEntries(patterns));
    return patterns;
  }
  
  inferFromPatterns(setId, patterns) {
    // Extrair prefixo base do ID do set
    const prefix = setId.split(/[-_]/)[0];
    const basePrefix = prefix.replace(/\d+$/, '');
    
    // Procurar padrão correspondente
    for (const [pattern, seriesId] of patterns.entries()) {
      if (basePrefix.startsWith(pattern) || pattern.startsWith(basePrefix)) {
        return seriesId;
      }
    }
    
    // Se não encontrar padrão, usar o prefixo base como série
    return basePrefix || 'unknown';
  }
  
  inferSeriesFromSetId(setId, seriesMap = null) {
    if (!setId) return 'unknown';
    
    // Se temos um mapa de séries da API, usar ele
    if (seriesMap && seriesMap.has(setId)) {
      return seriesMap.get(setId);
    }
    
    // Fallback para padrões conhecidos (apenas para casos especiais)
    const knownPatterns = {
      'base': 'base',
      'bw': 'bw',
      'xy': 'xy', 
      'sm': 'sm',
      'swsh': 'swsh',
      'sv': 'sv',
      'me': 'me'
    };
    
    for (const [prefix, series] of Object.entries(knownPatterns)) {
      if (setId.startsWith(prefix)) {
        return series;
      }
    }
    
    return 'unknown';
  }
  
  async updateSets() {
    console.log('\n📦 === ATUALIZANDO SETS ===');
    
    try {
      // 1. Primeiro, analisar relacionamentos da API
      const seriesMap = await this.inferSeriesFromAPI();
      
      // 2. Buscar dados dos sets
      const apiSets = await this.makeRequest(this.urls.sets);
      
      // 3. Processar dados dos sets usando o mapeamento inteligente
      const processedSets = apiSets.map(set => ({
        id: set.id,
        name: set.name,
        series: set.serie || set.series || this.inferSeriesFromSetId(set.id, seriesMap),
        releaseDate: set.releaseDate || new Date().toISOString(),
        totalCards: set.cardCount?.total || set.cardCount?.official || 0,
        symbol: set.symbol || '',
        logo: set.logo || ''
      }));
      
      this.stats.sets.total = processedSets.length;
      
      // 4. Salvar sets
      await fs.writeFile(this.setsFile, JSON.stringify(processedSets, null, 2), 'utf8');
      console.log(`💾 ${processedSets.length} sets salvos em: ${this.setsFile}`);
      
      // 5. Mostrar estatísticas de mapeamento
      const mappedCount = processedSets.filter(s => s.series !== 'unknown').length;
      console.log(`📊 ${mappedCount}/${processedSets.length} sets mapeados para séries`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar sets:', error.message);
      throw error;
    }
  }
  
  async updateCardsList() {
    console.log('\n🃏 === ATUALIZANDO LISTA DE CARDS ===');
    
    try {
      const apiCards = await this.makeRequest(this.urls.cards);
      
      // Processar dados das cartas (apenas ID e nome para a lista básica)
      const processedCards = apiCards.map(card => ({
        id: card.id,
        name: card.name
      }));
      
      this.stats.cards.total = processedCards.length;
      
      // Salvar lista de cartas
      await fs.writeFile(this.cardsListFile, JSON.stringify(processedCards, null, 2), 'utf8');
      console.log(`💾 ${processedCards.length} cartas salvas em: ${this.cardsListFile}`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar lista de cards:', error.message);
      throw error;
    }
  }
  
  printStats() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 === ESTATÍSTICAS FINAIS ===');
    console.log(`📚 Séries: ${this.stats.series.total} total`);
    console.log(`📦 Sets: ${this.stats.sets.total} total`);
    console.log(`🃏 Cards: ${this.stats.cards.total} total`);
    console.log('✅ Atualização concluída com sucesso!');
  }
  
  async run() {
    try {
      console.log('🚀 Iniciando atualização via HTTP...');
      console.log(`📁 Diretório de dados: ${this.dataDir}`);
      
      // Criar diretório se não existir
      try {
        await fs.access(this.dataDir);
      } catch (error) {
        console.log('📁 Criando diretório de dados...');
        await fs.mkdir(this.dataDir, { recursive: true });
      }
      
      // Executar atualizações
      await this.updateSeries();
      await this.updateSets();
      await this.updateCardsList();
      
      this.printStats();
      
    } catch (error) {
      console.error('❌ Erro durante a atualização:', error.message);
      process.exit(1);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  let dataDir = 'assets/data';
  
  // Parse argumentos simples
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--data-dir' && i + 1 < args.length) {
      dataDir = args[i + 1];
      i++; // Pula o próximo argumento
    }
  }
  
  try {
    const updater = new SimpleUpdater(dataDir);
    await updater.run();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleUpdater;
