# Logos das Séries Pokémon TCG

Esta pasta contém os logos locais das séries que não são fornecidos pela API.

## Como adicionar logos:

1. **Baixe o logo da série** (formato PNG recomendado)
2. **Renomeie o arquivo** para o ID da série:
   - `xy.png` - XY
   - `sm.png` - Sol e Lua
   - `swsh.png` - Espada e Escudo
   - `sv.png` - Escarlate e Violeta
   - `bw.png` - Preto e Branco
   - `dp.png` - Diamante e Pérola
   - `ex.png` - EX
   - `base.png` - Base
   - `col.png` - Colônias
   - `hgss.png` - HeartGold & SoulSilver

3. **Coloque o arquivo** nesta pasta (`assets/series/`)

4. **Descomente a linha** no arquivo `SeriesScreen.js`:
   ```javascript
   // De:
   // 'xy': require('../assets/series/xy.png'),
   // Para:
   'xy': require('../assets/series/xy.png'),
   ```

## Tamanho recomendado:
- **Largura**: 200-400px
- **Altura**: 100-200px
- **Formato**: PNG com fundo transparente

## Como funciona:
- Se a API fornecer logo → usa o da API
- Se não fornecer → usa o logo local
- Se não tiver logo local → mostra emoji 📚

## Exemplo de estrutura:
```
assets/series/
├── xy.png
├── sm.png
├── swsh.png
├── sv.png
└── README.md
```

## ⚠️ Importante:
- **Sempre descomente** a linha correspondente no código após adicionar o arquivo
- **Reinicie o app** após adicionar novos logos
- **Teste** se o logo aparece corretamente
