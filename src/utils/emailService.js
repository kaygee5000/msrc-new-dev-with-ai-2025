/**
 * Email Service for consistent email handling across the application
 */

import * as nodemailer from 'nodemailer';

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
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email templates with default subjects
const EMAIL_TEMPLATES = {
  PASSWORD_RESET: {
    subject: 'Reset Your mSRC Password',
    generateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hello ${data.name},</p>
        <p>We received a request to reset your password for your mSRC account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>For security reasons, this link will expire in 1 hour.</p>
        <p>Best regards,<br>The mSRC Team</p>
      </div>
    `,
    generateText: (data) => `
      Reset Your Password
      
      Hello ${data.name},
      
      We received a request to reset your password for your mSRC account.
      
      To reset your password, please visit this link:
      ${data.resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, you can safely ignore this email.
      
      Best regards,
      The mSRC Team
    `
  },
  
  MAGIC_LINK: {
    subject: 'Your mSRC Login Link',
    generateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Login to mSRC</h2>
        <p>Hello ${data.name},</p>
        <p>Click the button below to log in to your mSRC account. This link will expire in 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.magicLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Log In
          </a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The mSRC Team</p>
      </div>
    `,
    generateText: (data) => `
      Login to mSRC
      
      Hello ${data.name},
      
      To log in to your mSRC account, please visit this link:
      ${data.magicLink}
      
      This link will expire in 10 minutes.
      
      If you didn't request this, you can safely ignore this email.
      
      Best regards,
      The mSRC Team
    `
  },
  
  OTP: {
    subject: 'Your mSRC Verification Code',
    generateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Verification Code</h2>
        <p>Hello ${data.name},</p>
        <p>Your verification code for mSRC is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
            ${data.code}
          </div>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>The mSRC Team</p>
      </div>
    `,
    generateText: (data) => `
      Your Verification Code
      
      Hello ${data.name},
      
      Your verification code for mSRC is: ${data.code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email.
      
      Best regards,
      The mSRC Team
    `
  },
  
  WELCOME: {
    subject: 'Welcome to mSRC',
    generateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to mSRC</h2>
        <p>Hello ${data.name},</p>
        <p>Thank you for joining mSRC. Your account has been created successfully.</p>
        ${data.password ? `
        <p>Your login credentials are:</p>
        <ul>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Password:</strong> ${data.password}</li>
        </ul>
        <p>We recommend changing your password after your first login.</p>
        ` : ''}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Log In
          </a>
        </div>
        <p>Best regards,<br>The mSRC Team</p>
      </div>
    `,
    generateText: (data) => `
      Welcome to mSRC
      
      Hello ${data.name},
      
      Thank you for joining mSRC. Your account has been created successfully.
      ${data.password ? `
      Your login credentials are:
      Email: ${data.email}
      Password: ${data.password}
      
      We recommend changing your password after your first login.
      ` : ''}
      
      You can log in at: ${process.env.NEXT_PUBLIC_APP_URL}/login
      
      Best regards,
      The mSRC Team
    `
  },
  
  BATCH_USER_CREATION: {
    subject: 'Your mSRC Account Information',
    generateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to mSRC</h2>
        <p>Hello ${data.name},</p>
        <p>Your mSRC account has been created as part of a batch user creation process.</p>
        <p>Your account details:</p>
        <ul>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Password:</strong> ${data.password}</li>
          ${data.role ? `<li><strong>Role:</strong> ${data.role}</li>` : ''}
          ${data.programName ? `<li><strong>Program:</strong> ${data.programName}</li>` : ''}
        </ul>
        <p>We recommend changing your password after your first login.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Log In
          </a>
        </div>
        <p>Best regards,<br>The mSRC Team</p>
      </div>
    `,
    generateText: (data) => `
      Welcome to mSRC
      
      Hello ${data.name},
      
      Your mSRC account has been created as part of a batch user creation process.
      
      Your account details:
      Email: ${data.email}
      Password: ${data.password}
      ${data.role ? `Role: ${data.role}` : ''}
      ${data.programName ? `Program: ${data.programName}` : ''}
      
      We recommend changing your password after your first login.
      
      You can log in at: ${process.env.NEXT_PUBLIC_APP_URL}/login
      
      Best regards,
      The mSRC Team
    `
  },
  
  TEST_EMAIL: {
    subject: 'MSRC Ghana Email System Test',
    generateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>MSRC Ghana Email System Test</h2>
        <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
        <p>If you received this email, your email system is properly configured.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      </div>
    `,
    generateText: (data) => `
      MSRC Ghana Email System Test
      
      This is a test email to verify that your SMTP configuration is working correctly.
      If you received this email, your email system is properly configured.
      Time sent: ${new Date().toISOString()}
    `
  },
  
  CUSTOM: {
    subject: 'Notification from MSRC Ghana',
    generateHtml: (data) => data.customHtml || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Notification from MSRC Ghana</h2>
        <p>Hello ${data.name || ''},</p>
        <p>${data.message || 'This is a notification from MSRC Ghana.'}</p>
      </div>
    `,
    generateText: (data) => data.customText || `
      Notification from MSRC Ghana
      
      Hello ${data.name || ''},
      
      ${data.message || 'This is a notification from MSRC Ghana.'}
    `
  }
};

/**
 * EmailService for sending emails with consistent templates
 */
class EmailService {
  /**
   * Get a template with rendered content
   * @param {string} templateName - Template name from EMAIL_TEMPLATES
   * @param {Object} data - Data for the template
   * @param {Object} options - Additional options
   * @returns {Object} - Template with rendered content
   */
  static getTemplate(templateName, data, options = {}) {
    const template = EMAIL_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Invalid email template: ${templateName}`);
    }
    
    return {
      subject: options.subject || template.subject,
      html: options.customHtml || template.generateHtml(data),
      text: options.customText || template.generateText(data)
    };
  }

  /**
   * Send an email using a template
   * @param {string} templateName - Template name from EMAIL_TEMPLATES
   * @param {Object} data - Data for the template
   * @param {string} data.email - Recipient email
   * @param {string} data.name - Recipient name
   * @param {Object} options - Additional options
   * @param {string} options.subject - Custom subject (optional)
   * @param {string} options.customHtml - Custom HTML content (optional)
   * @param {string} options.customText - Custom text content (optional)
   * @returns {Promise<Object>} - Email send result
   */
  static async sendEmail(templateName, data, options = {}) {
    const template = EMAIL_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Invalid email template: ${templateName}`);
    }
    
    if (!data.email) {
      throw new Error('Recipient email is required');
    }
    
    const transport = createTransport();
    
    const html = options.customHtml || template.generateHtml(data);
    const text = options.customText || template.generateText(data);
    
    return await transport.sendMail({
      to: data.email,
      subject: options.subject || template.subject,
      text: text,
      html: html,
      from: process.env.EMAIL_FROM || 'noreply@msrcghana.org'
    });
  }
  
  /**
   * Send a password reset email
   * @param {Object} data - Email data
   * @param {string} data.email - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.resetUrl - Password reset URL
   * @returns {Promise<Object>} - Email send result
   */
  static async sendPasswordResetEmail(data) {
    return await this.sendEmail('PASSWORD_RESET', data);
  }
  
  /**
   * Send a magic link email
   * @param {Object} data - Email data
   * @param {string} data.email - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.magicLink - Magic link URL
   * @returns {Promise<Object>} - Email send result
   */
  static async sendMagicLinkEmail(data) {
    return await this.sendEmail('MAGIC_LINK', data);
  }
  
  /**
   * Send an OTP email
   * @param {Object} data - Email data
   * @param {string} data.email - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.code - OTP code
   * @returns {Promise<Object>} - Email send result
   */
  static async sendOTPEmail(data) {
    return await this.sendEmail('OTP', data);
  }
  
  /**
   * Send a welcome email
   * @param {Object} data - Email data
   * @param {string} data.email - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.password - Generated password (optional)
   * @returns {Promise<Object>} - Email send result
   */
  static async sendWelcomeEmail(data) {
    return await this.sendEmail('WELCOME', data);
  }
  
  /**
   * Send a batch user creation email
   * @param {Object} data - Email data
   * @param {string} data.email - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.password - Generated password
   * @param {string} data.role - User role (optional)
   * @param {string} data.programName - Program name (optional)
   * @returns {Promise<Object>} - Email send result
   */
  static async sendBatchUserCreationEmail(data) {
    return await this.sendEmail('BATCH_USER_CREATION', data);
  }
}

export default EmailService;
