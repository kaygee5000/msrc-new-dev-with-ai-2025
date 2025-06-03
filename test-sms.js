// SMS Testing Script
// Run with: node test-sms.js

// Set up environment variables from .env file
require('dotenv').config();
const axios = require('axios');

// Simple logger
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  json: (obj) => console.log(JSON.stringify(obj, null, 2))
};

// SMS Service implementation (copied from smsService.js)
const SMSService = {
  // Format phone number
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    return phoneNumber.startsWith('0') 
      ? `233${phoneNumber.substring(1)}` 
      : phoneNumber;
  },
  
  // Send a raw SMS directly
  async sendRawSMS({ phoneNumber, message, sender = 'MSRCGHANA' }) {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        throw new Error('Invalid phone number');
      }
      
      log.info(`Sending SMS to ${formattedPhone}...`);
      
      // Send SMS using Nsano SMS API
      const response = await axios.post(
        `${process.env.NSANO_SMS_ENDPOINT}/single`,
        {
          sender,
          recipient: formattedPhone,
          message
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-SMS-Apikey': process.env.NSANO_SMS_KEY
          }
        }
      );
      
      return response.data;
    } catch (error) {
      log.error(`SMS sending error: ${error.message}`);
      if (error.response) {
        log.error('API Response:');
        log.json(error.response.data);
      }
      throw error;
    }
  },
  
  // Send bulk SMS messages
  async sendBulkSMS({ phoneNumbers, message, sender = 'MSRCGHANA' }) {
    try {
      if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        throw new Error('phoneNumbers must be a non-empty array');
      }
      
      // Format phone numbers
      const formattedPhones = phoneNumbers
        .map(phone => this.formatPhoneNumber(phone))
        .filter(Boolean); // Remove any null values
      
      if (formattedPhones.length === 0) {
        throw new Error('No valid phone numbers provided');
      }
      
      log.info(`Sending bulk SMS to ${formattedPhones.length} recipients...`);
      
      // Send bulk SMS using Nsano SMS API
      const response = await axios.post(
        `${process.env.NSANO_SMS_ENDPOINT}/bulk`,
        {
          sender,
          recipients: formattedPhones,
          message
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-SMS-Apikey': process.env.NSANO_SMS_KEY
          }
        }
      );
      
      return response.data;
    } catch (error) {
      log.error(`Bulk SMS sending error: ${error.message}`);
      if (error.response) {
        log.error('API Response:');
        log.json(error.response.data);
      }
      throw error;
    }
  },
  
  // Send a test SMS
  async sendTestSMS(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required for test SMS');
    }
    
    return this.sendRawSMS({
      phoneNumber,
      message: 'This is a test message from mSRC Ghana. Your SMS configuration is working correctly.',
      sender: 'mSRC TEST'
    });
  }
};

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  
  if (!command || command === 'help') {
    console.log(`
SMS Testing Tool
---------------
Usage:
  node test-sms.js single <phone> <message> [sender]  - Send a single SMS
  node test-sms.js bulk <phone1,phone2> <message> [sender] - Send bulk SMS
  node test-sms.js test <phone> - Send a test SMS
  node test-sms.js help - Show this help message

Examples:
  node test-sms.js single 0244123456 "Hello from mSRC!"
  node test-sms.js bulk 0244123456,0244789012 "Bulk message test"
  node test-sms.js test 0244123456
    `);
    return;
  }
  
  try {
    // Check environment variables
    if (!process.env.NSANO_SMS_ENDPOINT) {
      throw new Error('NSANO_SMS_ENDPOINT is not defined in .env file');
    }
    
    if (!process.env.NSANO_SMS_KEY) {
      throw new Error('NSANO_SMS_KEY is not defined in .env file');
    }
    
    log.info(`Using SMS endpoint: ${process.env.NSANO_SMS_ENDPOINT}`);
    
    if (command === 'single') {
      const phone = args[1];
      const message = args[2];
      const sender = args[3] || 'MSRCGHANA';
      
      if (!phone || !message) {
        throw new Error('Phone number and message are required');
      }
      
      const result = await SMSService.sendRawSMS({
        phoneNumber: phone,
        message,
        sender
      });
      
      log.success('SMS sent successfully!');
      log.json(result);
    } 
    else if (command === 'bulk') {
      const phones = args[1]?.split(',');
      const message = args[2];
      const sender = args[3] || 'MSRCGHANA';
      
      if (!phones || !message) {
        throw new Error('Phone numbers and message are required');
      }
      
      const result = await SMSService.sendBulkSMS({
        phoneNumbers: phones,
        message,
        sender
      });
      
      log.success('Bulk SMS sent successfully!');
      log.json(result);
    }
    else if (command === 'test') {
      const phone = args[1];
      
      if (!phone) {
        throw new Error('Phone number is required');
      }
      
      const result = await SMSService.sendTestSMS(phone);
      
      log.success('Test SMS sent successfully!');
      log.json(result);
    }
    else {
      throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    log.error(`Operation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
