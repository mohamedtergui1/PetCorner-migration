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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import signatureClientService, { CreateSignatureClientRequest } from '../service/SignatureClientService';
import apiClient from '../axiosInstance/AxiosInstance';

// Extended interface with priority
interface FormData extends CreateSignatureClientRequest {
  priority?: 'Faible' | 'Normale' | 'Élevée' | 'Urgente';
}

// Updated request type options with priority mapping
const REQUEST_TYPES = [
  { label: 'Bug dans l\'application', value: 'Application Bug', priority: 'Élevée', icon: '🐞' },
  { label: 'Demande de fonctionnalité', value: 'Feature Request', priority: 'Normale', icon: '💡' },
  { label: 'Question à l\'équipe', value: 'Question to the Team', priority: 'Faible', icon: '❓' },
  { label: 'Autre', value: 'Other', priority: 'Faible', icon: '📌' },
];

// Priority options
const PRIORITY_OPTIONS = [
  { label: 'Faible', value: 'Faible', color: '#28a745', icon: '🟢' },
  { label: 'Normale', value: 'Normale', color: '#ffc107', icon: '🟡' },
  { label: 'Élevée', value: 'Élevée', color: '#fd7e14', icon: '🟠' },
  { label: 'Urgente', value: 'Urgente', color: '#dc3545', icon: '🔴' },
];

const ReclamationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, colorTheme } = useTheme();
  
  // Color scheme based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';
  const INPUT_BACKGROUND = isDarkMode ? '#2a2a2a' : '#ffffff';
  const ERROR_COLOR = '#ff3b30';
  
  const [loading, setLoading] = useState(false);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [showRequestTypePicker, setShowRequestTypePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    client_id: 0,
    email_client: '',
    description: '',
    type_probleme: 'Application Bug',
    priority: 'Élevée',
    images: [],
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setUserDataLoading(true);
        
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const clientId = parsedUserData.id;
          
          setFormData(prev => ({ ...prev, client_id: clientId }));
          
          try {
            const response = await apiClient.get(`/thirdparties/${clientId}`);
            setFormData(prev => ({
              ...prev,
              client_id: clientId,
              email_client: response.data.email || '',
            }));
          } catch (apiError) {
            console.warn('Could not fetch email from API, using stored email:', apiError);
            setFormData(prev => ({
              ...prev,
              client_id: clientId,
              email_client: parsedUserData.email || '',
            }));
          }
        } else {
          setErrors(prev => ({ ...prev, client_id: 'Aucun ID client trouvé' }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrors(prev => ({ 
          ...prev, 
          client_id: 'Erreur lors de la récupération des données utilisateur' 
        }));
      } finally {
        setUserDataLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle image picking
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5,
        includeBase64: true,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (!result.didCancel && result.assets) {
        const imageUris = result.assets.map(asset => {
          if (asset.base64) {
            return `data:image/jpeg;base64,${asset.base64}`;
          }
          return '';
        });
        
        const validImages = imageUris.filter(uri => uri !== '');
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...validImages],
        }));

        if (validImages.length > 0) {
          Alert.alert(
            'Images ajoutées',
            `${validImages.length} image(s) ajoutée(s) avec succès`,
            [{ text: 'OK' }]
          );
        }
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

  // Handle request type selection with automatic priority
  const handleRequestTypeSelect = (requestType: string) => {
    const selectedType = REQUEST_TYPES.find(type => type.value === requestType);
    const suggestedPriority = selectedType?.priority || 'Normale';
    
    setFormData(prev => ({
      ...prev,
      type_probleme: requestType,
      priority: suggestedPriority as FormData['priority'],
    }));
    setShowRequestTypePicker(false);
    
    // Clear errors
    if (errors.type_probleme) {
      setErrors(prev => ({ ...prev, type_probleme: undefined }));
    }
  };

  // Handle priority selection
  const handlePrioritySelect = (priority: string) => {
    setFormData(prev => ({
      ...prev,
      priority: priority as FormData['priority'],
    }));
    setShowPriorityPicker(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.client_id || formData.client_id === 0) {
      newErrors.client_id = 'L\'ID client est requis';
    }
    
    if (!formData.email_client) {
      console.warn('No email found for user');
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    }
    
    if (!formData.images || formData.images.length === 0) {
      newErrors.images = 'Au moins une image est requise';
    } else if (formData.images.length > 5) {
      newErrors.images = 'Maximum 5 images autorisées';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send email
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const emailSent = await signatureClientService.sendEmailNotification(
        formData,
        'simotergui4@gmail.com'
      );

      if (emailSent) {
        Alert.alert(
          'Email envoyé! ✉️',
          'Votre réclamation a été envoyée avec succès à l\'équipe de support. Vous recevrez une réponse sous peu.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de l\'email');
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

  // Get current selections
  const selectedRequestType = REQUEST_TYPES.find(type => type.value === formData.type_probleme);
  const selectedPriority = PRIORITY_OPTIONS.find(priority => priority.value === formData.priority);

  // Custom Picker Modal Component
  const CustomPickerModal = ({ 
    visible, 
    onClose, 
    title, 
    options, 
    onSelect, 
    selectedValue 
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: any[];
    onSelect: (value: string) => void;
    selectedValue?: string;
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: BACKGROUND_COLOR }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.optionsList}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: selectedValue === option.value ? PRIMARY_COLOR + '20' : 'transparent',
                    borderColor: BORDER_COLOR,
                  }
                ]}
                onPress={() => onSelect(option.value)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionLabel, { color: TEXT_COLOR }]}>
                    {option.label}
                  </Text>
                  {option.priority && (
                    <Text style={[styles.optionSubtext, { color: TEXT_COLOR_SECONDARY }]}>
                      Priorité: {option.priority}
                    </Text>
                  )}
                </View>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={20} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Show loading screen while fetching user data
  if (userDataLoading) {
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
          <Text style={styles.headerTitle}>Nouvelle Réclamation</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
            Chargement des données utilisateur...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Nouvelle Réclamation</Text>
        <TouchableOpacity 
          style={styles.emailButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
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
            {/* Type de Demande Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>
                Type de Demande <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.customPicker,
                  { 
                    backgroundColor: INPUT_BACKGROUND,
                    borderColor: BORDER_COLOR
                  }
                ]}
                onPress={() => setShowRequestTypePicker(true)}
              >
                <View style={styles.pickerContent}>
                  <Text style={styles.pickerIcon}>{selectedRequestType?.icon}</Text>
                  <Text style={[styles.pickerText, { color: TEXT_COLOR }]}>
                    {selectedRequestType?.label}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={TEXT_COLOR_SECONDARY} />
              </TouchableOpacity>
            </View>

            {/* Priority Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: TEXT_COLOR }]}>
                Priorité <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.customPicker,
                  { 
                    backgroundColor: INPUT_BACKGROUND,
                    borderColor: BORDER_COLOR
                  }
                ]}
                onPress={() => setShowPriorityPicker(true)}
              >
                <View style={styles.pickerContent}>
                  <Text style={styles.pickerIcon}>{selectedPriority?.icon}</Text>
                  <Text style={[styles.pickerText, { color: selectedPriority?.color || TEXT_COLOR }]}>
                    {selectedPriority?.label}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={TEXT_COLOR_SECONDARY} />
              </TouchableOpacity>
              <Text style={[styles.helpText, { color: TEXT_COLOR_SECONDARY }]}>
                💡 La priorité est suggérée automatiquement selon le type de demande
              </Text>
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
                placeholder="Décrivez le problème en détail..."
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
                  Sélectionner des images ({formData.images?.length || 0}/5)
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
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Envoyer Réclamation</Text>
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

      {/* Custom Pickers */}
      <CustomPickerModal
        visible={showRequestTypePicker}
        onClose={() => setShowRequestTypePicker(false)}
        title="Sélectionner le type de demande"
        options={REQUEST_TYPES}
        onSelect={handleRequestTypeSelect}
        selectedValue={formData.type_probleme}
      />

      <CustomPickerModal
        visible={showPriorityPicker}
        onClose={() => setShowPriorityPicker(false)}
        title="Sélectionner la priorité"
        options={PRIORITY_OPTIONS}
        onSelect={handlePrioritySelect}
        selectedValue={formData.priority}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  emailButton: {
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
  // Custom Picker Styles
  customPicker: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 5,
    borderWidth: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  // Existing styles
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
  helpText: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default ReclamationScreen;