#!/usr/bin/env python3
"""
Script para remover cards de Megaevolução do pokemon_cards_detailed.json
Remove todos os cards que começam com "me01"
"""

import json
import os
from pathlib import Path

def remove_megaevolution_cards():
    """Remove cards de Megaevolução do arquivo detalhado."""
    
    data_file = Path("assets/data/pokemon_cards_detailed.json")
    
    if not data_file.exists():
        print("❌ Arquivo pokemon_cards_detailed.json não encontrado!")
        return
    
    print("🧹 Removendo cards de Megaevolução...")
    
    # Carrega o arquivo
    with open(data_file, 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    print(f"📊 Total de cartas antes: {len(cards)}")
    
    # Filtra cards que NÃO começam com "me01"
    filtered_cards = []
    removed_count = 0
    
    for card in cards:
        if card.get('id', '').startswith('me01'):
            removed_count += 1
            print(f"🗑️  Removendo: {card.get('name', 'Unknown')} ({card.get('id', 'Unknown')})")
        else:
            filtered_cards.append(card)
    
    print(f"📊 Cards removidos: {removed_count}")
    print(f"📊 Total de cartas depois: {len(filtered_cards)}")
    
    # Salva o arquivo filtrado
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(filtered_cards, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Arquivo atualizado: {data_file}")
    print("✅ Cards de Megaevolução removidos com sucesso!")

if __name__ == "__main__":
    remove_megaevolution_cards()
