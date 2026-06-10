// AI-Assisted Data Cleaning functions
export function cleanName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize each word
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z\s\-']/g, '');
}

export function standardizeAddress(address: string): string {
  if (!address) return '';
  let cleaned = address.trim();
  // Common abbreviations
  cleaned = cleaned.replace(/\bSt\b/gi, 'Street');
  cleaned = cleaned.replace(/\bAve\b/gi, 'Avenue');
  cleaned = cleaned.replace(/\bRd\b/gi, 'Road');
  cleaned = cleaned.replace(/\bApt\b/gi, 'Apartment');
  cleaned = cleaned.replace(/\bSte\b/gi, 'Suite');
  return cleaned.replace(/\s+/g, ' ');
}

export function detectFakeName(name: string): boolean {
  const fakePatterns = [
    /^[A-Z]{2,4}$/,  // All caps short
    /^test/i,
    /^user/i,
    /^customer/i,
    /[0-9]/,  // Contains numbers
    /^.{1,2}$/  // Too short
  ];
  return fakePatterns.some(pattern => pattern.test(name));
}

export function suggestCorrection(record: { name: string; address: string }): { suggestedName: string; suggestedAddress: string; corrections: string[] } {
  const corrections: string[] = [];
  let suggestedName = record.name;
  let suggestedAddress = record.address;
  
  if (detectFakeName(record.name)) {
    suggestedName = cleanName(record.name);
    corrections.push(`Name corrected from "${record.name}" to "${suggestedName}"`);
  } else if (record.name && record.name !== cleanName(record.name)) {
    suggestedName = cleanName(record.name);
    corrections.push(`Capitalization fixed for name`);
  }
  
  if (record.address && record.address !== standardizeAddress(record.address)) {
    suggestedAddress = standardizeAddress(record.address);
    corrections.push(`Address standardized`);
  }
  
  return { suggestedName, suggestedAddress, corrections };
}