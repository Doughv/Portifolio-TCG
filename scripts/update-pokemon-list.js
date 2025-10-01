#!/usr/bin/env node

/**
 * Script para atualizar APENAS o pokemon_list.json com cartas novas do SDK TCGdex
 */

const fs = require('fs').promises;
const path = require('path');

// Importar o SDK TCGdex
const TCGdexModule = require('@tcgdex/sdk');
const TCGdex = TCGdexModule.default || TCGdexModule;

class PokemonListUpdater {
  constructor(dataDir = 'assets/data') {
    this.dataDir = path.resolve(dataDir);
    this.listFile = path.join(this.dataDir, 'pokemon_list.json');
    
    // Inicializar SDK
    this.tcgdex = null;
    this.initializeSDK();
  }
  
  initializeSDK() {
    try {
      console.log('🔧 Inicializando SDK TCGdex...');
      this.tcgdex = new TCGdex('pt');
      console.log('✅ SDK TCGdex inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar SDK TCGdex:', error);
      throw error;
    }
  }
  
  async loadExistingList() {
    try {
      const data = await fs.readFile(this.listFile, 'utf8');
      const cards = JSON.parse(data);
      console.log(`📋 Lista atual carregada: ${cards.length} cartas`);
      return cards;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📋 Arquivo pokemon_list.json não encontrado, criando lista vazia...');
        return [];
      }
      console.error('❌ Erro ao carregar lista:', error);
      return [];
    }
  }
  
  async getAllCardsFromAPI() {
    console.log('🌐 Buscando todas as cartas da API...');
    
    const allCards = [];
    let page = 1;
    const pageSize = 100;
    
    while (true) {
      try {
        process.stdout.write(`📄 Página ${page}... `);
        const cards = await this.tcgdex.card.list({ 
          limit: pageSize, 
          offset: (page - 1) * pageSize 
        });
        
        if (cards.length === 0) {
          break;
        }
        
        allCards.push(...cards);
        console.log(`${cards.length} cartas encontradas`);
        page++;
        
        // Limite de segurança
        if (page > 200) {
          break;
        }
        
      } catch (error) {
        console.log(`❌ Erro na página ${page}: ${error.message}`);
        break;
      }
    }
    
    console.log(`🌐 Total de cartas na API: ${allCards.length}`);
    return allCards;
  }
  
  findNewCards(existingCards, apiCards) {
    console.log('🔍 Procurando cartas novas...');
    
    const existingIds = new Set(existingCards.map(card => card.id));
    const newCards = [];
    
    for (const apiCard of apiCards) {
      if (!existingIds.has(apiCard.id)) {
        newCards.push({
          id: apiCard.id,
          name: apiCard.name
        });
      }
    }
    
    console.log(`🆕 Cartas novas encontradas: ${newCards.length}`);
    return newCards;
  }
  
  async saveUpdatedList(allCards) {
    console.log('💾 Salvando lista atualizada...');
    
    // Ordena por ID para consistência
    allCards.sort((a, b) => a.id.localeCompare(b.id));
    
    await fs.writeFile(this.listFile, JSON.stringify(allCards, null, 2), 'utf8');
    
    console.log(`💾 Lista salva: ${allCards.length} cartas`);
    console.log(`📁 Arquivo: ${this.listFile}`);
  }
  
  async updateList() {
    console.log('🚀 Iniciando atualização do pokemon_list.json...');
    
    try {
      // Carrega lista atual
      const existingCards = await this.loadExistingList();
      
      // Busca cartas da API
      const apiCards = await this.getAllCardsFromAPI();
      
      // Encontra cartas novas
      const newCards = this.findNewCards(existingCards, apiCards);
      
      if (newCards.length === 0) {
        console.log('✅ Nenhuma carta nova encontrada!');
        return;
      }
      
      // Adiciona cartas novas à lista existente
      const updatedCards = [...existingCards, ...newCards];
      
      // Salva lista atualizada
      await this.saveUpdatedList(updatedCards);
      
      // Relatório final
      console.log('\n' + '='.repeat(50));
      console.log('📊 RELATÓRIO FINAL:');
      console.log(`📋 Cartas existentes: ${existingCards.length}`);
      console.log(`🆕 Cartas novas: ${newCards.length}`);
      console.log(`📁 Total atualizado: ${updatedCards.length}`);
      console.log('✅ Atualização concluída!');
      
      // Mostra exemplos de cartas novas
      if (newCards.length > 0) {
        console.log('\n🔍 Exemplos de cartas novas:');
        for (let i = 0; i < Math.min(5, newCards.length); i++) {
          const card = newCards[i];
          console.log(`  - ${card.name} (${card.id})`);
        }
        if (newCards.length > 5) {
          console.log(`  ... e mais ${newCards.length - 5} cartas`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro durante atualização:', error);
      throw error;
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
    const updater = new PokemonListUpdater(dataDir);
    await updater.updateList();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = PokemonListUpdater;
