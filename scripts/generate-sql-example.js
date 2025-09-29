const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos JSON
const dataPath = path.join(__dirname, '../assets/data');
const outputPath = path.join(__dirname, '../sql-example.sql');

// Função para escapar strings SQL
function escapeSqlString(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Função para extrair localId do card ID
function extractLocalId(cardId) {
  const match = cardId.match(/-(\d+)$/);
  if (match) {
    const num = parseInt(match[1]);
    return num.toString().padStart(3, '0');
  }
  return null;
}

// Função para inferir série do set ID
function inferSeriesFromSetId(setId) {
  // Mapeamento mais completo baseado nos padrões reais
  if (setId.startsWith('base')) return 'base';
  if (setId.startsWith('jungle')) return 'base';
  if (setId.startsWith('fossil')) return 'base';
  if (setId.startsWith('team_rocket')) return 'base';
  if (setId.startsWith('gym_')) return 'base';
  if (setId.startsWith('neo_')) return 'neo';
  if (setId.startsWith('ex')) return 'ex';
  if (setId.startsWith('dp')) return 'dp';
  if (setId.startsWith('pl')) return 'pl';
  if (setId.startsWith('hgss')) return 'hgss';
  if (setId.startsWith('col')) return 'col';
  if (setId.startsWith('bw')) return 'bw';
  if (setId.startsWith('xy')) return 'xy';
  if (setId.startsWith('sm')) return 'sm';
  if (setId.startsWith('swsh')) return 'swsh';
  if (setId.startsWith('sv')) return 'sv';
  
  // Fallback para padrões específicos
  const seriesMap = {
    'base1': 'base', 'base2': 'base', 'base3': 'base', 'base4': 'base',
    'ex1': 'ex', 'ex2': 'ex', 'ex3': 'ex', 'ex4': 'ex', 'ex5': 'ex',
    'ex6': 'ex', 'ex7': 'ex', 'ex8': 'ex', 'ex9': 'ex', 'ex10': 'ex',
    'ex11': 'ex', 'ex12': 'ex', 'ex13': 'ex', 'ex14': 'ex', 'ex15': 'ex',
    'dp1': 'dp', 'dp2': 'dp', 'dp3': 'dp', 'dp4': 'dp', 'dp5': 'dp',
    'dp6': 'dp', 'dp7': 'dp', 'dp8': 'dp', 'dp9': 'dp', 'dp10': 'dp',
    'pl1': 'pl', 'pl2': 'pl', 'pl3': 'pl', 'pl4': 'pl', 'pl5': 'pl',
    'hgss1': 'hgss', 'hgss2': 'hgss', 'hgss3': 'hgss', 'hgss4': 'hgss',
    'col1': 'col',
    'bw1': 'bw', 'bw2': 'bw', 'bw3': 'bw', 'bw4': 'bw', 'bw5': 'bw',
    'bw6': 'bw', 'bw7': 'bw', 'bw8': 'bw', 'bw9': 'bw', 'bw10': 'bw',
    'xy1': 'xy', 'xy2': 'xy', 'xy3': 'xy', 'xy4': 'xy', 'xy5': 'xy',
    'xy6': 'xy', 'xy7': 'xy', 'xy8': 'xy', 'xy9': 'xy', 'xy10': 'xy',
    'xy11': 'xy', 'xy12': 'xy',
    'sm1': 'sm', 'sm2': 'sm', 'sm3': 'sm', 'sm4': 'sm', 'sm5': 'sm',
    'sm6': 'sm', 'sm7': 'sm', 'sm8': 'sm', 'sm9': 'sm', 'sm10': 'sm',
    'sm11': 'sm', 'sm12': 'sm',
    'swsh1': 'swsh', 'swsh2': 'swsh', 'swsh3': 'swsh', 'swsh4': 'swsh',
    'swsh5': 'swsh', 'swsh6': 'swsh', 'swsh7': 'swsh', 'swsh8': 'swsh',
    'swsh9': 'swsh', 'swsh10': 'swsh', 'swsh11': 'swsh', 'swsh12': 'swsh',
    'sv1': 'sv', 'sv2': 'sv', 'sv3': 'sv', 'sv4': 'sv', 'sv5': 'sv',
    'sv6': 'sv', 'sv7': 'sv', 'sv8': 'sv', 'sv9': 'sv', 'sv10': 'sv'
  };
  
  return seriesMap[setId] || 'unknown';
}

async function generateSqlExample() {
  console.log('🔄 Gerando arquivo SQL de exemplo...');
  
  let sql = `-- Arquivo SQL de exemplo gerado automaticamente
-- Este arquivo mostra como os dados dos JSONs são processados

-- Criar tabelas
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  last_updated TEXT
);

CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  release_date TEXT,
  card_count INTEGER,
  series_id TEXT NOT NULL,
  last_updated TEXT,
  FOREIGN KEY (series_id) REFERENCES series (id)
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  rarity TEXT,
  set_id TEXT NOT NULL,
  series_id TEXT NOT NULL,
  price REAL,
  hp INTEGER,
  local_id TEXT,
  types TEXT,
  attacks TEXT,
  weaknesses TEXT,
  resistances TEXT,
  category TEXT,
  illustrator TEXT,
  dex_id TEXT,
  stage TEXT,
  retreat INTEGER,
  legal TEXT,
  variants TEXT,
  variants_detailed TEXT,
  updated TEXT,
  last_updated TEXT,
  FOREIGN KEY (set_id) REFERENCES sets (id),
  FOREIGN KEY (series_id) REFERENCES series (id)
);

-- Inserir dados de exemplo (primeiras 10 cartas de cada categoria)
`;

  try {
    // Ler arquivos JSON
    const seriesData = JSON.parse(fs.readFileSync(path.join(dataPath, 'pokemon_series.json'), 'utf8'));
    const setsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'pokemon_sets.json'), 'utf8'));
    const cardsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'pokemon_cards_detailed.json'), 'utf8'));

    console.log(`📊 Dados carregados:`);
    console.log(`  - ${seriesData.length} séries`);
    console.log(`  - ${setsData.length} sets`);
    console.log(`  - ${cardsData.length} cartas`);

    // Inserir séries (primeiras 5)
    sql += `\n-- Inserir séries (exemplo)\n`;
    seriesData.slice(0, 5).forEach(series => {
      sql += `INSERT OR REPLACE INTO series (id, name, logo, last_updated) VALUES (${escapeSqlString(series.id)}, ${escapeSqlString(series.name)}, ${escapeSqlString(series.logo)}, '${new Date().toISOString()}');\n`;
    });

    // Inserir sets (primeiros 10)
    sql += `\n-- Inserir sets (exemplo)\n`;
    setsData.slice(0, 10).forEach(set => {
      const seriesId = inferSeriesFromSetId(set.id);
      const logo = set.symbol || set.logo || null; // Usar symbol se disponível
      const releaseDate = set.releaseDate || null; // Pode ser null
      const cardCount = set.cardCount?.total || set.cardCount?.official || 0;
      
      sql += `INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES (${escapeSqlString(set.id)}, ${escapeSqlString(set.name)}, ${escapeSqlString(logo)}, ${escapeSqlString(releaseDate)}, ${cardCount}, ${escapeSqlString(seriesId)}, '${new Date().toISOString()}');\n`;
    });

    // Inserir cartas (primeiras 20)
    sql += `\n-- Inserir cartas (exemplo)\n`;
    cardsData.slice(0, 20).forEach(card => {
      const setId = card.set?.id || 'unknown';
      const seriesId = inferSeriesFromSetId(setId);
      const localId = card.localId || extractLocalId(card.id);
      
      sql += `INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        ${escapeSqlString(card.id)},
        ${escapeSqlString(card.name)},
        ${escapeSqlString(card.image)},
        ${escapeSqlString(card.rarity)},
        ${escapeSqlString(setId)},
        ${escapeSqlString(seriesId)},
        ${card.cardmarket?.prices?.averageSellPrice || 'NULL'},
        ${card.hp || 'NULL'},
        ${escapeSqlString(localId)},
        ${escapeSqlString(JSON.stringify(card.types || []))},
        ${escapeSqlString(JSON.stringify(card.attacks || []))},
        ${escapeSqlString(JSON.stringify(card.weaknesses || []))},
        ${escapeSqlString(JSON.stringify(card.resistances || []))},
        ${escapeSqlString(card.category)},
        ${escapeSqlString(card.illustrator)},
        ${escapeSqlString(JSON.stringify(card.dexId || []))},
        ${escapeSqlString(card.stage)},
        ${card.retreat || 'NULL'},
        ${escapeSqlString(JSON.stringify(card.legal || {}))},
        ${escapeSqlString(JSON.stringify(card.variants || {}))},
        ${escapeSqlString(JSON.stringify(card.variants_detailed || []))},
        ${escapeSqlString(card.updated)},
        '${new Date().toISOString()}'
      );\n`;
    });

    // Salvar arquivo
    fs.writeFileSync(outputPath, sql);
    
    console.log(`✅ Arquivo SQL gerado: ${outputPath}`);
    console.log(`📊 Exemplo contém:`);
    console.log(`  - ${Math.min(5, seriesData.length)} séries`);
    console.log(`  - ${Math.min(10, setsData.length)} sets`);
    console.log(`  - ${Math.min(20, cardsData.length)} cartas`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar SQL:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateSqlExample();
}

module.exports = { generateSqlExample };
