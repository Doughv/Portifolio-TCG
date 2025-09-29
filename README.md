# Pokémon TCG App

## 📋 Contexto do Projeto

Este é um aplicativo React Native/Expo para visualização de cartas Pokémon TCG, baseado em um projeto anterior mais funcional. O objetivo é restaurar e melhorar as funcionalidades que existiam no projeto original.

## 🎯 Funcionalidades Principais

### ✅ Implementadas
- **Banco de dados SQLite local** para armazenamento offline
- **Integração com TCGdex API** oficial para atualizações
- **Sistema de filtros** por séries e expansões
- **Configuração de idioma** (focado em português BR)
- **Cache de imagens** para acesso offline
- **Scripts de população** do banco de dados via JSONs pré-processados
- **Telas principais**: Home, Séries, Expansões, Cartas, Configurações

### 🔄 Em Desenvolvimento
- **Relacionamentos no banco**: Segundo e terceiro relacionamento ainda não funcionando corretamente
- **Sincronização incremental** com a API
- **Sistema de downloads** para gerenciar conteúdo offline

## 🏗️ Arquitetura

### Serviços Principais
- **`TCGdexService`**: Integração com API oficial, gerencia idioma dinamicamente
- **`DatabaseService`**: Operações SQLite, relacionamentos entre séries/sets/cartas
- **`FilterService`**: Filtros de usuário (séries e expansões selecionadas)
- **`ImageDownloadService`**: Download e cache de imagens das cartas
- **`CacheService`**: Gerenciamento de cache geral
- **`SyncService`**: Sincronização com API

### Estrutura de Dados
```
Series (id, name) 
  ↓
Sets (id, name, seriesId, cardCount)
  ↓  
Cards (id, name, setId, imageUrl, hp, ...)
```

## 🔧 Scripts e Dados

### `scripts/populate-database.js`
- Processa dados brutos de `assets/data/`
- Gera JSONs otimizados em `src/data/`
- **Função `inferSeriesFromId`**: Mapeia IDs de sets para séries corretas
- Exemplos de mapeamento:
  - `base1`, `base2` → `base`
  - `ex1`, `ex2` → `ex`
  - `col1` → `col` (Chamado das Lendas)
  - `dv1` → `bw` (Cofre do Dragão)

### Dados Pré-processados
- **`assets/data/`**: Dados brutos da API
- **`src/data/`**: JSONs otimizados para população rápida do banco

## 🐛 Problemas Conhecidos

### 1. Relacionamentos Incorretos
- **Problema**: Sets aparecendo na série "Base" incorretamente
- **Causa**: Função `inferSeriesFromId` não mapeia corretamente sets especiais
- **Status**: ✅ Corrigido para primeiro relacionamento (Series ↔ Sets)
- **Pendente**: Segundo e terceiro relacionamento ainda não funcionando

### 2. Timeouts na API
- **Problema**: App congela ao carregar expansões
- **Solução**: Implementado timeout de 10s e fallback para banco local

### 3. Chaves Duplicadas
- **Problema**: "Encountered two children with the same key"
- **Solução**: ✅ Corrigido com `keyExtractor` único

## 🚀 Como Executar

### Pré-requisitos
- Node.js
- Expo CLI
- EAS CLI (para builds)

### Comandos Principais
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm start

# Popular banco de dados
node scripts/populate-database.js

# Build para produção
eas build --platform android
```

## 📱 Build e Deploy

### EAS Build
- Configurado para Android
- Usa `expo-dev-client` para desenvolvimento rápido
- Builds são feitos via EAS, não Expo Go

### Desenvolvimento
- Usar `expo-dev-client` instalado no dispositivo
- Permite hot reload sem rebuild completo
- Acesso via QR code ou USB debugging

## 🔄 Fluxo de Dados

1. **Inicialização**: App carrega dados dos JSONs em `src/data/`
2. **Migração**: Dados são inseridos no SQLite com relacionamentos corretos
3. **Uso**: App consulta banco local (rápido)
4. **Atualização**: API é consultada apenas para novos dados
5. **Cache**: Imagens são baixadas e armazenadas localmente

## 🎨 Telas

### `LanguageConfigScreen`
- Configuração de filtros (séries/expansões)
- Botões de debug para análise de dados
- Reset do banco de dados
- Teste de SDK vs banco local

### `SeriesScreen`, `SetsScreen`, `CardsScreen`
- Usam `FilterService` para dados filtrados
- Fallback para API quando necessário
- Indicadores de carregamento

## 🔍 Debugging

### Botões de Debug (LanguageConfigScreen)
- **"Ver Dados do Banco"**: Mostra estatísticas do banco
- **"Testar SDK"**: Compara SDK vs banco local
- **"Reset Banco"**: Limpa e repopula do JSON
- **"Dados Brutos"**: Análise detalhada de relacionamentos

### Logs Importantes
```
LOG Migrando sets...
WARN ⚠️ Não foi possível inferir série para o set col1, usando 'base' como padrão
```

## 📝 Próximos Passos

1. **Corrigir segundo relacionamento**: Sets → Cards
2. **Corrigir terceiro relacionamento**: Cards → Detalhes
3. **Implementar sincronização incremental** com API
4. **Adicionar suporte ao inglês** (após funcionar em português)
5. **Otimizar performance** de carregamento

## 🛠️ Comandos Git

```bash
# Verificar status
git status

# Adicionar mudanças
git add .

# Commit com mensagem
git commit -m "feat: descrição das mudanças"

# Push para GitHub
git push origin master
```

## 📞 Contato

- **Repositório**: https://github.com/Doughv/Portifolio-TCG.git
- **Projeto Original**: Funcionalidades baseadas em projeto anterior
- **Última Atualização**: Dezembro 2024

---

**Nota**: Este projeto foi criado para funcionar offline após população inicial, com sincronização opcional via API para atualizações.
