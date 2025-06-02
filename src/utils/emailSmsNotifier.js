/**
 * DEPRECATED: This file is maintained for backward compatibility only.
 * New code should use EmailService and SMSService directly.
 */

import EmailService from './emailService';
import SMSService from './smsService';

// Legacy support - these functions are kept for backward compatibility
// All functions forward to the appropriate service

/**
 * Send an email
 * @deprecated Use EmailService.sendEmail directly
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  console.warn('Warning: emailSmsNotifier.sendEmail is deprecated. Use EmailService.sendEmail directly.');
  
  // Create a custom template for this email
  const templateData = {
    email: to,
    name: '',
  };
  
  const options = { subject };
  
  return EmailService.sendEmail('CUSTOM', templateData, {
    ...options,
    customHtml: html,
    customText: text
  });
};

/**
 * Send a welcome email
 * @deprecated Use EmailService.sendWelcomeEmail directly
 */
export const sendWelcomeEmail = async (user) => {
  console.warn('Warning: emailSmsNotifier.sendWelcomeEmail is deprecated. Use EmailService.sendWelcomeEmail directly.');
  
  return EmailService.sendWelcomeEmail({
    email: user.email,
    name: user.name,
    password: user.tempPassword
  });
};

/**
 * Send a password reset email
 * @deprecated Use EmailService.sendPasswordResetEmail directly
 */
export const sendPasswordResetEmail = async ({ email, name, resetToken, isMagicLink = false }) => {
  console.warn('Warning: emailSmsNotifier.sendPasswordResetEmail is deprecated. Use EmailService.sendPasswordResetEmail directly.');
  
  return EmailService.sendPasswordResetEmail({
    email,
    name,
    resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${isMagicLink ? 'api/auth/callback/email?token=' : 'reset-password?token='}${resetToken}`
  });
};

/**
 * Send an OTP email
 * @deprecated Use EmailService.sendOTPEmail directly
 */
export const sendOTPEmail = async ({ email, name, code }) => {
  console.warn('Warning: emailSmsNotifier.sendOTPEmail is deprecated. Use EmailService.sendOTPEmail directly.');
  
  return EmailService.sendOTPEmail({
    email,
    name,
    code
  });
};

/**
 * Send an SMS
 * @deprecated Use SMSService.sendRawSMS directly
 */
export const sendSMS = async ({ phoneNumber, message, sender = 'MSRCGHANA' }) => {
  console.warn('Warning: emailSmsNotifier.sendSMS is deprecated. Use SMSService.sendRawSMS directly.');
  
  return SMSService.sendRawSMS({
    phoneNumber,
    message,
    sender
  });
};

/**
 * Send an OTP via SMS
 * @deprecated Use SMSService.sendOTPSMS directly
 */
export const sendOTPSMS = async ({ phoneNumber, name, code }) => {
  console.warn('Warning: emailSmsNotifier.sendOTPSMS is deprecated. Use SMSService.sendOTPSMS directly.');
  
  return SMSService.sendOTPSMS({
    phoneNumber,
    code
  });
};

/**
 * Send bulk notifications
 * @deprecated Use EmailService and SMSService directly
 */
export const sendBulkNotification = async ({ users, subject, message, sendEmail = true, sendSMS = false }) => {
  console.warn('Warning: emailSmsNotifier.sendBulkNotification is deprecated. Use EmailService and SMSService directly.');
  
  const results = [];
  
  for (const user of users) {
    try {
      // Send email if enabled and email is available
      if (sendEmail && user.email) {
        const emailResult = await EmailService.sendEmail('CUSTOM', {
          email: user.email,
          name: user.name || ''
        }, {
          subject,
          customHtml: `<h1>${subject}</h1><p>${message}</p>`,
          customText: `${subject}\n\n${message}`
        });
        
        results.push({ 
          type: 'email', 
          to: user.email, 
          success: true 
        });
      }
      
      // Send SMS if enabled and phone is available
      if (sendSMS && user.phone_number) {
        const smsResult = await SMSService.sendRawSMS({ 
          phoneNumber: user.phone_number, 
          message: `${subject}\n\n${message}` 
        });
        
        results.push({ 
          type: 'sms', 
          to: user.phone_number, 
          success: true 
        });
      }
    } catch (error) {
      console.error(`Failed to send notification to user:`, user, error);
      results.push({ 
        type: sendEmail ? 'email' : 'sms', 
        to: sendEmail ? user.email : user.phone_number, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
};

// Export a compatibility class for any code that might be using it directly
export class EmailSMSNotifier {
  static async sendEmail(options) {
    return sendEmail(options);
  }
  
  static async sendWelcomeEmail(user) {
    return sendWelcomeEmail(user);
  }
  
  static async sendPasswordResetEmail(options) {
    return sendPasswordResetEmail(options);
  }
  
  static async sendOTPEmail(options) {
    return sendOTPEmail(options);
  }
  
  static async sendSMS(options) {
    return sendSMS(options);
  }
  
  static async sendOTPSMS(options) {
    return sendOTPSMS(options);
  }
  
  static async sendBulkNotification(options) {
    return sendBulkNotification(options);
  }
}