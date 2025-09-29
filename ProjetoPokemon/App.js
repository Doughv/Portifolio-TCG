import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TCGdexService from './services/TCGdexService';
import OptimizedStorageService from './services/OptimizedStorageService';

// Importar as telas
import MainScreen from './screens/MainScreen';
import SeriesScreen from './screens/SeriesScreen';
import SetsScreen from './screens/SetsScreen';
import CardsScreen from './screens/CardsScreen';
import CardDetailScreen from './screens/CardDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import DownloadsScreen from './screens/DownloadsScreen';
import LanguageConfigScreen from './screens/LanguageConfigScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Carregar idioma salvo na inicialização
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
        const language = savedLanguage || 'pt';
        
        await TCGdexService.setLanguage(language);
        console.log('Idioma carregado:', language);
        
        // Migração automática se necessário
        setTimeout(async () => {
          try {
            const stats = await OptimizedStorageService.getStats(language);
            if (stats.series === 0 && stats.sets === 0) {
              console.log('Migrando dados do JSON...');
              const migrationResult = await OptimizedStorageService.migrateFromJSON(language);
              if (migrationResult.success) {
                console.log('Migração:', migrationResult.message);
              } else {
                console.error('Erro na migração:', migrationResult.message);
              }
            } else {
              console.log('Dados já migrados:', stats);
            }
          } catch (error) {
            console.error('Erro na migração automática:', error);
          }
        }, 3000);
        
      } catch (error) {
        console.error('Erro ao carregar idioma:', error);
      }
    };

    loadLanguage();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
          name="Series" 
          component={SeriesScreen}
          options={{ title: 'Coleções' }}
        />
        <Stack.Screen 
          name="Sets" 
          component={SetsScreen}
          options={{ title: 'Expansões' }}
        />
        <Stack.Screen 
          name="Cards" 
          component={CardsScreen}
          options={{ title: 'Cartas' }}
        />
        <Stack.Screen 
          name="CardDetail" 
          component={CardDetailScreen}
          options={{ title: 'Detalhes da Carta' }}
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
          name="LanguageConfig" 
          component={LanguageConfigScreen}
          options={{ 
            title: 'Configurações de Idioma',
            headerShown: false 
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}