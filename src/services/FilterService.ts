import AsyncStorage from '@react-native-async-storage/async-storage';
import DatabaseService, { PokemonSeries, PokemonSet, PokemonCard } from './DatabaseService';

class FilterService {
  private selectedSeries: string[] = [];
  private selectedExpansions: string[] = [];
  private currentLanguage: string = 'pt';

  /**
   * Definir horário da última atualização
   */
  static async setLastUpdateTime(timestamp: string): Promise<void> {
    try {
      await AsyncStorage.setItem('last_update_time', timestamp);
    } catch (error) {
      console.error('Erro ao salvar última atualização:', error);
    }
  }

  /**
   * Obter horário da última atualização
   */
  static async getLastUpdateTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('last_update_time');
    } catch (error) {
      console.error('Erro ao obter última atualização:', error);
      return null;
    }
  }

  // Carregar configurações salvas
  async loadSettings(language: string): Promise<void> {
    try {
      this.currentLanguage = language;
      
      const languageKey = `selectedSeries_${language}`;
      const expansionsKey = `selectedExpansions_${language}`;
      
      const savedSeries = await AsyncStorage.getItem(languageKey);
      const savedExpansions = await AsyncStorage.getItem(expansionsKey);

      this.selectedSeries = savedSeries ? JSON.parse(savedSeries) : [];
      this.selectedExpansions = savedExpansions ? JSON.parse(savedExpansions) : [];

      console.log(`Filtros carregados para ${language}:`, {
        series: this.selectedSeries.length,
        expansions: this.selectedExpansions.length
      });
    } catch (error) {
      console.error('Erro ao carregar configurações de filtro:', error);
      this.selectedSeries = [];
      this.selectedExpansions = [];
    }
  }

  // Obter séries filtradas (apenas português)
  async getFilteredSeries(): Promise<PokemonSeries[]> {
    try {
      const allSeries = await DatabaseService.getAllSeries();
      
      console.log(`Total de séries no banco: ${allSeries.length}`);
      
      // Se não há filtros selecionados, retornar array vazio (usuário deve escolher)
      if (this.selectedSeries.length === 0) {
        console.log('Nenhuma série selecionada, retornando array vazio');
        return [];
      }
      
      // Retornar apenas as séries selecionadas
      return allSeries.filter(series => this.selectedSeries.includes(series.id));
    } catch (error) {
      console.error('Erro ao obter séries filtradas:', error);
      return [];
    }
  }

  // Obter sets filtrados por série
  async getFilteredSetsBySeries(seriesId: string): Promise<PokemonSet[]> {
    try {
      const allSets = await DatabaseService.getSetsBySeries(seriesId);
      
      // Se não há filtros de expansões selecionados, retornar todos os sets da série
      if (this.selectedExpansions.length === 0) {
        console.log('Nenhuma expansão selecionada, retornando todos os sets da série');
        return allSets;
      }
      
      // Retornar apenas os sets selecionados
      return allSets.filter(set => this.selectedExpansions.includes(set.id));
    } catch (error) {
      console.error('Erro ao obter sets filtrados:', error);
      return [];
    }
  }

  // Obter cards filtrados por set
  async getFilteredCardsBySet(setId: string): Promise<PokemonCard[]> {
    try {
      // Para cards, não aplicamos filtros adicionais pois já vêm filtrados pelos sets
      return await DatabaseService.getCardsBySet(setId);
    } catch (error) {
      console.error('Erro ao obter cards filtrados:', error);
      return [];
    }
  }

  // Verificar se há filtros ativos
  hasActiveFilters(): boolean {
    return this.selectedSeries.length > 0 || this.selectedExpansions.length > 0;
  }

  // Obter informações dos filtros
  getFilterInfo(): { seriesCount: number; expansionsCount: number; hasFilters: boolean } {
    return {
      seriesCount: this.selectedSeries.length,
      expansionsCount: this.selectedExpansions.length,
      hasFilters: this.hasActiveFilters()
    };
  }

  // Limpar todos os filtros
  async clearAllFilters(): Promise<void> {
    try {
      this.selectedSeries = [];
      this.selectedExpansions = [];
      
      const languageKey = `selectedSeries_${this.currentLanguage}`;
      const expansionsKey = `selectedExpansions_${this.currentLanguage}`;
      
      await AsyncStorage.removeItem(languageKey);
      await AsyncStorage.removeItem(expansionsKey);
      
      console.log('Todos os filtros foram limpos');
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
    }
  }
}

// Instância para compatibilidade com código existente
const filterServiceInstance = new FilterService();

export default filterServiceInstance;
export { FilterService };
export { filterServiceInstance };
