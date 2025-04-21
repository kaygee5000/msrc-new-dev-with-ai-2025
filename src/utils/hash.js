import crypto from 'crypto';

// Hash a password (for registration/reset)
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify a password (for login/auth)
export function verifyPassword(password, stored) {
  console.log(`Stored hash: ${stored}`);
  
  const [salt, hash] = stored.split(':');
  const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}