import { CustomerRecord } from '@/app/types';

export function calculateRiskScore(
  record: Partial<CustomerRecord>
): {
  score: number;
  level: 'trusted' | 'review' | 'high_risk';
} {

  let score = 100;

  // Phone Status Penalty

  if (record.status === 'invalid') {
    score -= 40;
  } else if (record.status === 'needs_review') {
    score -= 15;
  }

  // Duplicate Detection

  if (record.isDuplicate) {
    score -= 20;
  }

  // Quality Flags

  record.qualityFlags?.forEach(flag => {

    // Name Issues

    if (
      flag.includes('Missing customer name') ||
      flag.includes('Missing or short name')
    ) {
      score -= 20;
    }

    else if (
      flag.includes('Suspicious short name')
    ) {
      score -= 15;
    }

    else if (
      flag.includes('Fake-looking name')
    ) {
      score -= 15;
    }

    else if (
      flag.includes('Name contains numbers')
    ) {
      score -= 15;
    }

    // Email Issues

    else if (
      flag.includes('Missing email')
    ) {
      score -= 10;
    }

    else if (
      flag.includes('Invalid email')
    ) {
      score -= 10;
    }

    // Address Issues

    else if (
      flag.includes('address') ||
      flag.includes('Address')
    ) {
      score -= 15;
    }

  });

  // Keep between 0 and 100

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: 'trusted' | 'review' | 'high_risk';

  if (score >= 90) {
    level = 'trusted';
  } else if (score >= 60) {
    level = 'review';
  } else {
    level = 'high_risk';
  }

  return {
    score,
    level
  };
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'trusted':
      return 'text-green-600 bg-green-50 border-green-200';

    case 'review':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';

    case 'high_risk':
      return 'text-red-600 bg-red-50 border-red-200';

    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getRiskIcon(level: string): string {
  switch (level) {
    case 'trusted':
      return '✅';

    case 'review':
      return '⚠️';

    case 'high_risk':
      return '🔴';

    default:
      return '❓';
  }
}