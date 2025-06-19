import apiClient from "../axiosInstance/AxiosInstance";

/**
 * Interface for SignatureClient creation request
 */
export interface CreateSignatureClientRequest {
  client_id: number;
  email_client: string;
  description: string;
  type_probleme?: 'Demande de signature' | 'Demande de modification' | 'Demande de fermeture' | 'Problème technique' | 'Document manquant' | 'Autre';
  images?: string[]; // Support multiple image uploads as base64 strings
}

/**
 * Interface for SignatureClient response
 */
export interface SignatureClientResponse {
  success: boolean;
  message: string;
  id: number;
  data: SignatureClientData;
}

/**
 * Interface for SignatureClient data
 */
export interface SignatureClientData {
  id: number;
  client_id: number;
  email_client: string;
  description: string;
  type_document: string;
  type_probleme: string;
  date_creation?: string;
  date_modification?: string;
}

/**
 * SignatureClient API Class
 */
export class SignatureClientService {
  private readonly endpoint = '/signatureclient';

  /**
   * Create a new signature client
   * @param signatureData - The signature client data including images
   * @returns Promise<SignatureClientResponse>
   */
  public async create(signatureData: CreateSignatureClientRequest): Promise<SignatureClientResponse> {
    try {
      const formData = new FormData();
      formData.append('client_id', signatureData.client_id.toString());
      formData.append('email_client', signatureData.email_client);
      formData.append('description', signatureData.description);
      if (signatureData.type_probleme) {
        formData.append('type_probleme', signatureData.type_probleme);
      }

      // Append images if they exist
      if (signatureData.images && signatureData.images.length > 0) {
        signatureData.images.forEach((image, index) => {
          const base64Data = image.split(',')[1] || image; // Remove data URI prefix if present
          formData.append(`images[${index}]`, base64Data);
        });
      }

      const response = await apiClient.post<SignatureClientResponse>(this.endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const signatureClientService = new SignatureClientService();

export default signatureClientService;