// SignatureClientService.ts - PHP Gmail SMTP Integration (Fixed)
import { Alert } from 'react-native';

export interface CreateSignatureClientRequest {
  client_id: number;
  email_client: string;
  description: string;
  type_probleme?: 'Demande de signature' | 'Demande de modification' | 'Demande de fermeture' | 'Problème technique' | 'Document manquant' | 'Autre';
  images?: string[];
}

export class SignatureClientService {
  // PHP Email Service Configuration
  private readonly EMAIL_API_URL = 'https://ipos.ma/fide/custom_api/send_email.php';
  
  // Optional backup endpoints (you can add more if needed)
  private readonly BACKUP_ENDPOINTS: string[] = [
    // Add backup URLs here if you have multiple servers
    // 'https://backup-server.com/send_email.php',
  ];

  /**
   * Send email via PHP Gmail SMTP service
   */
  public async sendEmailNotification(
    signatureData: CreateSignatureClientRequest,
    supportEmail: string = 'simotergui4@gmail.com'
  ): Promise<boolean> {
    try {
      console.log('🚀 Sending email via PHP Gmail SMTP...');

      // Prepare email data for PHP script
      const emailData = {
        client_id: signatureData.client_id,
        client_email: signatureData.email_client,
        description: signatureData.description,
        request_type: signatureData.type_probleme || 'Autre',
        images_count: signatureData.images?.length || 0,
        support_email: supportEmail,
        // Include the actual images data for attachments
        images: signatureData.images || [],
        // Additional metadata
        platform: 'React Native',
        timestamp: new Date().toISOString(),
      };

      console.log('📧 Prepared email data:', {
        client_id: emailData.client_id,
        request_type: emailData.request_type,
        images_count: emailData.images_count,
        endpoint: this.EMAIL_API_URL
      });

      // Try primary endpoint first
      try {
        const success = await this.sendToEndpoint(this.EMAIL_API_URL, emailData);
        if (success) {
          console.log('✅ Email sent successfully via primary endpoint');
          return true;
        }
      } catch (primaryError: any) {
        console.log('⚠️ Primary endpoint failed:', primaryError.message);
        
        // Only try backups if there are any configured
        if (this.BACKUP_ENDPOINTS.length > 0) {
          console.log('🔄 Trying backup endpoints...');
          
          for (const backupUrl of this.BACKUP_ENDPOINTS) {
            try {
              const success = await this.sendToEndpoint(backupUrl, emailData);
              if (success) {
                console.log(`✅ Email sent successfully via backup endpoint: ${backupUrl}`);
                return true;
              }
            } catch (backupError: any) {
              console.log(`⚠️ Backup endpoint failed: ${backupUrl}`, backupError.message);
            }
          }
        }
        
        // If all endpoints fail, throw the original error
        throw primaryError;
      }

      return false;

    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'envoi de l\'email.';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Délai d\'attente dépassé. Veuillez réessayer.';
      } else if (error.message?.includes('server') || error.message?.includes('500')) {
        errorMessage = 'Erreur du serveur. Vérifiez que le fichier PHP est configuré correctement.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Service email introuvable. Vérifiez l\'URL du serveur.';
      } else if (error.message?.includes('403') || error.message?.includes('401')) {
        errorMessage = 'Accès refusé au service email. Vérifiez la configuration.';
      }

      Alert.alert('Erreur d\'envoi', errorMessage);
      return false;
    }
  }

  /**
   * Send data to specific PHP endpoint
   */
  private async sendToEndpoint(url: string, data: any): Promise<boolean> {
    console.log(`📡 Trying endpoint: ${url}`);

    // Create timeout promise for older React Native versions
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 seconds
    });

    const fetchPromise = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ReactNative/EmailService',
      },
      body: JSON.stringify(data),
    });

    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    console.log(`📊 Response from ${url}:`, response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📨 Server response:', result);

    if (result.success) {
      return true;
    } else {
      throw new Error(result.error || 'Unknown server error');
    }
  }

  /**
   * Validate configuration
   */
  public validateConfiguration(): boolean {
    const hasValidUrl = this.EMAIL_API_URL && 
                       this.EMAIL_API_URL !== 'https://yourserver.com/send_email.php' &&
                       this.EMAIL_API_URL.includes('http');
    
    if (!hasValidUrl) {
      console.error('❌ Email API URL not configured');
      Alert.alert(
        'Configuration Error',
        'L\'URL du service email n\'est pas configurée. Veuillez mettre à jour EMAIL_API_URL.'
      );
      return false;
    }

    console.log('✅ Email service configuration valid');
    console.log('🔧 API URL:', this.EMAIL_API_URL);
    return true;
  }

  /**
   * Test email functionality
   */
  public async testEmailConnection(): Promise<boolean> {
    console.log('🧪 Testing PHP Gmail SMTP service...');

    // Validate configuration first
    if (!this.validateConfiguration()) {
      return false;
    }

    const testData: CreateSignatureClientRequest = {
      client_id: 999,
      email_client: 'test@example.com',
      description: `Test Email from React Native App

Ce test vérifie que le service PHP Gmail SMTP fonctionne correctement.

Détails du test:
- Service: PHP Gmail SMTP
- Platform: React Native  
- Endpoint: ${this.EMAIL_API_URL}
- Timestamp: ${new Date().toISOString()}
- Test ID: ${Math.random().toString(36).substr(2, 9)}

Si vous recevez cet email, l'intégration fonctionne parfaitement! ✅

---
Système de test automatique`,
      type_probleme: 'Autre',
      images: []
    };

    try {
      const success = await this.sendEmailNotification(testData, 'simotergui4@gmail.com');
      
      if (success) {
        Alert.alert(
          '✅ Test réussi!',
          'Email de test envoyé avec succès via PHP Gmail SMTP! Vérifiez votre boîte email.'
        );
        return true;
      } else {
        Alert.alert(
          '❌ Test échoué',
          'L\'envoi de l\'email de test a échoué. Vérifiez la configuration du serveur PHP.'
        );
        return false;
      }
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      Alert.alert(
        '❌ Erreur de test',
        `Le test a échoué: ${error.message}\n\nVérifiez que le serveur PHP est accessible et configuré.`
      );
      return false;
    }
  }

  /**
   * Check server status
   */
  public async checkServerStatus(): Promise<boolean> {
    try {
      console.log('🏥 Checking server status...');
      
      // Create timeout promise for older React Native versions
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Server check timeout')), 10000); // 10 seconds
      });

      const fetchPromise = fetch(this.EMAIL_API_URL, {
        method: 'GET',
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      console.log('🏥 Server health check:', response.status, response.statusText);
      
      // 200 = OK, 405 = Method not allowed (normal for POST-only endpoint)
      const isHealthy = response.status === 200 || response.status === 405;
      
      if (isHealthy) {
        console.log('✅ Server is responding');
      } else {
        console.log('⚠️ Server returned unexpected status:', response.status);
      }
      
      return isHealthy;
    } catch (error: any) {
      console.error('❌ Server health check failed:', error);
      return false;
    }
  }

  /**
   * Quick test with server status check
   */
  public async quickTest(): Promise<void> {
    try {
      console.log('🔍 Starting quick test...');
      
      // Step 1: Check server status
      const serverOk = await this.checkServerStatus();
      console.log('Server status:', serverOk ? '✅ OK' : '❌ Failed');
      
      if (!serverOk) {
        Alert.alert(
          '⚠️ Server Issue',
          `Le serveur ne répond pas à l'adresse:\n${this.EMAIL_API_URL}\n\nVérifiez que le fichier PHP est bien uploadé.`
        );
        return;
      }
      
      // Step 2: Test email sending
      console.log('📧 Testing email sending...');
      await this.testEmailConnection();
      
    } catch (error: any) {
      console.error('❌ Quick test failed:', error);
      Alert.alert(
        '❌ Test Error',
        `Test rapide échoué: ${error.message}`
      );
    }
  }
}

// Export singleton instance
export const signatureClientService = new SignatureClientService();
export default signatureClientService;