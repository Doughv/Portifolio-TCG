import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import ImageDownloadService from '../services/ImageDownloadService';
import TCGdexService from '../services/TCGdexService';

const { width } = Dimensions.get('window');

const CardItem = ({ card, onPress, itemWidth, setCardCount }) => {
  const [imageError, setImageError] = useState(false);
  const [localImagePath, setLocalImagePath] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const remoteImageUrl = TCGdexService.getImageURL(card, 'high', 'png');

  const getRarityColor = (rarity) => {
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

  const getTypeColor = (type) => {
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
      case 'ground':
      case 'terra':
        return '#8D6E63'; // Marrom claro
      case 'rock':
      case 'pedra':
        return '#795548'; // Marrom
      case 'ice':
      case 'gelo':
        return '#00BCD4'; // Ciano vibrante
      case 'flying':
      case 'voador':
        return '#81C784'; // Verde claro
      case 'poison':
      case 'veneno':
        return '#7B1FA2'; // Roxo escuro
      case 'bug':
      case 'inseto':
        return '#689F38'; // Verde escuro
      case 'ghost':
      case 'fantasma':
        return '#512DA8'; // Roxo muito escuro
      default:
        return '#90A4AE'; // Cinza padrão
    }
  };

  useEffect(() => {
    loadLocalImage();
  }, [card.id]);

  const loadLocalImage = async () => {
    try {
      if (card.set?.id) {
        const localPath = await ImageDownloadService.getLocalImagePath(card.id, card.set.id);
        if (localPath) {
          setLocalImagePath(localPath);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar imagem local:', error);
    } finally {
      setImageLoading(false);
    }
  };


  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleCardPress = () => {
    onPress(card);
  };

  // Debug: mostrar informações da carta
  console.log('Carta recebida:', {
    name: card.name,
    rarity: card.rarity,
    category: card.category,
    hp: card.hp,
    types: card.types,
    stage: card.stage,
    suffix: card.suffix,
    dexId: card.dexId,
    illustrator: card.illustrator
  });
  
  // Debug específico para badges
  console.log('Badges debug:', {
    hasRarity: !!card.rarity,
    rarityValue: card.rarity,
    rarityColor: card.rarity ? getRarityColor(card.rarity) : 'N/A',
    hasTypes: !!(card.types && card.types.length > 0),
    typesValue: card.types,
    typesColors: card.types ? card.types.map(t => getTypeColor(t)) : []
  });


  const renderImage = () => {
    // Priorizar imagem local se disponível
    const imageSource = localImagePath 
      ? { uri: localImagePath }
      : { uri: remoteImageUrl };

    return (
      <Image
        source={imageSource}
        style={styles.cardImage}
        resizeMode="contain"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    );
  };

  return (
    <TouchableOpacity style={[styles.container, { width: itemWidth }]} onPress={handleCardPress}>
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>...</Text>
          </View>
        )}
        
        {imageError ? (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>?</Text>
            <Text style={styles.placeholderSubtext}>
              {localImagePath ? 'Imagem local não encontrada' : 'Imagem não disponível'}
            </Text>
          </View>
        ) : (
          renderImage()
        )}
        
      </View>
      
      <View style={styles.cardInfo}>
        {/* Nome e ID */}
        <View style={styles.headerInfo}>
          <Text style={styles.cardName} numberOfLines={2}>
            {card.name}
          </Text>
          <Text style={styles.cardId}>
            {card.localId ? `${card.localId.padStart(3, '0')}/${setCardCount || card.set?.cardCount?.total || '???'}` : '???/???'}
          </Text>
        </View>
        
        {/* Raridade */}
        {card.rarity && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Raridade:</Text>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
              <Text style={styles.rarityBadgeText}>{card.rarity}</Text>
            </View>
          </View>
        )}
        
        {/* Tipo */}
        {card.types && card.types.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo:</Text>
            <View style={styles.typeContainer}>
              {card.types.map((type, index) => (
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
        
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  cardInfo: {
    padding: 10,
  },
  headerInfo: {
    marginBottom: 6,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
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
  infoValue: {
    fontSize: 11,
    color: '#333',
    flex: 1,
    textAlign: 'right',
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

export default CardItem;