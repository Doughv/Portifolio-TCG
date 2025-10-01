#!/usr/bin/env node

/**
 * Script de teste para verificar se o SDK TCGdex funciona
 */

console.log('🧪 Testando SDK TCGdex...');

try {
  // Tentar diferentes formas de importação
  console.log('📦 Tentando importar SDK...');
  
  // Forma 1: Importação padrão
  const TCGdex1 = require('@tcgdex/sdk');
  console.log('✅ Importação padrão funcionou');
  console.log('Tipo:', typeof TCGdex1);
  console.log('Propriedades:', Object.keys(TCGdex1));
  
  // Tentar criar instância
  try {
    const instance1 = new TCGdex1('pt');
    console.log('✅ Instância criada com sucesso (forma 1)');
    console.log('Propriedades da instância:', Object.keys(instance1));
  } catch (error) {
    console.log('❌ Erro ao criar instância (forma 1):', error.message);
  }
  
  // Forma 2: Destructuring
  try {
    const { TCGdex: TCGdex2 } = require('@tcgdex/sdk');
    console.log('✅ Destructuring funcionou');
    console.log('Tipo:', typeof TCGdex2);
    
    if (TCGdex2) {
      const instance2 = new TCGdex2('pt');
      console.log('✅ Instância criada com sucesso (forma 2)');
      console.log('Propriedades da instância:', Object.keys(instance2));
    }
  } catch (error) {
    console.log('❌ Erro com destructuring:', error.message);
  }
  
  // Forma 3: Verificar se é uma função
  if (typeof TCGdex1 === 'function') {
    console.log('✅ TCGdex é uma função');
  } else if (typeof TCGdex1 === 'object') {
    console.log('✅ TCGdex é um objeto');
    console.log('Construtor disponível:', !!TCGdex1.TCGdex);
    
    if (TCGdex1.TCGdex) {
      try {
        const instance3 = new TCGdex1.TCGdex('pt');
        console.log('✅ Instância criada com sucesso (forma 3)');
        console.log('Propriedades da instância:', Object.keys(instance3));
      } catch (error) {
        console.log('❌ Erro ao criar instância (forma 3):', error.message);
      }
    }
  }
  
} catch (error) {
  console.error('❌ Erro geral:', error.message);
  console.error('Stack:', error.stack);
}

console.log('🏁 Teste concluído');
