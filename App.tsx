import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
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

// Services
import DatabaseService from './src/services/DatabaseService';
import TCGdexService from './src/services/TCGdexService';
import OptimizedStorageService from './src/services/OptimizedStorageService';
import FilterService from './src/services/FilterService';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      
      // 1. Inicializar banco de dados
      await DatabaseService.initialize();
      console.log('Database initialized');
      
      // 2. Configurar idioma fixo em português
      await TCGdexService.setLanguage('pt');
      await FilterService.loadSettings('pt');
      console.log('App configurado para português brasileiro');
      
      // 3. Verificar se há dados no banco, se não, migrar dos JSONs
      const stats = await DatabaseService.getStats();
      if (stats.series === 0 && stats.sets === 0 && stats.cards === 0) {
        console.log('No data in database, migrating from JSONs...');
        const migrationResult = await TCGdexService.migrateFromJSONs();
        if (migrationResult.success) {
          console.log('Migration successful:', migrationResult.message);
        } else {
          console.error('Migration failed:', migrationResult.message);
        }
      } else {
        console.log('Data already exists in database:', stats);
      }
      
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {isInitialized ? 'Sincronizando dados...' : 'Inicializando app...'}
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});