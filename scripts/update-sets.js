#!/usr/bin/env node

/**
 * Script simples para atualizar APENAS o pokemon_sets.json
 */

const fs = require('fs').promises;
const path = require('path');

// Importar o SDK TCGdex
const TCGdexModule = require('@tcgdex/sdk');
const TCGdex = TCGdexModule.default || TCGdexModule;

class SetsUpdater {
  constructor(dataDir = 'assets/data') {
    this.dataDir = path.resolve(dataDir);
    this.setsFile = path.join(this.dataDir, 'pokemon_sets.json');
    this.tcgdex = null;
    
    this.stats = {
      new: 0,
      updated: 0,
      total: 0
    };
  }
  
  async initializeSDK() {
    try {
      console.log('🔧 Inicializando SDK TCGdex...');
      this.tcgdex = new TCGdex('pt');
      console.log('✅ SDK TCGdex inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar SDK TCGdex:', error);
      throw error;
    }
  }
  
  async loadExistingSets() {
    try {
      const data = await fs.readFile(this.setsFile, 'utf8');
      const sets = JSON.parse(data);
      console.log(`📦 Sets existentes carregados: ${sets.length}`);
      return sets;
    } catch (error) {
      console.log('📦 Nenhum set existente encontrado');
      return [];
    }
  }
  
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
  
  async updateSets() {
    console.log('📦 Atualizando sets...');
    
    try {
      const apiSets = await this.tcgdex.set.list();
      console.log(`📦 ${apiSets.length} sets encontrados na API`);
      
      const existingSets = await this.loadExistingSets();
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
          this.stats.new++;
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
              this.stats.updated++;
              console.log(`📦 Set atualizado: ${set.name} (${set.id})`);
            }
          }
        }
      }
      
      this.stats.total = updatedSets.length;
      
      // Salvar sets
      await fs.writeFile(this.setsFile, JSON.stringify(updatedSets, null, 2), 'utf8');
      console.log(`💾 ${updatedSets.length} sets salvos`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar sets:', error);
      throw error;
    }
  }
  
  printStats() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 === ESTATÍSTICAS DOS SETS ===');
    console.log(`📦 Sets novos: ${this.stats.new}`);
    console.log(`📦 Sets atualizados: ${this.stats.updated}`);
    console.log(`📦 Total: ${this.stats.total}`);
    
    if (this.stats.new === 0 && this.stats.updated === 0) {
      console.log('✅ Nenhuma atualização necessária - sets já estão atualizados!');
    } else {
      console.log('✅ Atualização de sets concluída com sucesso!');
    }
  }
  
  async run() {
    try {
      console.log('🚀 Iniciando atualização dos sets...');
      console.log(`📁 Diretório de dados: ${this.dataDir}`);
      
      await this.initializeSDK();
      await this.updateSets();
      this.printStats();
      
    } catch (error) {
      console.error('❌ Erro durante a atualização:', error);
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
    const updater = new SetsUpdater(dataDir);
    await updater.run();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SetsUpdater;
