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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService, { PokemonCard } from '../services/DatabaseService';
import FilterService from '../services/FilterService';
import TCGdexService from '../services/TCGdexService';
import ImageDownloadService from '../services/ImageDownloadService';

export default function CardsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setId } = route.params as { setId: string };
  
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadingImages, setDownloadingImages] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingDetails, setDownloadingDetails] = useState(false);

  useEffect(() => {
    loadCards();
  }, [setId]);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Carregando cards do set ${setId} do banco de dados...`);
      const cardsData = await FilterService.getFilteredCardsBySet(setId);
      console.log(`📊 Encontrados ${cardsData.length} cards no banco para o set ${setId}`);
      
      if (cardsData.length > 0) {
        console.log(`✅ Cards carregados: ${cardsData.slice(0, 3).map(c => c.name).join(', ')}...`);
        setCards(cardsData);
        return;
      }
      
      // Se não há cards no banco, tentar buscar da API
      console.log('⚠️ Nenhum card encontrado no banco, buscando da API...');
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
    navigation.navigate('CardDetail' as never, { card } as never);
  };

  const handleDownloadDetails = async () => {
    try {
      setDownloadingDetails(true);
      console.log('Baixando detalhes das cartas...');
      
      const result = await TCGdexService.downloadCardDetails(setId);
      console.log('Resultado do download de detalhes:', result);
      
      if (result.success) {
        Alert.alert('Sucesso', result.message);
        await loadCards(); // Recarregar cartas após atualização
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro ao baixar detalhes:', error);
      Alert.alert('Erro', 'Falha ao baixar detalhes das cartas');
    } finally {
      setDownloadingDetails(false);
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
      case 'raro holo':
        return '#FF4444'; // Vermelho vibrante
      case 'raro ultra':
        return '#9C27B0'; // Roxo vibrante
      case 'raro secreto':
        return '#E91E63'; // Rosa vibrante
      case 'rare':
        return '#FFD700'; // Dourado
      case 'uncommon':
        return '#C0C0C0'; // Prata
      case 'common':
        return '#CD7F32'; // Bronze
      case 'rare holo':
        return '#FF4444'; // Vermelho
      case 'rare ultra':
        return '#9C27B0'; // Roxo
      case 'rare secret':
        return '#E91E63'; // Rosa
      default:
        return '#90A4AE'; // Cinza
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fire':
      case 'fogo':
        return '#FF4444'; // Vermelho vibrante
      case 'grass':
      case 'planta':
        return '#4CAF50'; // Verde vibrante
      case 'water':
      case 'água':
      case 'agua':
        return '#2196F3'; // Azul vibrante
      case 'electric':
      case 'elétrico':
      case 'eletrico':
        return '#FFD700'; // Amarelo dourado
      case 'fighting':
      case 'lutador':
        return '#8D6E63'; // Marrom
      case 'psychic':
      case 'psíquico':
      case 'psiquico':
        return '#9C27B0'; // Roxo vibrante
      case 'dark':
      case 'sombrio':
        return '#424242'; // Cinza escuro
      case 'metal':
      case 'steel':
        return '#607D8B'; // Azul acinzentado
      case 'normal':
      case 'incolor':
        return '#E0E0E0'; // Cinza claro
      case 'fairy':
      case 'fada':
        return '#E91E63'; // Rosa vibrante
      case 'dragon':
      case 'dragão':
      case 'dragao':
        return '#673AB7'; // Roxo escuro
      default:
        return '#90A4AE'; // Cinza padrão
    }
  };

  const filteredCards = cards
    .filter(card =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Ordenar por localId se disponível, senão por nome
      if (a.localId && b.localId) {
        return parseInt(a.localId) - parseInt(b.localId);
      }
      return a.name.localeCompare(b.name);
    });

  const renderCardItem = ({ item }: { item: PokemonCard }) => {
    const imageUrl = TCGdexService.getImageURL(item, 'high', 'webp');
    
    return (
      <TouchableOpacity
        style={styles.cardItem}
        onPress={() => handleCardPress(item)}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          resizeMode="contain"
        />
        <View style={styles.cardInfo}>
          {/* Nome e ID */}
          <View style={styles.headerInfo}>
            <Text style={styles.cardName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.cardId}>
              {item.localId ? `${item.localId.padStart(3, '0')}/${cards.length}` : '???/???'}
            </Text>
          </View>
          
          {/* Raridade */}
          {item.rarity && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Raridade:</Text>
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity) }]}>
                <Text style={styles.rarityBadgeText}>{item.rarity}</Text>
              </View>
            </View>
          )}
          
          {/* Tipo */}
          {item.types && item.types.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <View style={styles.typeContainer}>
                {item.types.map((type, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.typeBadge, 
                      { backgroundColor: getTypeColor(type) }
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>{type}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Preço */}
          {item.price > 0 && (
            <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar cards..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity
        style={[styles.downloadButton, downloadingDetails && styles.downloadButtonDisabled]}
        onPress={handleDownloadDetails}
        disabled={downloadingDetails}
      >
        <Text style={styles.downloadButtonText}>
          {downloadingDetails ? 'Baixando...' : '📥 Baixar Detalhes'}
        </Text>
      </TouchableOpacity>
      
      <FlatList
        data={filteredCards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    flex: 1,
    maxWidth: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardRarity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerInfo: {
    marginBottom: 6,
  },
  cardId: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rarityBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  typeBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

