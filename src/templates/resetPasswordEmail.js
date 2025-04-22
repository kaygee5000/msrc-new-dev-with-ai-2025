import React from 'react';
import {
  Body,
  Button,
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
 * Password reset email template
 */
const ResetPasswordEmail = ({ name, resetUrl, expiryTime }) => {
  const previewText = 'Reset your MSRC Ghana password';

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
          <Heading style={styles.heading}>Password Reset</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            We received a request to reset your password for your MSRC Ghana account. If you did not make this request, you can safely ignore this email.
          </Text>
          <Text style={styles.text}>
            To reset your password, click the button below:
          </Text>
          
          <Section style={styles.buttonSection}>
            <Button style={styles.button} href={resetUrl}>
              Reset Your Password
            </Button>
          </Section>
          
          <Text style={styles.text}>
            The link is valid for {expiryTime} and can only be used once.
          </Text>
          
          <Text style={styles.text}>
            If the button above doesn't work, copy and paste the following URL into your browser:
          </Text>
          
          <Text style={styles.linkText}>
            {resetUrl}
          </Text>
          
          <Text style={styles.text}>
            If you did not request a password reset, please contact your administrator immediately.
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
  buttonSection: {
    margin: '32px 0',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#1a73e8',
    borderRadius: '4px',
    color: '#fff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 20px',
    textDecoration: 'none',
    textAlign: 'center'
  },
  linkText: {
    backgroundColor: '#f4f6f8',
    borderRadius: '4px',
    color: '#444',
    fontSize: '14px',
    lineHeight: '1.4',
    margin: '12px 0',
    padding: '12px',
    wordBreak: 'break-all'
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

export default ResetPasswordEmail;