/**
 * Password generation utilities for temporary passwords
 */

export type PasswordOption = 'random' | 'simple' | 'name-based' | 'pattern';

export interface PasswordGenerationOptions {
  option?: PasswordOption;
  name?: string;
  length?: number;
}

/**
 * Generates a temporary password based on the selected option
 */
export function generateTemporaryPassword(options: PasswordGenerationOptions = {}): string {
  const { option = 'random', name, length = 12 } = options;

  switch (option) {
    case 'random':
      return generateRandomPassword(length);
    case 'simple':
      return generateSimplePassword();
    case 'name-based':
      return generateNameBasedPassword(name || 'User');
    case 'pattern':
      return generatePatternPassword();
    default:
      return generateRandomPassword(length);
  }
}

/**
 * Option 1: Random secure password (recommended)
 * Generates a cryptographically secure random password
 * Example: "Kx9#mP2$vL8@"
 */
function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Ensure at least one character from each set
  let password = 
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Option 2: Simple pattern password
 * Easy to remember but still secure
 * Example: "Temp123!Pokemon"
 */
function generateSimplePassword(): string {
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `Temp${randomNum}!Pokemon`;
}

/**
 * Option 3: Name-based password
 * Uses the user's name with a random component
 * Example: "John2024!Temp"
 */
function generateNameBasedPassword(name: string): string {
  const cleanName = name.replace(/\s+/g, '').substring(0, 8);
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 100);
  return `${cleanName}${year}!${randomNum}`;
}

/**
 * Option 4: Pattern-based password
 * Follows a specific pattern
 * Example: "Poke2024!League"
 */
function generatePatternPassword(): string {
  const year = new Date().getFullYear();
  const randomWord = ['Poke', 'League', 'Trainer', 'Battle'][Math.floor(Math.random() * 4)];
  const randomNum = Math.floor(Math.random() * 100);
  return `${randomWord}${year}!${randomNum}`;
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}


