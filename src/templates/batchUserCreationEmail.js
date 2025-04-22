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
 * Email template for batch user creation
 */
const BatchUserCreationEmail = ({ name, email, password, role, programName, loginUrl }) => {
  const previewText = 'Your MSRC Ghana Account Information';

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
          <Heading style={styles.heading}>Your MSRC Ghana Account</Heading>
          <Text style={styles.text}>Hello {name},</Text>
          <Text style={styles.text}>
            An account has been created for you on the MSRC Ghana platform for the {programName} program. 
            You have been assigned the role of <strong>{role}</strong>.
          </Text>
          
          <Section style={styles.credentialsSection}>
            <Text style={styles.credentialsLabel}>Your login credentials:</Text>
            <Text style={styles.credentials}>
              <strong>Username:</strong> {email}
            </Text>
            <Text style={styles.credentials}>
              <strong>Password:</strong> {password}
            </Text>
          </Section>
          
          <Text style={styles.securityNote}>
            Please login and change your password immediately for security purposes.
          </Text>
          
          <Section style={styles.buttonSection}>
            <Button style={styles.button} href={loginUrl}>
              Login Now
            </Button>
          </Section>
          
          <Text style={styles.instructionHeading}>Getting Started:</Text>
          <ol style={styles.instructionList}>
            <li style={styles.instructionItem}>Login with the credentials above</li>
            <li style={styles.instructionItem}>Change your password when prompted</li>
            <li style={styles.instructionItem}>Complete your profile information</li>
            <li style={styles.instructionItem}>Explore the dashboard and available features</li>
          </ol>
          
          <Text style={styles.text}>
            If you have any questions or need assistance, please contact your administrator or reply to this email.
          </Text>
          
          <Hr style={styles.hr} />
          
          <Text style={styles.footer}>
            © {new Date().getFullYear()} MSRC Ghana. All rights reserved.
          </Text>
          <Text style={styles.footerLinks}>
            <Link style={styles.link} href={`${process.env.NEXT_PUBLIC_APP_URL}/help`}>
              Help Center
            </Link>
            {' • '}
            <Link style={styles.link} href={`${process.env.NEXT_PUBLIC_APP_URL}/contact`}>
              Contact Support
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
    backgroundColor: '#f0f4f8',
    borderRadius: '6px',
    border: '1px solid #e0e7ee',
    margin: '24px 0',
    padding: '16px'
  },
  credentialsLabel: {
    color: '#333',
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
  securityNote: {
    color: '#d73a49',
    fontSize: '16px',
    fontWeight: 'medium',
    lineHeight: '1.6',
    margin: '16px 0'
  },
  buttonSection: {
    margin: '28px 0',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#1a73e8',
    borderRadius: '4px',
    color: '#fff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center'
  },
  instructionHeading: {
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold',
    lineHeight: '1.4',
    margin: '24px 0 12px'
  },
  instructionList: {
    margin: '0 0 24px',
    paddingLeft: '24px'
  },
  instructionItem: {
    color: '#444',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '8px 0'
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

export default BatchUserCreationEmail;