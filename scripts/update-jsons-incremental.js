#!/usr/bin/env node

/**
 * Script para atualização incremental dos JSONs do Pokémon TCG
 * 
 * Este script:
 * 1. Conecta na API usando o SDK TCGdx
 * 2. Compara com os JSONs existentes
 * 3. Atualiza apenas dados novos
 * 4. Gera JSONs atualizados
 */

const fs = require('fs').promises;
const path = require('path');

// Importar o SDK TCGdex
const TCGdexModule = require('@tcgdex/sdk');
const TCGdex = TCGdexModule.default || TCGdexModule;

class JSONUpdater {
  constructor() {
    this.tcgdex = null;
    this.language = 'pt';
    this.assetsPath = path.join(__dirname, '../assets/data');
    this.outputPath = path.join(__dirname, '../assets/data');
    
    // Arquivos JSON existentes
    this.existingFiles = {
      series: 'pokemon_series.json',
      sets: 'pokemon_sets.json', 
      cards: 'pokemon_cards_detailed.json'
    };
    
    this.stats = {
      series: { new: 0, updated: 0, total: 0 },
      sets: { new: 0, updated: 0, total: 0 },
      cards: { new: 0, updated: 0, total: 0 }
    };
  }

  async initializeSDK() {
    try {
      console.log('🔧 Inicializando SDK TCGdex...');
      this.tcgdex = new TCGdex(this.language);
      console.log('✅ SDK TCGdex inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar SDK TCGdex:', error);
      throw error;
    }
  }

  async initialize() {
    console.log('🚀 Iniciando atualização incremental dos JSONs...');
    console.log(`📁 Diretório de dados: ${this.assetsPath}`);
    
    // Inicializar SDK primeiro
    await this.initializeSDK();
    
    // Verificar se o diretório existe
    try {
      await fs.access(this.assetsPath);
    } catch (error) {
      console.log('📁 Criando diretório de dados...');
      await fs.mkdir(this.assetsPath, { recursive: true });
    }
  }

  async loadExistingData() {
    console.log('📚 Carregando dados existentes...');
    
    const existing = {
      series: [],
      sets: [],
      cards: []
    };

    try {
      // Carregar séries existentes
      const seriesPath = path.join(this.assetsPath, this.existingFiles.series);
      const seriesData = await fs.readFile(seriesPath, 'utf8');
      existing.series = JSON.parse(seriesData);
      console.log(`📚 ${existing.series.length} séries existentes carregadas`);
    } catch (error) {
      console.log('📚 Nenhuma série existente encontrada');
    }

    try {
      // Carregar sets existentes
      const setsPath = path.join(this.assetsPath, this.existingFiles.sets);
      const setsData = await fs.readFile(setsPath, 'utf8');
      existing.sets = JSON.parse(setsData);
      console.log(`📦 ${existing.sets.length} sets existentes carregados`);
    } catch (error) {
      console.log('📦 Nenhum set existente encontrado');
    }

    try {
      // Carregar cards existentes
      const cardsPath = path.join(this.assetsPath, this.existingFiles.cards);
      const cardsData = await fs.readFile(cardsPath, 'utf8');
      existing.cards = JSON.parse(cardsData);
      console.log(`🃏 ${existing.cards.length} cards existentes carregados`);
    } catch (error) {
      console.log('🃏 Nenhum card existente encontrado');
    }

    return existing;
  }

  async updateSeries(existingSeries) {
    console.log('📚 Atualizando séries...');
    
    if (!this.tcgdex) {
      throw new Error('SDK TCGdex não foi inicializado');
    }
    
    try {
      const apiSeries = await this.tcgdex.serie.list();
      console.log(`📚 ${apiSeries.length} séries encontradas na API`);
      
      const existingIds = new Set(existingSeries.map(s => s.id));
      const updatedSeries = [...existingSeries];
      
      for (const serie of apiSeries) {
        if (!existingIds.has(serie.id)) {
          // Nova série
          updatedSeries.push({
            id: serie.id,
            name: serie.name,
            logo: serie.logo || ''
          });
          this.stats.series.new++;
          console.log(`📚 Nova série: ${serie.name} (${serie.id})`);
        } else {
          // Verificar se precisa atualizar
          const existingSerie = existingSeries.find(s => s.id === serie.id);
          if (existingSerie && existingSerie.name !== serie.name) {
            existingSerie.name = serie.name;
            existingSerie.logo = serie.logo || '';
            this.stats.series.updated++;
            console.log(`📚 Série atualizada: ${serie.name} (${serie.id})`);
          }
        }
      }
      
      this.stats.series.total = updatedSeries.length;
      return updatedSeries;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar séries:', error);
      return existingSeries;
    }
  }

  async updateSets(existingSets) {
    console.log('📦 Atualizando sets...');
    
    if (!this.tcgdex) {
      throw new Error('SDK TCGdex não foi inicializado');
    }
    
    try {
      const apiSets = await this.tcgdex.set.list();
      console.log(`📦 ${apiSets.length} sets encontrados na API`);
      
      const existingIds = new Set(existingSets.map(s => s.id));
      const updatedSets = [...existingSets];
      
      for (const set of apiSets) {
        if (!existingIds.has(set.id)) {
          // Novo set
          updatedSets.push({
            id: set.id,
            name: set.name,
            series: set.serie || set.series || this.inferSeriesFromSetId(set.id),
            releaseDate: set.releaseDate || new Date().toISOString(),
            totalCards: set.cardCount?.total || set.cardCount?.official || 0,
            symbol: set.symbol || '',
            logo: set.logo || ''
          });
          this.stats.sets.new++;
          console.log(`📦 Novo set: ${set.name} (${set.id})`);
        } else {
          // Verificar se precisa atualizar
          const existingSet = existingSets.find(s => s.id === set.id);
          if (existingSet) {
            let updated = false;
            
            if (existingSet.name !== set.name) {
              existingSet.name = set.name;
              updated = true;
            }
            if (existingSet.totalCards !== (set.cardCount?.total || set.cardCount?.official || 0)) {
              existingSet.totalCards = set.cardCount?.total || set.cardCount?.official || 0;
              updated = true;
            }
            
            if (updated) {
              this.stats.sets.updated++;
              console.log(`📦 Set atualizado: ${set.name} (${set.id})`);
            }
          }
        }
      }
      
      this.stats.sets.total = updatedSets.length;
      return updatedSets;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar sets:', error);
      return existingSets;
    }
  }

  async updateCards(existingCards) {
    console.log('🃏 Atualizando cards...');
    
    if (!this.tcgdex) {
      throw new Error('SDK TCGdex não foi inicializado');
    }
    
    try {
      // Buscar cards em lotes para não sobrecarregar
      let allApiCards = [];
      let page = 1;
      const pageSize = 100;
      
      while (true) {
        const cards = await this.tcgdex.card.list({ 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        });
        
        if (cards.length === 0) break;
        
        allApiCards.push(...cards);
        page++;
        
        console.log(`🃏 Página ${page}: ${cards.length} cards encontrados`);
        
        // Limite de segurança
        if (page > 50) break;
      }
      
      console.log(`🃏 ${allApiCards.length} cards encontrados na API`);
      
      const existingIds = new Set(existingCards.map(c => c.id));
      const updatedCards = [...existingCards];
      
      for (const card of allApiCards) {
        if (!existingIds.has(card.id)) {
          // Novo card
          updatedCards.push({
            id: card.id,
            name: card.name,
            image: card.image || card.images?.large || card.images?.small || '',
            rarity: card.rarity || 'Unknown',
            set: card.set?.id || this.extractSetFromId(card.id),
            series: card.set?.serie || card.set?.series || this.inferSeriesFromSetId(card.set?.id),
            price: this.extractPrice(card.cardmarket?.prices),
            localId: card.localId || this.extractLocalId(card.id),
            hp: this.extractHP(card.hp),
            types: this.extractTypes(card.types),
            attacks: this.extractAttacks(card.attacks),
            weaknesses: this.extractWeaknesses(card.weaknesses),
            resistances: this.extractResistances(card.resistances),
            category: card.category || null,
            illustrator: card.illustrator || null,
            dexId: card.dexId || null,
            stage: card.stage || null,
            retreat: card.retreat || null,
            legal: card.legal || null,
            variants: card.variants || null,
            variantsDetailed: card.variantsDetailed || null,
            updated: card.updated || null
          });
          this.stats.cards.new++;
          
          if (this.stats.cards.new % 100 === 0) {
            console.log(`🃏 ${this.stats.cards.new} cards novos processados...`);
          }
        }
      }
      
      this.stats.cards.total = updatedCards.length;
      return updatedCards;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cards:', error);
      return existingCards;
    }
  }

  // Funções auxiliares
  inferSeriesFromSetId(setId) {
    if (!setId) return 'unknown';
    
    const seriesMap = {
      'base': 'base',
      'bw': 'bw',
      'xy': 'xy',
      'sm': 'sm',
      'swsh': 'swsh',
      'sv': 'sv'
    };
    
    for (const [prefix, series] of Object.entries(seriesMap)) {
      if (setId.startsWith(prefix)) {
        return series;
      }
    }
    
    return 'unknown';
  }

  extractSetFromId(cardId) {
    if (!cardId) return 'unknown';
    const parts = cardId.split('-');
    return parts.length >= 2 ? parts[0] : 'unknown';
  }

  extractLocalId(cardId) {
    if (!cardId) return null;
    const parts = cardId.split('-');
    if (parts.length >= 2) {
      const localId = parts[parts.length - 1];
      if (/^\d+$/.test(localId)) {
        return localId;
      }
    }
    return null;
  }

  extractPrice(prices) {
    if (!prices) return 0;
    return prices.averageSellPrice || prices.lowPrice || prices.midPrice || 0;
  }

  extractHP(hp) {
    return typeof hp === 'number' ? hp : null;
  }

  extractTypes(types) {
    return Array.isArray(types) ? types : [];
  }

  extractAttacks(attacks) {
    return Array.isArray(attacks) ? attacks : [];
  }

  extractWeaknesses(weaknesses) {
    return Array.isArray(weaknesses) ? weaknesses : [];
  }

  extractResistances(resistances) {
    return Array.isArray(resistances) ? resistances : [];
  }

  async saveUpdatedData(series, sets, cards) {
    console.log('💾 Salvando dados atualizados...');
    
    try {
      // Salvar séries
      const seriesPath = path.join(this.outputPath, this.existingFiles.series);
      await fs.writeFile(seriesPath, JSON.stringify(series, null, 2));
      console.log(`💾 ${series.length} séries salvas`);
      
      // Salvar sets
      const setsPath = path.join(this.outputPath, this.existingFiles.sets);
      await fs.writeFile(setsPath, JSON.stringify(sets, null, 2));
      console.log(`💾 ${sets.length} sets salvos`);
      
      // Salvar cards
      const cardsPath = path.join(this.outputPath, this.existingFiles.cards);
      await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2));
      console.log(`💾 ${cards.length} cards salvos`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      throw error;
    }
  }

  printStats() {
    console.log('\n📊 === ESTATÍSTICAS DA ATUALIZAÇÃO ===');
    console.log(`📚 Séries: ${this.stats.series.new} novas, ${this.stats.series.updated} atualizadas, ${this.stats.series.total} total`);
    console.log(`📦 Sets: ${this.stats.sets.new} novos, ${this.stats.sets.updated} atualizados, ${this.stats.sets.total} total`);
    console.log(`🃏 Cards: ${this.stats.cards.new} novos, ${this.stats.cards.updated} atualizados, ${this.stats.cards.total} total`);
    
    const totalNew = this.stats.series.new + this.stats.sets.new + this.stats.cards.new;
    const totalUpdated = this.stats.series.updated + this.stats.sets.updated + this.stats.cards.updated;
    
    console.log(`\n🎯 RESUMO: ${totalNew} novos itens, ${totalUpdated} atualizações`);
    
    if (totalNew === 0 && totalUpdated === 0) {
      console.log('✅ Nenhuma atualização necessária - dados já estão atualizados!');
    } else {
      console.log('✅ Atualização incremental concluída com sucesso!');
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const existing = await this.loadExistingData();
      
      const updatedSeries = await this.updateSeries(existing.series);
      const updatedSets = await this.updateSets(existing.sets);
      const updatedCards = await this.updateCards(existing.cards);
      
      await this.saveUpdatedData(updatedSeries, updatedSets, updatedCards);
      
      this.printStats();
      
    } catch (error) {
      console.error('❌ Erro durante a atualização:', error);
      process.exit(1);
    }
  }
}

// Executar o script
if (require.main === module) {
  const updater = new JSONUpdater();
  updater.run();
}

module.exports = JSONUpdater;
