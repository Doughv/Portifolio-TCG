#!/usr/bin/env python3
"""
Script para testar quantas cartas realmente precisam de atualização
"""

import json
from pathlib import Path

def test_cards_needing_update():
    """Testa quantas cartas precisam de atualização."""
    
    data_file = Path("assets/data/pokemon_cards_detailed.json")
    
    if not data_file.exists():
        print("❌ Arquivo pokemon_cards_detailed.json não encontrado!")
        return
    
    print("🧪 Testando quantas cartas precisam de atualização...")
    
    # Carrega o arquivo
    with open(data_file, 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    print(f"📊 Total de cartas: {len(cards)}")
    
    # Contadores
    pokemon_cards = 0
    trainer_cards = 0
    energy_cards = 0
    unknown_cards = 0
    
    pokemon_needing_update = 0
    trainer_needing_update = 0
    energy_needing_update = 0
    unknown_needing_update = 0
    
    # Analisa cada carta
    for card in cards:
        category = (card.get('category') or '').lower()
        
        if category == 'pokemon':
            pokemon_cards += 1
            # Pokémon precisa de: HP, tipos, ataques, stage, retreat
            if (not card.get('hp') or 
                not card.get('types') or 
                not card.get('attacks') or
                not card.get('stage') or
                not card.get('retreat')):
                pokemon_needing_update += 1
        elif category == 'trainer':
            trainer_cards += 1
            # Trainer precisa de: tipos (pode ser vazio), ataques (pode ser vazio)
            if (not card.get('types') is not None or 
                not card.get('attacks') is not None):
                trainer_needing_update += 1
        elif category == 'energy':
            energy_cards += 1
            # Energy precisa de: tipos (pode ser vazio), ataques (pode ser vazio)
            if (not card.get('types') is not None or 
                not card.get('attacks') is not None):
                energy_needing_update += 1
        else:
            unknown_cards += 1
            # Cartas sem categoria precisam de atualização
            unknown_needing_update += 1
    
    total_needing_update = pokemon_needing_update + trainer_needing_update + energy_needing_update + unknown_needing_update
    
    print("\n📊 === ANÁLISE POR CATEGORIA ===")
    print(f"🃏 Pokémon: {pokemon_cards} total, {pokemon_needing_update} precisam atualização")
    print(f"🎯 Trainer: {trainer_cards} total, {trainer_needing_update} precisam atualização")
    print(f"⚡ Energy: {energy_cards} total, {energy_needing_update} precisam atualização")
    print(f"❓ Unknown: {unknown_cards} total, {unknown_needing_update} precisam atualização")
    
    print(f"\n🎯 TOTAL: {total_needing_update} cartas precisam de atualização")
    
    if total_needing_update > 0:
        print(f"\n🔍 Exemplos de cartas que precisam de atualização:")
        count = 0
        for card in cards:
            if count >= 5:
                break
            
            category = (card.get('category') or '').lower()
            needs_update = False
            
            if category == 'pokemon':
                if (not card.get('hp') or 
                    not card.get('types') or 
                    not card.get('attacks') or
                    not card.get('stage') or
                    not card.get('retreat')):
                    needs_update = True
            elif category in ['trainer', 'energy']:
                if (not card.get('types') is not None or 
                    not card.get('attacks') is not None):
                    needs_update = True
            else:
                needs_update = True
            
            if needs_update:
                print(f"  - {card.get('name', 'Unknown')} ({card.get('id', 'Unknown')}) - {category}")
                count += 1

if __name__ == "__main__":
    test_cards_needing_update()
