import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import MainScreen from './src/screens/MainScreen';
import LanguageConfigScreen from './src/screens/LanguageConfigScreen';
import SeriesScreen from './src/screens/SeriesScreen';
import SetsScreen from './src/screens/SetsScreen';
import CardsScreen from './src/screens/CardsScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import UpdateScreen from './src/screens/UpdateScreen';

// Services
import DatabaseService from './src/services/DatabaseService';
import TCGdexService from './src/services/TCGdexService';
import OptimizedStorageService from './src/services/OptimizedStorageService';
import FilterService from './src/services/FilterService';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando app...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      
      // 1. Inicializar banco de dados
      setLoadingMessage('🔄 Conectando ao banco de dados...');
      setLoadingProgress(10);
      await DatabaseService.initialize();
      console.log('Database initialized');
      
      // 2. Configurar idioma fixo em português
      setLoadingMessage('🌍 Configurando idioma...');
      setLoadingProgress(20);
      await TCGdexService.setLanguage('pt');
      await FilterService.loadSettings('pt');
      console.log('App configurado para português brasileiro');
      
      // 3. Verificar se há dados no banco, se não, migrar dos JSONs
      setLoadingMessage('🔍 Verificando dados existentes...');
      setLoadingProgress(30);
      const stats = await DatabaseService.getStats();
      if (stats.series === 0 && stats.sets === 0 && stats.cards === 0) {
        console.log('No data in database, migrating from JSONs...');
        setLoadingMessage('📦 Abrindo os boosters...');
        setLoadingProgress(40);
        const migrationResult = await TCGdexService.migrateFromJSONs();
        if (migrationResult.success) {
          console.log('Migration successful:', migrationResult.message);
          setLoadingMessage('🃏 Organizando as cartas...');
          setLoadingProgress(80);
        } else {
          console.error('Migration failed:', migrationResult.message);
        }
      } else {
        console.log('Data already exists in database:', stats);
        setLoadingMessage('✅ Dados encontrados!');
        setLoadingProgress(80);
      }
      
      setLoadingMessage('🎉 Preparando o Portfólio TCG...');
      setLoadingProgress(100);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      // Mesmo com erro, permitir usar o app
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.pokeballContainer}>
          <View style={styles.pokeball}>
            <View style={styles.pokeballTop} />
            <View style={styles.pokeballCenter} />
            <View style={styles.pokeballBottom} />
          </View>
        </View>
        <Text style={styles.loadingMessage}>{loadingMessage}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${loadingProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{loadingProgress}%</Text>
        </View>
        <Text style={styles.loadingSubtext}>
          {isInitialized ? 'Sincronizando dados...' : 'Inicializando Portfólio TCG...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainScreen}
          options={{ 
            title: 'Pokémon TCG V2',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="LanguageConfig" 
          component={LanguageConfigScreen}
          options={{ 
            title: 'Configurações de Idioma',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="Series" 
          component={SeriesScreen}
          options={{ title: 'Séries' }}
        />
        <Stack.Screen 
          name="Sets" 
          component={SetsScreen}
          options={{ title: 'Sets' }}
        />
        <Stack.Screen 
          name="Cards" 
          component={CardsScreen}
          options={{ title: 'Cards' }}
        />
        <Stack.Screen 
          name="CardDetail" 
          component={CardDetailScreen}
          options={{ title: 'Detalhes do Card' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Configurações' }}
        />
        <Stack.Screen 
          name="Downloads" 
          component={DownloadsScreen}
          options={{ title: 'Downloads' }}
        />
        <Stack.Screen 
          name="Update" 
          component={UpdateScreen}
          options={{ 
            title: 'Atualização',
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => {
                  // Aqui você pode acessar a última atualização
                  Alert.alert(
                    'Última Atualização',
                    'Clique aqui para ver quando foi a última atualização',
                    [{ text: 'OK' }]
                  );
                }}
                style={{
                  marginRight: 15,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>?</Text>
              </TouchableOpacity>
            )
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  pokeballContainer: {
    marginBottom: 30,
  },
  pokeball: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#333',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  pokeballTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#ff0000',
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
  },
  pokeballCenter: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pokeballBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 46,
    borderBottomRightRadius: 46,
  },
  loadingMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});