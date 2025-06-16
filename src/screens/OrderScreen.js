import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../config/Api';
import Token from '../../config/TokenDolibar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function OrderScreen({ navigation }) {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Define theme colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  
  // Dark mode colors
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // Fetch orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getAllOrders();
    }, [])
  );

  // Function to get all orders for the current user
  const getAllOrders = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!userData || !userData.id) {
        Alert.alert('Erreur', 'Veuillez vous connecter pour voir vos commandes');
        setIsLoading(false);
        return;
      }

      const clientID = userData.id;
      const params = {
        thirdparty_ids: clientID,
        limit: 100
      };

      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      const res = await axios.get(API_BASE_URL + 'orders/', { params, headers });
      setOrders(res.data || []);
      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      if(error.response && error.response.status === 404){
        setOrders([]);
      } else {
        console.log('Error fetching orders:', error);
        Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des commandes');
      }
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    getAllOrders();
  };

  // Format price to show 2 decimal places
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  }

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Get status text and color based on order status
  const getStatusInfo = (status) => {
    switch(status) {
      case 0:
        return { text: 'Brouillon', color: '#ff9800', bgColor: isDarkMode ? 'rgba(255,152,0,0.2)' : 'rgba(255,152,0,0.1)' };
      case 1:
        return { text: 'Validée', color: '#4caf50', bgColor: isDarkMode ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.1)' };
      case 2:
        return { text: 'En traitement', color: '#2196f3', bgColor: isDarkMode ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)' };
      case 3:
        return { text: 'Livrée', color: '#009688', bgColor: isDarkMode ? 'rgba(0,150,136,0.2)' : 'rgba(0,150,136,0.1)' };
      case -1:
        return { text: 'Annulée', color: '#f44336', bgColor: isDarkMode ? 'rgba(244,67,54,0.2)' : 'rgba(244,67,54,0.1)' };
      default:
        return { text: 'Inconnu', color: '#9e9e9e', bgColor: isDarkMode ? 'rgba(158,158,158,0.2)' : 'rgba(158,158,158,0.1)' };
    }
  };

  // Render each order item
  const renderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    
    return (
      <TouchableOpacity 
        style={[styles.orderCard, { 
          backgroundColor: CARD_BACKGROUND,
          borderColor: BORDER_COLOR,
        }]}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <MaterialCommunityIcons 
              name="shopping-outline" 
              size={18} 
              color={PRIMARY_COLOR}
              style={styles.orderIcon}
            />
            <Text style={[styles.orderNumberLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Commande N°
            </Text>
            <Text style={[styles.orderNumber, { color: TEXT_COLOR }]}>
              {item.ref}
            </Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: statusInfo.bgColor,
            borderColor: statusInfo.color,
          }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons 
              name="calendar-clock" 
              size={16} 
              color={TEXT_COLOR_SECONDARY}
            />
            <Text style={[styles.date, { color: TEXT_COLOR_SECONDARY }]}>
              {formatDate(item.date_commande)}
            </Text>
          </View>

          <View style={styles.itemsContainer}>
            {item.lines.slice(0, 2).map((line, index) => (
              <View key={`${item.id}-${line.id}`} style={[
                styles.productItem,
                { borderBottomColor: index === 0 && item.lines.length > 1 ? BORDER_COLOR : 'transparent' }
              ]}>
                <View style={[styles.imageContainer, { borderColor: BORDER_COLOR, backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' }]}>
                  {line.photo_link ? (
                    <Image 
                      source={{ uri: line.photo_link }} 
                      style={styles.image}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Feather name="image" size={24} color={TEXT_COLOR_SECONDARY} />
                    </View>
                  )}
                </View>
                <View style={styles.productDetails}>
                  <Text 
                    style={[styles.productName, { color: TEXT_COLOR }]}
                    numberOfLines={2}
                  >
                    {line.libelle}
                  </Text>
                  <View style={styles.productMeta}>
                    <View style={[styles.quantityBadge, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
                      <Text style={[styles.quantity, { color: TEXT_COLOR_SECONDARY }]}>
                        {`Qté: ${line.qty}`}
                      </Text>
                    </View>
                    <Text style={[styles.price, { color: PRIMARY_COLOR }]}>
                      {`${formatPrice(line.subprice)} dhs`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            
            {item.lines.length > 2 && (
              <View style={[styles.moreItemsContainer, { backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' }]}>
                <Text style={[styles.moreItems, { color: TEXT_COLOR_SECONDARY }]}>
                  + {item.lines.length - 2} autres articles
                </Text>
                <Feather name="chevron-right" size={16} color={TEXT_COLOR_SECONDARY} />
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: BORDER_COLOR }]} />

          <View style={styles.orderFooter}>
            <Text style={[styles.totalLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Total:
            </Text>
            <View style={[styles.totalContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
              <Text style={[styles.totalAmount, { color: PRIMARY_COLOR }]}>
                {`${formatPrice(item.total_ttc)} dhs`}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      {/* Updated Header with standardized back button */}
      <View style={[styles.headerContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes commandes</Text>
        <View style={{ width: 40 }}></View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.messageText, { color: TEXT_COLOR_SECONDARY }]}>
            Chargement de vos commandes...
          </Text>
        </View>
      ) : (
        orders.length > 0 ? (
          <FlatList
            data={orders}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : (
          <View style={styles.centerContent}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
              <Feather 
                name="shopping-bag" 
                size={60} 
                color={PRIMARY_COLOR} 
              />
            </View>
            <Text style={[styles.emptyTitle, { color: TEXT_COLOR }]}>
              Aucune commande
            </Text>
            <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
              Vous n'avez pas encore passé de commande
            </Text>
            <TouchableOpacity 
              style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Feather name="shopping-cart" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.shopButtonText}>
                Commencer vos achats
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 22,
  },
  shopButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    marginRight: 6,
  },
  orderNumberLabel: {
    fontSize: 14,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 13,
    marginLeft: 6,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 20,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantity: {
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  moreItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  moreItems: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});