const fs = require('fs');
const path = require('path');

// Script para popular o banco de dados com os JSONs antes do build
console.log('🚀 Iniciando população do banco de dados...');

// Caminhos dos arquivos
const assetsPath = path.join(__dirname, '../assets/data');
const outputPath = path.join(__dirname, '../src/data');

// Verificar se a pasta assets/data existe
if (!fs.existsSync(assetsPath)) {
  console.error('❌ Pasta assets/data não encontrada!');
  process.exit(1);
}

// Criar pasta de destino se não existir
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// Função para processar séries
function processSeriesData() {
  try {
    const seriesData = JSON.parse(fs.readFileSync(path.join(assetsPath, 'pokemon_series.json'), 'utf8'));
    
    // Processar séries diretamente do arquivo
    const processedSeries = seriesData.map(series => ({
      id: series.id,
      name: series.name,
      logo: series.logo || '',
      releaseDate: series.releaseDate || new Date().toISOString()
    }));

    fs.writeFileSync(
      path.join(outputPath, 'series.json'),
      JSON.stringify(processedSeries, null, 2)
    );
    
    console.log(`✅ Processadas ${processedSeries.length} séries`);
    return processedSeries;
  } catch (error) {
    console.error('❌ Erro ao processar séries:', error.message);
    return [];
  }
}

// Função para processar sets
function processSetsData() {
  try {
    const setsData = JSON.parse(fs.readFileSync(path.join(assetsPath, 'pokemon_sets.json'), 'utf8'));
    
    const processedSets = setsData.map(item => ({
      id: item.id,
      name: item.name,
      series: item.series || 'base', // Default para base se não tiver
      releaseDate: item.releaseDate || new Date().toISOString(),
      totalCards: item.cardCount?.total || item.cardCount?.official || 0,
      symbol: item.symbol || '',
      logo: item.logo || ''
    }));

    fs.writeFileSync(
      path.join(outputPath, 'sets.json'),
      JSON.stringify(processedSets, null, 2)
    );
    
    console.log(`✅ Processados ${processedSets.length} sets`);
    return processedSets;
  } catch (error) {
    console.error('❌ Erro ao processar sets:', error.message);
    return [];
  }
}

// Função para processar cards
function processCardsData() {
  try {
    const cardsData = JSON.parse(fs.readFileSync(path.join(assetsPath, 'pokemon_cards_detailed.json'), 'utf8'));
    
    const processedCards = cardsData.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image || item.images?.large || item.images?.small || '',
      rarity: item.rarity || 'Unknown',
      set: item.set?.id || 'Unknown',
      series: item.set?.series || 'Unknown',
      price: extractPrice(item.cardmarket?.prices),
      hp: extractHP(item.hp),
      types: extractTypes(item.types),
      attacks: extractAttacks(item.attacks),
      weaknesses: extractWeaknesses(item.weaknesses),
      resistances: extractResistances(item.resistances),
      lastUpdated: new Date().toISOString()
    }));

    // Salvar arquivo único de cards (mais simples para React Native)
    fs.writeFileSync(
      path.join(outputPath, 'cards.json'),
      JSON.stringify(processedCards, null, 2)
    );

    // Salvar arquivo de índice
    const indexData = {
      totalCards: processedCards.length,
      chunks: 1, // Agora é apenas 1 arquivo
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(outputPath, 'cards_index.json'),
      JSON.stringify(indexData, null, 2)
    );
    
    console.log(`✅ Processados ${processedCards.length} cards em ${indexData.chunks} chunks`);
    return processedCards;
  } catch (error) {
    console.error('❌ Erro ao processar cards:', error.message);
    return [];
  }
}

// Funções auxiliares
function extractPrice(prices) {
  if (!prices) return 0;
  return prices.low || prices.mid || prices.high || prices.market || prices.directLow || 0;
}

function extractHP(hp) {
  if (typeof hp === 'string') {
    const match = hp.match(/\d+/);
    return match ? parseInt(match[0]) : undefined;
  }
  return typeof hp === 'number' ? hp : undefined;
}

function extractTypes(types) {
  return Array.isArray(types) ? types : [];
}

function extractAttacks(attacks) {
  if (!Array.isArray(attacks)) return [];
  return attacks.map(attack => ({
    name: attack.name || '',
    cost: attack.cost || [],
    damage: attack.damage || undefined,
    text: attack.text || undefined
  }));
}

function extractWeaknesses(weaknesses) {
  if (!Array.isArray(weaknesses)) return [];
  return weaknesses.map(weakness => ({
    type: weakness.type || '',
    value: weakness.value || ''
  }));
}

function extractResistances(resistances) {
  if (!Array.isArray(resistances)) return [];
  return resistances.map(resistance => ({
    type: resistance.type || '',
    value: resistance.value || ''
  }));
}

// Executar processamento
async function main() {
  console.log('📊 Processando dados dos JSONs...');
  
  const series = processSeriesData();
  const sets = processSetsData();
  const cards = processCardsData();
  
  // Criar arquivo de estatísticas
  const stats = {
    series: series.length,
    sets: sets.length,
    cards: cards.length,
    processedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  fs.writeFileSync(
    path.join(outputPath, 'stats.json'),
    JSON.stringify(stats, null, 2)
  );
  
  console.log('📈 Estatísticas:');
  console.log(`   - Séries: ${stats.series}`);
  console.log(`   - Sets: ${stats.sets}`);
  console.log(`   - Cards: ${stats.cards}`);
  console.log(`   - Processado em: ${stats.processedAt}`);
  
  console.log('✅ Banco de dados populado com sucesso!');
  console.log(`📁 Dados salvos em: ${outputPath}`);
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
