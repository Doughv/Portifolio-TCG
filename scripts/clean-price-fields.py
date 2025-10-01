#!/usr/bin/env python3
"""
Script para remover campos de preço/valor do JSON das cartas Pokémon
"""

import json
import os
from pathlib import Path

def clean_price_fields():
    """Remove campos relacionados a preços do JSON."""
    
    data_file = Path("assets/data/pokemon_cards_detailed.json")
    
    if not data_file.exists():
        print("❌ Arquivo pokemon_cards_detailed.json não encontrado!")
        return
    
    print("🧹 Limpando campos de preço do JSON...")
    
    # Carrega o arquivo
    with open(data_file, 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    print(f"📊 Total de cartas: {len(cards)}")
    
    # Campos a serem removidos
    price_fields = [
        'price', 'prices', 'cardmarket', 'tcgplayer', 
        'ebay', 'amazon', 'coolstuffinc', 'pokemon',
        'pricing'  # Campo principal que contém todos os preços
    ]
    
    cleaned_count = 0
    
    # Remove campos de preço de cada carta
    for card in cards:
        original_keys = set(card.keys())
        
        # Remove campos de preço
        for field in price_fields:
            if field in card:
                del card[field]
                cleaned_count += 1
        
        # Se removeu algum campo, marca como limpo
        if len(card.keys()) < len(original_keys):
            cleaned_count += 1
    
    # Salva o arquivo limpo
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Campos de preço removidos: {cleaned_count}")
    print(f"💾 Arquivo salvo: {data_file}")
    print("🎯 Agora o JSON está limpo para usar com API externa de preços!")

if __name__ == "__main__":
    clean_price_fields()
