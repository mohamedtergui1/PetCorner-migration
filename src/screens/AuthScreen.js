import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function AuthScreen({navigation}) {
  return (
    <View>
      <Text onPress={()=>navigation.navigate("Home")}>AuthScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({})