import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
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

  useEffect(() => {
    loadCards();
  }, [setId]);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log(`Carregando cards filtrados do set ${setId} do banco de dados...`);
      const cardsData = await FilterService.getFilteredCardsBySet(setId);
      
      // Se não há cards no banco, tentar buscar da API
      if (cardsData.length === 0) {
        console.log('Nenhum card encontrado no banco, buscando da API...');
        try {
          const apiCards = await TCGdexService.getCardsBySet(setId);
          if (apiCards.length > 0) {
            console.log(`${apiCards.length} cards encontrados na API`);
            setCards(apiCards);
            return;
          }
        } catch (apiError) {
          console.error('Erro ao buscar cards da API:', apiError);
        }
      }
      
      setCards(cardsData);
      console.log(`${cardsData.length} cards carregados (com filtros aplicados)`);
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

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCardItem = ({ item }: { item: PokemonCard }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => handleCardPress(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.cardImage}
        resizeMode="contain"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardRarity}>{item.rarity}</Text>
        {item.price > 0 && (
          <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar cards..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />
      
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
});

