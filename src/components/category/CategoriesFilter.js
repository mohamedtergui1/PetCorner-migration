import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getCategories } from '../../service/CategoryService';
import { useTheme } from '../context/ThemeContext';

const CategoriesFilter = ({ onCategorySelect, selectedCategories = [] }) => {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [error, setError] = useState(null);

  // Dynamic colors based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#ffffff';
  const SURFACE_COLOR = isDarkMode ? '#1E1E1E' : '#f5f5f5';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const SECONDARY_TEXT = isDarkMode ? '#B3B3B3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#333333' : '#E0E0E0';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories();
      setCategories(response);
      
      // Transform flat array to hierarchical structure
      const hierarchical = mapCategoriesToHierarchy(response);
      setHierarchicalCategories(hierarchical);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Erreur lors du chargement des catégories');
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  // Transform flat categories array into hierarchical structure
  const mapCategoriesToHierarchy = (flatCategories) => {
    const categoryMap = new Map();
    
    // First pass: create all categories with subcategories array
    flatCategories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        subcategories: []
      });
    });
    
    // Second pass: build relationships
    const rootCategories = [];
    
    flatCategories.forEach(category => {
      const currentCategory = categoryMap.get(category.id);
      
      if (category.fk_parent === 0 || category.fk_parent === '0') {
        // Root category
        rootCategories.push(currentCategory);
      } else {
        // Subcategory - add to parent
        const parent = categoryMap.get(category.fk_parent.toString());
        if (parent) {
          parent.subcategories.push(currentCategory);
        }
      }
    });
    
    return rootCategories;
  };

  // Filter categories based on search text
  const getFilteredCategories = () => {
    if (!searchText.trim()) {
      return hierarchicalCategories;
    }

    const filterCategory = (category) => {
      const matchesSearch = category.label.toLowerCase().includes(searchText.toLowerCase()) ||
                           category.description.toLowerCase().includes(searchText.toLowerCase());
      
      const filteredSubcategories = category.subcategories
        .map(filterCategory)
        .filter(Boolean);

      if (matchesSearch || filteredSubcategories.length > 0) {
        return {
          ...category,
          subcategories: filteredSubcategories
        };
      }
      
      return null;
    };

    return hierarchicalCategories
      .map(filterCategory)
      .filter(Boolean);
  };

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategorySelect = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const isCategorySelected = (categoryId) => {
    return selectedCategories.some(cat => cat.id === categoryId);
  };

  const renderCategory = (category, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = isCategorySelected(category.id);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const categoryColor = category.color ? `#${category.color}` : SECONDARY_COLOR;

    return (
      <View key={category.id} style={[styles.categoryContainer, { marginLeft: level * 20 }]}>
        <TouchableOpacity
          style={[
            styles.categoryItem,
            {
              backgroundColor: isSelected ? `${PRIMARY_COLOR}20` : SURFACE_COLOR,
              borderLeftColor: categoryColor,
              borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
            }
          ]}
          onPress={() => handleCategorySelect(category)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryContent}>
            <View style={[styles.colorIndicator, { backgroundColor: categoryColor }]} />
            
            <View style={styles.categoryText}>
              <Text style={[
                styles.categoryLabel,
                {
                  color: isSelected ? PRIMARY_COLOR : TEXT_COLOR,
                  fontWeight: level === 0 ? 'bold' : '600'
                }
              ]}>
                {category.label}
              </Text>
              {category.description && category.description !== category.label && (
                <Text style={[styles.categoryDescription, { color: SECONDARY_TEXT }]}>
                  {category.description}
                </Text>
              )}
            </View>

            <View style={styles.categoryActions}>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
              )}
              {hasSubcategories && (
                <TouchableOpacity
                  onPress={() => toggleCategoryExpansion(category.id)}
                  style={styles.expandButton}
                >
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={SECONDARY_TEXT}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {hasSubcategories && isExpanded && (
          <View style={styles.subcategoriesContainer}>
            {category.subcategories.map(subcat => renderCategory(subcat, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const expandAll = () => {
    const allCategoryIds = new Set();
    const addCategoryIds = (cats) => {
      cats.forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          allCategoryIds.add(cat.id);
          addCategoryIds(cat.subcategories);
        }
      });
    };
    addCategoryIds(hierarchicalCategories);
    setExpandedCategories(allCategoryIds);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
          Chargement des catégories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <Ionicons name="alert-circle" size={48} color="#DC3545" />
        <Text style={[styles.errorText, { color: TEXT_COLOR }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]}
          onPress={fetchCategories}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredCategories = getFilteredCategories();

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: SURFACE_COLOR, borderBottomColor: BORDER_COLOR }]}>
        <Text style={[styles.headerTitle, { color: TEXT_COLOR }]}>
          Catégories
        </Text>
        <Text style={[styles.headerSubtitle, { color: SECONDARY_TEXT }]}>
          {categories.length} catégories disponibles
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: SURFACE_COLOR }]}>
        <View style={[styles.searchInput, { backgroundColor: BACKGROUND_COLOR, borderColor: BORDER_COLOR }]}>
          <Ionicons name="search" size={20} color={SECONDARY_TEXT} />
          <TextInput
            style={[styles.searchText, { color: TEXT_COLOR }]}
            placeholder="Rechercher une catégorie..."
            placeholderTextColor={SECONDARY_TEXT}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={SECONDARY_TEXT} />
            </TouchableOpacity>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={expandAll}
          >
            <Text style={styles.controlButtonText}>Tout ouvrir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: SECONDARY_COLOR }]}
            onPress={collapseAll}
          >
            <Text style={styles.controlButtonText}>Tout fermer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories List */}
      <ScrollView 
        style={styles.categoriesList}
        showsVerticalScrollIndicator={false}
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => renderCategory(category))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={SECONDARY_TEXT} />
            <Text style={[styles.emptyText, { color: SECONDARY_TEXT }]}>
              {searchText ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesList: {
    flex: 1,
    padding: 10,
  },
  categoryContainer: {
    marginBottom: 5,
  },
  categoryItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryText: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
  },
  categoryDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 4,
  },
  subcategoriesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CategoriesFilter;