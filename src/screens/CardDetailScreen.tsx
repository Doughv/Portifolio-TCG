import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { PokemonCard } from '../services/DatabaseService';

const { width } = Dimensions.get('window');

export default function CardDetailScreen() {
  const route = useRoute();
  const { card } = route.params as { card: PokemonCard };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: card.image }}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardRarity}>{card.rarity}</Text>
        
        {card.price > 0 && (
          <Text style={styles.cardPrice}>${card.price.toFixed(2)}</Text>
        )}

        {card.hp && (
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>HP:</Text>
            <Text style={styles.statValue}>{card.hp}</Text>
          </View>
        )}

        {card.types && card.types.length > 0 && (
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Tipos:</Text>
            <Text style={styles.statValue}>{card.types.join(', ')}</Text>
          </View>
        )}

        {card.attacks && card.attacks.length > 0 && (
          <View style={styles.attacksContainer}>
            <Text style={styles.sectionTitle}>Ataques:</Text>
            {card.attacks.map((attack, index) => (
              <View key={index} style={styles.attackItem}>
                <Text style={styles.attackName}>{attack.name}</Text>
                {attack.cost && attack.cost.length > 0 && (
                  <Text style={styles.attackCost}>
                    Custo: {attack.cost.join(', ')}
                  </Text>
                )}
                {attack.damage && (
                  <Text style={styles.attackDamage}>
                    Dano: {attack.damage}
                  </Text>
                )}
                {attack.text && (
                  <Text style={styles.attackText}>{attack.text}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {card.weaknesses && card.weaknesses.length > 0 && (
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Fraquezas:</Text>
            <Text style={styles.statValue}>
              {card.weaknesses.map(w => `${w.type} ${w.value}`).join(', ')}
            </Text>
          </View>
        )}

        {card.resistances && card.resistances.length > 0 && (
          <View style={styles.statContainer}>
            <Text style={styles.statLabel}>Resistências:</Text>
            <Text style={styles.statValue}>
              {card.resistances.map(r => `${r.type} ${r.value}`).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  cardImage: {
    width: width * 0.8,
    height: width * 0.8 * 1.4, // Proporção de carta Pokemon
  },
  detailsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardRarity: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 100,
  },
  statValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  attacksContainer: {
    marginTop: 16,
  },
  attackItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  attackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  attackCost: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attackDamage: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 2,
  },
  attackText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

