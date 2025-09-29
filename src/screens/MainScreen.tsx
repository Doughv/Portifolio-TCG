import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TCGdexService from '../services/TCGdexService';
import FilterService from '../services/FilterService';

type RootStackParamList = {
  Main: undefined;
  LanguageConfig: { language: string };
  Series: undefined;
  Settings: undefined;
};

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function MainScreen() {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [currentLanguage, setCurrentLanguage] = useState('pt');

  useEffect(() => {
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de idioma:', error);
    }
  };

  const handleLanguageConfigPress = async (language: string) => {
    try {
      // Atualizar idioma no serviço
      await TCGdexService.setLanguage(language);
      
      // Recarregar filtros para o novo idioma
      await FilterService.loadSettings(language);
      
      // Salvar idioma selecionado
      await AsyncStorage.setItem('selectedLanguage', language);
      
      // Atualizar estado local
      setCurrentLanguage(language);
      
      console.log('✅ Idioma alterado para:', language);
      
      // Navegar para configurações de idioma
      navigation.navigate('LanguageConfig', { language });
    } catch (error) {
      console.error('❌ Erro ao alterar idioma:', error);
    }
  };

  const handleCollectionsPress = () => {
    navigation.navigate('Series');
  };

  const handleSettingsPress = () => {
    navigation.navigate('LanguageConfig', { language: currentLanguage });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header simples */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pokémon TCG</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Pokémon TCG V2 🔥</Text>
        <Text style={styles.subtitle}>Seu guia completo para cartas Pokémon - HOT RELOAD FUNCIONANDO!</Text>
        
        <TouchableOpacity 
          style={styles.collectionsButton}
          onPress={handleCollectionsPress}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>📚</Text>
            <Text style={styles.buttonText}>COLEÇÕES</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonIcon}>⚙</Text>
            <Text style={styles.buttonText}>CONFIGURAÇÕES</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.description}>
          Explore todas as coleções e expansões de cartas Pokémon
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  collectionsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsButton: {
    backgroundColor: '#6c757d',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
