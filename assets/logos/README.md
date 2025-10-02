# Logos das Coleções e Expansões

Esta pasta contém os logos das coleções (séries) e expansões (sets) do Pokémon TCG.

## Estrutura de Pastas

- `series/` - Logos das coleções (séries)
- `sets/` - Logos das expansões (sets)

## Nomenclatura dos Arquivos

### Séries (Coleções)
- Arquivo: `{seriesId}.png`
- Exemplos:
  - `xy.png` - Coleção XY
  - `sm.png` - Coleção Sun & Moon
  - `sv.png` - Coleção Scarlet & Violet

### Sets (Expansões)
- Arquivo: `{setId}.png`
- Exemplos:
  - `xy1.png` - XY Base Set
  - `sm1.png` - Sun & Moon Base Set
  - `sv1.png` - Scarlet & Violet Base Set

## Como Adicionar Logos

1. **Automático**: Se a API fornecer URLs de logos, eles serão baixados automaticamente
2. **Manual**: Coloque os arquivos PNG nas pastas correspondentes seguindo a nomenclatura acima

## Formato Recomendado

- **Formato**: PNG com fundo transparente
- **Resolução**: Mínimo 200x200px, recomendado 400x400px
- **Proporção**: Quadrada ou retangular (será redimensionada automaticamente)

## Prioridade de Carregamento

1. Cache local (logos já baixados)
2. Download da API (se URL disponível)
3. Arquivo manual nesta pasta
4. Placeholder padrão (se nenhum logo encontrado)
