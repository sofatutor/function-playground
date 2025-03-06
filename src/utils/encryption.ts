/**
 * Encryption utilities for sensitive data
 */

// Use a non-human readable key name for storage
const STORAGE_KEY_NAME = '_gp_e2k_9d7f3';
const SALT_KEY_NAME = '_gp_s4lt_k';

// Generate or retrieve a secure encryption key
const getEncryptionKey = (): string => {
  let encryptionKey = localStorage.getItem(STORAGE_KEY_NAME);
  
  if (!encryptionKey) {
    // Generate a random 32-character key if none exists
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    encryptionKey = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem(STORAGE_KEY_NAME, encryptionKey);
  }
  
  return encryptionKey;
};

// Generate or retrieve a secure salt
const getSalt = (): Uint8Array => {
  let saltString = localStorage.getItem(SALT_KEY_NAME);
  
  if (!saltString) {
    // Generate a random salt if none exists
    const randomSalt = new Uint8Array(16);
    crypto.getRandomValues(randomSalt);
    saltString = Array.from(randomSalt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem(SALT_KEY_NAME, saltString);
  }
  
  // Convert hex string back to Uint8Array
  const salt = new Uint8Array(saltString.length / 2);
  for (let i = 0; i < saltString.length; i += 2) {
    salt[i / 2] = parseInt(saltString.substring(i, i + 2), 16);
  }
  
  return salt;
};

/**
 * Encrypts sensitive data using AES-GCM algorithm with Web Crypto API
 * @param text The text to encrypt
 * @returns Promise with the encrypted data as a string
 */
export const encryptData = async (text: string): Promise<string> => {
  try {
    // Create a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Convert the encryption key to a CryptoKey
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(getEncryptionKey()),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive a key for AES-GCM with a random salt
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: getSalt(),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt the data
    const encodedText = new TextEncoder().encode(text);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );
    
    // Combine the IV and encrypted data and convert to Base64
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...result));
  } catch (e) {
    console.error('Failed to encrypt data', e);
    return '';
  }
};

/**
 * Decrypts data that was encrypted with encryptData
 * @param encryptedText The encrypted text to decrypt
 * @returns Promise with the decrypted text
 */
export const decryptData = async (encryptedText: string): Promise<string> => {
  try {
    // Convert the Base64 string back to a Uint8Array
    const encryptedData = new Uint8Array(
      atob(encryptedText)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    // Extract the IV and encrypted data
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);
    
    // Convert the encryption key to a CryptoKey
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(getEncryptionKey()),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive a key for AES-GCM with a random salt
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: getSalt(),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (e) {
    console.error('Failed to decrypt data', e);
    return '';
  }
}; 