// ProductList.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import ProductCard from '../Home/ProductCard';

const ProductList = ({ 
  products, 
  isLoading, 
  layoutMode, 
  onToggleLayout, 
  navigation, 
  theme 
}) => {
  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={theme.primary}
        style={{ marginTop: 20 }}
      />
    );
  }

  return (
    <>
      {/* Header with layout toggle */}
      <View style={[styles.headerTextView, { 
        backgroundColor: theme.secondaryBackground
      }]}>
        <View style={styles.promotionHeaderContainer}>
          <Text style={[styles.headerText, { color: theme.textColor }]}>
            Promotions disponibles
          </Text>
          
          {/* Layout toggle button */}
          <TouchableOpacity 
            style={[styles.layoutToggle, { backgroundColor: theme.cardBackground }]} 
            onPress={onToggleLayout}
            activeOpacity={0.7}
          >
            <Icon
              type="material-community"
              name={layoutMode === 'grid' ? "view-list" : "view-grid"}
              color={theme.primary}
              size={22}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products container */}
      <View style={styles.productsMainContainer}>
        {products.map((category, index) => (
          <View key={index} style={styles.categoryContainer}>
            {/* Category header */}
            <View style={styles.dFlexSpace}>
              <View style={styles.categoryTitleContainer}>
                <Text style={[styles.categoryTitle, { color: theme.textColor }]}>
                  {category.label}
                </Text>
                <Text style={[styles.count, { color: theme.secondaryTextColor }]}>
                  {category.product_count}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('ProductCategoryScreen', { categoryId: category.id })}
              >
                <Text style={[styles.seeAll, { color: theme.accent }]}>Voir tout</Text>
                <Icon
                  type="material-community"
                  name="chevron-right"
                  color={theme.accent}
                  size={16}
                />
              </TouchableOpacity>
            </View>
            
            {/* Products container - adapts to layout mode */}
            <View style={[
              styles.containerProducts,
              layoutMode === 'list' && styles.containerProductsList
            ]}>
              {category.products.map(product => (
                <ProductCard
                  navigation={navigation}
                  data={product}
                  key={product.id}
                  theme={theme}
                  layoutMode={layoutMode}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  headerTextView: {
    paddingVertical: 3,
  },
  promotionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
  },
  layoutToggle: {
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productsMainContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  dFlexSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.5,
    marginLeft: 10,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  containerProducts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  containerProductsList: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginHorizontal: -16, // Compense le padding du container parent
    paddingHorizontal: 16, // Ajoute le padding ici pour les autres éléments
  },
});

export default ProductList;