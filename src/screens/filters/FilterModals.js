// FilterModals.js - Enhanced Version with Modern Design
import React, { useRef, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { filterStyles as styles } from './FilterStyles';

const { height: screenHeight } = Dimensions.get('window');

// Enhanced Generic Modal Component
export const GenericModal = ({
  visible,
  onClose,
  title,
  icon,
  data,
  selectedValue,
  onSelect,
  keyExtractor,
  renderItemContent,
  fadeAnim,
  isDarkMode,
  colors,
  searchable = false,
  emptyStateMessage = "Aucun élément trouvé"
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredData, setFilteredData] = React.useState(data);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => {
        const searchText = typeof item === 'string' ? item : item.name;
        return searchText.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  // Animate modal appearance
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
      setSearchQuery('');
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={[styles.emptyStateIcon, { backgroundColor: colors.SURFACE_COLOR }]}>
        <Ionicons name="search-outline" size={32} color={colors.TEXT_COLOR_SECONDARY} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: colors.TEXT_COLOR }]}>
        {searchQuery ? 'Aucun résultat' : 'Liste vide'}
      </Text>
      <Text style={[styles.emptyStateMessage, { color: colors.TEXT_COLOR_SECONDARY }]}>
        {searchQuery ? `Aucun élément ne correspond à "${searchQuery}"` : emptyStateMessage}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}>
      
      {/* Animated Backdrop */}
      <Animated.View 
        style={[
          styles.modalBackdrop,
          {
            opacity: backdropAnim,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }
        ]}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Animated Modal Content */}
      <Animated.View
        style={[
          styles.modalWrapper,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.BACKGROUND_COLOR }]}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          
          {/* Enhanced Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.CARD_BACKGROUND, borderBottomColor: colors.BORDER_COLOR }]}>
            <View style={styles.modalTitleContainer}>
              <View style={[styles.modalIconContainer, { backgroundColor: colors.PRIMARY_COLOR + '15' }]}>
                <Ionicons name={icon} size={20} color={colors.PRIMARY_COLOR} />
              </View>
              <View style={styles.modalTitleTextContainer}>
                <Text style={[styles.modalTitle, { color: colors.TEXT_COLOR }]}>{title}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.TEXT_COLOR_SECONDARY }]}>
                  {filteredData.length} élément{filteredData.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: colors.SURFACE_COLOR }]}
              activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.TEXT_COLOR} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          {searchable && (
            <View style={[styles.searchContainer, { backgroundColor: colors.CARD_BACKGROUND, borderBottomColor: colors.BORDER_COLOR }]}>
              <View style={[styles.searchInputContainer, { backgroundColor: colors.SURFACE_COLOR, borderColor: colors.BORDER_COLOR }]}>
                <Ionicons name="search" size={18} color={colors.TEXT_COLOR_SECONDARY} />
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: colors.TEXT_COLOR }]}
                  placeholder={`Rechercher dans ${title.toLowerCase()}...`}
                  placeholderTextColor={colors.TEXT_COLOR_SECONDARY}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                    activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color={colors.TEXT_COLOR_SECONDARY} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          {/* Enhanced List */}
          {filteredData.length > 0 ? (
            <FlatList
              data={filteredData}
              keyExtractor={keyExtractor}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => {
                // Staggered animation for list items
                const itemAnim = fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                });

                return (
                  <Animated.View
                    style={{
                      transform: [{
                        translateX: itemAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [index % 2 === 0 ? -50 : 50, 0],
                        })
                      }, {
                        scale: itemAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }],
                      opacity: itemAnim,
                    }}>
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        {
                          backgroundColor: selectedValue === (typeof item === 'string' ? item : item.name)
                            ? colors.PRIMARY_COLOR + '12'
                            : colors.SURFACE_COLOR,
                          borderColor: selectedValue === (typeof item === 'string' ? item : item.name)
                            ? colors.PRIMARY_COLOR
                            : colors.BORDER_COLOR,
                          shadowColor: selectedValue === (typeof item === 'string' ? item : item.name)
                            ? colors.PRIMARY_COLOR
                            : '#000',
                          shadowOpacity: selectedValue === (typeof item === 'string' ? item : item.name) ? 0.15 : 0.05,
                          elevation: selectedValue === (typeof item === 'string' ? item : item.name) ? 3 : 1,
                        }
                      ]}
                      onPress={() => onSelect(item)}
                      activeOpacity={0.7}>
                      
                      <View style={styles.modalItemContent}>
                        {renderItemContent(item, selectedValue, colors)}
                      </View>
                      
                      {selectedValue === (typeof item === 'string' ? item : item.name) && (
                        <View style={[styles.selectedCheckmark, { backgroundColor: colors.PRIMARY_COLOR }]}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              }}
            />
          ) : (
            renderEmptyState()
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

// Enhanced Breed Modal
export const BreedModal = ({
  visible,
  onClose,
  breeds,
  selectedBreed,
  onSelectBreed,
  fadeAnim,
  isDarkMode,
  colors
}) => (
  <GenericModal
    visible={visible}
    onClose={onClose}
    title="Race"
    icon="library"
    data={breeds}
    selectedValue={selectedBreed}
    onSelect={(breed) => {
      onSelectBreed(breed);
      onClose();
    }}
    keyExtractor={(item, index) => `breed-${index}`}
    renderItemContent={(breed, selectedValue, colors) => (
      <View style={styles.breedItemContainer}>
        <View style={[styles.breedIcon, { backgroundColor: colors.PRIMARY_COLOR + '15' }]}>
          <Ionicons name="paw" size={16} color={colors.PRIMARY_COLOR} />
        </View>
        <Text style={[
          styles.modalItemText,
          { 
            color: selectedValue === breed ? colors.PRIMARY_COLOR : colors.TEXT_COLOR,
            fontWeight: selectedValue === breed ? '600' : '500'
          }
        ]}>
          {breed}
        </Text>
      </View>
    )}
    fadeAnim={fadeAnim}
    isDarkMode={isDarkMode}
    colors={colors}
    searchable={true}
    emptyStateMessage="Aucune race disponible"
  />
);

// Enhanced Brand Modal
export const BrandModal = ({
  visible,
  onClose,
  brands,
  selectedBrand,
  onSelectBrand,
  fadeAnim,
  isDarkMode,
  colors
}) => (
  <GenericModal
    visible={visible}
    onClose={onClose}
    title="Marque"
    icon="business"
    data={brands}
    selectedValue={selectedBrand}
    onSelect={(brand) => {
      console.log('🏷️ Selected brand:', brand);
      onSelectBrand(brand.name);
      onClose();
    }}
    keyExtractor={(item) => `brand-${item.id}`}
    renderItemContent={(brand, selectedValue, colors) => (
      <View style={styles.brandItemContainer}>
        <View style={[styles.brandIcon, { backgroundColor: colors.PRIMARY_COLOR + '15' }]}>
          <Ionicons name="storefront" size={16} color={colors.PRIMARY_COLOR} />
        </View>
        <View style={styles.brandTextContainer}>
          <Text style={[
            styles.modalItemText,
            { 
              color: selectedValue === brand.name ? colors.PRIMARY_COLOR : colors.TEXT_COLOR,
              fontWeight: selectedValue === brand.name ? '600' : '500'
            }
          ]}>
            {brand.name}
          </Text>
          {brand.productCount > 0 && (
            <View style={styles.productCountContainer}>
              <View style={[styles.productCountBadge, { backgroundColor: colors.SURFACE_COLOR }]}>
                <Ionicons name="cube-outline" size={12} color={colors.TEXT_COLOR_SECONDARY} />
                <Text style={[styles.productCountText, { color: colors.TEXT_COLOR_SECONDARY }]}>
                  {brand.productCount}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    )}
    fadeAnim={fadeAnim}
    isDarkMode={isDarkMode}
    colors={colors}
    searchable={true}
    emptyStateMessage="Aucune marque disponible"
  />
);

// Enhanced Category Modal
export const CategoryModal = ({
  visible,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  fadeAnim,
  isDarkMode,
  colors
}) => (
  <GenericModal
    visible={visible}
    onClose={onClose}
    title="Catégorie"
    icon="grid"
    data={categories}
    selectedValue={selectedCategory}
    onSelect={(category) => {
      console.log('📂 Selected category:', category);
      onSelectCategory(category.name);
      onClose();
    }}
    keyExtractor={(item) => `category-${item.id}`}
    renderItemContent={(category, selectedValue, colors) => (
      <View style={styles.categoryItemContainer}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.PRIMARY_COLOR + '15' }]}>
          <Ionicons name="folder" size={16} color={colors.PRIMARY_COLOR} />
        </View>
        <View style={styles.categoryTextContainer}>
          <Text style={[
            styles.modalItemText,
            { 
              color: selectedValue === category.name ? colors.PRIMARY_COLOR : colors.TEXT_COLOR,
              fontWeight: selectedValue === category.name ? '600' : '500'
            }
          ]}>
            {category.name}
          </Text>
          {category.description && (
            <Text style={[styles.categoryDescription, { color: colors.TEXT_COLOR_SECONDARY }]} numberOfLines={2}>
              {category.description}
            </Text>
          )}
          {category.subcategories && category.subcategories.length > 0 && (
            <View style={styles.subcategoryContainer}>
              <View style={[styles.subcategoryBadge, { backgroundColor: colors.SURFACE_COLOR }]}>
                <Ionicons name="layers-outline" size={12} color={colors.TEXT_COLOR_SECONDARY} />
                <Text style={[styles.subcategoryText, { color: colors.TEXT_COLOR_SECONDARY }]}>
                  {category.subcategories.length} sous-catégorie{category.subcategories.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    )}
    fadeAnim={fadeAnim}
    isDarkMode={isDarkMode}
    colors={colors}
    searchable={true}
    emptyStateMessage="Aucune catégorie disponible"
  />
);



export const modalStyles = StyleSheet.create({
  // Modal Container Styles
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  
  backdropTouchable: {
    flex: 1,
  },
  
  modalWrapper: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  
  modalContainer: {
    flex: 1,
  },
  
  // Enhanced Header Styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalTitleTextContainer: {
    flex: 1,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  
  clearSearchButton: {
    padding: 2,
  },
  
  // List Styles
  modalList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  modalItemContent: {
    flex: 1,
  },
  
  modalItemText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  
  selectedCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Breed Item Styles
  breedItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  breedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Brand Item Styles
  brandItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  brandTextContainer: {
    flex: 1,
  },
  
  productCountContainer: {
    marginTop: 4,
  },
  
  productCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  productCountText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  
  // Category Item Styles
  categoryItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  
  categoryTextContainer: {
    flex: 1,
  },
  
  categoryDescription: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  
  subcategoryContainer: {
    marginTop: 6,
  },
  
  subcategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  subcategoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  
  emptyStateMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});