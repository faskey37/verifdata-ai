export interface ValidationResult {
  isValid: boolean;
  country?: string;
  carrier?: string;
  issues: string[];
}

export interface CustomerRecord {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface RiskResult {
  score: number;
  status: 'Verified' | 'Review' | 'Invalid';
  reasons: string[];
}

/* ---------------------------------------
   PHONE VALIDATION
--------------------------------------- */

export function validatePhone(phone: string): ValidationResult {
  const issues: string[] = [];

  let country = 'Unknown';
  let carrier = 'Unknown';

  const cleaned = phone.replace(/[\s\-()+]/g, '');

  // Invalid format
  if (!/^\d{7,15}$/.test(cleaned)) {
    return {
      isValid: false,
      country: 'Unknown',
      carrier: 'Unknown',
      issues: ['Invalid phone format']
    };
  }

  // Country Detection

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    country = '🇮🇳 India';
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    country = '🇺🇸 US/Canada';
  } else if (cleaned.startsWith('44') && cleaned.length === 12) {
    country = '🇬🇧 United Kingdom';
  } else if (cleaned.startsWith('86') && cleaned.length === 13) {
    country = '🇨🇳 China';
  } else if (cleaned.length === 10) {
    country = '🌍 Standard 10-digit';
  } else {
    country = '🌍 International';
  }

  // Carrier cannot be determined reliably
  carrier = 'Unknown';

  // Suspicious patterns

  if (/(.)\1{7,}/.test(cleaned)) {
    issues.push('Suspicious repeated digits');
  }

  if (/123456|654321|111111|222222/.test(cleaned)) {
    issues.push('Common fake number pattern');
  }

  return {
    isValid: true,
    country,
    carrier,
    issues
  };
}

/* ---------------------------------------
   EMAIL VALIDATION
--------------------------------------- */

export function validateEmail(email: string): boolean {
  if (!email) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------------------------------------
   DATA QUALITY CHECKS
--------------------------------------- */

export function checkDataQuality(
  record: CustomerRecord
): string[] {
  const flags: string[] = [];

  const suspiciousNames = [
    'test',
    'test user',
    'admin',
    'unknown',
    'asdfgh',
    'qwerty',
    'aaaaaa'
  ];

  // Name

  if (!record.name || record.name.trim().length === 0) {
    flags.push('Missing customer name');
  }

  else if (record.name.trim().length < 3) {
    flags.push('Suspicious short name');
  }

  else if (
    suspiciousNames.includes(
      record.name.toLowerCase().trim()
    )
  ) {
    flags.push('Fake-looking name');
  }

  if (/\d/.test(record.name)) {
    flags.push('Name contains numbers');
  }

  // Email

  if (!record.email) {
    flags.push('Missing email');
  }

  else if (!validateEmail(record.email)) {
    flags.push('Invalid email format');
  }

  // Address

  if (!record.address || record.address.trim().length < 8) {
    flags.push('Missing/incomplete address');
  }

  return flags;
}

/* ---------------------------------------
   DUPLICATE DETECTION
--------------------------------------- */

export function isDuplicate(
  phone: string,
  existingPhones: Set<string>
): boolean {
  return existingPhones.has(phone);
}

/* ---------------------------------------
   RISK SCORING
--------------------------------------- */

export function calculateRisk(
  record: CustomerRecord,
  duplicate = false
): RiskResult {

  const phoneResult = validatePhone(record.phone);
  const qualityFlags = checkDataQuality(record);

  let score = 100;

  const reasons: string[] = [];

  // Phone

  if (!phoneResult.isValid) {
    score -= 40;
    reasons.push('Invalid phone');
  }

  // Email

  if (!validateEmail(record.email)) {
    score -= 15;
    reasons.push('Invalid email');
  }

  // Quality flags

  qualityFlags.forEach(flag => {
    score -= 10;
    reasons.push(flag);
  });

  // Duplicate

  if (duplicate) {
    score -= 20;
    reasons.push('Duplicate record');
  }

  // Suspicious phone

  phoneResult.issues.forEach(issue => {
    score -= 5;
    reasons.push(issue);
  });

  score = Math.max(0, score);

  let status: 'Verified' | 'Review' | 'Invalid';

  if (!phoneResult.isValid) {
    status = 'Invalid';
  }
  else if (score >= 90) {
    status = 'Verified';
  }
  else if (score >= 60) {
    status = 'Review';
  }
  else {
    status = 'Invalid';
  }

  return {
    score,
    status,
    reasons
  };
}