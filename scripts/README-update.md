# Script de Atualização Incremental dos JSONs

Este script atualiza os arquivos JSON do Pokémon TCG de forma incremental, conectando na API oficial e atualizando apenas os dados novos.

## 🚀 Como Usar

### Opção 1: Script Automático (Recomendado)
```bash
npm run update-jsons
```

### Opção 2: Script Direto
```bash
npm run update-jsons-direct
```

### Opção 3: Execução Manual
```bash
node scripts/setup-update.js
```

## 📁 Arquivos Atualizados

O script atualiza os seguintes arquivos em `assets/data/`:

- `pokemon_series.json` - Séries de cartas
- `pokemon_sets.json` - Sets/expansões
- `pokemon_cards_detailed.json` - Cartas detalhadas

## 🔄 Como Funciona

1. **Conecta na API** usando o SDK TCGdx oficial
2. **Carrega dados existentes** dos JSONs atuais
3. **Compara com a API** para identificar dados novos
4. **Atualiza incrementalmente** apenas o que mudou
5. **Salva os JSONs atualizados** prontos para o app

## 📊 Estatísticas

O script mostra estatísticas detalhadas:
- Quantas séries/sets/cards são novos
- Quantos foram atualizados
- Total de itens em cada categoria

## ⚡ Vantagens

- **Rápido**: Atualiza apenas dados novos
- **Eficiente**: Não baixa dados já existentes
- **Confiável**: Usa API oficial do Pokémon TCG
- **Automático**: Detecta automaticamente o que precisa atualizar

## 🛠️ Pré-requisitos

- Node.js instalado
- SDK TCGdex (`@tcgdex/sdk`) - instalado automaticamente
- Conexão com internet

## 📝 Exemplo de Saída

```
🚀 Iniciando atualização incremental dos JSONs...
📚 11 séries existentes carregadas
📦 102 sets existentes carregados
🃏 12463 cards existentes carregados
📚 Atualizando séries...
📚 11 séries encontradas na API
📦 Atualizando sets...
📦 103 sets encontrados na API
📦 Novo set: Megaevolução (megaevolucao)
🃏 Atualizando cards...
🃏 12500 cards encontrados na API
🃏 37 cards novos processados...

📊 === ESTATÍSTICAS DA ATUALIZAÇÃO ===
📚 Séries: 0 novas, 0 atualizadas, 11 total
📦 Sets: 1 novos, 0 atualizados, 103 total
🃏 Cards: 37 novos, 0 atualizados, 12500 total

🎯 RESUMO: 38 novos itens, 0 atualizações
✅ Atualização incremental concluída com sucesso!
```

## 🔧 Troubleshooting

### Erro de SDK não encontrado
```bash
npm install @tcgdex/sdk
```

### Erro de permissão
```bash
chmod +x scripts/update-jsons-incremental.js
```

### Erro de conexão
- Verifique sua conexão com internet
- Tente novamente em alguns minutos
- A API pode estar temporariamente indisponível
