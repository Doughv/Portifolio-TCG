#!/usr/bin/env python3
"""
Script simples para extrair cores dominantes dos ícones de energia Pokémon
"""

import os
from PIL import Image
from collections import Counter

def get_dominant_color(image_path):
    """Extrai a cor dominante de uma imagem"""
    try:
        # Abrir imagem
        img = Image.open(image_path)
        
        # Converter para RGB se necessário
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar para acelerar o processamento
        img = img.resize((50, 50))
        
        # Obter cores dos pixels
        colors = list(img.getdata())
        
        # Contar cores mais frequentes
        color_counts = Counter(colors)
        
        # Pegar a cor mais comum (ignorando branco e preto)
        for color, count in color_counts.most_common(20):
            r, g, b = color
            # Ignorar cores muito claras (branco) ou muito escuras (preto)
            if not (r > 240 and g > 240 and b > 240) and not (r < 15 and g < 15 and b < 15):
                return color
        
        # Se não encontrou cor adequada, retornar a primeira
        return color_counts.most_common(1)[0][0]
        
    except Exception as e:
        print(f"Erro ao processar {image_path}: {e}")
        return (128, 128, 128)  # Cinza padrão

def rgb_to_hex(rgb):
    """Converte RGB para hexadecimal"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def main():
    energy_dir = "assets/icons/energy"
    
    if not os.path.exists(energy_dir):
        print(f"Diretório {energy_dir} não encontrado!")
        return
    
    print("🎨 Extraindo cores dos ícones de energia...")
    print("=" * 50)
    
    colors = {}
    
    for filename in os.listdir(energy_dir):
        if filename.endswith('.PNG'):
            filepath = os.path.join(energy_dir, filename)
            
            # Extrair nome do tipo
            type_name = filename.replace('-energy.PNG', '').replace('_', ' ').title()
            
            # Extrair cor dominante
            dominant_color = get_dominant_color(filepath)
            hex_color = rgb_to_hex(dominant_color)
            
            colors[type_name] = hex_color
            
            print(f"{type_name:15} → {hex_color} (RGB: {dominant_color})")
    
    print("\n" + "=" * 50)
    print("📋 Cores para usar no código:")
    print("=" * 50)
    
    # Gerar código TypeScript
    print("const getTypeColor = (type: string) => {")
    print("  switch (type?.toLowerCase()) {")
    
    for type_name, hex_color in colors.items():
        type_lower = type_name.lower()
        print(f"    case '{type_lower}':")
        print(f"      return '{hex_color}'; // {type_name}")
    
    print("    default:")
    print("      return '#888888'; // Cinza padrão")
    print("  }")
    print("};")

if __name__ == "__main__":
    main()