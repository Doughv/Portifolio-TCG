# Guia de Desenvolvimento - Pokémon TCG App

## 🏗️ Estrutura do Projeto

```
PokemonTCGNew/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── screens/            # Telas da aplicação
│   ├── services/           # Serviços e lógica de negócio
│   └── data/              # JSONs processados
├── assets/
│   └── data/              # Dados brutos da API
├── scripts/
│   └── populate-database.js # Script de processamento
└── docs/                  # Documentação
```

## 🔧 Serviços Detalhados

### TCGdexService
```typescript
// Configuração dinâmica de idioma
constructor(language: string = 'pt')
initializeSDK(language: string)

// Métodos principais
getSeries(): Serie[]
getSetsBySeries(seriesId: string): Set[]
getCardsBySet(setId: string): Card[]

// Inferência de relacionamentos
private inferSeriesFromSetId(setId: string): string
```

### DatabaseService
```typescript
// Operações CRUD
insertSeries(series: Serie[])
insertSets(sets: Set[])
insertCards(cards: Card[])

// Consultas relacionais
getSetsBySeries(seriesId: string): Set[]
getCardsBySet(setId: string): Card[]
getAllSeries(): Serie[]
```

### FilterService
```typescript
// Gerenciamento de filtros
loadSettings(): Promise<void>
saveSettings(): Promise<void>
getFilteredSeries(): Serie[]
getFilteredSetsBySeries(seriesId: string): Set[]
getFilteredCardsBySet(setId: string): Card[]
```

## 🗄️ Schema do Banco de Dados

### Tabela: series
```sql
CREATE TABLE series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: sets
```sql
CREATE TABLE sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  series_id TEXT NOT NULL,
  card_count_total INTEGER DEFAULT 0,
  card_count_official INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id)
);
```

### Tabela: cards
```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  set_id TEXT NOT NULL,
  image_url TEXT,
  hp INTEGER,
  types TEXT, -- JSON array
  rarity TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (set_id) REFERENCES sets(id)
);
```

## 🔄 Fluxo de Inferência de Séries

### Função `inferSeriesFromId`
```javascript
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
  
  // Sets especiais
  if (setId.startsWith('col')) return 'col';  // Chamado das Lendas
  if (setId.startsWith('dv')) return 'bw';   // Cofre do Dragão
  if (setId.startsWith('dc')) return 'base'; // Desafio dos Campeões
  if (setId.startsWith('g')) return 'base';  // Gym
  if (setId.startsWith('det')) return 'sm';  // Detective Pikachu
  if (setId.startsWith('cel')) return 'sm';  // Celestial Storm
  if (setId.startsWith('A')) return 'tcgp';  // Pokémon Estampas Ilustradas Pocket
  if (setId.startsWith('P-')) return 'base'; // Sets promocionais
  
  return 'base'; // Padrão
}
```

## 🐛 Debugging e Troubleshooting

### Problemas Comuns

#### 1. Relacionamentos Incorretos
```bash
# Verificar dados no banco
LOG Selecionando todas as séries por padrão: 11
LOG Carregando expansões da série bw...
LOG Sets encontrados via DatabaseService: 0
```

**Solução**: Verificar se `inferSeriesFromId` está mapeando corretamente

#### 2. Timeouts na API
```bash
ERROR Request failed with status code 504
```

**Solução**: Implementado timeout de 10s e fallback para banco local

#### 3. Chaves Duplicadas
```bash
ERROR Encountered two children with the same key
```

**Solução**: Usar `keyExtractor` único:
```typescript
keyExtractor={(item) => `series-${item.id}`}
keyExtractor={(item) => `expansion-${item.seriesId}-${item.id}`}
```

### Comandos de Debug

```bash
# Reset completo do banco
Botão "Reset Banco (SDK → JSON)" na LanguageConfigScreen

# Ver dados brutos
Botão "Dados Brutos" na LanguageConfigScreen

# Testar SDK
Botão "Testar SDK" na LanguageConfigScreen
```

## 📊 Análise de Dados

### Estrutura dos JSONs Originais
```json
// assets/data/pokemon_series.json
{
  "id": "base",
  "name": "Coleção Básica"
}

// assets/data/pokemon_sets.json  
{
  "id": "base1",
  "name": "Coleção Básica",
  "series": "base", // Pode estar incorreto
  "cardCount": {
    "total": 102,
    "official": 102
  }
}

// assets/data/pokemon_cards_detailed.json
{
  "id": "base1-1",
  "name": "Alakazam",
  "set": "base1", // Inferir setId do ID
  "image": {
    "small": "https://assets.tcgdx.net/v2/cards/base1-1.png"
  }
}
```

## 🔄 Processo de Migração

### 1. Processamento dos JSONs
```bash
node scripts/populate-database.js
```

### 2. Geração dos Dados Otimizados
- `src/data/series.json`
- `src/data/sets.json` 
- `src/data/cards.json`

### 3. Migração para SQLite
```typescript
await TCGdexService.migrateFromJSONs()
```

### 4. Verificação dos Relacionamentos
```typescript
// Verificar se séries têm sets
const sets = await DatabaseService.getSetsBySeries('base')

// Verificar se sets têm cartas  
const cards = await DatabaseService.getCardsBySet('base1')
```

## 🚀 Performance

### Otimizações Implementadas
- **Lazy loading** de imagens
- **Cache local** de dados
- **Consultas SQL otimizadas**
- **Fallback para API** apenas quando necessário

### Métricas de Performance
- Carregamento inicial: ~2-3s
- Navegação entre telas: <500ms
- Download de imagens: Background
- Sincronização API: ~10s timeout

## 🔐 Configurações

### AsyncStorage Keys
```typescript
const KEYS = {
  SELECTED_LANGUAGE: 'selectedLanguage',
  SELECTED_SERIES: 'selectedSeries',
  SELECTED_EXPANSIONS: 'selectedExpansions'
}
```

### Configurações Padrão
```typescript
const DEFAULT_CONFIG = {
  language: 'pt',
  selectedSeries: 'all', // ou array de IDs
  selectedExpansions: 'all' // ou array de IDs
}
```

## 📱 Build e Deploy

### EAS Configuration
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

### Scripts NPM
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android", 
    "ios": "expo start --ios",
    "build:android": "eas build --platform android",
    "populate": "node scripts/populate-database.js"
  }
}
```

## 🧪 Testes

### Testes Manuais
1. **Reset do banco** → Verificar população
2. **Seleção de filtros** → Verificar persistência
3. **Navegação** → Verificar performance
4. **Download de imagens** → Verificar cache

### Pontos de Teste
- [ ] Migração inicial funciona
- [ ] Relacionamentos corretos
- [ ] Filtros persistem
- [ ] Imagens baixam
- [ ] API fallback funciona
- [ ] Performance aceitável

---

**Última Atualização**: Dezembro 2024  
**Versão**: 1.0.0  
**Status**: Em desenvolvimento ativo
