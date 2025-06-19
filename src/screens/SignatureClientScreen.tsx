import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import signatureClientService, { CreateSignatureClientRequest } from '../service/SignatureClientService';

interface FormData extends CreateSignatureClientRequest {}

const SignatureClientScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, colorTheme } = useTheme();
  
  // Color scheme based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#ffffff';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#f8f8f8';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';
  const INPUT_BACKGROUND = isDarkMode ? '#2a2a2a' : '#ffffff';
  const ERROR_COLOR = '#ff3b30';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    client_id: 0,
    email_client: '',
    description: '',
    type_probleme: 'Demande de signature',
    images: [],
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch client_id from AsyncStorage on component mount
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const clientId = await AsyncStorage.getItem('client_id');
        if (clientId) {
          setFormData(prev => ({ ...prev, client_id: parseInt(clientId) }));
        } else {
          setErrors(prev => ({ ...prev, client_id: 'Aucun ID client trouvé' }));
        }
      } catch (error) {
        console.error('Error fetching client_id from AsyncStorage:', error);
        setErrors(prev => ({ ...prev, client_id: 'Erreur lors de la récupération de l\'ID client' }));
      }
    };
    fetchClientId();
  }, []);

  // Handle image picking
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0, // Allows multiple image selection
        includeBase64: true,
      });

      if (!result.didCancel && result.assets) {
        const imageUris = result.assets.map(asset => asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : '');
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUris.filter(uri => uri !== '')],
        }));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les images');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.client_id || formData.client_id === 0) {
      newErrors.client_id = 'L\'ID client est requis';
    }
    
    if (!formData.email_client) {
      newErrors.email_client = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email_client)) {
      newErrors.email_client = 'Email invalide';
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    }
    
    if (formData.images && formData.images.length === 0) {
      newErrors.images = 'Au moins une image est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await signatureClientService.create(formData);
      
      if (response.success) {
        Alert.alert(
          'Succès',
          response.message || 'Demande créée avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error: any) {
      console.error('Error creating signature client:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de créer la demande'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Demande</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Client ID Display (Read-only from AsyncStorage) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>
                ID Client <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: INPUT_BACKGROUND,
                    color: TEXT_COLOR,
                    borderColor: errors.client_id ? ERROR_COLOR : BORDER_COLOR,
                    opacity: 0.7,
                  }
                ]}
                value={formData.client_id.toString()}
                editable={false}
              />
              {errors.client_id && (
                <Text style={styles.errorText}>{errors.client_id}</Text>
              )}
            </View>

            {/* Email Client Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>
                Email Client <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: INPUT_BACKGROUND,
                    color: TEXT_COLOR,
                    borderColor: errors.email_client ? ERROR_COLOR : BORDER_COLOR
                  }
                ]}
                placeholder="exemple@email.com"
                placeholderTextColor={TEXT_COLOR_SECONDARY}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email_client}
                onChangeText={(text) => handleInputChange('email_client', text)}
              />
              {errors.email_client && (
                <Text style={styles.errorText}>{errors.email_client}</Text>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: INPUT_BACKGROUND,
                    color: TEXT_COLOR,
                    borderColor: errors.description ? ERROR_COLOR : BORDER_COLOR
                  }
                ]}
                placeholder="Décrivez le problème..."
                placeholderTextColor={TEXT_COLOR_SECONDARY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Image Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>
                Images <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.imagePickerButton, { 
                  backgroundColor: INPUT_BACKGROUND,
                  borderColor: errors.images ? ERROR_COLOR : BORDER_COLOR
                }]}
                onPress={handleImagePick}
              >
                <Ionicons name="image" size={20} color={TEXT_COLOR} />
                <Text style={[styles.imagePickerText, { color: TEXT_COLOR }]}>
                  Sélectionner des images
                </Text>
              </TouchableOpacity>
              {errors.images && (
                <Text style={styles.errorText}>{errors.images}</Text>
              )}
              <View style={styles.imagePreviewContainer}>
                {formData.images && formData.images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: image }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={ERROR_COLOR} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Type de Demande Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>Type de Demande</Text>
              <View style={[styles.pickerContainer, { 
                backgroundColor: INPUT_BACKGROUND,
                borderColor: BORDER_COLOR
              }]}>
                <Picker
                  selectedValue={formData.type_probleme}
                  onValueChange={(value) => handleInputChange('type_probleme', value)}
                  style={{ color: TEXT_COLOR }}
                  dropdownIconColor={TEXT_COLOR}
                >
                  <Picker.Item label="Demande de signature" value="Demande de signature" />
                  <Picker.Item label="Demande de modification" value="Demande de modification" />
                  <Picker.Item label="Demande de fermeture" value="Demande de fermeture" />
                  <Picker.Item label="Problème technique" value="Problème technique" />
                  <Picker.Item label="Document manquant" value="Document manquant" />
                  <Picker.Item label="Autre" value="Autre" />
                </Picker>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: PRIMARY_COLOR,
                  opacity: loading ? 0.7 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Soumettre</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: BORDER_COLOR }]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: TEXT_COLOR_SECONDARY }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#ff3b30',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  imagePickerText: {
    fontSize: 16,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    marginTop: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SignatureClientScreen;