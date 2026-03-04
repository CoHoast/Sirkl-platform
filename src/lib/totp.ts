import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from './db';

// Generate new TOTP secret (base32 encoded)
export function generateTOTPSecret(): string {
  // Generate 20 random bytes and encode as base32
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

// Generate QR code for authenticator app
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const totp = new OTPAuth.TOTP({
    issuer: 'DOKit Admin',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });
  
  const otpauthUri = totp.toString();
  return QRCode.toDataURL(otpauthUri);
}

// Verify TOTP code
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'DOKit Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    
    // delta returns null if invalid, or the time step difference if valid
    // window: 1 allows 1 step before/after for clock drift
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

// Generate recovery codes (10 codes)
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Hash recovery codes for storage
export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map(code => 
    crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
  );
}

// Verify recovery code
export function verifyRecoveryCode(inputCode: string, hashedCodes: string[]): { valid: boolean; index: number } {
  const normalizedInput = inputCode.replace('-', '').toUpperCase();
  const inputHash = crypto.createHash('sha256').update(normalizedInput).digest('hex');
  
  const index = hashedCodes.findIndex(hash => hash === inputHash);
  return { valid: index !== -1, index };
}

// Setup MFA for user
export async function setupMFA(userId: number): Promise<{
  secret: string;
  qrCode: string;
  recoveryCodes: string[];
}> {
  // Get user email
  const userResult = await pool.query('SELECT email FROM admin_users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const email = userResult.rows[0].email;
  const secret = generateTOTPSecret();
  const qrCode = await generateQRCode(email, secret);
  const recoveryCodes = generateRecoveryCodes();
  const hashedCodes = hashRecoveryCodes(recoveryCodes);
  
  // Save secret and recovery codes (MFA not enabled until verified)
  await pool.query(
    `UPDATE admin_users SET mfa_secret = $1, recovery_codes = $2, updated_at = NOW() WHERE id = $3`,
    [secret, hashedCodes, userId]
  );
  
  return { secret, qrCode, recoveryCodes };
}

// Verify and enable MFA
export async function verifyAndEnableMFA(userId: number, token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT mfa_secret FROM admin_users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].mfa_secret) {
    return false;
  }
  
  const isValid = verifyTOTP(token, result.rows[0].mfa_secret);
  
  if (isValid) {
    await pool.query(
      'UPDATE admin_users SET mfa_enabled = true, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }
  
  return isValid;
}

// Verify MFA token for login
export async function verifyMFAToken(userId: number, token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT mfa_secret, mfa_enabled FROM admin_users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].mfa_enabled) {
    return false;
  }
  
  return verifyTOTP(token, result.rows[0].mfa_secret);
}

// Use recovery code
export async function useRecoveryCode(userId: number, code: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT recovery_codes FROM admin_users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].recovery_codes) {
    return false;
  }
  
  const hashedCodes = result.rows[0].recovery_codes;
  const { valid, index } = verifyRecoveryCode(code, hashedCodes);
  
  if (valid) {
    // Remove used code
    const newCodes = [...hashedCodes];
    newCodes.splice(index, 1);
    
    await pool.query(
      'UPDATE admin_users SET recovery_codes = $1, updated_at = NOW() WHERE id = $2',
      [newCodes, userId]
    );
  }
  
  return valid;
}

// Get MFA status
export async function getMFAStatus(userId: number): Promise<{
  enabled: boolean;
  recoveryCodesRemaining: number;
}> {
  const result = await pool.query(
    'SELECT mfa_enabled, recovery_codes FROM admin_users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return { enabled: false, recoveryCodesRemaining: 0 };
  }
  
  return {
    enabled: result.rows[0].mfa_enabled || false,
    recoveryCodesRemaining: result.rows[0].recovery_codes?.length || 0
  };
}
