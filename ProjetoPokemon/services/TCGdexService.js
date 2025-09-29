// Importar polyfills primeiro
import '../polyfills';
import TCGdex from '@tcgdex/sdk';
import CacheService from './CacheService';
import OfflineService from './OfflineService';
import OptimizedStorageService from './OptimizedStorageService';

// Polyfill robusto para APIs do navegador no React Native
if (typeof global !== 'undefined') {
  // Garantir que window existe
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  
  // Polyfill para calSage (erro específico do SDK)
  if (typeof global.window.calSage === 'undefined') {
    global.window.calSage = undefined;
  }
  
  // Polyfill para sessionStorage
  if (typeof global.window.sessionStorage === 'undefined') {
    global.window.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
  }
  
  // Polyfill para localStorage se necessário
  if (typeof global.window.localStorage === 'undefined') {
    global.window.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
  }
}

class TCGdexService {
  constructor(language = 'pt') {
    this.language = language;
    this.baseUrl = `https://api.tcgdex.net/v2/${language}`;
    this.tcgdex = null;
    
    // Inicializar SDK de forma assíncrona para evitar bloqueios
    this.initializeSDK(language);
  }

  async initializeSDK(language = 'pt') {
    try {
      console.log('Tentando inicializar SDK TCGdex com idioma:', language);
      this.tcgdex = new TCGdex(language);
      console.log('SDK TCGdex inicializado com sucesso');
      console.log('SDK disponível:', !!this.tcgdex);
      
      // Debug detalhado do SDK
      if (this.tcgdex) {
        console.log('Propriedades do SDK:', Object.keys(this.tcgdex));
        console.log('SDK serie (singular):', !!this.tcgdex?.serie);
        console.log('SDK set:', !!this.tcgdex?.set);
        console.log('SDK card:', !!this.tcgdex?.card);
        
        // Verificar métodos disponíveis
        if (this.tcgdex.serie && typeof this.tcgdex.serie.list === 'function') {
          console.log('✅ SDK serie.list está disponível');
        } else {
          console.warn('❌ SDK serie.list não está disponível');
        }
        
        if (this.tcgdex.set && typeof this.tcgdex.set.list === 'function') {
          console.log('✅ SDK set.list está disponível');
        } else {
          console.warn('❌ SDK set.list não está disponível');
        }
        
        if (this.tcgdex.card && typeof this.tcgdex.card.list === 'function') {
          console.log('✅ SDK card.list está disponível');
        } else {
          console.warn('❌ SDK card.list não está disponível');
        }
      }
      
    } catch (error) {
      console.error('Erro ao inicializar SDK TCGdex:', error);
      this.tcgdex = null;
    }
  }

  // Método para alterar idioma dinamicamente
  async setLanguage(language) {
    const previousLanguage = this.language;
    this.language = language;
    this.baseUrl = `https://api.tcgdex.net/v2/${language}`;
    
    console.log('Tentando alterar idioma do SDK para:', language);
    
    // Se mudou de idioma, limpar cache do idioma anterior
    if (previousLanguage && previousLanguage !== language) {
      console.log('Limpando cache do idioma anterior:', previousLanguage);
      await CacheService.clearLanguageCache(previousLanguage);
    }
    
    await this.initializeSDK(language);
    console.log(`Idioma alterado para: ${language}`);
    console.log('SDK disponível após mudança:', !!this.tcgdex);
    console.log('SDK serie após mudança:', !!this.tcgdex?.serie);
  }

  // Usar a propriedade image da carta ou construir URL manualmente
  getImageURL(card, quality = 'high', extension = 'png') {
    try {
      console.log('Debug getImageURL:', {
        cardName: card.name,
        cardId: card.id,
        hasImage: !!card.image,
        imageValue: card.image
      });
      
      // Se a carta já tem uma propriedade image, usar ela
      if (card && card.image) {
        // Verificar se a URL já tem qualidade e extensão
        let imageUrl = card.image;
        if (!imageUrl.includes('/high.webp') && !imageUrl.includes('/medium.webp') && !imageUrl.includes('/low.webp')) {
          // Adicionar qualidade e extensão se não tiver
          imageUrl = imageUrl.endsWith('/') ? imageUrl : imageUrl + '/';
          imageUrl += `${quality}.webp`;
        }
        console.log('Usando image da carta:', imageUrl);
        return imageUrl;
      }
      
      // Se tem método getImageURL do SDK, usar ele
      if (card && typeof card.getImageURL === 'function') {
        const url = card.getImageURL(quality, extension);
        console.log('URL do SDK:', url);
        return url;
      }
      
      // Fallback: construir URL manualmente
      const setId = card.set?.id || card.id?.split('-')[0] || 'sv01';
      const cardNumber = card.localId || card.number || '1';
      const manualUrl = `https://assets.tcgdex.net/${this.language}/sv/${setId}/${cardNumber}/${quality}.webp`;
      console.log('URL manual:', manualUrl);
      return manualUrl;
    } catch (error) {
      console.error('Erro ao obter URL da imagem:', error);
      // Fallback para URL manual
      const setId = card.set?.id || card.id?.split('-')[0] || 'sv01';
      const cardNumber = card.localId || card.number || '1';
      return `https://assets.tcgdex.net/${this.language}/sv/${setId}/${cardNumber}/${quality}.webp`;
    }
  }

  // Método para compatibilidade com o código existente
  getImageUrl(card, quality = 'high', extension = 'png') {
    return this.getImageURL(card, quality, extension);
  }

  // Usar o método card.get() do SDK oficial
  async getCard(cardId) {
    try {
      console.log(`Buscando carta: ${cardId}`);
      const card = await this.tcgdex.card.get(cardId);
      console.log('Carta encontrada:', card.name);
      return card;
    } catch (error) {
      console.error('Erro ao buscar carta:', error);
      throw error;
    }
  }

  // Usar o método set.get() do SDK oficial
  async getSet(setId) {
    try {
      console.log(`Buscando coleção: ${setId}`);
      const set = await this.tcgdex.set.get(setId);
      console.log('Coleção encontrada:', set.name);
      return set;
    } catch (error) {
      console.error('Erro ao buscar coleção:', error);
      throw error;
    }
  }

  // Buscar séries baseado nas configurações do usuário usando SDK
  async getSeries() {
    try {
      console.log('Buscando séries...');
      
      // Tentar buscar do cache primeiro (com idioma)
      let allSeries = await CacheService.getCachedSeries(this.language);
      
      if (!allSeries) {
        console.log('Buscando séries via SDK...');
        
        // Verificar se o SDK está disponível e tem a propriedade serie
        if (this.tcgdex && this.tcgdex.serie && typeof this.tcgdex.serie.list === 'function') {
          try {
            // Usar SDK para buscar séries
            allSeries = await this.tcgdex.serie.list();
            console.log('Séries encontradas via SDK:', allSeries.length);
          } catch (sdkError) {
            console.log('SDK falhou, usando HTTP direto...', sdkError.message);
            // Fallback para HTTP direto
            const response = await fetch(`${this.baseUrl}/series`);
            allSeries = await response.json();
          }
        } else {
          console.log('SDK não disponível ou serie.list não encontrado, usando HTTP direto...');
          // Fallback para HTTP direto
          const response = await fetch(`${this.baseUrl}/series`);
          allSeries = await response.json();
        }
        
        // Salvar no cache (com idioma)
        await CacheService.setCachedSeries(allSeries, this.language);
        console.log('Séries salvas no cache');
      } else {
        console.log('Séries carregadas do cache');
      }
      
      // Buscar configurações salvas específicas do idioma atual
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const languageKey = `selectedSeries_${this.language}`;
      const savedSettings = await AsyncStorage.getItem(languageKey);
      
      let selectedSeriesIds = ['sv']; // Padrão: apenas SV
      if (savedSettings) {
        selectedSeriesIds = JSON.parse(savedSettings);
      }
      
      // Filtrar séries baseado nas configurações
      const filteredSeries = allSeries.filter(series => selectedSeriesIds.includes(series.id));
      
      console.log('Séries encontradas:', allSeries.length, '| Filtradas:', filteredSeries.length);
      return filteredSeries;
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      throw error;
    }
  }

  // Buscar todas as expansões/sets usando SDK
  async getSets() {
    try {
      console.log('Buscando expansões...');
      
      // Tentar buscar do cache primeiro (com idioma)
      let sets = await CacheService.getCachedSets(this.language);
      
      if (!sets) {
        console.log('Buscando expansões via SDK...');
        
        // Verificar se o SDK está disponível e tem a propriedade set
        if (this.tcgdex && this.tcgdex.set && typeof this.tcgdex.set.list === 'function') {
          try {
            // Usar SDK para buscar sets
            sets = await this.tcgdex.set.list();
            console.log('Sets encontrados via SDK:', sets.length);
          } catch (sdkError) {
            console.log('SDK falhou, usando HTTP direto...', sdkError.message);
            // Fallback para HTTP direto
            const response = await fetch(`${this.baseUrl}/sets`);
            sets = await response.json();
          }
        } else {
          console.log('SDK não disponível ou set.list não encontrado, usando HTTP direto...');
          // Fallback para HTTP direto
          const response = await fetch(`${this.baseUrl}/sets`);
          sets = await response.json();
        }
        
        // Salvar no cache (com idioma)
        await CacheService.setCachedSets(sets, this.language);
        console.log('Expansões salvas no cache');
      } else {
        console.log('Expansões carregadas do cache');
      }
      
      // Filtrar apenas expansões com cartas em português
      const filteredSets = sets.filter(set => 
        set.cardCount && set.cardCount.total > 0
      );
      
      // Ordenar por data de lançamento (mais recentes primeiro)
      filteredSets.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      
      console.log('Expansões encontradas:', filteredSets.length);
      return filteredSets;
    } catch (error) {
      console.error('Erro ao buscar expansões:', error);
      throw error;
    }
  }

  // Buscar expansões de uma série específica
  async getSetsBySeries(seriesId) {
    try {
      console.log('Buscando expansões da série:', seriesId);
      const allSets = await this.getSets();
      
      // Filtrar expansões que pertencem à série
      const seriesSets = allSets.filter(set => {
        // Verificar se o ID da expansão começa com o ID da série
        return set.id.startsWith(seriesId);
      });
      
      console.log(`Expansões da série ${seriesId}:`, seriesSets.length);
      return seriesSets;
    } catch (error) {
      console.error('Erro ao buscar expansões da série:', error);
      throw error;
    }
  }

  // Buscar cartas de uma coleção específica usando SDK otimizado
  async getCardsBySet(setId) {
    try {
      console.log('Buscando cartas da coleção:', setId);
      
      // Tentar buscar do cache primeiro (com idioma)
      let cardsWithDetails = await CacheService.getCachedCards(setId, this.language);
      
      if (!cardsWithDetails) {
        console.log('Buscando cartas via SDK...');
        
        if (!this.tcgdex) {
          throw new Error('SDK tcgdex não inicializado');
        }
        
        try {
          // Método 1: Tentar buscar diretamente pelo SDK do set
          const set = await this.tcgdex.set.get(setId);
          console.log('Set encontrado via SDK:', set.name);
          
          // Se o set tem cards, usar eles
          if (set.cards && Array.isArray(set.cards)) {
            cardsWithDetails = set.cards;
            console.log(`Cartas encontradas via SDK: ${cardsWithDetails.length}`);
          } else {
            // Método 2: Fallback - buscar todas as cartas e filtrar
            console.log('Set não tem cards diretos, buscando via fallback...');
            const allCards = await this.tcgdex.card.list();
            
            // Filtrar apenas cartas da coleção específica
            const filteredCards = allCards.filter(card => {
              const cardId = card.id || '';
              return cardId.startsWith(setId + '-');
            });
            
            console.log(`Cartas da coleção ${setId}:`, filteredCards.length);
            
            // Buscar dados completos de cada carta usando SDK
            cardsWithDetails = await Promise.all(
              filteredCards.map(async (card) => {
                try {
                  const cardDetails = await this.tcgdex.card.get(card.id);
                  return cardDetails;
                } catch (error) {
                  console.error(`Erro ao buscar detalhes da carta ${card.id}:`, error);
                  return card; // Retornar dados básicos se falhar
                }
              })
            );
          }
          
        } catch (sdkError) {
          console.log('SDK falhou, usando método HTTP direto...');
          
          // Método 3: Fallback para HTTP direto
          const response = await fetch(`${this.baseUrl}/cards`);
          const allCards = await response.json();
          
          const filteredCards = allCards.filter(card => {
            const cardId = card.id || '';
            return cardId.startsWith(setId + '-');
          });
          
          cardsWithDetails = await Promise.all(
            filteredCards.map(async (card) => {
              try {
                const cardResponse = await fetch(`${this.baseUrl}/cards/${card.id}`);
                const cardDetails = await cardResponse.json();
                return cardDetails;
              } catch (error) {
                console.error(`Erro ao buscar detalhes da carta ${card.id}:`, error);
                return card;
              }
            })
          );
        }
        
        // Salvar no cache (com idioma)
        await CacheService.setCachedCards(setId, cardsWithDetails, this.language);
        console.log('Cartas salvas no cache');
      } else {
        console.log('Cartas carregadas do cache');
      }
      
      console.log('Cartas com detalhes completos:', cardsWithDetails.length);
      return cardsWithDetails;
      
    } catch (error) {
      console.error('Erro ao buscar cartas da coleção:', error);
      console.error('Detalhes do erro:', error.message);
      throw error;
    }
  }

  // Obter URL da imagem da carta baseado no idioma atual
  getCardImageUrl(cardId, setId, imageType = 'high') {
    return `https://assets.tcgdex.net/${this.language}/${setId}/${cardId}/${imageType}.webp`;
  }

  // Obter URL da imagem da carta em alta resolução
  getCardImageUrlHigh(cardId, setId) {
    return this.getCardImageUrl(cardId, setId, 'high');
  }

  // Obter URL da imagem da carta em baixa resolução
  getCardImageUrlLow(cardId, setId) {
    return this.getCardImageUrl(cardId, setId, 'low');
  }

  // Buscar todas as séries disponíveis para o idioma atual
  async getAllSeries() {
    try {
      console.log('Buscando todas as séries...');
      
      // Verificar se o SDK está disponível e tem a propriedade serie
      if (this.tcgdex && this.tcgdex.serie && typeof this.tcgdex.serie.list === 'function') {
        try {
          const allSeries = await this.tcgdex.serie.list();
          console.log('Todas as séries encontradas via SDK:', allSeries.length);
          return allSeries;
        } catch (sdkError) {
          console.log('SDK falhou, usando HTTP direto...', sdkError.message);
          // Fallback para HTTP direto
          const response = await fetch(`${this.baseUrl}/series`);
          const allSeries = await response.json();
          console.log('Todas as séries encontradas via HTTP:', allSeries.length);
          return allSeries;
        }
      } else {
        console.log('SDK não disponível ou serie.list não encontrado, usando HTTP direto...');
        // Fallback para HTTP direto
        const response = await fetch(`${this.baseUrl}/series`);
        const allSeries = await response.json();
        console.log('Todas as séries encontradas via HTTP:', allSeries.length);
        return allSeries;
      }
    } catch (error) {
      console.error('Erro ao buscar todas as séries:', error);
      throw error;
    }
  }

  // Buscar todas as expansões disponíveis para o idioma atual
  async getAllSets() {
    try {
      console.log('Buscando todas as expansões...');
      
      // Verificar se o SDK está disponível e tem a propriedade set
      if (this.tcgdex && this.tcgdex.set && typeof this.tcgdex.set.list === 'function') {
        try {
          const allSets = await this.tcgdex.set.list();
          console.log('Todas as expansões encontradas via SDK:', allSets.length);
          return allSets;
        } catch (sdkError) {
          console.log('SDK falhou, usando HTTP direto...', sdkError.message);
          // Fallback para HTTP direto
          const response = await fetch(`${this.baseUrl}/sets`);
          const allSets = await response.json();
          console.log('Todas as expansões encontradas via HTTP:', allSets.length);
          return allSets;
        }
      } else {
        console.log('SDK não disponível ou set.list não encontrado, usando HTTP direto...');
        // Fallback para HTTP direto
        const response = await fetch(`${this.baseUrl}/sets`);
        const allSets = await response.json();
        console.log('Todas as expansões encontradas via HTTP:', allSets.length);
        return allSets;
      }
    } catch (error) {
      console.error('Erro ao buscar todas as expansões:', error);
      throw error;
    }
  }

  // Buscar expansões filtradas por configurações do usuário
  async getFilteredSets() {
    try {
      console.log('Buscando expansões filtradas...');
      
      // Buscar configurações salvas específicas do idioma atual
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const expansionsKey = `selectedExpansions_${this.language}`;
      const savedExpansions = await AsyncStorage.getItem(expansionsKey);
      
      if (!savedExpansions) {
        console.log('Nenhuma expansão selecionada, retornando todas');
        return await this.getAllSets();
      }
      
      const selectedExpansionIds = JSON.parse(savedExpansions);
      const allSets = await this.getAllSets();
      
      // Filtrar apenas as expansões selecionadas
      const filteredSets = allSets.filter(set => 
        selectedExpansionIds.includes(set.id)
      );
      
      console.log('Expansões filtradas:', filteredSets.length);
      return filteredSets;
    } catch (error) {
      console.error('Erro ao buscar expansões filtradas:', error);
      throw error;
    }
  }

  // Buscar cartas filtradas por configurações do usuário
  async getFilteredCards() {
    try {
      console.log('Buscando cartas filtradas...');
      
      // Buscar configurações salvas específicas do idioma atual
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const expansionsKey = `selectedExpansions_${this.language}`;
      const savedExpansions = await AsyncStorage.getItem(expansionsKey);
      
      if (!savedExpansions) {
        console.log('Nenhuma expansão selecionada, retornando todas as cartas');
        return await this.getAllCards();
      }
      
      const selectedExpansionIds = JSON.parse(savedExpansions);
      const allCards = await this.getAllCards();
      
      // Filtrar apenas cartas das expansões selecionadas
      const filteredCards = allCards.filter(card => {
        const setId = card.set?.id || card.id?.split('-')[0];
        return selectedExpansionIds.includes(setId);
      });
      
      console.log('Cartas filtradas:', filteredCards.length);
      return filteredCards;
    } catch (error) {
      console.error('Erro ao buscar cartas filtradas:', error);
      throw error;
    }
  }

  // Buscar todas as cartas (método auxiliar)
  async getAllCards() {
    try {
      console.log('Buscando todas as cartas...');
      
      if (!this.tcgdex) {
        throw new Error('SDK tcgdex não inicializado');
      }
      
      const allCards = await this.tcgdex.card.list();
      console.log('Todas as cartas encontradas:', allCards.length);
      return allCards;
    } catch (error) {
      console.error('Erro ao buscar todas as cartas:', error);
      throw error;
    }
  }

  // Método de teste para verificar SDK
  async testSDK() {
    try {
      console.log('🧪 Testando SDK TCGdex...');
      
      if (!this.tcgdex) {
        console.log('❌ SDK não inicializado');
        return false;
      }
      
      console.log('✅ SDK inicializado');
      
      // Teste rápido de funcionalidade
      try {
        const testSeries = await this.tcgdex.serie.list();
        console.log('✅ SDK funcionando! Séries encontradas:', testSeries.length);
        
        // Investigar campos de metadata disponíveis
        if (testSeries.length > 0) {
          console.log('🔍 Investigando campos de metadata...');
          const firstSerie = testSeries[0];
          console.log('Campos da série:', Object.keys(firstSerie));
          // Evitar erro de JSON circular
          const serieInfo = {
            id: firstSerie.id,
            name: firstSerie.name,
            logo: firstSerie.logo
          };
          console.log('Exemplo de série:', JSON.stringify(serieInfo, null, 2));
        }
        
        // Testar cards para ver campo 'updated'
        try {
          const testCards = await this.tcgdex.card.list();
          if (testCards.length > 0) {
            console.log('🔍 Investigando campos de cards...');
            const firstCard = testCards[0];
            console.log('Campos do card:', Object.keys(firstCard));
            console.log('Campo updated:', firstCard.updated);
            // Evitar erro de JSON circular
            const cardInfo = {
              id: firstCard.id,
              name: firstCard.name,
              updated: firstCard.updated,
              image: firstCard.image
            };
            console.log('Exemplo de card:', JSON.stringify(cardInfo, null, 2));
          }
        } catch (e) {
          console.log('❌ Erro ao testar cards:', e.message);
        }
        
        return true;
      } catch (e) {
        console.log('❌ SDK não está funcionando:', e.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro no teste do SDK:', error);
      return false;
    }
  }

  // Verificar atualizações comparando com dados offline
  async checkForUpdates() {
    try {
      console.log('Verificando atualizações...');
      
      // Verificar se há dados offline
      const hasOfflineData = await OfflineService.hasOfflineData();
      if (!hasOfflineData) {
        console.log('📁 Nenhum dado offline encontrado, carregando dados iniciais...');
        await OfflineService.loadLocalData();
        return { needsUpdate: false, message: 'Dados offline carregados pela primeira vez' };
      }

      // Buscar dados atuais da API
      const apiData = {
        series: await this.tcgdex.serie.list(),
        sets: await this.tcgdex.set.list(),
        cards: await this.tcgdex.card.list()
      };

      // Verificar atualizações
      const updateCheck = await OfflineService.checkForUpdates(apiData);
      
      if (updateCheck.needsUpdate) {
        console.log('Atualizações disponíveis:', updateCheck);
        return {
          needsUpdate: true,
          newItems: updateCheck.newItems || updateCheck.differences,
          message: `Encontradas ${updateCheck.newItems?.series || 0} séries, ${updateCheck.newItems?.sets || 0} expansões e ${updateCheck.newItems?.cards || 0} cartas novas`
        };
      }

      return { needsUpdate: false, message: 'Dados estão atualizados' };

    } catch (error) {
      console.error('❌ Erro ao verificar atualizações:', error);
      return { needsUpdate: false, error: error.message };
    }
  }

  // Atualizar dados offline usando armazenamento otimizado
  async updateOfflineData() {
    try {
      console.log('Atualizando dados offline...');
      
      // Buscar dados atuais da API
      const apiData = {
        series: await this.tcgdex.serie.list(),
        sets: await this.tcgdex.set.list(),
        cards: await this.tcgdex.card.list()
      };

      // Atualizar dados usando serviço otimizado
      const result = await OptimizedStorageService.updateData(apiData, this.language);
      
      if (result.success) {
        const stats = await OptimizedStorageService.getStats(this.language);
        return {
          success: true,
          newCounts: result.newCounts,
          totalCounts: stats,
          message: result.message
        };
      } else {
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      console.error('Erro ao atualizar dados offline:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao atualizar dados'
      };
    }
  }

  // Obter resumo dos dados offline
  async getOfflineSummary() {
    try {
      const stats = await OptimizedStorageService.getStats(this.language);
      return {
        hasData: stats.series > 0 || stats.sets > 0 || stats.cards > 0,
        counts: stats,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter resumo offline:', error);
      return { hasData: false, error: error.message };
    }
  }

  // Buscar séries do armazenamento otimizado
  async getSeriesFromStorage() {
    try {
      return await OptimizedStorageService.loadData('series', this.language);
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
      return [];
    }
  }

  // Buscar sets do armazenamento otimizado
  async getSetsFromStorage(seriesId = null) {
    try {
      const allSets = await OptimizedStorageService.loadData('sets', this.language);
      if (seriesId) {
        return allSets.filter(set => set.serie?.id === seriesId);
      }
      return allSets;
    } catch (error) {
      console.error('Erro ao buscar sets:', error);
      return [];
    }
  }

  // Buscar cartas do armazenamento otimizado
  async getCardsFromStorage(setId) {
    try {
      const allCards = await OptimizedStorageService.loadData('cards', this.language);
      return allCards.filter(card => card.set?.id === setId);
    } catch (error) {
      console.error('Erro ao buscar cartas:', error);
      return [];
    }
  }
}

// Criar instância única do serviço
const tcgdexService = new TCGdexService('pt');

export default tcgdexService;