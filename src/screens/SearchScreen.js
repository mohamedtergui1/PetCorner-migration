import { FlatList, Modal, ImageBackground, StyleSheet, Text, TouchableWithoutFeedback, View, TextInput, SafeAreaView, Alert, Keyboard, ActivityIndicator, useWindowDimensions } from 'react-native'
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
import { useTheme } from '../context/ThemeContext'; // Import the theme hook

export default function SearchScreen({navigation}) {
  const { theme } = useTheme(); // Get the current theme
  const { width, height } = useWindowDimensions(); // Use window dimensions to handle rotation
  
  const [data, setData] = useState([...filterData])
  const [modalVisible, setModalVisible] = useState(false)
  const [textInputFocussed, setTextInputFocussed] = useState(true)
  const textInput = useRef(0)
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  
  // Calculate column size based on current screen width
  const getColumnWidth = () => {
    // Determine if in portrait or landscape
    const isPortrait = height > width;
    // Use different column counts based on orientation
    const columnCount = isPortrait ? 2 : 3;
    // Calculate appropriate gap
    const gap = width * 0.035;
    // Calculate item width accounting for gaps and padding
    const totalGapSpace = gap * (columnCount + 1); // Gap at start/end and between items
    const additionalHorizontalGap = gap * (columnCount - 1); // Additional horizontal spacing between items
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

  useFocusEffect(
    useCallback(() => {
      getProducts();
    }, [])
  )

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.backgroundColor}}>

      <View style={{alignItems: 'center'}}>
        <TouchableWithoutFeedback onPress={()=>{setModalVisible(true)}}>
          <View style={[styles.searchArea, { 
            backgroundColor: theme.secondaryBackground, 
            borderColor: theme.border 
          }]}>
              <Icon style={styles.searchIcon}
              name='search'
              type='material'
              iconStyle={{ marginLeft: 5, color: theme.secondaryTextColor }}
              size = {32}
              />
              <Text style={{ fontSize: 15, color: theme.secondaryTextColor }}>Qu'est-ce que tu cherches ?</Text>
          </View>
        </TouchableWithoutFeedback>

          <Modal animationType='fade' transparent={false} visible={modalVisible}>
              <View style={[styles.modal, { backgroundColor: theme.backgroundColor }]}>
                  <View style={styles.view1}>
                      <View style={[styles.TextInput, { 
                        borderColor: theme.border,
                        backgroundColor: theme.secondaryBackground
                      }]}>
                          <Animatable.View
                          animation={textInputFocussed ? "fadeInRight" : "fadeInLeft"}
                          duration = {400}
                          >
                              <Icon 
                              name={textInputFocussed ? "arrow-back" : "search"}
                              onPress = {()=>{
                                  if(textInputFocussed)
                                  setModalVisible(false)
                                  setTextInputFocussed(true)
                              }}
                              style={styles.icon2}
                              type = 'material'
                              iconStyle={{ marginRight: 5, color: theme.secondaryTextColor }}
                              />
                          </Animatable.View>
                          <TextInput 
                              style={{width: "90%", color: theme.textColor}}
                              placeholder = ""
                              placeholderTextColor={theme.secondaryTextColor}
                              autoFocus = {false}
                              ref = {textInput}
                              onFocus = {()=>{
                                  setTextInputFocussed(true)
                              }}
                              onBlur = {()=>{
                                  setTextInputFocussed(false)
                              }}
                              onChangeText = {handleSearch}
                              onSubmitEditing = {(event) => {
                                  handleClick(event.nativeEvent.text)
                                  setModalVisible(false)
                                  setTextInputFocussed(true)
                              }}
                          />
                          <Animatable.View
                          animation={textInputFocussed ? "fadeInLeft" : ""}
                          duration = {400}
                          >
                              <Icon 
                                  name={textInputFocussed ? "cancel" : null}
                                  iconStyle = {{ color: theme.secondaryTextColor }}
                                  type = "material"
                                  style={{ marginRight: 10 }}
                                  onPress = {()=>{
                                      textInput.current.clear();
                                      setProducts(allProducts.slice(0, 11))
                                  }}
                              />
                          </Animatable.View>
                      </View>
                  </View>
                  
                  <FlatList 
                  data={products}
                  renderItem = {({item}) => (
                      <TouchableOpacity
                      onPress={()=>{
                          Keyboard.dismiss
                          handleClick(item.label)
                          setModalVisible(false)
                          setTextInputFocussed(true)
                      }}
                      >
                          <View style={[styles.view2, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                              <Text style={{color: theme.textColor, fontSize: 15}}>{item.label}</Text>
                          </View>
                      </TouchableOpacity>
                  )}
                  keyExtractor = {item => item.id}
                  />

              </View>
          </Modal>

      </View>

      {isSearch ? (
        loadingSearch ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor}}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textColor }}>Recherche en cours...</Text>
          </View>
        ): (
          <View style={{marginTop: 20, flex: 1}}>
            <FlatList
              data={searchResult}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <ProductCard navigation={navigation} data={item} />}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              contentContainerStyle={{
                paddingHorizontal: 10,
                paddingBottom: 20,
              }}
              horizontal = {false}
              showsVerticalScrollIndicator = {false}
              ListHeaderComponent =  {
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
                  <Text style={{ fontSize: 16, color: theme.textColor, paddingBottom: 10 }}>
                    Résultat de la recherche
                  </Text>
                  <Icon
                    name='close'
                    type='material'
                    color={COLOURS.red}
                    size = {32}
                    onPress = {()=>{
                      setIsSearch(false)
                    }}
                  />
                </View>
              }
            />
          </View>
        )
      ): (
        <View style={{marginTop: 10, backgroundColor: theme.backgroundColor, flex: 1}}>
          <View style={{flex: 1}}>
            <FlatList 
              style={{flex: 1}}
              data={filterData}
              keyExtractor={item => item.id}
              renderItem={({item, index}) => (
                <TouchableWithoutFeedback
                  onPress={() => {
                    navigation.navigate('ProductCategoryScreen', { categoryId: item.id })
                  }}
                >
                  <View style={{
                    width: itemWidth,
                    height: itemWidth,
                    borderRadius: 10,
                    marginBottom: gap,
                    overflow: 'hidden',
                    marginLeft: index % columnCount === 0 ? gap : gap/2,
                    marginRight: (index + 1) % columnCount === 0 ? gap : gap/2,
                  }}>
                    <ImageBackground 
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 10,
                        overflow: 'hidden'
                      }} 
                      source={item.image}
                    >
                      <View style={{
                        width: '100%', 
                        height: '100%', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(52, 52, 52, 0.5)'
                      }}>
                        <Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>{item.name}</Text>
                      </View>
                    </ImageBackground>
                  </View>
                </TouchableWithoutFeedback>
              )}
              horizontal={false}
              showsVerticalScrollIndicator={false}
              numColumns={columnCount}
              key={columnCount.toString()} // Key changes when number of columns changes to force re-render
              contentContainerStyle={{
                paddingBottom: gap,
              }}
              ListHeaderComponent={
                <Text style={{
                  fontSize: 16,
                  paddingBottom: 10,
                  marginLeft: gap,
                  color: theme.textColor
                }}>
                  Principales catégories
                </Text>
              }
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  TextInput: {
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10
  },
  searchArea: {
    marginTop: 10,
    width: "94%",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchIcon: {
    fontSize: 24,
    padding: 5,
  },
  view1: {
    height: 70,
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  view2: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center'
  },
  icon2: {
    fontSize: 14,
    padding: 5,
  },
  modal: {
    flex: 1
  }
});