#!/usr/bin/env python3
"""
Script para remover todos os dados de Mega Evolução dos 4 JSONs principais
"""

import json
import os
import sys

def remove_mega_evolution_from_json(file_path, description):
    """Remove todos os dados relacionados à Mega Evolução de um JSON"""
    print(f"\n🔍 Processando {description}...")
    
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False
    
    try:
        # Ler o arquivo
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        original_count = len(data)
        print(f"📊 Total original: {original_count}")
        
        # Filtrar dados que NÃO são de Mega Evolução
        filtered_data = []
        removed_count = 0
        
        for item in data:
            # Verificar se é relacionado à Mega Evolução
            is_mega_evolution = False
            
            # Verificar ID
            if 'id' in item:
                item_id = item['id']
                if item_id.startswith('me'):
                    is_mega_evolution = True
                elif 'mega' in item_id.lower() or 'megaevolução' in item_id.lower():
                    is_mega_evolution = True
            
            # Verificar nome
            if 'name' in item:
                item_name = item['name'].lower()
                if 'mega' in item_name or 'megaevolução' in item_name:
                    is_mega_evolution = True
            
            # Verificar série
            if 'series' in item:
                if item['series'] == 'me':
                    is_mega_evolution = True
            
            # Verificar set
            if 'set' in item:
                if isinstance(item['set'], dict) and 'id' in item['set']:
                    if item['set']['id'].startswith('me'):
                        is_mega_evolution = True
                elif isinstance(item['set'], str) and item['set'].startswith('me'):
                    is_mega_evolution = True
            
            if not is_mega_evolution:
                filtered_data.append(item)
            else:
                removed_count += 1
        
        # Salvar arquivo filtrado
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(filtered_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {description} processado:")
        print(f"   - Removidos: {removed_count}")
        print(f"   - Restantes: {len(filtered_data)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao processar {file_path}: {e}")
        return False

def main():
    print("🚀 Removendo todos os dados de Mega Evolução dos JSONs...")
    
    # Definir arquivos e descrições
    files_to_process = [
        ("assets/data/pokemon_series.json", "Séries"),
        ("assets/data/pokemon_sets.json", "Sets"),
        ("assets/data/pokemon_list.json", "Lista de Cartas"),
        ("assets/data/pokemon_cards_detailed.json", "Cartas Detalhadas")
    ]
    
    success_count = 0
    
    for file_path, description in files_to_process:
        if remove_mega_evolution_from_json(file_path, description):
            success_count += 1
    
    print(f"\n📊 Resumo:")
    print(f"✅ Arquivos processados com sucesso: {success_count}/{len(files_to_process)}")
    
    if success_count == len(files_to_process):
        print("🎉 Todos os dados de Mega Evolução foram removidos!")
        print("🚀 Agora você pode testar o script atualizado!")
    else:
        print("⚠️ Alguns arquivos não foram processados corretamente.")
        sys.exit(1)

if __name__ == "__main__":
    main()
