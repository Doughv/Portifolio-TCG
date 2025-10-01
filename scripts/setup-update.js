#!/usr/bin/env node

/**
 * Script de configuração para atualização dos JSONs
 * 
 * Este script configura o ambiente e executa a atualização incremental
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando atualização incremental dos JSONs...');

// Verificar se o SDK está instalado
try {
  require('@tcgdex/sdk');
  console.log('✅ SDK TCGdex encontrado');
} catch (error) {
  console.log('📦 Instalando SDK TCGdex...');
  try {
    execSync('npm install @tcgdex/sdk', { stdio: 'inherit' });
    console.log('✅ SDK TCGdex instalado com sucesso');
  } catch (installError) {
    console.error('❌ Erro ao instalar SDK TCGdex:', installError.message);
    process.exit(1);
  }
}

// Verificar se o diretório de assets existe
const assetsPath = path.join(__dirname, '../assets/data');
if (!fs.existsSync(assetsPath)) {
  console.log('📁 Criando diretório de assets...');
  fs.mkdirSync(assetsPath, { recursive: true });
}

// Executar o script de atualização
console.log('🔄 Executando atualização incremental...');
try {
  execSync('node scripts/update-jsons-incremental.js', { stdio: 'inherit' });
  console.log('✅ Atualização concluída com sucesso!');
} catch (error) {
  console.error('❌ Erro durante a atualização:', error.message);
  process.exit(1);
}
