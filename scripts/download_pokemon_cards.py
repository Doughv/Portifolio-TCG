#!/usr/bin/env python3
"""
Script para baixar dados detalhados das cartas Pokémon TCG da API tcgdex
e salvar em JSON para uso offline no app React Native.
"""

import requests
import json
import time
import os
from typing import Dict, List, Optional
from pathlib import Path

class PokemonCardDownloader:
    def __init__(self, data_dir: str = "ProjetoPokemon/assets/data"):
        self.base_url = "https://api.tcgdex.net/v2/pt/cards"
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Arquivos
        self.cards_list_file = self.data_dir / "pokemon_list.json"
        self.detailed_cards_file = self.data_dir / "pokemon_cards_detailed.json"
        
        # Controle de rate limiting
        self.request_delay = 0.5  # 500ms entre requests
        
    def load_existing_cards(self) -> List[Dict]:
        """Carrega a lista básica de cartas existente."""
        if not self.cards_list_file.exists():
            raise FileNotFoundError(f"Arquivo {self.cards_list_file} não encontrado!")
            
        with open(self.cards_list_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def load_existing_detailed_cards(self) -> Dict[str, Dict]:
        """Carrega os dados detalhados existentes."""
        if not self.detailed_cards_file.exists():
            return {}
            
        try:
            with open(self.detailed_cards_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Converte lista para dict para busca mais rápida
                return {card['id']: card for card in data}
        except (json.JSONDecodeError, KeyError):
            print("⚠️  Arquivo de dados detalhados corrompido, iniciando do zero...")
            return {}
    
    def fetch_card_details(self, card_id: str) -> Optional[Dict]:
        """Baixa os detalhes de uma carta específica."""
        url = f"{self.base_url}/{card_id}"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            card_data = response.json()
            
            # Remove campos de preço se existirem
            price_fields = ['price', 'prices', 'cardmarket', 'tcgplayer', 'ebay', 'amazon', 'coolstuffinc', 'pokemon', 'pricing']
            for field in price_fields:
                if field in card_data:
                    del card_data[field]
            
            return card_data
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro ao baixar carta {card_id}: {e}")
            return None
    
    def save_detailed_cards(self, cards_data: List[Dict]):
        """Salva os dados detalhados em arquivo JSON."""
        # Ordena por ID para consistência
        cards_data.sort(key=lambda x: x['id'])
        
        with open(self.detailed_cards_file, 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Dados salvos em: {self.detailed_cards_file}")
        print(f"📊 Total de cartas salvas: {len(cards_data)}")
    
    def download_all_cards(self, update_only: bool = False):
        """Baixa todos os dados detalhados das cartas."""
        print("🚀 Iniciando download dos dados detalhados das cartas...")
        
        # Carrega dados existentes
        basic_cards = self.load_existing_cards()
        existing_detailed = self.load_existing_detailed_cards()
        
        print(f"📋 Total de cartas na lista básica: {len(basic_cards)}")
        print(f"📋 Cartas já com dados detalhados: {len(existing_detailed)}")
        
        # Filtra cartas que precisam ser baixadas
        if update_only:
            cards_to_download = [
                card for card in basic_cards 
                if card['id'] not in existing_detailed
            ]
            print(f"🔄 Modo atualização: {len(cards_to_download)} cartas novas")
        else:
            cards_to_download = basic_cards
            print(f"🔄 Modo completo: baixando todas as {len(cards_to_download)} cartas")
        
        if not cards_to_download:
            print("✅ Todas as cartas já estão atualizadas!")
            return
        
        # Baixa os dados
        detailed_cards = []
        success_count = 0
        error_count = 0
        
        for i, card in enumerate(cards_to_download, 1):
            card_id = card['id']
            print(f"[{i}/{len(cards_to_download)}] Baixando {card_id}...", end=' ')
            
            # Baixa dados detalhados
            detailed_data = self.fetch_card_details(card_id)
            
            if detailed_data:
                detailed_cards.append(detailed_data)
                success_count += 1
                print("✅")
            else:
                error_count += 1
                print("❌")
            
            # Rate limiting
            time.sleep(self.request_delay)
        
        # Adiciona cartas já existentes se estiver no modo atualização
        if update_only:
            detailed_cards.extend(existing_detailed.values())
        
        # Salva os dados
        if detailed_cards:
            self.save_detailed_cards(detailed_cards)
        
        # Relatório final
        print("\n" + "="*50)
        print("📊 RELATÓRIO FINAL:")
        print(f"✅ Sucessos: {success_count}")
        print(f"❌ Erros: {error_count}")
        print(f"📁 Total no arquivo: {len(detailed_cards)}")
        
        if error_count > 0:
            print(f"\n⚠️  {error_count} cartas falharam no download.")
            print("   Execute novamente para tentar baixar as que falharam.")

def main():
    """Função principal."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Baixa dados detalhados das cartas Pokémon TCG")
    parser.add_argument(
        '--update', 
        action='store_true', 
        help='Modo atualização: baixa apenas cartas novas'
    )
    parser.add_argument(
        '--data-dir', 
        default='ProjetoPokemon/assets/data',
        help='Diretório dos dados (padrão: ProjetoPokemon/assets/data)'
    )
    
    args = parser.parse_args()
    
    try:
        downloader = PokemonCardDownloader(args.data_dir)
        downloader.download_all_cards(update_only=args.update)
    except FileNotFoundError as e:
        print(f"❌ Erro: {e}")
        print("   Certifique-se de que o arquivo pokemon_list.json existe!")
    except KeyboardInterrupt:
        print("\n⚠️  Download interrompido pelo usuário.")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")

if __name__ == "__main__":
    main()
