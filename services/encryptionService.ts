// ---
//
// **WARNING: MOCK ENCRYPTION & HASHING FOR DEMONSTRATION PURPOSES ONLY**
//
// ---
//
// **PII Encryption (DNI, Address, Notes):**
// This service simulates PII encryption by adding a prefix.
// In a real-world application, this entire logic MUST reside on the backend,
// using a robust, standard cryptographic library (e.g., AES-256-GCM).
// Storing sensitive data like DNI or addresses in localStorage,
// even if "encrypted" with a weak client-side method, is NOT secure
// and does not comply with data protection laws.
//
// ---
//
// **Password Hashing (User Passwords):**
// The `hashPassword` and `comparePassword` functions simulate a one-way
// hashing algorithm like bcrypt or Argon2. Hashing is NOT encryption; it cannot
// be reversed. This is the correct approach for password storage.
// The actual hashing process must occur on the server.
//
// ---

const ENCRYPTION_PREFIX = 'encrypted_';
const HASH_SALT = 'mock_salt_for_demo'; // In a real app, each user gets a unique, securely generated salt.

export const encrypt = (data: string): string => {
  if (!data) return '';
  // Real app: Use AES-256-GCM with a server-managed key.
  return `${ENCRYPTION_PREFIX}${btoa(data)}`;
};

export const decrypt = (encryptedData: string): string => {
  if (!encryptedData || !encryptedData.startsWith(ENCRYPTION_PREFIX)) return encryptedData;
  // Real app: This would be the corresponding server-side decryption function.
  try {
    return atob(encryptedData.substring(ENCRYPTION_PREFIX.length));
  } catch (e) {
    console.error("Decryption failed", e);
    return "Error de descifrado";
  }
};

// --- Password Hashing Simulation ---

export const hashPassword = (password: string): string => {
  if (!password) return '';
  // SIMULATION: This mimics a salted hash.
  // REAL-WORLD: Use `bcrypt.hash(password, saltRounds)` on the server.
  return `hashed_${btoa(HASH_SALT + password)}`;
};

export const comparePassword = (password: string, hash: string): boolean => {
  if (!password || !hash) return false;
  // SIMULATION: Re-hash the provided password and compare.
  // REAL-WORLD: Use `bcrypt.compare(password, hash)` on the server.
  const newHash = hashPassword(password);
  return newHash === hash;
};