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
  Img,
  Link
} from '@react-email/components';

/**
 * Welcome email template for new users
 */
const WelcomeEmail = ({ name, tempPassword, loginUrl }) => {
  const previewText = 'Welcome to MSRC Ghana - Your Account Information';

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
          <Heading style={styles.heading}>Welcome to MSRC Ghana!</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            Your account for the MSRC Ghana platform has been created successfully. You can now log in to access the system.
          </Text>
          
          {tempPassword && (
            <>
              <Section style={styles.credentialsSection}>
                <Text style={styles.credentialsLabel}>Your account details:</Text>
                <Text style={styles.credentials}>
                  <strong>Username:</strong> Your email address
                </Text>
                <Text style={styles.credentials}>
                  <strong>Temporary Password:</strong> {tempPassword}
                </Text>
              </Section>
              <Text style={styles.text}>
                For security reasons, you'll be required to change your password after your first login.
              </Text>
            </>
          )}
          
          <Section style={styles.buttonSection}>
            <Button style={styles.button} href={loginUrl}>
              Login to Your Account
            </Button>
          </Section>
          
          <Text style={styles.text}>
            If you have any questions or need assistance, please contact your administrator or reply to this email.
          </Text>
          
          <Hr style={styles.hr} />
          
          <Text style={styles.footer}>
            © {new Date().getFullYear()} MSRC Ghana. All rights reserved.
          </Text>
          <Text style={styles.footerLinks}>
            <Link style={styles.link} href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy-policy`}>
              Privacy Policy
            </Link>
            {' • '}
            <Link style={styles.link} href={`${process.env.NEXT_PUBLIC_APP_URL}/terms`}>
              Terms of Service
            </Link>
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
  credentialsSection: {
    backgroundColor: '#f4f6f8',
    borderRadius: '6px',
    margin: '20px 0',
    padding: '16px'
  },
  credentialsLabel: {
    color: '#555',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },
  credentials: {
    color: '#444',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '8px 0'
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
  hr: {
    borderColor: '#e6ebf1',
    margin: '30px 0'
  },
  footer: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.5',
    textAlign: 'center'
  },
  footerLinks: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.5',
    textAlign: 'center',
    margin: '8px 0 0 0'
  },
  link: {
    color: '#1a73e8',
    textDecoration: 'underline'
  }
};

export default WelcomeEmail;