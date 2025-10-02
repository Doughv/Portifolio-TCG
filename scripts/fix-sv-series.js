#!/usr/bin/env node

/**
 * Script para corrigir a série dos sets Escarlate e Violeta
 * Corrige sets como sv03.5, sv04.5, sv06.5, sv08.5, sv10.5b, sv10.5w
 * para que tenham a série correta "sv"
 */

const fs = require('fs').promises;
const path = require('path');

class SVSeriesFixer {
  constructor(dataDir = 'assets/data') {
    this.dataDir = path.resolve(dataDir);
    this.setsFile = path.join(this.dataDir, 'pokemon_sets.json');
  }

  async fixSVSeries() {
    try {
      console.log('🔧 Corrigindo séries dos sets Escarlate e Violeta...');
      
      // Ler arquivo de sets
      const setsData = JSON.parse(await fs.readFile(this.setsFile, 'utf8'));
      console.log(`📦 ${setsData.length} sets encontrados`);
      
      let fixedCount = 0;
      const svSets = [];
      
      // Processar cada set
      const fixedSets = setsData.map(set => {
        const setId = set.id;
        
        // Verificar se é um set SV que precisa de correção
        if (setId.startsWith('sv')) {
          svSets.push(setId);
          
          // Se a série não é "sv", corrigir
          if (set.series !== 'sv') {
            console.log(`🔧 Corrigindo ${setId}: "${set.series}" → "sv"`);
            fixedCount++;
            return {
              ...set,
              series: 'sv'
            };
          }
        }
        
        return set;
      });
      
      console.log(`\n📊 Sets SV encontrados: ${svSets.length}`);
      console.log('Sets SV:', svSets.join(', '));
      console.log(`🔧 ${fixedCount} sets corrigidos`);
      
      // Salvar arquivo corrigido
      await fs.writeFile(this.setsFile, JSON.stringify(fixedSets, null, 2), 'utf8');
      console.log(`💾 Arquivo salvo: ${this.setsFile}`);
      
      return {
        success: true,
        totalSets: setsData.length,
        svSets: svSets.length,
        fixedSets: fixedCount
      };
      
    } catch (error) {
      console.error('❌ Erro ao corrigir séries SV:', error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    const fixer = new SVSeriesFixer();
    const result = await fixer.fixSVSeries();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Correção concluída!');
    console.log(`📦 Total de sets: ${result.totalSets}`);
    console.log(`🎯 Sets SV: ${result.svSets}`);
    console.log(`🔧 Sets corrigidos: ${result.fixedSets}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SVSeriesFixer;
