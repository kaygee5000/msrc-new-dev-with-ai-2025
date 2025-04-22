import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Img
} from '@react-email/components';

/**
 * Email template for sending one-time verification codes
 */
const OTPEmail = ({ name, code, expiryMinutes = 15 }) => {
  const previewText = `Your verification code: ${code}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`}
            alt="MSRC Ghana Logo"
            width="120"
            height="auto"
            style={styles.logo}
          />
          <Heading style={styles.heading}>Authentication Code</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            Your one-time authentication code for MSRC Ghana is:
          </Text>
          <Section style={styles.codeSection}>
            <Text style={styles.code}>{code}</Text>
          </Section>
          <Text style={styles.text}>
            This code will expire in {expiryMinutes} minutes.
          </Text>
          <Text style={styles.text}>
            If you did not request this code, please ignore this email or contact support if you believe this is suspicious activity.
          </Text>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            © {new Date().getFullYear()} MSRC Ghana. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: '0 auto',
    padding: '20px 0'
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    margin: '0 auto',
    maxWidth: '520px',
    padding: '40px'
  },
  logo: {
    margin: '0 auto 24px auto',
    display: 'block'
  },
  heading: {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '1.3',
    margin: '0 0 24px 0',
    textAlign: 'center'
  },
  text: {
    color: '#444',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '12px 0'
  },
  codeSection: {
    backgroundColor: '#f4f6f8',
    borderRadius: '6px',
    margin: '20px auto',
    padding: '12px',
    textAlign: 'center',
    width: '60%'
  },
  code: {
    color: '#1a3e6c',
    fontSize: '32px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    margin: '0'
  },
  hr: {
    borderColor: '#e6ebf1',
    margin: '30px 0'
  },
  footer: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.5',
    textAlign: 'center'
  }
};

export default OTPEmail;