import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatabaseService, { PokemonSet } from '../services/DatabaseService';
import FilterService from '../services/FilterService';
import TCGdexService from '../services/TCGdexService';
import ImageDownloadService from '../services/ImageDownloadService';
import LogoService from '../services/LogoService';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 2 colunas com padding

interface SetWithLogo extends PokemonSet {
  logoPath?: string | null;
}

export default function SetsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { seriesId } = route.params as { seriesId: string };

  const [sets, setSets] = useState<SetWithLogo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSets();
  }, [seriesId]);

  const loadSets = async () => {
    try {
      setLoading(true);
      console.log(`Carregando sets filtrados da série ${seriesId} do banco de dados...`);
      const setsData = await FilterService.getFilteredSetsBySeries(seriesId);
      
      // Carregar sets primeiro sem logos (para não bloquear a UI)
      const setsWithoutLogos = setsData.map(set => ({ ...set, logoPath: null }));
      setSets(setsWithoutLogos);
      console.log(`${setsWithoutLogos.length} sets carregados (sem logos ainda)`);
      
      // Carregar logos em background de forma assíncrona
      loadLogosInBackground(setsData);
      
    } catch (error) {
      console.error('Error loading filtered sets:', error);
      Alert.alert('Erro', 'Não foi possível carregar os sets');
    } finally {
      setLoading(false);
    }
  };

  const loadLogosInBackground = async (setsData: any[]) => {
    console.log('🔽 Iniciando carregamento de logos em background...');
    
    // Processar todos os logos de uma vez (agora é rápido com cache)
    const setsWithLogos = await Promise.all(
      setsData.map(async (set) => {
        try {
          // Usar logo primeiro, depois symbol como fallback
          const logoUrl = set.logo || set.symbol || undefined;
          const logoPath = await LogoService.getSetLogo(set.id, logoUrl);
          
          console.log(`✅ Logo processado para ${set.id}:`, logoPath ? 'sucesso' : 'não encontrado');
          return { ...set, logoPath };
        } catch (error) {
          console.error(`❌ Erro ao processar logo para ${set.id}:`, error);
          return { ...set, logoPath: null };
        }
      })
    );
    
    // Atualizar todos os sets de uma vez
    setSets(setsWithLogos);
    console.log('🎯 Todos os logos processados e atualizados!');
  };

  const handleSetPress = (setId: string) => {
    (navigation as any).navigate('Cards', { setId });
  };

  const renderSetItem = ({ item }: { item: SetWithLogo }) => (
    <TouchableOpacity
      style={[styles.setItem, { width: itemWidth }]}
      onPress={() => handleSetPress(item.id)}
    >
      <View style={styles.logoContainer}>
        {item.logoPath ? (
          <Image 
            source={{ uri: item.logoPath }} 
            style={styles.setLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderText}>⚡</Text>
          </View>
        )}
      </View>
      <View style={styles.setInfo}>
        <View style={styles.nameWithSymbol}>
          <Text style={styles.setName} numberOfLines={2}>{item.name}</Text>
          {item.symbol && (
            <Image 
              source={{ uri: item.symbol + '.webp' }} 
              style={styles.symbolIcon}
              resizeMode="contain"
            />
          )}
        </View>
        <Text style={styles.setCards}>{item.totalCards} cartas</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando sets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.subtitle}>
            {sets.length} disponíveis
          </Text>
        </View>
      </View>
      
      <FlatList
        data={sets}
        renderItem={renderSetItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  gridContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  setItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    height: 100,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setLogo: {
    width: '80%',
    height: '80%',
  },
  placeholderLogo: {
    width: '80%',
    height: '80%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 28,
    opacity: 0.5,
  },
  setInfo: {
    width: '100%',
    alignItems: 'center',
  },
  nameWithSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    width: '100%',
  },
  setName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  symbolIcon: {
    width: 20,
    height: 20,
    marginLeft: 6,
  },
  setCards: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

