export interface ValidationResult {
  isValid: boolean;
  country?: string;
  carrier?: string;
  issues: string[];
}

export function validatePhone(phone: string): ValidationResult {
  const issues: string[] = [];
  let country = 'Unknown';
  let carrier = 'Unknown';
  
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  if (!cleaned.match(/^[0-9]{7,15}$/)) {
    issues.push('Invalid phone format');
    return { isValid: false, issues, country: 'Unknown', carrier: 'Unknown' };
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    country = '🇺🇸 US/Canada';
    carrier = 'Verizon/AT&T/T-Mobile';
  } else if (cleaned.startsWith('44') && cleaned.length === 12) {
    country = '🇬🇧 United Kingdom';
    carrier = 'EE/Vodafone/O2';
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    country = '🇮🇳 India';
    carrier = 'Jio/Airtel/Vi';
  } else if (cleaned.length === 10) {
    country = '🇺🇸 US (10-digit)';
    carrier = 'Regional carrier';
  } else if (cleaned.startsWith('86') && cleaned.length === 13) {
    country = '🇨🇳 China';
    carrier = 'China Mobile/Unicom';
  } else {
    country = '🌍 International';
    carrier = 'Unknown';
  }
  
  if (cleaned.match(/(.)\1{7,}/)) {
    issues.push('Suspicious repeated digits');
  }
  
  if (cleaned.match(/^[0-9]{10}$/) && cleaned[0] === cleaned[1]) {
    issues.push('Unusual pattern detected');
  }
  
  return {
    isValid: issues.length === 0,
    country,
    carrier,
    issues
  };
}

export function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function checkDataQuality(record: { name: string; email: string; address: string }): string[] {
  const flags: string[] = [];
  if (!record.name || record.name.length < 2) flags.push('⚠️ Missing or short name');
  if (!record.address || record.address.length < 5) flags.push('📍 Missing/incomplete address');
  if (record.email && !validateEmail(record.email)) flags.push('📧 Invalid email format');
  if (record.name && record.name.length < 3 && record.name.length > 0) flags.push('📝 Suspicious short name');
  if (record.name && /^[A-Z]+$/.test(record.name) && record.name.length < 4) flags.push('🎭 Fake-looking name (all caps)');
  if (record.name && /[0-9]/.test(record.name)) flags.push('🔢 Name contains numbers');
  return flags;
}