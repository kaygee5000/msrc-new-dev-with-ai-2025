import nodemailer from 'nodemailer';
import axios from 'axios';
import EmailService from './emailService';

// Configure email transport
const createTransport = () => {
  // In development, use a test SMTP service like Ethereal
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_EMAIL,
        pass: process.env.ETHEREAL_PASSWORD
      }
    });
  }
  
  // In production, use configured SMTP server
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * EmailSMSNotifier - Utility for sending emails and SMS notifications
 */
class EmailSMSNotifier {
  /**
   * Send an email using nodemailer
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} [options.text] - Plain text version of email
   * @returns {Promise<any>} - Nodemailer response
   */
  static async sendEmail({ to, subject, html, text }) {
    try {
      const transport = createTransport();

      const info = await transport.sendMail({
        from: `"mSRC Ghana" <${process.env.EMAIL_FROM || 'noreply@msrcghana.org'}>`,
        to,
        subject,
        html,
        text: text || html // Strip HTML if no text version provided
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send a welcome email to a new user
   * @param {Object} user - User object
   * @param {string} user.email - User's email address
   * @param {string} user.name - User's full name
   * @param {string} [user.tempPassword] - Temporary password for first login
   * @returns {Promise<any>} - Email sending result
   */
  static async sendWelcomeEmail(user) {
    const { email, name, tempPassword } = user;
    
    // Use EmailService to generate the email content
    const emailData = {
      email,
      name,
      password: tempPassword
    };
    
    // Get the template from EmailService
    const template = EmailService.getTemplate('WELCOME', emailData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send a password reset email
   * @param {Object} params - Parameters
   * @param {string} params.email - User's email address
   * @param {string} params.name - User's full name
   * @param {string} params.resetToken - Password reset token
   * @param {boolean} [params.isMagicLink] - Whether this is a magic link (sign in) email
   * @returns {Promise<any>} - Email sending result
   */
  static async sendPasswordResetEmail({ email, name, resetToken, isMagicLink = false }) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${isMagicLink ? 'api/auth/callback/email?token=' : 'reset-password?token='}${resetToken}`;
    
    // Use EmailService to generate the email content
    const emailData = {
      email,
      name,
      resetUrl
    };
    
    // Get the template from EmailService
    const templateName = isMagicLink ? 'MAGIC_LINK' : 'PASSWORD_RESET';
    const template = EmailService.getTemplate(templateName, emailData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send a one-time authentication code via email
   * @param {Object} params - Parameters
   * @param {string} params.email - User's email address
   * @param {string} params.name - User's full name
   * @param {string} params.code - The one-time authentication code
   * @returns {Promise<any>} - Email sending result
   */
  static async sendOTPEmail({ email, name, code }) {
    // Use EmailService to generate the email content
    const emailData = {
      email,
      name,
      code
    };
    
    // Get the template from EmailService
    const template = EmailService.getTemplate('OTP', emailData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send an SMS using Nsano SMS API
   * @param {Object} params - Parameters
   * @param {string} params.phoneNumber - Recipient phone number
   * @param {string} params.message - SMS message content
   * @param {string} [params.sender] - Sender ID (optional, defaults to MSRCGHANA)
   * @returns {Promise<any>} - Nsano API response
   */
  static async sendSMS({ phoneNumber, message, sender = 'MSRCGHANA' }) {
    try {
      // Format the phone number if needed
      const formattedNumber = phoneNumber.startsWith('+') 
        ? phoneNumber.substring(1) // Remove the '+' if present
        : phoneNumber;
      
      const response = await axios.post(
        `${process.env.NSANO_SMS_ENDPOINT}/single`,
        {
          sender,
          recipient: formattedNumber,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-SMS-Apikey': process.env.NSANO_SMS_KEY,
          },
        }
      );
      
      console.log('SMS sent:', response.data);
      return { success: true, messageId: response.data.id || response.data.requestId || 'unknown' };
    } catch (error) {
      console.error('Error sending SMS:', error.response?.data || error.message);
      throw new Error(`Failed to send SMS: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send OTP via SMS
   * @param {Object} params - Parameters
   * @param {string} params.phoneNumber - User's phone number
   * @param {string} params.name - User's name
   * @param {string} params.code - The one-time authentication code
   * @returns {Promise<any>} - SMS sending result
   */
  static async sendOTPSMS({ phoneNumber, name, code }) {
    const message = `Hello ${name}, your MSRC Ghana authentication code is: ${code}. This code will expire in 15 minutes.`;
    return this.sendSMS({ phoneNumber, message });
  }

  /**
   * Send new user credentials via SMS
   * @param {Object} params - Parameters
   * @param {string} params.phoneNumber - User's phone number
   * @param {string} params.name - User's name
   * @param {string} params.email - User's email
   * @param {string} params.password - User's temporary password
   * @returns {Promise<any>} - SMS sending result
   */
  static async sendCredentialsSMS({ phoneNumber, name, email, password }) {
    const message = `Hello ${name}, your mSRC Ghana account has been created. \n\nEmail: ${email} \nPassword: ${password}. \n\nPlease log in and change your password.`;
    return this.sendSMS({ phoneNumber, message });
  }

  /**
   * Send batch user creation email with credentials
   * @param {Object} params - Parameters
   * @param {string} params.email - User's email address
   * @param {string} params.name - User's full name
   * @param {string} params.password - User's temporary password
   * @param {string} [params.role] - User's role
   * @param {string} [params.programName] - Program name if applicable
   * @returns {Promise<any>} - Email sending result
   */
  static async sendBatchUserCreationEmail({ email, name, password, role, programName }) {
    // Use EmailService to generate the email content
    const emailData = {
      email,
      name,
      password,
      role,
      programName
    };
    
    // Get the template from EmailService
    const template = EmailService.getTemplate('BATCH_USER_CREATION', emailData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  /**
   * Send notification to multiple users
   * @param {Object} params - Parameters
   * @param {Array<Object>} params.users - Array of user objects with email and/or phone
   * @param {string} params.subject - Email subject
   * @param {string} params.message - Notification message
   * @param {boolean} [params.sendEmail=true] - Whether to send email notifications
   * @param {boolean} [params.sendSMS=false] - Whether to send SMS notifications
   * @returns {Promise<Array>} - Array of results
   */
  static async sendBulkNotification({ 
    users, 
    subject, 
    message,
    sendEmail = true,
    sendSMS = false
  }) {
    const results = [];
    
    for (const user of users) {
      try {
        // Send email if enabled and email is available
        if (sendEmail && user.email) {
          const emailData = {
            email: user.email,
            subject,
            message
          };
          const template = EmailService.getTemplate('BULK_NOTIFICATION', emailData);
          const emailResult = await this.sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          });
          
          results.push({ 
            user: user.id || user.email, 
            type: 'email', 
            success: true,
            messageId: emailResult.messageId 
          });
        }
        
        // Send SMS if enabled and phone is available
        if (sendSMS && user.phone_number) {
          const smsMessage = `mSRC Ghana: ${subject}\n\n${message}`;
          const smsResult = await this.sendSMS({ 
            phoneNumber: user.phone_number, 
            message: smsMessage 
          });
          
          results.push({ 
            user: user.id || user.phone_number, 
            type: 'sms', 
            success: true,
            messageId: smsResult.messageId 
          });
        }
      } catch (error) {
        results.push({ 
          user: user.id || user.email || user.phone_number, 
          type: 'unknown', 
          success: false,
          error: error.message 
        });
      }
    }
    
    return results;
  }
  
  /**
   * Send a test SMS to verify Nsano SMS API configuration
   * @param {string} phoneNumber - Phone number to send test SMS to
   * @returns {Promise<any>} - SMS sending result
   */
  static async sendTestSMS(phoneNumber) {
    const message = 'This is a test SMS from MSRC Ghana. If you received this, your SMS system is properly configured.';
    return this.sendSMS({ 
      phoneNumber, 
      message,
      sender: 'mSRC TEST'
    });
  }
  
  /**
   * Send a test email to verify SMTP configuration
   * @returns {Promise<any>} - Email sending result
   */
  static async sendTestEmail() {
    const emailData = {
      email: process.env.EMAIL_TEST_RECIPIENT || process.env.EMAIL_USER,
      subject: 'MSRC Ghana Email System Test',
      message: 'This is a test email to verify that your SMTP configuration is working correctly.'
    };
    const template = EmailService.getTemplate('TEST_EMAIL', emailData);
    
    return this.sendEmail({
      to: emailData.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }
}

// Legacy support - these functions are kept for backward compatibility
export const sendEmail = EmailSMSNotifier.sendEmail.bind(EmailSMSNotifier);
export const sendWelcomeEmail = EmailSMSNotifier.sendWelcomeEmail.bind(EmailSMSNotifier);
export const sendPasswordResetEmail = EmailSMSNotifier.sendPasswordResetEmail.bind(EmailSMSNotifier);
export const sendOTPEmail = EmailSMSNotifier.sendOTPEmail.bind(EmailSMSNotifier);
export const sendSMS = EmailSMSNotifier.sendSMS.bind(EmailSMSNotifier);
export const sendOTPSMS = EmailSMSNotifier.sendOTPSMS.bind(EmailSMSNotifier);
export const sendBulkNotification = EmailSMSNotifier.sendBulkNotification.bind(EmailSMSNotifier);