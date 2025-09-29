import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import CardItem from '../components/CardItem';
import TCGdexService from '../services/TCGdexService';
import ImageDownloadService from '../services/ImageDownloadService';
import OfflineService from '../services/OfflineService';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 60) / numColumns;

const CardsScreen = ({ route, navigation }) => {
  const { setId, setName, setCardCount } = route.params;
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCards, setFilteredCards] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCard, setCurrentCard] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: setName });
    loadCards();
  }, [setId]);

  useEffect(() => {
    filterCards();
  }, [cards, searchText]);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando cartas da expansão:', setName);
      
      // Buscar configurações salvas específicas do idioma atual
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const languageKey = savedLanguage || 'pt';
      const expansionsKey = `selectedExpansions_${languageKey}`;
      const savedExpansions = await AsyncStorage.getItem(expansionsKey);
      
      let cardsData;
      if (savedExpansions) {
        // Verificar se esta expansão está nas configurações do usuário
        const selectedExpansionIds = JSON.parse(savedExpansions);
        if (selectedExpansionIds.includes(setId)) {
          // Tentar carregar dados offline primeiro
          try {
            console.log('📁 Tentando carregar dados offline...');
            const offlineCards = await OfflineService.loadCardsFromJSON();
            
            // Filtrar cartas da expansão específica
            const setCards = offlineCards.filter(card => card.set?.id === setId);
            
            if (setCards.length > 0) {
              console.log(`✅ Encontradas ${setCards.length} cartas offline para ${setId}`);
              cardsData = setCards;
            } else {
              console.log('Nenhuma carta offline encontrada, usando SDK...');
              cardsData = await TCGdexService.getCardsBySet(setId);
            }
          } catch (error) {
            console.log('❌ Erro ao carregar dados offline, usando SDK:', error.message);
            cardsData = await TCGdexService.getCardsBySet(setId);
          }
          console.log('Cartas carregadas (expansão selecionada):', cardsData.length);
        } else {
          // Se a expansão não está selecionada, mostrar mensagem
          cardsData = [];
          console.log('Expansão não selecionada nas configurações');
        }
      } else {
        // Usar dados offline se disponíveis
        try {
          console.log('📁 Tentando carregar dados offline...');
          const offlineCards = await OfflineService.loadCardsFromJSON();
          const setCards = offlineCards.filter(card => card.set?.id === setId);
          
          if (setCards.length > 0) {
            console.log(`✅ Encontradas ${setCards.length} cartas offline para ${setId}`);
            cardsData = setCards;
          } else {
            console.log('⚠️ Nenhuma carta offline encontrada, usando SDK...');
            cardsData = await TCGdexService.getCardsBySet(setId);
          }
        } catch (error) {
          console.log('❌ Erro ao carregar dados offline, usando SDK:', error.message);
          cardsData = await TCGdexService.getCardsBySet(setId);
        }
        console.log('Cartas padrão:', cardsData.length);
      }
      
      // Ordenar cartas por número
      const sortedCards = cardsData.sort((a, b) => {
        const numA = parseInt(a.localId) || 0;
        const numB = parseInt(b.localId) || 0;
        return numA - numB;
      });
      
      console.log(`Exibindo ${sortedCards.length} cartas`);
      
      setCards(sortedCards);
    } catch (error) {
      console.error('Erro ao carregar cartas:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar as cartas desta coleção.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  };

  const filterCards = () => {
    if (!searchText.trim()) {
      setFilteredCards(cards);
    } else {
      const filtered = cards.filter(card =>
        card.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCards(filtered);
    }
  };

  const handleCardPress = (card) => {
    // Criar uma cópia limpa da carta sem funções do SDK
    const cleanCard = {
      id: card.id,
      name: card.name,
      image: card.image,
      localId: card.localId,
      rarity: card.rarity,
      category: card.category,
      hp: card.hp,
      types: card.types,
      stage: card.stage,
      suffix: card.suffix,
      dexId: card.dexId,
      illustrator: card.illustrator,
      set: card.set ? {
        id: card.set.id,
        name: card.set.name,
        symbol: card.set.symbol,
        cardCount: card.set.cardCount
      } : null,
      variants: card.variants,
      attacks: card.attacks,
      weaknesses: card.weaknesses,
      resistances: card.resistances
    };
    
    navigation.navigate('CardDetail', { 
      card: cleanCard,
      setCardCount: setCardCount
    });
  };

  const handleDownloadComplete = (downloadedSetId) => {
    // Recarregar as cartas para mostrar as imagens baixadas
    loadCards();
  };

  const showDownloadInfo = () => {
    Alert.alert(
      'Sobre o Download',
      `Esta coleção possui ${cards.length} cartas.\n\nO download salvará todas as imagens no seu dispositivo para visualização offline. Cada imagem ocupa aproximadamente 500KB de espaço.`,
      [{ text: 'Entendi', style: 'default' }]
    );
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setProgress(0);
      setCurrentCard('');

      // Verificar espaço disponível
      const availableSpace = await ImageDownloadService.getAvailableSpace();
      const estimatedSize = cards.length * 0.5; // ~500KB por imagem
      
      if (availableSpace < estimatedSize * 1024 * 1024) {
        Alert.alert(
          'Espaço Insuficiente',
          'Não há espaço suficiente no dispositivo para baixar esta coleção.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Iniciar download
      const result = await ImageDownloadService.downloadSetImages(
        setId,
        cards,
        (progressData) => {
          setProgress(progressData.progress);
          setCurrentCard(progressData.currentCard);
        }
      );

      Alert.alert(
        'Download Concluído!',
        `Coleção ${setName} baixada com sucesso!\n${result.downloaded}/${result.total} imagens.`,
        [{ text: 'OK' }]
      );

      // Recarregar as cartas para mostrar as imagens baixadas
      loadCards();
    } catch (error) {
      console.error('Erro no download:', error);
      Alert.alert(
        'Erro no Download',
        'Ocorreu um erro ao baixar as imagens. Verifique sua conexão com a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
      setProgress(0);
      setCurrentCard('');
    }
  };

  const renderCardItem = ({ item }) => (
    <CardItem 
      card={item} 
      onPress={handleCardPress} 
      itemWidth={itemWidth}
      setCardCount={setCardCount}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando cartas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cartas..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchText('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.headerText}>
          {filteredCards.length} de {cards.length} cartas
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.downloadButton, downloading && styles.downloadButtonActive]}
            onPress={handleDownload}
            disabled={downloading}
          >
            <Text style={styles.downloadButtonText}>
              {downloading ? `Baixando... ${Math.round(progress)}%` : 'Baixar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => showDownloadInfo()}
          >
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {downloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%` }
              ]} 
            />
          </View>
          {currentCard && (
            <Text style={styles.currentCardText}>
              Baixando: {currentCard}
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={filteredCards}
        renderItem={renderCardItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#666',
  },
  helpButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  downloadButtonActive: {
    backgroundColor: '#FFA726',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  currentCardText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 10,
  },
});

export default CardsScreen;
