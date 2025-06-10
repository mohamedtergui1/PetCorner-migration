import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { COLOURS } from '../../database/Database'

export default function Botton({title, onPress = () => {}}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity = {0.7}
      style={{
        height: 55,
        width: '100%',
        backgroundColor: COLOURS.blue,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical : 20,
        borderRadius: 20
      }}>
      <Text
        style={{
          color: COLOURS.white,
          fontWeight: 'bold',
          fontSize: 18,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({})