import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

// Screens
import MainScreen from './src/screens/MainScreen';
import LanguageConfigScreen from './src/screens/LanguageConfigScreen';
import SeriesScreen from './src/screens/SeriesScreen';
import SetsScreen from './src/screens/SetsScreen';
import CardsScreen from './src/screens/CardsScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';

// Services
import DatabaseService from './src/services/DatabaseService';
import SyncService from './src/services/SyncService';

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
      
      // 2. NÃO sincronizar automaticamente - deixar para o usuário decidir
      console.log('App ready - user can sync when needed');
      
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