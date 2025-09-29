# 📱 Como Testar o App no Celular - Versão Expo

## 🚀 **Método Mais Fácil: Expo Go**

### Passo 1: Instalar o Expo Go no Celular
1. **Android**: Baixe "Expo Go" na Google Play Store
2. **iOS**: Baixe "Expo Go" na App Store

### Passo 2: Executar o App no Computador
```bash
cd PokemonTCGExpo
npm start
```

### Passo 3: Escanear o QR Code
1. Aparecerá um QR Code no terminal
2. **Android**: Abra o Expo Go e escaneie o QR Code
3. **iOS**: Use a câmera do iPhone para escanear o QR Code

## 🔧 **Método Alternativo: USB Debugging**

### Para Android:
1. **Ative o Modo Desenvolvedor** no celular:
   - Configurações > Sobre o telefone
   - Toque 7 vezes em "Número da versão"

2. **Ative Depuração USB**:
   - Configurações > Opções do desenvolvedor
   - Ative "Depuração USB"

3. **Conecte via USB e execute**:
   ```bash
   cd PokemonTCGExpo
   npm run android
   ```

## 📋 **Comandos Úteis**

### Iniciar o servidor de desenvolvimento:
```bash
npm start
```

### Executar no Android:
```bash
npm run android
```

### Executar no iOS (apenas macOS):
```bash
npm run ios
```

### Executar na web (para teste rápido):
```bash
npm run web
```

## 🎯 **Vantagens do Expo**

✅ **Sem configuração complexa** - Funciona imediatamente  
✅ **Teste instantâneo** - Mudanças aparecem em tempo real  
✅ **Sem necessidade de Android Studio** - Para Android  
✅ **Sem necessidade de Xcode** - Para iOS  
✅ **Funciona em qualquer celular** - Android e iOS  

## ⚠️ **Limitações do Expo**

❌ **Algumas bibliotecas nativas** podem não funcionar  
❌ **Tamanho do app** pode ser maior  
❌ **Performance** pode ser ligeiramente menor  

## 🔍 **Troubleshooting**

### QR Code não funciona:
```bash
# Use o método USB
npm run android
```

### App não carrega:
```bash
# Limpe o cache
npm start -- --clear
```

### Erro de conexão:
- Verifique se o celular e computador estão na mesma rede WiFi
- Desative firewall temporariamente

## 🎉 **Pronto!**

Agora você pode testar o app Pokemon TCG diretamente no seu celular! 

**Funcionalidades disponíveis:**
- 📱 Lista de coleções Pokemon TCG
- 🃏 Visualização de cartas com imagens em português
- 🔍 Busca por cartas
- 📊 Detalhes completos das cartas
- 🔄 Atualização em tempo real

**Divirta-se explorando as cartas Pokemon!** 🃏✨






