import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useState } from 'react'
import{ COLOURS} from './../../database/Database'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


export default function Input({label, iconName, error, password, onFocus = () => {}, ...props}) {
    const [isFocused, setIsFocused] = useState(false);
    const [hidePassword, setHidePassword] = useState(password)

  return (
    <View
      style={{
        marginBottom: 10,
      }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error
              ? COLOURS.red
              : isFocused
              ? COLOURS.darkBlue
              : COLOURS.backgroundLight,
          },
        ]}>
        <MaterialCommunityIcons
          name={iconName}
          style={{
            fontSize: 22,
            color: COLOURS.darkBlue,
            marginRight: 10,
          }}
        />
        <TextInput
        secureTextEntry={hidePassword}
          autoCorrect={false}
          onFocus={() => {
            onFocus();
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          {...props}
          style={{
            color: COLOURS.darkBlue,
            flex: 1,
          }}
          {...props}
        />
        {password && (
            <MaterialCommunityIcons name={hidePassword ? 'eye-outline' : 'eye-off-outline'} style={{
                color: COLOURS.darkBlue,
                fontSize: 22
            }}
            onPress = {()=> setHidePassword(!hidePassword)}
            />
        )}
      </View>
      {error && (
        <Text
          style={{
            color: COLOURS.red,
            fontSize: 12,
            marginTop: 7,
          }}>
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
    label: {
        marginVertical: 5,
        fontSize: 14,
        // opacity: 0.7,
      },
      inputContainer: {
        height: 55,
        backgroundColor: COLOURS.backgroundLight,
        flexDirection: 'row',
        paddingHorizontal: 15,
        borderWidth: 0.5,
        alignItems: 'center',
        borderRadius: 20
      },
})