const fs = require('fs');
const path = require('path');

// Script para popular o banco de dados com os JSONs antes do build
console.log('🚀 Iniciando população do banco de dados...');

// Função para inferir série baseada no ID do set
function inferSeriesFromId(setId) {
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
  
  // Sets especiais - inferir baseado no contexto
  if (setId.startsWith('col')) return 'col';  // Chamado das Lendas
  if (setId.startsWith('dv')) return 'bw';   // Cofre do Dragão (Black & White)
  if (setId.startsWith('dc')) return 'base'; // Desafio dos Campeões (Base)
  if (setId.startsWith('g')) return 'base';  // Gym (Base)
  if (setId.startsWith('det')) return 'sm';  // Detective Pikachu (Sol e Lua)
  if (setId.startsWith('cel')) return 'sm';  // Celestial Storm (Sol e Lua)
  if (setId.startsWith('A')) return 'tcgp';  // Sets especiais (Pokémon Estampas Ilustradas Pocket)
  if (setId.startsWith('P-')) return 'base'; // Sets promocionais (Base)
  
  console.warn(`⚠️ Não foi possível inferir série para o set ${setId}, usando 'base' como padrão`);
  return 'base';
}

// Caminhos dos arquivos
const assetsPath = path.join(__dirname, '../assets/data');
const outputPath = path.join(__dirname, '../src/data');
const tempPath = '/tmp/pokemon_api_data';

// Verificar se há dados temporários da API
function getDataPath() {
  if (fs.existsSync(tempPath)) {
    console.log('🔄 Usando dados temporários da API...');
    return tempPath;
  } else {
    console.log('📁 Usando dados locais...');
    return assetsPath;
  }
}

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
    const dataPath = getDataPath();
    const seriesData = JSON.parse(fs.readFileSync(path.join(dataPath, 'pokemon_series.json'), 'utf8'));
    
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
    const dataPath = getDataPath();
    const setsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'pokemon_sets.json'), 'utf8'));
    
    const processedSets = setsData.map(item => ({
      id: item.id,
      name: item.name,
      series: item.series || inferSeriesFromId(item.id), // Inferir série do ID
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
    const dataPath = getDataPath();
    const cardsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'pokemon_cards_detailed.json'), 'utf8'));
    
    const processedCards = cardsData.map(item => {
      // Inferir set e série baseado no ID do card
      // bw1-1 → set "bw1" → série "bw"
      // base1-1 → set "base1" → série "base"
      let setId = item.set?.id || 'Unknown';
      let seriesId = item.set?.series || 'Unknown';
      
      // Se não tem set definido, tentar inferir do ID do card
      if (setId === 'Unknown' && item.id) {
        // bw1-1 → bw1
        // base1-1 → base1
        const parts = item.id.split('-');
        if (parts.length >= 2) {
          setId = parts[0]; // bw1, base1, etc.
        }
      }
      
      // Se não tem série definida, inferir do set
      if (seriesId === 'Unknown' && setId !== 'Unknown') {
        seriesId = inferSeriesFromId(setId);
      }
      
      return {
        id: item.id,
        name: item.name,
        image: item.image || item.images?.large || item.images?.small || '',
        rarity: item.rarity || 'Unknown',
        set: setId,
        series: seriesId,
        price: extractPrice(item.cardmarket?.prices),
        hp: extractHP(item.hp),
        types: extractTypes(item.types),
        attacks: extractAttacks(item.attacks),
        weaknesses: extractWeaknesses(item.weaknesses),
        resistances: extractResistances(item.resistances),
        lastUpdated: new Date().toISOString()
      };
    });

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
