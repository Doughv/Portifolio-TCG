import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const SetItem = ({ set, onPress, itemWidth }) => {
  const getLogoUrl = (set) => {
    if (!set.logo) return null;
    
    // Se a URL já tem extensão, usar como está
    if (set.logo.includes('.webp') || set.logo.includes('.png') || set.logo.includes('.jpg')) {
      return set.logo;
    }
    
    // Se não tem extensão, adicionar .webp
    return set.logo + '.webp';
  };

  const logoUrl = getLogoUrl(set);

  return (
    <TouchableOpacity 
      style={[styles.container, { width: itemWidth }]} 
      onPress={() => onPress(set)}
    >
      <View style={styles.logoContainer}>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderText}>{set.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={styles.setInfo}>
        <Text style={styles.setName} numberOfLines={2}>
          {set.name}
        </Text>
        <Text style={styles.setCardCount}>
          {set.cardCount?.total || 0} cartas
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    padding: 16,
  },
  logoContainer: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#666',
  },
  setInfo: {
    alignItems: 'center',
    width: '100%',
  },
  setName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  setCardCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SetItem;





