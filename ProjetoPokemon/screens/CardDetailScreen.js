import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import TCGdexService from '../services/TCGdexService';

const { width, height } = Dimensions.get('window');

const CardDetailScreen = ({ route }) => {
  const { card, setCardCount } = route.params;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [setInfo, setSetInfo] = useState(null);

  const imageUrl = TCGdexService.getImageURL(card, 'high', 'png');

  // Removido: não precisamos mais buscar informações do set
  // pois já recebemos setCardCount via props


  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Raro': return '#FFD700';
      case 'Incomum': return '#C0C0C0';
      case 'Comum': return '#CD7F32';
      default: return '#888';
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Fogo': '#FF6B6B',
      'Água': '#4ECDC4',
      'Planta': '#45B7D1',
      'Elétrico': '#FFA726',
      'Lutador': '#FF8A65',
      'Psíquico': '#BA68C8',
      'Incolor': '#90A4AE',
      'Treinador': '#8D6E63',
      'Energia': '#795548'
    };
    return colors[type] || '#90A4AE';
  };

  const renderTypes = () => {
    if (!card.types || card.types.length === 0) return null;
    
    return (
      <View style={styles.typesContainer}>
        <Text style={styles.typesLabel}>Tipos:</Text>
        <View style={styles.typesRow}>
          {card.types.map((type, index) => (
            <View key={index} style={[styles.typeBadge, { backgroundColor: getTypeColor(type) }]}>
              <Text style={styles.typeText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAttacks = () => {
    if (!card.attacks || card.attacks.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ataques</Text>
        {card.attacks.map((attack, index) => (
          <View key={index} style={styles.attackContainer}>
            <View style={styles.attackHeader}>
              <Text style={styles.attackName}>{attack.name}</Text>
              {attack.damage && (
                <Text style={styles.attackDamage}>{attack.damage}</Text>
              )}
            </View>
            
            {attack.cost && attack.cost.length > 0 && (
              <View style={styles.costContainer}>
                <Text style={styles.costLabel}>Custo: </Text>
                {attack.cost.map((cost, costIndex) => (
                  <View key={costIndex} style={[styles.costBadge, { backgroundColor: getTypeColor(cost) }]}>
                    <Text style={styles.costText}>{cost}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {attack.effect && (
              <View style={styles.effectContainer}>
                <Text style={styles.effectLabel}>Efeito:</Text>
                <Text style={styles.effectText}>{attack.effect}</Text>
              </View>
            )}
            
            {attack.text && (
              <Text style={styles.attackText}>{attack.text}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderAbilities = () => {
    if (!card.abilities || card.abilities.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Habilidades</Text>
        {card.abilities.map((ability, index) => (
          <View key={index} style={styles.abilityContainer}>
            <Text style={styles.abilityName}>{ability.name}</Text>
            {ability.text && (
              <Text style={styles.abilityText}>{ability.text}</Text>
            )}
            {ability.effect && (
              <Text style={styles.abilityEffect}>{ability.effect}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderWeaknesses = () => {
    if (!card.weaknesses || card.weaknesses.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fraquezas</Text>
        <View style={styles.weaknessRow}>
          {card.weaknesses.map((weakness, index) => (
            <View key={index} style={styles.weaknessContainer}>
              <View style={[styles.weaknessBadge, { backgroundColor: getTypeColor(weakness.type) }]}>
                <Text style={styles.weaknessText}>{weakness.type}</Text>
              </View>
              <Text style={styles.weaknessValue}>{weakness.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderResistances = () => {
    if (!card.resistances || card.resistances.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resistências</Text>
        <View style={styles.resistanceRow}>
          {card.resistances.map((resistance, index) => (
            <View key={index} style={styles.resistanceContainer}>
              <View style={[styles.resistanceBadge, { backgroundColor: getTypeColor(resistance.type) }]}>
                <Text style={styles.resistanceText}>{resistance.type}</Text>
              </View>
              <Text style={styles.resistanceValue}>{resistance.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRetreatCost = () => {
    if (!card.retreat || card.retreat === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custo de Retirada</Text>
        <View style={styles.retreatContainer}>
          <Text style={styles.retreatValue}>{card.retreat} Energia{card.retreat > 1 ? 's' : ''}</Text>
        </View>
      </View>
    );
  };

  const renderCardInfo = () => (
    <View style={styles.infoContainer}>
      {/* Header com Nome e Número */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>
          {card.name}
          {card.suffix && <Text style={styles.suffix}> {card.suffix}</Text>}
        </Text>
        <Text style={styles.cardNumber}>
          {card.localId || card.number || 'N/A'}/{setCardCount || setInfo?.cardCount?.total || card.set?.cardCount?.total || 'N/A'}
        </Text>
      </View>
      
      {/* Informações Básicas do Pokemon */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Básicas</Text>
        
        <View style={styles.statsRow}>
          {card.hp && (
            <View style={styles.hpContainer}>
              <Text style={styles.hpLabel}>HP</Text>
              <Text style={styles.hpValue}>{card.hp}</Text>
            </View>
          )}
          
          {renderTypes()}
        </View>

        <View style={styles.basicStatsRow}>
          {card.stage && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Estágio</Text>
              <Text style={styles.statValue}>{card.stage}</Text>
            </View>
          )}
          
          {card.dexId && card.dexId.length > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pokédex</Text>
              <Text style={styles.statValue}>#{card.dexId[0]}</Text>
            </View>
          )}
          
          {card.rarity && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Raridade</Text>
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
                <Text style={styles.rarityText}>{card.rarity}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Informações da Carta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações da Carta</Text>
        
        <View style={styles.infoGrid}>
          {card.category && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Categoria</Text>
              <Text style={styles.infoValue}>{card.category}</Text>
            </View>
          )}
          
          {(card.set || setInfo) && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Coleção</Text>
              <Text style={styles.infoValue}>
                {setInfo?.name || card.set?.name || 'N/A'}
              </Text>
            </View>
          )}
          
          {card.illustrator && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ilustrador</Text>
              <Text style={styles.infoValue}>{card.illustrator}</Text>
            </View>
          )}
          
          {card.legal && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status Legal</Text>
              <View style={styles.legalContainer}>
                {card.legal?.standard && (
                  <Text style={styles.legalText}>Standard</Text>
                )}
                {card.legal?.expanded && (
                  <Text style={styles.legalText}>Expanded</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Variantes */}
      {card.variants && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variantes Disponíveis</Text>
          <View style={styles.variantsContainer}>
            {card.variants?.normal && (
              <Text style={styles.variantText}>Normal</Text>
            )}
            {card.variants?.holo && (
              <Text style={styles.variantText}>Holo</Text>
            )}
            {card.variants?.reverse && (
              <Text style={styles.variantText}>Reverse</Text>
            )}
            {card.variants?.firstEdition && (
              <Text style={styles.variantText}>Primeira Edição</Text>
            )}
          </View>
        </View>
      )}


      {renderAbilities()}
      {renderAttacks()}
      {renderWeaknesses()}
      {renderResistances()}
      {renderRetreatCost()}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando imagem...</Text>
          </View>
        )}
        
        {imageError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>?</Text>
            <Text style={styles.errorSubtext}>Imagem não disponível</Text>
            <Text style={styles.errorSubtext}>
              A imagem desta carta não pôde ser carregada
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </View>

      {renderCardInfo()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.6,
    marginBottom: 16,
  },
  cardImage: {
    width: width * 0.8,
    height: height * 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  suffix: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  cardNumber: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hpContainer: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  hpLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hpValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  basicStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legalText: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variantText: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    marginBottom: 4,
  },
  pricingContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  conversionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  conversionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  basicInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  typesContainer: {
    flex: 1,
  },
  typesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  typeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  attackContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  attackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  attackDamage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
    fontWeight: '600',
  },
  costBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  costText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  effectContainer: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  effectLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  effectText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  attackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  abilityContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  abilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  abilityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  abilityEffect: {
    fontSize: 14,
    color: '#4A148C',
    lineHeight: 20,
    fontStyle: 'italic',
    backgroundColor: '#F3E5F5',
    padding: 8,
    borderRadius: 6,
  },
  weaknessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weaknessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  weaknessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  weaknessText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  weaknessValue: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  resistanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resistanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  resistanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  resistanceText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  resistanceValue: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  retreatContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retreatValue: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: 'bold',
  },
});

export default CardDetailScreen;