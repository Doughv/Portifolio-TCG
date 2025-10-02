import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DatabaseService, { PokemonSeries } from '../services/DatabaseService';
import FilterService from '../services/FilterService';
import LogoService from '../services/LogoService';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 2 colunas com padding

interface SeriesWithLogo extends PokemonSeries {
  logoPath?: string;
}

export default function SeriesScreen() {
  const navigation = useNavigation();
  const [series, setSeries] = useState<SeriesWithLogo[]>([]);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      console.log('Carregando séries filtradas do banco de dados...');
      const seriesData = await FilterService.getFilteredSeries();
      
      // Carregar séries primeiro sem logos (para não bloquear a UI)
      const seriesWithoutLogos = seriesData.map(series => ({ ...series, logoPath: null }));
      setSeries(seriesWithoutLogos);
      console.log(`${seriesWithoutLogos.length} séries carregadas (sem logos ainda)`);
      
      // Carregar logos em background de forma assíncrona
      loadLogosInBackground(seriesData);
      
    } catch (error) {
      console.error('Error loading filtered series:', error);
    }
  };

  const loadLogosInBackground = async (seriesData: any[]) => {
    console.log('🔽 Iniciando carregamento de logos de séries em background...');
    
    // Processar todos os logos de uma vez (agora é rápido com cache)
    const seriesWithLogos = await Promise.all(
      seriesData.map(async (seriesItem) => {
        try {
          // Passar logoUrl se existir no JSON da série
          const logoUrl = seriesItem.logo || undefined;
          const logoPath = await LogoService.getSeriesLogo(seriesItem.id, logoUrl);
          
          console.log(`✅ Logo de série processado para ${seriesItem.id}:`, logoPath ? 'sucesso' : 'não encontrado');
          return { ...seriesItem, logoPath };
        } catch (error) {
          console.error(`❌ Erro ao processar logo de série para ${seriesItem.id}:`, error);
          return { ...seriesItem, logoPath: null };
        }
      })
    );
    
    // Atualizar todas as séries de uma vez
    setSeries(seriesWithLogos);
    console.log('🎯 Todos os logos de séries processados e atualizados!');
  };

  const handleSeriesPress = (seriesId: string) => {
    navigation.navigate('Sets' as never, { seriesId } as never);
  };

  const renderSeriesItem = ({ item }: { item: SeriesWithLogo }) => (
    <TouchableOpacity
      style={[styles.seriesCard, { width: itemWidth }]}
      onPress={() => handleSeriesPress(item.id)}
    >
      <View style={styles.logoContainer}>
        {item.logoPath ? (
          <Image 
            source={{ uri: item.logoPath }} 
            style={styles.seriesLogo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderText}>🎴</Text>
          </View>
        )}
      </View>
      <View style={styles.seriesInfo}>
        <Text style={styles.seriesName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.seriesSets}>{item.totalSets} expansões</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={series}
        renderItem={renderSeriesItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  seriesCard: {
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
    height: 120,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesLogo: {
    width: '90%',
    height: '90%',
  },
  placeholderLogo: {
    width: '90%',
    height: '90%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.5,
  },
  seriesInfo: {
    width: '100%',
    alignItems: 'center',
  },
  seriesName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  seriesSets: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

