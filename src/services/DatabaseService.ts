import * as SQLite from 'expo-sqlite';

export interface PokemonCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  set: string;
  series: string;
  price: number;
  lastUpdated: string;
  // Detalhes do card
  hp?: number;
  types?: string[];
  attacks?: Array<{
    name: string;
    cost: string[];
    damage?: string;
    text?: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
}

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  totalCards: number;
  symbol: string;
  logo: string;
}

export interface PokemonSeries {
  id: string;
  name: string;
  logo: string;
  totalSets: number;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('pokemon_tcg.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Tabela de séries
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS series (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo TEXT,
        total_sets INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de sets
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        series_id TEXT NOT NULL,
        release_date TEXT,
        total_cards INTEGER DEFAULT 0,
        symbol TEXT,
        logo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (series_id) REFERENCES series (id)
      );
    `);

    // Tabela de cards
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT,
        rarity TEXT,
        set_id TEXT NOT NULL,
        series_id TEXT NOT NULL,
        price REAL DEFAULT 0,
        hp INTEGER,
        types TEXT, -- JSON array
        attacks TEXT, -- JSON array
        weaknesses TEXT, -- JSON array
        resistances TEXT, -- JSON array
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (set_id) REFERENCES sets (id),
        FOREIGN KEY (series_id) REFERENCES series (id)
      );
    `);

    // Índices para performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards (set_id);
      CREATE INDEX IF NOT EXISTS idx_cards_series_id ON cards (series_id);
      CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards (rarity);
      CREATE INDEX IF NOT EXISTS idx_cards_price ON cards (price);
    `);
  }

  // Métodos para Series
  async insertSeries(series: PokemonSeries): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'INSERT OR REPLACE INTO series (id, name, logo, total_sets) VALUES (?, ?, ?, ?)',
      [series.id, series.name, series.logo, series.totalSets]
    );
  }

  async getAllSeries(): Promise<PokemonSeries[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM series ORDER BY name ASC'
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      logo: row.logo as string,
      totalSets: row.total_sets as number
    }));
  }

  // Métodos para Sets
  async insertSet(set: PokemonSet): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sets (id, name, series_id, release_date, total_cards, symbol, logo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [set.id, set.name, set.series, set.releaseDate, set.totalCards, set.symbol, set.logo]
    );
  }

  async getSetsBySeries(seriesId: string): Promise<PokemonSet[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM sets WHERE series_id = ? ORDER BY release_date DESC',
      [seriesId]
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      series: row.series_id as string,
      releaseDate: row.release_date as string,
      totalCards: row.total_cards as number,
      symbol: row.symbol as string,
      logo: row.logo as string
    }));
  }

  // Métodos para Cards
  async insertCard(card: PokemonCard): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, 
        types, attacks, weaknesses, resistances, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.name,
        card.image,
        card.rarity,
        card.set,
        card.series,
        card.price,
        card.hp || null,
        JSON.stringify(card.types || []),
        JSON.stringify(card.attacks || []),
        JSON.stringify(card.weaknesses || []),
        JSON.stringify(card.resistances || []),
        new Date().toISOString()
      ]
    );
  }

  async getCardsBySet(setId: string): Promise<PokemonCard[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM cards WHERE set_id = ? ORDER BY name ASC',
      [setId]
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      image: row.image as string,
      rarity: row.rarity as string,
      set: row.set_id as string,
      series: row.series_id as string,
      price: row.price as number,
      lastUpdated: row.last_updated as string,
      hp: row.hp as number,
      types: JSON.parse(row.types as string || '[]'),
      attacks: JSON.parse(row.attacks as string || '[]'),
      weaknesses: JSON.parse(row.weaknesses as string || '[]'),
      resistances: JSON.parse(row.resistances as string || '[]')
    }));
  }

  async searchCards(query: string): Promise<PokemonCard[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM cards WHERE name LIKE ? ORDER BY name ASC LIMIT 100',
      [`%${query}%`]
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      image: row.image as string,
      rarity: row.rarity as string,
      set: row.set_id as string,
      series: row.series_id as string,
      price: row.price as number,
      lastUpdated: row.last_updated as string,
      hp: row.hp as number,
      types: JSON.parse(row.types as string || '[]'),
      attacks: JSON.parse(row.attacks as string || '[]'),
      weaknesses: JSON.parse(row.weaknesses as string || '[]'),
      resistances: JSON.parse(row.resistances as string || '[]')
    }));
  }

  // Método para atualizar dados em lote
  async updateCardsBatch(cards: PokemonCard[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.withTransactionAsync(async () => {
      for (const card of cards) {
        await this.insertCard(card);
      }
    });
  }

  // Método para verificar se precisa atualizar
  async needsUpdate(lastCheck: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM cards WHERE last_updated > ?',
      [lastCheck]
    );
    
    return ((result as any)?.count as number) > 0;
  }

  // Método para obter todas as séries (já existe, apenas renomear para consistência)
  // getAllSeries() já existe acima, então não precisamos redefinir

  // Método para obter todos os sets
  async getAllSets(): Promise<PokemonSet[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM sets ORDER BY release_date DESC'
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      series: row.series_id as string,
      releaseDate: row.release_date as string,
      totalCards: row.total_cards as number,
      symbol: row.symbol as string,
      logo: row.logo as string
    }));
  }

  // Método para obter todos os cards
  async getAllCards(): Promise<PokemonCard[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(
      'SELECT * FROM cards ORDER BY name ASC'
    );
    
    return result.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      image: row.image as string,
      rarity: row.rarity as string,
      set: row.set_id as string,
      series: row.series_id as string,
      price: row.price as number,
      lastUpdated: row.last_updated as string,
      hp: row.hp as number,
      types: JSON.parse(row.types as string || '[]'),
      attacks: JSON.parse(row.attacks as string || '[]'),
      weaknesses: JSON.parse(row.weaknesses as string || '[]'),
      resistances: JSON.parse(row.resistances as string || '[]')
    }));
  }

  // Método para obter estatísticas
  async getStats(): Promise<{ series: number; sets: number; cards: number }> {
    if (!this.db) throw new Error('Database not initialized');
    
    const seriesResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM series');
    const setsResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM sets');
    const cardsResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM cards');
    
    return {
      series: (seriesResult as any)?.count as number || 0,
      sets: (setsResult as any)?.count as number || 0,
      cards: (cardsResult as any)?.count as number || 0
    };
  }

  // Método para limpar todos os dados
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync('DELETE FROM cards');
    await this.db.execAsync('DELETE FROM sets');
    await this.db.execAsync('DELETE FROM series');
    
    console.log('Todos os dados foram limpos do banco');
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export default new DatabaseService();

