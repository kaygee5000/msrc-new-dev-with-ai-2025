import nodemailer from 'nodemailer';
import axios from 'axios';
import { render } from '@react-email/render';
import welcomeEmail from '@/templates/welcomeEmail';
import resetPasswordEmail from '@/templates/resetPasswordEmail';
import OTPEmail from '@/templates/otpEmail';
import batchUserCreationEmail from '@/templates/batchUserCreationEmail';

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
export class EmailSMSNotifier {
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

      // Ensure html is a string
      if (typeof html !== 'string') {
        try {
          html = String(html);
        } catch {
          html = '';
        }
      }

      // // Only call replace if html is a string
      // const cleanText = typeof html === 'string'
      //   ? html.replace(/<[^>]*>/g, '')
      //   : '';

      const info = await transport.sendMail({
        from: `"MSRC Ghana" <${process.env.EMAIL_FROM || 'noreply@msrcghana.org'}>`,
        to,
        subject,
        html,
        text: text || html // Strip HTML if no text version provided
      });

      console.log('Email sent: %s', info.messageId);
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
    
    const htmlContent = render(welcomeEmail({
      name,
      tempPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    }));
    
    return this.sendEmail({
      to: email,
      subject: 'Welcome to MSRC Ghana',
      html: htmlContent
    });
  }

  /**
   * Send a password reset email
   * @param {Object} params - Parameters
   * @param {string} params.email - User's email address
   * @param {string} params.name - User's full name
   * @param {string} params.resetToken - Password reset token
   * @returns {Promise<any>} - Email sending result
   */
  static async sendPasswordResetEmail({ email, name, resetToken }) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    const htmlContent = render(resetPasswordEmail({
      name,
      resetUrl,
      expiryTime: '1 hour'
    }));
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your MSRC Ghana Password',
      html: htmlContent
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
    const htmlContent = render(<OTPEmail
      name={name}
      code={code}
      expiryMinutes={15}
    />);
    
    return this.sendEmail({
      to: email,
      subject: 'Your MSRC Ghana Authentication Code',
      html: htmlContent
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
    const message = `Hello ${name}, your MSRC Ghana account has been created. Email: ${email} Password: ${password}. Please log in and change your password.`;
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
    const htmlContent = render(batchUserCreationEmail({
      name,
      email,
      password,
      role: role || 'Data Collector',
      programName: programName || 'MSRC Ghana',
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
    }));
    
    return this.sendEmail({
      to: email,
      subject: 'Your MSRC Ghana Account Information',
      html: htmlContent
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
          const htmlContent = `
            <div>
              <h1>${subject}</h1>
              <p>Hello ${user.name || 'User'},</p>
              <div>${message}</div>
            </div>
          `;
          
          const emailResult = await this.sendEmail({
            to: user.email,
            subject,
            html: htmlContent
          });
          
          results.push({ 
            user: user.id || user.email, 
            type: 'email', 
            success: true,
            messageId: emailResult.messageId 
          });
        }
        
        // Send SMS if enabled and phone is available
        if (sendSMS && user.phoneNumber) {
          const smsMessage = `MSRC Ghana: ${subject}\n\n${message}`;
          const smsResult = await this.sendSMS({ 
            phoneNumber: user.phoneNumber, 
            message: smsMessage 
          });
          
          results.push({ 
            user: user.id || user.phoneNumber, 
            type: 'sms', 
            success: true,
            messageId: smsResult.messageId 
          });
        }
      } catch (error) {
        results.push({ 
          user: user.id || user.email || user.phoneNumber, 
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
      sender: 'MSRCTEST'
    });
  }
  
  /**
   * Send a test email to verify SMTP configuration
   * @returns {Promise<any>} - Email sending result
   */
  static async sendTestEmail() {
    const htmlContent = `
      <div>
        <h1>MSRC Ghana Email System Test</h1>
        <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
        <p>If you received this email, your email system is properly configured.</p>
        <p>Configuration details:</p>
        <ul>
          <li>Host: ${process.env.EMAIL_HOST || 'Not configured'}</li>
          <li>Port: ${process.env.EMAIL_PORT || '587'}</li>
          <li>Sender: ${process.env.EMAIL_FROM || 'noreply@msrcghana.org'}</li>
          <li>Secure: ${process.env.EMAIL_SECURE === 'true' ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    `;
    
    return this.sendEmail({
      to: process.env.EMAIL_TEST_RECIPIENT || process.env.EMAIL_USER,
      subject: 'MSRC Ghana Email System Test',
      html: htmlContent
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