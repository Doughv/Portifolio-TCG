# Guia de Desenvolvimento - Pokémon TCG App

## 🏗️ Estrutura do Projeto

```
Portifolio-TCG/
├── src/
│   ├── screens/            # Telas da aplicação
│   │   ├── MainScreen.tsx
│   │   ├── LanguageConfigScreen.tsx
│   │   ├── SeriesScreen.tsx
│   │   ├── SetsScreen.tsx
│   │   ├── CardsScreen.tsx
│   │   ├── CardDetailScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── DownloadsScreen.tsx
│   ├── services/           # Serviços e lógica de negócio
│   │   ├── TCGdexService.ts
│   │   ├── DatabaseService.ts
│   │   ├── FilterService.ts
│   │   ├── CacheService.ts
│   │   ├── ImageDownloadService.ts
│   │   ├── JSONDataService.ts
│   │   ├── OptimizedStorageService.ts
│   │   ├── PreloadedDataService.ts
│   │   └── SyncService.ts
│   ├── data/              # JSONs processados
│   │   ├── series.json
│   │   ├── sets.json
│   │   ├── cards.json
│   │   ├── cards_index.json
│   │   └── stats.json
│   └── polyfills.ts       # Polyfills para React Native
├── assets/
│   ├── data/              # Dados brutos da API
│   │   ├── pokemon_series.json
│   │   ├── pokemon_sets.json
│   │   └── pokemon_cards_detailed.json
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
├── scripts/
│   └── populate-database.js # Script de processamento
├── docs/
│   └── DEVELOPMENT.md     # Este arquivo
├── App.tsx               # Componente principal
├── app.json              # Configuração Expo
├── eas.json              # Configuração EAS Build
└── package.json          # Dependências
```

## 🔧 Serviços Detalhados

### TCGdexService
```typescript
// Configuração dinâmica de idioma (fixo em português)
constructor(language: string = 'pt')
async initializeSDK(language: string): Promise<void>
async setLanguage(language: string): Promise<void>

// Métodos principais
async getSeries(): Promise<PokemonSeries[]>
async getSetsBySeries(seriesId: string): Promise<PokemonSet[]>
async getCardsBySet(setId: string): Promise<PokemonCard[]>

// Migração e sincronização
async migrateFromJSONs(): Promise<{success: boolean; message: string; stats: any}>
async syncUpdatesOnly(): Promise<{success: boolean; message: string; stats: any}>
async checkForUpdates(): Promise<{hasUpdates: boolean; lastUpdate?: string; newSeries?: number; newSets?: number; newCards?: number}>

// Inferência de relacionamentos
private inferSeriesFromSetId(setId: string): string

// Busca e detalhes
async searchCards(query: string): Promise<PokemonCard[]>
async getCardDetailsFromAPI(cardId: string): Promise<any>
async getSetDetailsFromAPI(setId: string): Promise<any>
async getStats(): Promise<any>
```

### DatabaseService
```typescript
// Inicialização
async initialize(): Promise<void>
private async createTables(): Promise<void>

// Operações CRUD para Series
async insertSeries(series: PokemonSeries): Promise<void>
async getAllSeries(): Promise<PokemonSeries[]>

// Operações CRUD para Sets
async insertSet(set: PokemonSet): Promise<void>
async getSetsBySeries(seriesId: string): Promise<PokemonSet[]>
async getAllSets(): Promise<PokemonSet[]>

// Operações CRUD para Cards
async insertCard(card: PokemonCard): Promise<void>
async getCardsBySet(setId: string): Promise<PokemonCard[]>
async getAllCards(): Promise<PokemonCard[]>
async updateCardsBatch(cards: PokemonCard[]): Promise<void>

// Busca e estatísticas
async searchCards(query: string): Promise<PokemonCard[]>
async getStats(): Promise<{series: number; sets: number; cards: number}>
async needsUpdate(lastCheck: string): Promise<boolean>

// Manutenção
async clearAllData(): Promise<void>
async close(): Promise<void>
```

### FilterService
```typescript
// Gerenciamento de filtros por idioma
async loadSettings(language: string): Promise<void>
async clearAllFilters(): Promise<void>

// Obtenção de dados filtrados
async getFilteredSeries(): Promise<PokemonSeries[]>
async getFilteredSetsBySeries(seriesId: string): Promise<PokemonSet[]>
async getFilteredCardsBySet(setId: string): Promise<PokemonCard[]>

// Informações sobre filtros
hasActiveFilters(): boolean
getFilterInfo(): {seriesCount: number; expansionsCount: number; hasFilters: boolean}
```

### Outros Serviços
- **CacheService**: Gerenciamento de cache local
- **ImageDownloadService**: Download e cache de imagens
- **JSONDataService**: Processamento de dados JSON
- **OptimizedStorageService**: Armazenamento otimizado
- **PreloadedDataService**: Dados pré-carregados
- **SyncService**: Sincronização com API

## 🗄️ Schema do Banco de Dados

### Tabela: series
```sql
CREATE TABLE series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  total_sets INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: sets
```sql
CREATE TABLE sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  series_id TEXT NOT NULL,
  release_date TEXT,
  total_cards INTEGER DEFAULT 0,
  symbol TEXT,
  logo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series (id)
);
```

### Tabela: cards
```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  rarity TEXT,
  set_id TEXT NOT NULL,
  series_id TEXT NOT NULL,
  price REAL DEFAULT 0,
  hp INTEGER,
  types TEXT, -- JSON array
  attacks TEXT, -- JSON array
  weaknesses TEXT, -- JSON array
  resistances TEXT, -- JSON array
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (set_id) REFERENCES sets (id),
  FOREIGN KEY (series_id) REFERENCES series (id)
);
```

### Índices para Performance
```sql
CREATE INDEX idx_cards_set_id ON cards (set_id);
CREATE INDEX idx_cards_series_id ON cards (series_id);
CREATE INDEX idx_cards_rarity ON cards (rarity);
CREATE INDEX idx_cards_price ON cards (price);
```

### Interfaces TypeScript
```typescript
export interface PokemonCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  set: string;
  series: string;
  price: number;
  lastUpdated: string;
  hp?: number;
  types?: string[];
  attacks?: Array<{
    name: string;
    cost: string[];
    damage?: string;
    text?: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
}

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  totalCards: number;
  symbol: string;
  logo: string;
}

export interface PokemonSeries {
  id: string;
  name: string;
  logo: string;
  totalSets: number;
}
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

### Problemas Comuns e Soluções

#### 1. Relacionamentos Incorretos entre Séries e Sets
```bash
# Sintoma: Sets não aparecem para uma série
LOG Carregando expansões da série bw...
LOG Sets encontrados via DatabaseService: 0
```

**Causa**: Função `inferSeriesFromSetId` não está mapeando corretamente os IDs dos sets para as séries.

**Solução**: 
- Verificar se o `series_id` está correto na tabela `sets`
- Usar função de debug na `LanguageConfigScreen` → "Debug Sets"
- Resetar banco se necessário: "Reset Banco (SDK → JSON)"

#### 2. Timeouts na API TCGdx
```bash
ERROR Request failed with status code 504
ERROR Não foi possível inicializar o SDK TCGdx
```

**Solução**: 
- App usa fallback automático para banco local
- Implementado timeout de 10s
- Migração dos JSONs garante dados offline

#### 3. Chaves Duplicadas no FlatList
```bash
ERROR Encountered two children with the same key
```

**Solução**: Usar `keyExtractor` único:
```typescript
keyExtractor={(item) => `series-${item.id}`}
keyExtractor={(item) => `expansion-${item.seriesId}-${item.id}`}
keyExtractor={(item) => `card-${item.id}`}
```

#### 4. Dados em Inglês Aparecendo
```bash
# Sintoma: Séries aparecem como "Black & White" em vez de "Preto e Branco"
LOG SDK retorna dados em INGLÊS (Black & White, etc.)
```

**Causa**: SDK não está configurado corretamente para português.

**Solução**:
- App está configurado para português fixo (`pt`)
- Usar dados dos JSONs processados (já em português)
- Resetar banco para usar apenas dados locais

#### 5. Banco Vazio na Primeira Execução
```bash
LOG No data in database, migrating from JSONs...
LOG Migration successful: X séries, Y sets e Z cards migrados
```

**Solução**: Normal - migração automática acontece na primeira execução.

### Comandos de Debug Disponíveis

#### Na LanguageConfigScreen:
1. **"Ver Banco"** - Mostra estatísticas do banco
2. **"Testar SDK"** - Compara SDK vs banco
3. **"Reset Banco (SDK → JSON)"** - Limpa e recarrega dados
4. **"Debug Sets"** - Analisa relacionamentos série-set
5. **"Dados Brutos"** - Mostra dados dos JSONs vs banco

#### Via Console:
```typescript
// Verificar estatísticas
const stats = await DatabaseService.getStats()
console.log('Stats:', stats)

// Verificar séries
const series = await DatabaseService.getAllSeries()
console.log('Series:', series.length)

// Verificar sets de uma série
const sets = await DatabaseService.getSetsBySeries('base')
console.log('Sets para base:', sets.length)

// Verificar cards de um set
const cards = await DatabaseService.getCardsBySet('base1')
console.log('Cards para base1:', cards.length)
```

### Fluxo de Debug Recomendado

1. **Verificar se há dados**: Usar "Ver Banco"
2. **Se banco vazio**: Usar "Reset Banco"
3. **Se sets não aparecem**: Usar "Debug Sets"
4. **Se dados em inglês**: Usar "Testar SDK" para comparar
5. **Se problemas persistem**: Usar "Dados Brutos" para análise completa

### Logs Importantes para Monitorar

```bash
# Inicialização
LOG Initializing app...
LOG Database initialized
LOG App configurado para português brasileiro

# Migração
LOG No data in database, migrating from JSONs...
LOG Migration successful: X séries, Y sets e Z cards migrados

# Carregamento de dados
LOG Carregando expansões da série X...
LOG Sets encontrados via DatabaseService: Y
LOG Cards encontrados no banco: Z

# Erros críticos
ERROR Error initializing database
ERROR Migration failed
ERROR SDK não inicializado
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

## 🔄 Processo de Migração e Scripts

### Scripts NPM Disponíveis
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "populate-db": "node scripts/populate-database.js",
    "build-with-data": "npm run populate-db && expo build",
    "build-preview": "npx eas build --platform android --profile preview",
    "build-dev": "npx eas build --platform android --profile development",
    "build-production": "npx eas build --platform android --profile production",
    "commit-and-build": "git add . && git commit -m \"Build update\" && npm run build-preview"
  }
}
```

### 1. Processamento dos JSONs
```bash
# Processar dados brutos para JSONs otimizados
npm run populate-db
# ou diretamente:
node scripts/populate-database.js
```

**O que o script faz:**
- Lê dados de `assets/data/` (dados brutos da API)
- Processa e otimiza os dados
- Salva em `src/data/` (JSONs processados)
- Gera arquivos: `series.json`, `sets.json`, `cards.json`, `cards_index.json`, `stats.json`

### 2. Migração Automática para SQLite
```typescript
// Migração automática na inicialização do app
await TCGdexService.migrateFromJSONs()
```

**Fluxo de migração:**
1. Verifica se há dados no banco
2. Se vazio, migra dos JSONs processados
3. Insere séries, sets e cards em lotes
4. Estabelece relacionamentos corretos

### 3. Verificação dos Relacionamentos
```typescript
// Verificar estatísticas do banco
const stats = await DatabaseService.getStats()
console.log(`Séries: ${stats.series}, Sets: ${stats.sets}, Cards: ${stats.cards}`)

// Verificar se séries têm sets
const sets = await DatabaseService.getSetsBySeries('base')

// Verificar se sets têm cartas  
const cards = await DatabaseService.getCardsBySet('base1')
```

### 4. Debug e Troubleshooting
```typescript
// Reset completo do banco
await DatabaseService.clearAllData()
await TCGdexService.migrateFromJSONs()

// Verificar dados brutos
const seriesData = require('../data/series.json')
const setsData = require('../data/sets.json')
const cardsData = require('../data/cards.json')
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

## 🔐 Configurações e Estado Atual

### AsyncStorage Keys
```typescript
// Chaves específicas por idioma
const KEYS = {
  SELECTED_LANGUAGE: 'selectedLanguage',
  SELECTED_SERIES: `selectedSeries_${language}`, // Ex: selectedSeries_pt
  SELECTED_EXPANSIONS: `selectedExpansions_${language}` // Ex: selectedExpansions_pt
}
```

### Configurações Padrão
```typescript
const DEFAULT_CONFIG = {
  language: 'pt', // Fixo em português brasileiro
  selectedSeries: [], // Array vazio = todas as séries selecionadas
  selectedExpansions: [] // Array vazio = todas as expansões selecionadas
}
```

### Estado Atual do Projeto (Dezembro 2024)

#### ✅ Funcionalidades Implementadas
- **Banco SQLite** com relacionamentos corretos
- **Migração automática** dos JSONs na primeira execução
- **Filtros por série e expansão** com persistência
- **Interface em português** fixo
- **Debug tools** integrados na LanguageConfigScreen
- **Fallback offline** quando API falha
- **Hot reload** funcionando
- **Build EAS** configurado

#### 🔧 Arquitetura Atual
- **App.tsx**: Inicialização e navegação
- **MainScreen**: Tela principal com botões de navegação
- **LanguageConfigScreen**: Configurações e debug tools
- **DatabaseService**: Operações SQLite com relacionamentos
- **TCGdexService**: SDK + migração + sincronização
- **FilterService**: Filtros por idioma com AsyncStorage

#### 📊 Dados Disponíveis
- **Séries**: ~11 séries principais (Base, EX, DP, PL, HGSS, BW, XY, SM, SWSH, SV, etc.)
- **Sets**: ~200+ expansões
- **Cards**: ~20.000+ cartas com detalhes completos
- **Idioma**: Português brasileiro (dados processados)

#### 🚀 Próximos Passos Sugeridos
1. **Implementar telas restantes** (SeriesScreen, SetsScreen, CardsScreen, CardDetailScreen)
2. **Adicionar busca de cartas** com filtros avançados
3. **Implementar download de imagens** em background
4. **Adicionar favoritos** e coleção pessoal
5. **Otimizar performance** para grandes volumes de dados

## 📱 Build e Deploy

### EAS Configuration (eas.json)
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "Pokémon TCG Collection",
    "slug": "pokemon-tcg-collection",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pokemontcg.collection"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.pokemontcg.collection",
      "versionCode": 1,
      "permissions": [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.INTERNET",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.WAKE_LOCK"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-sqlite",
      "expo-file-system",
      "expo-background-fetch"
    ],
    "extra": {
      "eas": {
        "projectId": "351e375e-db71-44e0-8ba4-72a6eb000c72"
      }
    },
    "owner": "wieira"
  }
}
```

### Dependências Principais
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.1.17",
    "@react-navigation/stack": "^7.4.8",
    "@tcgdx/sdk": "^2.7.1",
    "axios": "^1.12.2",
    "expo": "~54.0.10",
    "expo-background-fetch": "~14.0.7",
    "expo-dev-client": "~6.0.12",
    "expo-file-system": "~19.0.15",
    "expo-sqlite": "~16.0.8",
    "expo-status-bar": "~3.0.8",
    "react": "19.1.0",
    "react-native": "0.81.4",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  }
}
```

### Comandos de Build
```bash
# Desenvolvimento
npm start
npm run android
npm run ios
npm run web

# Build para preview (APK)
npm run build-preview

# Build para desenvolvimento
npm run build-dev

# Build para produção
npm run build-production

# Build com dados atualizados
npm run build-with-data

# Commit e build automático
npm run commit-and-build
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

## 📝 Notas de Desenvolvimento

### Mudanças Recentes
- **Dezembro 2024**: Migração completa para SQLite com relacionamentos
- **Dezembro 2024**: Implementação de debug tools integrados
- **Dezembro 2024**: Configuração fixa para português brasileiro
- **Dezembro 2024**: Hot reload funcionando corretamente
- **Dezembro 2024**: Build EAS configurado e testado

### Tecnologias Utilizadas
- **React Native**: 0.81.4
- **Expo**: ~54.0.10
- **TypeScript**: ~5.9.2
- **SQLite**: expo-sqlite ~16.0.8
- **Navigation**: @react-navigation/native ^7.1.17
- **Storage**: @react-native-async-storage/async-storage 2.2.0
- **SDK**: @tcgdx/sdk ^2.7.1

### Estrutura de Navegação
```
App.tsx
├── MainScreen (Tela inicial)
├── LanguageConfigScreen (Configurações + Debug)
├── SeriesScreen (Lista de séries)
├── SetsScreen (Lista de sets)
├── CardsScreen (Lista de cards)
├── CardDetailScreen (Detalhes do card)
├── SettingsScreen (Configurações gerais)
└── DownloadsScreen (Downloads e cache)
```

---

**Última Atualização**: Dezembro 2024  
**Versão**: 1.0.0  
**Status**: Base sólida implementada - Pronto para desenvolvimento das telas principais  
**Próximo Milestone**: Implementação completa das telas de navegação
