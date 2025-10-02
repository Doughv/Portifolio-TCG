import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService, { PokemonCard } from '../services/DatabaseService';
import FilterService from '../services/FilterService';
import TCGdexService from '../services/TCGdexService';
import ImageDownloadService from '../services/ImageDownloadService';

// Componente separado para o item da carta (permite usar hooks)
const CardItem = ({ card, setId, cardsLength, onPress }: { 
  card: PokemonCard; 
  setId: string; 
  cardsLength: number; 
  onPress: (card: PokemonCard) => void;
}) => {
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  
  useEffect(() => {
    loadImageWithCache();
  }, [card.id]);
  
  const loadImageWithCache = async () => {
    try {
      setIsLoadingImage(true);
      
      // 1. Verificar se já existe no cache local
      const cachedImage = await ImageDownloadService.isImageDownloaded(card.id);
      if (cachedImage) {
        console.log(`📱 Usando imagem em cache: ${card.name}`);
        setImageSource({ uri: cachedImage.localPath });
        setIsLoadingImage(false);
        return;
      }
      
      // 2. Se não existe, usar URL da API e baixar em background
      console.log(`🌐 Carregando imagem da API: ${card.name}`);
      const imageUrl = TCGdexService.getImageURL(card, 'high', 'webp');
      setImageSource({ uri: imageUrl });
      setIsLoadingImage(false);
      
      // 3. Baixar e salvar em cache em background (sem bloquear UI)
      try {
        await ImageDownloadService.downloadCardImage(card, setId);
        console.log(`💾 Imagem salva em cache: ${card.name}`);
      } catch (error) {
        console.log(`⚠️ Erro ao salvar em cache: ${card.name}`, error);
        // Não mostrar erro para o usuário, apenas log
      }
      
    } catch (error) {
      console.error(`❌ Erro ao carregar imagem: ${card.name}`, error);
      setIsLoadingImage(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'raro':
        return '#FFD700'; // Dourado vibrante
      case 'incomum':
        return '#C0C0C0'; // Prata
      case 'comum':
        return '#CD7F32'; // Bronze
      case 'rara':
        return '#FFD700'; // Dourado
      case 'rara holofoil':
        return '#FFD700'; // Dourado
      case 'rara ultra':
        return '#FFD700'; // Dourado
      case 'rara secreta':
        return '#FFD700'; // Dourado
      default:
        return '#666'; // Cinza padrão
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fogo':
        return '#FF4444'; // Vermelho vibrante
      case 'grama':
      case 'planta':
        return '#4CAF50'; // Verde vibrante
      case 'água':
      case 'agua':
        return '#2196F3'; // Azul vibrante
      case 'elétrico':
      case 'eletrico':
        return '#FFD700'; // Amarelo dourado
      case 'lutador':
        return '#8D6E63'; // Marrom
      case 'psíquico':
      case 'psiquico':
        return '#9C27B0'; // Roxo vibrante
      case 'sombrio':
        return '#424242'; // Cinza escuro
      case 'metal':
        return '#607D8B'; // Azul acinzentado
      case 'incolor':
        return '#E0E0E0'; // Cinza claro
      case 'fada':
        return '#E91E63'; // Rosa vibrante
      case 'dragão':
      case 'dragao':
        return '#673AB7'; // Roxo escuro
      case 'terra':
        return '#8D6E63'; // Marrom claro
      case 'pedra':
        return '#795548'; // Marrom
      case 'gelo':
        return '#00BCD4'; // Ciano vibrante
      case 'voador':
        return '#81C784'; // Verde claro
      case 'veneno':
        return '#7B1FA2'; // Roxo escuro
      case 'inseto':
        return '#689F38'; // Verde escuro
      case 'fantasma':
        return '#512DA8'; // Roxo muito escuro
      default:
        return '#90A4AE'; // Cinza padrão
    }
  };

  const isPokemonCard = (card: PokemonCard) => {
    return card.category === 'Pokemon' || 
           (card.types && Array.isArray(card.types) && card.types.length > 0) ||
           card.hp !== null;
  };


  const isTrainerWithVeryLongName = (card: PokemonCard) => {
    const isTrainer = card.category === 'Trainer' || !isPokemonCard(card);
    const words = card.name.split(' ');
    return isTrainer && words.length > 2; // Treinador com mais de 2 palavras
  };

  const getTruncatedName = (name: string) => {
    const words = name.split(' ');
    if (words.length <= 2) return name;
    return `${words[0]} ${words[1]}...`;
  };
  
  return (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => onPress(card)}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.cardImage}
          resizeMode="contain"
          onLoad={() => setIsLoadingImage(false)}
          onError={() => {
            console.error(`❌ Erro ao carregar imagem: ${card.name}`);
            setIsLoadingImage(false);
          }}
        />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>🖼️</Text>
        </View>
      )}
      
      {isLoadingImage && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>📱</Text>
        </View>
      )}
      
      <View style={styles.cardInfo}>
        {/* Nome e ID - Layout simples sempre horizontal */}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardNameSmall} numberOfLines={1}>
              {isTrainerWithVeryLongName(card) ? getTruncatedName(card.name) : card.name}
            </Text>
            <View style={styles.cardIdContainer}>
              <Text style={styles.cardId}>
                {card.localId && card.set?.cardCount?.official ? 
                  `${card.localId.padStart(3, '0')}/${card.set.cardCount.official.toString().padStart(3, '0')}` : 
                  '???/???'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Ribbons de Tipo e Raridade */}
        <View style={styles.ribbonsContainer}>
          {/* Tipo (só para Pokémon) */}
          {isPokemonCard(card) && card.types && Array.isArray(card.types) && card.types.length > 0 && (
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(card.types[0]) }]}>
              <Text style={styles.typeText}>{card.types[0]}</Text>
            </View>
          )}
          
          {/* Espaçador flexível */}
          <View style={styles.spacer} />
          
          {/* Raridade - responsiva */}
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
            <Text 
              style={styles.rarityText} 
              numberOfLines={1} 
              adjustsFontSizeToFit 
              minimumFontScale={0.7}
              ellipsizeMode="tail"
            >
              {card.rarity}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function CardsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setId } = route.params as { setId: string };
  
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [cacheStats, setCacheStats] = useState<{
    totalImages: number;
    totalSizeMB: number;
    cacheDirectory: string;
    imagesBySet: { [setId: string]: { count: number; sizeMB: number } };
  } | null>(null);

  useEffect(() => {
    loadCards();
  }, [setId]);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Carregando cards do set ${setId} do banco de dados...`);
      
      // Verificar se o banco está inicializado
      await DatabaseService.initialize();
      console.log('✅ Banco de dados inicializado');
      
      // Verificar estatísticas do banco
      const dbStats = await DatabaseService.getStats();
      console.log('📊 Estatísticas do banco:', dbStats);
      
      // Verificar se há cards para este set
      const cardsData = await FilterService.getFilteredCardsBySet(setId);
      console.log(`📊 Encontrados ${cardsData.length} cards no banco para o set ${setId}`);
      
      if (cardsData.length > 0) {
        console.log(`✅ Cards carregados: ${cardsData.slice(0, 3).map(c => `${c.name} (${c.localId || 'sem ID'})`).join(', ')}...`);
        console.log(`🔍 Primeiro card detalhado:`, JSON.stringify(cardsData[0], null, 2));
        setCards(cardsData);
        return;
      }
      
      // Se não há cards no banco, verificar se é um set conhecido sem cartas
      console.log('⚠️ Nenhum card encontrado no banco para este set');
      
      // Lista de sets conhecidos que não têm cartas disponíveis na API
      const setsWithoutCards = [
        'base1', 'base2', 'base3', 'ex1', 'ex7', 'ex8', 'ex9', 'ex10',
        'dp1', 'dp2', 'dp3', 'hgss1', 'hgss2', 'hgss3', 'hgss4',
        'col1', 'dv1', 'bw11', 'dc1', 'g1', 'sm115', 'A1', 'A1a',
        'A2', 'A2a', 'A2b', 'A3', 'A4a', 'P-A'
      ];
      
      if (setsWithoutCards.includes(setId)) {
        console.log(`ℹ️ Set ${setId} é conhecido por não ter cartas disponíveis na API`);
        setCards([]);
        return;
      }
      
      // Para outros sets, tentar buscar da API (caso seja um set novo)
      console.log('🔍 Tentando buscar da API (set pode ser novo)...');
      try {
        const apiCards = await TCGdexService.getCardsBySet(setId);
        if (apiCards.length > 0) {
          console.log(`📡 ${apiCards.length} cards encontrados na API`);
          setCards(apiCards);
          return;
        }
      } catch (apiError) {
        console.error('❌ Erro ao buscar da API:', apiError);
      }
      
      console.log('❌ Nenhum card encontrado');
      setCards([]);
    } catch (error) {
      console.error('Error loading filtered cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImages = async () => {
    try {
      setDownloadingImages(true);
      setDownloadProgress(0);
      
      console.log(`Iniciando download de imagens para ${cards.length} cards...`);
      
      await ImageDownloadService.downloadSetImages(
        setId, 
        cards, 
        (progress, currentCard) => {
          setDownloadProgress(progress);
          console.log(`Progresso: ${progress.toFixed(1)}% - ${currentCard}`);
        }
      );
      
      console.log('Download de imagens concluído!');
      Alert.alert('Sucesso', 'Imagens baixadas com sucesso!');
    } catch (error) {
      console.error('Erro no download de imagens:', error);
      Alert.alert('Erro', 'Não foi possível baixar as imagens');
    } finally {
      setDownloadingImages(false);
      setDownloadProgress(0);
    }
  };

  const handleCardPress = (card: PokemonCard) => {
    // navigation.navigate('CardDetail', { card });
    console.log('Card pressionada:', card.name);
  };

  const loadCacheStats = async () => {
    try {
      const stats = await ImageDownloadService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do cache:', error);
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas do cache');
    }
  };

  const showCacheInfo = async () => {
    await loadCacheStats();
    setShowCacheModal(true);
  };

  const clearCache = async () => {
    Alert.alert(
      'Limpar Cache',
      'Tem certeza que deseja limpar todo o cache de imagens? Isso irá remover todas as imagens salvas localmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ImageDownloadService.clearImageCache();
              await loadCacheStats();
              Alert.alert('Sucesso', 'Cache de imagens limpo com sucesso!');
            } catch (error) {
              console.error('Erro ao limpar cache:', error);
              Alert.alert('Erro', 'Não foi possível limpar o cache');
            }
          }
        }
      ]
    );
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Fogo': '#FF6B6B',
      'Água': '#4ECDC4',
      'Planta': '#45B7D1',
      'Elétrico': '#FFA726',
      'Psíquico': '#AB47BC',
      'Lutador': '#8D6E63',
      'Escuridão': '#5D4037',
      'Metal': '#90A4AE',
      'Dragão': '#7E57C2',
      'Fada': '#F8BBD9',
      'Normal': '#A1887F',
      'Incolor': '#BDBDBD'
    };
    return colors[type] || '#BDBDBD';
  };

  const renderCardItem = ({ item }: { item: PokemonCard }) => {
    return <CardItem card={item} setId={setId} cardsLength={cards.length} onPress={handleCardPress} />;
  };

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Ordenar por localId se disponível
    if (a.localId && b.localId) {
      return parseInt(a.localId) - parseInt(b.localId);
    }
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando cartas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.infoButton}
          onPress={showCacheInfo}
        >
          <Text style={styles.infoButtonText}>📊</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredCards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de informações do cache */}
      <Modal
        visible={showCacheModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCacheModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Cache de Imagens</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCacheModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {cacheStats ? (
                <>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total de Imagens:</Text>
                    <Text style={styles.statValue}>{cacheStats.totalImages}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Tamanho Total:</Text>
                    <Text style={styles.statValue}>{cacheStats.totalSizeMB} MB</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Diretório:</Text>
                    <Text style={styles.statValueSmall}>{cacheStats.cacheDirectory}</Text>
                  </View>
                  
                  <Text style={styles.sectionTitle}>Por Coleção:</Text>
                  {Object.entries(cacheStats.imagesBySet).map(([setId, data]) => (
                    <View key={setId} style={styles.setStatRow}>
                      <Text style={styles.setStatLabel}>{setId}:</Text>
                      <Text style={styles.setStatValue}>
                        {data.count} imagens ({Math.round(data.sizeMB * 100) / 100} MB)
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.loadingText}>Carregando estatísticas...</Text>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearCache}
              >
                <Text style={styles.clearButtonText}>🗑️ Limpar Cache</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  infoButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#ccc',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardInfo: {
    padding: 12,
  },
  headerInfo: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  cardNameSmall: {
    fontSize: 13, // Fonte menor para todos os nomes
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  cardNameSmaller: {
    fontSize: 14, // Fonte menor para nomes longos
  },
  cardNameVertical: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4, // Espaço entre nome e ID no layout vertical
    flexShrink: 0, // Não encolhe
    width: '100%', // Usa toda a largura disponível
  },
  verticalLayout: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%', // Usa toda a largura disponível
  },
  cardIdContainer: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  cardId: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
  ribbonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    maxWidth: 120, // Limita o tamanho máximo
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1, // Permite encolher se necessário
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  statValueSmall: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  setStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 16,
  },
  setStatLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  setStatValue: {
    fontSize: 14,
    color: '#007AFF',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});