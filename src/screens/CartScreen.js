import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Cart from '../components/Cart/Cart'

export default function CartScreen({navigation}) {
  return (
    <View>
      <Cart navigation={navigation} />
    </View>
  )
}

const styles = StyleSheet.create({})