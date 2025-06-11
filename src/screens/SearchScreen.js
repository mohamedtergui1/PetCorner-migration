import { FlatList, Modal, ImageBackground, StyleSheet, Text, TouchableWithoutFeedback, View, TextInput, Alert, Keyboard, ActivityIndicator, useWindowDimensions, StatusBar } from 'react-native'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { COLOURS, filterData, Items, restauratsData } from '../database/Database';
import { Icon } from 'react-native-elements'
import * as Animatable from 'react-native-animatable'
import { TouchableOpacity } from 'react-native';
import filter from 'lodash/filter'
import axios from 'axios';
import API_BASE_URL from '../../config/Api';
import Token from '../../config/TokenDolibar';
import ProductCard from '../components/Home/ProductCard';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function SearchScreen({navigation}) {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const { width, height } = useWindowDimensions();
  
  const [data, setData] = useState([...filterData])
  const [modalVisible, setModalVisible] = useState(false)
  const [textInputFocussed, setTextInputFocussed] = useState(false)
  const textInput = useRef(0)
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Define theme colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  
  // Dark mode colors
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';
  
  // Calculate column size based on current screen width
  const getColumnWidth = () => {
    const isPortrait = height > width;
    const columnCount = isPortrait ? 2 : 3;
    const gap = width * 0.035;
    const totalGapSpace = gap * (columnCount + 1);
    const additionalHorizontalGap = gap * (columnCount - 1);
    const itemWidth = (width - totalGapSpace - additionalHorizontalGap) / columnCount;
    
    return {
      itemWidth,
      gap,
      columnCount
    };
  }
  
  const { itemWidth, gap, columnCount } = getColumnWidth();

  const contains = ({ label }, query) => {
    return label.toLowerCase().includes(query.toLowerCase());
  }

  const handleSearch = async(text) => {
    setSearchText(text);
    var dataS = filter(allProducts, userSearch => {
      return contains(userSearch, text)
    })
    setProducts(dataS)
  }

  const getProducts = async() => {
    const headers = {
      'Content-Type': 'application/json',
      'DOLAPIKEY': Token
    }
    try {
      const res = await axios.get(API_BASE_URL + 'products', { headers })
      setAllProducts(res.data);
      setProducts(res.data.slice(0, 11))
    } catch (error) {
      console.error(error)
    }
  }

  const handleClick = async(text) => {
    setIsSearch(true);
    setLoadingSearch(true);
    const headers = {
      'Content-Type': 'application/json',
      'DOLAPIKEY': Token
    }
    const params = {
      sqlfilters: text
    }
    try {
      const res = await axios.get(API_BASE_URL + 'products', { headers, params });
      setSearchResult(res.data);
      setLoadingSearch(false);
    } catch (error) {
      console.error(error);
      setLoadingSearch(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la recherche.')
    }
  }

  const handleModalClose = () => {
    setModalVisible(false);
    setTextInputFocussed(false);
    setSearchText('');
    textInput.current?.clear();
  }

  const clearSearch = () => {
    setSearchText('');
    textInput.current?.clear();
    setProducts(allProducts.slice(0, 11));
  }

  useFocusEffect(
    useCallback(() => {
      getProducts();
    }, [])
  )

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={BACKGROUND_COLOR} 
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recherche</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(true)}>
          <View style={[styles.searchArea, { 
            backgroundColor: CARD_BACKGROUND, 
            borderColor: BORDER_COLOR,
            shadowColor: isDarkMode ? '#000' : PRIMARY_COLOR,
          }]}>
            <Ionicons 
              name="search" 
              size={22} 
              color={TEXT_COLOR_SECONDARY}
              style={styles.searchIcon}
            />
            <Text style={[styles.searchPlaceholder, { color: TEXT_COLOR_SECONDARY }]}>
              Qu'est-ce que vous cherchez ?
            </Text>
            <Ionicons 
              name="options" 
              size={20} 
              color={PRIMARY_COLOR}
              style={styles.filterIcon}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Search Modal */}
      <Modal animationType='fade' transparent={false} visible={modalVisible}>
        <View style={[styles.modal, { backgroundColor: BACKGROUND_COLOR }]}>
          
          {/* Modal Header - Fixed position */}
          <View style={[styles.modalHeader, { 
            backgroundColor: PRIMARY_COLOR,
          }]}>
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={handleModalClose}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Rechercher</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Input - with top margin for fixed header */}
          <View style={[styles.searchInputContainer, { 
            backgroundColor: BACKGROUND_COLOR,
          }]}>
            <View style={[styles.searchInputWrapper, { 
              borderColor: textInputFocussed ? PRIMARY_COLOR : BORDER_COLOR,
              backgroundColor: CARD_BACKGROUND,
              shadowColor: isDarkMode ? '#000' : PRIMARY_COLOR,
            }]}>
              <Ionicons 
                name="search" 
                size={20} 
                color={textInputFocussed ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY}
                style={styles.inputIcon}
              />
              <TextInput 
                style={[styles.textInput, { color: TEXT_COLOR }]}
                placeholder="Tapez votre recherche..."
                placeholderTextColor={TEXT_COLOR_SECONDARY}
                autoFocus={true}
                ref={textInput}
                value={searchText}
                onFocus={() => setTextInputFocussed(true)}
                onBlur={() => setTextInputFocussed(false)}
                onChangeText={handleSearch}
                onSubmitEditing={(event) => {
                  if (event.nativeEvent.text.trim()) {
                    handleClick(event.nativeEvent.text)
                    setModalVisible(false)
                  }
                }}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Search Suggestions */}
          <View style={styles.suggestionsContainer}>
            {searchText.length === 0 && (
              <View style={styles.recentSearchHeader}>
                <Ionicons name="time" size={16} color={TEXT_COLOR_SECONDARY} />
                <Text style={[styles.recentSearchText, { color: TEXT_COLOR_SECONDARY }]}>
                  Suggestions de recherche
                </Text>
              </View>
            )}
            
            <FlatList 
              data={products}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    handleClick(item.label);
                    setModalVisible(false);
                  }}
                  style={[styles.suggestionItem, { borderBottomColor: BORDER_COLOR }]}
                >
                  <Ionicons 
                    name={searchText.length > 0 ? "search" : "trending-up"} 
                    size={16} 
                    color={TEXT_COLOR_SECONDARY}
                    style={styles.suggestionIcon}
                  />
                  <Text style={[styles.suggestionText, { color: TEXT_COLOR }]}>
                    {item.label}
                  </Text>
                  <Ionicons 
                    name="arrow-up-outline" 
                    size={16} 
                    color={TEXT_COLOR_SECONDARY}
                    style={styles.suggestionArrow}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Content */}
      {isSearch ? (
        loadingSearch ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
              Recherche en cours...
            </Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <FlatList
              data={searchResult}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <ProductCard navigation={navigation} data={item} />}
              numColumns={2}
              columnWrapperStyle={styles.resultRow}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsInfo}>
                    <Text style={[styles.resultsTitle, { color: TEXT_COLOR }]}>
                      Résultats de recherche
                    </Text>
                    <Text style={[styles.resultsCount, { color: TEXT_COLOR_SECONDARY }]}>
                      {searchResult.length} produit(s) trouvé(s)
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.closeButton, { backgroundColor: PRIMARY_COLOR + '15' }]}
                    onPress={() => setIsSearch(false)}
                  >
                    <Ionicons name="close" size={20} color={PRIMARY_COLOR} />
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )
      ) : (
        <View style={styles.categoriesContainer}>
          <FlatList 
            style={{ flex: 1 }}
            data={filterData}
            keyExtractor={item => item.id}
            renderItem={({item, index}) => (
              <TouchableWithoutFeedback
                onPress={() => {
                  navigation.navigate('ProductCategoryScreen', { categoryId: item.id })
                }}
              >
                <View style={[styles.categoryCard, {
                  width: itemWidth,
                  height: itemWidth * 0.8,
                  marginBottom: gap,
                  marginLeft: index % columnCount === 0 ? gap : gap/2,
                  marginRight: (index + 1) % columnCount === 0 ? gap : gap/2,
                }]}>
                  <ImageBackground 
                    style={styles.categoryImage} 
                    source={item.image}
                  >
                    <View style={styles.categoryOverlay}>
                      <Text style={styles.categoryText}>{item.name}</Text>
                    </View>
                  </ImageBackground>
                </View>
              </TouchableWithoutFeedback>
            )}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            numColumns={columnCount}
            key={columnCount.toString()}
            contentContainerStyle={styles.categoriesList}
            ListHeaderComponent={
              <Text style={[styles.categoriesTitle, { 
                color: TEXT_COLOR,
                marginLeft: gap 
              }]}>
                Principales catégories
              </Text>
            }
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchArea: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  filterIcon: {
    marginLeft: 8,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recentSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  recentSearchText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 16,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
  },
  suggestionArrow: {
    transform: [{ rotate: '45deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  resultsInfo: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultRow: {
    justifyContent: 'space-between',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoriesContainer: {
    flex: 1,
    marginTop: 8,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingBottom: 16,
  },
  categoryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    width: '100%', 
    height: '100%', 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoriesList: {
    paddingBottom: 16,
  },
});