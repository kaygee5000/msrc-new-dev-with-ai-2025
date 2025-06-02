/**
 * SMS Service for consistent SMS handling across the application
 */

import axios from 'axios';

// SMS templates with default messages
const SMS_TEMPLATES = {
  OTP: {
    generateMessage: (data) => `Your mSRC verification code is: ${data.code}. This code will expire in 10 minutes.`
  },
  
  PASSWORD_RESET: {
    generateMessage: (data) => `Your mSRC password reset code is: ${data.code}. This code will expire in 1 hour.`
  },
  
  WELCOME: {
    generateMessage: (data) => `Welcome to mSRC! Your account has been created successfully. ${data.password ? `Your login credentials - Email: ${data.email}, Password: ${data.password}` : ''}`
  },
  
  NOTIFICATION: {
    generateMessage: (data) => `${data.message}`
  }
};

/**
 * SMSService for sending SMS with consistent templates
 */
class SMSService {
  /**
   * Send an SMS using a template
   * @param {string} templateName - Template name from SMS_TEMPLATES
   * @param {Object} data - Data for the template
   * @param {string} data.phoneNumber - Recipient phone number
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - SMS send result
   */
  static async sendSMS(templateName, data, options = {}) {
    const template = SMS_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Invalid SMS template: ${templateName}`);
    }
    
    if (!data.phoneNumber) {
      throw new Error('Recipient phone number is required');
    }
    
    const message = template.generateMessage(data);
    
    return await this.sendRawSMS({
      phoneNumber: data.phoneNumber,
      message,
      sender: options.sender || 'MSRCGHANA'
    });
  }
  
  /**
   * Send a raw SMS directly to the SMS provider
   * @param {Object} params - Parameters
   * @param {string} params.phoneNumber - Recipient phone number
   * @param {string} params.message - SMS message content
   * @param {string} [params.sender] - Sender ID (optional, defaults to MSRCGHANA)
   * @returns {Promise<any>} - SMS provider API response
   */
  static async sendRawSMS({ phoneNumber, message, sender = 'MSRCGHANA' }) {
    try {
      // Format phone number (remove leading 0 and add country code if needed)
      const formattedPhone = phoneNumber.startsWith('0') 
        ? `233${phoneNumber.substring(1)}` 
        : phoneNumber;
      
      // Send SMS using Nsano SMS API
      const response = await axios.post(
        'https://api.nsano.com/api/sms/send',
        {
          sender,
          recipient: formattedPhone,
          message
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NSANO_API_KEY}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
  
  /**
   * Send an OTP SMS
   * @param {Object} data - SMS data
   * @param {string} data.phoneNumber - Recipient phone number
   * @param {string} data.code - OTP code
   * @returns {Promise<Object>} - SMS send result
   */
  static async sendOTPSMS(data) {
    return await this.sendSMS('OTP', data);
  }
  
  /**
   * Send a password reset SMS
   * @param {Object} data - SMS data
   * @param {string} data.phoneNumber - Recipient phone number
   * @param {string} data.code - Reset code
   * @returns {Promise<Object>} - SMS send result
   */
  static async sendPasswordResetSMS(data) {
    return await this.sendSMS('PASSWORD_RESET', data);
  }
  
  /**
   * Send a welcome SMS
   * @param {Object} data - SMS data
   * @param {string} data.phoneNumber - Recipient phone number
   * @param {string} data.password - Generated password (optional)
   * @returns {Promise<Object>} - SMS send result
   */
  static async sendWelcomeSMS(data) {
    return await this.sendSMS('WELCOME', data);
  }
  
  /**
   * Send a custom notification SMS
   * @param {Object} data - SMS data
   * @param {string} data.phoneNumber - Recipient phone number
   * @param {string} data.message - Custom message
   * @returns {Promise<Object>} - SMS send result
   */
  static async sendNotificationSMS(data) {
    return this.sendSMS('NOTIFICATION', {
      phoneNumber: data.phoneNumber,
      message: data.message
    });
  }
  
  /**
   * Send a test SMS to verify configuration
   * @param {string} phoneNumber - Phone number to send test SMS to
   * @returns {Promise<Object>} - SMS send result
   */
  static async sendTestSMS(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required for test SMS');
    }
    
    console.log(`Sending test SMS to ${phoneNumber}`);
    
    return this.sendRawSMS({
      phoneNumber,
      message: 'This is a test message from mSRC Ghana. Your SMS configuration is working correctly.',
      sender: 'mSRC TEST'
    });
  }
}

export default SMSService;
