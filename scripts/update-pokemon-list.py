#!/usr/bin/env python3
"""
Script para atualizar APENAS o pokemon_list.json com cartas novas do SDK TCGdex
"""

import json
import os
import asyncio
from pathlib import Path

# Importar o SDK TCGdex
TCGdexModule = require('@tcgdex/sdk')
TCGdex = TCGdexModule.default || TCGdexModule

class PokemonListUpdater:
    def __init__(self, data_dir: str = "assets/data"):
        self.data_dir = Path(data_dir)
        self.list_file = self.data_dir / "pokemon_list.json"
        
        # Inicializar SDK
        self.tcgdex = None
        self.initialize_sdk()
        
    def initialize_sdk(self):
        """Inicializa o SDK TCGdex."""
        try:
            print('🔧 Inicializando SDK TCGdex...')
            self.tcgdex = new TCGdex('pt')
            print('✅ SDK TCGdex inicializado com sucesso')
        except Exception as error:
            print(f'❌ Erro ao inicializar SDK TCGdex: {error}')
            raise error
    
    def load_existing_list(self):
        """Carrega a lista atual de cartas."""
        if not self.list_file.exists():
            print('📋 Arquivo pokemon_list.json não encontrado, criando lista vazia...')
            return []
            
        try:
            with open(self.list_file, 'r', encoding='utf-8') as f:
                cards = json.load(f)
                print(f'📋 Lista atual carregada: {len(cards)} cartas')
                return cards
        except Exception as e:
            print(f'❌ Erro ao carregar lista: {e}')
            return []
    
    async def get_all_cards_from_api(self):
        """Busca todas as cartas da API."""
        print('🌐 Buscando todas as cartas da API...')
        
        all_cards = []
        page = 1
        page_size = 100
        
        while True:
            try:
                print(f'📄 Página {page}...', end=' ')
                cards = await this.tcgdex.card.list({ 
                    limit: page_size, 
                    offset: (page - 1) * page_size 
                })
                
                if len(cards) === 0:
                    break
                
                all_cards.extend(cards)
                print(f'{len(cards)} cartas encontradas')
                page += 1
                
                # Limite de segurança
                if page > 200:
                    break
                    
            except Exception as e:
                print(f'❌ Erro na página {page}: {e}')
                break
        
        print(f'🌐 Total de cartas na API: {len(all_cards)}')
        return all_cards
    
    def find_new_cards(self, existing_cards, api_cards):
        """Encontra cartas novas comparando com a API."""
        print('🔍 Procurando cartas novas...')
        
        existing_ids = set(card['id'] for card in existing_cards)
        new_cards = []
        
        for api_card in api_cards:
            if api_card['id'] not in existing_ids:
                new_cards.append({
                    'id': api_card['id'],
                    'name': api_card['name']
                })
        
        print(f'🆕 Cartas novas encontradas: {len(new_cards)}')
        return new_cards
    
    def save_updated_list(self, all_cards):
        """Salva a lista atualizada."""
        print('💾 Salvando lista atualizada...')
        
        # Ordena por ID para consistência
        all_cards.sort(key=lambda x: x['id'])
        
        with open(self.list_file, 'w', encoding='utf-8') as f:
            json.dump(all_cards, f, ensure_ascii=False, indent=2)
        
        print(f'💾 Lista salva: {len(all_cards)} cartas')
        print(f'📁 Arquivo: {self.list_file}')
    
    async def update_list(self):
        """Atualiza a lista de cartas."""
        print('🚀 Iniciando atualização do pokemon_list.json...')
        
        try:
            # Carrega lista atual
            existing_cards = self.load_existing_list()
            
            # Busca cartas da API
            api_cards = await self.get_all_cards_from_api()
            
            # Encontra cartas novas
            new_cards = self.find_new_cards(existing_cards, api_cards)
            
            if not new_cards:
                print('✅ Nenhuma carta nova encontrada!')
                return
            
            # Adiciona cartas novas à lista existente
            updated_cards = existing_cards + new_cards
            
            # Salva lista atualizada
            self.save_updated_list(updated_cards)
            
            # Relatório final
            print('\n' + '='*50)
            print('📊 RELATÓRIO FINAL:')
            print(f'📋 Cartas existentes: {len(existing_cards)}')
            print(f'🆕 Cartas novas: {len(new_cards)}')
            print(f'📁 Total atualizado: {len(updated_cards)}')
            print('✅ Atualização concluída!')
            
            # Mostra exemplos de cartas novas
            if new_cards:
                print(f'\n🔍 Exemplos de cartas novas:')
                for i, card in enumerate(new_cards[:5]):
                    print(f'  - {card["name"]} ({card["id"]})')
                if len(new_cards) > 5:
                    print(f'  ... e mais {len(new_cards) - 5} cartas')
            
        except Exception as e:
            print(f'❌ Erro durante atualização: {e}')
            raise e

def main():
    """Função principal."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Atualiza pokemon_list.json com cartas novas")
    parser.add_argument(
        '--data-dir', 
        default='assets/data',
        help='Diretório dos dados (padrão: assets/data)'
    )
    
    args = parser.parse_args()
    
    try:
        updater = PokemonListUpdater(args.data_dir)
        updater.update_list()
    except Exception as e:
        print(f'❌ Erro: {e}')
        exit(1)

if __name__ == "__main__":
    main()
