// UltraCompactAnimalFilterScreen.js - Ultra Compact Design
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { getBrands, getBrandsWithCount, getCategories } from '../../service/DolibarrBrandService';

const { width } = Dimensions.get('window');

export default function UltraCompactAnimalFilterScreen({ navigation }) {
  const { isDarkMode, colorTheme } = useTheme();

  // Filter states
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  // Data states
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [tempPriceRange, setTempPriceRange] = useState({ min: '', max: '' });

  // Ultra compact colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const BACKGROUND_COLOR = isDarkMode ? '#000000' : '#ffffff';
  const CARD_BACKGROUND = isDarkMode ? '#111111' : '#f8f9fa';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#888888' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#222222' : '#e0e0e0';
  const SURFACE_COLOR = isDarkMode ? '#1a1a1a' : '#f5f5f5';

  // Ultra compact animal types
  const animalTypes = [
    { id: '2', name: 'Chien', icon: 'dog', color: '#FF6B6B' },
    { id: '3', name: 'Chat', icon: 'cat', color: '#4ECDC4' },
    { id: '20', name: 'Oiseau', icon: 'bird', color: '#45B7D1' },
  ];

  // Micro price ranges
  const quickPriceRanges = [
    { label: '<50', min: 0, max: 50 },
    { label: '50-100', min: 50, max: 100 },
    { label: '100-200', min: 100, max: 200 },
    { label: '200-500', min: 200, max: 500 },
    { label: '>500', min: 500, max: 9999 },
  ];

  // Load data
  useEffect(() => {
    loadBrands();
    loadCategories();
  }, []);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const brandsData = await getBrandsWithCount();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const resetFilters = () => {
    setSelectedAnimal('');
    setSelectedBrand('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
  };

  const applyFilters = () => {
    const filters = {
      animal: selectedAnimal,
      brand: selectedBrand,
      category: selectedCategory,
      priceMin: priceRange.min ? parseFloat(priceRange.min) : null,
      priceMax: priceRange.max ? parseFloat(priceRange.max) : null,
    };
    console.log('🎯 Applied filters:', filters);
    Alert.alert('Filtres', `${getActiveFilterCount()} actif(s)`);
  };

  const hasActiveFilters = () => {
    return selectedAnimal || selectedBrand || selectedCategory || priceRange.min || priceRange.max;
  };

  const getActiveFilterCount = () => {
    return [selectedAnimal, selectedBrand, selectedCategory, (priceRange.min || priceRange.max) ? 'price' : null].filter(Boolean).length;
  };

  const getPriceRangeDisplay = () => {
    if (!priceRange.min && !priceRange.max) return '';
    if (priceRange.min && !priceRange.max) return `≥${priceRange.min}`;
    if (!priceRange.min && priceRange.max) return `≤${priceRange.max}`;
    return `${priceRange.min}-${priceRange.max}`;
  };

  const applyQuickPriceRange = (range) => {
    setTempPriceRange({
      min: range.min === 0 ? '' : range.min.toString(),
      max: range.max === 9999 ? '' : range.max.toString()
    });
  };

  const applyPriceRange = () => {
    setPriceRange(tempPriceRange);
    setShowPriceModal(false);
  };

  // Micro Animal Selector
  const renderAnimalSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="paw-outline" size={12} color={PRIMARY_COLOR} />
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Animal</Text>
      </View>
      <View style={styles.animalGrid}>
        {animalTypes.map((animal) => (
          <TouchableOpacity
            key={animal.id}
            style={[
              styles.animalChip,
              {
                backgroundColor: selectedAnimal === animal.id ? animal.color + '20' : SURFACE_COLOR,
                borderColor: selectedAnimal === animal.id ? animal.color : BORDER_COLOR,
              }
            ]}
            onPress={() => setSelectedAnimal(selectedAnimal === animal.id ? '' : animal.id)}
            activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={animal.icon}
              size={12}
              color={selectedAnimal === animal.id ? animal.color : TEXT_COLOR_SECONDARY}
            />
            <Text style={[
              styles.animalChipText, 
              { color: selectedAnimal === animal.id ? animal.color : TEXT_COLOR }
            ]}>
              {animal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Micro Generic Selector
  const renderMicroSelector = (title, icon, value, placeholder, onPress, loading = false, disabled = false) => (
    <TouchableOpacity
      style={[
        styles.microSelector,
        {
          backgroundColor: value ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
          borderColor: value ? PRIMARY_COLOR : BORDER_COLOR,
          opacity: disabled ? 0.5 : 1,
        }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}>
      <View style={styles.microSelectorContent}>
        <Ionicons name={icon} size={12} color={value ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY} />
        <Text style={[
          styles.microSelectorText, 
          { color: value ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY }
        ]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {loading && <ActivityIndicator size="small" color={PRIMARY_COLOR} />}
      </View>
      <Ionicons name="chevron-forward" size={10} color={TEXT_COLOR_SECONDARY} />
    </TouchableOpacity>
  );

  // Micro Price Modal
  const renderPriceModal = () => (
    <Modal visible={showPriceModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[styles.microModalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <Text style={[styles.microModalTitle, { color: TEXT_COLOR }]}>Prix (DH)</Text>
          <TouchableOpacity onPress={() => setShowPriceModal(false)} style={styles.microCloseButton}>
            <Ionicons name="close" size={16} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.microModalContent} showsVerticalScrollIndicator={false}>
          {/* Micro Quick Ranges */}
          <View style={styles.quickRangesContainer}>
            {quickPriceRanges.map((range, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.microChip, { backgroundColor: SURFACE_COLOR, borderColor: BORDER_COLOR }]}
                onPress={() => applyQuickPriceRange(range)}
                activeOpacity={0.7}>
                <Text style={[styles.microChipText, { color: TEXT_COLOR }]}>{range.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Micro Custom Range */}
          <View style={styles.customRangeContainer}>
            <Text style={[styles.microLabel, { color: TEXT_COLOR }]}>Personnalisé</Text>
            <View style={styles.microInputRow}>
              <View style={styles.microInputGroup}>
                <Text style={[styles.microInputLabel, { color: TEXT_COLOR_SECONDARY }]}>Min</Text>
                <TextInput
                  style={[styles.microInput, { 
                    backgroundColor: SURFACE_COLOR, 
                    borderColor: BORDER_COLOR, 
                    color: TEXT_COLOR 
                  }]}
                  value={tempPriceRange.min}
                  onChangeText={(text) => setTempPriceRange({ ...tempPriceRange, min: text })}
                  placeholder="0"
                  placeholderTextColor={TEXT_COLOR_SECONDARY}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.microInputGroup}>
                <Text style={[styles.microInputLabel, { color: TEXT_COLOR_SECONDARY }]}>Max</Text>
                <TextInput
                  style={[styles.microInput, { 
                    backgroundColor: SURFACE_COLOR, 
                    borderColor: BORDER_COLOR, 
                    color: TEXT_COLOR 
                  }]}
                  value={tempPriceRange.max}
                  onChangeText={(text) => setTempPriceRange({ ...tempPriceRange, max: text })}
                  placeholder="∞"
                  placeholderTextColor={TEXT_COLOR_SECONDARY}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.microModalActions, { backgroundColor: CARD_BACKGROUND, borderTopColor: BORDER_COLOR }]}>
          <TouchableOpacity
            style={[styles.microResetButton, { borderColor: BORDER_COLOR }]}
            onPress={() => setTempPriceRange({ min: '', max: '' })}
            activeOpacity={0.7}>
            <Text style={[styles.microResetText, { color: TEXT_COLOR_SECONDARY }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.microApplyButton, { backgroundColor: PRIMARY_COLOR }]} 
            onPress={applyPriceRange}
            activeOpacity={0.8}>
            <Text style={styles.microApplyText}>OK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Micro List Modal
  const renderMicroListModal = (visible, title, data, selectedValue, onSelect, onClose, showCount = false) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[styles.microModalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <Text style={[styles.microModalTitle, { color: TEXT_COLOR }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.microCloseButton}>
            <Ionicons name="close" size={16} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => `item-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.microModalItem,
                {
                  backgroundColor: selectedValue === item.name ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                  borderColor: selectedValue === item.name ? PRIMARY_COLOR : BORDER_COLOR,
                }
              ]}
              onPress={() => {
                onSelect(item.name);
                onClose();
              }}
              activeOpacity={0.7}>
              <View style={styles.microModalItemContent}>
                <Text style={[
                  styles.microModalItemText, 
                  { color: selectedValue === item.name ? PRIMARY_COLOR : TEXT_COLOR }
                ]} numberOfLines={1}>
                  {item.name}
                </Text>
                {showCount && item.productCount > 0 && (
                  <Text style={[styles.microProductCount, { color: TEXT_COLOR_SECONDARY }]}>
                    {item.productCount}
                  </Text>
                )}
              </View>
              {selectedValue === item.name && (
                <Ionicons name="checkmark" size={12} color={PRIMARY_COLOR} />
              )}
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Micro Header */}
      <View style={[styles.microHeader, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity style={styles.microBackButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={14} color="#fff" />
        </TouchableOpacity>
        <View style={styles.microHeaderCenter}>
          <Text style={styles.microHeaderTitle}>Filtres</Text>
          {hasActiveFilters() && (
            <View style={styles.microHeaderBadge}>
              <Text style={styles.microHeaderBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.microResetButton} onPress={resetFilters}>
          <Ionicons name="refresh-outline" size={12} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Ultra Compact Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.microScrollContent}>
        {renderAnimalSelector()}
        
        <View style={styles.selectorsContainer}>
          {renderMicroSelector('Marque', 'business-outline', selectedBrand, 'Marque', () => setShowBrandModal(true), loadingBrands, brands.length === 0)}
          {renderMicroSelector('Catégorie', 'grid-outline', selectedCategory, 'Catégorie', () => setShowCategoryModal(true), loadingCategories, categories.length === 0)}
          {renderMicroSelector('Prix', 'pricetag-outline', getPriceRangeDisplay(), 'Prix', () => { setTempPriceRange(priceRange); setShowPriceModal(true); })}
        </View>
      </ScrollView>

      {/* Micro Apply Button */}
      <View style={[styles.microBottomActions, { backgroundColor: CARD_BACKGROUND, borderTopColor: BORDER_COLOR }]}>
        <TouchableOpacity
          style={[styles.microApplyButton, { backgroundColor: hasActiveFilters() ? PRIMARY_COLOR : BORDER_COLOR }]}
          onPress={applyFilters}
          disabled={!hasActiveFilters()}
          activeOpacity={0.8}>
          <Ionicons name="checkmark" size={12} color="#fff" style={{ opacity: hasActiveFilters() ? 1 : 0.6 }} />
          <Text style={[styles.microApplyButtonText, { opacity: hasActiveFilters() ? 1 : 0.6 }]}>
            Appliquer{hasActiveFilters() ? ` (${getActiveFilterCount()})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Micro Modals */}
      {renderMicroListModal(showBrandModal, 'Marques', brands, selectedBrand, setSelectedBrand, () => setShowBrandModal(false), true)}
      {renderMicroListModal(showCategoryModal, 'Catégories', categories, selectedCategory, setSelectedCategory, () => setShowCategoryModal(false))}
      {renderPriceModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Micro Header
  microHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  microBackButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  microHeaderCenter: { 
    flex: 1, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  microHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  microHeaderBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  microHeaderBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  microResetButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  
  // Content
  content: { flex: 1 },
  microScrollContent: { paddingHorizontal: 12, paddingVertical: 8 },
  
  // Sections
  section: {
    marginBottom: 8,
    borderRadius: 8,
    padding: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700' },
  
  // Animal Grid
  animalGrid: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  animalChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 28,
  },
  animalChipText: { fontSize: 10, fontWeight: '600' },
  
  // Selectors Container
  selectorsContainer: {
    gap: 6,
  },
  
  // Micro Selectors
  microSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 32,
  },
  microSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  microSelectorText: { fontSize: 11, fontWeight: '600', flex: 1 },
  
  // Bottom Actions
  microBottomActions: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderTopWidth: 1 
  },
  microApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
    minHeight: 36,
  },
  microApplyButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  // Modal Styles
  modalContainer: { flex: 1 },
  microModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    minHeight: 40,
  },
  microModalTitle: { fontSize: 14, fontWeight: '700' },
  microCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal Items
  microModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 36,
  },
  microModalItemContent: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  microModalItemText: { fontSize: 12, fontWeight: '600', flex: 1 },
  microProductCount: { fontSize: 9, fontWeight: '500' },
  
  // Price Modal
  microModalContent: { flex: 1, paddingHorizontal: 12 },
  quickRangesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  microChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  microChipText: { fontSize: 10, fontWeight: '600' },
  
  customRangeContainer: { marginVertical: 8 },
  microLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  microInputRow: { flexDirection: 'row', gap: 8 },
  microInputGroup: { flex: 1 },
  microInputLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  microInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
    minHeight: 28,
  },
  
  microModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
  },
  microResetButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 28,
    justifyContent: 'center',
  },
  microResetText: { fontSize: 11, fontWeight: '700' },
  microApplyText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});