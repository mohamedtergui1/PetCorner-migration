import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Added for consistent back button
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import API_BASE_URL from '../../config/Api';
import Token from '../../config/TokenDolibar';

export default function UserDetailsScreen({ navigation }) {
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form inputs for editing
  const [inputs, setInputs] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const { theme, isDarkMode, colorTheme } = useTheme();

  // Define colors based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#ffffff';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#f8f8f8';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // Custom Toast Component
  const showToast = (type, title, message) => {
    setShowSuccess(type === 'success');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Get current user data
  const getUserData = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!userData) {
        navigation.goBack();
        return;
      }
      
      const clientID = userData.id;
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };
      
      const res = await axios.get(API_BASE_URL + 'thirdparties/' + clientID, { headers });
      setUserDetails(res.data);
      
      // Initialize form inputs with current data
      setInputs({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
      });
      
    } catch (error) {
      console.log('Error fetching user data:', error);
      showToast('error', 'Erreur', 'Impossible de charger les données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUserData();
    }, [])
  );

  // Handle input changes
  const handleOnchange = (text, input) => {
    setInputs(prevState => ({ ...prevState, [input]: text }));
    // Clear error when user starts typing
    if (errors[input]) {
      setErrors(prevState => ({ ...prevState, [input]: null }));
    }
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({ ...prevState, [input]: error }));
  };

  // Validate inputs
  const validateInputs = () => {
    let isValid = true;

    if (!inputs.name.trim()) {
      handleError('Le nom est requis', 'name');
      isValid = false;
    }

    if (!inputs.email.trim()) {
      handleError('L\'email est requis', 'email');
      isValid = false;
    } else if (!inputs.email.match(/\S+@\S+\.\S+/)) {
      handleError('Format d\'email invalide', 'email');
      isValid = false;
    }

    if (!inputs.phone.trim()) {
      handleError('Le téléphone est requis', 'phone');
      isValid = false;
    }

    return isValid;
  };

  // Save user changes
  const saveUserData = async () => {
    if (!validateInputs()) {
      return;
    }

    setSaving(true);
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      const clientID = userData.id;
      
      const updateData = {
        name: inputs.name.trim(),
        email: inputs.email.trim(),
        phone: inputs.phone.trim(),
        address: inputs.address.trim(),
      };

      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      const res = await axios.put(
        API_BASE_URL + 'thirdparties/' + clientID,
        updateData,
        { headers }
      );

      // Update local user details
      setUserDetails({ ...userDetails, ...updateData });
      setIsEditing(false);

      showToast('success', 'Succès! 🎉', 'Vos informations ont été mises à jour');

    } catch (error) {
      console.log('Error updating user data:', error);
      showToast('error', 'Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    // Reset inputs to original values
    if (userDetails) {
      setInputs({
        name: userDetails.name || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        address: userDetails.address || '',
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  // Confirm cancel if user has made changes
  const handleCancelPress = () => {
    const hasChanges = 
      inputs.name !== (userDetails?.name || '') ||
      inputs.email !== (userDetails?.email || '') ||
      inputs.phone !== (userDetails?.phone || '') ||
      inputs.address !== (userDetails?.address || '');

    if (hasChanges) {
      Alert.alert(
        'Annuler les modifications',
        'Êtes-vous sûr de vouloir annuler vos modifications ?',
        [
          { text: 'Non', style: 'cancel' },
          { text: 'Oui', onPress: cancelEditing }
        ]
      );
    } else {
      cancelEditing();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={BACKGROUND_COLOR} 
      />
      
      {/* Loading Overlay */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingModal, { backgroundColor: CARD_BACKGROUND }]}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
              Sauvegarde...
            </Text>
          </View>
        </View>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <View style={styles.successToast}>
          <View style={[styles.toastContent, { backgroundColor: '#4CAF50' }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.toastText}>Informations mises à jour!</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        {/* ✅ Updated Back Button - Using Ionicons for consistency */}
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le profil' : 'Mon profil'}
        </Text>
        
        {/* ✅ Edit/Cancel Button - Using MaterialCommunityIcons for better edit icons */}
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            if (isEditing) {
              handleCancelPress();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <MaterialCommunityIcons 
            name={isEditing ? "close" : "pencil"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info Section */}
          <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="account-circle" 
                size={24} 
                color={PRIMARY_COLOR} 
              />
              <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
                Informations personnelles
              </Text>
            </View>

            <View style={styles.fieldsContainer}>
              {isEditing ? (
                <>
                  {/* Custom Input Components */}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Nom complet</Text>
                    <View style={[styles.inputWrapper, { 
                      backgroundColor: BACKGROUND_COLOR,
                      borderColor: errors.name ? '#ff4444' : BORDER_COLOR 
                    }]}>
                      <MaterialCommunityIcons 
                        name="account-outline" 
                        size={20} 
                        color={TEXT_COLOR_SECONDARY} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.textInput, { color: TEXT_COLOR }]}
                        value={inputs.name}
                        onChangeText={text => handleOnchange(text, 'name')}
                        onFocus={() => handleError(null, 'name')}
                        placeholder="Entrez votre nom complet"
                        placeholderTextColor={TEXT_COLOR_SECONDARY}
                      />
                    </View>
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Email</Text>
                    <View style={[styles.inputWrapper, { 
                      backgroundColor: BACKGROUND_COLOR,
                      borderColor: errors.email ? '#ff4444' : BORDER_COLOR 
                    }]}>
                      <MaterialCommunityIcons 
                        name="email-outline" 
                        size={20} 
                        color={TEXT_COLOR_SECONDARY} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.textInput, { color: TEXT_COLOR }]}
                        value={inputs.email}
                        onChangeText={text => handleOnchange(text, 'email')}
                        onFocus={() => handleError(null, 'email')}
                        placeholder="Entrez votre email"
                        placeholderTextColor={TEXT_COLOR_SECONDARY}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Téléphone</Text>
                    <View style={[styles.inputWrapper, { 
                      backgroundColor: BACKGROUND_COLOR,
                      borderColor: errors.phone ? '#ff4444' : BORDER_COLOR 
                    }]}>
                      <MaterialCommunityIcons 
                        name="phone-outline" 
                        size={20} 
                        color={TEXT_COLOR_SECONDARY} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.textInput, { color: TEXT_COLOR }]}
                        value={inputs.phone}
                        onChangeText={text => handleOnchange(text, 'phone')}
                        onFocus={() => handleError(null, 'phone')}
                        placeholder="Entrez votre numéro de téléphone"
                        placeholderTextColor={TEXT_COLOR_SECONDARY}
                        keyboardType="phone-pad"
                      />
                    </View>
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Adresse</Text>
                    <View style={[styles.inputWrapper, { 
                      backgroundColor: BACKGROUND_COLOR,
                      borderColor: errors.address ? '#ff4444' : BORDER_COLOR 
                    }]}>
                      <MaterialCommunityIcons 
                        name="map-marker-outline" 
                        size={20} 
                        color={TEXT_COLOR_SECONDARY} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.textInput, { color: TEXT_COLOR }]}
                        value={inputs.address}
                        onChangeText={text => handleOnchange(text, 'address')}
                        onFocus={() => handleError(null, 'address')}
                        placeholder="Entrez votre adresse"
                        placeholderTextColor={TEXT_COLOR_SECONDARY}
                      />
                    </View>
                    {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                      <MaterialCommunityIcons 
                        name="account" 
                        size={20} 
                        color={PRIMARY_COLOR} 
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                        Nom complet
                      </Text>
                      <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                        {userDetails?.name || 'Non renseigné'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                      <MaterialCommunityIcons 
                        name="email" 
                        size={20} 
                        color={PRIMARY_COLOR} 
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                        Email
                      </Text>
                      <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                        {userDetails?.email || 'Non renseigné'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                      <MaterialCommunityIcons 
                        name="phone" 
                        size={20} 
                        color={PRIMARY_COLOR} 
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                        Téléphone
                      </Text>
                      <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                        {userDetails?.phone || 'Non renseigné'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                      <MaterialCommunityIcons 
                        name="map-marker" 
                        size={20} 
                        color={PRIMARY_COLOR} 
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                        Adresse
                      </Text>
                      <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                        {userDetails?.address || 'Non renseigné'}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Save Button (only shown when editing) */}
          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={saveUserData}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingModal: {
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  successToast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  keyboardView: {
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Custom Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 5,
  },
  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  // Button Styles
  buttonContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});