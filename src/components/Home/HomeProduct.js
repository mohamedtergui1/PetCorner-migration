import { BackHandler, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, ToastAndroid, View, Platform } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView } from 'react-native-gesture-handler';
import { COLOURS, filterData } from '../../database/Database';
import { TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../../config/Api';
import Token from '../../../config/TokenDolibar';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import ProductList from '../ProductList/ProductList';
import { useTheme } from '../../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width

export default function HomeProduct({navigation}) {
  const { theme } = useTheme();
  const [delivery, setDelivery] = useState(true);
  const [indexCheck, setIndexCheck] = useState("0");
  const [layoutMode, setLayoutMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backPressCount, setBackPressCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [userDetails, setUserDetails] = useState();

  const toggleLayout = () => {
    setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid');
  };

  // Gestion du temps
  useFocusEffect(
    useCallback(() => {
      const updateTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setCurrentTime(`${hours}:${minutes}`);
      };
  
      updateTime();
      const intervalId = setInterval(updateTime, 60000);
  
      return () => clearInterval(intervalId);
    }, [])
  )

  // Chargement des produits au focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getProducts();
    });
    return unsubscribe;
  }, [navigation]);

  // Gestion du bouton retour
  useEffect(() => {
    const backAction = () => {
      setBackPressCount(prevCount => prevCount + 1);

      if (backPressCount === 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Cliquez à nouveau sur Retour pour quitter', ToastAndroid.SHORT);
        } else {
          Toast.show('Cliquez à nouveau sur Retour pour quitter', Toast.SHORT);
        }
        setTimeout(() => {
          setBackPressCount(0);
        }, 2000);
        return true;
      } else if (backPressCount === 1) {
        BackHandler.exitApp();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [backPressCount]);

  // Récupération des produits
  const getProducts = async() => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_BASE_URL + "categories/allp", {
        headers: {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        }
      });

      const categories = response.data;
      const desiredCategoryIds = ["2", "3", "23", "32", "54", "55", "56"];
      const filteredCategories = categories.filter(category =>
        desiredCategoryIds.includes(category.id)
      );

      const limitedProducts = filteredCategories.map(category => ({
        ...category,
        products: category.products.slice(0, 4)
      }));

      setProducts(limitedProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Récupération des données utilisateur
  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('userData'));
    const clientID = userData?.id;

    if (!clientID) return;

    const headers = {
      'Content-Type': 'application/json',
      'DOLAPIKEY': Token
    };
    
    try {
      const res = await axios.get(API_BASE_URL + 'thirdparties/' + clientID, { headers });
      setUserDetails(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={true}
        style={{ flex: 1 }}
      >
        {/* Barre de localisation et heure */}
        <View style={[styles.topBar, { 
          backgroundColor: theme.statusBarBackground,
          borderBottomColor: theme.borderColor
        }]}>
          <View style={styles.locationSection}>
            <View style={[styles.locationDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.locationText, { color: theme.textColor }]} numberOfLines={1}>
              {userDetails?.address || 'Sélectionner un lieu'}
            </Text>
          </View>
          <View style={styles.timeSection}>
            <Text style={[styles.timeText, { color: theme.primary }]}>{currentTime}</Text>
          </View>
        </View>

        {/* Bannière héros */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
          }]}>
            <View style={styles.heroContent}>
              <View style={styles.heroText}>
                <Text style={styles.heroEmoji}>🐾</Text>
                <Text style={[styles.heroTitle, { color: theme.textColor }]}>
                  PetCorner
                </Text>
                <Text style={[styles.heroSubtitle, { color: theme.secondaryTextColor }]}>
                  Tout ce dont votre animal a besoin
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.heroButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Produits')}
              >
                <Text style={styles.heroButtonText}>Explorer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Carrousel minimal */}
        <View style={[styles.carouselSection, { 
          shadowColor: '#000',
        }]}>
          <Swiper 
            autoplay={true} 
            height={200}
            showsPagination={true}
            paginationStyle={styles.pagination}
            dotStyle={[styles.dot, { 
              backgroundColor: 'rgba(255,255,255,0.5)'
            }]}
            activeDotStyle={[styles.activeDot, { backgroundColor: theme.primary }]}
            autoplayTimeout={5}
          >
            <View style={styles.slide}>
              <Image
                source={{
                  uri: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/clothing-store-banner-design-template-e7332aaf6402c88cb4623bf8eb6f97e2_screen.jpg?ts=1620867237',
                }}
                style={styles.slideImage}
              />
              <View style={[styles.slideGradient, { 
                backgroundColor: 'rgba(0,0,0,0.5)'
              }]}>
                <Text style={styles.slideText}>Offres Spéciales</Text>
              </View>
            </View>
            
            <View style={styles.slide}>
              <Image
                source={{
                  uri: 'https://t4.ftcdn.net/jpg/03/06/69/49/360_F_306694930_S3Z8H9Qk1MN79ZUe7bEWqTFuonRZdemw.jpg',
                }}
                style={styles.slideImage}
              />
              <View style={[styles.slideGradient, { 
                backgroundColor: 'rgba(0,0,0,0.5)'
              }]}>
                <Text style={styles.slideText}>Nourriture Premium</Text>
              </View>
            </View>
            
            <View style={styles.slide}>
              <Image
                source={{
                  uri: 'https://t4.ftcdn.net/jpg/03/20/46/13/360_F_320461388_5Snqf6f2tRIqiWlaIzNWrCUm1Ocaqhfm.jpg',
                }}
                style={styles.slideImage}
              />
              <View style={[styles.slideGradient, { 
                backgroundColor: 'rgba(0,0,0,0.5)'
              }]}>
                <Text style={styles.slideText}>Essentiels Chat</Text>
              </View>
            </View>
            
            <View style={styles.slide}>
              <Image
                source={{
                  uri: 'https://t4.ftcdn.net/jpg/03/65/85/47/360_F_365854716_ZHB0YN3i3s0H7NjI9hiezH53D5nvoF0E.jpg',
                }}
                style={styles.slideImage}
              />
              <View style={[styles.slideGradient, { 
                backgroundColor: 'rgba(0,0,0,0.5)'
              }]}>
                <Text style={styles.slideText}>Jouets Amusants</Text>
              </View>
            </View>
          </Swiper>
        </View>

        {/* Section des catégories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Catégories
          </Text>
          
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={filterData}
            keyExtractor={item => item.id}
            extraData={indexCheck}
            contentContainerStyle={styles.categoriesList}
            renderItem={({item, index}) => (
              <Pressable
                onPress={() => {
                  setIndexCheck(item.id);
                  navigation.navigate('ProductCategoryScreen', { categoryId: item.id })
                }}>
                <View style={[
                  styles.categoryItem,
                  {
                    backgroundColor: indexCheck === item.id 
                      ? theme.primary 
                      : theme.cardBackground,
                    borderColor: indexCheck === item.id 
                      ? theme.primary 
                      : theme.borderColor,
                    shadowColor: '#000',
                  }
                ]}>
                  <View style={[styles.categoryImageWrapper, {
                    backgroundColor: indexCheck === item.id 
                      ? 'rgba(255,255,255,0.15)' 
                      : theme.rowBackground
                  }]}>
                    <Image
                      style={styles.categoryImage}
                      source={item.image}
                    />
                  </View>
                  <Text style={[
                    styles.categoryText,
                    { 
                      color: indexCheck === item.id 
                        ? '#FFFFFF' 
                        : theme.textColor 
                    }
                  ]} 
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                  >
                    {item.name}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Section des produits */}
        <View style={styles.productsWrapper}>
          <ProductList 
            products={products}
            isLoading={isLoading}
            layoutMode={layoutMode}
            onToggleLayout={toggleLayout}
            navigation={navigation}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Styles de la barre supérieure
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  timeSection: {
    marginLeft: 15,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Styles de la section héros
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  heroCard: {
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  heroButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 20,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Styles du carrousel
  carouselSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  slide: {
    flex: 1,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slideGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slideText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pagination: {
    bottom: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  // Styles des catégories
  categoriesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 110,
    borderRadius: 20,
    marginRight: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  categoryImageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Wrapper des produits
  productsWrapper: {
    flex: 1,
  },
});