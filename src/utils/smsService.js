/**
 * SMS Service for consistent SMS handling across the application
 * Uses EmailSMSNotifier for sending SMS
 */

import { EmailSMSNotifier } from './emailSmsNotifier';

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
    
    const notifier = new EmailSMSNotifier();
    
    return await notifier.sendSMS({
      to: data.phoneNumber,
      message: template.generateMessage(data)
    });
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
    return await this.sendSMS('NOTIFICATION', data);
  }
}

export default SMSService;
