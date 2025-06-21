import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useState } from 'react'
import { COLOURS } from './../../database/Database'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Input({
  label, 
  iconName, 
  error, 
  password, 
  onFocus = () => {}, 
  theme, 
  isDarkMode, 
  labelColor,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(password);

  // Dynamic colors based on theme
  const getInputColors = () => ({
    backgroundColor: isDarkMode 
      ? (theme.inputBackground || '#2a2a2a') 
      : (theme.inputBackground || COLOURS.backgroundLight || '#f8f8f8'),
    
    borderColor: error
      ? COLOURS.red
      : isFocused
        ? theme.primary || COLOURS.darkBlue
        : isDarkMode 
          ? (theme.borderColor || '#404040')
          : (theme.borderColor || COLOURS.backgroundLight || '#e0e0e0'),
    
    textColor: isDarkMode 
      ? (theme.textColor || '#ffffff') 
      : (theme.textColor || COLOURS.darkBlue || '#000000'),
    
    iconColor: isDarkMode 
      ? (theme.iconColor || theme.primary || '#ffffff') 
      : (theme.iconColor || theme.primary || COLOURS.darkBlue),
    
    labelColor: labelColor || (isDarkMode 
      ? (theme.textColor || '#ffffff') 
      : (theme.textColor || COLOURS.darkBlue || '#000000')),
    
    placeholderColor: isDarkMode 
      ? (theme.placeholderColor || '#888888') 
      : (theme.placeholderColor || '#666666')
  });

  const colors = getInputColors();

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.label, { color: colors.labelColor }]}>
        {label}
      </Text>
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
            // Add subtle shadow for better visibility in dark mode
            ...(isDarkMode && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 2,
            })
          },
        ]}>
        
        <MaterialCommunityIcons
          name={iconName}
          style={{
            fontSize: 22,
            color: colors.iconColor,
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
          style={{
            color: colors.textColor,
            flex: 1,
            fontSize: 16,
          }}
          placeholderTextColor={colors.placeholderColor}
          {...props}
        />
        
        {password && (
          <MaterialCommunityIcons 
            name={hidePassword ? 'eye-outline' : 'eye-off-outline'} 
            style={{
              color: colors.iconColor,
              fontSize: 22
            }}
            onPress={() => setHidePassword(!hidePassword)}
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
    fontWeight: '500',
  },
  inputContainer: {
    height: 55,
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: 20,
  },
})